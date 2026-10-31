import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const root=path.resolve('dist'),out=path.resolve('docs/returning-zombie-042');
await fs.mkdir(out,{recursive:true});
const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html')));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch();
const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
async function begin(){console.log('open main');await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.fullflow);await p.locator('#play').click();console.log('menu ready');}
async function talks(){for(let n=0;n<90;n++){if(await p.locator('#returningChoices').isVisible())return;if(await p.locator('#beautyChoices').isVisible()){if(await p.locator('#beautyAccept').isEnabled())await p.locator('#beautyAccept').click();else if(await p.locator('#talkNext').isVisible())await p.locator('#talkNext').click();}else if(await p.locator('#talkLayer').isVisible())await p.locator('#talkNext').click();else return;await p.waitForTimeout(70);}throw Error('dialogue did not finish');}
async function choice(){for(let n=0;n<60;n++){if(await p.locator('#returningChoices').isVisible())return;if(await p.locator('#talkLayer').isVisible())await p.locator('#talkNext').click();await p.waitForTimeout(80);}throw Error('choice missing');}
async function stroke(f,a,b=a){const r=await f.locator('.sculptCanvas').boundingBox();await p.mouse.move(r.x+a[0]/320*r.width,r.y+a[1]/350*r.height);await p.mouse.down();await p.mouse.move(r.x+b[0]/320*r.width,r.y+b[1]/350*r.height,{steps:8});await p.mouse.up();}
async function stage(f,name){await f.locator('[data-phase="'+name+'"]').click();await p.waitForTimeout(100);await talks();await f.waitForFunction(()=>!briefing);await p.waitForTimeout(850);}
try{
 for(const branch of ['employed','lottery'])for(const success of [true,false]){
  await begin();await p.locator('[data-start-guest="10006"]').click();await p.locator(branch==='lottery'?'#returnLottery':'#returnEmployed').click();
  const f=await p.locator('#salon').elementHandle().then(h=>h.contentFrame());await f.waitForFunction(()=>window.beautyDebug?.ready);
  // Focused dialogue test: inject the completed beauty result, then use real choices and the existing departure animation.
  await f.evaluate(success=>send('beauty-result',{score:success?100:20,portrait:null,mood:success?'satisfied':'angry',headPortrait:null,details:{success,hairRuined:!success}}),success);
  await choice();const option=await p.locator('[data-return-choice="1"]').innerText();await p.screenshot({path:path.join(out,branch+'-'+success+'-tease.png')});
  await p.locator('[data-return-choice="1"]').click();await talks();await p.waitForFunction(()=>!document.querySelector('#talkLayer').hidden);
  const seen=[];for(let n=0;n<40;n++){
   if(await p.locator('#storyClosing').count())break;
   if(await p.locator('#talkLayer').isVisible()){const t=await p.locator('#talkText').innerText();seen.push(t);if(t.includes(branch==='employed'?'인사평가':'잔고'))await p.screenshot({path:path.join(out,branch+'-'+success+'-no-yacha.png')});await p.locator('#talkNext').click();}
   await p.waitForTimeout(80);
  }
  assert(seen.some(t=>t.includes('야차는 안 하세요')),seen.join('/'));assert(seen.some(t=>t.includes(branch==='employed'?'인사평가':'잔고')),seen.join('/'));
  assert(seen.some(t=>t.includes(branch==='employed'?(success?'사원증은':'인사팀에서'):(success?'바닥을':'잘 안 잡히네'))));
  await p.locator('#storyClosing').waitFor();assert(await p.locator('#battleHost').isHidden());
  const record=await p.evaluate(()=>fullflow.story.records.at(-1));assert.equal(record.outcome,'beauty');assert.equal(record.gain,success?1100:0);console.log(branch,success,option,'no Yacha / closing passed');
 }
 assert.deepEqual(errors,[]);console.log('Four result choices and no-Yacha exits passed (beauty result injected).');
}finally{await browser.close();server.close();}
