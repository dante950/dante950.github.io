import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {demonGuest,demonJudge,demonGate,demonHornAllowance,demonFacePaintLimit,DEMON_FACE_LIMIT,demonRoyalStickers,demonRoofProfile,demonPolygon,DEMON_DESIGN,demonSilverStripe,demonGrowthPalette,ensureDemonDialogueCatalogue} from '../src/demon-guest.js';
import {projectProblems,storyStartOptions} from '../src/model.js';
const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
test('demon is the fourth-day guest in the shared story and has no battle route',()=>{assert.deepEqual(projectProblems(project),[]);const start=storyStartOptions(project).find(x=>x.guest.id===10007);assert.equal(start.day,4);assert.equal(start.guest.battle,'none');assert.equal(start.guest.workbookExcluded,false);});
test('only three stars admit the visit',()=>{for(const n of [0,1,2])assert.equal(demonGate(n).admitted,false);assert.equal(demonGate(3).admitted,true);});
const helmet={hornRatio:1,hornHeight:0,hornWidth:0,bodyLoss:0,exposure:0,growthRatio:0,scratches:1,darkBase:1,eyePaint:0,decorCount:0,decorArea:0,decorEyes:0};
const royal={leftEar:1,rightEar:1,rightTip:.5,lengthOver:0,roofPeaks:3,centerHighest:true,eyes:1,forelock:1,black:1,silverLine:true,silverTotal:16,silverSpill:0,brow:1,rightBrowPaint:0,facePaintCore:0,visibleFace:2000,adornments:[true,true,true]};
test('helmet permits creative silhouette, accents and two small stickers, while protecting eye openings',()=>{assert.equal(demonJudge(1,helmet).success,true);assert.equal(demonJudge(1,{...helmet,growthRatio:.3,darkBase:.7,eyePaint:.15,decorCount:2,decorArea:.18}).success,true);for(const m of [{hornRatio:.7},{hornHeight:12},{growthRatio:.31},{scratches:.89},{darkBase:.69},{eyePaint:.16},{decorCount:3},{decorEyes:.06}])assert.equal(demonJudge(1,{...helmet,...m}).success,false,JSON.stringify(m));});
test('face warnings do not interrupt until thirty-five percent',()=>{assert.equal(DEMON_FACE_LIMIT,.35);for(const exposure of [.15,.20,.349])assert.equal(demonJudge(1,{...helmet,exposure}).sudden,false);assert.equal(demonJudge(1,{...helmet,exposure:.35}).sudden,true);});
test('every royal order is independently graded, with small dye spills still tolerated',()=>{assert.equal(demonJudge(2,royal).success,true);for(const change of [{leftEar:.89},{rightTip:0},{rightTip:1},{lengthOver:7},{roofPeaks:2},{centerHighest:false},{eyes:.8},{forelock:0},{black:.96},{silverLine:false},{brow:.7},{rightBrowPaint:.1},{facePaintCore:41},{adornments:[true,false,true]}])assert.equal(demonJudge(2,{...royal,...change}).success,false,JSON.stringify(change));assert.equal(demonJudge(2,{...royal,black:.97,facePaintCore:40}).success,true);assert.equal(demonFacePaintLimit(10),6);});
test('only the named crown and matching ear accessory combinations satisfy the king',()=>{const p=(name,x,y)=>({sticker:{resourceFile:name+'.png'},x,y});for(const crown of ['T_tara','T_blackCrown'])for(const ear of ['T_earring_L','T_earring_R','T_Cross'])assert.deepEqual(demonRoyalStickers([p(crown,166,25),p(ear,ear==='T_earring_R'?233:110,180)]),[true,true,true]);assert.deepEqual(demonRoyalStickers([p('T_tara',166,25),p('T_earring_R',110,180)]),[true,false,false]);assert.deepEqual(demonRoyalStickers([p('T_tara',166,25),p('T_blackCrown',170,25)]),[false,false,false]);});
test('beauty ends at handsome phase two; goblin is never a beauty phase',async()=>{assert.throws(()=>demonGuest(3));assert.equal(demonJudge(3,royal).success,false);const story=await fs.readFile(new URL('../src/demon-story.js',import.meta.url),'utf8');assert(!story.includes('changeDemonPhase(3)'));assert(story.includes("form:'handsome'"));});
test('retired standalone game and its combat implementation are absent',async()=>{for(const p of ['../src/demon/app.js','../src/demon/model.js','../src/demon/index.html'])await assert.rejects(fs.access(new URL(p,import.meta.url)));const app=await fs.readFile(new URL('../src/app.js',import.meta.url),'utf8');assert(!app.includes("frame.id='demonVisit'"));const index=await fs.readFile(new URL('../src/index.html',import.meta.url),'utf8');assert(!index.includes('마왕 방문 · 미용 시험'));});

