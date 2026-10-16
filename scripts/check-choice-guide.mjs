import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const dir='../tutorial-flow-2026-10-16';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/');await page.locator('#siteLoading').waitFor({state:'detached'});
 await page.locator('#play').click();await page.locator('[data-start-guest="10001"]').click();await page.locator('#introSkip').click();
 const salon=await page.locator('#salon').elementHandle().then(h=>h.contentFrame());await salon.locator('#openShopBtn').click();await salon.locator('#interactPrompt').waitFor();await salon.locator('#gameWorld').click({position:{x:600,y:440}});await page.keyboard.press('f');await page.locator('#talkLayer').waitFor();
 async function choices(){for(let n=0;n<160;n++){if(await page.locator('#beautyChoices').isVisible())return;await page.keyboard.press('Enter');await page.waitForTimeout(80);}throw Error('Choice not reached');}
 await choices();assert(await page.locator('#beautyChoiceHint').isVisible());assert.equal(await page.evaluate(()=>document.activeElement.id),'beautyAsk');assert.match(await page.locator('#beautyChoiceHint').textContent(),/알겠습니다/);
 const original=await page.locator('#talkText').textContent();const r=await page.locator('#beautyChoiceHint').boundingBox();assert(r.x>=0&&r.y>=0&&r.y+r.height<=1000);await page.waitForTimeout(1000);await page.screenshot({path:dir+'/choice-guide.png'});
 await page.locator('#beautyAsk').click();await choices();assert(!(await page.locator('#beautyChoiceHint').isVisible()));assert(!(await page.locator('#beautyAsk').isVisible()));assert.notEqual(await page.locator('#talkText').textContent(),original);await page.locator('#beautyAccept').click();
 await salon.locator('#beautyTutorial[data-step=cut]').waitFor();await salon.locator('#repeatBeautyRequest').click();await choices();assert(!(await page.locator('#beautyAsk').isVisible()),'repeat remembers the detailed request');await page.locator('#beautyAccept').click();await salon.locator('#beautyTutorialSkip').click();
 await salon.locator('[data-phase=draw]').click();await choices();assert(await page.locator('#beautyAsk').isVisible());assert(!(await page.locator('#beautyChoiceHint').isVisible()),'first-choice guide does not repeat every stage');await page.locator('#beautyAccept').click();await salon.waitForFunction(()=>!beautyDebug.briefing);
 assert.deepEqual(errors,[]);await fs.writeFile(dir+'/choice-guide-check.json',JSON.stringify({firstChoiceHint:true,focusAsk:true,detailDialogue:true,acceptStartsTools:true,repeatDetail:true,oneTimeHint:true,errors},null,2));console.log('Choice explanation, detail playback, accept and one-time behavior passed.');
}finally{await browser.close();}

