import {chromium,webkit} from 'playwright';
import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';
import {salonDialogueGroup,salonDialogueText} from '../src/salon-dialogue.js';
import {parseDialogueText} from '../src/text-effects.js';
const root=path.resolve('dist'),project=JSON.parse(await fs.readFile('data/project.json','utf8'));
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname,file=path.join(root,name==='/'?'index.html':name);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.YACHA_DIALOGUE_URL||'http://127.0.0.1:'+server.address().port,output=process.env.YACHA_DIALOGUE_SCREENSHOTS;
if(output)await fs.mkdir(output,{recursive:true});
const plain=s=>parseDialogueText(s).plain;
async function editor(page,type){await page.goto(base);await page.locator('#siteLoading').waitFor({state:'detached'});await page.locator('#developer').click();if(await page.locator('#updateOK').isVisible())await page.locator('#updateOK').click();await page.locator(`[data-editor="${type}"]`).first().click();}
async function choice(page,expected){await page.locator('#beautyChoices').waitFor();assert.equal(await page.locator('#talkText').innerText(),plain(expected));}
try{for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
  for(const id of [10001,10003]){
   await editor(page,'beauty');await page.locator('#beautyGuest').selectOption(String(id));await page.locator('#beautyTry').click();await page.locator('#previewStart').click();
   const frame=await page.locator('#salon').elementHandle().then(e=>e.contentFrame());await frame.waitForFunction(()=>beautyDebug?.ready);
   for(const stage of ['cut','draw','attach']){
    if(stage!=='cut')await frame.locator(`[data-phase="${stage}"]`).click();
    const first=salonDialogueText(project,id,stage),detail=salonDialogueText(project,id,stage,true);
    await choice(page,first);assert(await page.locator('#beautyAsk').isVisible());
    if(stage==='cut'){
     if(output&&name==='chromium')await page.screenshot({path:path.join(output,id+'-initial.png')});
     await page.locator('#beautyAccept').click();await page.locator('#talkLayer').waitFor({state:'hidden'});await frame.waitForFunction(()=>!beautyDebug.briefing);
     await frame.locator('#repeatBeautyRequest').click();await choice(page,first);
    }
    await page.locator('#beautyAsk').click();await choice(page,detail);assert.equal(await page.locator('#beautyAsk').isVisible(),false);
    if(stage==='cut'&&output&&name==='chromium')await page.screenshot({path:path.join(output,id+'-detail.png')});
    await page.locator('#beautyAccept').click();await page.locator('#talkLayer').waitFor({state:'hidden'});await frame.waitForFunction(()=>!beautyDebug.briefing);
    await frame.locator('#repeatBeautyRequest').click();await choice(page,detail);await page.locator('#beautyAccept').click();await page.locator('#talkLayer').waitFor({state:'hidden'});await frame.waitForFunction(()=>!beautyDebug.briefing);
   }
   await frame.locator('[data-phase="cut"]').click();await page.waitForTimeout(250);assert.equal(await page.locator('#talkLayer').isVisible(),false);
   console.log(`${name}: ${id}, all three linked stages, direct accept, clarification, replay and no tab replay`);
  }
  // Exercise the table editor -> parent snapshot -> beauty dialogue path with a real edit.
  await editor(page,'combat');const child=await page.locator('#combatEditor').elementHandle().then(e=>e.contentFrame());await child.locator('#notice').filter({hasText:'전투 준비 완료'}).waitFor();
  const parsed=await child.evaluate(async()=>{
   const results=[];
   for(const id of ['embedded-authoring','embedded-workbook']){
    const bytes=Uint8Array.from(atob(document.getElementById(id).textContent.trim()),c=>c.charCodeAt(0));const b=lab.OfflineBook.create(),d=await b.load(bytes,id==='embedded-authoring'?'source.xlsm':'source.xlsx');
    const sheet=d.sheets.find(s=>s.name==='미용 대사 연결');results.push(sheet.rows.map(r=>sheet.keys.map(k=>r[k])));
   }return results;
  });assert.equal(parsed[0].length,9);assert.equal(parsed[0].filter(r=>r[0]===10004).length,3);assert.deepEqual(parsed[0],parsed[1]);
  await child.locator('[data-sheet="대사"]').click();await child.locator('#filter').fill('900014');
  const revised='엑셀 대사 연결 확인. 첫 번째 문장.';await child.locator('td[data-key="Text"] textarea').fill(revised);await child.locator('td[data-key="Text"] textarea').blur();
  await page.locator('#editorScreen [data-editor="dialogue"]').click();await page.locator('#dialogueEvent').selectOption('cut');assert.equal(await page.locator('#beautyRequestText').inputValue(),revised);
  await page.locator('[data-request-add="RequestGroupID"]').click();await page.locator('[data-request-line]').nth(1).fill('추가한 두 번째 문장.');
  await page.locator('#previewBeautyRequest').click();await page.waitForTimeout(1400);assert.equal(await page.locator('#beautyChoices').isVisible(),false);
  while((await page.locator('#talkCount').textContent()).startsWith('1 /')){await page.locator('#talkNext').click();await page.waitForTimeout(100);}
  await choice(page,'추가한 두 번째 문장.');await page.locator('#beautyAsk').click();await choice(page,salonDialogueText(project,10001,'cut',true));await page.locator('#beautyAccept').click();await page.locator('#talkLayer').waitFor({state:'hidden'});
  // The developer preview changes are session-local and are never saved or published.
  assert.equal(await page.locator('#ownerStatus').textContent(),'저장 기능 잠김');assert.deepEqual(errors,[]);
  console.log(`${name}: both Excel representations, table edit propagation and multi-line final choices`);
 }finally{await browser.close();}
}}finally{await new Promise(r=>server.close(r));}