test('horn contour permits a size-four brush fringe but still rejects distant growth',()=>{const mask=new Uint8Array(49);mask[24]=1;const a=demonHornAllowance(mask,7,7);assert.equal(a[24],1);assert.equal(a[26],1);assert.equal(a[10],1);assert.equal(a[27],0);assert.equal(a[8],0);assert.equal(demonJudge(1,{...helmet,growthRatio:.31}).success,false);});
test('horn contour allowance stays inside grid edges without wrapping rows',()=>{const mask=new Uint8Array(25);mask[0]=1;const a=demonHornAllowance(mask,5,5);assert.equal(a[2],1);assert.equal(a[10],1);assert.equal(a[4],0);assert.equal(a[24],0);});

const W=160,H=175;
const silhouette=points=>Uint8Array.from({length:W*H},(_,n)=>+demonPolygon(n%W*2+1,Math.floor(n/W)*2+1,points));
test('roof checks three visible peaks and relative height, permitting a different silhouette',()=>{
 for(const points of [DEMON_DESIGN.roof,[[94,104],[110,60],[139,90],[170,38],[197,90],[226,62],[244,104]]]){
  const result=demonRoofProfile(silhouette(points),W,H);assert.equal(result.roofPeaks,3);assert.equal(result.centerHighest,true);
 }
 assert.equal(demonRoofProfile(silhouette([[100,104],[100,50],[230,50],[230,104]]),W,H).centerHighest,false);
 const low=[[100,104],[115,40],[140,90],[170,60],[200,90],[225,40],[240,104]];
 assert.equal(demonRoofProfile(silhouette(low),W,H).centerHighest,false);
});
test('silver stripe can move and vary in width, but a broad patch or an unrelated streak fails',()=>{
 const hair=new Uint8Array(W*H);for(let y=50;y<73;y++)for(let x=73;x<102;x++)hair[y*W+x]=1;
 const paintLine=(x,y,w,h)=>{const p=new Uint8ClampedArray(W*H*4);for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)p.set([236,235,244,255],(yy*W+xx)*4);return p;};
 for(const [x,w] of [[85,2],[88,3],[90,4]])assert.equal(demonSilverStripe(hair,paintLine(x,63,w,10),W,H).valid,true);
 assert.equal(demonSilverStripe(hair,paintLine(82,63,12,10),W,H).valid,false);
 assert.equal(demonSilverStripe(hair,paintLine(50,63,3,10),W,H).valid,false);
 assert.equal(demonSilverStripe(hair,new Uint8ClampedArray(W*H*4),W,H).valid,false);
});
test('growth uses source interior colours rather than expanding the original black outline',()=>{
 const p=new Uint8ClampedArray(7*7*4);for(let y=1;y<6;y++)for(let x=1;x<6;x++)p.set(x===1||x===5||y===1||y===5?[20,20,25,255]:[210,205,230,255],(y*7+x)*4);
 const colors=demonGrowthPalette(p,7,7);assert.deepEqual([...colors.slice(0,4)],[210,205,230,255]);
});
test('both phases stay in workbook dialogue sheets, without overwriting authored lines or IDs',()=>{
 const p=structuredClone(project),g=p.guests.find(g=>g.id===10007),rows=n=>p.combat.sheets.find(s=>s.name===n).rows;
 assert.equal(Object.keys(g.demonPhaseDialogue[2]).length,3);
 const id=g.demonPhaseDialogue[2].draw.RequestGroupID,line=rows('대사').find(l=>l.GroupID===id);line.Text='수정한 미형 요청';
 const before=structuredClone(p);ensureDemonDialogueCatalogue(p);assert.deepEqual(p,before);assert.equal(line.Text,'수정한 미형 요청');
});
