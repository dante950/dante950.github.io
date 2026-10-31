import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {returningZombieBranch,returningBeautyStatus,returningDialogueEvent,returningStrokeReaction} from '../src/returning-zombie.js';
import {beautyAttachScore,beautyDrawScore} from '../src/beauty-rules.js';
import {recordStoryVisit} from '../src/story-progress.js';
import {runFromStory} from '../src/closing/model.js';
import {reviewPost} from '../src/closing/social-model.js';
const p=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url)));
const guest=p.guests.find(g=>g.returningZombie),b=guest.beauty;
const assets=JSON.parse(await fs.readFile(new URL('../data/assets.json',import.meta.url)));
const {COFFEE_STICKER_CATALOG}=await import('../src/tutorial/stickers.js');
test('first-day beauty, not a later battle victory, determines return branch',()=>{
 assert.equal(returningZombieBranch([{id:10001,day:1,mood:'angry',outcome:'victory'}]),'lottery');
 assert.equal(returningZombieBranch([{id:10001,day:1,mood:'neutral',outcome:'defeat'}]),'employed');
 assert.equal(returningZombieBranch([],'lottery'),'lottery');
 for(const branch of ['employed','lottery'])for(const success of [true,false]){
  const event=returningDialogueEvent(branch,success,!success,'result');
  assert(guest.bindings[event]);assert(guest.bindings[returningDialogueEvent(branch,success,!success,'leave')]);
 }
});
test('all approved crowns and glasses resolve to real selectable assets, not invented IDs',()=>{
 const expected={HeadTop:['T_Crown3.png','T_SoftHatBig.png','T_SoftHatLong.png','T_tara.png','T_Crown1.png','T_Crown2.png'],Eye:['T_Movieglasses.png','T_Sunglasses.png','T_SunglassesRed.png'],Neck:['T_necklace.png']};
 const good=b.attachRegions.map(r=>({sticker:assets.stickers.find(s=>s.id===r.stickerIDs[0]),region:r.key}));
 assert.equal(beautyAttachScore(good,b),30);assert(beautyAttachScore(good.slice(1),b)<30);
 for(const r of b.attachRegions){assert.deepEqual(r.stickerIDs.map(id=>assets.stickers.find(s=>s.id===id)?.resourceFile).sort(),expected[r.key].sort());for(const file of expected[r.key]){const sticker=assets.stickers.find(s=>s.resourceFile===file);assert(sticker);assert.equal(beautyAttachScore(good.map(p=>p.region===r.key?{sticker,region:r.key}:p),b),30,file);}}
 const hat=assets.stickers.find(s=>s.resourceFile==='T_SoftHatLong.png');assert(beautyAttachScore(good.map(p=>p.region==='Eye'?{sticker:hat,region:'Eye'}:p),b)<30);
 assert(beautyAttachScore([...good,good[1]],b)<30);
});
test('main and tutorial expose only the 43 specified stickers with valid references',()=>{
 assert.equal(assets.stickers.length,43);assert.equal(COFFEE_STICKER_CATALOG.length,43);
 assert.deepEqual(COFFEE_STICKER_CATALOG.map(s=>s.resourceFile).sort(),assets.stickers.map(s=>s.resourceFile).sort());
 const ids=new Set(assets.stickers.map(s=>s.id));assert.equal(ids.size,43);
 for(const guest of p.guests)for(const r of guest.beauty?.attachRegions||[])for(const id of r.stickerIDs)assert(ids.has(id),guest.id+': '+id);
 for(const file of ['T_hairtie_R.png','T_hornSmall_L.png','T_hornSmall_R.png','T_Hurt_R.png','T_Piercing1.png','T_Piercing2.png','T_screw_L.png','T_screw_R.png','T_skeleton.png','T_SmallRose.png','T_SoftHatSmall.png','T_Sunglasses2.png','T_Sunglasses3.png','T_SunglassesStar.png','T_WhiteStar.png','T_yellowStar.png'])assert(!assets.stickers.some(s=>s.resourceFile===file));
});
test('face growth stays free; tooth restoration dominates satisfaction; protests are one short line',()=>{
 assert.equal(b.growth.allowFace,true);assert.notEqual(b.growth.mask,'original');assert.deepEqual(b.weights,{cut:10,draw:60,attach:30});
 const dialogues=p.combat.sheets.find(s=>s.name==='대사').rows;for(const key of ['returnGrow','returnCut','returnWrongTooth']){const lines=dialogues.filter(r=>r.GroupID===guest.bindings[key]);assert.equal(lines.length,1);assert(lines[0].Text.length<=30);}
});
test('matching tooth color succeeds; wrong color and painting the whole mouth do not',()=>{
 const paint=(color,whole=false)=>{const pixels=new Uint8ClampedArray(320*350*4),r=b.drawRegions[whole?1:0];for(let y=r.y;y<=r.y+r.h;y++)for(let x=r.x;x<=r.x+r.w;x++)pixels.set([...color,255],(y*320+x)*4);return beautyDrawScore(pixels,b);};
 assert.equal(paint([253,255,129]),60);assert.equal(paint([255,211,66]),0);assert.equal(paint([253,255,129],true),0);
});
test('hair damage overrides otherwise good work, and restoration restores the success path',()=>{
 const original=new Uint8Array(100).fill(1),current=original.slice(),scores={draw:60,attach:30},placements=[{},{},{}];
 assert(returningBeautyStatus(original,current,b,scores,placements).success);
 current.fill(0,0,40);const bad=returningBeautyStatus(original,current,b,scores,placements);assert(!bad.success);assert(bad.hairRuined);
 current.set(original);assert(returningBeautyStatus(original,current,b,scores,placements).success);
 assert(!returningBeautyStatus(original,current,b,{draw:0,attach:30},placements).success);
});
test('return visit records once, never enters battle, and survives day-three closing adaptation',()=>{
 for(const success of [true,false]){
  const state={guest,day:3,records:[],followers:2200,returnBranch:'lottery',lastScore:success?100:30,lastMood:success?'satisfied':'angry',beautyDetails:{success},outcome:'beauty'};
  const next=recordStoryVisit(state,'portrait');assert.equal(next.followers,2200+(success?1100:0));assert.equal(recordStoryVisit(next,'portrait'),next);
  const run=runFromStory(next.records,3);assert.equal(run.visits.length,1);assert.equal(run.visits[0].beautySuccess,success);assert.equal(reviewPost(run.visits[0]).user,'Lucky_Zom');
 }
 assert.equal(guest.battle,'none');
});

