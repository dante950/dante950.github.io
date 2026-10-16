import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {CursorBattle,ScratchTracker,raidHealth} from '../src/combat/cursor-engine.js';
import {rows} from '../src/combat/engine.js';
const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
function start(id=10001,options={}){
 const data=structuredClone(project.combat);
 for(const s of data.sheets)if(['전투 대사 연결','대화 그룹','대사'].includes(s.name))s.rows=[];
 for(const m of rows(data,'몬스터 페이즈'))m.EntryDialogueGroupID=null;
 const b=new CursorBattle(data,()=>0,{motionRng:()=>0});b.start(id,1,{gimmicks:false,...options});b.next=Infinity;return b;
}
function open(b){b.stagger=b.settings.staggerMax;assert(b.beginStagger());b.tick(650);assert.equal(b.state,'opening');}
test('pausing at opening entry preserves the full window even inside a large tick',()=>{
 const b=start(),open=b.open.bind(b);
 b.open=()=>{const ok=open();if(ok)b.paused=true;return ok;};
 b.stagger=b.settings.staggerMax;b.beginStagger();b.tick(1000);
 assert.equal(b.state,'opening');assert.equal(b.groggyEnd-b.time,3330);
 const time=b.time,visual=b.visualTime,hp=b.hp;b.tick(5000);
 assert.equal(b.time,time);assert.equal(b.visualTime,visual);assert.equal(b.hp,hp);
 assert.equal(b.scratchAttack(true),false);assert.equal(b.openingResult.attempts,0);
 b.paused=false;b.tick(100);assert.equal(b.groggyEnd-b.time,3230);
});
test('click damage and stagger are separate; outside, cooldown, guard and SPACE give no extra attacks',()=>{
 const b=start();assert.equal(b.enemyHP,1000);assert.equal(b.staggerRemaining,100);
 assert.equal(b.basicAttack(false),false);assert.equal(b.attackCooldownLeft,0);
 assert(b.basicAttack(true));assert.equal(b.enemyHP,995);assert.equal(b.staggerRemaining,95);
 b.tick(200);assert.equal(b.basicAttack(true),false);assert.equal(b.attackCooldownLeft,400);
 b.tick(400);assert(b.basicAttack(true));assert.equal(b.enemyHP,990);
 b.setGuard(true);assert.equal(b.guardHeld,false);assert.equal(b.attack(),false);
 b.addGauge(100);assert.equal(b.staggerRemaining,90);assert.equal(b.state,'recover');
 b.paused=true;const t=b.time;b.tick(1000);assert.equal(b.time,t);assert.equal(b.attackCooldownLeft,600);
 assert.equal(project.combat.sheets.find(s=>s.name==='몬스터 페이즈').rows.find(m=>m.MonsterID===10001).MaxHP,1000);
});
test('twenty clicks cancel the queued pattern, reveal for 650ms then provide a full 3330ms window',()=>{
 const b=start();for(let i=0;i<20;i++){if(i)b.tick(600);assert(b.basicAttack(true));}
 assert.equal(b.state,'staggerBreak');assert.equal(b.enemyHP,900);assert.equal(b.queue.length,0);
 const time=b.time;b.tick(649);assert.equal(b.state,'staggerBreak');assert.equal(b.time,time);
 b.tick(1);assert.equal(b.state,'opening');assert.equal(b.groggyEnd-b.time,3330);
 assert(b.scratchAttack(true));assert.equal(b.enemyHP,890);assert.equal(b.attack(),false);
 b.tick(3329);assert.equal(b.state,'opening');b.tick(1);assert.equal(b.state,'recover');assert.equal(b.staggerRemaining,100);
});
test('Sans loses exactly one heart per successful opening, never to punches or extra strokes',()=>{
 const b=start(10003);b.basicAttack(true);assert.equal(b.enemyHP,100);assert.equal(b.staggerRemaining,95);assert(b.cues.find(c=>c.kind==='basicHit').immune);
 assert.equal(b.heartsRemaining,3);
 for(let phase=1;phase<=3;phase++){
  b.next=Infinity;open(b);assert.equal(b.scratchAttack(false),false);assert.equal(b.heartsRemaining,4-phase);
  b.scratchAttack(true);assert.equal(b.enemyHP,0);assert.equal(b.openingResult.misses,0);
  for(let i=0;i<9;i++)assert.equal(b.scratchAttack(true),false);
  assert.equal(b.heartsRemaining,4-phase);assert.equal(b.openingResult.hits,1);
  assert.equal(b.cues.filter(c=>c.kind==='heartDrop').length,phase-1);
  assert.equal(b.enemyHP,0);assert.equal(b.state,'opening');assert.equal(b.cues.filter(c=>c.kind==='openingHit').at(-1).value,'♥');
  b.tick(3329);assert.equal(b.monster.PhaseID,phase);assert.equal(b.heartsRemaining,4-phase);
  b.paused=true;b.tick(1000);assert.equal(b.heartsRemaining,4-phase);b.paused=false;
  b.tick(1);assert.equal(b.heartsRemaining,3-phase);
  assert.deepEqual(b.cues.filter(c=>c.kind==='heartDrop').map(c=>c.index),[2,0,1].slice(0,phase));
  assert.equal(b.state,phase===3?'victory':'recover');assert.equal(b.monster.PhaseID,Math.min(3,phase+1));
 }
});

