import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://127.0.0.1:4173/closing.html');await page.locator('#closeShop').click();await page.locator('[data-feed]').click();
 for(const post of await page.locator('[data-post]').all()){await post.scrollIntoViewIfNeeded();await page.waitForTimeout(180);}
 await page.locator('[data-home]').click();await page.locator('[data-management]').click();await page.locator('[data-confirm-management]').click();
 for(let i=0;i<2;i++){await page.locator('#nextReview:enabled').waitFor();await page.locator('#nextReview').click();}
 await page.locator('[data-exit]').click();await page.locator('#stage[data-day="2"][data-phase="salon"]').waitFor();
 await page.locator('#closeShop').click();await page.locator('[data-feed]').click();await page.locator('.seen-divider').waitFor();
 await page.locator('.seen-divider').evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(600);
 const device=await page.locator('#socialPhone .social-device').boundingBox();
 await page.screenshot({path:'docs/local-0.37/seen-divider.png',clip:{x:device.x,y:device.y,width:device.width,height:device.height}});
 console.log('Captured actual DAY 2 feed with previous-day seen divider.');
}finally{await browser.close();}
