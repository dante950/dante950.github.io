import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {scoreShape,strokeCells,beautyStageOrder,liveBeautyMood} from '../src/beauty-shape.js';
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
