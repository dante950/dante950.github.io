import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {CursorBattle} from '../src/combat/cursor-engine.js';
import {rows,validate} from '../src/combat/engine.js';
import {createCoffeeCombatData,COFFEE_CURSOR_SETTINGS,COFFEE_MONSTER_ID,coffeeCombatAssets} from '../src/tutorial/combat-data.js';

const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
function start(){const b=new CursorBattle(createCoffeeCombatData(project.combat),()=>0,{...COFFEE_CURSOR_SETTINGS,motionRng:()=>0});b.start(COFFEE_MONSTER_ID,1);return b;}
function punchToOpening(b){
 b.next=Infinity;
 for(let i=0;i<6;i++){assert(b.basicAttack(true));if(i<5)b.tick(600);}
 assert.equal(b.state,'staggerBreak');b.tick(650);assert.equal(b.state,'opening');
}

test('tutorial survives lethal hits at 1 HP, including after a phase change; normal battles can lose',()=>{
 const b=start();b.damage(99);assert.equal(b.hp,1);
 b.damage(5);b.damage(1000);assert.equal(b.hp,1);assert.notEqual(b.state,'defeat');
 b.enter(2);b.dialogues.stop();b.damage(1000);assert.equal(b.hp,1);assert.notEqual(b.state,'defeat');
 const normal=new CursorBattle(createCoffeeCombatData(project.combat),()=>0);normal.start(COFFEE_MONSTER_ID,1);
 normal.damage(1000);assert.equal(normal.hp,0);assert.equal(normal.state,'defeat');
});

test('coffee rehearsal is isolated, has valid references and uses provided assets',async()=>{
 const before=JSON.stringify(project.combat),data=createCoffeeCombatData(project.combat);
 assert.equal(JSON.stringify(project.combat),before);assert.deepEqual(validate(data).errors,[]);
 assert.deepEqual(rows(data,'몬스터 페이즈').map(m=>[m.MonsterID,m.PhaseID,m.MaxHP,m.TransitionTrigger]),[[10005,1,60,'HP 0'],[10005,2,60,'HP 0']]);
 for(const asset of Object.values(coffeeCombatAssets().images))await fs.access(new URL('../public/'+asset.src.replace(/^\.\//,''),import.meta.url));
});
test('actual telegraph can be evaded; avoidance does not grant stagger',()=>{
 const b=start();b.tick(500);assert.equal(b.state,'attack');assert.deepEqual(b.queue[0].tiles,[4,5,6]);
 assert(b.move(0,-1));b.tick(1800);assert.equal(b.stats.dodge,1);assert.equal(b.dodgedPatterns,1);assert.equal(b.stagger,0);assert.equal(b.hp,100);
});
test('empty openings never auto-clear the tutorial phase and punches cannot finish it',()=>{
 const b=start();
 for(let cycle=0;cycle<4;cycle++){punchToOpening(b);b.tick(3330);assert.equal(b.monster.PhaseID,1);assert.notEqual(b.state,'victory');}
 assert.equal(b.enemyHP,1);assert.equal(b.stats.miss,0);
});
test('two real attack and scratch cycles are needed; transitions wait for the complete window',()=>{
 const b=start();
 for(let phase=1;phase<=2;phase++){
  b.dialogues.stop();punchToOpening(b);assert.equal(b.enemyHP,30);
  assert(b.scratchAttack(true));assert.equal(b.enemyHP,20);
  b.tick(100);assert.equal(b.monster.PhaseID,phase);assert.equal(b.state,'opening');
  assert(b.scratchAttack(true));assert(b.scratchAttack(true));assert.equal(b.enemyHP,0);
  b.tick(3220);assert.equal(b.monster.PhaseID,phase);assert.equal(b.state,'opening');
  b.tick(10);assert.equal(b.monster.PhaseID,phase===1?2:2);
 }
 assert.equal(b.state,'victory');assert.equal(b.basicHits,12);assert.equal(b.stats.damage,120);
});
