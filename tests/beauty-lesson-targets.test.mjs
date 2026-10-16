import test from 'node:test';
import assert from 'node:assert/strict';
import {beautyLessonPoint,beautyLessonRemoved} from '../src/beauty-lesson-targets.js';

test('cut practice selects existing removable material and avoids protected or anchored pixels',()=>{
 const material=[1,1,1,0],protectedMask=[1,0,0,0],anchors=[0,1,0,0];
 assert.deepEqual(beautyLessonPoint({material,protectedMask,anchors,width:2,height:2,near:{x:1,y:1}}),{x:1,y:3});
 assert.equal(beautyLessonPoint({material:[0,0,0,0],width:2,height:2}),null);
});
test('practice prefers requested regions while painting can target exposed face',()=>{
 const material=[1,0,0,1],regions=[{x:2,y:2,w:2,h:2}];
 assert.deepEqual(beautyLessonPoint({material,width:2,height:2,regions,near:{x:1,y:1}}),{x:3,y:3});
 assert.deepEqual(beautyLessonPoint({material:[0,0,0,0],face:[0,1,0,0],mode:'paint',width:2,height:2}),{x:3,y:1});
});
test('growth practice follows actual removed pixels and excludes pre-existing empty areas',()=>{
 assert.deepEqual(beautyLessonRemoved([1,0,1,1],[0,0,2,0],2),[{x:1,y:1},{x:3,y:3}]);
 assert.deepEqual(beautyLessonRemoved([1,0],[1,0],2),[]);
});
