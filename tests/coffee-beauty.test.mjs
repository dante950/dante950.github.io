import test from 'node:test';
import assert from 'node:assert/strict';
import {coffeeEyeMasks,coffeeMaterialBoundary,coffeeHairPixelColor} from '../src/coffee-beauty.js';
import {createCoffeeGuest} from '../src/tutorial/guest.js';
import {beautyAttachScore,beautyInside} from '../src/beauty-rules.js';
import {scoreShape,beautyRequirementChecks,inBeautyRegion,beautyGrowthValue} from '../src/beauty-shape.js';
const b=createCoffeeGuest({}).beauty;
test('coffee requires the supplied left and right big horns on their matching face sides',()=>{
 const guest=createCoffeeGuest({}),left=guest.stickers.find(s=>s.resourceFile==='T_hornBig_L.png'),right=guest.stickers.find(s=>s.resourceFile==='T_hornBig_R.png');
 assert.ok(left&&right);assert.ok(!guest.stickers.some(s=>s.id==='TUTORIAL-COFFEE-HORNS-PAIR'));
 const at=(sticker,x,y)=>({sticker,region:b.attachRegions.find(r=>beautyInside(x,y,r))?.key||'Other'});
 const l=at(left,125,154),r=at(right,195,154);
 assert.equal(beautyAttachScore([l,r],b),30);assert.equal(beautyAttachScore([r,l],b),30);
 assert.equal(beautyAttachScore([l],b),15);assert.equal(beautyAttachScore([r],b),15);
 assert.deepEqual(beautyRequirementChecks(b,'attach',null,{attach:30},2),[true]);
 assert.deepEqual(beautyRequirementChecks(b,'attach',null,{attach:15},1),[false]);
 assert.deepEqual(beautyRequirementChecks(b,'attach',null,{attach:30},3),[false]);
 assert.deepEqual(beautyRequirementChecks({...b,attachCount:undefined},'attach',null,{attach:30},1),[true]);
 for(const bad of [[at(right,125,154),at(left,195,154)],[l,at(left,195,154)],[l,at(right,160,154)],[l,r,l],[l,r,at(guest.stickers.find(s=>s.id!==left.id&&s.id!==right.id),125,154)]])assert.ok(beautyAttachScore(bad,b)<30);
});
const W=160,H=175;
function sample(){
 const original=new Uint8Array(W*H).fill(1),current=original.slice();
 const coffeeTrim=new Uint8Array(W*H),coffeeRestore=new Uint8Array(W*H);
 coffeeTrim[50*W+45]=1;current[50*W+45]=0;
 coffeeRestore[60*W+105]=1;original[60*W+105]=0;
 const pixels=new Uint8Array(W*H*4);pixels[(88*W+70)*4+3]=255;pixels[(88*W+90)*4+3]=255;return {original,current,masks:{coffeeTrim,coffeeRestore,...coffeeEyeMasks(pixels,W,H)}};
}
function clearEyes(current){current[88*W+70]=current[88*W+90]=0;}
test('coffee must reveal both eyes, and covering them again revokes completion',()=>{
 const s=sample();let shape=scoreShape(s.current,s.original,b,W,H,s.masks);
 assert.equal(shape.details.find(r=>r.rule==='clear').fulfilled,0);
 assert.deepEqual(beautyRequirementChecks(b,'cut',shape,{cut:shape.score},0),[true,true,false]);
 clearEyes(s.current);shape=scoreShape(s.current,s.original,b,W,H,s.masks);assert.equal(shape.score,40);
 assert.ok(beautyRequirementChecks(b,'cut',shape,{cut:shape.score},0).every(Boolean));
 s.current[88*W+70]=2;shape=scoreShape(s.current,s.original,b,W,H,s.masks);
 assert.equal(beautyRequirementChecks(b,'cut',shape,{cut:shape.score},0).at(-1),false);
});
test('coffee free hair has no preservation request or score penalty',()=>{
 const s=sample();clearEyes(s.current);const initial=scoreShape(s.current,s.original,b,W,H,s.masks).score;
 for(let y=110;y<160;y++)for(let x=25;x<135;x++)s.current[y*W+x]=0;
 assert.equal(scoreShape(s.current,s.original,b,W,H,s.masks).score,initial);
 for(let y=150;y<165;y++)for(let x=30;x<130;x++)s.current[y*W+x]=beautyGrowthValue(0,0,0,b.growth);
 assert.equal(scoreShape(s.current,s.original,b,W,H,s.masks).score,initial);
 assert.equal(b.cutRegions.some(r=>r.rule==='preserve'),false);
 assert.equal(b.requestNotes.cut.includes('남기기'),false);
});

test('visible eyes pass with hair between them and above them',()=>{const s=sample();s.current[88*W+70]=s.current[88*W+90]=0;assert.equal(scoreShape(s.current,s.original,b,W,H,s.masks).score,40);s.current[88*W+90]=1;assert.equal(scoreShape(s.current,s.original,b,W,H,s.masks).score,35);});
test('growth replaces buried outline and a new cut receives an outline',()=>{const w=9,h=7,old=new Uint8Array(w*h),now=new Uint8Array(w*h),fill=[28,201,136],line=[10,123,135];for(let y=1;y<6;y++)for(let x=1;x<5;x++)old[y*w+x]=1;now.set(old);for(let y=1;y<6;y++)for(let x=5;x<8;x++)now[y*w+x]=2;const was=coffeeMaterialBoundary(old,w,h,1),edge=coffeeMaterialBoundary(now,w,h,1),n=3*w+4;assert.equal(was[n],1);assert.equal(edge[n],0);assert.equal(coffeeHairPixelColor(1,edge[n],was[n],false,fill,line),fill);now[3*w+3]=0;assert.equal(coffeeMaterialBoundary(now,w,h,1)[n],1);assert.equal(coffeeHairPixelColor(1,1,0,false,fill,line),line);});
