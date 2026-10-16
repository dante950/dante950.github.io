import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const output=new URL('../../onboarding-2026-10-16/',import.meta.url);await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.setDefaultTimeout(15000);
 await page.goto('http://127.0.0.1:4173/');await page.locator('#siteLoading').waitFor({state:'detached'});
 async function finishTalk(){for(let n=0;n<180;n++){if(!await page.locator('#talkLayer').isVisible()){await page.waitForTimeout(120);if(!await page.locator('#talkLayer').isVisible())return;}await page.keyboard.press('Enter');await page.waitForTimeout(70);}throw Error('Unfinished dialogue');}
 async function meet(id){
  await page.locator('#play').click();await page.locator(`[data-start-guest="${id}"]`).click();
  if(id===10001){
   await page.locator('#introNext').waitFor();assert.equal(await page.evaluate(()=>fullflow.story.guest),undefined);
   assert.match(await page.locator('#modalCard').textContent(),/고블린/);await page.locator('#introNext').click();assert.match(await page.locator('#modalCard').textContent(),/소환/);
   await page.locator('#introBack').click();assert.match(await page.locator('#introTitle').textContent(),/왕/);await page.keyboard.press('Enter');await page.keyboard.press('Enter');
   assert.match(await page.locator('#modalCard').textContent(),/5일차/);assert.match(await page.locator('#modalCard').textContent(),/2일차/);await page.screenshot({path:fileURLToPath(new URL('intro-goal.png',output))});await page.locator('#introNext').click();
  }else assert.equal(await page.locator('#introNext').count(),0,'jumping to a later guest skips the opening story');
  const salon=await page.locator('#salon').elementHandle().then(h=>h.contentFrame());await salon.locator('#openShopBtn').click();await salon.locator('#interactPrompt').waitFor();await salon.locator('#gameWorld').click({position:{x:600,y:440}});await page.keyboard.press('f');await page.locator('#talkLayer').waitFor();await finishTalk();return salon;
 }
 let salon=await meet(10001);
 await page.locator('#playGuideDone').waitFor();assert.match(await page.locator('#playGuideTitle').textContent(),/손질/);
 assert.equal(await salon.locator('#beautyScreen').isVisible(),false);await page.waitForTimeout(700);assert.equal(await salon.locator('#beautyScreen').isVisible(),false);
 await page.screenshot({path:fileURLToPath(new URL('beauty-guide.png',output))});
 await page.keyboard.press('Enter');await salon.locator('#beautyScreen').waitFor();await page.locator('#talkLayer').waitFor();await finishTalk();
 for(let n=0;n<4;n++){if(await salon.evaluate(()=>beautyDebug.result.active))break;const next=salon.locator('.beautyNext');if(await next.isVisible())await next.click();else await salon.locator('.beautyFinish').click();await page.waitForTimeout(150);await finishTalk();}
 await salon.waitForFunction(()=>beautyDebug.result.active);await salon.locator('#beautyResultContinue').click();await page.locator('#talkLayer').waitFor();await finishTalk();await page.locator('#acceptBattle').click();
 await page.locator('#playGuideDone').waitFor();assert.match(await page.locator('#playGuideTitle').textContent(),/빈틈/);assert.equal(await page.locator('#battleHost').isVisible(),false);
 await page.waitForTimeout(1800);assert.equal(await page.locator('#battleHost').isVisible(),false,'battle cannot start under the guide');
 await page.screenshot({path:fileURLToPath(new URL('battle-guide.png',output))});
 await page.locator('#playGuideDone').click();const combat=await page.locator('#storyBattle').elementHandle().then(h=>h.contentFrame());await combat.waitForFunction(()=>!!window.lab?.battle);
 // Isolated outcome signal checks the retry gate, not a claim of winning a fight.
 await combat.evaluate(()=>{const h=JSON.parse(document.getElementById('host-data').textContent);parent.postMessage({source:'yachacha-combat',token:h.token,type:'battle-end',outcome:'defeat',stats:{}},'*');});
 await page.locator('#retryBattle').click();assert.equal(await page.locator('#playGuideDone').isVisible(),false,'retry does not repeat the guide');await page.locator('#battleHost').waitFor();
 await page.locator('#home').click();await page.locator('#leavePlay').click();salon=await meet(10004);
 await page.locator('#playGuideDone').waitFor();assert.match(await page.locator('#modalCard').textContent(),/붙어 있는 뿔/);assert.match(await page.locator('#modalCard').textContent(),/망치·정/);
 await page.setViewportSize({width:960,height:700});assert(await page.locator('#playGuideDone').isVisible());await page.locator('#playGuideDone').click();await salon.locator('#beautyScreen').waitFor();
 await page.locator('#home').click();await page.locator('#leavePlay').click();await page.locator('#play').click();await page.locator('[data-start-guest="10001"]').click();await page.locator('#introSkip').click();await page.waitForFunction(()=>fullflow.story?.guest===10001);
 assert.deepEqual(errors,[]);await fs.writeFile(new URL('guide-check.json',output),JSON.stringify({engine:'Chromium',introPages:3,introBackAndSkip:true,firstBeauty:true,firstBattle:true,noStartBehindGuide:true,noRetryRepeat:true,minionTools:true,errors},null,2));console.log('Intro pages/back/skip, guide gates, keyboard, retry, new play and minion-specific controls passed.');
}finally{await browser.close();}
