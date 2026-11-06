import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const expected=process.env.GITHUB_SHA;
assert.match(expected||'',/^[a-f0-9]{40}$/);
const base='https://dante950.github.io/';
const local=JSON.parse(await fs.readFile('dist/version.json','utf8'));
const automationOnly=process.env.RELEASE_AUTOMATION_ONLY==='true';
const matches=v=>automationOnly?v?.releaseId===local.releaseId:v?.commit===expected;
let version;
for(let attempt=0;attempt<60;attempt++){
 const response=await fetch(base+'version.json?v='+expected+'&attempt='+attempt,{cache:'no-store'}).catch(()=>null);
 if(response?.ok){version=await response.json();if(matches(version))break;}
 await new Promise(resolve=>setTimeout(resolve,5000));
}
assert(matches(version),'Published release must match the checked source (or identical assets for automation-only changes)');
console.log('Verified public version:',version.commit);
// Gameplay is checked before deployment. Do not repeat the full journey on production.
const index=await fetch(base+'?v='+expected,{cache:'no-store'});assert(index.ok);assert((await index.text()).includes(version.files.boot));
for(const file of new Set(Object.values(version.files).filter(v=>typeof v==='string'))){const response=await fetch(new URL(file,base));assert(response.ok,'Published asset: '+file);}
await fs.mkdir('docs/demon-two-phase-2026-11-06',{recursive:true});
await fs.writeFile('docs/demon-two-phase-2026-11-06/public-verification.json',JSON.stringify({checkedCommit:expected,publishedCommit:version.commit,automationOnly,version,url:base,verifiedAt:new Date().toISOString(),result:'passed',scope:'Published commit, entry HTML and release assets; gameplay verified by the pre-deploy browser job'},null,2));
