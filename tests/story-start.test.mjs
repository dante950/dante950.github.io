import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {storyStartOptions,createStoryState,stageForGuest} from '../src/model.js';
import {projectForPlay} from '../src/publishing.js';
const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
test('start from each scheduled guest, then keep the remaining customer order',()=>{
 assert.deepEqual(storyStartOptions(project).map(({guest,day,index})=>[guest.id,day,index]),[[10001,1,0],[10002,1,1],[10003,2,0]]);
 for(const [id,remaining,stage] of [[10001,[10001,10002,10003],'beauty'],[10002,[10002,10003],'battle'],[10003,[10003],'beauty']]){
  const state=createStoryState(structuredClone(project),id);
  assert.deepEqual([...state.project.schedule[state.day-1].slice(state.index),...state.project.schedule.slice(state.day).flat()],remaining);
  assert.equal(stageForGuest(state.project.guests.find(g=>g.id===id)),stage);
  assert.equal(state.money,0);assert.deepEqual(state.records,[]);assert.equal(state.soulUnlocked,false);
 }
});
test('start selection follows saved schedule and rejects an absent customer',()=>{
 const local=structuredClone(project);local.schedule=[[10003],[10002,10001]];local.guests[0].name='작업본 손님';
 const state=createStoryState(projectForPlay(project,local,true),10001);
 assert.equal(state.day,2);assert.equal(state.index,1);assert.equal(state.project.guests[0].name,'작업본 손님');
 assert.equal(createStoryState(projectForPlay(project,local,false),10001).day,1);
 state.records.push({id:10001});state.project.guests[0].name='플레이';
 assert.deepEqual(createStoryState(projectForPlay(project,local,true),10002).records,[]);
 assert.equal(local.guests[0].name,'작업본 손님');
 assert.throws(()=>createStoryState(project,99999),/영업 순서/);
});
