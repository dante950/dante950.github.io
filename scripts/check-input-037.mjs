import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
await fs.mkdir('docs/local-0.37',{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4173/closing.html');await page.locator('#closeShop').click();await page.locator('[data-management]').click();await page.locator('[data-confirm-management]').click();
 for(const selector of ['[data-review-home]','[data-review-back]']){const b=page.locator(selector);assert(await b.isDisabled());await b.evaluate(e=>e.click());assert.equal(await page.locator('#stage').getAttribute('data-phase'),'review');}
 await page.locator('#nextReview:enabled').waitFor();await page.locator('#nextReview').click();await page.locator('#nextReview:enabled').waitFor();assert.equal(await page.locator('#nextReview').innerText(),'홈으로 돌아가기 →');
 assert(await page.locator('[data-review-home]').isDisabled());assert(await page.locator('[data-review-back]').isDisabled());
 await page.screenshot({path:'docs/local-0.37/receipt-home.png'});
 await page.locator('#nextReview').click();await page.locator('#socialPhone').waitFor();assert.equal(await page.locator('[data-management] .app-badge').count(),0);
 await page.goto('http://127.0.0.1:4173/');await page.locator('#siteLoading').waitFor({state:'detached'});await page.locator('#play').click();await page.locator('[data-start-guest="10001"]').click();await page.locator('#introSkip').click();
 const salon=await page.locator('#salon').elementHandle().then(e=>e.contentFrame());await salon.locator('#openShopBtn').click();await salon.locator('#interactPrompt').waitFor();await salon.locator('#gameWorld').click({position:{x:600,y:440}});await page.keyboard.press('f');await page.locator('#talkLayer').waitFor();
 async function choices(){for(let n=0;n<150;n++){if(await page.locator('#beautyChoices').isVisible())return;await page.keyboard.press('f');await page.waitForTimeout(75);}throw Error('No choice');}
 async function assertKeyboardBlocked(){const text=await page.locator('#talkText').innerText();for(const id of ['beautyAccept','beautyAsk']){if(!await page.locator('#'+id).isVisible())continue;await page.locator('#'+id).focus();for(const key of ['f','f','Enter','Space'])await page.keyboard.press(key);}await salon.locator('#gameWorld').focus();for(let n=0;n<6;n++)await page.keyboard.press('f');await page.waitForTimeout(100);assert(await page.locator('#beautyChoices').isVisible());assert.equal(await page.locator('#talkText').innerText(),text);assert(await salon.evaluate(()=>beautyDebug.briefing));}
 await choices();await assertKeyboardBlocked();await page.locator('#beautyAsk').click();await choices();assert.equal(await page.locator('#beautyAsk').isVisible(),false);await assertKeyboardBlocked();await page.screenshot({path:'docs/local-0.37/choice-waits.png'});await page.locator('#beautyAccept').click();await salon.waitForFunction(()=>!beautyDebug.briefing);
 await salon.locator('[data-phase="attach"]').click();await choices();await assertKeyboardBlocked();await page.locator('#beautyAccept').click();await salon.waitForFunction(()=>!beautyDebug.briefing);
 assert.deepEqual(errors,[]);console.log('PASS: receipt navigation disabled throughout; final home label and return; F/Enter/Space blocked on initial/detail/attach choices with either focus and iframe input; direct clicks still work.');
}finally{await browser.close();}
