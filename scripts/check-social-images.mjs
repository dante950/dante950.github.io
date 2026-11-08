import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const root=path.resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(process.env.YACHACHA_BROWSER_CHANNEL?{channel:process.env.YACHACHA_BROWSER_CHANNEL}:{}),p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
const out='docs/monstagram-images-2026-11-08';await fs.mkdir(out,{recursive:true});
try{
 const origin=process.env.PUBLIC_BASE_URL||'http://127.0.0.1:'+server.address().port+'/';
 await p.goto(origin);await p.locator('#siteLoading').waitFor({state:'detached'});
 await p.locator('#developer').click();if(await p.locator('#updateOK').isVisible())await p.locator('#updateOK').click();await p.locator('#devScreen [data-editor="social"]').click();
 assert.equal(await p.locator('[data-social-field="imagePreset"] option').count(),29);assert.equal(await p.locator('[data-social-field="avatarPreset"] option').count(),12);
 const all=await p.locator('[data-social-field="imagePreset"] option').evaluateAll(nodes=>nodes.map(n=>n.value).filter(Boolean));
 const bad=await p.evaluate(async paths=>{const failures=[];for(const path of paths){const image=new Image();image.src=path;try{await image.decode();if(!image.naturalWidth)failures.push(path);}catch{failures.push(path);}}return failures;},all);assert.deepEqual(bad,[]);
 for(const day of ['0','1','2','3']){
 await p.locator('#socialDay').selectOption(day);await p.locator('#socialPhonePreview').click();const f=await p.locator('#socialPreviewFrame').elementHandle().then(h=>h.contentFrame());await f.locator('.social-feed').waitFor();
 assert.deepEqual(await f.locator('.social-feed img').evaluateAll(async images=>{await Promise.all(images.map(i=>i.decode().catch(()=>{})));return images.filter(i=>!i.naturalWidth).map(i=>i.src);}),[]);
 if(day==='1'){const a=f.locator('[data-post^="guest-10001-beauty@"]');assert.equal(await a.locator('.photo-head').count(),1);assert.equal(await a.locator('.social-avatar img').count(),1);await a.evaluate(el=>{const c=el.closest('#socialContent');c.scrollTop+=el.getBoundingClientRect().top-c.getBoundingClientRect().top;});await p.screenshot({path:out+'/guest-review.png'});}
 if(day==='3'){await f.locator('[data-post="world-day3-1"]').scrollIntoViewIfNeeded();await p.screenshot({path:out+'/world-feed.png'});}
 assert.equal(await f.locator('[data-post="world-day2-1"]').count(),0);await p.locator('#socialPreviewClose').click();
 }
 await p.locator('#socialDay').selectOption('0');await p.locator('[data-social-post="world-day0-1"]').click();
 const poster=all.find(x=>x.endsWith('T_Monstagram_3.png'));await p.locator('[data-social-field="imagePreset"]').selectOption(poster);assert.equal(await p.locator('[data-social-field="image"]').inputValue(),poster);assert.equal(await p.locator('[data-social-field="imageMode"]').inputValue(),'image');
 const avatar=await p.locator('[data-social-field="avatarPreset"] option').nth(1).getAttribute('value');await p.locator('[data-social-field="avatarPreset"]').selectOption(avatar);
 await p.locator('#socialPhonePreview').click();const edited=await p.locator('#socialPreviewFrame').elementHandle().then(h=>h.contentFrame());const a=edited.locator('[data-post="world-day0-1"]');await a.waitFor();assert.equal(await a.locator('.photo-base').getAttribute('src'),poster);assert.equal(await a.locator('.social-avatar img').getAttribute('src'),avatar);await p.locator('#socialPreviewClose').click();
 assert.equal(await p.evaluate(()=>fullflow.story),null);assert.deepEqual(errors,[]);
 console.log('PASS: 28 image decodes, days 0-3 phone feed, guest composites, profile images, disabled post, both selectors and isolated preview.');
}finally{await browser.close();server.close();}
