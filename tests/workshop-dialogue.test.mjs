import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {combatForWorkbook,mergeWorkshopDialogues} from '../src/workshop-dialogue.js';
import {salonDialogueGroup,salonDialogueProblems} from '../src/salon-dialogue.js';
const base=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
const rows=(data,name)=>data.sheets.find(s=>s.name===name).rows;

test('workbook roundtrip excludes only workshop dialogue and restores its edited content',()=>{
 const p=structuredClone(base);salonDialogueGroup(p,10004,'cut').lines[0].Text='사용자가 수정한 마왕 부하 부탁';
 const before=structuredClone(p),workbook=combatForWorkbook(p);
 assert(!rows(workbook,'미용 대사 연결').some(r=>r.MonsterID===10004));
 const workbookGuestIDs=[...new Set(rows(workbook,'몬스터 페이즈').map(r=>r.MonsterID))];
 assert.deepEqual(salonDialogueProblems({combat:workbook,guests:workbookGuestIDs.map(id=>({id}))}),[]);
 const merged=mergeWorkshopDialogues(p,workbook);
 assert.deepEqual(merged,p.combat);assert.deepEqual(p,before);
 const restored={...p,combat:merged};assert.equal(salonDialogueGroup(restored,10004,'cut').lines[0].Text,'사용자가 수정한 마왕 부하 부탁');
 assert.deepEqual(mergeWorkshopDialogues(restored,combatForWorkbook(restored)),merged);
 assert.deepEqual(mergeWorkshopDialogues(restored,merged),merged);
});

test('incoming story edits and occupied IDs survive while workshop IDs remap safely',()=>{
 const p=structuredClone(base),old=salonDialogueGroup(p,10004,'cut');old.lines[0].Text='보존할 작업실 문장';
 const incoming=combatForWorkbook(p),story=salonDialogueGroup({...p,combat:incoming},10001,'cut');story.lines[0].Text='엑셀에서 고친 본편 문장';
 const collidingGroup={...structuredClone(old.group),Name:'새 본편 그룹'};
 const collidingLine={...structuredClone(old.lines[0]),Text:'새 본편 그룹 문장'};
 rows(incoming,'대화 그룹').push(collidingGroup);rows(incoming,'대사').push(collidingLine);
 const savedIncoming=structuredClone(incoming),merged=mergeWorkshopDialogues(p,incoming),restored={...p,combat:merged};
 assert.deepEqual(incoming,savedIncoming);
 for(const sheet of incoming.sheets)assert.deepEqual(rows(merged,sheet.name).slice(0,sheet.rows.length),sheet.rows);
 assert.equal(salonDialogueGroup(restored,10001,'cut').lines[0].Text,'엑셀에서 고친 본편 문장');
 const workshop=salonDialogueGroup(restored,10004,'cut');assert.notEqual(workshop.group.GroupID,old.group.GroupID);assert.notEqual(workshop.lines[0].DialogueID,old.lines[0].DialogueID);assert.equal(workshop.lines[0].Text,'보존할 작업실 문장');
 assert.equal(new Set(rows(merged,'대화 그룹').map(r=>r.GroupID)).size,rows(merged,'대화 그룹').length);
 assert.equal(new Set(rows(merged,'대사').map(r=>r.DialogueID)).size,rows(merged,'대사').length);
 assert.deepEqual(mergeWorkshopDialogues(restored,combatForWorkbook(restored)),merged);
});

test('shared groups remain in workbooks and an Excel edit cannot overwrite the workshop draft',()=>{
 const p=structuredClone(base),workshop=salonDialogueGroup(p,10004,'cut');
 p.guests[0].bindings.arrival=workshop.group.GroupID;
 const exported=combatForWorkbook(p);assert(rows(exported,'대화 그룹').some(r=>r.GroupID===workshop.group.GroupID));
 assert(rows(exported,'대사').some(r=>r.GroupID===workshop.group.GroupID));
 rows(exported,'대사').find(r=>r.DialogueID===workshop.lines[0].DialogueID).Text='공유 그룹의 엑셀 변경';
 const merged=mergeWorkshopDialogues(p,exported),restored={...p,combat:merged};
 assert.equal(rows(merged,'대사').find(r=>r.DialogueID===workshop.lines[0].DialogueID).Text,'공유 그룹의 엑셀 변경');
 assert.equal(salonDialogueGroup(restored,10004,'cut').lines[0].Text,workshop.lines[0].Text);
 assert.notEqual(salonDialogueGroup(restored,10004,'cut').group.GroupID,workshop.group.GroupID);
 const p2=structuredClone(base),id=salonDialogueGroup(p2,10004,'cut').group.GroupID;
 rows(p2.combat,'몬스터 페이즈')[0].EntryDialogueGroupID=id;
 assert(rows(combatForWorkbook(p2),'대화 그룹').some(r=>r.GroupID===id));
});

test('conflicting incoming workshop links fail without changing either input',()=>{
 const p=structuredClone(base),incoming=structuredClone(p.combat),before=structuredClone(incoming);
 salonDialogueGroup({...p,combat:incoming},10004,'cut').lines[0].Text='다른 작업본';
 const expected=structuredClone(incoming);
 assert.throws(()=>mergeWorkshopDialogues(p,incoming),/충돌/);assert.deepEqual(incoming,expected);assert.deepEqual(p.combat,before);
});
