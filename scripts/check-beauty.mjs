import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';
const root=path.resolve('dist');
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const file=path.join(root,name==='/'?'index.html':name);const b=await fs.readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.YACHA_BEAUTY_URL||'http://127.0.0.1:'+server.address().port;
const output=process.env.YACHA_BEAUTY_SCREENSHOTS;
if(output)await fs.mkdir(output,{recursive:true});
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
 return salon;
}
async function pointer(page,salon,x,y){
 const box=await salon.locator('.sculptCanvas').boundingBox();
 await page.mouse.move(box.x+x/320*box.width,box.y+y/350*box.height);
}
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
   const initial=await material(salon);
   await pointer(page,salon,145,88);await page.mouse.down();await pointer(page,salon,145,126);
   assert.deepEqual(await material(salon),initial,'scissors are preview only while held');
   await page.mouse.up();assert.notDeepEqual(await material(salon),initial,'release removes the stroke without disconnecting the whole hair');
   await salon.locator('#undoBeauty').click();assert.deepEqual(await material(salon),initial,'undo restores original pixels');
   // Cancelled pointer does not commit or leave an undo entry.
   await pointer(page,salon,145,88);await page.mouse.down();await pointer(page,salon,145,126);
   await salon.locator('.sculptCanvas').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();
   assert.deepEqual(await material(salon),initial);
   await salon.locator('[data-tool="grow"]').click();
   await stroke(page,salon,[78,85],[78,295]);
   const longHair=await material(salon);assert(longHair[Math.floor(280/2)*160+39]>0,'growth extends toward cape');
   await salon.locator('[data-tool="scissors"]').click();await stroke(page,salon,[78,240],[78,270]);
   assert.equal((await material(salon))[130*160+39],0,'new material can be cut');assert((await material(salon))[110*160+39]>0,'uncut upper hair remains');
   await salon.locator('#undoBeauty').click();assert.deepEqual(await material(salon),longHair);
   // Complete the zombie request through real drags.
   await salon.locator('[data-tool="grow"]').click();await salon.locator('#sculptSize').selectOption('18');
   for(const y of [40,61,79])await stroke(page,salon,[171,y],[214,y]);
   await salon.locator('[data-tool="scissors"]').click();
   await stroke(page,salon,[106,110],[215,110]);
   const goodShape=await scores(salon);assert(goodShape.cut>65,JSON.stringify(goodShape));
   const beforeDye=await material(salon);
   await salon.locator('.beautyNext').click();assert.equal(await salon.evaluate(()=>salonLab.phase),'draw');
   await salon.locator('[data-color="#75452D"]').click();await stroke(page,salon,[165,42],[211,70]);
   assert.deepEqual(await material(salon),beforeDye,'dye changes no material');
   assert.equal((await scores(salon)).cut,goodShape.cut);
   assert((await salon.evaluate(()=>beautyDebug.paint)).some(v=>v>0));
   const painted=await salon.evaluate(()=>beautyDebug.paint);
   await stroke(page,salon,[12,260],[12,295]);assert.deepEqual(await salon.evaluate(()=>beautyDebug.paint),painted,'paint is clipped to the material');
   await salon.locator('.beautyNext').click();assert.equal(await salon.evaluate(()=>salonLab.phase),'attach');
   await salon.locator('[data-sticker="ST-GENTLE-GLASSES-HORN"]').click();await stroke(page,salon,[116,105],[116,105]);
   assert.equal((await scores(salon)).attach,30);
   await stroke(page,salon,[207,105],[207,105]);assert.equal((await scores(salon)).attach,15,'duplicate penalty applies');
   await stroke(page,salon,[207,105],[207,105]);assert.equal((await scores(salon)).attach,30,'removing duplicate repairs score');
   await stroke(page,salon,[116,105],[116,105]);await stroke(page,salon,[160,108],[160,108]);
   const beforeTalking=await material(salon),expression=await salon.evaluate(()=>beautyDebug.expression);
   await page.evaluate(()=>{const f=document.getElementById('salon'),g=JSON.parse(f.contentDocument.getElementById('guest-data').textContent);f.contentWindow.postMessage({type:'beauty-speaking',token:g.token,speaking:true,open:true},'*');});
   await salon.waitForFunction(()=>document.getElementById('beautyCustomer').dataset.talking==='true');
   assert.deepEqual(await material(salon),beforeTalking);assert.equal(await salon.evaluate(()=>beautyDebug.expression),expression);
   if(output)await page.screenshot({path:path.join(output,name+'-zombie-complete.png')});
   await salon.locator('.beautyNext').click();await page.locator('#modalCard').filter({hasText:'미용 시험 ·'}).waitFor();
   salon=await startPreview(page,10003);
   const sansInitial=await material(salon);await salon.locator('[data-tool="grow"]').click();
   await stroke(page,salon,[147,36],[147,6]);
   const bone=await material(salon);assert(bone[5*160+73]>0);
   await salon.locator('[data-tool="hammer"]').click();await stroke(page,salon,[147,8],[147,19]);
   assert.equal((await material(salon))[5*160+73],0);
   await salon.locator('#undoBeauty').click();assert.deepEqual(await material(salon),bone);
   await salon.locator('#undoBeauty').click();assert.deepEqual(await material(salon),sansInitial);
   const before=await scores(salon);await stroke(page,salon,[105,48],[105,67]);assert((await scores(salon)).cut>before.cut);
   await salon.locator('#undoBeauty').click();assert.deepEqual(await material(salon),sansInitial);
   await salon.locator('[data-tool="grow"]').click();
   for(const x of [119,148,180,211])await stroke(page,salon,[x,42],[x-5,8]);
   if(output)await page.screenshot({path:path.join(output,name+'-sans-bone.png')});
   await salon.locator('.beautyNext').click();assert.equal(await salon.evaluate(()=>salonLab.phase),'draw');
   await salon.locator('.beautyNext').click();assert.equal(await salon.evaluate(()=>salonLab.phase),'attach');
   await salon.locator('[data-sticker="ST-STRONG-SCAR-01"]').click();await stroke(page,salon,[190,135],[190,135]);assert.equal((await scores(salon)).attach,30);
   assert.deepEqual(errors,[]);
   console.log(name+': drag/release/cancel, growth, long hair, cut new material, undo, masks, dye clipping, stickers, expressions, both guests pass');
  }finally{await browser.close();}
 }
}finally{await new Promise(r=>server.close(r));}

