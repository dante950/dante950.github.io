import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium,webkit} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=path.resolve(dist,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!file.startsWith(dist+path.sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
try{for(const [name,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
 await page.goto(base);await page.waitForFunction(()=>window.fullflow);await page.locator('#developer').click();if(await page.locator('#updateOK').isVisible())await page.locator('#updateOK').click();await page.locator('[data-editor="dialogue"]:visible').first().click();await page.locator('#dialogueGuest').selectOption('10005');
 assert.equal(await page.locator('#dialogueEvent option').count(),23);assert.deepEqual(await page.locator('[data-speaker]').evaluateAll(ns=>ns.map(n=>n.value)),['커피 유령','마왕 부하']);
 await page.locator('[data-line-text]').first().fill('<color=#FFD166>편집한 커피 유령</color> 등장 확인!');const edited=await page.evaluate(()=>fullflow.project);
 await page.locator('#previewGroup').click();await page.waitForFunction(()=>document.querySelector('#talkText').textContent==='편집한 커피 유령 등장 확인!');assert.equal(await page.locator('#talkSpeaker').innerText(),'커피 유령');
 await page.locator('#talkNext').click();await page.waitForFunction(()=>document.querySelector('#talkSpeaker').textContent==='마왕 부하'&&document.querySelector('#talkText').textContent==='…이 아이를 먼저 부탁드리겠습니다.');await page.locator('#talkNext').click();await page.locator('#talkLayer').waitFor({state:'hidden'});
 await page.locator('#dialogueEvent').selectOption('cutDetail2');assert.match(await page.locator('[data-line-text]').first().inputValue(),/두 눈이 다 보이게/);
 await page.locator('#dialogueGuest').selectOption('10001');assert.equal(await page.locator('#dialogueEvent').inputValue(),'arrival');await page.locator('#dialogueGuest').selectOption('10005');await page.locator('[data-editor="beauty"]:visible').click();assert.equal(await page.locator('#beautyGuest').inputValue(),'10001');assert.equal(await page.locator('#beautyGuest option[value="10005"]').count(),0);
 const tutorial=await browser.newPage();tutorial.setDefaultTimeout(15000);tutorial.on('pageerror',e=>errors.push(e.message));await tutorial.route('**/project.*.json',route=>route.fulfill({json:edited}));await tutorial.goto(base+'/tutorial.html?intro=3');await tutorial.waitForFunction(()=>window.tutorialLab?.state==='title');await tutorial.getByRole('button',{name:'다시 시작',exact:true}).click();await tutorial.locator('[data-jump="arrival"]').click();await tutorial.waitForFunction(()=>document.querySelector('#dialogueText').textContent==='편집한 커피 유령 등장 확인!');await tutorial.waitForFunction(()=>getComputedStyle(document.querySelector('#dialogueText span')).color==='rgb(255, 209, 102)');
 await tutorial.getByRole('button',{name:'다시 시작',exact:true}).click();await tutorial.locator('[data-jump="beauty"]').click();await tutorial.waitForFunction(()=>window.tutorialLab?.request?.stage==='cut');await tutorial.locator('#dialogueText').click();for(const level of [1,2]){await tutorial.locator('#askAgain').click();await tutorial.locator('#dialogueText').click();assert.equal(await tutorial.evaluate(()=>tutorialLab.request.level),level);}assert.equal(await tutorial.locator('#askAgain').isVisible(),false);assert.match(await tutorial.locator('#dialogueText').innerText(),/두 눈이 다 보이게/);
 assert.deepEqual(errors,[]);console.log(name+': coffee dialogue editor, edited preview, speaker switch, existing guest navigation, actual tutorial text/color and two clarification levels passed');
 }finally{await browser.close();}
}}finally{await new Promise(r=>server.close(r));}
