// Beauty requests share the existing Dialogue/DialogueGroup tables with other dialogue.
export const SALON_DIALOGUE_STAGES=['cut','draw','attach'];
export const SALON_DIALOGUE_KEYS=['MonsterID','Stage','RequestGroupID','DetailGroupID'];
const salonRows=(p,n)=>p.combat.sheets.find(s=>s.name===n)?.rows||[];
export function salonDialogueLink(p,id,stage){return salonRows(p,'미용 대사 연결').find(r=>r.MonsterID===id&&r.Stage===stage);}
export function salonDialogueGroup(p,id,stage,detail=false){
 const link=salonDialogueLink(p,id,stage),gid=link?.[detail?'DetailGroupID':'RequestGroupID'];
 const group=salonRows(p,'대화 그룹').find(r=>r.GroupID===gid);
 const lines=salonRows(p,'대사').filter(r=>r.GroupID===gid&&String(r.Text??'').trim()).sort((a,b)=>a.Order-b.Order);
 if(!group||!lines.length)throw Error(`미용 대사 연결 확인: ${id} / ${stage} / ${detail?'자세한 부탁':'처음 부탁'}`);
 return {link,group,lines};
}
export function salonDialogueText(p,id,stage,detail=false){return salonDialogueGroup(p,id,stage,detail).lines.map(l=>l.Text).join('\n');}
export function salonRequestAtEnd(player){return !!player?.active&&player.complete&&player.active.index===player.active.lines.length-1;}
export function salonDialogueProblems(p){
 const errors=[],sheet=p.combat.sheets.find(s=>s.name==='미용 대사 연결');
 if(!sheet)return ['미용 대사 연결 시트가 없습니다. 최신 엑셀을 불러오세요.'];
 if(JSON.stringify(sheet.keys)!==JSON.stringify(SALON_DIALOGUE_KEYS))errors.push('미용 대사 연결 컬럼 확인');
 const seen=new Set();
 for(const r of sheet.rows){
  const key=r.MonsterID+'/'+r.Stage;
  if(seen.has(key))errors.push('미용 대사 연결 중복: '+key);seen.add(key);
  if(!p.guests.some(g=>g.id===r.MonsterID)||!SALON_DIALOGUE_STAGES.includes(r.Stage))errors.push('미용 대사 손님·단계 확인: '+key);
  for(const detail of [false,true]){
   const gid=r[detail?'DetailGroupID':'RequestGroupID'];
   if(!Number.isInteger(gid)||gid<=0)errors.push('미용 대사 그룹 ID 확인: '+key);
   try{const {group}=salonDialogueGroup(p,r.MonsterID,r.Stage,detail);if(group.PlaybackMode!=='순서대로'||group.AdvanceMode!=='입력')errors.push('미용 요구 그룹은 순서대로 / 입력으로 설정하세요: '+gid);}catch(e){errors.push(e.message);}
  }
 }
 for(const g of p.guests.filter(g=>g.beauty?.enabled))for(const stage of SALON_DIALOGUE_STAGES)if(g.beauty.steps[stage]&&!seen.has(g.id+'/'+stage))errors.push(g.name+' '+stage+' 미용 대사 연결 누락');
 return errors;
}
// One-time compatibility for exported projects from before the table existed.
// Never regenerate a present table: imported Excel links and text are authoritative.
export function migrateSalonDialogues(p){
 if(!p?.combat?.sheets||!Array.isArray(p.guests))return p;
 if(p.combat.sheets.some(s=>s.name==='미용 대사 연결')){clearLegacySalonText(p);return p;}
 const groups=salonRows(p,'대화 그룹'),lines=salonRows(p,'대사');
 if(!groups.length||!lines.length)return p;
 const links={name:'미용 대사 연결',excelName:'미용 대사 연결',headerRow:3,description:'손님·미용 단계마다 처음 부탁과 네? 선택 후 자세한 부탁의 대화 그룹을 연결합니다.',keys:SALON_DIALOGUE_KEYS.slice(),labels:['손님 ID','미용 단계','처음 부탁 그룹 ID','자세한 부탁 그룹 ID'],notes:{Stage:'cut=형태 만들기,draw=색·무늬 꾸미기,attach=장식 붙이기'},fieldTypes:{MonsterID:'int',Stage:'string',RequestGroupID:'int',DetailGroupID:'int'},formulaKeys:[],rows:[]};
 const add=(name,text,gid)=>{
  let group=groups.find(g=>g.GroupID===gid);
  if(!group){gid=Math.max(80000,...groups.map(g=>g.GroupID))+1;group={GroupID:gid,PlaybackMode:'순서대로',PauseCombat:true,AdvanceMode:'입력',CPS:30,HoldMs:1400,GapMs:100,Notes:'미용 선택지 대사',ActorEffect:'없음',FinishEffect:'없음'};groups.push(group);}
  group.Name=name;group.PlaybackMode='순서대로';group.AdvanceMode='입력';group.Notes='미용 대사 연결에서 선택하는 부탁';
  const old=lines.filter(l=>l.GroupID===gid).sort((a,b)=>a.Order-b.Order);
  if(old.length===1){old[0].Text=text;old[0].Speaker='몬스터';old[0].Order=1;old[0].Notes='미용 요구 · 선택지 연결';}
  else if(!old.length)lines.push({DialogueID:Math.max(900000,...lines.map(l=>l.DialogueID))+1,GroupID:gid,Order:1,Speaker:'몬스터',Text:text,Notes:'미용 선택지 대사'});
  // Multi-line legacy groups remain intact unless their explicit beauty text supersedes them.
  else {const first=old[0];first.Text=text;first.Speaker='몬스터';first.Order=1;for(const line of old.slice(1))lines.splice(lines.indexOf(line),1);}
  return gid;
 };
 for(const g of p.guests.filter(g=>g.beauty?.enabled))for(const stage of SALON_DIALOGUE_STAGES){
  const label={cut:'형태 만들기',draw:'색·무늬 꾸미기',attach:'장식 붙이기'}[stage],b=g.beauty;
  const initial=b[stage==='cut'?'request':stage+'Hint']||salonRows(p,'대사').filter(l=>l.GroupID===g.bindings?.[stage]).map(l=>l.Text).join('\n');
  const detail=b.requestDetails?.[stage]||initial;
  const requestID=add(g.name+' · '+label+' · 처음 부탁',initial,g.bindings?.[stage]);
  const detailID=add(g.name+' · '+label+' · 자세한 부탁',detail,g.id===10001&&stage==='cut'?80003:undefined);
  links.rows.push({MonsterID:g.id,Stage:stage,RequestGroupID:requestID,DetailGroupID:detailID});
 }
 p.combat.sheets.push(links);
 clearLegacySalonText(p);
 return p;
}
function clearLegacySalonText(p){for(const g of p.guests.filter(g=>g.beauty?.enabled)){for(const k of ['request','drawHint','attachHint','requestDetails'])delete g.beauty[k];for(const stage of SALON_DIALOGUE_STAGES)if(g.bindings)delete g.bindings[stage];}}
