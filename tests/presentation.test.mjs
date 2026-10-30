import test from 'node:test';
import assert from 'node:assert/strict';
import {MinionPresentation} from '../src/tutorial/presentation.js';
import {INTRO_HOLD_MS,normalizeNickname,nicknameProblem,PRESENTATION_STORY,PRESENTATION_SLIDES} from '../src/tutorial/presentation-data.js';
import {coffeeSaveHandoff,coffeeReadHandoff,coffeeApplyHandoff,createCoffeeTutorialVisit} from '../src/tutorial/closing.js';
import {chooseComment,WORLD_POSTS} from '../src/closing/social-model.js';

test('nickname accepts Korean and counts Unicode characters; rejects blank and markup',()=>{
 assert.equal(normalizeNickname('  밤의   미용사  '),'밤의 미용사');
 assert.equal(nicknameProblem('가'.repeat(16)),'');
 assert.equal(nicknameProblem('😀'.repeat(16)),'');
 for(const bad of ['', '   ', '가'.repeat(17), '<b>', '가\u200b']) assert.ok(nicknameProblem(bad));
});
test('completion and skip carry chosen name once, preserving the same reward',()=>{
 for(const mode of ['complete','skip']){
  const values=new Map(),storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)};
  assert.equal(coffeeSaveHandoff(createCoffeeTutorialVisit({skipped:mode==='skip'}),{__state:{nickname:'밤의미용사'}},storage),true);
  const handoff=coffeeReadHandoff(mode,storage),story=coffeeApplyHandoff({records:[],followers:0},handoff);
  assert.equal(story.followers,100);assert.equal(story.socialChoices.__state.nickname,'밤의미용사');
  assert.equal(story.records[0].skipped,mode==='skip');assert.equal(coffeeApplyHandoff(story,handoff),story);
  const post=WORLD_POSTS[0],choice=chooseComment({},post,0,story.socialChoices.__state.nickname);
  assert.equal(choice[post.id].comments[0].user,'밤의미용사');
 }
});
test('two refusals return to choice; third finishes with intro skip',()=>{
 let offers=0,skips=0;const p=Object.create(MinionPresentation.prototype);
 Object.assign(p,{refusals:0,choices:{},setMode(){},speak(lines,done){this.pending=done;},offer(){offers++;},skipIntro(){skips++;}});
 for(let i=0;i<3;i++){p.refuse();p.pending();assert.equal(offers,Math.min(i+1,2));assert.equal(skips,i===2?1:0);}
});
test('Space partial hold advances once; pause cancels pending skip; F works with a focused next button',()=>{
 const p=Object.create(MinionPresentation.prototype);let advances=0;
 Object.assign(p,{active:true,paused:false,skipping:false,clock:0,mode:'greeting',skip:{style:{setProperty(){}}},next(){advances++;}});
 p.beginHold('space');p.clock=INTRO_HOLD_MS-1;p.keyUp({code:'Space'});assert.equal(advances,1);assert.equal(p.hold,null);
 p.beginHold('space');p.pause(true);p.keyUp({code:'Space'});assert.equal(advances,1);assert.equal(p.hold,null);
 p.pause(false);assert.equal(p.keyDown({key:'f',target:{closest:()=>true},preventDefault(){},repeat:false}),true);assert.equal(advances,2);
});
test('cancel resolves delayed transitions as false, preventing a stale screen from returning',async()=>{
 const p=Object.create(MinionPresentation.prototype);
 Object.assign(p,{generation:0,clock:0,waiters:[],root:{},skip:{style:{setProperty(){}}}});
 const waiting=p.wait(1000);p.cancel();assert.equal(await waiting,false);assert.equal(p.waiters.length,0);assert.equal(p.active,false);
});

test('story and business stay on one screen until the final customer introduction',async()=>{
 const p=Object.create(MinionPresentation.prototype),classes=new Set(['screen-down','projecting']);let finished=0,raises=0;
 Object.assign(p,{storyIndex:0,clock:0,generation:0,screenDown:true,revealed:false,root:{dataset:{},querySelector:()=>({}),classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x))}},speak(lines,done){this.lines=lines;this.pending=done;},sound(kind){if(kind==='motor')raises++;},queueSigh(){},wait:async()=>true,complete(){finished++;}});
 p.storyBeat();
 for(let i=0;i<PRESENTATION_STORY.length;i++){assert.equal(p.lines[0],PRESENTATION_STORY[i].text);assert.equal(p.revealed,false);p.pending();}
 for(let i=0;i<PRESENTATION_SLIDES.length;i++){assert.equal(p.slideIndex,i);assert.equal(p.storyTarget,4+i);assert.equal(p.revealed,false);assert.ok(classes.has('screen-down'));p.pending();}
 assert.equal(p.mode,'wrapup');assert.match(p.lines.at(-1),/소개해 드릴 손님/);assert.equal(raises,0);assert.equal(finished,0);
 await p.pending();assert.equal(p.revealed,true);assert.equal(raises,1);assert.equal(finished,1);
});

test('layer blending and scrolling approach their targets without jumping or reversing',()=>{
 const p=Object.create(MinionPresentation.prototype),layer=()=>({style:{}});
 Object.assign(p,{storyY:0,storyTarget:1.13,bow:0,bowTarget:1,mirror:0,mirrorTarget:1,clock:0,sighAt:null,story:layer(),bowLayer:layer(),mirrorLayer:layer(),sighLayer:layer(),sighIcon:layer()});
 p.drawStory(80);assert.ok(p.storyY>0&&p.storyY<1.13);assert.ok(p.bow>0&&p.bow<1);assert.ok(p.mirror>0&&p.mirror<1);
 const before=p.storyY;for(let i=0;i<60;i++)p.drawStory(80);
 assert.ok(p.storyY>before&&p.storyY<=1.13);assert.ok(Math.abs(p.mirror-1)<.01);assert.equal(p.sighIcon.style.opacity,0);
});

test('a cancelled or skipped sigh does not play after the scene has changed',async()=>{
 const p=Object.create(MinionPresentation.prototype);let resolveWait,sounds=0;
 Object.assign(p,{storyIndex:5,generation:1,wait:()=>new Promise(r=>resolveWait=r),sound(){sounds++;}});
 const job=p.queueSigh();p.generation++;resolveWait(true);await job;assert.equal(sounds,0);
});

test('the mirror scene plays another sigh and keeps its puff visible over the mirror artwork',async()=>{
 const p=Object.create(MinionPresentation.prototype),layer=()=>({style:{}});let sounds=0;
 Object.assign(p,{storyIndex:6,generation:1,clock:2000,wait:async()=>true,sound(kind){if(kind==='sigh')sounds++;},storyY:1.04,storyTarget:1.04,bow:1,bowTarget:1,mirror:1,mirrorTarget:1,story:layer(),bowLayer:layer(),mirrorLayer:layer(),sighLayer:layer(),sighIcon:layer()});
 assert.equal(PRESENTATION_STORY[6].sigh,true);await p.queueSigh();assert.equal(sounds,1);assert.equal(p.sighPose,'mirror');
 p.clock+=850;p.drawStory(16);assert.equal(p.sighIcon.style.opacity,1);assert.equal(p.sighIcon.style.left,'43%');
 p.clock+=900;p.drawStory(16);assert.equal(p.sighIcon.style.opacity,0);assert.equal(sounds,1);
});
