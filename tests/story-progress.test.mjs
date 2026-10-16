import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {recordStoryVisit} from '../src/story-progress.js';
import {runFromStory,closingSummary} from '../src/closing/model.js';
import {beautyDrawScore} from '../src/beauty-rules.js';
import {beautyResultMood} from '../src/beauty-shape.js';
const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
test('actual story rewards are immediate, idempotent, and closing only replays completed visits',()=>{
 let state={day:1,followers:0,records:[]};
 for(const [id,outcome,forcedBattle,expected] of [[10001,'defeat',false,1500],[10003,'victory',true,3000],[10004,'beauty',false,5000]]){
  state={...state,day:id===10004?2:1,guest:project.guests.find(g=>g.id===id),lastScore:60,lastMood:'neutral',outcome,forcedBattle,resultRecorded:false};
  const next=recordStoryVisit(state,'portrait');assert.equal(next.followers,expected);assert.equal(recordStoryVisit(next,'portrait'),next);state=next;
 }
 const run=runFromStory(state.records,2),summary=closingSummary(run);
 assert.equal(summary.start,3000);assert.equal(summary.total,5000);assert.equal(summary.gain,2000);assert.equal(summary.visits.length,1);assert(summary.eligibleForStar);
 const jumped=runFromStory([{...state.records[2],before:0,after:2000}],2);assert.equal(jumped.total,2000);assert.equal(jumped.dayStart,0);assert(!closingSummary(jumped).eligibleForStar);
});
test('forced losses cannot grant followers and only a proposed win grants the extra 200',()=>{
 const state={day:1,records:[],guest:project.guests[0],lastScore:100,forcedBattle:true,outcome:'defeat'};
 assert.equal(recordStoryVisit(state),state);
 assert.equal(recordStoryVisit({...state,forcedBattle:false,outcome:'victory'}).followers,1700);
});
test('one or two dark circles cannot earn the full three-eye requirement',()=>{
 const b=project.guests.find(g=>g.id===10004).beauty;
 const pixels=new Uint8ClampedArray(320*350*4),good=b.drawRegions.filter(r=>r.kind==='good');
 assert.equal(good.length,3);assert.equal(b.cutRegions.find(r=>r.rule==='area').maxRatio,.8);
 const shape={score:70,details:b.cutRegions.map(r=>({rule:r.rule,fulfilled:1}))};
 for(const [index,r] of good.entries()){
  for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)if(((x-r.x-r.w/2)/(r.w/2))**2+((y-r.y-r.h/2)/(r.h/2))**2<=1)pixels.set([3,5,27,255],(y*320+x)*4);
  const draw=beautyDrawScore(pixels,b);assert(draw<=(index+1)*10);
  if(index<2)assert.equal(beautyResultMood(b,shape,70+draw),'neutral');
 }
 assert(beautyDrawScore(pixels,b)>27);
});
