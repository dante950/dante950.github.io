import {chromium} from 'playwright';
import assert from 'node:assert/strict';
// Completed-visit fixtures exercise the real story iframe initialization bridge;
// this is not a complete combat playthrough.
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4173/closing.html');
 const token='restore-038';
 await page.evaluate(token=>{window.bridgeMessages=[];addEventListener('message',e=>{if(e.data?.source==='yachacha-closing')bridgeMessages.push(e.data);});const frame=document.createElement('iframe');frame.id='storyFixture';frame.style='position:fixed;inset:0;width:100vw;height:100vh;z-index:9999;border:0';frame.src='./closing.html?story='+token;document.body.append(frame);},token);
 await page.waitForFunction(()=>bridgeMessages.some(m=>m.type==='ready'));
 const records=[{day:1,id:10001,name:'취준좀비',score:80,outcome:'declined',before:0,after:1234,base:1234,bonus:0,gain:1234},{day:1,id:10003,name:'샌즈',score:80,outcome:'victory',forced:true,before:1234,after:1801,base:567,bonus:0,gain:567},{day:2,id:10004,name:'마왕 부하',score:80,outcome:'none',before:1801,after:3601,base:1800,bonus:0,gain:1800}];
 const saved={'day-1-zombie':{choiceIndex:1},'night-bus':{choiceIndex:0},__state:{seen:{'day-1-zombie':1,'night-bus':1},freeComments:{'day-1-zombie':[{text:'다음에도 뵈어요!'}]}}};
 await page.evaluate(({token,records,saved})=>document.querySelector('#storyFixture').contentWindow.postMessage({source:'yachacha-story',token,type:'init',day:2,records,socialChoices:saved},location.origin),{token,records,saved});
 const child=await page.locator('#storyFixture').elementHandle().then(e=>e.contentFrame());
 const b=await child.locator('#closeShop').boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);
 await child.locator('.management-chat').waitFor();await child.locator('[data-home]').click();
 assert.match(await child.locator('.follower-chart').innerText(),/1,801/);assert.match(await child.locator('.follower-chart').innerText(),/1,800/);assert.match(await child.locator('.star-goal').innerText(),/1,399/);
 assert.equal(await child.locator('[data-feed] .app-badge').count(),0,'Monstagram badge starts after settlement');
 await child.locator('[data-feed]').click();assert(await child.locator('.seen-divider').count());
 const zombie=child.locator('[data-post="day-1-zombie"]');assert.equal(await zombie.locator('[data-choice]').count(),0);await zombie.locator('[data-comments]').click();
 assert.match(await child.locator('.comment-list').innerText(),/이미 감아/);assert.match(await child.locator('.comment-list').innerText(),/다음에도 뵈어요/);assert.equal(await child.locator('.comment-list .reply').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS story bridge: fresh iframe restores review/world choices, free comments and seen divider; chart uses supplied records rather than demo defaults');
}finally{await browser.close();}
