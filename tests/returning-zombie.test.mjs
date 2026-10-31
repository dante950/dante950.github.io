import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {returningZombieBranch,returningBeautyStatus,returningDialogueEvent} from '../src/returning-zombie.js';
import {beautyAttachScore,beautyDrawScore} from '../src/beauty-rules.js';
import {recordStoryVisit} from '../src/story-progress.js';
import {runFromStory} from '../src/closing/model.js';
import {reviewPost} from '../src/closing/social-model.js';
const p=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url)));
const guest=p.guests.find(g=>g.returningZombie),b=guest.beauty;
test('first-day beauty, not a later battle victory, determines return branch',()=>{
 assert.equal(returningZombieBranch([{id:10001,day:1,mood:'angry',outcome:'victory'}]),'lottery');
 assert.equal(returningZombieBranch([{id:10001,day:1,mood:'neutral',outcome:'defeat'}]),'employed');
 assert.equal(returningZombieBranch([],'lottery'),'lottery');
 for(const branch of ['employed','lottery'])for(const success of [true,false]){
  const event=returningDialogueEvent(branch,success,!success,'result');
  assert(guest.bindings[event]);assert(guest.bindings[returningDialogueEvent(branch,success,!success,'leave')]);
 }
});
test('both decoration slots are required; two glasses cannot substitute for the necklace',()=>{
 const glasses={id:'ST-HIP-SUNGLASSES-BLACK',tag:'Tag_Hip'},red={id:'ST-HIP-SUNGLASSES-RED',tag:'Tag_Hip'},chain={id:'ST-RESOURCE-T_necklace',tag:'Tag_Hip'};
 assert.equal(beautyAttachScore([{sticker:glasses,region:'Eye'},{sticker:chain,region:'Neck'}],b),40);
 assert(beautyAttachScore([{sticker:glasses,region:'Eye'},{sticker:red,region:'Eye'}],b)<40);
 assert(beautyAttachScore([{sticker:chain,region:'Eye'},{sticker:glasses,region:'Neck'}],b)<40);
});
test('matching tooth color succeeds; wrong color and painting the whole mouth do not',()=>{
 const paint=(color,whole=false)=>{const pixels=new Uint8ClampedArray(320*350*4),r=b.drawRegions[whole?1:0];for(let y=r.y;y<=r.y+r.h;y++)for(let x=r.x;x<=r.x+r.w;x++)pixels.set([...color,255],(y*320+x)*4);return beautyDrawScore(pixels,b);};
 assert.equal(paint([253,255,129]),30);assert.equal(paint([255,211,66]),0);assert.equal(paint([253,255,129],true),0);
});
test('hair damage overrides otherwise good work, and restoration restores the success path',()=>{
 const original=new Uint8Array(100).fill(1),current=original.slice(),scores={draw:30,attach:40},placements=[{},{}];
 assert(returningBeautyStatus(original,current,b,scores,placements).success);
 current.fill(0,0,40);const bad=returningBeautyStatus(original,current,b,scores,placements);assert(!bad.success);assert(bad.hairRuined);
 current.set(original);assert(returningBeautyStatus(original,current,b,scores,placements).success);
 assert(!returningBeautyStatus(original,current,b,{draw:0,attach:40},placements).success);
});
test('return visit records once, never enters battle, and survives day-three closing adaptation',()=>{
 for(const success of [true,false]){
  const state={guest,day:3,records:[],followers:2200,returnBranch:'lottery',lastScore:success?100:30,lastMood:success?'satisfied':'angry',beautyDetails:{success},outcome:'beauty'};
  const next=recordStoryVisit(state,'portrait');assert.equal(next.followers,2200+(success?1100:0));assert.equal(recordStoryVisit(next,'portrait'),next);
  const run=runFromStory(next.records,3);assert.equal(run.visits.length,1);assert.equal(run.visits[0].beautySuccess,success);assert.equal(reviewPost(run.visits[0]).user,'Lucky_Zom');
 }
 assert.equal(guest.battle,'none');
});
