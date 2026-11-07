import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DemonCursorBattle,demonCombatData,demonTrackingTiles,demonActiveTiles,demonPhaseAt,DEMON_TILES,DEMON_CENTER,DEMON_CROSS} from '../src/combat/demon-engine.js';
import {validate} from '../src/combat/engine.js';
const source=JSON.parse(fs.readFileSync(new URL('../data/project.json',import.meta.url))).combat;
function boss(){const b=new DemonCursorBattle(source,()=>.3);b.start();return b;}
function stage(b,hp){b.enemyHP=hp;b.state='recover';b.attackReturnUntil=0;b.tick(1200);}
test('runtime phase selection keeps source workbook and other guests unchanged',()=>{const before=JSON.stringify(source),d=demonCombatData(source);assert.equal(JSON.stringify(source),before);assert.deepEqual(validate(d,{monsterID:10007}).errors,[]);assert.deepEqual(d.sheets.find(s=>s.name==='몬스터 페이즈').rows.filter(r=>r.MonsterID!==10007),source.sheets.find(s=>s.name==='몬스터 페이즈').rows.filter(r=>r.MonsterID!==10007));});
test('exact HP boundaries and board contraction',()=>{assert.deepEqual([70.1,70,50,35,34.9].map(demonPhaseAt),[1,2,2,2,3]);assert.equal(demonActiveTiles(20.01).length,25);assert.deepEqual(demonActiveTiles(20),DEMON_CENTER);assert.deepEqual(demonActiveTiles(10),DEMON_CENTER);assert.deepEqual(demonActiveTiles(9.9),DEMON_CROSS);});
test('5 by 5 movement does not wrap and rejects destroyed tiles',()=>{const b=boss();b.pos=5;assert.equal(b.move(1,0),false);b.pos=1;assert.equal(b.move(0,-1),false);b.pos=13;assert.equal(b.move(1,0),true);assert.equal(b.pos,14);stage(b,199);b.pos=7;assert.equal(b.move(-1,0),false);assert.equal(b.move(1,0),true);});
test('phases preserve global HP; shadow ends on phase 3; shrinking rescues occupied tile',()=>{const b=boss();stage(b,700);assert.equal(b.phase,2);assert.equal(b.enemyHP,700);stage(b,500);assert.equal(b.shadowMode,true);stage(b,349);assert.equal(b.phase,3);assert.equal(b.shadowMode,false);b.pos=1;stage(b,200);assert(b.activeTiles.includes(b.pos));assert.equal(b.activeTiles.length,9);stage(b,99);assert.equal(b.activeTiles.length,5);assert(b.activeTiles.includes(b.pos));assert.equal(b.broken[1],Infinity);});
test('fissure second hit is the complement and has its own warning',()=>{const b=boss();b.beginDemonPattern('fissure');const [a,c]=b.queue;assert.equal(a.tiles.length,9);assert.equal(c.tiles.length,16);assert(!a.tiles.some(t=>c.tiles.includes(t)));assert(c.previewAt>a.due);assert(c.due-c.previewAt>=1000);});
test('tracking snapshots anew for each hit and never follows after warning',()=>{const b=boss();stage(b,349);b.pos=13;b.beginDemonPattern('double');assert.deepEqual(b.queue[0].tiles,[8,12,13,14,18]);b.move(1,0);assert.deepEqual(b.queue[0].tiles,[8,12,13,14,18]);b.tick(1000);b.pos=8;b.tick(350);assert.equal(b.queue[0].snapshot,8);assert.deepEqual(b.queue[0].tiles,demonTrackingTiles(8,2,34.9));});
test('phase 3 pattern loop is three doubles then iaido',()=>{const b=boss();stage(b,349);b.demonCycle=0;const kinds=[];for(let i=0;i<8;i++){b.state='recover';b.plan();kinds.push(b.planInfo.kind);}assert.deepEqual(kinds,['double','double','double','iaido','double','double','double','iaido']);});
test('iaido follows before eye flash and locks for 300 ms',()=>{const b=boss();stage(b,99);b.pos=8;b.beginDemonPattern('iaido');b.tick(500);b.pos=12;b.tick(100);assert.deepEqual(b.queue[0].tiles,[12,13,14]);b.tick(600);const q=b.queue[0];assert(q.locked);assert.equal(q.due-q.lockAt,300);b.pos=8;b.tick(50);assert.deepEqual(q.tiles,[12,13,14]);});
test('every tracking shape has an unbroken escape at all board sizes',()=>{for(const pct of [34.9,20,10,9.9])for(const pos of demonActiveTiles(pct))for(const hit of [1,2]){const tiles=demonTrackingTiles(pos,hit,pct);assert(tiles.includes(pos));assert(tiles.every(t=>demonActiveTiles(pct).includes(t)));assert(tiles.length<demonActiveTiles(pct).length);}});
test('mirror route is frozen, starts on right edge, only final mirror turns',()=>{const b=boss();stage(b,650);b.beginDemonPattern('reflect');assert([5,10,15,20,25].includes(b.rayPoints[0]));assert([3,4].includes(b.mirrors.length));const frozen=JSON.stringify(b.rayPoints);assert.equal(b.rotateMirror(b.mirrors[0].tile),false);assert.equal(b.rotateMirror(b.mirrors.at(-1).tile),true);assert.equal(b.rotateMirror(b.mirrors.at(-1).tile),false);b.pos=1;b.tick(b.rayStart-b.time+(b.mirrors.length-1)*b.tuning.mirrorStepMs+10);assert.equal(JSON.stringify(b.rayPoints),frozen);assert.equal(b.state,'staggerBreak');assert(b.cues.some(c=>c.kind==='mirrorReturn'));assert.equal(b.queue.length,0);});
test('unturned reflection completes original beam path without free groggy',()=>{const b=boss();stage(b,650);b.hp=999;b.beginDemonPattern('reflect');const end=b.planInfo.motionEnd;b.tick(end-b.time+10);assert.equal(b.state,'recover');assert.equal(b.stagger,0);assert(!b.cues.some(c=>c.kind==='mirrorReturn'));});
test('pause freezes pattern, mirror opportunity and transition',()=>{const b=boss();stage(b,500);b.beginDemonPattern('reflect');b.paused=true;const before=[b.time,b.visualTime,JSON.stringify(b.queue)];b.tick(5000);assert.deepEqual([b.time,b.visualTime,JSON.stringify(b.queue)],before);assert.equal(b.rotateMirror(b.mirrors.at(-1).tile),false);b.paused=false;b.state='recover';b.enemyHP=349;b.tick(10);b.paused=true;const v=b.visualTime;b.tick(5000);assert.equal(b.visualTime,v);});
test('recovery attack finishes hit and return before next pattern',()=>{const b=boss();stage(b,349);b.next=b.time+10;assert(b.basicAttack(true));const after=b.time;b.tick(420);assert.equal(b.state,'recover');b.tick(20);assert.equal(b.state,'attack');assert(b.time-after>=b.tuning.returnMs);assert.equal(b.stagger,1);});
test('phase damage gates wait until the complete groggy window ends',()=>{const b=boss();b.enemyHP=710;b.stagger=100;b.beginStagger();b.tick(b.settings.breakRevealMs);assert.equal(b.state,'opening');for(let i=0;i<100;i++)b.scratchAttack(true);assert.equal(b.enemyHP,700);assert.equal(b.phase,1);b.tick(b.settings.groggyMs+1200);assert.equal(b.phase,2);assert.equal(b.enemyHP,700);});
test('normal attacks finish phase 3; defeat also stops queued hits',()=>{const b=boss();stage(b,9);b.basicAttack(true);assert.equal(b.state,'victory');assert.equal(b.enemyHP,0);b.tick(9999);assert.equal(b.state,'victory');const d=boss();d.beginDemonPattern('slash');d.hp=1;d.pos=d.queue[0].tiles[0];d.tick(d.tuning.telegraphMs);assert.equal(d.state,'defeat');assert.equal(d.queue.length,0);});

