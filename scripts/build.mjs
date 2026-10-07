import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {projectProblems} from '../src/model.js';
import {validate} from '../src/combat/engine.js';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const read=f=>fs.readFile(path.join(root,f),'utf8');
const project=JSON.parse(await read('data/project.json'));
const errors=projectProblems(project);
for(const guest of project.guests||[]) errors.push(...validate(project.combat,{monsterID:guest.id}).errors);
if(errors.length)throw Error('배포 데이터 확인 필요:\n'+errors.join('\n'));
const dist=path.join(root,'dist');
// Only this repository's generated output directory may be replaced.
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw Error('Invalid output directory');
await fs.rm(dist,{recursive:true,force:true});
await fs.mkdir(dist,{recursive:true});
await fs.cp(path.join(root,'public'),dist,{recursive:true});
const safe=s=>s.replace(/<\/script/gi,'<\\/script');
const code=s=>s.replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,16);
const files={};
async function emit(name,ext,content){const filename=`${name}.${hash(content)}.${ext}`;await fs.writeFile(path.join(dist,filename),content);files[name]=filename;return './'+filename;}
async function bundle(prefix,names){return (await Promise.all(names.map(f=>read(prefix+f)))).map(code).join('\n');}

let combat=await read('src/combat/index.html');
const css=(await Promise.all(['style.css','story.css','story-stage.css'].map(f=>read('src/combat/'+f)))).join('\n');
const combatScript=await bundle('src/combat/',['../media.js','text-effects.js','dialogue.js','engine.js','workbook-xml.js','workbook.js','versions.js','scene.js','story-scene.js','app.js','bridge.js']);
const wb=(await fs.readFile(path.join(root,'data/source.xlsx'))).toString('base64');
const au=(await fs.readFile(path.join(root,'data/source-authoring.xlsm'))).toString('base64');
const schema=await read('data/schema.json'),assets=await read('src/combat/assets.json');
const zip=await read('vendor/jszip.min.js'),license=await read('vendor/JSZip-LICENSE.txt');
combat=combat.replace('<link rel="stylesheet" href="style.css">',()=>`<style>${css}</style>`)
 .replace('<script type="module" src="app.js"></script>',()=>`<script id="host-data" type="application/json">__HOST_JSON__</script><script id="embedded-workbook" type="application/octet-stream">${wb}</script><script id="embedded-authoring" type="application/octet-stream">${au}</script><script id="embedded-schema" type="application/json">${safe(schema)}</script><script id="embedded-assets" type="application/json">${safe(assets)}</script><script>${safe(zip)}</script><script type="module">${safe(combatScript)}</script><script type="text/plain">${safe(license)}</script>`);
const parentBundle=await bundle('src/',['text-effects.js','combat/dialogue.js','combat/engine.js','model.js','publishing.js','owner-access.js','media.js','audio.js','app.js']);
const appURL=await emit('app','js',parentBundle),styleURL=await emit('style','css',await read('src/style.css'));
const inputs={
 'flow-assets':[await emit('assets','json',await read('data/assets.json')),'json'],
 'flow-default':[await emit('project','json',JSON.stringify(project)),'json'],
 'flow-salon':[await emit('salon','html',await read('src/salon.html')),'text'],
 'flow-combat':[await emit('combat','html',combat),'text']
};
const releaseId=hash(JSON.stringify(files));
const boot=`const inputs=${JSON.stringify(inputs)};
try {
 const items=await Promise.all(Object.entries(inputs).map(async([id,[url,kind]])=>{
  const res=await fetch(url);if(!res.ok)throw Error('불러오지 못한 파일: '+url);
  return [id,kind==='json'?await res.json():await res.text()];
 }));
 for(const [id,data] of items){const script=document.createElement('script');script.id=id;script.type='application/json';script.textContent=JSON.stringify(data);document.body.append(script);}
 document.documentElement.dataset.release=${JSON.stringify(releaseId)};
 await import(${JSON.stringify(appURL)});
 document.getElementById('siteLoading').remove();document.body.classList.remove('site-loading');
} catch(error) {
 console.error(error);document.getElementById('loadingTitle').textContent='미용실을 불러오지 못했어요';
 document.getElementById('loadingMessage').textContent='인터넷 연결을 확인한 뒤 다시 열어 주세요. 계속되면 잠시 후 다시 시도해 주세요.';
 document.getElementById('loadingRetry').hidden=false;
 document.getElementById('loadingRetry').onclick=()=>location.reload();
}`;
const bootURL=await emit('boot','js',boot);
let parent=await read('src/index.html');
parent=parent.replace('<link rel="stylesheet" href="style.css">',()=>`<link rel="stylesheet" href="${styleURL}"><meta name="description" content="야차차 통합 플레이테스트. 미용과 야차 전투, 손님들의 이야기를 직접 플레이하고 개발실에서 조정해 보세요.">`)
 .replace('<body>','<body class="site-loading"><div id="siteLoading" role="status"><h1 id="loadingTitle">미용실에 불을 켜고 있어요</h1><p id="loadingMessage">첫 방문에는 이미지와 음악을 준비하는 데 잠시 걸릴 수 있어요.</p><button id="loadingRetry" hidden>다시 불러오기</button></div>')
 .replace('<!-- EMBEDDED_DATA -->','')
 .replace('<script type="module" src="app.js"></script>',()=>`<script type="module" src="${bootURL}"></script>`);
await fs.writeFile(path.join(dist,'index.html'),parent);
await fs.writeFile(path.join(dist,'.nojekyll'),'');
await fs.writeFile(path.join(dist,'version.json'),JSON.stringify({releaseId,projectVersion:project.version,commit:process.env.GITHUB_SHA||null,files},null,2));
console.log(`Built release ${releaseId}: ${Object.keys(files).length} versioned files + media.`);
