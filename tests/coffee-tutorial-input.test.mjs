import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {ScratchTracker,insideBox} from '../src/combat/cursor-engine.js';
const lesson=readFileSync(new URL('../src/combat/tutorial.js',import.meta.url),'utf8');
const inputSource=readFileSync(new URL('../src/combat/cursor-ui.js',import.meta.url),'utf8');
const input=inputSource.slice(inputSource.indexOf('const cursorScratch='),inputSource.indexOf('function drawHeartBoards'));
function harness(){
 const keyHandlers=[],events={},captured=new Set(),nodes={};
 const element=()=>({hidden:false,disabled:false,innerHTML:'',dataset:{},style:{},classList:{add(){}},setAttribute(){},append(){},focus(){},addEventListener(type,fn){events[type]=fn;},getBoundingClientRect(){return {left:0,top:0,width:1280,height:650};},setPointerCapture(id){captured.add(id);},hasPointerCapture(id){return captured.has(id);},releasePointerCapture(id){captured.delete(id);}});
 const battle={paused:false,pos:5,state:'idle',time:100,dialogueBlocking:false,cue(){},hits:0,scratches:0,basicAttack(inside){if(inside&&!this.paused)this.hits++;},scratchAttack(){if(!this.paused)this.scratches++;}};
 const box={x:800,y:250,w:240,h:300};
 const scene={box,scratchBox:box,pointer:null,unlock(){},stroke(){}};
 const ctx=vm.createContext({document:{hidden:false,createElement:element},window:{addEventListener(t,f){keyHandlers.push(f);}},$:id=>nodes[id]??=element(),HOST:{coffeeTutorial:true},battle,scene,hostSuspended:false,notifyHost(){},esc:s=>s,setTimeout:()=>1,clearTimeout(){},ScratchTracker,insideBox});
 vm.runInContext(lesson+'\n'+input+'\nfunction pauseBattle(){battle.paused=true;clearCursorInput();} installCursorInput();',ctx);
 return {ctx,battle,scene,nodes,run:s=>vm.runInContext(s,ctx),key:k=>keyHandlers[0]({key:k,target:{},preventDefault(){},stopImmediatePropagation(){}}),pointer:(type,x,y)=>events[type]({button:0,pointerId:7,clientX:x,clientY:y,preventDefault(){}}),captured};
}
test('coffee movement needs all four successful directions and resumes without buttons',()=>{const h=harness();h.run("showCombatLesson('move')");h.key('w');assert.equal(h.battle.paused,true);assert.equal(h.run('combatLesson.keys.size'),1);h.key('w');assert.equal(h.run('combatLesson.keys.size'),1);h.key('a');h.key('s');assert.equal(h.battle.paused,true);assert.equal(h.run('battleLessonPanel.innerHTML.includes("<button")'),false);h.key('d');assert.equal(h.battle.paused,false);assert.equal(h.run('combatLesson'),null);});
test('coffee paused punch waits for the ghost then uses the same click as an attack',()=>{const h=harness();h.run("showCombatLesson('punch')");h.pointer('pointerdown',200,300);assert.equal(h.battle.paused,true);assert.equal(h.battle.hits,0);h.pointer('pointerdown',900,400);assert.equal(h.battle.paused,false);assert.equal(h.battle.hits,1);});
test('coffee opening holds its timer until drag and preserves the held stroke across resume',()=>{const h=harness();h.battle.state='opening';h.run("showCombatLesson('opening');updateCursorInput()");h.pointer('pointerdown',850,400);h.run('updateCursorInput()');assert.equal(h.battle.paused,true);assert.equal(h.run('cursorPointerID'),7);h.pointer('pointermove',853,400);assert.equal(h.battle.paused,true);h.pointer('pointermove',860,400);assert.equal(h.battle.paused,false);assert.equal(h.run('cursorPointerID'),7);assert.equal(h.captured.has(7),true);h.pointer('pointermove',930,400);assert.equal(h.battle.scratches,1);h.battle.time+=100;h.pointer('pointermove',850,400);assert.equal(h.battle.scratches,2);h.pointer('pointerup',850,400);assert.equal(h.run('cursorPointerID'),null);assert.equal(h.captured.size,0);});
