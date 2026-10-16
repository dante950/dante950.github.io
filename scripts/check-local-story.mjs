import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve(process.env.YACHA_STORY_OUTPUT||'../local-demo-2026-10-16');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
const shot=async name=>page.screenshot({path:path.join(output,'story-'+name+'.png')});
async function talk(){
 for(let i=0;i<150;i++){
  if(!await page.locator('#talkLayer').isVisible()){await page.waitForTimeout(180);if(!await page.locator('#talkLayer').isVisible())return;}
  await page.keyboard.press('Enter');await page.waitForTimeout(65);
 }
 throw Error('Dialogue did not finish');
}
async function meet(id){
 await page.waitForFunction(id=>fullflow.story?.guest===id,id);
 const frame=await page.locator('#salon').elementHandle().then(h=>h.contentFrame());
 await frame.locator('#openShopBtn').click();
 await frame.locator('#interactPrompt').waitFor();
 await frame.locator('#gameWorld').click({position:{x:600,y:440}});await page.keyboard.press('f');
 await page.locator('#talkLayer').waitFor();
 if(id===10004){await page.waitForTimeout(200);await shot('minion-arrival');}
 await talk();if(await page.locator('#playGuideDone').isVisible()){await page.locator('#playGuideDone').click();await page.locator('#talkLayer').waitFor();await talk();}await frame.locator('#beautyScreen').waitFor();
 return frame;
}
async function finishBeauty(frame){
 if(await frame.locator('#beautyTutorialSkip').isVisible())await frame.locator('#beautyTutorialSkip').click();
 for(let i=0;i<5;i++){
  await talk();
  if(await frame.evaluate(()=>beautyDebug.result.active))break;
  const next=frame.locator('.beautyNext');
  if(await next.isVisible())await next.click();else await frame.locator('.beautyFinish').click();
  await page.waitForTimeout(180);
 }
 await frame.waitForFunction(()=>beautyDebug.result.active);
 await frame.locator('#beautyResultContinue').click();
 await talk();
}
async function battleResult(outcome){
 const frame=await page.locator('#storyBattle').elementHandle().then(h=>h.contentFrame());
 await frame.waitForFunction(()=>window.lab?.data?.sheets?.length>0);
 await frame.waitForFunction(()=>window.lab?.battle?.settings?.staggerPerHit===5);
 assert.equal(await frame.locator('#arena').getAttribute('width'),'1280');
 if(outcome==='victory'&&await frame.evaluate(()=>Number(lab.battle.id)===10001)){
  assert.equal(await frame.evaluate(()=>lab.battle.monster.MaxHP),1000);
  await shot('new-combat-story');
 }
 // Test only the result bridge. This is not a claim of winning the fight by playing.
 await frame.evaluate(outcome=>{const host=JSON.parse(document.getElementById('host-data').textContent);parent.postMessage({source:'yachacha-combat',token:host.token,type:'battle-end',outcome,stats:{}},'*');},outcome);
}
async function closeDay(day,total){
 await page.locator('#storyClosing').waitFor();
 const frame=await page.locator('#storyClosing').elementHandle().then(h=>h.contentFrame());
 await frame.locator('#closeShop').click();
 await frame.locator('#settlement').waitFor();
 assert.equal(await frame.locator('#stage').getAttribute('data-actual-followers'),String(total));
 assert.equal(await frame.locator('.post').count(),day===1?2:1);
 await frame.waitForFunction(()=>!document.getElementById('nextReview').disabled);await shot('day-'+day+'-closing');
 const count=day===1?2:1;
 for(let i=0;i<count;i++){await frame.waitForFunction(()=>!document.getElementById('nextReview').disabled);await frame.locator('#nextReview').click();}
 if(day===1){await page.waitForFunction(()=>fullflow.story?.guest===10004);assert.equal(await page.evaluate(()=>fullflow.story.followers),total);}
 else{await frame.locator('#ending').waitFor({timeout:30000});assert.equal(await frame.locator('#hudStar').textContent(),'1');await page.waitForTimeout(1100);await shot('day-3-upgrade');}
}
try{
 await page.goto('http://127.0.0.1:4173/');await page.locator('#siteLoading').waitFor({state:'detached'});
 await page.locator('#soundToggle').click();await page.locator('#play').click();
 assert.deepEqual(await page.locator('[data-start-guest]').evaluateAll(nodes=>nodes.map(n=>+n.dataset.startGuest)),[10001,10003,10004]);
 await page.locator('[data-start-guest="10001"]').click();
 await page.locator('#introSkip').click();
 for(const [id,total] of [[10001,1500],[10003,3000]]){
  const frame=await meet(id);await finishBeauty(frame);await page.locator('#acceptBattle').click();
  if(await page.locator('#playGuideDone').isVisible())await page.locator('#playGuideDone').click();
  if(id===10003){await battleResult('defeat');await page.locator('#retryBattle').waitFor();assert.equal(await page.locator('#lossContinue').count(),0);assert.equal(await page.evaluate(()=>fullflow.story.followers),1500);await page.locator('#retryBattle').click();}
  await battleResult('victory');await talk();
  await page.waitForFunction(total=>fullflow.story?.followers===total,total);
 }
 await closeDay(1,3000);
 const minion=await meet(10004);await finishBeauty(minion);await talk();
 assert.equal(await page.locator('#acceptBattle').count(),0);
 await page.waitForFunction(()=>fullflow.story?.followers===5000);
 await closeDay(2,5000);
 assert.deepEqual(await page.evaluate(()=>fullflow.story.records.map(r=>r.id)),[10001,10003,10004]);
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(output,'story-results.json'),JSON.stringify({engine:'chromium',actualUI:true,battleResultFixtures:true,followers:5000,checks:['schedule','real arrival and beauty completion','forced defeat retry','single rewards','day 1 closing and next day','minion no battle','day 2 closing','star and day 3 upgrade'],errors},null,2));
 console.log('Local story: three guests, forced retry, actual reward replay, both closings and DAY 3 passed. Battle results were bridge fixtures.');
}catch(error){await shot('failure');console.log(await page.evaluate(()=>({story:fullflow.story,modal:document.getElementById('modalCard').innerText,talk:document.getElementById('talkText').innerText})));throw error;}
finally{await browser.close();}
