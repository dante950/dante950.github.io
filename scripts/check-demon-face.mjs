// The two-phase regression supersedes the earlier three-phase checks.
const urlIndex=process.argv.findIndex(a=>a.startsWith('--url='));
if(urlIndex>=0){const url=process.argv[urlIndex].slice(6);process.argv.splice(urlIndex,1,'--url',url);}
if(!process.argv.includes('--url'))process.argv.push('--phase2');
await import('./check-demon-salon.mjs');
