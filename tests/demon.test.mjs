import test from 'node:test';
import assert from 'node:assert/strict';
import {demonGate,demonJudge,demonProtest,DemonPixels} from '../src/demon/model.js';
test('only three earned stars admit the king; each failed level has its own line',()=>{
 for(const stars of [0,1,2])assert.equal(demonGate(stars).admitted,false);
 assert.equal(demonGate(3).admitted,true);assert.equal(demonGate(8).stars,3);
 assert.equal(new Set([0,1,2].map(n=>demonGate(n).line)).size,3);
});
test('helmet face damage needs fifteen percent for sudden battle',()=>{
 const metrics={horn:1,excess:0,scratches:1,bodyLoss:0,exposure:0,stickers:0};
 assert.equal(demonJudge(1,metrics).success,true);
 assert.equal(demonJudge(1,{...metrics,exposure:.149}).sudden,false);
 assert.equal(demonJudge(1,{...metrics,exposure:.15}).sudden,true);
 assert.equal(demonJudge(1,{...metrics,horn:.7}).success,false);
});
test('phase two rejects even one face pixel and recovers when erased',()=>{
 const clean={trim:1,keep:.8,black:1,facePaint:0,stickers:0};
 assert.equal(demonJudge(2,clean).success,true);
 assert.equal(demonJudge(2,{...clean,facePaint:1}).success,false);
 assert.equal(demonJudge(2,{...clean,stickers:1}).success,false);
 assert.equal(demonJudge(2,{...clean,trim:.4}).success,false);
 assert.equal(demonProtest(2,'trim'),'');assert.equal(demonProtest(2,'ears'),'');
 assert.match(demonProtest(2,'face'),/닦아주게/);
});
test('free phase has no complaint or failure, regardless of material edits',()=>{
 assert.deepEqual(demonJudge(3,{facePaint:999,trim:0,stickers:42}),{success:true,locked:true,checks:[true]});
 for(const kind of ['face','color','sticker','trim'])assert.equal(demonProtest(3,kind),'');
});
test('scissors and hammer affect separate phase-three layers; undo restores both',()=>{
 const base=new Uint8ClampedArray(16*4),hair=base.slice(),stones=base.slice();
 hair.set([240,240,250,255],20);stones.set([130,130,150,255],20);
 const m=new DemonPixels(3,{base,material:hair,stones},4,4);m.save();
 m.stroke(1,1,.1,'scissors');assert.equal(m.material[23],0);assert.equal(m.stones[23],255);
 m.stroke(1,1,.1,'hammer');assert.equal(m.stones[23],0);m.undo();assert.equal(m.material[23],255);assert.equal(m.stones[23],255);
 m.stroke(1,1,.1,'paint',[18,18,18]);assert.equal(m.paint[23],255);
 m.stroke(1,1,.1,'erase');assert.equal(m.paint[23],0);
});
