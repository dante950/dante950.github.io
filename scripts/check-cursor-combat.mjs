import {chromium,webkit} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const engine=process.env.YACHA_COMBAT_ENGINE||'chromium';
const output=path.resolve(process.env.YACHA_COMBAT_OUTPUT||'../heart-timing-2026-10-16');await fs.mkdir(output,{recursive:true});
const browser=await ({chromium,webkit}[engine]).launch({headless:true}),page=await browser.newPage({viewport:{width:1600,height:1700}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
const shot=name=>page.screenshot({path:path.join(output,name+'.png')});
let frame;
const state=()=>frame.evaluate(()=>({state:lab.battle.state,hp:lab.battle.enemyHP,remaining:lab.battle.staggerRemaining,cooldown:lab.battle.attackCooldownLeft,hits:lab.battle.basicHits,phase:lab.battle.monster.PhaseID,attempts:lab.battle.openingResult?.attempts,damage:lab.battle.openingResult?.damage,misses:lab.battle.openingResult?.misses,paused:lab.battle.paused,rush:lab.battle.rush,box:lab.scene.box,scratch:lab.scene.scratchBox,blocking:lab.battle.dialogueBlocking}));
async function talk(){for(let i=0;i<100;i++){if(!await frame.evaluate(()=>!!lab.battle.dialogues?.active))return;await frame.locator('#battleArea').focus();await page.keyboard.press('Enter');await page.waitForTimeout(60);}throw Error('Combat dialogue did not finish');}
async function coords(x,y){const r=await frame.locator('#arena').boundingBox();return[r.x+x*r.width/1280,r.y+y*r.height/650];}
async function clickMonster(){const {box}=await state();await page.mouse.click(...await coords(box.x+box.w/2,box.y+box.h/2));}
async function drag(){const {scratch}=await state(),y=scratch.y+scratch.h*.6,a=await coords(scratch.x+scratch.w*.25,y),b=await coords(scratch.x+scratch.w*.75,y);await page.mouse.move(...a);await page.mouse.down();await page.mouse.move(...b,{steps:8});const hitTime=await frame.evaluate(()=>lab.battle.time);await frame.waitForFunction(t=>lab.battle.time-t>=100,hitTime);await page.mouse.move(...a,{steps:8});await page.mouse.up();}
async function tenStrokes(){const {scratch}=await state(),y=scratch.y+scratch.h*.6,a=await coords(scratch.x+scratch.w*.25,y),b=await coords(scratch.x+scratch.w*.75,y);await page.mouse.move(...a);await page.mouse.down();for(let n=0;n<12;n++){await page.mouse.move(...(n%2?a:b));await page.waitForTimeout(100);}await page.mouse.up();}
try{
 await page.goto(process.env.YACHA_COMBAT_URL||'http://127.0.0.1:4173/');await page.locator('#siteLoading').waitFor({state:'detached'});
 await page.locator('#developer').click();if(await page.locator('#updateOK').isVisible())await page.locator('#updateOK').click();
 await page.locator('[data-editor="combat"]').first().click();frame=await page.locator('#combatEditor').elementHandle().then(h=>h.contentFrame());
 await frame.waitForFunction(()=>window.lab?.scene?.backdrop);await frame.locator('#sound').uncheck();
 await frame.locator('#modePattern').click();await frame.locator('#monster').selectOption('10001');await frame.locator('#pattern').selectOption('20001');await frame.locator('#testDamage').fill('0');
 await frame.locator('#start').click();await talk();await frame.locator('#arena').scrollIntoViewIfNeeded();
 assert.equal((await state()).hp,1000);await page.mouse.click(...await coords(650,250));assert.equal((await state()).hits,0);
 await clickMonster();assert.equal((await state()).hp,995);await clickMonster();assert.equal((await state()).hp,995);
 await shot('basic-click');
 for(let tries=0;tries<35&&(await state()).hits<20;tries++){await frame.waitForFunction(()=>lab.battle.attackReady);await clickMonster();}
 assert.equal((await state()).hits,20,'only accepted clicks count; moving out of the cursor is an ordinary miss');
 await frame.waitForFunction(()=>lab.battle.state==='opening'&&!lab.battle.dialogueBlocking);
 const before=await state();await page.keyboard.press('Space');assert.equal((await state()).attempts,0);await clickMonster();assert.equal((await state()).attempts,0);
 await drag();const after=await state();assert(after.attempts>=2);assert.equal(after.hp,before.hp-after.damage);await shot('opening-drag');
 await frame.waitForFunction(()=>lab.battle.state!=='opening');await talk();
 // This button starts the real gimmick; positions, timer and result are not injected.
 await frame.locator('summary').filter({hasText:'시험 도구'}).click();
 await frame.locator('#forceRush').click();await frame.locator('#arena').scrollIntoViewIfNeeded();let s=await state();assert(s.rush);
 const target=s.rush.stone-1;let pos=await frame.evaluate(()=>lab.battle.pos);
 await frame.locator('#battleArea').focus();
 while((pos-1)%3>0){await page.keyboard.press('a');pos--;}
 while(Math.floor((pos-1)/3)<Math.floor((target-1)/3)){await page.keyboard.press('s');pos+=3;}
 while(Math.floor((pos-1)/3)>Math.floor((target-1)/3)){await page.keyboard.press('w');pos-=3;}
 await shot('gravestone-induction');await frame.waitForFunction(()=>lab.battle.state==='staggerBreak'||lab.battle.state==='opening');
 assert.equal(await frame.evaluate(()=>lab.battle.rushSuccesses),1);
 // Pause is a visible user control; combat clocks must stop.
 await frame.locator('#pause').click();const paused=await frame.evaluate(()=>[lab.battle.time,lab.battle.attackCooldownLeft]);await page.waitForTimeout(250);assert.deepEqual(await frame.evaluate(()=>[lab.battle.time,lab.battle.attackCooldownLeft]),paused);
 await frame.locator('#pause').click();
 // Real three-phase fight, with only the visible force-opening preview control.
 await frame.locator('#modeBattle').click();await frame.locator('#monster').selectOption('10003');await frame.locator('#phase').selectOption('1');await frame.locator('#start').click();await talk();
 await frame.locator('#arena').scrollIntoViewIfNeeded();await clickMonster();assert.equal((await state()).hp,100);assert.equal((await state()).remaining,95);
 await frame.locator('#forceOpening').click();await frame.waitForFunction(()=>lab.battle.state==='opening');
 await frame.waitForFunction(()=>lab.battle.state!=='opening');
 assert.equal(await frame.evaluate(()=>lab.battle.heartsRemaining),3);
 assert.equal(await frame.evaluate(()=>lab.battle.cues.filter(c=>c.kind==='heartDrop').length),0);
 assert.equal((await state()).phase,1);await shot('empty-opening-keeps-all-hearts');await talk();
 for(let phase=1;phase<=3;phase++){
  await frame.locator('#forceOpening').click();await frame.waitForFunction(()=>lab.battle.state==='opening');
  await frame.locator('#arena').scrollIntoViewIfNeeded();
  if(phase===3)assert.equal(await frame.evaluate(()=>lab.battle.dialogues.active.group.GroupID),80047);
  const {scratch}=await state(),y=scratch.y+scratch.h*.6,a=await coords(scratch.x+scratch.w*.25,y),z=await coords(scratch.x+scratch.w*.75,y);
  await page.mouse.move(...a);await page.mouse.down();await page.mouse.move(...z,{steps:3});await page.mouse.up();
  assert.deepEqual(await frame.evaluate(()=>({hearts:lab.battle.heartsRemaining,drops:lab.battle.cues.filter(c=>c.kind==='heartDrop').length,hp:lab.battle.enemyHP,misses:lab.battle.openingResult.misses,phase:lab.battle.monster.PhaseID})),{hearts:4-phase,drops:phase-1,hp:0,misses:0,phase});
  await frame.waitForFunction(id=>lab.battle.dialogues.active?.group.GroupID===id,[80044,80046,80048][phase-1]);
  assert.equal(await frame.evaluate(()=>lab.battle.heartsRemaining),3-phase);
  assert.deepEqual(await frame.evaluate(()=>lab.battle.cues.filter(c=>c.kind==='heartDrop').map(c=>c.index)),[2,0,1].slice(0,phase));
  await page.waitForTimeout(240);
  await frame.locator('#arena').screenshot({path:path.join(output,'heart-falling-'+phase+'.png')});
  await frame.locator('#monsterBubble').waitFor();assert.equal(await frame.locator('#dialogueBox').isVisible(),false);
  const layout=await frame.evaluate(()=>{const box=document.getElementById('monsterBubble').getBoundingClientRect(),canvas=document.getElementById('arena').getBoundingClientRect();return {left:box.left>=canvas.left,right:box.right<=canvas.right,top:box.top>=canvas.top,bottom:box.bottom<canvas.bottom};});assert(Object.values(layout).every(Boolean));
  await shot('sans-result-'+phase);await frame.locator('#arena').screenshot({path:path.join(output,'hearts-and-bubble-'+phase+'.png')});await talk();
  if(phase<3)await frame.waitForFunction(p=>lab.battle.monster.PhaseID===p,phase+1);
  else{await frame.waitForFunction(()=>lab.battle.finale?.type==='소멸');await page.waitForTimeout(450);await shot('sans-death');await frame.waitForFunction(()=>lab.battle.state==='victory'&&lab.battle.actorDead);}
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(output,'browser-results.json'),JSON.stringify({engine,actualPointerInput:true,mode:'zombie pattern damage0; Sans fight with visible force-opening preview button',checks:['HP1000 preserved','basic5','20 clicks to stagger','non-Sans drag10','gravestone','pause','Sans punch immune','empty opening preserves hearts and phase','hit records without immediate drop','drop only at opening end, right-left-center','third warning','head bubble within canvas','old dialogue panel hidden','final dialogue then death then victory'],errors},null,2));
 console.log('Heart boards, head bubbles, three openings and death passed.');
}catch(e){await shot('failure');console.log({errors,diagnostic:frame?await state().catch(()=>null):null});throw e;}finally{await browser.close();}
