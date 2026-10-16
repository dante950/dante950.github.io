import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve('../tutorial-flow-2026-10-16');await fs.mkdir(output,{recursive:true});
const engine=process.env.YACHA_BROWSER==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
async function talk(){for(let n=0;n<220;n++){if(!await page.locator('#talkLayer').isVisible()){await page.waitForTimeout(180);if(!await page.locator('#talkLayer').isVisible())return;}await page.keyboard.press('Enter');await page.waitForTimeout(60);}throw Error('Dialogue stuck');}
async function shot(name){await page.screenshot({path:path.join(output,engine.name()+'-'+name+'.png')});}
async function drag(frame,from,to){const r=await frame.locator('.sculptCanvas').boundingBox();const xy=p=>({x:r.x+p.x/160*r.width,y:r.y+p.y/175*r.height});const a=xy(from),b=xy(to);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();}
try{
 await page.goto('http://127.0.0.1:4173/');await page.locator('#siteLoading').waitFor({state:'detached'});
 await page.locator('#play').click();await page.locator('[data-start-guest="10001"]').click();await page.locator('#introSkip').click();
 const salon=await page.locator('#salon').elementHandle().then(h=>h.contentFrame());
 await salon.locator('#openShopBtn').click();await salon.locator('#interactPrompt').waitFor();await salon.locator('#gameWorld').click({position:{x:600,y:440}});await page.keyboard.press('f');await page.locator('#talkLayer').waitFor();await talk();
 await salon.locator('#beautyTutorial[data-step=cut]').waitFor();await shot('beauty-cut');
 assert(await salon.locator('#beautyTutorialNext').isDisabled());
 await drag(salon,{x:1,y:1},{x:4,y:1});assert(await salon.locator('#beautyTutorialNext').isDisabled(),'empty stroke must not complete practice');
 const cut=await salon.evaluate(()=>{const m=beautyDebug.material;for(let y=15;y<90;y++){const xs=[];for(let x=15;x<145;x++)if(m[y*160+x])xs.push(x);if(xs.length>30)return {x:xs[0],y};}throw Error('No hair');});
 await drag(salon,{x:cut.x-2,y:cut.y+2},{x:cut.x+18,y:cut.y+2});
 await salon.locator('#beautyTutorialNext:not([disabled])').waitFor();await salon.locator('#beautyTutorialNext').click();
 assert.equal(await salon.locator('#beautyTutorial').getAttribute('data-step'),'grow');await salon.locator('[data-tool=grow]').click();
 await drag(salon,{x:cut.x+8,y:cut.y+5},{x:cut.x+8,y:cut.y-8});await salon.locator('#beautyTutorialNext:not([disabled])').waitFor();await salon.locator('#beautyTutorialNext').click();
 assert.equal(await salon.locator('#beautyTutorial').getAttribute('data-step'),'request');await shot('beauty-request');await salon.locator('#beautyTutorialNext').click();await talk();
 await salon.locator('#beautyTutorial[data-step=draw]').waitFor();await salon.locator('[data-color]').first().click();await drag(salon,{x:80,y:60},{x:85,y:65});await salon.locator('#beautyTutorialNext:not([disabled])').waitFor();await salon.locator('#beautyTutorialNext').click();
 assert.equal(await salon.locator('#beautyTutorial').getAttribute('data-step'),'stages');await salon.locator('[data-phase=cut]').click();await salon.locator('[data-phase=draw]').click();await shot('beauty-stages');await salon.locator('#beautyTutorialNext').click();await talk();
 await salon.locator('#beautyTutorial[data-step=attach]').waitFor();await salon.locator('[data-sticker]').first().click();const r=await salon.locator('.sculptCanvas').boundingBox();await page.mouse.click(r.x+r.width*.5,r.y+r.height*.35);await salon.locator('#beautyTutorialNext:not([disabled])').waitFor();await salon.locator('#beautyTutorialNext').click();await shot('beauty-complete');await salon.locator('#beautyTutorialNext').click();
 assert.equal(await salon.locator('#beautyTutorial').isVisible(),false);assert(await salon.locator('.beautyNext').isVisible());assert.equal(await salon.evaluate(()=>beautyDebug.placements.length),1);
 console.log('Beauty actions, no-op guard, stage switching and completion passed');
 await salon.locator('.beautyNext').click();await salon.locator('#beautyResultContinue').click();await talk();await page.locator('#acceptBattle').click();
 const combat=await page.locator('#storyBattle').elementHandle().then(h=>h.contentFrame());await combat.locator('#battleTutorial[data-step=move]').waitFor();
 const snapshot=()=>combat.evaluate(()=>({time:lab.battle.time,visual:lab.battle.visualTime,hp:lab.battle.hp,enemy:lab.battle.enemyHP,cooldown:lab.battle.attackCooldownLeft}));
 const before=await snapshot();await page.waitForTimeout(1100);assert.deepEqual(await snapshot(),before,'intro freezes all clocks');await combat.locator('#battleArea').click({position:{x:25,y:420}});const pos=await combat.evaluate(()=>lab.battle.pos);await page.keyboard.press('a');assert.notEqual(await combat.evaluate(()=>lab.battle.pos),pos);await page.keyboard.press('Escape');assert(await combat.evaluate(()=>lab.battle.paused));assert.deepEqual(await snapshot(),before);await shot('battle-move');
 await combat.locator('#battleTutorialNext').click();await shot('battle-gauges');await combat.locator('#battleTutorialNext').click();await shot('battle-punch');
 await combat.locator('#battleTutorialNext').click();await combat.waitForFunction(()=>!lab.battle.paused);await page.waitForTimeout(200);assert((await snapshot()).visual>before.visual);
 // Exercise the real transition with a deterministic stagger fixture, not a claimed playthrough.
 await combat.evaluate(()=>{const b=lab.battle;b.dialogues.active=null;b.dialogues.queue=[];b.state='recover';b.next=b.time+60000;b.stagger=b.settings.staggerMax;b.beginStagger();});
 await combat.locator('#battleTutorial[data-step=opening]').waitFor();const openingBefore=await snapshot();const remaining=await combat.evaluate(()=>lab.battle.groggyEnd-lab.battle.time);assert.equal(remaining,3330);
 await page.waitForTimeout(1200);assert.deepEqual(await snapshot(),openingBefore);assert.equal(await combat.evaluate(()=>lab.battle.groggyEnd-lab.battle.time),remaining);await page.keyboard.press('Escape');assert(await combat.evaluate(()=>lab.battle.paused));await shot('battle-opening');
 await page.setViewportSize({width:960,height:700});await shot('opening-small');const panel=await combat.locator('#battleTutorial').boundingBox(),arena=await combat.locator('#arena').boundingBox();assert(panel.x>=arena.x&&panel.y>=arena.y&&panel.y+panel.height<=arena.y+arena.height,'small screen tutorial fits');await combat.locator('#battleTutorialNext').click();
 await combat.waitForFunction(()=>!lab.battle.paused);await page.waitForTimeout(150);assert.equal(await combat.evaluate(()=>lab.battle.openingResult.attempts),0,'closing tutorial never counts as a hit');
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(output,engine.name()+'-checks.json'),JSON.stringify({beautyHandsOn:true,emptyStrokeBlocked:true,freeStageSwitch:true,battleMovement:true,introPause:true,openingPause:true,fullOpeningMs:remaining,smallLayout:true,errors},null,2));console.log(engine.name()+': tutorial sequence and exact runtime pauses passed');
} catch(error){await shot('failure');console.error('Browser errors:',errors);throw error;}finally{await browser.close();}