test('a single changed hair cell reacts; wrong colour reacts only on teeth',()=>{
 const W=160,H=175,original=new Uint8Array(W*H),changed=original.slice(),paint=new Uint8ClampedArray(W*H*4),before=paint.slice();changed[10]=1;
 assert.equal(returningStrokeReaction({kind:'grow',snapshot:original},changed,paint,b,W,H,2),'returnGrow');
 assert.equal(returningStrokeReaction({kind:'scissors',snapshot:changed},original,paint,b,W,H,2),'returnCut');
 assert.equal(returningStrokeReaction({kind:'grow',snapshot:changed},changed,paint,b,W,H,2),null);
 const gesture={kind:'paint',paint:before};
 paint.set([255,30,20,255],(20*W+20)*4);assert.equal(returningStrokeReaction(gesture,original,paint,b,W,H,2),null);
 for(const color of [[255,30,20],[0,220,10],[72,58,223],[255,211,66]]){paint.set([...color,255],(75*W+82)*4);assert.equal(returningStrokeReaction(gesture,original,paint,b,W,H,2),'returnWrongTooth');}
 paint.set([255,30,20,2],(75*W+82)*4);assert.equal(returningStrokeReaction(gesture,original,paint,b,W,H,2),'returnWrongTooth');
 paint.set([253,255,129,255],(75*W+82)*4);assert.equal(returningStrokeReaction(gesture,original,paint,b,W,H,2),null);
});
test('result options resolve all eight replies and do not contain reward mutations',()=>{
 for(const branch of ['employed','lottery'])for(const result of ['Success','Fail']){const choices=guest.returningChoices[branch+result];assert.equal(choices.length,2);for(const option of choices){assert(guest.bindings[option.event]);assert.equal(typeof option.text,'string');}}
 assert.notEqual(b.growth.mask,'original');assert.equal(b.attachCount,3);
 const attach=p.combat.sheets.find(s=>s.name==='미용 대사 연결').rows.find(r=>r.MonsterID===guest.id&&r.Stage==='attach');
 for(const line of p.combat.sheets.find(s=>s.name==='대사').rows.filter(l=>[attach.RequestGroupID,attach.DetailGroupID].includes(l.GroupID)))assert(!/금목걸이|선글라스|T_/.test(line.Text));
});
