import assert from 'node:assert/strict';
async function advanceTalk(page){
 for(let i=0;i<120;i++){
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
 await page.locator('#play').click();
 assert.equal(await page.locator('[data-start-guest]').count(),3);
 assert.equal(await page.evaluate(()=>window.fullflow.story),null);
 if(screenshotPath)await page.screenshot({path:screenshotPath});
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#modal').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'play');
 // Workshop uses the same chooser and returns to its own screen on cancellation.
 await page.locator('#developer').click();
 if(await page.locator('#updateOK').isVisible())await page.locator('#updateOK').click();
 await page.locator('#playSaved').click();
 assert((await page.locator('#modalCard').textContent()).includes('내 브라우저에 저장한 작업본'));
 await page.locator('#cancelStoryStart').click();
 assert.equal(await page.evaluate(()=>window.fullflow.page),'dev');
 await page.locator('#home').click();
 for(const [id,day,index,steps] of [[10001,1,0,2],[10003,2,0,2],[10002,1,1,0]]){
  await page.locator('#play').click();
  await page.locator(`[data-start-guest="${id}"]`).click();
  await page.waitForFunction(id=>window.fullflow.story?.guest===id,id);
  assert.deepEqual(await page.evaluate(()=>window.fullflow.story),{day,index,guest:id,money:0,records:[],preview:false});
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
  if(steps){
   await salon.locator('#beautyScreen').waitFor();
   for(let i=0;i<steps;i++){
    await salon.locator('.beautyNext').click();await page.waitForTimeout(250);await advanceTalk(page);
   }
   if(await salon.locator('.beautyFinish').isVisible())await salon.locator('.beautyFinish').click();
   else await salon.locator('.beautyNext').click(); // Sans ends after stickers.
   await page.waitForTimeout(250);await advanceTalk(page);
   assert(!/만족도|\d+\s*\/\s*100/.test(await page.locator('#modalCard').innerText()),'the player sees no satisfaction score after beauty');
   await page.locator('#acceptBattle').click();
  }else assert.equal(await salon.locator('#beautyScreen').isVisible(),false);
  const combat=page.frameLocator('#storyBattle');
  await combat.locator('#enemyHPText').filter({hasText:'/'}).waitFor({state:'attached'});
  assert.equal(await page.locator('#storyDay').textContent(),'DAY '+String(day).padStart(2,'0'));
  console.log(`Selected ${id}: day ${day}, ${steps?'beauty → battle':'automatic entrance → battle, no beauty'}`);
  if(id===10002&&checkContinuation){
   // Inject only the child result to test settlement/next-day wiring, not battle victory.
   const frame=await page.locator('#storyBattle').elementHandle().then(h=>h.contentFrame());
   await frame.evaluate(()=>{const host=JSON.parse(document.getElementById('host-data').textContent);parent.postMessage({source:'yachacha-combat',token:host.token,type:'battle-end',outcome:'victory',stats:{}},'*');});
   await page.locator('#talkLayer').waitFor();await advanceTalk(page);
   await page.locator('#soulDone').click();await advanceTalk(page);
   await page.locator('#settleDone').waitFor();
   assert(!/만족도|\d+\s*점|\d+\s*\/\s*100/.test(await page.locator('#modalCard').innerText()),'settlement hides customer scores');
   assert.deepEqual(await page.evaluate(()=>window.fullflow.story.records.map(r=>r.id)),[10002]);
   await page.locator('#settleDone').click();await page.locator('#phoneButton').click();
   assert.equal(await page.locator('.post').filter({hasText:'@zombie_jobseeker'}).count(),0);
   await page.locator('#nextDay').click();
   assert.equal(await page.evaluate(()=>window.fullflow.story.guest),10003);
   assert.equal(await page.locator('#storyDay').textContent(),'DAY 02');
   console.log('Drunk result fixture: settlement → Monstagram without skipped zombie → day 2 Sans');
  }
  await page.locator('#home').click();await page.locator('#leavePlay').click();
 }
}
