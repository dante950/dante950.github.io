import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {scoreShape,strokeCells,beautyStageOrder,liveBeautyMood,beautyRequirementChecks,detachedByBeautyCut,blendBeautyRGBA} from '../src/beauty-shape.js';
import {defaultProject,projectProblems} from '../src/model.js';
const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
const assets=JSON.parse(await fs.readFile(new URL('../data/assets.json',import.meta.url),'utf8'));
test('new and reset projects have the same beauty requirements, optional color and stage order',()=>{
 const reset=defaultProject(project.combat,assets);
 for(const id of [10001,10003]){
  const b=project.guests.find(g=>g.id===id).beauty;
  assert.deepEqual(reset.guests.find(g=>g.id===id).beauty,b);
  assert.deepEqual(beautyStageOrder(b),['cut','draw','attach']);assert.equal(b.weights.draw,0);
 }
 assert.equal(project.guests.find(g=>g.id===10002).beauty.enabled,false);
 assert.deepEqual(projectProblems(project),[]);
});
test('coverage counts fixed mask pixels rather than transparent corners and repairs recover points',()=>{
 const width=10,height=10,original=new Uint8Array(100),current=new Uint8Array(100);
 const eyes=new Uint8Array(100),brain=new Uint8Array(100);
 eyes[22]=eyes[23]=1;brain[24]=brain[25]=1;current[22]=current[23]=1;current[24]=current[25]=2;
 const b={designVersion:2,weights:{cut:70},cutRegions:[{key:'eye',label:'eye',x:0,y:0,w:20,h:20,rule:'clear',points:40,tolerance:0,mask:'eyes'},{key:'brain',label:'brain',x:0,y:0,w:20,h:20,rule:'cover',points:30,tolerance:0,mask:'brain'}]};
 assert.equal(scoreShape(current,original,b,width,height,{eyes,brain}).score,30);
 current[22]=0;assert.equal(scoreShape(current,original,b,width,height,{eyes,brain}).score,50);
 current[23]=0;assert.equal(scoreShape(current,original,b,width,height,{eyes,brain}).score,70);
 current[24]=0;assert.equal(scoreShape(current,original,b,width,height,{eyes,brain}).score,55);
 current[24]=2;assert.equal(scoreShape(current,original,b,width,height,{eyes,brain}).score,70);
});
test('stroke cuts only the swept path and clamps drags outside the portrait',()=>{
 const cells=strokeCells(10,10,[{x:10,y:-50},{x:10,y:50}],2);
 assert(cells.has(5*10+4));assert(!cells.has(5*10));assert([...cells].every(n=>n>=0&&n<100));
});
test('expression starts neutral and hysteresis prevents boundary flicker',()=>{
 assert.equal(liveBeautyMood(0,'neutral',false),'neutral');
 assert.equal(liveBeautyMood(83,'neutral',true),'satisfied');
 assert.equal(liveBeautyMood(79,'satisfied',true),'satisfied');
 assert.equal(liveBeautyMood(35,'neutral',true),'angry');
 assert.equal(liveBeautyMood(41,'angry',true),'angry');
 assert.equal(liveBeautyMood(50,'angry',true),'neutral');
});
test('invalid growth extent, tolerance and incomplete condition weights fail validation',()=>{
 for(const mutate of [b=>b.growth.region.h=900,b=>b.cutRegions[0].tolerance=1,b=>b.cutRegions[0].points=0]){
  const p=structuredClone(project);mutate(p.guests[0].beauty);assert(projectProblems(p).length>0);
 }
});


test('older imported projects retain trim scoring without new rule fields',()=>{
 const original=new Uint8Array(100).fill(1),current=original.slice();current.fill(0,0,50);
 const b={cutTool:'hammer',weights:{cut:70},cutRegions:[{x:0,y:0,w:20,h:10,kind:'good'}]};
 assert.equal(scoreShape(current,original,b,10,10).score,70);
 current[70]=0;assert(scoreShape(current,original,b,10,10).score<70);
});