test('empty Sans openings keep every board and phase; removed return narration stays absent',()=>{
 const b=start(10003);
 for(let phase=1;phase<=3;phase++){
  b.enter(phase);b.next=Infinity;open(b);b.scratchAttack(false);b.tick(3330);
  assert.equal(b.monster.PhaseID,phase);assert.equal(b.heartsRemaining,4-phase);
  assert.equal(b.enemyHP,100);assert.equal(b.state,'recover');
 }
 assert(!b.cues.some(c=>['heartHit','heartDrop'].includes(c.kind)));
 const afterWin=project.guests.find(g=>g.id===10003).bindings.afterWin;
 const returnLines=rows(project.combat,'대사').filter(r=>r.GroupID===afterWin);
 assert(returnLines.length>0);assert(returnLines.every(r=>r.Speaker==='몬스터'));
 assert(!rows(project.combat,'대사').some(r=>r.GroupID===80067));
});

test('Sans final warning begins on opening and death waits for HP0, dialogue and disappearance',()=>{
 const b=new CursorBattle(project.combat,()=>0);b.start(10003,1,{gimmicks:false});
 const drain=()=>{for(let i=0;i<50&&b.dialogues.active;i++)b.dialogues.advance();};drain();
 for(let phase=1;phase<=3;phase++){
  b.next=Infinity;open(b);
  if(phase===3){assert.equal(b.dialogues.active.group.GroupID,80047);assert.equal(b.dialogueBlocking,false);}
  for(let i=0;i<10;i++)b.scratchAttack(true);
  b.tick(3330);
  // Revised warning text can outlast the opening; success must wait its turn.
  if(phase===3)for(let i=0;i<300&&b.dialogues.active?.group.GroupID===80047;i++){assert.equal(b.state,'openingResult');b.tick(100);}
  assert.equal(b.dialogues.active.group.GroupID,[80044,80046,80048][phase-1]);
  assert.equal(b.state,'openingResult');drain();
  if(phase<3)b.tick(1);
  else {assert.equal(b.finale.type,'소멸');b.tick(1199);assert.equal(b.state,'openingResult');b.tick(1);assert.equal(b.state,'victory');assert(b.actorDead);}
 }
 assert(!b.dialogues.history.some(id=>[900076,900078].includes(id)));
 const untouched=start(10003);untouched.enter(3);untouched.next=Infinity;open(untouched);untouched.tick(3330);assert.equal(untouched.state,'recover');assert.equal(untouched.enemyHP,100);assert.equal(untouched.heartsRemaining,1);
});
test('horizontal drag requires distance, a new direction and 85ms; clicks and jitter cannot farm hits',()=>{
 const s=new ScratchTracker(),box={x:0,y:0,w:200,h:200};s.begin({x:30,y:80});
 assert.equal(s.move({x:31,y:80},box,100,200),false);
 assert(s.move({x:90,y:80},box,110,200));assert.equal(s.move({x:160,y:80},box,210,200),false);
 assert(s.move({x:90,y:80},box,220,200));assert.equal(s.move({x:160,y:80},box,230,200),false);
 assert.equal(s.move({x:300,y:80},box,400,200),false);assert.equal(s.move({x:90,y:80},box,500,200),false);
 s.reset();s.begin({x:80,y:30});assert.equal(s.move({x:82,y:160},box,600,200),false);
});
test('gravestone induction restores existing stagger progress, including a resurrection phase',()=>{
 for(const transition of [false,true]){
  const b=start(10001,{gimmicks:true,gimmickOnly:true});b.stagger=25;b.pos=3;assert(b.beginRush());assert.equal(b.rush.stone,5);
  b.move(-1,0);assert.equal(b.move(0,1),false,'stone blocks movement');b.move(-1,0);b.move(0,1);
  b.tick(1800);assert(b.rush.blocked);b.move(0,-1);b.tick(990);assert.equal(b.state,'staggerBreak');
  b.tick(650);if(transition){b.enemyHP=1;b.scratchAttack(true);}b.tick(3330);assert.equal(b.staggerRemaining,75);
  assert.equal(b.monster.PhaseID,transition?2:1);if(transition)assert.equal(b.monster.MaxHP,300);
 }
});
test('normal lethal click resolves after the current pattern, and during recovery resolves immediately',()=>{
 const b=start();b.plan();b.enemyHP=1;b.basicAttack(true);assert.equal(b.state,'attack');assert.equal(b.enemyHP,0);
 while(b.state==='attack')b.tick(10);assert.equal(b.monster.PhaseID,2);
 b.enemyHP=1;b.attackCooldownLeft=0;b.basicAttack(true);assert.equal(b.state,'victory');
});
test('raid display is a ratio, not a multiplier of real HP',()=>{
 assert.equal(raidHealth(1,1).lines,200);assert.equal(raidHealth(998,1000).lines,200);assert.equal(raidHealth(0,1000).lines,0);
});
