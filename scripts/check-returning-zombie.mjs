import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const root=path.resolve('dist'),out=path.resolve('docs/returning-zombie');
await fs.mkdir(out,{recursive:true});
const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html')));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch();
const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
async function begin(){console.log('open main');await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.fullflow);await p.locator('#play').click();console.log('menu ready');}
async function talks(){for(let n=0;n<40;n++){if(await p.locator('#beautyChoices').isVisible()){if(await p.locator('#beautyAccept').isEnabled())await p.locator('#beautyAccept').click();else if(await p.locator('#talkNext').isVisible())await p.locator('#talkNext').click();}else if(await p.locator('#talkLayer').isVisible())await p.locator('#talkNext').click();else return;await p.waitForTimeout(70);}throw Error('dialogue did not finish');}
async function stroke(f,a,b=a){const r=await f.locator('.sculptCanvas').boundingBox();await p.mouse.move(r.x+a[0]/320*r.width,r.y+a[1]/350*r.height);await p.mouse.down();await p.mouse.move(r.x+b[0]/320*r.width,r.y+b[1]/350*r.height,{steps:8});await p.mouse.up();}
async function stage(f,name){await f.locator('[data-phase="'+name+'"]').click();await p.waitForTimeout(100);await talks();await f.waitForFunction(()=>!briefing);await p.waitForTimeout(850);}
try{
 await begin();assert.equal(await p.locator('.startGuest').count(),5);await p.screenshot({path:path.join(out,'start-menu.png')});
 await p.locator('[data-start-intro]').click();await p.waitForURL('**/tutorial.html?intro=3&start=1');
 for(const id of [10001,10003,10004]){await begin();await p.locator('[data-start-guest="'+id+'"]').click();assert.equal(await p.evaluate(()=>fullflow.story.guest),id);assert(await p.locator('#modal').isHidden());}
 for(const branch of ['employed','lottery'])for(const success of [true,false]){console.log('case',branch,success);
  await begin();await p.locator('[data-start-guest="10006"]').click();await p.locator(branch==='lottery'?'#returnLottery':'#returnEmployed').click();
  const f=await p.locator('#salon').elementHandle().then(h=>h.contentFrame());await f.waitForFunction(()=>window.salonLab&&window.beautyDebug?.ready);
  console.log('salon ready');await f.locator('#openShopBtn').click();await f.waitForFunction(()=>salonLab.customerPhase==='seated');assert.equal(await f.locator('canvas.guestWalk').count(),1);
  await f.locator('.childExit').click();await p.waitForTimeout(100);await talks();await f.waitForFunction(()=>beautyActive&&!briefing);await p.waitForTimeout(850);
  if(success){
   await stage(f,'draw');await f.locator('[data-color="#FDFF81"]').click();await f.locator('#sculptSize').fill('4');await f.locator('#sculptSize').dispatchEvent('input');
   for(const xy of [[164,151],[168,151],[164,155],[168,155]])await stroke(f,xy);
   await stage(f,'attach');await f.locator('[data-sticker="ST-HIP-SUNGLASSES-BLACK"]').click();await stroke(f,[160,108]);await f.locator('[data-sticker="ST-RESOURCE-T_necklace"]').click();await stroke(f,[160,216]);
   assert.equal(await f.evaluate(()=>returningStatus().success),true);
  }else{
   await f.locator('#sculptSize').fill('30');await f.locator('#sculptSize').dispatchEvent('input');
   for(const y of [20,45,70,95])await stroke(f,[55,y],[240,y]);
   assert.equal(await f.evaluate(()=>returningStatus().hairRuined),true);await stage(f,'attach');
  }
  await p.screenshot({path:path.join(out,branch+'-'+(success?'beauty-success':'hair-failure')+'.png')});
  await f.locator('.beautyNext').click();await f.locator('#beautyResultContinue').click();await p.waitForTimeout(120);
  const expected=branch==='employed'?(success?'임원으로':'앞서가도'):(success?'통장 잔고':'머리 정도는');
  await p.waitForFunction(text=>document.querySelector('#talkText').textContent.includes(text),expected);await p.screenshot({path:path.join(out,branch+'-'+(success?'success':'failure')+'-dialogue.png')});
  await talks();await p.waitForFunction(()=>!document.querySelector('#talkLayer').hidden);
  const exit=branch==='employed'?(success?'사원증은':'인사팀에서'):(success?'바닥을':'잘 안 잡히네');
  await p.waitForFunction(text=>document.querySelector('#talkText').textContent.includes(text),exit);await talks();
  await p.locator('#storyClosing').waitFor();const cf=await p.locator('#storyClosing').elementHandle().then(h=>h.contentFrame());await cf.locator('#closeShop').waitFor();
  const record=await p.evaluate(()=>{const r=fullflow.story.records.at(-1);return {id:r.id,success:r.beautySuccess,branch:r.returnBranch,gain:r.gain,outcome:r.outcome};});
  assert.deepEqual(record,{id:10006,success,branch,gain:success?1100:0,outcome:'beauty'});
  console.log(branch,success?'success':'hair failure','passed; day-three closing ready');
 }
 assert.deepEqual(errors,[]);console.log('Five starts, four results, actual pointer input, departure and day-three closing passed.');
}finally{await browser.close();server.close();}
