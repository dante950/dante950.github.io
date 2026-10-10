import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import http from 'node:http';import path from 'node:path';
const root=path.resolve('dist'),out=process.env.YACHA_RESULT_SCREENSHOTS;
if(out)await fs.mkdir(out,{recursive:true});
const server=http.createServer(async(req,res)=>{try{const p=path.join(root,new URL(req.url,'http://localhost').pathname.replace(/^\/$/,'/index.html'));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(p)]||'application/octet-stream');res.end(await fs.readFile(p));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.YACHA_BEAUTY_URL||'http://127.0.0.1:'+server.address().port,results=[];
const range=(s,id,v)=>s.locator(id).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input'));},v);
async function stroke(p,s,a,b=a){const r=await s.locator('.sculptCanvas').boundingBox();await p.mouse.move(r.x+a[0]*r.width/320,r.y+a[1]*r.height/350);await p.mouse.down();await p.mouse.move(r.x+b[0]*r.width/320,r.y+b[1]*r.height/350);await p.mouse.up();}
async function accept(p,s){await p.locator('#beautyChoices').waitFor();await p.locator('#beautyAccept').click();await s.waitForFunction(()=>!beautyDebug.briefing);}
async function start(p,id){
 await p.goto(base);await p.locator('#siteLoading').waitFor({state:'detached'});await p.locator('#developer').click();if(await p.locator('#updateOK').isVisible())await p.locator('#updateOK').click();await p.locator('[data-editor="beauty"]').first().click();await p.locator('#beautyGuest').selectOption(String(id));await p.locator('#beautyTry').click();await p.locator('#previewStart').click();
 const s=await p.locator('#salon').elementHandle().then(h=>h.contentFrame());await s.waitForFunction(()=>window.beautyDebug?.ready);await accept(p,s);return s;
}
try{for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 if(process.env.YACHA_RESULT_ENGINE&&process.env.YACHA_RESULT_ENGINE!==engineName)continue;
 const browser=await engine.launch();try{const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const id of [10001,10003])for(const mood of ['satisfied','neutral','angry']){
  const s=await start(p,id);assert.equal(await s.locator('#showBeautyZones').innerText(),'손질 가이드');await s.locator('#showBeautyZones').click();assert.equal(await s.locator('#showBeautyZones').getAttribute('aria-pressed'),'true');
  if(mood!=='angry'){
   if(id===10001){await s.locator('[data-tool="grow"]').click();await range(s,'#sculptSize',18);for(const y of [20,45,70,95])await stroke(p,s,[90,y],[225,y]);await s.locator('[data-tool="scissors"]').click();await stroke(p,s,[106,110],[215,110]);}
   else{
    await range(s,'#sculptSize',5);let regions=await s.evaluate(()=>JSON.parse(document.getElementById('guest-data').textContent).beauty.cutRegions);
    if(mood==='neutral'){
     const counts=await s.evaluate(()=>scoreShape(beautyDebug.material,beautyDebug.original,JSON.parse(document.getElementById('guest-data').textContent).beauty,160,175,beautyDebug.masks).details);
     regions=regions.sort((a,b)=>counts.find(r=>r.key===b.key).total-counts.find(r=>r.key===a.key).total).slice(0,4);
    }
    for(const r of regions){for(let y=r.y+4;y<=r.y+r.h-4;y+=4)await stroke(p,s,[r.x+4,y],[r.x+r.w-4,y]);}
    assert.equal(await s.locator('.requestItem.complete').count(),1);
    if(out)await p.screenshot({path:path.join(out,engineName+'-sans-'+mood+'-request.png')});
   }
  }
  await s.locator('[data-phase="draw"]').click();await accept(p,s);await range(s,'#sculptSize',4);await range(s,'#paintOpacity',55);await s.locator('[data-color="#FF67A7"]').click();await stroke(p,s,[110,133],[121,133]);
  await s.locator('[data-phase="attach"]').click();await accept(p,s);
  if(mood==='satisfied'){await s.locator('[data-sticker="'+(id===10001?'ST-GENTLE-BOWTIE-BLACK':'ST-STRONG-SCAR-01')+'"]').click();await stroke(p,s,id===10001?[160,197]:[190,135]);}
  const saved=await s.evaluate(()=>({material:beautyDebug.material,paint:beautyDebug.paint,placements:beautyDebug.placements,scores:beautyDebug.scores}));
  const expected=saved.scores.total>=80?'satisfied':saved.scores.total>=40?'neutral':'angry';assert.equal(expected,mood,JSON.stringify(saved.scores));
  await p.evaluate(()=>{window.resultMessages=[];addEventListener('message',e=>{if(e.data?.type==='beauty-result')resultMessages.push(e.data);});});
  await s.locator('.beautyNext').click();assert.equal(await s.evaluate(()=>beautyDebug.result.active),true);assert.equal(await s.evaluate(()=>beautyDebug.result.revealed),false);assert(!await s.locator('#showBeautyZones').isVisible());
  await s.waitForFunction(()=>beautyDebug.result.revealed);await p.waitForTimeout(1100);
  assert.equal(await s.evaluate(()=>beautyDebug.expression),mood);assert.equal(await s.locator('#beautyScreen').getAttribute('data-result-mood'),mood);
  const visibleHand=await s.locator('.beautyResultHand').evaluate(e=>+getComputedStyle(e).opacity);assert.equal(visibleHand,mood==='satisfied'?1:0);
  const zoom=await s.locator('.beautyResultCamera').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).a);assert(zoom>1.2);
  assert.deepEqual(await s.evaluate(()=>({material:beautyDebug.material,paint:beautyDebug.paint,placements:beautyDebug.placements,scores:beautyDebug.scores})),saved,'animation preserves actual work and score');
  if(out)await p.screenshot({path:path.join(out,engineName+'-'+id+'-'+mood+'.png')});
  if(mood==='satisfied'){await s.locator('#beautyResultContinue').click();await s.evaluate(()=>advanceBeautyResult());}
  await p.locator('#returnBeauty').waitFor();assert.equal(await p.evaluate(()=>resultMessages.length),1);assert.equal(await s.evaluate(()=>beautyDebug.result.active),false);
  assert(!/만족도|\d+\s*점|\d+\s*\/\s*100/.test(await p.locator('#modalCard').innerText()));
  assert.equal(await p.evaluate(()=>resultMessages[0].portrait.startsWith('data:image/png')),true);
  results.push({engine:engineName,id,mood,score:saved.scores.total});console.log(engineName,id,mood,saved.scores.total,'passed');
 }
 // Skip before reveal and reduced-motion path must also send a single finished portrait.
 const s=await start(p,10003);await p.emulateMedia({reducedMotion:'reduce'});await s.evaluate(()=>salonLab.startBeautyResult());await s.locator('#beautyResultContinue').click();await p.locator('#returnBeauty').waitFor();assert.equal(await s.evaluate(()=>beautyDebug.result.active),false);assert.equal(await s.evaluate(()=>beautyDebug.result.revealed),true);
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}}finally{await new Promise(r=>server.close(r));}
if(out)await fs.writeFile(path.join(out,'result.json'),JSON.stringify({base,checkedAt:new Date().toISOString(),results},null,2));
