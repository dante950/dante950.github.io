import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const dist=path.resolve('dist');
const server=http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost'),file=path.resolve(dist,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
 if(!file.startsWith(dist+path.sep))return res.writeHead(403).end();
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.ogg':'audio/ogg'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
const screenshots=[];
async function dismiss(page){await page.evaluate(()=>{for(let n=0;n<4;n++)window.demonLab.advance();});}
async function preview(page,phase){await page.goto(url+'/demon.html');await page.waitForFunction(()=>window.demonLab?.ready);await page.locator('#beautyShortcuts summary').click();await page.locator('[data-preview-phase="'+phase+'"]').click();await dismiss(page);}
try{
 for(const [name,browserType] of Object.entries({chromium,webkit})){
 const browser=await browserType.launch();try{
 const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[],bad=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url());});
 await page.goto(url+'/demon.html');await page.waitForFunction(()=>window.demonLab?.ready);await page.locator('#sound').click();
 for(const stars of ['0','1','2','3']){
  await page.selectOption('#stars',stars);await page.locator('#open').click();await page.waitForFunction(()=>window.demonLab.mode==='cutscene');
  await page.evaluate(()=>{let n=0;while(window.demonLab.mode==='cutscene'&&n++<100)window.demonLab.advance();});
  await page.waitForFunction(()=>['room','ending'].includes(window.demonLab.mode));
  if(stars==='3'){assert.equal(await page.evaluate(()=>window.demonLab.mode),'room');await page.waitForTimeout(1700);await page.keyboard.down('a');await page.waitForTimeout(500);await page.keyboard.up('a');await page.locator('#interact').click();await page.waitForFunction(()=>window.demonLab.mode==='beauty');await dismiss(page);}
  else {await page.getByRole('heading',{name:'GAME OVER'}).waitFor();await page.locator('#restart').click();}
 }
 await preview(page,1);
 const initial=await page.evaluate(()=>{const m=window.demonLab.model;return {metrics:m.metrics(),face:[...m.faceMask].filter(Boolean).length,scratches:[...m.scratchMask].filter(Boolean).length,horn:[...m.hornMask].filter(Boolean).length};});
 assert.ok(initial.face>100&&initial.scratches>50&&initial.horn>50,JSON.stringify(initial));assert.equal(initial.metrics.exposure,0);assert.ok(initial.metrics.horn<.92);
 console.log(name+' initial '+JSON.stringify(initial));
 if(name==='chromium')screenshots.push(['helmet',await page.locator('#stage').screenshot({type:'jpeg',quality:72})]);
 // The face's eyes are pixels in the underlying layer, and erasing armor reveals them.
 const reveal=await page.evaluate(()=>{const m=window.demonLab.model;let n=m.faceMask.findIndex((v,n)=>v&&m.source[n*4+3]);const before=m.base.slice(n*4,n*4+4);m.save();m.stroke(n%320,Math.floor(n/320),1,'hammer');return {base:[...before],helmet:m.material[n*4+3],exposure:m.metrics().exposure};});
 assert.ok(reveal.base[3]>0);assert.equal(reveal.helmet,0);assert.ok(reveal.exposure>0&&reveal.exposure<.15);
 await page.evaluate(()=>window.demonLab.model.undo());
 // Restore the horn and paint every scratch through the actual stroke implementation.
 const repaired=await page.evaluate(()=>{
  const m=window.demonLab.model;
  for(let n=0;n<m.count;n++)if(m.hornMask[n])m.stroke(n%320,Math.floor(n/320),.4,'tonic');
  for(let n=0;n<m.count;n++)if(m.scratchMask[n])m.stroke(n%320,Math.floor(n/320),.4,'paint',[36,34,54]);
  window.demonLab.renderBeauty();window.demonLab.updateBeauty();return {judge:m.judge(),metrics:m.metrics()};
 });assert.equal(repaired.judge.success,true,JSON.stringify(repaired));
 await page.locator('#finish').click();await page.waitForFunction(()=>window.demonLab.mode==='cutscene');
 await page.evaluate(()=>{let n=0;while(window.demonLab.mode==='cutscene'&&n++<30)window.demonLab.advance();});await dismiss(page);
 assert.equal(await page.evaluate(()=>window.demonLab.phase),2);
 if(name==='chromium')screenshots.push(['face',await page.locator('#stage').screenshot({type:'jpeg',quality:72})]);
 const phase2=await page.evaluate(()=>{
  const m=window.demonLab.model;
  for(let n=0;n<m.count;n++)if(m.trimMask[n])m.stroke(n%320,Math.floor(n/320),.4,'scissors');
  for(let n=0;n<m.count;n++)if(m.material[n*4+3])m.stroke(n%320,Math.floor(n/320),.4,'paint',[24,21,31]);
  const clean=m.judge();let n=m.faceMask.findIndex((v,n)=>v&&!m.material[n*4+3]);
  m.stroke(n%320,Math.floor(n/320),.4,'paint',[24,21,31]);const dirty=m.judge();
  m.stroke(n%320,Math.floor(n/320),.4,'erase');window.demonLab.renderBeauty();window.demonLab.updateBeauty();return {clean,dirty,fixed:m.judge(),metrics:m.metrics()};
 });assert.equal(phase2.clean.success,true,JSON.stringify(phase2));assert.equal(phase2.dirty.success,false);assert.equal(phase2.fixed.success,true);
 await page.locator('#finish').click();await page.waitForFunction(()=>window.demonLab.mode==='cutscene');
 await page.evaluate(()=>{let n=0;while(window.demonLab.mode==='cutscene'&&n++<50)window.demonLab.advance();});await dismiss(page);
 assert.equal(await page.evaluate(()=>window.demonLab.phase),3);assert.equal(await page.evaluate(()=>window.demonLab.successLocked),true);
 if(name==='chromium')screenshots.push(['goblin',await page.locator('#stage').screenshot({type:'jpeg',quality:72})]);
 await page.locator('#finish').click();await page.locator('#portal').waitFor();await page.locator('#portal').click();await page.getByRole('heading',{name:'돌아온 일상에, 새 알림 하나.'}).waitFor();
 // A real mouse stroke across an eye region reaches the threshold and starts phase-one battle.
 await preview(page,1);await page.locator('[data-tool="hammer"]').click();await page.locator('#size').fill('20');
 const box=await page.locator('#portrait').boundingBox();await page.mouse.move(box.x+box.width*.43,box.y+box.height*.56);await page.mouse.down();await page.mouse.move(box.x+box.width*.61,box.y+box.height*.56,{steps:8});await page.mouse.up();
 await page.waitForFunction(()=>window.demonLab.mode==='cutscene');
 await page.evaluate(()=>{let n=0;while(window.demonLab.mode==='cutscene'&&n++<10)window.demonLab.advance();});
 assert.equal(await page.evaluate(()=>window.demonLab.battle.phase),1);
 // Full-width and narrow layouts retain all controls in the viewport.
 await page.setViewportSize({width:700,height:900});await preview(page,3);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log(name+' day-four gate, repair, strict face paint, free ending and battle checks passed');
 }finally{await browser.close();}
 }
 
}finally{for(const [name,data]of screenshots)console.log('DEMON_SCREENSHOT_'+name+'='+data.toString('base64'));await new Promise(r=>server.close(r));}
