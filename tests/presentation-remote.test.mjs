import test from 'node:test';
import assert from 'node:assert/strict';
import {remoteFrame,drawRemote,REMOTE_CLICK_AT} from '../src/tutorial/presentation-remote.js';
test('remote press matches cue and final pose stays without looping',()=>{assert.deepEqual([0,219,220,519,REMOTE_CLICK_AT,799,800,1200,10000].map(remoteFrame),[0,0,1,1,2,2,3,3,3]);});
test('sprite crops four cells and aligns feet despite source margins',()=>{const calls=[],c={save(){},restore(){},drawImage(...a){calls.push(a);}},im={width:2048,height:768};for(const age of [0,220,520,800])drawRemote(c,im,690,425,620,age);assert.deepEqual(calls.map(a=>a.slice(1,5)),[0,512,1024,1536].map(x=>[x,0,512,768]));assert.deepEqual(calls.map(a=>a[6]),[-223,-223,-223,-223]);assert.equal(c.imageSmoothingEnabled,false);});
