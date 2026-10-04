import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pbkdf2Sync} from 'node:crypto';
import {createOwnerAccess,verifyWorkshopPassword} from '../src/owner-access.js';
const fixture={salt:'public-test-salt',iterations:1000,hash:pbkdf2Sync('Test-only-Password','public-test-salt',1000,32,'sha256').toString('hex')};
const checker=p=>verifyWorkshopPassword(p,fixture);
test('password comparison accepts the exact password, rejects wrong case and whitespace',async()=>{
 assert.equal(await checker('Test-only-Password'),true);
 for(const value of ['',null,'wrong','test-only-password','Test-only-Password '])assert.equal(await checker(value),false);
});
test('each page starts locked; wrong password and cancelling keep it locked; relock and expiry revoke access',async()=>{
 let clock=1000,prompts=0;const states=[];
 const a=createOwnerAccess({verifyPassword:checker,now:()=>clock,onChange:v=>states.push(v),requestUnlock:async()=>{prompts++;return false;}});
 assert.equal(await a.restore(),false);assert.equal(a.allowed,false);
 assert.equal(await a.verify(),false);assert.equal(prompts,1);
 assert.equal(await a.unlock('wrong'),false);assert.equal(a.allowed,false);
 assert.equal(await a.unlock('Test-only-Password'),true);assert.equal(await a.verify(),true);
 const fresh=createOwnerAccess({verifyPassword:checker});assert.equal(fresh.allowed,false);
 await a.logout();assert.equal(a.allowed,false);assert.equal(states.at(-1),null);
 await a.unlock('Test-only-Password');clock+=8*3600000+1;assert.equal(a.allowed,false);await a.logout();
});
test('locking while password verification is pending cannot unlock later',async()=>{
 let finish;const a=createOwnerAccess({verifyPassword:()=>new Promise(r=>finish=r)});
 const attempt=a.unlock('test');await a.logout();finish(true);assert.equal(await attempt,false);assert.equal(a.allowed,false);
});
test('locked buttons remain focusable to open the password dialog; no external login service is bundled',async()=>{
 for(const [file,ids] of [['src/index.html',['publish','editorSave','importProject','exportProject']],['src/combat/index.html',['importBook','exportBook','chooseVersionFolder','exportZip']]]){
  const html=await fs.readFile(new URL('../'+file,import.meta.url),'utf8');for(const id of ids){const tag=html.match(new RegExp('<button[^>]+id="'+id+'"[^>]*>'))?.[0];assert.ok(tag&&/aria-disabled="true"/.test(tag)&&/data-owner-only/.test(tag),id);assert.ok(!/\sdisabled(?:\s|>)/.test(tag),id+' must receive clicks for unlock');}
 }
 const text=await fs.readFile(new URL('../src/owner-access.js',import.meta.url),'utf8');assert.ok(!/https?:|fetch\(|localStorage|sessionStorage/.test(text));
});
