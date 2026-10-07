import {checkStoryStarts} from './check-story-starts.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const {webkit,chromium}=await import(process.env.YACHA_PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
const read=p=>fs.readFile(path.join(root,p),'utf8');
const version=JSON.parse(await read('dist/version.json'));
const project=JSON.parse(await read('data/project.json'));
const assets=JSON.parse(await read('data/assets.json'));
const template=await read('dist/'+version.files.combat);
// Isolated combat fixtures exercise the real child module and its host message contract.
// No fixture routes, owner grants or test controls are included in dist or the public site.
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/test-combat'){
   const host={token:'compat-test',mode:u.searchParams.get('mode')||'editor',ownerAllowed:true,ownerExpires:Date.now()+600000,data:project.combat,monsterID:Number(u.searchParams.get('monster')||10001),beauty:'미용 성공',sound:false,visuals:assets.room};
   const text=template.replace('__HOST_JSON__',()=>JSON.stringify(host).replace(/</g,'\\u003c'));
   res.setHeader('Content-Type','text/html; charset=utf-8');res.end(text);return;
  }
  const file=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(!file.startsWith(dist+path.sep)){res.writeHead(403).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.ogg':'audio/ogg','.wav':'audio/wav'})[path.extname(file)]||'application/octet-stream');
  res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
try{
 for(const [name,type] of Object.entries({webkit,chromium})){
  const browser=await type.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
   page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    window.xmlCalls=0;const realParse=DOMParser.prototype.parseFromString;
    DOMParser.prototype.parseFromString=function(s,t){window.xmlCalls++;return realParse.call(this,window.failXML?'<broken>':s,t);};
    window.failXML=true;
    // The isolated host acknowledges permission checks; real-page tests below remain locked.
    if(location.pathname==='/test-combat')addEventListener('message',e=>{
     if(e.source===window&&e.data?.source==='yachacha-combat'&&e.data.token==='compat-test'&&e.data.type==='owner-check')postMessage({type:'owner-result',token:'compat-test',requestID:e.data.requestID,allowed:true},'*');
    });
   });
   await page.goto(base+'/test-combat');
   await page.locator('#notice').filter({hasText:'전투 준비 완료'}).waitFor();
   assert.equal(await page.evaluate(()=>window.xmlCalls),0,'startup must not parse Excel');
   await page.waitForFunction(()=>document.querySelector('#arena').getContext('2d').getImageData(0,0,1,1).data[3]>0);
   await page.locator('#sound').uncheck();await page.locator('#start').click();
   await page.waitForFunction(()=>window.lab.battle?.time>50);
   console.log(name+': editor starts even when XML parsing fails');
   // First export fails; retry uses a fresh template initialization and preserves the edit.
   await page.locator('#changeIntent').fill('브라우저 호환 자동 검증');
   await page.locator('#exportZip').click();
   await page.locator('#notice').filter({hasText:'엑셀 XML을 읽을 수 없습니다 (xl/workbook.xml)'}).waitFor();
   await page.evaluate(()=>window.failXML=false);
   const imported=await page.evaluate(async()=>{
    const bytes=Uint8Array.from(atob(document.getElementById('embedded-authoring').textContent.trim()),c=>c.charCodeAt(0));
    const b=window.lab.OfflineBook.create(),d=await b.load(bytes,'source.xlsm');
    const row=d.sheets.find(s=>s.name==='몬스터 페이즈').rows.find(r=>r.MonsterID===10001&&r.PhaseID===1);row.MaxHP+=1;
    const edited=await b.save(d);await window.lab.loadBook({name:'import-test.xlsm',arrayBuffer:async()=>edited.buffer});
    return row.MaxHP;
   });
   await page.locator('#notice').filter({hasText:'import-test.xlsm 불러오기 완료'}).waitFor();
   await page.locator('#start').click();
   await page.waitForFunction(hp=>window.lab.battle?.monster.MaxHP===hp,imported);
   await page.locator('#exportZip').click();
   // The status appears after both files have been serialized and validated, before the download click.
   await page.waitForFunction(()=>document.getElementById('notice').classList.contains('error')||document.getElementById('notice').textContent.includes('두 엑셀과 변경 이력을 ZIP으로'),null,{timeout:180000});
   assert.equal(await page.locator('#notice').evaluate(e=>e.classList.contains('error')),false,await page.locator('#notice').textContent());
   await page.waitForFunction(()=>document.getElementById('changeIntent').value==='');
   assert.equal(await page.evaluate(()=>window.lab.data.sheets.find(s=>s.name==='몬스터 페이즈').rows.find(r=>r.MonsterID===10001&&r.PhaseID===1).MaxHP),imported);
   const pair=await page.evaluate(async()=>{
    const v=lab.TableVersions,result=await v.prepare(lab.data,'같은 값 재검증','2099-01-01_00-00-00');
    const original=Uint8Array.from(atob(document.getElementById('embedded-authoring').textContent.trim()),c=>c.charCodeAt(0));
    const za=await JSZip.loadAsync(original),zb=await JSZip.loadAsync(result.files[0].bytes);
    return {changes:result.changes.length,macro:(await za.file('xl/vbaProject.bin').async('base64'))===(await zb.file('xl/vbaProject.bin').async('base64'))};
   });assert.equal(pair.changes,0);assert(pair.macro);
   console.log(name+': failed export → Excel import → resumed combat → paired export, VBA preserved');
   for(const monster of [10001,10002,10003]){
    await page.goto(base+'/test-combat?mode=story&monster='+monster);
    await page.waitForFunction(()=>window.lab?.battle);
    assert.equal(await page.evaluate(()=>window.xmlCalls),0);
    assert(await page.evaluate(()=>Object.keys(window.lab.scene.images).length>0&&lab.battle.hp>0));
   }
   console.log(name+': all three story battle entries work without Excel parsing');
   // One failed image must offer a usable retry instead of a permanently empty arena.
   let block=true;await page.route('**/media/**',route=>block?route.abort():route.continue());
   await page.goto(base+'/test-combat');await page.locator('#retryCombat').waitFor();
   block=false;await page.locator('#retryCombat').click();
   await page.locator('#notice').filter({hasText:'전투 준비 완료'}).waitFor();
   await page.unroute('**/media/**');
   // The real integrated page keeps visitor save controls locked and renders its iframe.
   await page.goto(base);await page.locator('#siteLoading').waitFor({state:'detached'});
   await page.locator('#developer').click();await page.locator('#updateOK').click();
   await page.locator('[data-editor="combat"]').first().click();
   const child=page.frameLocator('#combatEditor');
   await child.locator('#notice').filter({hasText:'전투 준비 완료'}).waitFor();
   assert.equal(await child.locator('#importBook').getAttribute('aria-disabled'),'true');
   // aria-disabled is intentional: a real click opens the password prompt.
   await child.locator('#importBook').click({force:true});await page.locator('#passwordDialog').waitFor();
   await page.locator('#passwordCancel').click();assert.equal(await page.locator('#ownerStatus').textContent(),'저장 기능 잠김');
   await checkStoryStarts(page,{checkContinuation:true,screenshotPath:name==='webkit'?process.env.YACHA_START_SCREENSHOT:undefined});
   assert.deepEqual(errors,[]);
   console.log(name+': image retry and integrated visitor lock pass');
  }finally{await browser.close();}
 }
}finally{await new Promise(r=>server.close(r));}
