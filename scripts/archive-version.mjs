// node scripts/archive-version.mjs <edited.xlsx|edited.xlsm> <intent.txt> [version-root]
// Use the integrated workbook schema, including SalonDialogue. Older labs stay unchanged.
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {chromium} from 'playwright';
const repo=fileURLToPath(new URL('../',import.meta.url));
const [source,intentFile,root='C:/Users/koh/Desktop/데이터테이블']=process.argv.slice(2);
if(!source||!intentFile)throw Error('수정한 엑셀과 변경 의도를 적은 TXT 파일이 필요합니다.');
const names=(await fs.readdir(root,{withFileTypes:true})).filter(x=>x.isDirectory()&&/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/.test(x.name)).map(x=>x.name).sort().reverse();
let prior;for(const name of names){
 const candidate=path.join(root,name);
 const meta=await fs.readFile(path.join(candidate,'버전 정보.json'),'utf8').then(s=>JSON.parse(s.replace(/^\uFEFF/,'')),()=>({}));
 if(meta.status==='design-draft'||meta.existingConverterCompatible===false)continue;
 if(await fs.access(path.join(candidate,'저장 완료.txt')).then(()=>true,()=>false)){prior=candidate;break;}
}
if(!prior)throw Error('기준으로 삼을 완료된 버전 폴더가 없습니다.');
const author='내 작업용 데이터 테이블/야차차_마스터테이블_작업용.xlsm',unity='유니티 임포트용 데이터 테이블/야차차_마스터테이블_Unity.xlsx';
const input={a:(await fs.readFile(path.join(prior,author))).toString('base64'),u:(await fs.readFile(path.join(prior,unity))).toString('base64'),bytes:(await fs.readFile(source)).toString('base64'),name:path.basename(source),schema:JSON.parse(await fs.readFile(path.join(repo,'data/schema.json'),'utf8')),intent:(await fs.readFile(intentFile,'utf8')).replace(/^\uFEFF/,'').trim()};
const browser=await chromium.launch({headless:true});let result;
try{const page=await browser.newPage();await page.addScriptTag({content:await fs.readFile(path.join(repo,'vendor/jszip.min.js'),'utf8')});
 let code='';for(const file of ['combat/text-effects.js','combat/dialogue.js','combat/engine.js','beauty-reaction-dialogue.js','salon-dialogue.js','combat/workbook-xml.js','combat/workbook.js','combat/versions.js'])code+=(await fs.readFile(path.join(repo,'src',file),'utf8')).replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')+'\n';
 await page.addScriptTag({content:code+'\nwindow.versionTools={OfflineBook,TableVersions};'});
 result=await page.evaluate(async input=>{const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),{OfflineBook,TableVersions:v}=window.versionTools;
  await v.init(bytes(input.a),bytes(input.u),input.schema);const data=await OfflineBook.load(bytes(input.bytes),input.name);await v.adopt(bytes(input.bytes),data);
  const out=await v.prepare(data,input.intent);const encoded=[];for(const file of out.files){const b=typeof file.bytes==='string'?new TextEncoder().encode(file.bytes):file.bytes;let text='';for(let i=0;i<b.length;i+=32768)text+=String.fromCharCode(...b.subarray(i,i+32768));encoded.push({path:file.path,base64:btoa(text)});}return {version:out.version,changes:out.changes.length,files:encoded};
 },input);
}finally{await browser.close();}
const dest=path.join(root,result.version);await fs.mkdir(dest); // refuse overwrite
for(const file of result.files){const target=path.join(dest,file.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,Buffer.from(file.base64,'base64'),{flag:'wx'});}
await fs.writeFile(path.join(dest,'저장 완료.txt'),'\uFEFF'+result.version+' — 작업용·Unity용·변경 이력 저장 완료\r\n',{flag:'wx'});
console.log(JSON.stringify({version:result.version,folder:dest,changes:result.changes},null,2));
