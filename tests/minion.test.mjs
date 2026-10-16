import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {addWorkshopGuests,projectProblems,storyStartOptions} from '../src/model.js';
import {salonDialogueGroup} from '../src/salon-dialogue.js';
import {beautyResultMood} from '../src/beauty-shape.js';
const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
test('the editable area goal rejects zero, non-numeric and above-start ratios',()=>{
 const p=structuredClone(project),r=p.guests.find(g=>g.id===10004).beauty.cutRegions.find(r=>r.rule==='area');
 for(const value of [0,1.01,'90']){r.maxRatio=value;assert(projectProblems(p).some(e=>e.includes('면적 비율')));}
 r.maxRatio=.85;assert.deepEqual(projectProblems(p),[]);
});
test('minion stays editable but cannot enter the unfinished story or battle',()=>{
 assert.deepEqual(projectProblems(project),[]);
 const g=project.guests.find(g=>g.id===10004);assert.equal(g.previewOnly,true);assert.equal(g.battle,'none');
 assert.equal(g.beauty.cutTool,'hammer');assert.notEqual(g.beauty.growth.mask,'original');
 assert.deepEqual(g.beauty.steps,{cut:true,draw:true,attach:false});
 assert(!storyStartOptions(project).some(s=>s.guest.id===10004));
 const p=structuredClone(project);p.schedule[1].push(10004);assert(projectProblems(p).some(s=>s.includes('본편 일정')));
 p.schedule[1].pop();p.guests[0].previewOnly=true;assert(projectProblems(p).length);
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
