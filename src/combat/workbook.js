// Only edited worksheet XML is changed; VBA, notes, styles and metadata stay in the source ZIP.
function createOfflineBook(){
 const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const parse=s=>{const d=new DOMParser().parseFromString(s,'application/xml');if(d.getElementsByTagName('parsererror').length)throw Error('엑셀 XML을 읽을 수 없습니다.');return d;};
 const all=(d,n)=>[...d.getElementsByTagNameNS('*',n)],direct=(d,n)=>[...d.children].filter(e=>e.localName===n),xml=d=>new XMLSerializer().serializeToString(d);
 const element=(doc,name)=>{const rootName=doc.documentElement.nodeName,prefix=rootName.includes(':')?rootName.split(':')[0]+':':'';return doc.createElementNS(NS,prefix+name);};
 const normalize=p=>{const a=[];for(const s of p.split('/')){if(s==='..')a.pop();else if(s&&s!=='.')a.push(s);}return a.join('/');};
 const resolve=(base,t)=>t.startsWith('/')?t.slice(1):normalize(base.slice(0,base.lastIndexOf('/')+1)+t);
 const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
 const colNum=r=>{let n=0;for(const c of r.replace(/[0-9$]/g,''))n=n*26+c.charCodeAt(0)-64;return n-1;};
 const required={'공격 만들기':['PatternID','RangeMode','ShapePoolID','TilePath','HitMin','HitMax','ResponseMs','CanDefend','BreakTiles'],'이동·연출':['PatternID','MoveType','Effect','PushDirection'],'몬스터 사용 패턴':['MonsterID','PhaseID','PatternID','HitDamage','Weight','Enabled'],'몬스터 페이즈':['MonsterID','PhaseID','MaxHP','RecoveryMs','AttackSpeed','PlayerDodgeMissCount'],'범위 풀':['ShapePoolID','Candidate','SelectMode','Tiles','Weight'],'플레이어':['MaxHP','DodgeDamage','GuardMax'],'공통 규칙':['RuleID','Value']};
 const aliases={AttackPattern:'공격 만들기',PatternPresentation:'이동·연출',MonsterPattern:'몬스터 사용 패턴',MonsterPhase:'몬스터 페이즈',ShapePool:'범위 풀',PlayerStatus:'플레이어',CombatRule:'공통 규칙',Guide:'작성 안내',Dialogue:'대사',DialogueGroup:'대화 그룹',CombatDialogue:'전투 대사 연결',TextEffectGuide:'문자 효과 규칙'};
 let current;
 async function load(bytes,name='야차차_마스터테이블.xlsm'){
  const zip=await JSZip.loadAsync(bytes);if(!zip.file('xl/workbook.xml'))throw Error('xlsx 또는 xlsm 파일을 선택하세요.');
  const wb=parse(await zip.file('xl/workbook.xml').async('string')),rels=parse(await zip.file('xl/_rels/workbook.xml.rels').async('string'));
  const relmap=new Map(all(rels,'Relationship').map(e=>[e.getAttribute('Id'),resolve('xl/workbook.xml',e.getAttribute('Target'))]));
  let strings=[];if(zip.file('xl/sharedStrings.xml'))strings=all(parse(await zip.file('xl/sharedStrings.xml').async('string')),'si').map(si=>all(si,'t').map(t=>t.textContent).join(''));
  const tables={},sheets=[];
  const value=c=>{const t=c.getAttribute('t'),v=all(c,'v')[0]?.textContent;if(t==='s')return strings[Number(v)]??'';if(t==='inlineStr')return all(c,'t').map(t=>t.textContent).join('');if(t==='b')return v==='1';if(v==null)return null;if(t==='str'||t==='e')return v;return v!==''&&Number.isFinite(Number(v))?Number(v):v;};
  for(const s of all(wb,'sheet')){
   const excelName=s.getAttribute('name'),sn=aliases[excelName]||excelName,path=relmap.get(s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'));if(!path||!zip.file(path))continue;
   const doc=parse(await zip.file(path).async('string')),matrix=[],formulas={},formulaKeys=new Set();
   for(const r of all(doc,'row')){const line=[],rn=+r.getAttribute('r');for(const c of direct(r,'c')){const cn=colNum(c.getAttribute('r'));line[cn]=value(c);const f=direct(c,'f')[0];if(f){formulas[`${rn}:${cn}`]=f.textContent;}}matrix[rn-1]=line;}
   const headerRow=aliases[excelName]?1:3,start=headerRow+1;if(!matrix[headerRow-1]?.[0])continue;const keys=[...matrix[headerRow-1]];while(keys.length&&keys.at(-1)==null)keys.pop();if(keys.some(k=>typeof k!=='string'||!k))throw Error(`${excelName}: ${headerRow}행의 영문 컬럼 이름을 확인하세요.`);
   const records=[];matrix.slice(headerRow).forEach((r,i)=>{if(!r||!keys.some((k,j)=>r[j]!=null||formulas[`${i+start}:${j}`]!=null))return;const row=Object.fromEntries(keys.map((k,j)=>[k,r[j]??null]));row.__source=i+start;records.push(row);keys.forEach((k,j)=>{if(formulas[`${i+start}:${j}`]!=null)formulaKeys.add(k);});});
   const notes={};const relpath=path.slice(0,path.lastIndexOf('/')+1)+'_rels/'+path.split('/').at(-1)+'.rels';let tablePaths=[];
   if(zip.file(relpath)){const rs=parse(await zip.file(relpath).async('string'));for(const rel of all(rs,'Relationship')){const type=rel.getAttribute('Type'),rp=resolve(path,rel.getAttribute('Target'));if(type.endsWith('/table'))tablePaths.push(rp);if(/comments|threadedComment/i.test(type)&&zip.file(rp)){const cd=parse(await zip.file(rp).async('string'));for(const c of [...all(cd,'comment'),...all(cd,'threadedComment')]){const ref=c.getAttribute('ref');if(!(headerRow===1?/^[A-Z]+1$/.test(ref):/[23]$/.test(ref)))continue;let t=all(c,'text').map(e=>e.textContent).join('\n');t=t.split('Comment:\n    ').at(-1).split('댓글:\n    ').at(-1);if(t)notes[keys[colNum(ref)]]=t;}}}}
   const fieldTypes=Object.fromEntries(keys.map(k=>[k,(notes[k]?.match(/자료형: ([^\n]+)/)?.[1]||'').trim()]));
   const spec={name:sn,excelName,headerRow,description:headerRow===1?'1행 영문 컬럼명 · 2행부터 데이터. 설명은 헤더 메모와 Guide를 확인하세요.':matrix[0]?.[0]??'',keys,labels:keys.map((k,i)=>headerRow===1?(notes[k]?.match(/한글명: ([^\n]+)/)?.[1]||k):(matrix[1]?.[i]??k)),notes,fieldTypes,formulaKeys:[...formulaKeys],rows:records};
   if(headerRow===1){let blank=false;for(const r of matrix.slice(1)){const has=r&&keys.some((k,j)=>r[j]!=null);if(has&&blank)throw Error(`${excelName}: 데이터 중간에 빈 행이 있습니다.`);if(!has)blank=true;}validateFields(spec);}
   // Numeric common-rule values are edited as numbers in the simulator; the export contract stores Value as string.
   if(sn==='공통 규칙')for(const r of records)if(typeof r.Value==='string'&&/^-?\d+(\.\d+)?$/.test(r.Value))r.Value=Number(r.Value);
   sheets.push(spec);tables[sn]={path,doc,matrix,formulas,tablePaths,headerRow,excelName};
  }
  for(const[n,ks]of Object.entries(required)){const s=sheets.find(s=>s.name===n);if(!s)throw Error(`새 테이블의 '${n}' 시트가 없습니다. 최종 야차 테이블을 선택하세요.`);for(const k of ks)if(!s.keys.includes(k))throw Error(`${n}: ${k} 컬럼이 없습니다.`);}
  const data={version:4,layout:sheets.some(s=>s.headerRow===1)?'unity':'legacy',sourceName:name,macro:!!zip.file('xl/vbaProject.bin'),sheets};refreshNames(data);
  current={zip,tables,data:structuredClone(data)};return structuredClone(data);
 }
 function validateFields(spec){for(const r of spec.rows)for(const k of spec.keys){const type=spec.fieldTypes?.[k]||'',v=r[k],nil=empty(v);if(!type||type==='string')continue;if(nil){if(type.endsWith('?'))continue;throw Error(`${spec.excelName} ${r.__source||''}행 ${k}: 필수 값이 비어 있습니다.`);}if(type==='bool'){if(v==='TRUE'||v==='FALSE'){r[k]=v==='TRUE';continue;}if(typeof v!=='boolean')throw Error(`${spec.excelName} ${k}: TRUE/FALSE 논리값으로 입력하세요.`);}else if(typeof v!=='number'||!Number.isFinite(v)||(type.startsWith('int')&&!Number.isInteger(v)))throw Error(`${spec.excelName} ${k}: 단위 없는 ${type.startsWith('int')?'정수':'숫자'}를 입력하세요.`);}}
 function refreshNames(d){const p=rows(d,'공격 만들기'),m=rows(d,'몬스터 페이즈');for(const sn of ['이동·연출','몬스터 사용 패턴']){const s=d.sheets.find(x=>x.name===sn);for(const r of s?.rows||[]){if(s.formulaKeys.includes('PatternName'))r.PatternName=p.find(p=>same(p.PatternID,r.PatternID))?.Name??(empty(r.PatternID)?null:'ID 확인');if(s.formulaKeys.includes('Name'))r.Name=m.find(m=>same(m.MonsterID,r.MonsterID))?.Name??(empty(r.MonsterID)?null:'ID 확인');}}}
 function autoFormula(d,s,k,rn){let target,lookup,out;
  if(k==='PatternName'&&['이동·연출','몬스터 사용 패턴'].includes(s.name)){target='공격 만들기';lookup='PatternID';out='Name';}
  if(k==='Name'&&s.name==='몬스터 사용 패턴'){target='몬스터 페이즈';lookup='MonsterID';out='Name';}
  if(!target)return null;const t=d.sheets.find(x=>x.name===target),header=t.headerRow||3,start=header+1,excelName=t.excelName||target,end=Math.max(203,t.rows.length+header),id=col(s.keys.indexOf(lookup))+rn,a=`'${excelName}'!$${col(t.keys.indexOf(lookup))}$${start}:$${col(t.keys.indexOf(lookup))}$${end}`,b=`'${excelName}'!$${col(t.keys.indexOf(out))}$${start}:$${col(t.keys.indexOf(out))}$${end}`;
  return `IF(${id}="","",IF(COUNTIF(${a},${id})=0,"ID 확인",INDEX(${b},MATCH(${id},${a},0))))`;
 }
 async function save(data){if(!current)throw Error('먼저 엑셀을 불러오세요.');refreshNames(data);const zip=await JSZip.loadAsync(await current.zip.generateAsync({type:'uint8array'}));
  for(const spec of data.sheets){const base=current.tables[spec.name],original=current.data.sheets.find(s=>s.name===spec.name);if(!base||JSON.stringify(spec.keys)!==JSON.stringify(original.keys))throw Error('원본과 컬럼 구조가 다릅니다.');
   const header=base.headerRow||3,start=header+1;if(header===1)validateFields(spec);
   // Rebuild calculated name columns to update their caches and extend lookup ranges when necessary.
   if(JSON.stringify(spec.rows)===JSON.stringify(original.rows)&&!spec.formulaKeys.length)continue;
   const doc=parse(xml(base.doc)),sd=all(doc,'sheetData')[0],existing=direct(sd,'row').filter(r=>+r.getAttribute('r')>=start),templates=new Map(existing.map(r=>[+r.getAttribute('r'),r.cloneNode(true)]));for(const r of existing)r.remove();
   spec.rows.forEach((record,i)=>{const rn=i+start,source=record.__source,tmpl=templates.get(source)||existing[i%2]||existing.at(-1),r=tmpl?tmpl.cloneNode(true):element(doc,'row');r.setAttribute('r',rn);r.removeAttribute('hidden');const oldCells=new Map(direct(r,'c').map(c=>[colNum(c.getAttribute('r')),c.cloneNode(true)]));for(const c of direct(r,'c'))c.remove();
    spec.keys.forEach((k,j)=>{let v=record[k]??null;if(header===1&&spec.fieldTypes?.[k]==='string'&&v!=null)v=String(v).trim();if(header===1&&['TilePath','Tiles'].includes(k)&&v!=null)v=String(v).split(',').map(x=>x.trim()).join(',');const c=oldCells.get(j)||element(doc,'c');c.setAttribute('r',col(j)+rn);while(c.firstChild)c.removeChild(c.firstChild);c.removeAttribute('t');let f=autoFormula(data,spec,k,rn);
     if(!f&&base.formulas[`${source}:${j}`]){f=base.formulas[`${source}:${j}`];if(rn!==source)f=f.replace(/(\$?[A-Z]{1,3})(\$?)(\d+)/g,(all,c,fix,n)=>fix?all:c+(+n+rn-source));}
     if(f){const el=element(doc,'f');el.textContent=f;c.appendChild(el);if(typeof v==='string')c.setAttribute('t','str');else if(typeof v==='boolean')c.setAttribute('t','b');if(v!=null){const el=element(doc,'v');el.textContent=typeof v==='boolean'?(v?'1':'0'):String(v);c.appendChild(el);}}
     else if(v!==null){if(typeof v==='boolean'||typeof v==='number'){if(typeof v==='number'&&!Number.isFinite(v))throw Error(`${k}: 잘못된 숫자`);if(typeof v==='boolean')c.setAttribute('t','b');const el=element(doc,'v');el.textContent=typeof v==='boolean'?(v?'1':'0'):String(v);c.appendChild(el);}else{c.setAttribute('t','inlineStr');const is=element(doc,'is'),t=element(doc,'t');t.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');t.textContent=String(v);is.appendChild(t);c.appendChild(is);}}
     r.appendChild(c);
    });sd.appendChild(r);
   });
   const end=Math.max(start,spec.rows.length+header),last=col(spec.keys.length-1);const dim=all(doc,'dimension')[0];if(dim)dim.setAttribute('ref',`A1:${last}${end}`);
   for(const cf of all(doc,'conditionalFormatting')){if(all(cf,'formula').some(f=>f.textContent.includes('YACHA_BAND_')||/MOD\(ROW\(\),2\)=/.test(f.textContent)))cf.setAttribute('sqref',`A${start}:${last}${end}`);else if(end>203)cf.setAttribute('sqref',cf.getAttribute('sqref').replace(/203/g,String(end)));}
   for(const dv of all(doc,'dataValidation')){if(end>203){if(dv.hasAttribute('sqref'))dv.setAttribute('sqref',dv.getAttribute('sqref').replace(/203/g,String(end)));for(const sq of all(dv,'sqref'))sq.textContent=sq.textContent.replace(/203/g,String(end));}}
   zip.file(base.path,xml(doc));for(const path of base.tablePaths){const td=parse(await zip.file(path).async('string'));td.documentElement.setAttribute('ref',`A${header}:${last}${end}`);for(const f of all(td,'autoFilter'))f.setAttribute('ref',`A${header}:${last}${end}`);zip.file(path,xml(td));}
  }
  // A changed sheet invalidates Excel's cached calculation chain.
  if(zip.file('xl/calcChain.xml')){zip.remove('xl/calcChain.xml');const rp='xl/_rels/workbook.xml.rels',rs=parse(await zip.file(rp).async('string'));for(const r of all(rs,'Relationship'))if(r.getAttribute('Type').endsWith('/calcChain'))r.remove();zip.file(rp,xml(rs));const cp='[Content_Types].xml',cs=parse(await zip.file(cp).async('string'));for(const e of all(cs,'Override'))if(e.getAttribute('PartName')==='/xl/calcChain.xml')e.remove();zip.file(cp,xml(cs));}
  const wb=parse(await zip.file('xl/workbook.xml').async('string'));let calc=all(wb,'calcPr')[0];if(!calc){calc=element(wb,'calcPr');wb.documentElement.appendChild(calc);}calc.setAttribute('fullCalcOnLoad','1');zip.file('xl/workbook.xml',xml(wb));
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
 }
 return {load,save,refreshNames,create:createOfflineBook,get macro(){return current?.data.macro;}};
}
const OfflineBook=createOfflineBook();
