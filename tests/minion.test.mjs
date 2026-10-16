import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {addWorkshopGuests,projectProblems,storyStartOptions} from '../src/model.js';
import {salonDialogueGroup} from '../src/salon-dialogue.js';
import {beautyResultMood} from '../src/beauty-shape.js';
import {beautyDrawScore,beautyInside,beautyAttachScore} from '../src/beauty-rules.js';
const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
test('three recognisable under-eye marks pass without perfect stencil filling; missing eyes and face paint fail',()=>{
 const b=project.guests.find(g=>g.id===10004).beauty,good=b.drawRegions.filter(r=>r.kind==='good');
 const pixels=new Uint8ClampedArray(320*350*4);
 function paintRegion(r,fraction=1,color=[3,5,27]){
  const cells=[];for(let y=0;y<350;y++)for(let x=0;x<320;x++)if(beautyInside(x,y,r))cells.push((y*320+x)*4);
  for(const i of cells.slice(0,Math.ceil(cells.length*fraction)))pixels.set([...color,255],i);
 }
 for(const r of good.slice(0,2))paintRegion(r,.65);
 assert(beautyDrawScore(pixels,b)<=20,'two circles cannot substitute for three');
 paintRegion(good[2],.65);
 assert.equal(beautyDrawScore(pixels,b),30,'65% of each circle is enough');
 for(const r of b.drawRegions.filter(r=>r.kind==='bad'&&r.key!=='RestFace'))paintRegion(r,.08);
 assert.equal(beautyDrawScore(pixels,b),30,'small brush spill at the eyes is tolerated');
 paintRegion(b.drawRegions.find(r=>r.key==='EyeLeftPaint'));
 assert(beautyDrawScore(pixels,b)<27,'painting an eye itself still fails');
 pixels.fill(0);for(const r of good)paintRegion(r,1,[255,48,36]);
 assert.equal(beautyDrawScore(pixels,b),0,'the requested darkest colour remains necessary');
 paintRegion(b.drawRegions.find(r=>r.key==='RestFace'));
 assert(beautyDrawScore(pixels,b)<27,'covering the whole face fails');
});
test('the editable area goal rejects zero, non-numeric and above-start ratios',()=>{
 const p=structuredClone(project),r=p.guests.find(g=>g.id===10004).beauty.cutRegions.find(r=>r.rule==='area');
 for(const value of [0,1.01,'90']){r.maxRatio=value;assert(projectProblems(p).some(e=>e.includes('면적 비율')));}
 r.maxRatio=.85;assert.deepEqual(projectProblems(p),[]);
});
test('minion enters the two-day story without unfinished battle data',()=>{
 assert.deepEqual(projectProblems(project),[]);
 const g=project.guests.find(g=>g.id===10004);assert.equal(g.previewOnly,false);assert.equal(g.battle,'none');
 assert.equal(g.beauty.cutTool,'hammer');assert.notEqual(g.beauty.growth.mask,'original');
 assert.deepEqual(g.beauty.steps,{cut:true,draw:true,attach:true});
 assert(storyStartOptions(project).some(s=>s.guest.id===10004));
 const p=structuredClone(project);p.guests.find(g=>g.id===10004).battle='forced';assert(projectProblems(p).length);
 p.guests.find(g=>g.id===10004).battle='none';p.guests[0].previewOnly=true;assert(projectProblems(p).length);
});
test('older silhouette drafts retain their original preservation feedback',()=>{
 const b={growth:{material:'horn'}};
 const shape=(keep,trim=1)=>({details:[{rule:'trim',ratio:trim,fulfilled:trim},{rule:'preserve',ratio:keep,fulfilled:Math.min(1,keep/.92)}]});
 assert.equal(beautyResultMood(b,shape(0),70),'angry');
 assert.equal(beautyResultMood(b,shape(.5),86),'neutral');
 assert.equal(beautyResultMood(b,shape(1,.8),90),'neutral');
 assert.equal(beautyResultMood(b,shape(.95),100),'satisfied');
});
test('older drafts gain the missing workshop guest without replacing user edits or colliding IDs',()=>{
 const p=structuredClone(project),sourceLinks=p.combat.sheets.find(s=>s.name==='미용 대사 연결');
 p.guests=p.guests.filter(g=>g.id!==10004);sourceLinks.rows=sourceLinks.rows.filter(r=>r.MonsterID!==10004);
 p.guests[0].beauty.cutRegions[0].x=106;salonDialogueGroup(p,10001,'cut').lines[0].Text='사용자 작업본 대사';
 const old=structuredClone(p);addWorkshopGuests(p,project);
 assert.deepEqual(p.guests.slice(0,3),old.guests);assert.deepEqual(p.schedule,old.schedule);
 for(const sheet of old.combat.sheets){const next=p.combat.sheets.find(s=>s.name===sheet.name);assert.deepEqual(next.rows.slice(0,sheet.rows.length),sheet.rows);}
 assert.deepEqual(projectProblems(p),[]);assert.equal(salonDialogueGroup(p,10004,'cut').lines.length,3);
 const once=JSON.stringify(p);addWorkshopGuests(p,project);assert.equal(JSON.stringify(p),once);
 p.guests[3].beauty.cutRegions[0].points=65;addWorkshopGuests(p,project);assert.equal(p.guests[3].beauty.cutRegions[0].points,65);
});

test('red nose uses the existing Fun tag and rewards only the nose placement',()=>{
 const b=project.guests.find(g=>g.id===10004).beauty,sticker={id:'ST-FUN-NOSE-RED',tag:'Tag_Fun'};
 assert.equal(beautyAttachScore([{sticker,region:'Nose'}],b),20);
 assert.equal(beautyAttachScore([{sticker,region:'Other'}],b),0);
 assert.equal(beautyAttachScore([{sticker:{id:'wrong',tag:'Tag_Strong'},region:'Nose'}],b),0);
 assert.equal(beautyAttachScore([{sticker,region:'Nose'},{sticker,region:'Nose'}],b),5);
 assert.deepEqual(b.weights,{cut:50,draw:30,attach:20});
 assert.match(salonDialogueGroup(project,10004,'attach').lines.map(l=>l.Text).join(''),/666년 무결근/);
});
