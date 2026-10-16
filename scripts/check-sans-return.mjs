import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve(process.env.YACHA_STORY_OUTPUT||'../heart-timing-2026-10-16');await fs.mkdir(output,{recursive:true});
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
 await talk();await frame.locator('#beautyScreen').waitFor();
 return frame;
}
async function finishBeauty(frame){
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
try {
 await page.goto("http://127.0.0.1:4173/"); await page.locator("#siteLoading").waitFor({state:"detached"});
 await page.locator("#soundToggle").click(); await page.locator("#play").click(); await page.locator("[data-start-guest=\"10003\"]").click();
 const salon=await meet(10003); await finishBeauty(salon); await page.locator("#acceptBattle").click();
 await battleResult("victory"); await page.locator("#storyClosing").waitFor();
 assert.equal(await page.locator("#talkLayer").isVisible(),false);
 const closing=await page.locator("#storyClosing").elementHandle().then(h=>h.contentFrame()); await closing.locator("#closeShop").waitFor(); await shot("sans-direct-closing");
 assert.deepEqual(errors,[]); console.log("Sans victory result reaches closing without return narration or extra dialogue input.");
 await fs.writeFile(path.join(output,"sans-return-check.json"),JSON.stringify({battleResultFixture:true,noReturnDialogue:true,closingVisible:true,errors},null,2));
} finally {await browser.close();}