test('complete deterministic clears use ordinary movement, punches and scratches without HP injection',()=>{
 for(const seed of [1,42,2468]){let state=seed;const rng=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296),b=new DemonCursorBattle(source,rng);b.start();const stages=new Set();let moveAt=0,scratchAt=0;
 function pathToSafe(unsafe){const seen=new Set([b.pos]),queue=[[b.pos,[]]];while(queue.length){const [at,path]=queue.shift();if(!unsafe.includes(at))return path;for(const [dx,dy]of [[0,-1],[0,1],[-1,0],[1,0]]){const x=(at-1)%5+dx,y=Math.floor((at-1)/5)+dy,t=y*5+x+1;if(x<0||x>4||y<0||y>4||!b.activeTiles.includes(t)||seen.has(t))continue;seen.add(t);queue.push([t,[...path,[dx,dy]]]);}}return [];}
 for(let ticks=0;ticks<60000&&!['victory','defeat'].includes(b.state);ticks++){
 stages.add(b.phase+':'+b.shadowMode+':'+b.activeTiles.length);
 if(b.canPunch())b.basicAttack(true);
 if(b.state==='opening'&&b.time>=scratchAt){b.scratchAttack(true);scratchAt=b.time+120;}
 if(b.state==='attack'){
  if(b.mirrors)b.rotateMirror(b.mirrors.at(-1).tile);
  const q=b.queue.find(q=>q.announced&&(!q.iaido||q.locked));
  if(q&&b.time>=moveAt){const step=pathToSafe(q.tiles)[0];if(step){b.move(...step);moveAt=b.time+80;}}
 }
 b.tick(10);
 }
 assert.equal(b.state,'victory','seed '+seed+' HP '+b.hp+' boss '+b.enemyHP);assert(b.hp>0);for(const mark of ['1:false:25','2:false:25','2:true:25','3:false:25','3:false:9','3:false:5'])assert(stages.has(mark),mark);assert.equal(b.enemyHP,0);
 }
});
