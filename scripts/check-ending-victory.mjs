import {chromium,webkit} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const base=process.argv.includes('--url')?process.argv[process.argv.indexOf('--url')+1]:'http://127.0.0.1:4183/',engine=process.argv.includes('--webkit')?'webkit':'chromium',out='docs/demon-battle-2026-11-08/happy-ending/'+(base.includes('github')?'public-':'')+engine;await fs.mkdir(out,{recursive:true});
const browser=await ({chromium,webkit}[engine]).launch(),p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
if(base.includes('github'))await p.route(/\/ending-app\.[a-f0-9]+\.js$/,async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__endingTest={seek(ms){endingTime=ms;renderEnding();},get(){return {time:endingTime,plan:endingPlan,newsPlan:endingNewsPlan,posts:endingPosts,paused:endingPaused};}};'});});
try{
 await p.goto(base);await p.waitForFunction(()=>window.fullflow);await p.locator('#play').click();await p.locator('[data-start-guest="10007"]').click();await p.locator('#demonStartBranch').selectOption('victory');await p.locator('#demonBranchStart').click();await p.waitForFunction(()=>document.getElementById('talkText').textContent.includes('내가 졌다'));
 const salon=await p.locator('#salon').elementHandle().then(h=>h.contentFrame()),lines=[],frames=new Set(),scenes=[],shots=new Set();
 for(let i=0;i<1000;i++){
  if(await p.locator('#beautyEnding').count())break;
  const room=await salon.locator('#demonEndingRoom').count()?await salon.locator('#demonEndingRoom').evaluate(el=>({scene:el.dataset.scene,frame:el.dataset.cameraFrame})):null;
  if(room){if(scenes.at(-1)!==room.scene)scenes.push(room.scene);if(room.scene==='camera'){frames.add(room.frame);if(!shots.has('camera')&&Number(room.frame)>=3){await p.screenshot({path:out+'/camera.png'});shots.add('camera');}}}
  if(await p.locator('#talkNext').isVisible()){
   const complete=(await p.locator('#talkNext').getAttribute('aria-label')).startsWith('다음'),line=await p.locator('#talkText').textContent();
   if(complete&&line){if(lines.at(-1)!==line)lines.push(line);
    if(line.includes('여전히 마왕님')&&!shots.has('loyalty')){await p.screenshot({path:out+'/loyalty.png'});shots.add('loyalty');}
    if(line==='다들 잘 지내요!'){assert.equal(room.scene,'portal');await p.screenshot({path:out+'/portal-farewell.png'});}
   }
   if(room?.scene!=='camera'||Number(room.frame)>=8){await p.locator('#talkNext').focus();await p.keyboard.press('f');}
  }
  await p.waitForTimeout(80);
 }
 await p.locator('#beautyEnding').waitFor();assert(shots.has('camera'));assert(frames.size>=3);const joined=lines.join('\n');
 for(const text of ['제 앞에 계신 분은 여전히 마왕님이십니다.','네, 마왕님. 바로 준비하겠습니다.','마왕님도 같이 찍어요!','좋아요. 찍습니다!','준비됐습니다. 이제 원래 세계로 돌아가실 수 있어요.','갑자기 소환해서 어려운 부탁까지 드렸는데, 끝까지 도와주셔서 감사합니다.','다들 잘 지내요!'])assert(joined.includes(text),text);
 assert(!/폐하|고향|나에게도 보내|함께 찍어도|싫으시다고요/.test(joined));assert(lines.indexOf('마왕님도 같이 찍어요!')<lines.indexOf('좋아요. 찍습니다!'));assert(scenes.indexOf('camera')<scenes.indexOf('photo'));assert(scenes.indexOf('portal')<scenes.indexOf('depart'));
 const e=await p.locator('#beautyEnding').elementHandle().then(h=>h.contentFrame());await e.waitForFunction(()=>window.__endingTest?.get().newsPlan);await e.locator('#endingPause').click();const state=await e.evaluate(()=>__endingTest.get()),start=25500+state.plan.total,n=state.newsPlan;
 assert.equal(await e.locator('.ending-news').count(),1);assert.equal(await e.locator('.ending-news header b').textContent(),'왕실 보도');assert.equal(await e.locator('.ending-news img').getAttribute('src'),await e.locator('[data-review="ending-group"] img').getAttribute('src'));
 await e.evaluate(ms=>__endingTest.seek(ms),start+2000);await p.waitForTimeout(1400);await p.screenshot({path:out+'/royal-news.png'});
 await e.evaluate(ms=>__endingTest.seek(ms),start+n.lead+n.scroll/2);const card=e.locator('.ending-news .post-card'),middle=await card.evaluate(el=>el.scrollTop);assert(middle>0);await e.locator('#endingPause').click();await p.waitForTimeout(450);assert(await card.evaluate(el=>el.scrollTop)>middle);await e.locator('#endingPause').click();const still=await card.evaluate(el=>el.scrollTop);await p.waitForTimeout(200);assert.equal(await card.evaluate(el=>el.scrollTop),still);
 await e.evaluate(ms=>__endingTest.seek(ms),start+n.commentsAt+10000);assert(await card.evaluate(el=>Math.abs(el.scrollTop-el.scrollHeight+el.clientHeight)<=1));assert.equal(await e.locator('#endingComments p').count(),4);assert.equal(await e.locator('#endingComments .ending-reply').count(),3);assert(!/집으로 돌아가겠습니다|다음 예약/.test(await e.locator('#endingComments').textContent()));for(const c of await e.locator('#endingComments p').all())assert.equal(await c.evaluate(el=>Number(el.style.opacity)),1);assert(await e.locator('#endingComments').evaluate(el=>{const b=el.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight}));await p.screenshot({path:out+'/royal-comments.png'});
 await e.evaluate(ms=>__endingTest.seek(ms),start+n.total+23000);assert.equal(await e.locator('#endingDone').isVisible(),true);await e.locator('#endingReplay').click();await p.waitForTimeout(100);assert((await e.evaluate(()=>__endingTest.get().time))<1000);assert.equal(await card.evaluate(el=>el.scrollTop),0);await e.evaluate(ms=>__endingTest.seek(ms),start+n.total+23000);await e.locator('#endingHome').click();await p.locator('#beautyEnding').waitFor({state:'detached'});assert.deepEqual(errors,[]);
 await fs.writeFile(out+'/verification.json',JSON.stringify({passed:true,engine,base,errors,lines,scenes,cameraFrames:[...frames],newsPlan:n,coverage:'Actual start-menu victory branch and keyboard dialogue; authored camera frames and portal-before-farewell; single shared group-photo article; automatic scrolling/pause; four comments/three replies; replay/home. Ending timeline checkpoints use response-only test helpers.'},null,2));console.log('Victory story checks passed: '+engine);
}catch(error){await p.screenshot({path:out+'/failure.png'});throw error;}finally{await browser.close();}
