import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const root=path.resolve('dist'),out=path.resolve('docs/returning-zombie-043');
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

async function completeAndCheck(f,branch,mood,success){
 const before=await f.evaluate(()=>({status:returningStatus(),scores:beautyDebug.scores}));
 assert.equal(before.status.mood,mood);assert.equal(before.status.success,success);
 await f.locator('.beautyNext').click();
 await f.waitForFunction(()=>beautyDebug.result.active);
 assert.equal(await f.evaluate(()=>beautyDebug.result.mood),mood);
 await f.locator('#beautyResultContinue').click();await p.waitForTimeout(120);await choice();
 const expected=branch==='employed'?'네. 임원이라고 해도 믿겠어요.':success?'네. 한눈에 부자 같으세요.':'네. 보통 여유로는 못 할 스타일이네요.';
 assert.equal(await p.locator('[data-return-choice="0"]').innerText(),expected);
 await p.screenshot({path:path.join(out,branch+'-'+mood+'-result.png')});
 await p.locator('[data-return-choice="0"]').click();await talks();
 for(let n=0;n<90;n++){
  if(await p.locator('#storyClosing').count())break;
  if(await p.locator('#talkLayer').isVisible())await p.locator('#talkNext').click();
  await p.waitForTimeout(80);
 }
 await p.locator('#storyClosing').waitFor();
 const record=await p.evaluate(()=>fullflow.story.records.at(-1));
 assert.equal(record.mood,mood);assert.equal(record.beautySuccess,success);assert.equal(record.gain,success?1100:0);assert.equal(record.outcome,'beauty');
 console.log(branch,mood,'score',before.scores.total,'success',success,'gain',record.gain);
}
try{
 for(const [branch,mood] of [['employed','neutral'],['lottery','satisfied'],['lottery','angry']]){
  await begin();await p.locator('[data-start-guest="10006"]').click();await p.locator(branch==='employed'?'#returnEmployed':'#returnLottery').click();
  const f=await p.locator('#salon').elementHandle().then(h=>h.contentFrame());await f.waitForFunction(()=>window.beautyDebug?.ready);
  // Only skip the unchanged walk-in and recognition dialogue; all grooming below uses pointer input.
  await f.evaluate(()=>{customerState.phase='seated';enterBeauty();});await p.waitForTimeout(100);await talks();await f.waitForFunction(()=>beautyActive&&!briefing);await p.waitForTimeout(850);
  await f.locator('[data-tool="scissors"]').click();
  if(mood==='angry'){
   await stroke(f,[25,260]);assert.equal(await f.evaluate(()=>beautyDebug.reaction.cutUsed),false);
   await f.locator('[data-tool="grow"]').click();await stroke(f,[130,128]);
   assert((await f.evaluate(()=>beautyDebug.reaction.seen)).includes('returnGrow'),'growth before any cut must protest');
  }else{
   await f.locator('#sculptSize').fill('30');await f.locator('#sculptSize').dispatchEvent('input');
   for(const y of [20,45,70,95])await stroke(f,[55,y],[240,y]);
   assert.equal(await f.evaluate(()=>returningStatus().hairRuined),true);
   assert.equal(await f.evaluate(()=>beautyDebug.reaction.cutUsed),true);
   await f.locator('[data-tool="grow"]').click();await stroke(f,[90,50]);
   assert(!(await f.evaluate(()=>beautyDebug.reaction.seen)).includes('returnGrow'),'growth after cutting must not protest');
   await stage(f,'draw');await f.locator('[data-color="#FDFF81"]').click();await f.locator('#sculptSize').fill('4');await f.locator('#sculptSize').dispatchEvent('input');
   for(const xy of [[164,151],[168,151],[164,155],[168,155]])await stroke(f,xy);
   assert.equal(await f.evaluate(()=>beautyDebug.scores.draw),60);
  }
  await stage(f,'attach');
  if(mood==='satisfied'){
   for(const [id,xy] of [['ST-HIP-SUNGLASSES-BLACK',[160,108]],['ST-RESOURCE-T_necklace',[160,216]],['ST-STRONG-CROWN-01',[160,35]]]){await f.locator('[data-sticker="'+id+'"]').click();await stroke(f,xy);}
   assert.equal(await f.evaluate(()=>beautyDebug.scores.total),90);
  }
  await completeAndCheck(f,branch,mood,mood!=='angry');
 }
 assert.deepEqual(errors,[]);console.log('Three moods, rewards, departure, and cut/growth order passed.');
}finally{await browser.close();server.close();}
