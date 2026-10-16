import test from 'node:test';
import assert from 'node:assert/strict';
import {rootedBeautyMaterial,beautyRootMask,scoreShape,beautyRequirementChecks,beautyResultMood} from '../src/beauty-shape.js';
const b={designVersion:2,steps:{cut:true,draw:true},weights:{cut:70,draw:30},growth:{material:'horn',connected:true,allowFace:true},cutRegions:[
 {key:'eye',rule:'clear',mask:'eyes',x:0,y:0,w:10,h:8,tolerance:0,points:30},
 {key:'area',rule:'area',x:0,y:0,w:10,h:8,tolerance:0,points:40,maxRatio:.9},
]};
test('new shape is accepted by total occupied area, not the original silhouette',()=>{
 const original=Uint8Array.from({length:20},(_,n)=>Number(n<10)),current=original.slice(),eyes=new Uint8Array(20);eyes[19]=1;
 const score=m=>scoreShape(m,original,b,5,4,{eyes});
 assert.equal(score(current).areaRatio,1);assert.equal(score(current).details[1].fulfilled,0);
 current.fill(0);for(const n of [1,2,3,4,10,11,12,13,14])current[n]=2;
 const shape=score(current);assert.equal(shape.areaRatio,.9);assert.equal(shape.score,70);
 assert.deepEqual(beautyRequirementChecks(b,'cut',shape,{cut:70},0),[true,true]);
 assert.equal(beautyResultMood(b,shape,100),'satisfied');
 current[15]=2;assert.equal(score(current).details[1].fulfilled,0);
 current[16]=2;assert.equal(score(current).hardFailure,true);assert.equal(score(current).score,0);
 assert.equal(beautyResultMood(b,score(current),100),'angry');
 current.fill(0);current[19]=2;assert.equal(score(current).eyeCoverCount,1);assert.equal(score(current).score,0);
 assert.equal(beautyResultMood(b,score(current),100),'angry');
 current[19]=0;assert.equal(score(current).hardFailure,false,'clearing the eye recovers the result immediately');
});
test('only root-connected candidate pixels grow, including diagonals but never row wrapping',()=>{
 const material=new Uint8Array(15),roots=new Uint8Array(15);material[0]=roots[0]=1;
 const grown=rootedBeautyMaterial(material,roots,5,3,new Set([6,12,4,9]));
 assert.equal(grown[6],1);assert.equal(grown[12],1);assert.equal(grown[4],0);assert.equal(grown[9],0);
 material[6]=material[12]=2;material[6]=0;
 assert.equal(rootedBeautyMaterial(material,roots,5,3)[12],0,'a severed tip has no head connection');
 const edge=new Uint8Array(15);edge[4]=1;
 assert.equal(rootedBeautyMaterial(edge,edge,5,3,new Set([5]))[5],0);
});
test('the root mask contains only existing horn material touching the face',()=>{
 const material=new Uint8Array(15),face=new Uint8Array(15);material[1]=material[2]=material[4]=1;face[7]=1;
 const roots=beautyRootMask(material,face,5,3);
 assert.equal(roots[1],1);assert.equal(roots[2],1);assert.equal(roots[4],0);assert.equal(roots[7],0);
});
