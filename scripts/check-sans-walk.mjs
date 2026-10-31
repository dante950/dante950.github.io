import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const root=path.resolve('dist'),out=path.resolve('docs/sans-walk');
await fs.mkdir(out,{recursive:true});
const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html')));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch();
const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));

async function talks(){for(let n=0;n<100;n++){if(!await p.locator('#talkLayer').isVisible())return;await p.locator('#talkNext').click();await p.waitForTimeout(65);}throw Error('dialogue stuck');}
try{
 for(const outcome of ['victory','defeat']){
  await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.fullflow);
  await p.locator('#play').click();await p.locator('[data-start-guest="10003"]').click();
  const f=await p.locator('#salon').elementHandle().then(h=>h.contentFrame());await f.waitForFunction(()=>window.beautyDebug?.ready);
  await f.locator('#openShopBtn').click();await f.waitForFunction(()=>customerState.phase==='walking');
  await p.waitForTimeout(300);
  const first=await f.locator('canvas.guestWalk').evaluate(c=>c.toDataURL());await f.waitForFunction(first=>document.querySelector('canvas.guestWalk').toDataURL()!==first,first);
  const second=await f.locator('canvas.guestWalk').evaluate(c=>c.toDataURL());assert.notEqual(first,second,'arrival must animate');
  assert.equal(await f.locator('canvas.guestWalk').getAttribute('data-direction'),'back');
  if(outcome==='victory')await p.screenshot({path:path.join(out,'arrival.png')});
  await f.waitForFunction(()=>customerState.phase==='seated');
  // Inject only the finished beauty/combat outcomes; arrival, dialogue, result choices,
  // animated departure, and day transition run through their real event handlers.
  await f.evaluate(()=>{window.departures=0;parent.addEventListener('message',e=>{if(e.source===window&&e.data.type==='departed')window.departures++;});send('beauty-result',{score:80,portrait:captureBeautyHead(),mood:'satisfied',headPortrait:captureBeautyHead(),details:null});});
  await p.waitForTimeout(100);await talks();await p.locator('#acceptBattle').click();
  const battle=await p.locator('#storyBattle').elementHandle().then(h=>h.contentFrame());
  await battle.waitForFunction(()=>document.querySelector('#host-data'));
  await battle.evaluate(outcome=>{const h=JSON.parse(document.querySelector('#host-data').textContent);parent.postMessage({source:'yachacha-combat',token:h.token,type:'battle-end',outcome,stats:{}},'*');},outcome);
  await p.locator('.yacha-result').waitFor();
  if(outcome==='victory')await p.locator('.yacha-result-next').click();else await p.locator('.yacha-result-choice').last().click();
  await p.waitForTimeout(100);await talks();
  await f.locator('.sansDeparture').waitFor();assert.equal(await f.locator('.departingGuest').count(),0);
  const exit1=await f.locator('.sansDeparture').evaluate(c=>c.toDataURL());await f.waitForFunction(first=>document.querySelector('.sansDeparture')?.toDataURL()!==first,exit1);
  const exit2=await f.locator('.sansDeparture').evaluate(c=>c.toDataURL());assert.notEqual(exit1,exit2,'departure must animate');
  assert.equal(await f.locator('.sansDeparture').getAttribute('data-direction'),'front');
  if(outcome==='victory')await p.screenshot({path:path.join(out,'departure.png')});
  await p.locator('#storyClosing').waitFor();assert.equal(await f.evaluate(()=>window.departures),1);
  assert.equal((await p.evaluate(()=>fullflow.story)).records.filter(r=>r.guestID===10003||r.guestId===10003||r.id===10003).length,1);
  console.log(outcome+': back arrival, front departure, one day transition passed');
 }
 assert.deepEqual(errors,[]);console.log('Sans walking checks passed');
}finally{await browser.close();server.close();}
