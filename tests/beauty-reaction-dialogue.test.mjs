import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {BEAUTY_REACTIONS,migrateBeautyReactions,beautyWithDialogue,beautyReactionLines} from '../src/beauty-reaction-dialogue.js';
const base=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
test('table edits are used in the salon payload without a stale beauty-text shadow',()=>{
 const p=structuredClone(base),g=p.guests.find(g=>g.id===10004);
 for(const [key]of BEAUTY_REACTIONS){
  const line=beautyReactionLines(p,g,key)[0];assert(line);assert.equal(g.beauty[key],undefined);
  line.Text='엑셀에서 바꾼 '+key;assert.equal(beautyWithDialogue(p,g)[key],line.Text);
 }
});
test('legacy reaction text migrates once, preserving authored table edits and avoiding ID collisions',()=>{
 const p=structuredClone(base),g=p.guests.find(g=>g.id===10004),key='eyeContactLine';
 delete g.bindings[key];g.beauty[key]='사용자가 저장한 항의';g.workbookExcluded=true;
 migrateBeautyReactions(p);assert.equal(g.workbookExcluded,false);
 const line=beautyReactionLines(p,g,key)[0];assert.equal(line.Text,'사용자가 저장한 항의');
 line.Text='테이블 최신 수정';g.beauty[key]='오래된 본문';
 migrateBeautyReactions(p);assert.equal(beautyWithDialogue(p,g)[key],'테이블 최신 수정');
 const before=structuredClone(p);migrateBeautyReactions(p);assert.deepEqual(p,before);
 const ls=p.combat.sheets.find(s=>s.name==='대사').rows;assert.equal(new Set(ls.map(l=>l.DialogueID)).size,ls.length);
});
