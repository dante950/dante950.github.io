import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {projectForPlay,draftStoreKey} from '../src/publishing.js';
import {projectProblems} from '../src/model.js';
import {validate} from '../src/combat/engine.js';
import {loadAudioBytes} from '../src/media.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=f=>fs.readFile(path.join(root,f),'utf8');
const project=JSON.parse(await read('data/project.json'));
const version=JSON.parse(await read('dist/version.json'));

test('audio loader reads both embedded data and published files and rejects missing audio',async(t)=>{
 const data=await loadAudioBytes('data:audio/wav;base64,UklGRg==');
 assert.equal(Buffer.from(data).toString(),'RIFF');
 const manifest=JSON.parse(await read('asset-manifest.json'));
 const file=Object.keys(manifest).find(f=>f.endsWith('.ogg'));
 const bytes=await fs.readFile(path.join(root,'dist/media',file));
 const requested=[];
 t.mock.method(globalThis,'fetch',async url=>{requested.push(url);return new Response(bytes);});
 assert.equal(Buffer.from(await loadAudioBytes('./media/'+file)).subarray(0,4).toString(),'OggS');
 assert.deepEqual(requested,['./media/'+file]);
 globalThis.fetch.mock.mockImplementation(async()=>new Response(null,{status:404}));
 await assert.rejects(loadAudioBytes('./missing.ogg'),/음원 파일/);
});

test('public play receives new deployment even if a visitor saved different data',()=>{
 const local=structuredClone(project);local.guests[0].name='개인 시험';
 const live=projectForPlay(project,local,false),preview=projectForPlay(project,local,true);
 assert.equal(live.guests[0].name,project.guests[0].name);
 assert.equal(preview.guests[0].name,'개인 시험');
 preview.guests[0].name='플레이 중 변경';
 assert.equal(local.guests[0].name,'개인 시험');
 assert.notEqual(draftStoreKey('new'),draftStoreKey('old'));
});

test('all three guests and their combat data pass existing validation',()=>{
 assert.deepEqual(projectProblems(project),[]);
 for(const guest of project.guests)assert.deepEqual(validate(project.combat,{monsterID:guest.id}).errors,[],guest.name);
 assert.deepEqual(project.schedule,[[10001,10002],[10003]]);
 assert.equal(project.guests.find(g=>g.id===10002).beauty.enabled,false);
});

test('all extracted media references resolve in the public package',async()=>{
 const names=await fs.readdir(path.join(root,'dist'));
 let refs=new Set();
 for(const name of names.filter(x=>/\.(html|json|js|css)$/.test(x))){
  const content=await read('dist/'+name);
  assert.ok(!/C:[\\/]+Users[\\/]+koh/.test(content),name+' contains local path');
  for(const m of content.matchAll(/\.\/media\/([a-f0-9]+\.[a-z0-9]+)/g))refs.add(m[1]);
 }
 assert.ok(refs.size>=100);
 for(const name of refs)assert.ok((await fs.stat(path.join(root,'dist/media',name))).size>0,name);
});

test('parent, loader and every executable child script have valid JavaScript',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'yachacha-syntax-'));
 try{
  let count=0;
  const check=async(code,module,label)=>{
   const file=path.join(temp,`${count++}.${module?'mjs':'cjs'}`);await fs.writeFile(file,code);
   const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
   assert.equal(result.status,0,label+'\n'+result.stderr);
  };
  for(const key of ['app','boot'])await check(await read('dist/'+version.files[key]),true,key);
  for(const key of ['salon','combat']){
   const text=await read('dist/'+version.files[key]);
   for(const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(/type="(?:application\/(?:json|octet-stream)|text\/plain)"/i.test(m[1]))continue;
    await check(m[2],/type="module"/i.test(m[1]),key);
   }
  }
  assert.equal(count,5,'parent, loader, salon, JSZip and combat bundle');
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});

test('page entry and all versioned boot assets exist',async()=>{
 const html=await read('dist/index.html');
 assert.ok(html.includes(version.files.boot));assert.ok(html.includes(version.files.style));
 assert.ok(html.includes('내 작업본으로 시험 플레이'));
 for(const filename of Object.values(version.files))assert.ok((await fs.stat(path.join(root,'dist',filename))).size>0);
 const app=await read('dist/'+version.files.app);
 assert.ok(app.includes("el('play').onclick=()=>startStory(false)"));
 assert.ok(app.includes("el('playSaved').onclick=()=>startStory(true)"));
});
