import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const out='docs/beauty-ending-2026-11-07';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message);});
for(let retry=0;retry<30;retry++){try{await fetch('http://127.0.0.1:4181/');break;}catch{await new Promise(resolve=>setTimeout(resolve,200));}}
await p.goto('http://127.0.0.1:4181/');await p.waitForFunction(()=>window.__endingFixture);
const records=[{id:10001,day:1,name:'취준좀비',score:90,outcome:'beauty',gain:1500,before:0,after:1500},{id:10003,day:2,name:'샌즈',score:90,outcome:'beauty',gain:1500,before:1500,after:3000},{id:10004,day:2,name:'마왕 부하',score:90,outcome:'beauty',gain:2000,before:3000,after:5000}];
console.log('page ready');await p.evaluate(r=>__endingFixture.start(r),records);await p.waitForTimeout(700);const f=await p.locator('#salon').elementHandle().then(h=>h.contentFrame());await f.waitForFunction(()=>window.beautyDebug?.ready);console.log('salon ready');
const portraits=await f.evaluate(()=>{beautyActive=true;customerState.phase='seated';return {portrait:captureBeautyCustomer(),head:captureBeautyHead()};});
console.log('portraits',portraits.head?.length);await p.evaluate(a=>__endingFixture.finish(a.portrait,a.head),portraits);console.log('finish sent');
await p.waitForFunction(()=>document.getElementById('talkText').textContent.includes('그대에게 큰 상'));
await p.waitForTimeout(1200);await p.screenshot({path:out+'/room.png'});
let portalCaptured=false;
for(let i=0;i<130;i++){
 if(await p.locator('#beautyEnding').count())break;
 if(!portalCaptured&&await f.locator('#demonEndingRoom').getAttribute('data-scene')==='return'){await p.waitForTimeout(1900);await p.screenshot({path:out+'/portal.png'});portalCaptured=true;}
 if(await p.locator('#talkLayer').isVisible())await p.locator('#talkNext').click();
 await p.waitForTimeout(120);
}
await p.locator('#beautyEnding').waitFor({timeout:15000});const e=await p.locator('#beautyEnding').elementHandle().then(h=>h.contentFrame());
await e.waitForFunction(()=>window.__endingTest?.get().plan);await e.locator('#endingPause').click();
const state=await e.evaluate(()=>__endingTest.get());assert.equal(state.posts.length,3);assert.equal(state.paused,true);await p.waitForTimeout(180);assert.equal((await e.evaluate(()=>__endingTest.get().time)),state.time);
for(const [name,ms]of [['sky',10000],['city',19500],['phone',23100],['credits',29000],['group',25500+state.plan.total+3000],['comments',25500+state.plan.total+9000],['thanks',25500+state.plan.total+17500],['done',25500+state.plan.total+23000]]){
 await e.evaluate(t=>__endingTest.seek(t),ms);await p.waitForTimeout(name==='group'?1500:180);await p.screenshot({path:out+'/'+name+'.png'});
 if(name==='phone')assert.equal(await e.evaluate(()=>{const s=document.querySelector('.social-screen').getBoundingClientRect();return [...document.querySelectorAll('.follower-day')].every(el=>{const b=el.getBoundingClientRect();return b.left>=s.left&&b.right<=s.right;});}),true);
}
assert.equal(await e.locator('#endingDone').isVisible(),true);
await e.locator('#endingReplay').click();await p.waitForTimeout(300);assert.ok((await e.evaluate(()=>__endingTest.get().time))<1500);
await e.evaluate(()=>__endingTest.seek(25500+__endingTest.get().plan.total+23000));await e.locator('#endingHome').click();await p.waitForTimeout(300);assert.equal(await p.locator('#beautyEnding').count(),0);
assert.equal(portalCaptured,true);assert.deepEqual(errors,[]);await fs.writeFile(out+'/verification.json',JSON.stringify({errors,reviewCount:3,coverage:'Injected completed visit records and completed portrait; actual salon-to-ending dialogue and automatic room transitions; timeline checkpoints; replay/home',passed:true},null,2));
await browser.close();console.log('ending browser checks passed');
