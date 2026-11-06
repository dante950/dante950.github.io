import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import http from 'node:http';import path from 'node:path';
const root=path.resolve('dist'),out=path.resolve('docs/demon-two-phase-2026-11-06');await fs.mkdir(out,{recursive:true});
// Fixtures are injected by this test server only; the published bundle has no setters.
const server=http.createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))throw Error();let bytes=await fs.readFile(f);if(/^app\..*\.js$/.test(path.basename(f)))bytes=Buffer.concat([bytes,Buffer.from("\nwindow.__demonFixture={phase(n){changeDemonPhase(n);},stars(n){story.stars=n;loadSalon(story.guest);},closing(){story=createStoryState(copy(BASE),10006);story.stars=3;story.followers=6100;story.records=[{day:3,id:10006,name:'취업 성공 좀비',gain:1100,before:5000,after:6100,beautySuccess:true}];showPage('story');settlement();}};\n")]);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(bytes);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.argv.includes('--url')?process.argv[process.argv.indexOf('--url')+1]:'http://127.0.0.1:'+server.address().port;const publicRun=process.argv.includes('--url');

for(const [name,engine]of (process.argv.includes('--chromium')?[['chromium',chromium]]:process.argv.includes('--webkit')?[['webkit',webkit]]:[['chromium',chromium],['webkit',webkit]])){
 const browser=await engine.launch({channel:name==='chromium'?process.env.YACHACHA_BROWSER_CHANNEL:undefined}),p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const snap=label=>p.screenshot({path:path.join(out,(publicRun?'public-':'')+name+'-'+label+'.png')});
 async function talks(){let idle=0;for(let i=0;i<350;i++){await p.waitForTimeout(80);if(await p.locator('#beautyChoices').isVisible()){idle=0;await p.locator('#beautyAccept').click();await p.locator('#beautyChoices').waitFor({state:'hidden'});}else if(await p.locator('#talkLayer').isVisible()){idle=0;await p.locator('#talkNext').focus();await p.keyboard.press('f');}else if(++idle>=6)return;}throw Error('Dialogue stalled');}
 async function frame(){const f=await p.locator('#salon').elementHandle().then(h=>h.contentFrame());await f.waitForFunction(()=>window.beautyDebug?.ready);return f;}
 async function begin(){await p.goto(base);await p.waitForFunction(()=>window.fullflow);await p.locator('#play').click();await p.locator('[data-start-guest="10007"]').click();return frame();}
 async function enter(f,skip=true){await f.locator('#openShopBtn').click();if(skip)await f.locator('.demonCinema button').click();else{for(let i=0;i<400;i++){await talks();if(await f.locator('#demonStanding').isVisible()||await f.evaluate(()=>salonLab.customerPhase==='seated'))break;await p.waitForTimeout(100);}}await talks();await f.waitForFunction(()=>salonLab.customerPhase==='seated');await snap('room');await f.locator('.childExit').click();await talks();await f.waitForFunction(()=>beautyActive&&!briefing);}
 async function stage(f,key){await f.locator('[data-phase="'+key+'"]').click();await talks();await f.waitForFunction(()=>!briefing);}
 async function stroke(f,a,b=a){const r=await f.locator('.sculptCanvas').boundingBox();await p.mouse.move(r.x+a[0]/320*r.width,r.y+a[1]/350*r.height);await p.mouse.down();await p.mouse.move(r.x+b[0]/320*r.width,r.y+b[1]/350*r.height,{steps:1});await p.mouse.up();}
 async function size(f,n){await f.locator('#sculptSize').fill(String(n));await f.locator('#sculptSize').dispatchEvent('input');}
 async function mask(f,expression,brush=1,reverse=false){await size(f,brush);const runs=await f.evaluate(({expression,reverse})=>{const selected=new Function('n','return '+expression),runs=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!selected(y*W+x))continue;let end=x;while(end+1<W&&selected(y*W+end+1))end++;runs.push([[x*2+1,y*2+1],[end*2+1,y*2+1]]);x=end;}return reverse?runs.reverse():runs;},{expression,reverse});for(const [a,b]of runs)await stroke(f,a,b);console.log(name,expression.slice(0,40),runs.length);}
 const report=async(f,label)=>{const r=await f.evaluate(()=>demonBeautyStatus());console.log(label,JSON.stringify(r));return r;};
 async function complete(f){await stage(f,'attach');await f.locator('.beautyNext').click();await f.locator('#beautyResultContinue').click();await talks();}
 async function waitPhase(n){await p.waitForFunction(n=>fullflow.story?.demonPhase===n&&document.querySelector('#salon').style.opacity==='1',n);let f=await frame();await f.waitForFunction(()=>beautyActive);await talks();await f.waitForFunction(()=>!briefing);return f;}
 async function put(f,id,xy){await f.locator('[data-sticker="ST-RESOURCE-'+id+'"]').click();await stroke(f,xy);}
 try{
  let f=await begin();if(process.argv.includes('--phase2')&&!publicRun){await p.evaluate(()=>__demonFixture.phase(2));f=await waitPhase(2);}else{
   await enter(f,!process.argv.includes('--cinema'));await snap('helmet');await f.locator('[data-tool="grow"]').click();await mask(f,'demonMasks.horn[n]&&!current[n]',4);await stage(f,'draw');await f.locator('[data-color="#242236"]').click();await mask(f,'demonMasks.scratch[n]',4);
   assert.equal((await report(f,'helmet')).success,true);await stage(f,'cut');await f.locator('[data-tool="grow"]').click();await size(f,8);const edge=await f.evaluate(()=>{const y=65;let x=0;while(x<W&&!current[y*W+x])x++;return [x*2+1,y*2+1];});await stroke(f,edge,[edge[0]-10,edge[1]]);assert(await f.evaluate(()=>{prepareDemonGeometry();let edge=0,inside=0;for(let n=0;n<current.length;n++)if(current[n]===2){const c=demonMaterialColor(n);if(demonEdge[n]){if(c.join(',')!==outlineColor.join(','))return false;edge++;}else inside++;}return edge>0&&inside>0;}),'grown helmet has outline and coloured interior');await stage(f,'draw');await f.locator('[data-color="#4853F8"]').click();await size(f,12);await stroke(f,[160,135]);await stage(f,'attach');await put(f,'T_tara',[160,130]);assert.equal((await report(f,'helmet-customized')).success,true);await snap('helmet-restored');await complete(f);f=await waitPhase(2);
   if(process.argv.includes('--helmet-only')){assert.deepEqual(errors,[]);console.log(name,'helmet restoration, creative styling and phase transition passed');continue;}
  }
  assert(await f.evaluate(()=>{const a=demonBeautyStatus();return a===demonBeautyStatus();}),'unchanged grading reuses its result');
  await snap('royal-orders');assert.equal(await p.evaluate(()=>fullflow.story.successLocked),false);
  assert(await f.evaluate(()=>['earL','earR','tip','longHair','brow','browRight','eyelidLeft','eyelidRight','lips'].every(k=>demonMasks[k].some(Boolean))),'required masks must have actual resource pixels');
  const trim='current[n]&&(demonMasks.earL[n]||demonMasks.earR[n]||demonMasks.eyes[n]||demonMasks.longHair[n]||demonMasks.tip[n]&&!demonMasks.tipKeep[n])';
  // A horizontal cut through the long hair must release detached chunks.
  await size(f,1);await stroke(f,[50,204],[275,204]);
  assert(await f.evaluate(()=>fallingPieces.length>0),'cut hair falls with the shared effect');
  await mask(f,trim,1);await f.locator('[data-tool="grow"]').click();await mask(f,'demonMasks.tipKeep[n]&&!current[n]',1,true);await mask(f,'demonMasks.tipKeep[n]&&!current[n]',1,true);
  await report(f,'shape');await snap('royal-shape');assert.equal((await f.evaluate(()=>demonBeautyStatus())).checks[0],true);
  await stage(f,'draw');await f.locator('[data-color="#18151F"]').click();await mask(f,'current[n]',4);await mask(f,'current[n]&&paint[n*4+3]<242',2);
  await f.locator('[data-color="#ECEBF4"]').click();await size(f,2);await stroke(f,[160,70],[160,100]);
  await f.locator('[data-color="#18151F"]').click();
  // Draw the visible original brows, independently of the grading mask.
  await size(f,3);await stroke(f,[121,145],[157,145]);await stroke(f,[179,145],[215,145]);
  const brows=await report(f,'original-brows-only');
  assert(brows.metrics.browLeft>=.70&&brows.metrics.browRight>=.70,'ordinary brow-body dye passes');
  assert(!brows.metrics.eyelidLeft&&!brows.metrics.eyelidRight,'brow dye does not count as eyelids');
  assert(await f.evaluate(()=>!demonMasks.brow.some((v,n)=>(v||demonMasks.browRight[n])&&(demonMasks.eyelidLeft[n]||demonMasks.eyelidRight[n]))),'brow and crease masks are separate');
  await snap('original-brows');
  await size(f,1);await stroke(f,[121,151],[145,151]);await stroke(f,[145,151],[155,155]);
  await stroke(f,[175,155],[185,151]);await stroke(f,[185,151],[211,151]);
  await f.locator('[data-color="#FF3024"]').click();await size(f,1);await f.locator('#paintOpacity').fill('20');await f.locator('#paintOpacity').dispatchEvent('input');await stroke(f,[157,195],[177,195]);
  const makeup=await report(f,'makeup');assert(makeup.metrics.lips,'thin 20% red lips');assert(makeup.metrics.eyelidLeft&&makeup.metrics.eyelidRight,'both thin eyelid creases');
  await f.locator('#paintOpacity').fill('100');await f.locator('#paintOpacity').dispatchEvent('input');await f.locator('[data-color="#18151F"]').click();
  await report(f,'paint');await snap('royal-paint');assert.equal((await f.evaluate(()=>demonBeautyStatus())).checks[1],true);
  const protestBefore=await f.evaluate(()=>demonLastProtest);
  await f.locator('[data-color="#A439F4"]').click();await size(f,12);await stroke(f,[140,182]);
  const freestyle=await report(f,'free-face-paint');assert(freestyle.metrics.facePaintCore>Math.max(6,Math.floor(freestyle.metrics.visibleFace*.02)),'paint exceeds the retired cleanliness allowance');assert.equal(freestyle.checks[1],true,'cheek decorations are allowed');
  assert.equal(await f.evaluate(()=>demonLastProtest),protestBefore,'free face colour does not trigger a protest');
  await snap('free-face-paint');
  await stage(f,'attach');
  await put(f,'T_tara',[166,26]);assert.equal((await report(f,'tiara-only')).success,true);
  await put(f,'T_earring_L',[110,180]);assert.equal((await f.evaluate(()=>demonBeautyStatus())).checks[2],false,'earrings are no longer an accepted accessory');await stroke(f,[110,180]);
  await stroke(f,[166,26]);await put(f,'T_hornBig_L',[106,66]);assert.equal((await f.evaluate(()=>demonBeautyStatus())).checks[2],false,'both horns are required');
  await put(f,'T_hornBig_R',[230,66]);assert.equal((await report(f,'large-horn-pair')).success,true);
  await snap('royal-complete');assert.equal(await f.locator('.requestItem:not(.complete)').count(),0);
  await complete(f);for(let n=0;n<12&&!await p.locator('#demonFinishHome').isVisible();n++){await p.waitForTimeout(300);await talks();}await p.waitForSelector('#demonFinishHome');assert.equal(await p.evaluate(()=>fullflow.story.demonPhase),2);assert.equal(await p.evaluate(()=>fullflow.story.successLocked),true);assert(!(await p.locator('#storyBattle').getAttribute('srcdoc')));await p.locator('#demonViewPhoto').click();await f.locator('#demonSelfie.captured').waitFor();await snap('handsome-selfie');
  if(!publicRun){
   f=await begin();await enter(f);await f.locator('[data-tool="hammer"]').click();await size(f,18);outer:for(let y=177;y<253;y+=12)for(let x=105;x<230;x+=12){if(await p.locator('#talkLayer').isVisible())break outer;await stroke(f,[x,y]);const r=await f.evaluate(()=>demonBeautyStatus());if(r.metrics.exposure>=.15&&r.metrics.exposure<.35)assert.equal(r.sudden,false);if(r.sudden)break outer;}await talks();await p.waitForSelector('#demonRetryBeauty');assert((await f.evaluate(()=>demonBeautyStatus())).metrics.exposure>=.35);assert.equal(await p.evaluate(()=>fullflow.story.demonPhase),1);await snap('warning-35');await p.locator('#demonRetryBeauty').click();await waitPhase(1);
   for(const stars of [0,1,2]){f=await begin();await p.evaluate(n=>__demonFixture.stars(n),stars);f=await frame();await f.locator('#openShopBtn').click();await f.locator('.demonCinema button').click();await p.waitForSelector('#demonRestart');await p.locator('#demonRestart').click();await p.locator('#cancelStoryStart').click();}
   await p.evaluate(()=>__demonFixture.closing());const closing=await p.locator('#storyClosing').elementHandle().then(h=>h.contentFrame());await closing.waitForLoadState('domcontentloaded');await closing.evaluate(()=>parent.postMessage({source:'yachacha-closing',type:'next-day',token:new URLSearchParams(location.search).get('story'),stars:3},location.origin));await frame();await p.waitForFunction(()=>fullflow.story?.guest===10007);assert.equal(await p.evaluate(()=>fullflow.story.followers),6100);
  }
  assert.deepEqual(errors,[]);console.log(name,'two beauty phases, horns or tiara, free face painting, selfie and gates passed');
 }catch(e){await snap('failure-debug');console.error(errors);throw e;}finally{await browser.close();}
}
server.close();
