// Workshop guests have no Unity monster contract yet. Keep their salon dialogue
// in project JSON while the existing workbook editor handles established guests.
const workshopRows=(data,name)=>data.sheets.find(s=>s.name===name)?.rows||[];
const workshopIDs=project=>new Set(project.guests.filter(g=>g.previewOnly===true||g.workbookExcluded===true).map(g=>g.id));
const workshopLinkKey=row=>row.MonsterID+'/'+row.Stage;
const workshopGroupIDs=links=>new Set(links.flatMap(r=>[r.RequestGroupID,r.DetailGroupID]).filter(Number.isInteger));
function workshopValue(value,ignored=new Set()){
 if(Array.isArray(value))return value.map(v=>workshopValue(v,ignored));
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).filter(k=>k!=='__source'&&!ignored.has(k)).sort().map(k=>[k,workshopValue(value[k],ignored)]));
 return value;
}
function workshopGroupContent(data,id){
 const group=workshopRows(data,'대화 그룹').find(r=>r.GroupID===id);
 const lines=workshopRows(data,'대사').filter(r=>r.GroupID===id).sort((a,b)=>a.Order-b.Order);
 return JSON.stringify(workshopValue({group,lines},new Set(['GroupID','DialogueID'])));
}
export function combatForWorkbook(project){
 const data=structuredClone(project.combat),ids=workshopIDs(project);
 const links=data.sheets.find(s=>s.name==='미용 대사 연결');if(!links||!ids.size)return data;
 const removed=links.rows.filter(r=>ids.has(r.MonsterID)),candidates=workshopGroupIDs(removed),retained=new Set();
 for(const guest of project.guests.filter(g=>ids.has(g.id)))for(const id of Object.values(guest.bindings||{}))candidates.add(id);
 links.rows=links.rows.filter(r=>!ids.has(r.MonsterID));
 // Any reference outside the removed links makes the group shared. Guest event
 // bindings are also external references, including possible future workshop events.
 for(const guest of project.guests.filter(g=>!ids.has(g.id)))for(const id of Object.values(guest.bindings||{}))retained.add(id);
 for(const sheet of data.sheets){
  if(sheet.name==='대사'||sheet.name==='대화 그룹')continue;
  for(const row of sheet.rows)for(const [key,value] of Object.entries(row))if(key.endsWith('GroupID'))retained.add(value);
 }
 const exclusive=new Set([...candidates].filter(id=>!retained.has(id)));
 for(const name of ['대화 그룹','대사']){const sheet=data.sheets.find(s=>s.name===name);if(sheet)sheet.rows=sheet.rows.filter(r=>!exclusive.has(r.GroupID));}
 return data;
}
export function mergeWorkshopDialogues(project,newCombat){
 const data=structuredClone(newCombat),ids=workshopIDs(project);
 const sourceLinks=workshopRows(project.combat,'미용 대사 연결').filter(r=>ids.has(r.MonsterID));
 if(!sourceLinks.length)return data;
 for(const name of ['미용 대사 연결','대화 그룹','대사'])if(!data.sheets.some(s=>s.name===name)){
  const source=project.combat.sheets.find(s=>s.name===name);
  if(!source)throw Error('미용 시험 대사 보관용 시트가 없습니다: '+name);
  data.sheets.push({...structuredClone(source),rows:[]});
 }
 const links=workshopRows(data,'미용 대사 연결'),groups=workshopRows(data,'대화 그룹'),lines=workshopRows(data,'대사');
 const sourceGroups=workshopRows(project.combat,'대화 그룹'),sourceLines=workshopRows(project.combat,'대사');
 const usedGroups=new Set(groups.map(r=>r.GroupID)),usedLines=new Set(lines.map(r=>r.DialogueID)),remap=new Map();
 let nextGroup=Math.max(80000,...usedGroups,...sourceGroups.map(r=>r.GroupID))+1;
 let nextLine=Math.max(900000,...usedLines,...sourceLines.map(r=>r.DialogueID))+1;
 // An incoming project-style snapshot may already contain these links. Identical
 // content is safe; conflicting workshop imports require a deliberate JSON choice.
 const missing=[];
 for(const link of sourceLinks){
  const present=links.find(r=>workshopLinkKey(r)===workshopLinkKey(link));
  if(!present){missing.push(link);continue;}
  if(['RequestGroupID','DetailGroupID'].some(key=>workshopGroupContent(data,present[key])!==workshopGroupContent(project.combat,link[key])))throw Error('미용 시험 대사 연결이 충돌합니다. 프로젝트 JSON에서 사용할 작업본을 선택해 주세요: '+workshopLinkKey(link));
 }
 for(const oldID of workshopGroupIDs(missing)){
  const source=sourceGroups.find(r=>r.GroupID===oldID);if(!source)throw Error('보관할 미용 시험 대화 그룹이 없습니다: '+oldID);
  if(usedGroups.has(oldID)&&workshopGroupContent(data,oldID)===workshopGroupContent(project.combat,oldID)){remap.set(oldID,oldID);continue;}
  const newID=usedGroups.has(oldID)?nextGroup++:oldID;remap.set(oldID,newID);usedGroups.add(newID);
  groups.push({...structuredClone(source),GroupID:newID});
  for(const line of sourceLines.filter(r=>r.GroupID===oldID)){
   const id=usedLines.has(line.DialogueID)?nextLine++:line.DialogueID;usedLines.add(id);
   lines.push({...structuredClone(line),GroupID:newID,DialogueID:id});
  }
 }
 for(const link of missing)links.push({...structuredClone(link),RequestGroupID:remap.get(link.RequestGroupID),DetailGroupID:remap.get(link.DetailGroupID)});
 // Story-only prototype event bindings also stay in JSON. Do not silently remap
 // their IDs: the caller's guest bindings must continue to reference the same group.
 for(const guest of project.guests.filter(g=>ids.has(g.id)))for(const id of Object.values(guest.bindings||{})){
  if(groups.some(g=>g.GroupID===id)){
   if(workshopGroupContent(data,id)!==workshopGroupContent(project.combat,id))throw Error('임시 손님 대화 ID가 충돌합니다. 프로젝트 JSON에서 확인해 주세요: '+id);
   continue;
  }
  groups.push(structuredClone(sourceGroups.find(g=>g.GroupID===id)));
  for(const line of sourceLines.filter(l=>l.GroupID===id)){
   if(usedLines.has(line.DialogueID))throw Error('임시 손님 문장 ID가 충돌합니다: '+line.DialogueID);
   lines.push(structuredClone(line));usedLines.add(line.DialogueID);
  }
 }
 return data;
}