test('every original trim pixel is reachable, including the former protected face',()=>{
 const original=Uint8Array.of(1,1),current=Uint8Array.of(1,0),face=Uint8Array.of(1,0);
 const b={designVersion:2,growth:{material:'bone'},weights:{cut:70},cutRegions:[{x:0,y:0,w:4,h:2,rule:'trim',points:70,tolerance:0}]};
 assert.equal(scoreShape(current,original,b,2,1,{face}).score,35);
 current[0]=0;assert.equal(scoreShape(current,original,b,2,1,{face}).score,70);
});
test('memo checks combine both eyes, track brain coverage, and revoke on regression',()=>{
 const b=project.guests[0].beauty,details=[
  {rule:'clear',fulfilled:1},{rule:'clear',fulfilled:.9},{rule:'cover',fulfilled:1}];
 const check=()=>beautyRequirementChecks(b,'cut',{details},{cut:65},0);
 assert.deepEqual(check(),[false,true]);details[1].fulfilled=1;assert.deepEqual(check(),[true,true]);
 details[2].fulfilled=.8;assert.deepEqual(check(),[true,false]);
 assert.deepEqual(beautyRequirementChecks(b,'attach',{}, {attach:30},1),[true]);
 assert.deepEqual(beautyRequirementChecks(b,'attach',{}, {attach:15},2),[false]);
 assert.deepEqual(beautyRequirementChecks(b,'attach',{}, {attach:30},2),[false]);
 assert.deepEqual(beautyRequirementChecks(b,'draw',{}, {draw:0},0),[true]);
});
test('bone integrity feedback uses the existing interior and eye-cover rules',()=>{
 const original=new Uint8Array(8).fill(1),current=original.slice(),eyes=new Uint8Array(8);eyes[2]=1;
 const b={designVersion:2,growth:{material:'bone'},weights:{cut:70},cutRegions:[{x:0,y:0,w:2,h:4,rule:'trim',points:70,tolerance:0}]};
 current[0]=current[4]=0;
 let shape=scoreShape(current,original,b,4,2,{eyes});
 assert.equal(shape.score,70);assert.deepEqual(beautyRequirementChecks(b,'cut',shape,{cut:70},0),[true,true]);
 current[2]=2;shape=scoreShape(current,original,b,4,2,{eyes});
 assert.equal(shape.score,0);assert.equal(shape.interiorIntact,false);
 current[2]=1;current[3]=0;shape=scoreShape(current,original,b,4,2,{eyes});
 assert.equal(shape.score,35);assert.equal(shape.interiorIntact,false);
 current[3]=1;assert.equal(scoreShape(current,original,b,4,2,{eyes}).score,70);
});

import {parseDialogueText} from '../src/text-effects.js';
test('both guests have valid highlighted initial and detailed requests for every stage',()=>{for(const id of [10001,10003]){const b=project.guests.find(g=>g.id===id).beauty;for(const stage of ['cut','draw','attach']){for(const text of [stage==='cut'?b.request:b[stage+'Hint'],b.requestDetails[stage]]){const rich=parseDialogueText(text);assert.deepEqual(rich.warnings,[]);assert(rich.glyphs.some(g=>g.style.color!=='#F0EEE3'));}assert(b.requestBriefNotes[stage]);}}});

test('a cut removes newly detached original and grown fragments but keeps independent growth',()=>{
 const before=new Uint8Array(35),roots=new Uint8Array(35);
 for(const n of [1,6,11,16,21,26,34])before[n]=n>=16?2:1;
 roots[1]=1;const after=before.slice();after[11]=0;
 assert.deepEqual(detachedByBeautyCut(before,after,5,7,roots).sort((a,b)=>a-b),[16,21,26]);
 assert.equal(after[34],2,'the helper does not mutate existing independent material');
});
test('the anchored scalp side survives even if the loose piece is larger',()=>{
 const before=Uint8Array.of(1,1,2,2,2,2,2),after=before.slice(),roots=Uint8Array.of(1,0,0,0,0,0,0);after[2]=0;
 assert.deepEqual(detachedByBeautyCut(before,after,7,1,roots),[3,4,5,6]);
});
test('partial vertical cuts and diagonal connections do not detach material',()=>{
 const before=new Uint8Array(25).fill(1),after=before.slice();for(const n of [12,17,22])after[n]=0;
 assert.deepEqual(detachedByBeautyCut(before,after,5,5),[]);
 const diagonal=new Uint8Array(25);for(const n of [0,6,12,18,24])diagonal[n]=1;
 assert.deepEqual(detachedByBeautyCut(diagonal,diagonal.slice(),5,5),[]);
 const split=diagonal.slice();split[12]=0;assert.deepEqual(detachedByBeautyCut(diagonal,split,5,5),[18,24]);
});
test('cutting a free-grown island keeps its main remainder and does not bridge row edges',()=>{
 const before=Uint8Array.of(2,2,2,2,2,2,0,0,0,0,0,2,0,0,0),after=before.slice();after[2]=0;
 assert.deepEqual(detachedByBeautyCut(before,after,5,3).sort((a,b)=>a-b),[3,4]);
 assert.deepEqual(detachedByBeautyCut(before,before.slice(),5,3),[]);
});

