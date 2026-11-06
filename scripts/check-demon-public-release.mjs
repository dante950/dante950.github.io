import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const expected=process.env.GITHUB_SHA;
assert.match(expected||'',/^[a-f0-9]{40}$/);
const base='https://dante950.github.io/';
let version;
for(let attempt=0;attempt<60;attempt++){
 const response=await fetch(base+'version.json?v='+expected+'&attempt='+attempt,{cache:'no-store'}).catch(()=>null);
 if(response?.ok){version=await response.json();if(version.commit===expected)break;}
 await new Promise(resolve=>setTimeout(resolve,5000));
}
assert.equal(version?.commit,expected,'Published release must match the checked commit');
console.log('Verified public version:',expected);
process.argv.push('--chromium','--url',base+'?v='+expected);
await import('./check-demon-salon.mjs');
await fs.writeFile('docs/demon-two-phase-2026-11-06/public-verification.json',JSON.stringify({commit:expected,version,url:base,verifiedAt:new Date().toISOString(),browser:'Chromium',result:'passed',scope:'Actual public helmet restoration, creative styling, royal orders, six accessory combinations and handsome selfie'},null,2));
