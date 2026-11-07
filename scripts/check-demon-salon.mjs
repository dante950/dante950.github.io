import {checkPortraitRendering} from './check-salon-performance.mjs';
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import http from 'node:http';import path from 'node:path';
const root=path.resolve('dist'),out=path.resolve('docs/demon-two-phase-2026-11-06');await fs.mkdir(out,{recursive:true});
// Fixtures are injected by this test server only; the published bundle has no setters.
const server=http.createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))throw Error();let bytes=await fs.readFile(f);if(/^app\..*\.js$/.test(path.basename(f)))bytes=Buffer.concat([bytes,Buffer.from("\nwindow.__demonFixture={result(phase,event){const g=story.project.guests.find(g=>g.id===10007);modelRows(story.project,'대사').find(l=>l.GroupID===g.demonResultDialogue[phase][event]).Text='결과 연결 확인 '+phase+' '+event;},exterior(){modelRows(story.project,'대사').find(r=>r.GroupID===story.guest.bindings.exterior).Text='마왕님,<wait=0.1> 외부 등장 연결 확인입니다.';},phase(n){changeDemonPhase(n);},stars(n){story.stars=n;loadSalon(story.guest);},closing(){story=createStoryState(copy(BASE),10006);story.stars=3;story.followers=6100;story.records=[{day:3,id:10006,name:'취업 성공 좀비',gain:1100,before:5000,after:6100,beautySuccess:true}];showPage('story');settlement();}};\n")]);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(bytes);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.argv.includes('--url')?process.argv[process.argv.indexOf('--url')+1]:'http://127.0.0.1:'+server.address().port;const publicRun=process.argv.includes('--url');

