import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const root=path.resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(),p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
const out='docs/social-workshop-2026-11-08';await fs.mkdir(out,{recursive:true});
try{
 await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.locator('#siteLoading').waitFor({state:'detached'});
 await p.locator('#developer').click();if(await p.locator('#updateOK').isVisible())await p.locator('#updateOK').click();await p.locator('#devScreen [data-editor="social"]').click();
 await p.locator('#socialDay').selectOption('1');await p.locator('[data-social-post="world-day1-1"]').click();
 await p.locator('[data-social-field="user"]').fill('edited_author');await p.locator('[data-social-field="text"]').fill('수정한 게시글 본문 <script>실행되지 않는 글자</script>');
 await p.locator('[data-social-row="choices"][data-index="0"][data-key="label"]').fill('편집한 선택지');
 await p.locator('[data-social-row="choices"][data-index="0"][data-key="replyUser"]').fill('edited_reply_author');
 await p.locator('[data-social-row="choices"][data-index="0"][data-key="reply"]').fill('편집한 답글');
 await p.locator('[data-social-upload="avatar"]').setInputFiles({name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0ioAAAAASUVORK5CYII=','base64')});
 await p.waitForFunction(()=>document.querySelector('[data-social-field="avatar"]').value.startsWith('data:image/png'));
 await p.locator('#socialPhonePreview').click();
 const frame=await p.locator('#socialPreviewFrame').elementHandle().then(h=>h.contentFrame());
 const article=frame.locator('[data-post="world-day1-1"]');await article.waitFor({timeout:30000});
 assert.match(await article.textContent(),/수정한 게시글/);assert.equal(await article.locator('script').count(),0);assert.equal(await article.locator('.social-avatar img').count(),1);
 await article.locator('[data-choice="0"]').click();await frame.waitForFunction(()=>document.querySelector('.comment-list')?.textContent.includes('편집한 답글'));
 assert.match(await frame.locator('.comment-list').textContent(),/edited_reply_author/);
 await p.screenshot({path:out+'/phone-edited-choice.png'});await p.locator('#socialPreviewClose').click();
 assert.equal(await p.evaluate(()=>fullflow.story),null);
 await p.locator('#socialDay').selectOption('2');assert.equal(await p.locator('[data-social-post="world-day2-1"]').count(),1);
 await p.locator('#socialPhonePreview').click();const f2=await p.locator('#socialPreviewFrame').elementHandle().then(h=>h.contentFrame());
 await f2.locator('.social-feed').waitFor();assert.equal(await f2.locator('[data-post="world-day2-1"]').count(),0);await p.locator('#socialPreviewClose').click();
 await p.locator('.editorhead [data-editor="dialogue"]').click();await p.locator('#dialogueGuest').selectOption('10007');
 await p.locator('#dialogueEvent').selectOption('gateDeparture');assert.equal(await p.locator('.lineCard').count(),3);assert.match(await p.locator('.lineCard textarea').nth(1).inputValue(),/시간을 낭비/);
 await p.locator('#dialogueEvent').selectOption('endingScene4');assert.equal(await p.locator('.lineCard').count(),7);
 await p.screenshot({path:out+'/ending-dialogue-editor.png'});
 await p.locator('#home').click();await p.locator('#play').click();await p.locator('[data-start-guest="10007"]').click();
 for(const stars of [0,1,2]){
  await p.locator('#demonStartBranch').selectOption('gate'+stars);await p.locator('#demonBranchStart').click();
  const salon=await p.locator('#salon').elementHandle().then(h=>h.contentFrame());
  await salon.locator('.demonCinema').waitFor({timeout:30000});
  assert.equal(await salon.evaluate(()=>GUEST.stars),stars);
  await salon.locator('.demonCinema button').click();await p.locator('#demonRestart').waitFor();
  if(stars<2){await p.locator('#demonRestart').click();await p.locator('[data-start-guest="10007"]').click();}
 }
 assert.deepEqual(errors,[]);console.log('Monstagram authoring, real phone preview, reply authors, assets, day filters, dialogue catalogue and star selectors passed.');
}finally{await browser.close();server.close();}
