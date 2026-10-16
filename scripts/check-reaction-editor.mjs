import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.env.YACHA_REACTION_URL||'http://127.0.0.1:4173/';
const output=path.resolve('../owner-update-2026-10-16');await fs.mkdir(output,{recursive:true});
const results=[];
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('#siteLoading').waitFor({state:'detached'});
  await page.locator('#developer').click();if(await page.locator('#updateOK').isVisible())await page.locator('#updateOK').click();
  await page.locator('[data-editor="dialogue"]').first().click();await page.locator('#dialogueGuest').selectOption('10004');await page.locator('#dialogueEvent').selectOption('reactions');
  assert.equal(await page.locator('[data-reaction-text]').count(),4);
  for(const [key,tone,animation] of [['eyeContactLine','angry','complaintTremble'],['eyeContactSecondLine','sigh','sighLetter'],['areaWarningLine','sigh','sighLetter'],['areaOverflowLine','angry','complaintTremble']]){
   await page.locator(`[data-reaction-preview="${key}"]`).click();
   assert.equal(await page.locator('#reactionPreview').getAttribute('data-tone'),tone);
   assert.equal(await page.locator('#reactionPreview').textContent(),await page.locator(`[data-reaction-text="${key}"]`).inputValue());
   assert.equal(await page.locator('#reactionPreview span').first().evaluate(e=>getComputedStyle(e).animationName),animation);
  }
  await page.locator('[data-reaction-preview="eyeContactLine"]').click();await page.screenshot({path:path.join(output,`${name}-reaction-editor.png`)});
  const field=page.locator('[data-reaction-text="eyeContactLine"]'),original=await field.inputValue(),edited=original+' 시험 문장.';
  await field.fill(edited);assert.equal(await page.evaluate(()=>fullflow.project.guests.find(g=>g.id===10004).beauty.eyeContactLine),edited);
  await page.locator('#reactionBeauty').click();assert.equal(await page.locator('[data-field="eyeContactLine"]').inputValue(),edited);
  await page.locator('#beautyTry').click();await page.locator('#previewStart').click();
  const salon=await page.locator('#salon').elementHandle().then(h=>h.contentFrame());await salon.waitForFunction(()=>window.beautyDebug?.ready);
  assert.equal(await salon.evaluate(()=>JSON.parse(document.getElementById('guest-data').textContent).beauty.eyeContactLine),edited);
  assert.equal(await salon.evaluate(()=>getComputedStyle(document.querySelector('.beautyEyeReaction')).position),'absolute');
  // Only this page's unsaved draft was edited. A fresh page must keep public text.
  await page.goto(base);await page.locator('#siteLoading').waitFor({state:'detached'});await page.locator('#developer').click();if(await page.locator('#updateOK').isVisible())await page.locator('#updateOK').click();
  await page.locator('[data-editor="dialogue"]').first().click();await page.locator('#dialogueGuest').selectOption('10004');await page.locator('#dialogueEvent').selectOption('reactions');
  assert.equal(await page.locator('[data-reaction-text="eyeContactLine"]').inputValue(),original);
  await page.locator('#dialogueGuest').selectOption('10001');assert.equal(await page.locator('#dialogueEvent').inputValue(),'arrival');assert.equal(await page.locator('[data-reaction-text]').count(),0);
  assert.deepEqual(errors,[]);results.push({engine:name,fields:4,preview:true,sharedBeautyDraft:true,unchangedPublicText:true,errors});console.log(name+': reaction editor, four previews, shared draft, reload and other guest passed');
 }finally{await browser.close();}
}
await fs.writeFile(path.join(output,base.startsWith('https:')?'public-reactions.json':'local-reactions.json'),JSON.stringify({base,results},null,2));
