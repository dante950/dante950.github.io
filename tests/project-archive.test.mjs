import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const zipModule={exports:{}};new Function('module','exports',await fs.readFile(new URL('../vendor/jszip.min.js',import.meta.url),'utf8'))(zipModule,zipModule.exports);const JSZip=zipModule.exports;
import {ensureCoffeeDialogues} from '../src/tutorial/dialogues.js';
import {combatForWorkbook,mergeWorkshopDialogues} from '../src/workshop-dialogue.js';
import {projectArchiveFiles,readProjectArchive,PROJECT_ARCHIVE_FILE} from '../src/project-archive.js';
const original=ensureCoffeeDialogues(JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8')));
const fakeFile=(name,bytes)=>({name,arrayBuffer:async()=>bytes,text:async()=>typeof bytes==='string'?bytes:Buffer.from(bytes).toString()});
test('table ZIP restores both excluded guests and current combat edits, including text effects and event bindings',async()=>{
 const p=structuredClone(original),lines=p.combat.sheets.find(s=>s.name==='대사').rows;
 for(const id of [10005,10006]){const g=p.guests.find(g=>g.id===id),gid=Object.values(g.bindings)[0];lines.find(l=>l.GroupID===gid).Text='<wave=2>작업자 수정 '+id+'</wave>';}
 const combat=combatForWorkbook(p);combat.sheets.find(s=>s.name==='몬스터 페이즈').rows[0].MaxHP+=1;
 const complete={...p,combat:mergeWorkshopDialogues(p,combat)},before=structuredClone(complete);
 const files=projectArchiveFiles(complete,'test'),zip=new JSZip();for(const f of files)zip.file('version/'+f.path,f.bytes);
 zip.file('version/내 작업용 데이터 테이블/table.xlsm','placeholder');const restored=await readProjectArchive(fakeFile('tables.zip',await zip.generateAsync({type:'uint8array'})),JSZip);
 assert.deepEqual(restored.guests,complete.guests);assert.deepEqual(restored.combat,complete.combat);assert.deepEqual(complete,before);
 assert.deepEqual(JSON.parse(files.find(f=>f.path===PROJECT_ARCHIVE_FILE).bytes).combat,complete.combat);
});
test('standalone JSON remains supported and old table-only ZIP fails with actionable recovery guidance',async()=>{
 assert.deepEqual(await readProjectArchive(fakeFile('project.json',JSON.stringify(original)),JSZip),original);
 const zip=new JSZip();zip.file('old/버전 정보.json','{}');zip.file('old/내 작업용 데이터 테이블/table.xlsm','placeholder');
 await assert.rejects(readProjectArchive(fakeFile('old.zip',await zip.generateAsync({type:'uint8array'})),JSZip),/작업자의 편집 탭/);
 assert.throws(()=>projectArchiveFiles(null,'bad'),/저장을 중단/);
});
test('ambiguous archives and non-project JSON cannot silently replace the editor',async()=>{
 const zip=new JSZip();for(const folder of ['one','two'])zip.file(folder+'/'+PROJECT_ARCHIVE_FILE,JSON.stringify(original));
 await assert.rejects(readProjectArchive(fakeFile('two.zip',await zip.generateAsync({type:'uint8array'})),JSZip),/여러 개/);
 await assert.rejects(readProjectArchive(fakeFile('버전 정보.json','{}'),JSZip),/통합 프로젝트/);
});