for(const [name,engine]of (process.argv.includes('--chromium')?[['chromium',chromium]]:process.argv.includes('--webkit')?[['webkit',webkit]]:[['chromium',chromium],['webkit',webkit]])){
 const browser=await engine.launch({channel:name==='chromium'?process.env.YACHACHA_BROWSER_CHANNEL:undefined}),p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const snap=label=>p.screenshot({path:path.join(out,(publicRun?'public-':'')+name+'-'+label+'.png')});
 async function talks(stopAtEnding=false){let idle=0;for(let i=0;i<350;i++){await p.waitForTimeout(80);if(stopAtEnding&&await p.evaluate(()=>window.__endingEvents?.length>0))return;if(await p.locator('#beautyChoices').isVisible()){idle=0;await p.locator('#beautyAccept').click();await p.locator('#beautyChoices').waitFor({state:'hidden'});}else if(await p.locator('#talkLayer').isVisible()){idle=0;await p.locator('#talkNext').focus();await p.keyboard.press('f');}else if(++idle>=6)return;}throw Error('Dialogue stalled');}
 async function frame(){const f=await p.locator('#salon').elementHandle().then(h=>h.contentFrame());await f.waitForFunction(()=>window.beautyDebug?.ready);return f;}
 async function begin(){await p.goto(base);await p.waitForFunction(()=>window.fullflow);await p.locator('#play').click();await p.locator('[data-start-guest="10007"]').click();return frame();}
 let checkExterior=true;
 async function enter(f,skip=true){
  const verify=checkExterior&&!publicRun;checkExterior=false;if(verify)await p.evaluate(()=>__demonFixture.exterior());
  await f.locator('#openShopBtn').click();
  if(verify){await p.waitForFunction(()=>document.querySelector('#talkText').textContent.includes('외부 등장 연결 확인입니다.'));await snap('exterior-dialogue-binding');await talks();}
  if(skip)await f.locator('.demonCinema button').click();else{for(let i=0;i<400;i++){await talks();if(await f.locator('#demonStanding').isVisible()||await f.evaluate(()=>salonLab.customerPhase==='seated'))break;await p.waitForTimeout(100);}}await talks();await f.waitForFunction(()=>salonLab.customerPhase==='seated');await snap('room');await f.locator('.childExit').click();await talks();await f.waitForFunction(()=>beautyActive&&!briefing);}
 async function stage(f,key){await f.locator('[data-phase="'+key+'"]').click();await talks();await f.waitForFunction(()=>!briefing);}
 async function stroke(f,a,b=a){const r=await f.locator('.sculptCanvas').boundingBox();await p.mouse.move(r.x+a[0]/320*r.width,r.y+a[1]/350*r.height);await p.mouse.down();await p.mouse.move(r.x+b[0]/320*r.width,r.y+b[1]/350*r.height,{steps:1});await p.mouse.up();}
 async function size(f,n){await f.locator('#sculptSize').fill(String(n));await f.locator('#sculptSize').dispatchEvent('input');}
 async function mask(f,expression,brush=1,reverse=false){await size(f,brush);const runs=await f.evaluate(({expression,reverse})=>{const selected=new Function('n','return '+expression),runs=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!selected(y*W+x))continue;let end=x;while(end+1<W&&selected(y*W+end+1))end++;runs.push([[x*2+1,y*2+1],[end*2+1,y*2+1]]);x=end;}return reverse?runs.reverse():runs;},{expression,reverse});for(const [a,b]of runs)await stroke(f,a,b);console.log(name,expression.slice(0,40),runs.length);}
 const report=async(f,label)=>{const r=await f.evaluate(()=>demonBeautyStatus());console.log(label,JSON.stringify(r));return r;};
 async function complete(f,stopAtEnding=false){
  await stage(f,'attach');
  const preview=await p.evaluate(()=>!!fullflow.story?.preview);
  const phase=await f.evaluate(()=>demonPhase);const resultEvent=await f.evaluate(()=>demonBeautyStatus().success?'normal':'fail');
  if(!preview&&!publicRun)await p.evaluate(({phase,resultEvent})=>__demonFixture.result(phase,resultEvent),{phase,resultEvent});
  await p.evaluate(()=>{window.__beautyResults=0;window.__resultListener&&removeEventListener('message',window.__resultListener);window.__resultListener=e=>{if(e.source===document.querySelector('#salon').contentWindow&&e.data?.type==='beauty-result')window.__beautyResults++;};addEventListener('message',window.__resultListener);});
  await f.locator('.beautyNext').click();
  await p.waitForFunction(()=>window.__beautyResults===1);
  assert.equal(await f.evaluate(()=>beautyResultActive||resultRevealed||beautyScreen.classList.contains('resultPlaying')),false);
  assert(await f.locator('#beautyResultContinue').isHidden());
  assert.equal(await f.locator('.beautyResultCaption').textContent(),'');
  if(!preview){await p.locator('#talkLayer').waitFor({state:'visible'});assert.doesNotMatch(await p.locator('#talkText').textContent(),/반차 결재|수정 요청/);}
  if(!preview&&!publicRun)await p.waitForFunction(marker=>document.querySelector('#talkText').textContent.includes(marker),'결과 연결 확인 '+phase+' '+resultEvent);
  await talks(stopAtEnding);
  assert.equal(await p.evaluate(()=>window.__beautyResults),1,'one completion message without a common result screen');
 }
 async function waitPhase(n){await p.waitForFunction(n=>fullflow.story?.demonPhase===n&&document.querySelector('#salon').style.opacity==='1',n);let f=await frame();await f.waitForFunction(()=>beautyActive);await talks();await f.waitForFunction(()=>!briefing);return f;}
 async function put(f,id,xy){await f.locator('[data-sticker="ST-RESOURCE-'+id+'"]').click();await stroke(f,xy);}
 try{
  if(!publicRun){let f;
   await p.goto(base);await p.waitForFunction(()=>window.fullflow);await p.locator('#developer').click();if(await p.locator('#updateOK').isVisible())await p.locator('#updateOK').click();
   await p.locator('[data-editor="dialogue"]:visible').first().click();await p.locator('#dialogueGuest').selectOption('10007');await p.locator('#dialogueEvent').selectOption('exterior');
   assert.equal(await p.locator('#dialogueEvent option:checked').textContent(),'미용실 외부 등장 씬');assert.match(await p.locator('[data-line-text]').first().inputValue(),/^마왕님,/);await snap('exterior-dialogue-editor');
   await p.locator('[data-editor="beauty"]:visible').first().click();await p.locator('#beautyGuest').selectOption('10007');
   assert.equal(await p.locator('#workshopDemonPhase').inputValue(),'1');
   const helmetImage=await p.locator('#regionStage .layeredPortrait').getAttribute('src');
   const helmetRequest=await p.locator('[data-field="request"]').inputValue();
   await p.locator('#workshopDemonPhase').selectOption('2');
   assert.equal(await p.locator('#toolSelect').inputValue(),'scissors');
   assert.notEqual(await p.locator('#regionStage .layeredPortrait').getAttribute('src'),helmetImage);
   assert.match(await p.locator('[data-field="request"]').inputValue(),/내 얼굴/);
   await p.locator('[data-field="growth.color"]').fill('#d8d0e0');await p.locator('[data-field="growth.color"]').dispatchEvent('change');
   await p.locator('[data-field="request"]').fill('작업실 미형 대사 확인입니다.');await p.locator('[data-field="request"]').dispatchEvent('change');
   await p.locator('#workshopDemonPhase').selectOption('1');
   assert.equal(await p.locator('#toolSelect').inputValue(),'hammer');
   assert.equal(await p.locator('[data-field="growth.color"]').inputValue(),'#242236');
   assert.equal(await p.locator('[data-field="request"]').inputValue(),helmetRequest);
   await p.locator('#workshopDemonPhase').selectOption('2');
   assert.equal(await p.locator('[data-field="growth.color"]').inputValue(),'#d8d0e0');
   await snap('workshop-phase-two');
   await p.locator('[data-editor="dialogue"]:visible').first().click();await p.locator('#dialogueEvent').selectOption('cut');
   assert.equal(await p.locator('#dialogueDemonPhase').inputValue(),'2');
   assert.equal(await p.locator('#beautyRequestText').inputValue(),'작업실 미형 대사 확인입니다.');
   await p.locator('#dialogueDemonPhase').selectOption('1');
   assert.equal(await p.locator('#beautyRequestText').inputValue(),helmetRequest);
   await p.locator('#dialogueDemonPhase').selectOption('2');
   await p.locator('#dialogueEvent').selectOption('normal');
   assert(await p.locator('[data-line-text]').count()>0);
   await p.locator('[data-line-text]').first().fill('작업실 성공 대사 수정 확인');
   await p.locator('#dialogueDemonPhase').selectOption('1');
   assert.notEqual(await p.locator('[data-line-text]').first().inputValue(),'작업실 성공 대사 수정 확인');
   await p.locator('#dialogueDemonPhase').selectOption('2');
   assert.equal(await p.locator('[data-line-text]').first().inputValue(),'작업실 성공 대사 수정 확인');
   await p.locator('#previewGroup').click();
   await p.waitForFunction(()=>document.querySelector('#talkText').textContent.includes('작업실 성공 대사 수정 확인'));await talks();
   await p.locator('#dialogueEvent').selectOption('fail');assert(await p.locator('[data-line-text]').count()>0);
   await p.locator('[data-editor="beauty"]:visible').first().click();await p.locator('#beautyTry').click();await p.locator('#previewStart').click();
   f=await frame();await p.waitForFunction(()=>document.querySelector('#talkText').textContent.includes('작업실 미형 대사 확인입니다.'));
   await talks();await f.waitForFunction(()=>beautyActive&&!briefing);
   assert.equal(await f.evaluate(()=>demonPhase),2);assert.equal(await f.evaluate(()=>B.growth.color),'#d8d0e0');
   assert.equal(await p.evaluate(()=>fullflow.story.preview),true);
   assert.equal(await f.locator('.demonCinema').count(),0);
   await snap('workshop-phase-two-trial');
   await complete(f);await p.locator('#returnBeauty').click();
   assert.equal(await p.locator('#workshopDemonPhase').inputValue(),'2');
   assert.equal(await p.locator('[data-field="growth.color"]').inputValue(),'#d8d0e0');
   await p.locator('#workshopDemonPhase').selectOption('1');await p.locator('#beautyTry').click();await p.locator('#previewStart').click();
   f=await frame();await talks();await f.waitForFunction(()=>beautyActive&&!briefing);
   assert.equal(await f.evaluate(()=>demonPhase),1);
   await f.locator('[data-tool="hammer"]').click();await size(f,22);
   previewDamage:for(let y=177;y<253;y+=12)for(let x=105;x<230;x+=12){
    if(await p.locator('#returnBeauty').isVisible())break previewDamage;await stroke(f,[x,y]);if(await f.evaluate(()=>demonSudden))break previewDamage;
   }
   await p.locator('#returnBeauty').waitFor();assert.equal(await p.locator('#demonRetryBeauty').count(),0);
   await p.locator('#returnBeauty').click();assert.equal(await p.locator('#workshopDemonPhase').inputValue(),'1');
   await p.locator('#beautyGuest').selectOption('10001');assert.equal(await p.locator('#workshopDemonPhase').count(),0);
   console.log('workshop: phase-specific edit, dialogue, direct trials, return, and sudden-failure isolation passed');

  }
  let f=await begin();if(process.argv.includes('--phase2')&&!publicRun){await p.evaluate(()=>__demonFixture.phase(2));f=await waitPhase(2);}else{
   await enter(f,!process.argv.includes('--cinema'));await snap('helmet');await checkPortraitRendering(f,'demon-helmet');await f.locator('[data-tool="grow"]').click();await mask(f,'demonMasks.horn[n]&&!current[n]',4);await stage(f,'draw');await f.locator('[data-color="#242236"]').click();await mask(f,'demonMasks.scratch[n]',4);
   assert.equal((await report(f,'helmet')).success,true);await stage(f,'cut');await f.locator('[data-tool="grow"]').click();await size(f,8);const edge=await f.evaluate(()=>{const y=65;let x=0;while(x<W&&!current[y*W+x])x++;return [x*2+1,y*2+1];});await stroke(f,edge,[edge[0]-10,edge[1]]);assert(await f.evaluate(()=>{prepareDemonGeometry();let edge=0,inside=0;for(let n=0;n<current.length;n++)if(current[n]===2){const c=demonMaterialColor(n);if(demonEdge[n]){if(c.join(',')!==outlineColor.join(','))return false;edge++;}else inside++;}let seams=0;for(let n=0;n<current.length;n++)if(current[n]&&demonOldEdge[n]&&demonJoined[n]&&!demonEdge[n]){const expected=demonPhase===1&&demonMasks.horn[n]?demonTarget:demonGrowthColors;if(demonMaterialColor(n).join(',')!==expected.subarray(n*4,n*4+3).join(','))return false;seams++;}return edge>0&&inside>0&&seams>0;}),'grown helmet has outline, local material colour and a joined seam');await snap('helmet-growth-joined');
   assert(await f.evaluate(()=>{
    prepareDemonGeometry();let repaired=0;
    for(let n=0;n<current.length;n++)if(current[n]&&demonMasks.horn[n]&&demonJoined[n]&&!demonEdge[n]){
     const i=n*4,c=demonMaterialColor(n);if(c.join(',')!==demonTarget.subarray(i,i+3).join(','))return false;
     if(original[n]&&Math.max(...sourcePixels.subarray(i,i+3))<80)repaired++;
    }
    return repaired>0;
   }),'restored horn replaces the original black fracture inside the blue surface');
   // Reproduce broad growth on both cheeks and around the horn, then return to the
   // player's earlier state so this visual regression cannot satisfy the beauty exam.
   const growthEvidence=await f.evaluate(()=>{
    const before=current.slice(),beforePaint=paint.slice(),beforeSource=sourcePixels.slice();
    const savedTouched={...touched},savedTool=activeTool,previousGesture=gesture;
    const counts={};gesture={paint:paint.slice()};activeTool='grow';
    for(const [name,a,b,r]of [['left',{x:47,y:140},{x:25,y:200},16],['right',{x:265,y:140},{x:290,y:200},16],['horn',{x:242,y:70},{x:260,y:30},10]]){
     applyDemonStroke(strokeCells(W,H,[a,b],r),'grow');prepareDemonGeometry();
     counts[name]=current.reduce((sum,v,n)=>sum+ +(v===2&&!before[n]),0);
    }
    beautyPixelRevision++;renderPortrait(false);
    const colors=new Set();let outlined=0,filled=0,joined=0;
    for(let n=0;n<current.length;n++)if(current[n]===2){
     const c=demonMaterialColor(n);if(demonEdge[n])outlined++;else {colors.add(c.join(','));filled++;}
    }
    for(let n=0;n<current.length;n++)if(current[n]&&demonOldEdge[n]&&demonJoined[n]&&!demonEdge[n])joined++;
    const png=portrait.toDataURL('image/png'),sourceUnchanged=sourcePixels.every((v,i)=>v===beforeSource[i]);
    current.set(before);paint.set(beforePaint);Object.assign(touched,savedTouched);gesture=previousGesture;activeTool=savedTool;
    demonGeometryDirty=true;demonScoreCache=null;beautyPixelRevision++;updateBeautyScore();renderPortrait(false);
    return {counts,outlined,filled,joined,colors:[...colors],sourceUnchanged,png};
   });
   assert(growthEvidence.counts.left>0&&growthEvidence.counts.right>growthEvidence.counts.left&&growthEvidence.counts.horn>growthEvidence.counts.right);
   assert(growthEvidence.outlined>0&&growthEvidence.filled>0&&growthEvidence.joined>0);
   assert(growthEvidence.colors.length<=2,'new helmet material uses metal/horn colours without streaks');
   assert(growthEvidence.sourceUnchanged,'growth never rewrites the PNG source, including on cancellation');
   await fs.writeFile(path.join(out,name+'-helmet-growth-stress.png'),Buffer.from(growthEvidence.png.split(',')[1],'base64'));
   console.log('HELMET_GROWTH_PREVIEW '+growthEvidence.png);
   console.log('helmet-growth-stress',JSON.stringify({...growthEvidence,png:undefined}));
await stage(f,'draw');await f.locator('[data-color="#4853F8"]').click();
   const eyeProtestBefore=await f.evaluate(()=>demonLastProtest);
   await mask(f,'demonMasks.eyeOpening[n]',1);
   assert((await f.evaluate(()=>demonBeautyStatus())).metrics.eyePaint>.15,'eye paint exceeds the retired limit');
   assert.equal(await f.evaluate(()=>demonLastProtest),eyeProtestBefore,'helmet eye colour is free');
   await size(f,12);await stroke(f,[160,135]);await stage(f,'attach');
   const guideBefore=await f.evaluate(()=>zonesVisible);if(!guideBefore)await f.locator('#showBeautyZones').click();await snap('helmet-full-face-sticker-guide');if(!guideBefore)await f.locator('#showBeautyZones').click();
   const stickerProtestBefore=await f.evaluate(()=>demonLastProtest);
   await put(f,'T_tara',[145,205]);
   assert((await f.evaluate(()=>demonBeautyStatus())).metrics.decorEyes>.05,'sticker can cover the eye opening');
   assert.equal(await f.evaluate(()=>demonLastProtest),stickerProtestBefore,'helmet sticker location is free');
   assert.equal((await report(f,'helmet-customized')).success,true);await snap('helmet-restored');await complete(f);f=await waitPhase(2);
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
  assert.equal((await f.evaluate(()=>demonBeautyStatus())).requirements.draw[0],false,'silver bridge outside the central forelock fails');
  await f.locator('[data-color="#18151F"]').click();await stroke(f,[160,70],[160,100]);
  await f.locator('[data-color="#ECEBF4"]').click();await size(f,1);await stroke(f,[176,110],[176,138]);
  assert.equal((await f.evaluate(()=>demonBeautyStatus())).requirements.draw[0],true,'thin central forelock bridge passes');
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
  await put(f,'T_tara',[166,26]);assert.equal((await report(f,'tiara-only')).success,false,'crown alone is incomplete');
  await put(f,'T_hornBig_L',[106,66]);assert.equal((await f.evaluate(()=>demonBeautyStatus())).checks[2],false,'both horns are required');
  await put(f,'T_hornBig_R',[230,66]);assert.equal((await report(f,'horn-pair-and-tiara')).success,true);
  const extraProtestBefore=await f.evaluate(()=>demonLastProtest);
  await put(f,'T_earring_L',[110,180]);await put(f,'T_Cross',[233,180]);
  assert.equal((await report(f,'royal-extra-stickers')).success,true,'all additional stickers are allowed');
  assert.equal(await f.evaluate(()=>demonLastProtest),extraProtestBefore,'extra stickers do not trigger protests');
  await stroke(f,[166,26]);assert.equal((await report(f,'horn-pair-without-crown')).success,false,'horns also require a crown');
  await put(f,'T_blackCrown',[166,26]);assert.equal((await report(f,'horn-pair-and-black-crown')).success,true);
  await snap('royal-complete');await checkPortraitRendering(f,'demon-royal');assert.equal(await f.locator('.requestItem:not(.complete)').count(),0);
  await p.evaluate(()=>{window.__endingEvents=[];window.addEventListener('yachacha-ending-ready',e=>window.__endingEvents.push(e.detail));});
  await complete(f,true);
  await f.waitForFunction(()=>!beautyActive&&dialogueState.active&&salonLab.customerPhase==='cutscene'&&document.querySelector('#demonEndingRoom'));
  await p.waitForFunction(()=>window.__endingEvents.length===1);
  const ending=await p.evaluate(()=>window.__endingEvents[0]);
  assert.equal(ending.ending,'beauty');assert.equal(ending.form,'handsome');assert.equal(ending.status,'ready');assert(ending.portrait.startsWith('data:image/'));
  assert.equal(await f.locator('#demonStanding').getAttribute('src'),ending.portrait);
  assert.equal(await p.evaluate(()=>fullflow.story.demonPhase),2);assert.equal(await p.evaluate(()=>fullflow.story.successLocked),true);
  assert(!(await p.locator('#storyBattle').getAttribute('srcdoc')));
  assert.equal(await f.locator('#demonSelfie,#demonPhotoExit').count(),0);assert.equal(await p.locator('#demonFinishHome,#demonViewPhoto').count(),0);
  assert(await f.locator('#demonStanding').isHidden());assert(!(await f.locator('#beautyScreen').isVisible()));
  await p.locator('#salon').focus();const before=await f.evaluate(()=>state.x);await p.keyboard.down('d');await p.waitForTimeout(180);await p.keyboard.up('d');assert.equal(await f.evaluate(()=>state.x),before,'ending cutscene holds player movement');
  await f.evaluate(()=>send('demon-room-ready'));await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>window.__endingEvents.length),1);
  assert.equal(await p.locator('#storyHint').isVisible(),false);assert(await f.locator('#demonEndingRoom').isVisible());
  await snap('handsome-room-return');
  if(!publicRun){
   f=await begin();await enter(f);await f.locator('[data-tool="hammer"]').click();await size(f,18);outer:for(let y=177;y<253;y+=12)for(let x=105;x<230;x+=12){if(await p.locator('#talkLayer').isVisible())break outer;await stroke(f,[x,y]);const r=await f.evaluate(()=>demonBeautyStatus());if(r.metrics.exposure>=.15&&r.metrics.exposure<.35)assert.equal(r.sudden,false);if(r.sudden)break outer;}await talks();await p.locator('#battleHost').waitFor({state:'visible'});assert((await f.evaluate(()=>demonBeautyStatus())).metrics.exposure>=.35);assert.equal(await p.evaluate(()=>fullflow.story.demonPhase),1);await snap('warning-35');const battleFrame=await p.locator('#storyBattle').elementHandle().then(h=>h.contentFrame());await battleFrame.locator('#arena').click({position:{x:10,y:10}});await p.locator('#retryBeauty').waitFor({timeout:180000});await p.locator('#retryBeauty').click();await waitPhase(1);
   for(const stars of [0,1,2]){f=await begin();await p.evaluate(n=>__demonFixture.stars(n),stars);f=await frame();await f.locator('#openShopBtn').click();await f.locator('.demonCinema button').click();await p.waitForSelector('#demonRestart');await p.locator('#demonRestart').click();await p.locator('#cancelStoryStart').click();}
   await p.evaluate(()=>__demonFixture.closing());const closing=await p.locator('#storyClosing').elementHandle().then(h=>h.contentFrame());await closing.waitForLoadState('domcontentloaded');await closing.evaluate(()=>parent.postMessage({source:'yachacha-closing',type:'next-day',token:new URLSearchParams(location.search).get('story'),stars:3},location.origin));await frame();await p.waitForFunction(()=>fullflow.story?.guest===10007);assert.equal(await p.evaluate(()=>fullflow.story.followers),6100);
  }
  assert.deepEqual(errors,[]);console.log(name,'two beauty phases, horn pair AND either crown, free face painting, dialogue effects, room handoff and gates passed');
 }catch(e){await snap('failure-debug');console.error(errors);throw e;}finally{await browser.close();}
}
server.close();
