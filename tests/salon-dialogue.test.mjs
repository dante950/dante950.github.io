import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {salonDialogueGroup,salonDialogueProblems,migrateSalonDialogues,salonRequestAtEnd} from '../src/salon-dialogue.js';
import {DialoguePlayer} from '../src/combat/dialogue.js';
const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
test('six stage links resolve twelve ordered request groups with no legacy shadow text',()=>{
 assert.deepEqual(salonDialogueProblems(project),[]);
 assert.equal(project.combat.sheets.find(s=>s.name==='미용 대사 연결').rows.length,6);
 for(const id of [10001,10003])for(const stage of ['cut','draw','attach'])for(const detail of [false,true])assert.ok(salonDialogueGroup(project,id,stage,detail).lines.length);
 for(const g of project.guests.filter(g=>g.beauty.enabled)){assert.equal(g.beauty.request,undefined);assert.equal(g.beauty.requestDetails,undefined);assert.equal(g.bindings.cut,undefined);}
});
test('Excel-linked text is authoritative and separate groups cannot advance into clarification',()=>{
 const p=structuredClone(project),first=salonDialogueGroup(p,10001,'cut'),detail=salonDialogueGroup(p,10001,'cut',true);
 first.lines[0].Text='엑셀에서 바꾼 처음 부탁';detail.lines[0].Text='엑셀에서 바꾼 상세 부탁';
 const player=new DialoguePlayer({data:p.combat,monster:{},options:{}});
 assert.ok(player.play(first.group.GroupID));player.advance();assert.equal(player.visibleText,'엑셀에서 바꾼 처음 부탁');player.advance();assert.equal(player.active,null);
 assert.deepEqual(player.history,[first.lines[0].DialogueID]);
 player.play(detail.group.GroupID);player.advance();assert.equal(player.visibleText,'엑셀에서 바꾼 상세 부탁');
});
test('choices wait until the final sentence of a multi-line group',()=>{
 const p=structuredClone(project),{group,lines}=salonDialogueGroup(p,10003,'cut');group.GapMs=0;
 p.combat.sheets.find(s=>s.name==='대사').rows.push({DialogueID:999991,GroupID:group.GroupID,Order:2,Speaker:'몬스터',Text:'두 번째 문장'});
 const player=new DialoguePlayer({data:p.combat,monster:{},options:{}});player.play(group.GroupID);
 assert.equal(salonRequestAtEnd(player),false);player.advance();assert.equal(salonRequestAtEnd(player),false);
 player.advance();assert.equal(player.line.DialogueID,999991);assert.equal(salonRequestAtEnd(player),false);player.advance();assert.equal(salonRequestAtEnd(player),true);
});
test('reject missing, duplicate, invalid stage and non-input request links',()=>{
 for(const mutate of [p=>p.combat.sheets.find(s=>s.name==='미용 대사 연결').rows.pop(),p=>{const r=p.combat.sheets.find(s=>s.name==='미용 대사 연결').rows;r.push({...r[0]});},p=>p.combat.sheets.find(s=>s.name==='미용 대사 연결').rows[0].Stage='unknown',p=>p.combat.sheets.find(s=>s.name==='미용 대사 연결').rows[0].DetailGroupID=999999,p=>salonDialogueGroup(p,10001,'cut').group.AdvanceMode='자동']){
  const p=structuredClone(project);mutate(p);assert.ok(salonDialogueProblems(p).length);
 }
});
test('legacy project import migrates once and never overwrites current Excel data',()=>{
 const p=structuredClone(project);p.combat.sheets=p.combat.sheets.filter(s=>s.name!=='미용 대사 연결');
 for(const g of p.guests.filter(g=>g.beauty.enabled)){g.beauty.request='내 예전 편집';g.beauty.drawHint='색';g.beauty.attachHint='장식';g.beauty.requestDetails={cut:'상세',draw:'상세 색',attach:'상세 장식'};}
 migrateSalonDialogues(p);assert.deepEqual(salonDialogueProblems(p),[]);assert.equal(salonDialogueGroup(p,10001,'cut').lines[0].Text,'내 예전 편집');
 salonDialogueGroup(p,10001,'cut').lines[0].Text='최신 엑셀 편집';migrateSalonDialogues(p);assert.equal(salonDialogueGroup(p,10001,'cut').lines[0].Text,'최신 엑셀 편집');
});