test('bone request checks accept a sufficient trim with small slips without changing the score',()=>{
 const original=new Uint8Array(300).fill(1),current=original.slice(),eyes=new Uint8Array(300);eyes.fill(1,100,200);
 const b={designVersion:2,growth:{material:'bone'},weights:{cut:70},cutRegions:[{x:0,y:0,w:200,h:2,rule:'trim',points:70,tolerance:.15}]};
 const read=()=>scoreShape(current,original,b,100,3,{eyes});
 const checks=()=>beautyRequirementChecks(b,'cut',read(),{cut:70,attach:30,total:100},1);
 assert.deepEqual(checks(),[false,true],'a sticker or high total cannot complete untouched trim');
 current.fill(0,0,49);assert.deepEqual(checks(),[false,true]);
 current[49]=0;assert.deepEqual(checks(),[true,true],'50% is sufficient, below the 85% full-score target');
 assert(Math.abs(read().score-70*.5/.85)<1e-9);
 current.fill(0,50,100);assert.equal(read().score,70);
 current.fill(0,290,300);assert.equal(read().interiorLossRatio,.05);assert.deepEqual(checks(),[true,true]);
 assert.equal(read().score,59.5,'the pre-existing proportional damage penalty is unchanged');
 current.fill(0,275,290);assert.deepEqual(checks(),[true,false],'larger damage still revokes preservation');
 current.fill(1,275,300);assert.deepEqual(checks(),[true,true],'repair regains completion');
 current.fill(2,100,105);assert.equal(read().eyeCoverRatio,.05);assert.deepEqual(checks(),[true,true]);
 current.fill(2,105,113);assert.deepEqual(checks(),[true,false],'significant covered eyes still fail');
 current.fill(1,100,113);assert.deepEqual(checks(),[true,true]);
 current.fill(0);assert.deepEqual(checks(),[true,false],'removing the whole face cannot fulfill the request');
});
test('bone checks reward a balanced silhouette without requiring every tiny target',()=>{
 const b=project.guests.find(g=>g.id===10003).beauty;
 const details=b.cutRegions.map(()=>({rule:'trim',ratio:0,fulfilled:0,total:100}));
 const check=()=>beautyRequirementChecks(b,'cut',{details,interiorIntact:true},{cut:70,attach:30,total:100},1);
 const set=(i,ratio)=>Object.assign(details[i],{ratio,fulfilled:ratio/.85});
 assert.deepEqual(check(),[false,true]);
 for(let i=0;i<4;i++)set(i,.75);
 assert.deepEqual(check(),[true,true],'four of six trimmed targets with 50% total removal is enough');
 set(3,.74);assert.deepEqual(check(),[false,true],'overall removal is still required');
 for(let i=0;i<6;i++)set(i,i<3?1:0);
 assert.deepEqual(check(),[false,true],'one-sided work cannot pass just from total pixels');
 for(let i=0;i<6;i++)set(i,.5);
 details[5].total=2;set(5,0);set(0,.52);
 assert.deepEqual(check(),[true,true],'a tiny untouched chin region cannot veto the rest');
 for(const d of details){d.ratio=.1;d.fulfilled=1;}
 assert.deepEqual(check(),[true,true],'configured easier targets still take precedence');
});

test('translucent paint mixes over material without making the underlying material transparent',()=>{
 const half=blendBeautyRGBA([0,0,0,0],[255,0,0],.5);assert.deepEqual(half,[255,0,0,128]);
 assert.deepEqual(blendBeautyRGBA([100,200,240,255],half,half[3]/255),[178,100,120,255]);
 assert.deepEqual(blendBeautyRGBA(half,[255,0,0],.5),[255,0,0,192]);
 assert.deepEqual(blendBeautyRGBA(half,[0,0,255],1),[0,0,255,255]);
 assert.deepEqual(blendBeautyRGBA([0,0,0,0],[255,0,0],0),[0,0,0,0]);
});
test('protected face pixels cannot make trim targets impossible or cause a damage penalty',()=>{
 const original=Uint8Array.of(1,1,1,1),current=Uint8Array.of(0,1,0,1),protectedFace=Uint8Array.of(0,1,1,1),eyes=Uint8Array.of(0,1,1,1);
 const b={designVersion:2,growth:{material:'bone'},weights:{cut:70},cutRegions:[{x:0,y:0,w:4,h:2,rule:'trim',points:70,tolerance:0}]};
 let shape=scoreShape(current,original,b,4,1,{protectedFace,eyes});
 assert.equal(shape.score,70);assert.equal(shape.details[0].total,1);assert.equal(shape.details[0].protectedTotal,1);
 assert.deepEqual(beautyRequirementChecks(b,'cut',shape,{cut:70},0),[true,true]);
 current[0]=1;assert.equal(scoreShape(current,original,b,4,1,{protectedFace,eyes}).score,0,'an editable target must still be trimmed');
 b.cutRegions[0].x=2;b.cutRegions[0].w=4;
 shape=scoreShape(current,original,b,4,1,{protectedFace,eyes});
 assert.equal(shape.details[0].total,0);assert.equal(shape.score,70,'a target entirely inside immutable artwork does not block completion');
 b.cutRegions[0].x=20;assert.equal(scoreShape(current,original,b,4,1,{protectedFace,eyes}).score,0,'an invalid empty target does not gain points');
});
test('the five supplied Sans feature assets have valid placement data and ship as PNGs',async()=>{
 for(const [part,states] of Object.entries(assets.sansFace)){
  for(const frame of Object.values(states)){
   assert(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=29&&frame.y+frame.h<=31,part);
   const png=await fs.readFile(new URL('../public/'+frame.src,import.meta.url));
   assert.equal(png.subarray(1,4).toString(),'PNG');
  }
 }
 assert.equal(Object.keys(assets.sansFace.eyes).length,3);assert.equal(Object.keys(assets.sansFace.mouth).length,2);
});
