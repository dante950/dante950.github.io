import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {checkFacePaint} from './face-paint-checks.mjs';
import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';
const root=path.resolve('dist');
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const file=path.join(root,name==='/'?'index.html':name);const b=await fs.readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.YACHA_BEAUTY_URL||'http://127.0.0.1:'+server.address().port;
const output=process.env.YACHA_BEAUTY_SCREENSHOTS;
if(output)await fs.mkdir(output,{recursive:true});
async function finishRequest(page,salon,{screenshot,clarify=true}={}){
 await page.locator('#talkLayer').waitFor();
 assert.equal(await salon.locator('.sculptStatus').isVisible(),false,'the note waits until the request has ended');
 assert(await salon.locator('.beautyNext').isDisabled(),'no stage skipping during a request');
 const shape=await material(salon);
 const frames=new Set(),mouths=new Set();
 for(let i=0;i<8;i++){
  const sample=await salon.evaluate(()=>({frame:beautyDebug.mouthFrame,mouth:Array.from(document.querySelector('.sculptCanvas').getContext('2d').getImageData(68,77,27,12).data).join(',')}));
  frames.add(sample.frame);mouths.add(sample.mouth);await page.waitForTimeout(75);
 }
 assert.equal(frames.size,2,'the mouth cycles while the guest speaks');
 assert(mouths.size>1,'the mouth pixels visibly animate');
 assert.deepEqual(await material(salon),shape,'speaking cannot edit hair or scoring masks');
 await page.locator('#beautyChoices').waitFor();
 const briefText=await page.locator('#talkText').textContent();
 const highlighted=await page.locator('#talkText .glyph').evaluateAll(gs=>gs.some(g=>getComputedStyle(g).color!=='rgb(73, 54, 39)'));assert(highlighted,'request keywords use the existing color markup');
 const hasQuestion=await page.locator('#beautyAsk').isVisible();
 if(screenshot&&output)await page.screenshot({path:path.join(output,'initial-'+screenshot)});
 assert.equal(await page.locator('.talkbox').evaluate(b=>getComputedStyle(b).backgroundColor),'rgb(255, 248, 233)');
 if(clarify&&hasQuestion){
  await page.locator('#beautyAsk').click();await page.waitForTimeout(650);
  assert(await salon.locator('.beautyNext').isDisabled());
  await page.locator('#beautyChoices').waitFor();
  assert.notEqual(await page.locator('#talkText').textContent(),briefText);assert.equal(await page.locator('#beautyAsk').isVisible(),false);
 }
 const bubble=await page.locator('.talkbox').boundingBox(),room=await salon.locator('#beautyScreen').boundingBox();
 assert(bubble.y>room.y+room.height*.7&&bubble.y+bubble.height<room.y+room.height,'speech stays on the counter');
 if(screenshot&&output)await page.screenshot({path:path.join(output,screenshot)});
 await page.locator('#beautyAccept').click();
 await page.locator('#talkLayer').waitFor({state:'hidden'});await salon.waitForFunction(()=>!beautyDebug.briefing);
 assert(await salon.locator('.sculptStatus').isVisible());
 const noteBefore=await salon.locator('.requestText').textContent();
 await salon.locator('#repeatBeautyRequest').click();await page.locator('#talkLayer').waitFor();
 await page.waitForTimeout(200);await page.locator('#beautyChoices').waitFor();
 if(clarify)assert.equal(await page.locator('#beautyAsk').isVisible(),false,'repeat keeps the detailed request already heard');
 await page.locator('#beautyAccept').click();await salon.waitForFunction(()=>!beautyDebug.briefing);
 assert.equal(await salon.locator('.requestText').textContent(),noteBefore,'repeat does not change the accepted memo');
 const note=await salon.locator('.sculptStatus').textContent();
 assert(!/Tag_|점수|안경|콧수염|나비넥타이|장식 \d\/5/.test(note));
 assert.equal(await salon.locator('.requestSatisfaction,.satisfactionReadout').count(),0);
 assert.equal(await salon.locator('.goalList,.moodLabel').count(),0);
}
async function revisit(page,salon,stage){
 await salon.locator('[data-phase="'+stage+'"]').click();await page.waitForTimeout(150);
 assert.equal(await salon.evaluate(()=>beautyDebug.briefing),false,'a visited stage does not auto-play again');
 assert.equal(await page.locator('#talkLayer').isVisible(),false);assert(await salon.locator('.sculptStatus').isVisible());
 assert.equal(await salon.locator('.requestSatisfaction,.satisfactionReadout').count(),0);
}
async function nextStage(page,salon){await salon.locator('.beautyNext').click();await finishRequest(page,salon,{clarify:false});}
async function startPreview(page,id){
 await page.goto(base);await page.locator('#siteLoading').waitFor({state:'detached'});
 await page.locator('#developer').click();await page.locator('#updateOK').click();
 await page.locator('[data-editor="beauty"]').first().click();
 await page.locator('#beautyGuest').selectOption(String(id));
 await page.locator('#editorScreen [data-editor="dialogue"]').click();await page.locator('#dialogueEvent').selectOption('cut');
 const request=await page.locator('#beautyRequestText').inputValue();await page.locator('#beautyRequestText').fill(request+' 시험');
 await page.locator('#editorScreen [data-editor="beauty"]').click();assert.equal(await page.locator('[data-field="request"]').inputValue(),request+' 시험');await page.locator('[data-field="request"]').fill(request);await page.locator('[data-field="request"]').blur();
 await page.locator('#beautyTry').click();await page.locator('#previewStart').click();
 const salon=await page.locator('#salon').elementHandle().then(h=>h.contentFrame());
 await salon.waitForFunction(()=>window.beautyDebug?.ready);
 await salon.waitForFunction(()=>getComputedStyle(document.getElementById('beautyScreen')).opacity==='1');
 await finishRequest(page,salon,{screenshot:String(id)+'-request.png',clarify:id!==10003});
 return salon;
}
async function pointer(page,salon,x,y){
 const box=await salon.locator('.sculptCanvas').boundingBox();
 await page.mouse.move(box.x+x/320*box.width,box.y+y/350*box.height);
}
async function setRange(salon,id,value){await salon.locator(id).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function stroke(page,salon,from,to){await pointer(page,salon,...from);await page.mouse.down();await pointer(page,salon,...to);await page.mouse.up();}
const material=s=>s.evaluate(()=>beautyDebug.material);
const scores=s=>s.evaluate(()=>beautyDebug.scores);
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   let salon=await startPreview(page,10001);
   assert.equal(await salon.evaluate(()=>beautyDebug.expression),'neutral');
   assert.equal(await salon.locator('.beautyMood').count(),0);
   if(output)await page.screenshot({path:path.join(output,name+'-zombie-start.png')});
   // Reproduce the reported floating fragments on the untouched zombie sprite.
   await salon.locator('[data-tool="grow"]').click();await stroke(page,salon,[270,270],[270,280]);
   await salon.locator('[data-tool="scissors"]').click();await setRange(salon,'#sculptSize',5);
   await stroke(page,salon,[45,100],[275,100]);
   assert(await salon.evaluate(()=>beautyDebug.material.every((v,n)=>!beautyDebug.original[n]||Math.floor(n/160)*2<=106||!v)),'original bangs severed from the scalp do not remain on the face');
   assert.equal((await material(salon))[135*160+135],2,'an independent growth stroke survives cutting elsewhere');
   await page.waitForTimeout(350);if(output)await page.screenshot({path:path.join(output,name+'-zombie-detached-cleared.png')});
   // Start afresh so the existing gesture and score regressions retain their fixture.
   salon=await startPreview(page,10001);
   const initial=await material(salon);
   await pointer(page,salon,145,88);await page.mouse.down();await pointer(page,salon,145,126);
   assert.deepEqual(await material(salon),initial,'scissors are preview only while held');
   await page.mouse.up();assert.notDeepEqual(await material(salon),initial,'release removes the stroke without disconnecting the whole hair');
   const cutShape=await material(salon);assert.equal(await salon.locator('#undoBeauty').isVisible(),false);
   await page.keyboard.press('Control+z');assert.deepEqual(await material(salon),cutShape,'completed shape cuts are irreversible');assert.equal(await salon.evaluate(()=>beautyDebug.historyLength),0);
   // Cancelled pointer does not commit or leave an undo entry.
   await pointer(page,salon,145,88);await page.mouse.down();await pointer(page,salon,145,126);
   await salon.locator('.sculptCanvas').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();
   assert.deepEqual(await material(salon),cutShape);
   await salon.locator('[data-tool="grow"]').click();
   await stroke(page,salon,[78,85],[78,295]);
   const longHair=await material(salon);assert(longHair[Math.floor(280/2)*160+39]>0,'growth extends toward cape');
   await salon.locator('[data-tool="scissors"]').click();await stroke(page,salon,[78,240],[78,270]);
   assert.equal((await material(salon))[140*160+39],0,'cutting off the lower strand makes it fall');assert.equal((await material(salon))[130*160+39],0,'new material can be cut');assert((await material(salon))[110*160+39]>0,'uncut upper hair remains');
   await salon.locator('[data-tool="grow"]').click();await stroke(page,salon,[78,224],[78,270]);assert((await material(salon))[130*160+39]>0,'growth repairs a cut without Undo');
   // Independent tufts and material on the face are allowed.
   await stroke(page,salon,[270,270],[270,280]);assert.equal((await material(salon))[135*160+135],2);
   await stroke(page,salon,[160,152],[160,170]);assert.equal((await material(salon))[80*160+80],2,'growth can cover the zombie mouth');
   if(output)await page.screenshot({path:path.join(output,name+'-zombie-free-growth.png')});
   await salon.locator('[data-tool="scissors"]').click();await stroke(page,salon,[160,152],[160,170]);
   assert.equal((await material(salon))[80*160+80],0,'growth over the face can be removed again');
   // Complete the zombie request through real drags.
   await salon.locator('[data-tool="grow"]').click();await setRange(salon,'#sculptSize',18);
   for(const y of [20,45,70,95])await stroke(page,salon,[90,y],[225,y]);
   const merged=await salon.evaluate(()=>{
    const m=beautyDebug.material,o=beautyDebug.original,data=document.querySelector('.sculptCanvas').getContext('2d').getImageData(0,0,160,175).data;
    const result={original:[],added:[]};
    for(let y=20;y<32;y++)for(let x=45;x<106;x++){const n=y*160+x;if(m[n]!==2||![m[n-1],m[n+1],m[n-160],m[n+160]].every(Boolean))continue;result[o[n]?'original':'added'].push(Array.from(data.slice(n*4,n*4+4)).join(','));}
    return result;
   });
   assert(merged.original.length>0&&merged.added.length>0);
   assert.equal(new Set([...merged.original,...merged.added]).size,1,'growth over old sprite and added hair share one seamless material');
   if(output)await page.screenshot({path:path.join(output,name+'-zombie-merged.png')});
   await salon.locator('[data-tool="scissors"]').click();
   await stroke(page,salon,[106,110],[215,110]);
   const goodShape=await scores(salon);assert(goodShape.cut>65,JSON.stringify(goodShape));
   assert.equal(await salon.locator('.requestItem.complete').count(),2,'both shape requirements show checks');
   assert((await salon.locator('.requestItem.complete .requestLabel').first().evaluate(e=>getComputedStyle(e).textDecorationLine)).includes('line-through'));
   await salon.locator('[data-tool="grow"]').click();await stroke(page,salon,[106,110],[215,110]);
   assert.equal(await salon.locator('.requestItem.complete').count(),1,'covering eyes revokes the eye requirement');
   assert((await scores(salon)).live<goodShape.live);
   await salon.locator('[data-tool="scissors"]').click();await stroke(page,salon,[106,110],[215,110]);
   assert.equal(await salon.locator('.requestItem.complete').count(),2);
   if(output)await page.screenshot({path:path.join(output,name+'-zombie-checks.png')});
   const beforeDye=await material(salon);
   await nextStage(page,salon);assert.equal(await salon.evaluate(()=>salonLab.phase),'draw');
   await salon.locator('[data-color="#75452D"]').click();await stroke(page,salon,[165,42],[211,70]);
   assert.deepEqual(await material(salon),beforeDye,'dye changes no material');
   assert.equal((await scores(salon)).cut,goodShape.cut);
   assert((await salon.evaluate(()=>beautyDebug.paint)).some(v=>v>0));
   const painted=await salon.evaluate(()=>beautyDebug.paint);
   await salon.locator('#undoBeauty').click();assert(!(await salon.evaluate(()=>beautyDebug.paint)).some(v=>v>0),'color undo is still available');
   assert.deepEqual(await material(salon),beforeDye,'color Undo never restores a cut');
   await stroke(page,salon,[165,42],[211,70]);
   await stroke(page,salon,[12,260],[12,295]);assert.deepEqual(await salon.evaluate(()=>beautyDebug.paint),painted,'paint is clipped to the material');

   // Opacity uses one blend per gesture, then builds up on another stroke.
   await setRange(salon,'#paintOpacity',35);
   await salon.locator('[data-color="#FF3024"]').click();
   await stroke(page,salon,[100,25],[110,25]);
   const alpha=await salon.evaluate(()=>beautyDebug.paint[(12*160+52)*4+3]);assert.equal(alpha,89);
   const once=await salon.evaluate(()=>beautyDebug.paint);
   await stroke(page,salon,[100,25],[110,25]);
   assert.equal(await salon.evaluate(()=>beautyDebug.paint[(12*160+52)*4+3]),147);
   await salon.locator('#undoBeauty').click();assert.deepEqual(await salon.evaluate(()=>beautyDebug.paint),once);
   await setRange(salon,'#paintOpacity',100);
   await checkFacePaint(page,salon,[160,166],{screenshot:output?path.join(output,name+'-zombie-face-paint.png'):undefined});
   await nextStage(page,salon);assert.equal(await salon.evaluate(()=>salonLab.phase),'attach');
   await salon.locator('[data-sticker="ST-GENTLE-GLASSES-HORN"]').click();await stroke(page,salon,[116,105],[116,105]);
   assert.equal((await scores(salon)).attach,30);assert.equal(await salon.locator('.requestItem.complete').count(),1);
   assert.equal((await scores(salon)).live,100);assert.equal(await salon.locator('.requestSatisfaction').count(),0);
   await stroke(page,salon,[207,105],[207,105]);assert.equal((await scores(salon)).attach,15,'duplicate penalty applies');assert.equal(await salon.locator('.requestItem.complete').count(),0);
   await stroke(page,salon,[207,105],[207,105]);assert.equal((await scores(salon)).attach,30,'removing duplicate repairs score');
   await stroke(page,salon,[116,105],[116,105]);await stroke(page,salon,[160,108],[160,108]);
   const acceptedNote=await salon.locator('.requestText').textContent();
   await revisit(page,salon,'draw');await revisit(page,salon,'cut');await revisit(page,salon,'attach');await revisit(page,salon,'attach');
   assert.equal(await salon.locator('.requestText').textContent(),acceptedNote,'switching tabs preserves the vague memo without revealing detail');
   await salon.locator('#repeatBeautyRequest').click();await finishRequest(page,salon,{clarify:false});
   assert.equal((await material(salon))[135*160+135],2,'separate growth survives other strokes and all stage changes');
   const beforeTalking=await material(salon),expression=await salon.evaluate(()=>beautyDebug.expression);
   await page.evaluate(()=>{const f=document.getElementById('salon'),g=JSON.parse(f.contentDocument.getElementById('guest-data').textContent);f.contentWindow.postMessage({type:'beauty-speaking',token:g.token,speaking:true,open:true},'*');});
   await salon.waitForFunction(()=>document.getElementById('beautyCustomer').dataset.talking==='true');
   assert.deepEqual(await material(salon),beforeTalking);assert.equal(await salon.evaluate(()=>beautyDebug.expression),expression);
   if(output)await page.screenshot({path:path.join(output,name+'-zombie-complete.png')});
   await salon.locator('.beautyNext').click();await page.locator('#modalCard').filter({hasText:'미용 시험 완료'}).waitFor();assert(!/만족도|\d+\s*점|\d+\s*\/\s*100/.test(await page.locator('#modalCard').innerText()));
   console.log(name+': zombie speech, note, growth and undo checks passed');
   salon=await startPreview(page,10003);
   assert.equal(await salon.locator('.requestItem').count(),1,'the vague Sans request stays one combined idea');
   assert.equal(await salon.locator('.requestItem.complete').count(),0,'a vague unfinished request cannot be partly crossed out');
   await salon.locator('#repeatBeautyRequest').click();await finishRequest(page,salon);
   assert.equal(await salon.locator('.requestItem').count(),2,'clarifying reveals the separate trim and preservation requirements');
   const sansInitial=await material(salon);
   const protectedMask=await salon.evaluate(()=>Array.from(beautyDebug.masks.protectedFace));
   assert(protectedMask.some(Boolean),'provided feature art creates a fixed protection mask');
   const protectedCells=()=>salon.evaluate(()=>beautyDebug.material.filter((v,n)=>beautyDebug.masks.protectedFace[n]));
   const protectedBefore=await protectedCells();
   await salon.locator('[data-tool="hammer"]').click();await stroke(page,salon,[120,105],[200,156]);
   assert.deepEqual(await protectedCells(),protectedBefore,'hammer leaves eyes, nose and mouth untouched');
   await stroke(page,salon,[150,42],[180,44]);
   assert.equal((await material(salon))[21*160+80],0,'the surrounding forehead remains editable');
   await salon.locator('[data-tool="grow"]').click();await stroke(page,salon,[120,105],[200,156]);
   await stroke(page,salon,[120,105],[200,156]);
   assert.deepEqual(await protectedCells(),protectedBefore,'growth cannot hide or recolor the face features');
   await stroke(page,salon,[150,42],[180,44]);
   assert.equal((await material(salon))[21*160+80],1,'growth still restores editable original bone');
   await stroke(page,salon,[147,36],[147,6]);
   const bone=await material(salon);assert(bone[5*160+73]>0);
   await salon.locator('[data-tool="hammer"]').click();await stroke(page,salon,[147,8],[147,19]);
   assert.equal((await material(salon))[5*160+73],0);
   assert.equal(await salon.locator('#undoBeauty').isVisible(),false);await salon.locator('[data-tool="grow"]').click();await stroke(page,salon,[147,36],[147,8]);assert((await material(salon))[5*160+73]>0);await salon.locator('[data-tool="hammer"]').click();
   const before=await scores(salon);await stroke(page,salon,[105,48],[105,67]);assert((await scores(salon)).cut>before.cut);
   const trimmed=await material(salon);await page.keyboard.press('Control+z');assert.deepEqual(await material(salon),trimmed);
   await salon.locator('[data-tool="grow"]').click();
   for(const x of [119,148,180,211])await stroke(page,salon,[x,42],[x-5,8]);
   if(output)await page.screenshot({path:path.join(output,name+'-sans-bone.png')});
   await nextStage(page,salon);assert.equal(await salon.evaluate(()=>salonLab.phase),'draw');
   await checkFacePaint(page,salon,[134,100],{screenshot:output?path.join(output,name+'-sans-feature-paint.png'):undefined});
   await salon.locator('[data-color="#FF3024"]').click();
   await stroke(page,salon,[145,40],[190,45]);assert((await salon.evaluate(()=>beautyDebug.paint)).some(v=>v>0),'editable bone can still be dyed');
   if(output)await page.screenshot({path:path.join(output,name+'-sans-face-dye.png')});
   await salon.locator('#undoBeauty').click();
   await nextStage(page,salon);assert.equal(await salon.evaluate(()=>salonLab.phase),'attach');
   await salon.locator('[data-sticker="ST-STRONG-SCAR-01"]').click();await stroke(page,salon,[190,135],[190,135]);assert.equal((await scores(salon)).attach,30);
   const finishedShape=await material(salon);
   await revisit(page,salon,'cut');
   await page.keyboard.press('Control+z');assert.deepEqual(await material(salon),finishedShape,'returning to shape never enables undo');
   await revisit(page,salon,'attach');await salon.locator('#undoBeauty').click();
   assert.deepEqual(await material(salon),finishedShape,'sticker Undo never changes the shape');

   // A normal small-brush trim can fulfill Sans without pixel-perfect interior preservation.
   salon=await startPreview(page,10003);
   await setRange(salon,'#sculptSize',5);
   const regions=await salon.evaluate(()=>JSON.parse(document.getElementById('guest-data').textContent).beauty.cutRegions);
   for(const r of regions){
    const ys=[];for(let y=r.y+4;y<r.y+r.h-4;y+=4)ys.push(y);ys.push(r.y+r.h-4);
    for(const y of ys)await stroke(page,salon,[r.x+4,y],[r.x+r.w-4,y]);
   }
   assert.equal(await salon.locator('.requestItem.complete').count(),1,'the brief combined request checks off after ordinary trimming');
   const shape=await salon.evaluate(()=>scoreShape(beautyDebug.material,beautyDebug.original,JSON.parse(document.getElementById('guest-data').textContent).beauty,160,175,beautyDebug.masks));
   assert(shape.interiorLossRatio>0&&shape.interiorLossRatio<=.05,'the test includes real brush overshoot');
   const label=salon.locator('.requestItem.complete .requestLabel');
   assert((await label.evaluate(e=>getComputedStyle(e).textDecorationLine)).includes('line-through'));
   if(output)await page.screenshot({path:path.join(output,name+'-sans-trim-fulfilled.png')});
   await salon.locator('#repeatBeautyRequest').click();await finishRequest(page,salon);
   assert.equal(await salon.locator('.requestItem.complete').count(),2,'both detailed checks agree with the brief request');
   await setRange(salon,'#sculptSize',18);
   await stroke(page,salon,[120,60],[210,60]);
   assert.equal(await salon.locator('.requestItem').last().evaluate(e=>e.classList.contains('complete')),false,'major inner damage still revokes the check');

   assert.deepEqual(errors,[]);
   console.log(name+': speech → note, visible mouth animation, seamless zombie growth, irreversible cuts, dye/sticker undo, masks, both guests pass');
  }finally{await browser.close();}
 }
}finally{await new Promise(r=>server.close(r));}

