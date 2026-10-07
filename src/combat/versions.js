import {parseWorkbookXml} from './workbook-xml.js';
// Two workbook presentations share one set of game values and one version snapshot.
const TableVersions=(()=>{
 const authorFolder='내 작업용 데이터 테이블',unityFolder='유니티 임포트용 데이터 테이블';
 const authorFile='야차차_마스터테이블_작업용.xlsm',unityFile='야차차_마스터테이블_Unity.xlsx';
 const metaPath='customXml/yachaVersion.xml';
 const copy=x=>structuredClone(x), sheet=(d,n)=>d.sheets.find(s=>s.name===n);
 const nil=v=>v===null||v===undefined||v==='';
 const escXml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const bool=v=>{if(nil(v))return false;if([true,'TRUE','켜기',1].includes(v))return true;if([false,'FALSE','끄기',0].includes(v))return false;throw Error(`참/거짓 값 확인: ${v}`);};
 let schema,authorBook,unityBook,authorBase,unityBase,initialAuthor,initialUnity,baseSnapshot,parentVersion=null,knownDrafts=new Set();
 function keysFor(s){const t=schema.tables.find(t=>t.label===s.name);return t?t.key.split(' (')[0].split(' + '):s.name==='작성 안내'?['Group','Topic']:['Tag'];}
 const rowKey=(s,r)=>JSON.stringify(keysFor(s).map(k=>r[k]??null));
 function rowLabel(s,r){return keysFor(s).map(k=>`${k}=${r[k]??'(빈칸)'}`).join(', ');}
 function definition(s,k){return schema.tables.find(t=>t.label===s.name)?.columns.find(c=>c.name===k);}
 function normalized(s,k,v){const t=definition(s,k)?.type;if(t==='bool')return bool(v);if(nil(v))return null;if(typeof v==='string'){v=v.trim().replace(/\r\n/g,'\n');if(['Tiles','TilePath'].includes(k))v=v.split(',').map(v=>v.trim()).join(',');}if(t==='string')return String(v);return v;}
 function snapshot(data){return {sheets:data.sheets.map(s=>({name:s.name,keys:s.keys,rows:s.rows.map(r=>Object.fromEntries(s.keys.map(k=>[k,normalized(s,k,r[k])])))}))};}
 function draftKeys(d){const s=sheet(d,'몬스터 페이즈');return new Set(s.rows.filter(r=>['MaxHP','GaugeMax','AttackSpeed'].some(k=>nil(r[k]))).map(r=>rowKey(s,r)));}
 async function findMeta(z){const found=[];for(const p of Object.keys(z.files).filter(p=>/^customXml\/[^/]+\.xml$/.test(p))){const t=await z.file(p).async('string');if(!t.includes('urn:yachacha:table-version'))continue;const root=parseWorkbookXml(t,p).documentElement;if(root.localName==='version'&&(root.getAttribute('xmlns')==='urn:yachacha:table-version'||root.namespaceURI==='urn:yachacha:table-version'))found.push(p);}if(found.length>1)throw Error('버전 정보가 중복되어 있습니다.');return found[0]||null;}
 async function readMeta(bytes){const z=await JSZip.loadAsync(bytes),p=await findMeta(z);if(!p)return null;const d=parseWorkbookXml(await z.file(p).async('string'),p);const meta=JSON.parse(d.documentElement.textContent);if(meta.format!==1||!meta.snapshot?.sheets)throw Error('버전 정보 형식을 확인하세요.');return meta;}
 async function stampBook(bytes,meta){const z=await JSZip.loadAsync(bytes),part=await findMeta(z)||metaPath;z.file(part,`<?xml version="1.0" encoding="UTF-8"?><version xmlns="urn:yachacha:table-version">${escXml(JSON.stringify(meta))}</version>`);
  const path='xl/_rels/workbook.xml.rels',d=parseWorkbookXml(await z.file(path).async('string'),path);if(![...d.getElementsByTagNameNS('*','Relationship')].some(e=>['../'+part,'/'+part].includes(e.getAttribute('Target')))){const r=d.createElementNS('http://schemas.openxmlformats.org/package/2006/relationships','Relationship');const ids=new Set([...d.getElementsByTagNameNS('*','Relationship')].map(e=>e.getAttribute('Id')));let id='rIdYachaVersion';while(ids.has(id))id+='X';r.setAttribute('Id',id);r.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml');r.setAttribute('Target','../'+part);d.documentElement.appendChild(r);z.file(path,new XMLSerializer().serializeToString(d));}
  const cp='[Content_Types].xml',cd=parseWorkbookXml(await z.file(cp).async('string'),cp);let ov=[...cd.getElementsByTagNameNS('*','Override')].find(e=>e.getAttribute('PartName')==='/'+part);if(!ov){ov=cd.createElementNS('http://schemas.openxmlformats.org/package/2006/content-types','Override');ov.setAttribute('PartName','/'+part);cd.documentElement.appendChild(ov);}ov.setAttribute('ContentType','application/xml');z.file(cp,new XMLSerializer().serializeToString(cd));
  return z.generateAsync({type:'uint8array',compression:'DEFLATE'});
 }
 async function init(a,u,s){schema=s;initialAuthor=a;initialUnity=u;authorBook=OfflineBook.create();unityBook=OfflineBook.create();authorBase=await authorBook.load(a,authorFile);unityBase=await unityBook.load(u,unityFile);const m=await readMeta(a);baseSnapshot=m?.snapshot||snapshot(authorBase);parentVersion=m?.version||null;knownDrafts=draftKeys(authorBase);}
 // Loading either representation refreshes the authoring values. A stored snapshot remains the diff base,
 // so edits made in Excel before import are not lost from the change log.
 async function adopt(bytes,input){
  const m=await readMeta(bytes);
  if(input.layout==='legacy'){
   if(!input.macro)throw Error('버전 저장은 매크로가 있는 작업용 XLSM 또는 Unity용 XLSX를 사용하세요.');
   authorBase=await authorBook.load(bytes,authorFile);knownDrafts=draftKeys(authorBase);
  }else{
   unityBase=await unityBook.load(bytes,unityFile);
   if(m?.snapshot){for(const s of authorBase.sheets){const prev=sheet(m.snapshot,s.name);if(prev)s.rows=restoreAuthorRows(s,prev.rows);}knownDrafts=draftKeys(authorBase);}
  }
  if(m){baseSnapshot=m.snapshot;parentVersion=m.version;}
 }
 function restoreAuthorRows(s,list){const existing=new Map(s.rows.map(r=>[rowKey(s,r),r]));return list.map(r=>{const old=existing.get(rowKey(s,r));return Object.fromEntries([...s.keys.map(k=>{let v=r[k]??null;if(definition(s,k)?.type==='bool'){if(nil(old?.[k])&&!bool(v))v=null;else v=typeof old?.[k]==='boolean'?bool(v):(bool(v)?'켜기':'끄기');}if(s.name==='공통 규칙'&&k==='Value'&&typeof v==='string'&&/^-?\d+(\.\d+)?$/.test(v))v=Number(v);return [k,v];}),['__source',old?.__source??null]]);});}
 function authorFrom(input){const a=copy(authorBase);
  for(const target of a.sheets){const src=sheet(input,target.name);if(!src)throw Error(`${target.name} 시트가 없는 구형 파일입니다. 현재 마스터 파일을 불러오세요.`);if(JSON.stringify(src.keys)!==JSON.stringify(target.keys))throw Error(`${target.name}: 컬럼 구성이 달라 버전을 만들 수 없습니다.`);
   if(input.layout==='legacy'){target.rows=copy(src.rows);continue;}
   if(target.name==='작성 안내')continue; // Import documentation has a different layout; do not replace authoring help.
   const preserved=target.name==='몬스터 페이즈'?target.rows.filter(r=>knownDrafts.has(rowKey(target,r))&&!src.rows.some(v=>rowKey(target,v)===rowKey(target,r))):[];
   target.rows=[...restoreAuthorRows(target,src.rows),...preserved];
  }
  OfflineBook.refreshNames(a);return a;
 }
 function unityFrom(a){const u=copy(unityBase),drafts=[];
  for(const target of u.sheets){const src=sheet(a,target.name);if(!src)throw Error(`${target.name} 시트가 없습니다.`);if(target.name==='작성 안내')continue;
   target.rows=src.rows.filter(r=>{if(target.name==='몬스터 페이즈'&&knownDrafts.has(rowKey(src,r))&&['MaxHP','GaugeMax','AttackSpeed'].some(k=>nil(r[k]))){drafts.push(copy(r));return false;}return true;}).map(r=>{
    const old=sheet(unityBase,target.name).rows.find(o=>rowKey(target,o)===rowKey(target,r));return Object.fromEntries([...target.keys.map(k=>[k,normalized(target,k,r[k])]),['__source',old?.__source??null]]);
   });
  }
  const guide=sheet(u,'작성 안내'),phase=sheet(a,'몬스터 페이즈');
  guide.rows=guide.rows.filter(r=>r.Group!=='보류한 원본 데이터'&&!String(r.Group).startsWith('작업 안내 / '));
  for(const r of sheet(a,'작성 안내').rows)guide.rows.push({...r,Group:'작업 안내 / '+r.Group,__source:null});
  for(const r of drafts)guide.rows.push({Group:'보류한 원본 데이터',Topic:`MonsterPhase ${r.MonsterID}/${r.PhaseID}`,Description:phase.keys.map(k=>`${k}=${r[k]??'(빈칸)'}`).join('; ')});
  const note=guide.rows.find(r=>r.Topic==='미입력 데이터 보관');if(note)note.Description=`미입력 페이즈 ${drafts.length}행은 작업용 XLSM과 아래 원본 데이터에 보관합니다. 값이 확정되면 다음 버전의 MonsterPhase에 자동으로 포함됩니다.`;
  for(const r of sheet(u,'공통 규칙').rows)if(typeof r.Value==='string'&&/^-?\d+(\.\d+)?$/.test(r.Value))r.Value=Number(r.Value);
  OfflineBook.refreshNames(u);return {u,drafts};
 }
 function diff(before,after){const changes=[];
  for(const s of after.sheets){const prev=sheet(before,s.name),old=new Map((prev?.rows||[]).map(r=>[rowKey(s,r),r])),now=new Map(s.rows.map(r=>[rowKey(s,r),r]));
   // Documentation allows repeated sections; game-table keys are checked separately.
   for(const [id,r] of now){const b=old.get(id);for(const k of s.keys){const x=b?normalized(s,k,b[k]):null,y=normalized(s,k,r[k]);if(!b||JSON.stringify(x)!==JSON.stringify(y))changes.push({sheet:s.name,record:rowLabel(s,r),column:k,before:b?x:'(행 없음)',after:y,kind:b?'수정':'추가'});}}
   for(const [id,r] of old)if(!now.has(id))for(const k of s.keys)changes.push({sheet:s.name,record:rowLabel(s,r),column:k,before:normalized(s,k,r[k]),after:'(행 삭제)',kind:'삭제'});
  }return changes;
 }
 function assertKeys(d){for(const t of schema.tables){const s=sheet(d,t.label),seen=new Set();for(const r of s.rows){const id=rowKey(s,r);if(keysFor(s).some(k=>nil(r[k])))throw Error(`${s.name}: ID가 비어 있습니다.`);if(seen.has(id))throw Error(`${s.name}: 중복 키 ${rowLabel(s,r)}`);seen.add(id);}}}
 function checkPair(a,u,drafts){for(const t of schema.tables){const sa=sheet(a,t.label),su=sheet(u,t.label),skip=new Set(drafts.map(r=>rowKey(sheet(a,'몬스터 페이즈'),r)));const aa=sa.rows.filter(r=>!(t.label==='몬스터 페이즈'&&skip.has(rowKey(sa,r))));if(aa.length!==su.rows.length)throw Error(`${t.label}: 두 파일의 행 수가 다릅니다.`);for(let i=0;i<aa.length;i++)for(const k of sa.keys)if(JSON.stringify(normalized(sa,k,aa[i][k]))!==JSON.stringify(normalized(su,k,su.rows[i][k])))throw Error(`${t.label} ${k}: 두 파일 값이 다릅니다.`);}}
 function stamp(date=new Date()){const base=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date).replace(' ','_').replaceAll(':','-');if(parentVersion===base)return base+'_02';if(parentVersion?.startsWith(base+'_'))return base+'_'+String((Number(parentVersion.slice(base.length+1))||1)+1).padStart(2,'0');return base;}
 const fmt=v=>v===null?'(빈칸)':typeof v==='string'?JSON.stringify(v):String(v);
 function logText({version,intent,changes,drafts,parent}){
  const game=changes.filter(x=>!['작성 안내','문자 효과 규칙'].includes(x.sheet)),docs=changes.filter(x=>['작성 안내','문자 효과 규칙'].includes(x.sheet));
  const text=[`변경 의도: ${intent}`,`수정 내용: 데이터 값 ${game.length}건, 설명 ${docs.length}건을 두 엑셀에 반영하고 같은 버전으로 저장했습니다.`,game.length?'':'전투 수치와 대사 값의 변경은 없습니다.',`버전: ${version} (한국 시간)`,`이전 버전: ${parent||'최초 등록 / 기존 원본 비교'}`,`작업용: ${authorFolder}/${authorFile}`,`Unity용: ${unityFolder}/${unityFile}`,'','형식 안내','작업용: 한글 시트명, 1행 설명, 2행 한글 제목, 3행 영문 변수명, 기존 매크로·메모·서식 유지.','Unity용: 영문 시트명, 1행 영문 변수명, 2행부터 데이터, TRUE/FALSE 논리값, 매크로 없음.','두 파일의 확정된 게임 데이터는 같습니다. 표시 형식의 변환은 값 변경으로 세지 않습니다.','Guide와 TextEffectGuide는 Unity 임포트 대상에서 제외합니다. 선택 숫자의 빈칸은 null로 읽습니다.',`미완성 페이즈 ${drafts.length}행은 작업용과 Unity Guide에 보관하며 실행 데이터에서 제외합니다.`,'','수정된 데이터 (시트 / 행 키 / 컬럼 / 이전 → 이후)'];
  for(const c of game)text.push(`[${c.kind}] ${c.sheet} | ${c.record} | ${c.column}: ${fmt(c.before)} → ${fmt(c.after)}`);
  if(!game.length)text.push('없음');
  if(docs.length){text.push('','설명 변경');for(const c of docs)text.push(`[${c.kind}] ${c.sheet} | ${c.record} | ${c.column}: ${fmt(c.before)} → ${fmt(c.after)}`);}
  text.push('','미완성 데이터');for(const r of drafts)text.push(`몬스터 페이즈 | MonsterID=${r.MonsterID}, PhaseID=${r.PhaseID} | MaxHP=${fmt(r.MaxHP)}, GaugeMax=${fmt(r.GaugeMax)}, AttackSpeed=${fmt(r.AttackSpeed)}`);
  text.push('','다음 작업','이 버전의 작업용 XLSM을 수정하고 저장한 뒤 시뮬레이터에서 불러오세요.','변경 의도를 적고 버전 저장을 누르면 다음 시간 폴더에 두 파일과 이력이 함께 생성됩니다.','Unity용 XLSX를 불러와 조정해도 작업용 XLSM으로 역반영됩니다.','한 버전에서는 둘 중 한 파일을 기준으로 수정하세요. 서로 다른 파일을 동시에 수정한 내용은 자동 병합하지 않습니다.','엑셀에서 Ctrl+S만 누르면 현재 파일만 저장됩니다. 두 파일 동기화는 시뮬레이터의 버전 저장으로 완료합니다.');
  return '\uFEFF'+text.filter(x=>x!==undefined).join('\r\n')+'\r\n';
 }
 async function prepare(input,intent,version=stamp()){
  if(!intent?.trim())throw Error('변경 의도를 적어 주세요. 예: 취객이 술에서 깨는 느낌을 주려고 후반 공격을 빠르게 조정.');
  const a=authorFrom(input),{u,drafts}=unityFrom(a);assertKeys(a);assertKeys(u);const check=validate(u);if(check.errors.length)throw Error('저장 전 데이터를 확인하세요:\n'+check.errors.join('\n'));
  checkPair(a,u,drafts);const changes=diff(baseSnapshot,snapshot(a)),meta={format:1,version,parentVersion,intent:intent.trim(),snapshot:snapshot(a),drafts:drafts.map(r=>({MonsterID:r.MonsterID,PhaseID:r.PhaseID}))};
  const aBytes=await stampBook(await authorBook.save(a),meta),uBytes=await stampBook(await unityBook.save(u),meta);
  // Reload both outputs before delivering, checking the serialized data as well as the in-memory projection.
  const ar=await OfflineBook.create().load(aBytes,authorFile),ur=await OfflineBook.create().load(uBytes,unityFile);checkPair(ar,ur,drafts);
  const log=logText({version,intent:intent.trim(),changes,drafts,parent:parentVersion});
  const manifest=JSON.stringify({format:1,version,parentVersion,intent:intent.trim(),author:`${authorFolder}/${authorFile}`,unity:`${unityFolder}/${unityFile}`,draftCount:drafts.length,changes},null,2);
  return {version,files:[{path:`${authorFolder}/${authorFile}`,bytes:aBytes},{path:`${unityFolder}/${unityFile}`,bytes:uBytes},{path:'변경 이력.txt',bytes:log},{path:'버전 정보.json',bytes:manifest}],meta,changes,a,u};
 }
 async function commit(result){authorBase=await authorBook.load(result.files[0].bytes,authorFile);unityBase=await unityBook.load(result.files[1].bytes,unityFile);baseSnapshot=result.meta.snapshot;parentVersion=result.version;knownDrafts=draftKeys(authorBase);}
 async function zip(result){const z=new JSZip();for(const f of result.files)z.file(result.version+'/'+f.path,f.bytes);z.file(result.version+'/저장 완료.txt','\uFEFF'+result.version+' — 작업용·Unity용·변경 이력을 포함한 버전 ZIP 생성 완료\r\n');return z.generateAsync({type:'uint8array',compression:'DEFLATE'});}
 async function uniqueVersion(root,base=stamp()){let v=base,n=1;for(;;){try{await root.getDirectoryHandle(v);v=base+'_'+String(++n).padStart(2,'0');}catch(e){if(e.name==='NotFoundError')return v;throw e;}}}
 async function writeDirectory(root,result){
  try{await root.getDirectoryHandle(result.version);throw Error('같은 버전 폴더가 이미 있어요. 다시 저장하면 새 이름으로 만듭니다.');}catch(e){if(e.name!=='NotFoundError')throw e;}
  const dir=await root.getDirectoryHandle(result.version,{create:true});
  // A completion marker is only written after every member of the pair has closed successfully.
  for(const f of result.files){const parts=f.path.split('/');let d=dir;for(const p of parts.slice(0,-1))d=await d.getDirectoryHandle(p,{create:true});const handle=await d.getFileHandle(parts.at(-1),{create:true});const w=await handle.createWritable();try{await w.write(f.bytes);await w.close();}catch(e){try{await w.abort();}catch{}throw Error(`버전 저장이 완료되지 않았습니다 (${f.path}). 다시 저장하세요. ${e.message}`);}}
  const handle=await dir.getFileHandle('저장 완료.txt',{create:true}),w=await handle.createWritable();await w.write('\uFEFF'+result.version+' — 작업용·Unity용·변경 이력 저장 완료\r\n');await w.close();return dir;
 }
 return {init,adopt,prepare,commit,zip,uniqueVersion,writeDirectory,readMeta,stamp,diff,snapshot,authorFolder,unityFolder,authorFile,unityFile,get version(){return parentVersion;}};
})();
