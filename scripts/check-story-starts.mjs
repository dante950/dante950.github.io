import assert from 'node:assert/strict';
async function advanceTalk(page){
 for(let i=0;i<120;i++){
  if(await page.locator('#beautyChoiceSkip').isVisible())await page.locator('#beautyChoiceSkip').click();
  if(await page.locator('#beautyChoices').isVisible()){await page.locator('#beautyAccept').click();await page.locator('#beautyChoices').waitFor({state:'hidden'});await page.waitForTimeout(350);continue;}
  if(!await page.locator('#talkLayer').isVisible()){
   await page.waitForTimeout(350);
   if(!await page.locator('#talkLayer').isVisible())return;
  }
  await page.keyboard.press('Enter');await page.waitForTimeout(80);
 }
 throw Error('Story dialogue did not complete');
}
export async function checkStoryStarts(page,{screenshotPath,checkContinuation=false}={}){
 await page.locator('#home').click();
 await page.locator('#soundToggle').click();
 await page.locator('#playChapter').click();
 assert.equal(await page.locator('[data-start-guest]').count(),3);
 assert.equal(await page.evaluate(()=>window.fullflow.story),null);
 if(screenshotPath)await page.screenshot({path:screenshotPath});
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#modal').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'playChapter');
 // Workshop uses the same chooser and returns to its own screen on cancellation.
 await page.locator('#developer').click();
 if(await page.locator('#updateOK').isVisible())await page.locator('#updateOK').click();
 await page.locator('#playSaved').click();
 assert((await page.locator('#modalCard').textContent()).includes('내 브라우저에 저장한 작업본'));
 await page.locator('#cancelStoryStart').click();
 assert.equal(await page.evaluate(()=>window.fullflow.page),'dev');
 await page.locator('#home').click();
 for(const [id,day,index,steps] of [[10001,1,0,2],[10003,1,1,2],[10004,2,0,2]]){
  await page.locator('#playChapter').click();
  await page.locator(`[data-start-guest="${id}"]`).click();
  if(await page.locator('#introSkip').isVisible())await page.locator('#introSkip').click();
  await page.waitForFunction(id=>window.fullflow.story?.guest===id,id);
  assert.deepEqual(await page.evaluate(()=>window.fullflow.story),{day,index,guest:id,money:0,followers:0,records:[],preview:false});
  await page.waitForFunction(id=>{
   try{const d=document.getElementById('salon').contentDocument;const g=JSON.parse(d.getElementById('guest-data').textContent);return g.id===id&&g.mode==='story'&&!!d.getElementById('gameWorld');}catch{return false;}
  },id);
  const salon=page.frameLocator('#salon');
  if(id===10002){
   await salon.locator('.cutsceneLabel').waitFor();
   assert.equal(await salon.locator('#openShopBtn').isVisible(),false);
  }else await salon.locator('#openShopBtn').click();
  await salon.locator('#interactPrompt').waitFor();
  await salon.locator('#gameWorld').click({position:{x:600,y:440}});
  await page.keyboard.press('f');await page.locator('#talkLayer').waitFor();await advanceTalk(page);
  if(await page.locator('#playGuideDone').isVisible()){await page.locator('#playGuideDone').click();await page.locator('#talkLayer').waitFor();await advanceTalk(page);}
  if(steps){
   await salon.locator('#beautyScreen').waitFor();
   if(await salon.locator('#beautyTutorialSkip').isVisible()){
    assert.equal(await page.locator('#talkLayer').isVisible(),false,'tool practice precedes the first beauty request');
    await salon.locator('#beautyTutorialSkip').click();
    await page.locator('#talkLayer').waitFor();
    if(id===10001){
     await page.locator('#beautyChoices').waitFor();
     const brief=await page.locator('#talkText').innerText();
     for(const key of ['f','f','f','Enter','Space'])await page.keyboard.press(key);
     assert.equal(await page.locator('#beautyChoiceHint').isVisible(),true,'keyboard spam cannot accept the clarification lesson');
     assert.equal(await page.locator('#talkText').innerText(),brief);
     assert.equal(await page.locator('#beautyAccept').isEnabled(),false);
     await page.locator('#beautyAsk').click();
     await page.locator('#beautyChoices').waitFor();
     assert.notEqual(await page.locator('#talkText').innerText(),brief,'pointer click starts the detailed request');
     await page.locator('#beautyAccept').click();
     await page.locator('#talkLayer').waitFor({state:'hidden'});
    }else await advanceTalk(page);
   }
   assert.equal(await salon.locator('#showBeautyZones').innerText(),'손질 가이드','the guide is available in public story play');
   for(let i=0;i<steps;i++){
    await salon.locator('.beautyNext').click();await page.waitForTimeout(250);await advanceTalk(page);
   }
   if(await salon.locator('.beautyFinish').isVisible())await salon.locator('.beautyFinish').click();
   else await salon.locator('.beautyNext').click(); // Sans ends after stickers.
   await page.locator('#talkLayer').waitFor();await advanceTalk(page);
   assert(!/만족도|\d+\s*\/\s*100/.test(await page.locator('#modalCard').innerText()),'the player sees no satisfaction score after beauty');
   if(id===10004){await page.locator('#storyClosing').waitFor();assert.equal(await page.evaluate(()=>fullflow.story.followers),2000);await page.locator('#home').click();await page.locator('#leavePlay').click();continue;}
   await page.locator('#acceptBattle').click();
   if(await page.locator('#playGuideDone').isVisible())await page.locator('#playGuideDone').click();
  }else assert.equal(await salon.locator('#beautyScreen').isVisible(),false);
  const combat=page.frameLocator('#storyBattle');
  await combat.locator('#enemyHPText').filter({hasText:'/'}).waitFor({state:'attached'});
  assert.match(await page.locator('#storyDay').textContent(),new RegExp('^DAY '+String(day).padStart(2,'0')+' · ☀ (2[2-8])°$'));
  console.log(`Selected ${id}: day ${day}, ${steps?'beauty → battle':'automatic entrance → battle, no beauty'}`);
  await page.locator('#home').click();await page.locator('#leavePlay').click();
 }
}
