import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
await fs.mkdir('docs/local-0.33',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4173/closing.html');
 await page.locator('#closeShop').click();
 await page.locator('#socialPhone').waitFor();
 const badge=page.locator('[data-feed] .app-badge');
 assert.equal(await badge.count(),1);
 await page.screenshot({path:'docs/local-0.33/home-new.png'});
 await page.locator('[data-feed]').click();
 await page.waitForTimeout(200);
 await page.locator('[data-home]').click();
 assert.equal(await badge.count(),1,'opening the app must not mark offscreen posts as read');
 await page.locator('[data-feed]').click();
 for(const post of await page.locator('[data-post]').all()){await post.scrollIntoViewIfNeeded();await page.waitForTimeout(200);}
 await page.locator('[data-home]').click();
 assert.equal(await badge.count(),0,'badge clears after all posts were seen');
 await page.locator('[data-management]').click();
 await page.evaluate(()=>{window.arrivals=[];const box=document.querySelector('.bot-messages');window.chatObserver=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)window.arrivals.push({kind:n.className,time:performance.now()});});window.chatObserver.observe(box,{childList:true});});
 await page.locator('[data-confirm-management]').waitFor();
 const events=await page.evaluate(()=>window.arrivals);
 assert.deepEqual(events.map(x=>x.kind),['bot-bubble','bot-bubble','management-confirm']);
 assert(events[1].time-events[0].time>=850);
 assert(events[2].time-events[1].time>=850,'confirm is a separate beat after second message');
 await page.screenshot({path:'docs/local-0.33/management.png'});
 await page.locator('[data-home]').click();
 await page.locator('[data-management]').click();
 await page.waitForTimeout(1600);
 await page.locator('[data-home]').click();
 await page.waitForTimeout(1000);
 assert.equal(await page.locator('[data-confirm-management]').count(),0,'leaving cancels stale arrivals');
 assert.deepEqual(errors,[]);
 console.log('PASS: unseen badge persists for offscreen posts, clears after reading all, and management messages/button arrive in three separate beats without stale insertions.');
}finally{await browser.close();}
