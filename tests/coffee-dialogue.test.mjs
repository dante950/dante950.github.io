import {parseDialogueText} from '../src/text-effects.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ensureCoffeeDialogues,coffeeDialogueLines,coffeeRequestText,applyCoffeeBattleDialogues,COFFEE_DIALOGUE_EVENTS} from '../src/tutorial/dialogues.js';
import {COFFEE_REQUESTS} from '../src/tutorial/narrative.js';
import {createCoffeeCombatData} from '../src/tutorial/combat-data.js';
import {projectProblems,addWorkshopGuests} from '../src/model.js';
import {validate} from '../src/combat/engine.js';
import {combatForWorkbook,mergeWorkshopDialogues} from '../src/workshop-dialogue.js';
const base=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
const make=()=>ensureCoffeeDialogues(structuredClone(base));
const rows=(p,n)=>p.combat.sheets.find(s=>s.name===n).rows;

test('coffee appears only in dialogue workshop; schedule and existing authored rows stay intact',()=>{
 const p=make(),g=p.guests.find(g=>g.id===10005);
 assert(g.dialogueOnly&&g.workbookExcluded);assert.equal(g.battle,'none');
 assert.deepEqual(p.schedule,base.schedule);assert.deepEqual(projectProblems(p),[]);
 for(const s of base.combat.sheets)assert.deepEqual(rows(p,s.name).slice(0,s.rows.length),s.rows);
 for(const guest of base.guests.filter(g=>g.battle!=='none'))assert.deepEqual(validate(p.combat,{monsterID:guest.id}).errors,[]);
 assert.equal(Object.keys(g.bindings).length,COFFEE_DIALOGUE_EVENTS.length);
 p.schedule[0].push(10005);assert(projectProblems(p).some(x=>x.includes('본편 일정')));
});
test('three request levels retain the exact tutorial wording; edits and intentionally empty groups survive reseeding',()=>{
 const p=make();for(const [stage,lines] of Object.entries(COFFEE_REQUESTS))lines.forEach((text,i)=>assert.equal(parseDialogueText(coffeeRequestText(p,stage,i)).plain,text));
 const id=p.guests.find(g=>g.id===10005).bindings.arrival;
 rows(p,'대사').find(l=>l.GroupID===id).Text='수정한 등장 대사';ensureCoffeeDialogues(p);
 assert.equal(coffeeDialogueLines(p,'arrival')[0][1],'수정한 등장 대사');
 p.combat.sheets.find(s=>s.name==='대사').rows=rows(p,'대사').filter(l=>l.GroupID!==id);
 ensureCoffeeDialogues(p);assert.deepEqual(coffeeDialogueLines(p,'arrival'),[]);
});
test('old saved projects receive coffee without losing existing edits; workbook roundtrip retains coffee event-only groups',()=>{
 const defaults=make(),old=structuredClone(base);rows(old,'대사')[0].Text='기존 손님 수정';
 addWorkshopGuests(old,defaults);assert.equal(rows(old,'대사')[0].Text,'기존 손님 수정');assert.equal(parseDialogueText(coffeeDialogueLines(old,'arrival')[0][1]).plain,'저도 부하님처럼 되고 싶어요!');
 const before=structuredClone(old),workbook=combatForWorkbook(old);
 const ids=new Set(Object.values(old.guests.find(g=>g.id===10005).bindings));
 for(const id of ids)assert(workbook.sheets.find(s=>s.name==='대사').rows.some(l=>l.GroupID===id));
 const restored={...old,combat:mergeWorkshopDialogues(old,workbook)};
 for(const [event] of COFFEE_DIALOGUE_EVENTS)assert.deepEqual(coffeeDialogueLines(restored,event),coffeeDialogueLines(before,event));
 assert.deepEqual(old,before);
});
test('edited battle dialogue reaches tutorial while death effect and combat rules stay unchanged',()=>{
 const p=make(),g=p.guests.find(g=>g.id===10005),id=g.bindings.battleVictory;
 rows(p,'대사').find(l=>l.GroupID===id).Text='바뀐 대련 마무리';
 const original=createCoffeeCombatData(p.combat),data=applyCoffeeBattleDialogues(structuredClone(original),p);
 assert.equal(data.sheets.find(s=>s.name==='대사').rows.find(l=>l.GroupID===89092).Text,'바뀐 대련 마무리');
 assert.equal(data.sheets.find(s=>s.name==='대화 그룹').rows.find(g=>g.GroupID===89092).FinishEffect,'소멸');
 for(const s of original.sheets.filter(s=>!['대사','대화 그룹'].includes(s.name)))assert.deepEqual(data.sheets.find(t=>t.name===s.name),s);
 assert.deepEqual(validate(data,{monsterID:10005}).errors,[]);
});

test('both released guests export all dialogue and accept Excel edits; old omitted groups restore safely',()=>{
 const p=make(),data=combatForWorkbook(p),ids=new Set();
 for(const guest of p.guests.filter(g=>[10005,10006].includes(g.id)))for(const id of Object.values(guest.bindings)){ids.add(id);assert(data.sheets.find(s=>s.name==='대화 그룹').rows.some(g=>g.GroupID===id));assert(data.sheets.find(s=>s.name==='대사').rows.some(l=>l.GroupID===id));}
 const lines=data.sheets.find(s=>s.name==='대사').rows;for(const l of lines.filter(l=>ids.has(l.GroupID)))l.Text='<wave=2>엑셀 수정 '+l.DialogueID+'</wave>';
 const merged=mergeWorkshopDialogues(p,data);assert.deepEqual(merged,data);assert.deepEqual(combatForWorkbook({...p,combat:merged}),data);
 const old=combatForWorkbook(p);for(const s of old.sheets)if(['대사','대화 그룹'].includes(s.name))s.rows=s.rows.filter(r=>!ids.has(r.GroupID));else if(s.name==='미용 대사 연결')s.rows=s.rows.filter(r=>r.MonsterID!==10006);
 const restored=mergeWorkshopDialogues(p,old);for(const name of ['대사','대화 그룹','미용 대사 연결'])assert.deepEqual(restored.sheets.find(s=>s.name===name).rows.map(JSON.stringify).sort(),rows(p,name).map(JSON.stringify).sort());
 const partial=structuredClone(data);partial.sheets.find(s=>s.name==='대화 그룹').rows=partial.sheets.find(s=>s.name==='대화 그룹').rows.filter(r=>r.GroupID!==p.guests.find(g=>g.id===10005).bindings.arrival);assert.throws(()=>mergeWorkshopDialogues(p,partial),/누락/);
});
