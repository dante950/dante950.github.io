import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {demonGuest,demonJudge,demonGate,demonHornAllowance,demonFacePaintLimit,DEMON_FACE_LIMIT,demonRoyalStickers,demonRoofProfile,demonPolygon,DEMON_DESIGN,demonSilverStripe,demonGrowthPalette,demonMakeupMasks,demonMakeup,demonLipPaint,ensureDemonDialogueCatalogue} from '../src/demon-guest.js';
import {projectProblems,storyStartOptions} from '../src/model.js';
const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
test('demon is the fourth-day guest in the shared story and has no battle route',()=>{assert.deepEqual(projectProblems(project),[]);const start=storyStartOptions(project).find(x=>x.guest.id===10007);assert.equal(start.day,4);assert.equal(start.guest.battle,'none');assert.equal(start.guest.workbookExcluded,false);});
test('only three stars admit the visit',()=>{for(const n of [0,1,2])assert.equal(demonGate(n).admitted,false);assert.equal(demonGate(3).admitted,true);});
const helmet={hornRatio:1,hornHeight:0,hornWidth:0,bodyLoss:0,exposure:0,growthRatio:0,scratches:1,darkBase:1,eyePaint:0,decorCount:0,decorArea:0,decorEyes:0};
const royal={leftEar:1,rightEar:1,rightTip:.5,lengthOver:0,roofPeaks:3,centerHighest:true,eyes:1,forelock:1,black:1,silverLine:true,silverTotal:16,silverSpill:0,browLeft:1,browRight:1,lips:true,eyelidLeft:true,eyelidRight:true,facePaintCore:0,visibleFace:2000,adornments:[true,true]};
test('helmet permits creative silhouette, accents and two small stickers, while protecting eye openings',()=>{assert.equal(demonJudge(1,helmet).success,true);assert.equal(demonJudge(1,{...helmet,growthRatio:.3,darkBase:.7,eyePaint:.15,decorCount:2,decorArea:.18}).success,true);for(const m of [{hornRatio:.7},{hornHeight:12},{growthRatio:.31},{scratches:.89},{darkBase:.69},{eyePaint:.16},{decorCount:3},{decorEyes:.06}])assert.equal(demonJudge(1,{...helmet,...m}).success,false,JSON.stringify(m));});
test('face warnings do not interrupt until thirty-five percent',()=>{assert.equal(DEMON_FACE_LIMIT,.35);for(const exposure of [.15,.20,.349])assert.equal(demonJudge(1,{...helmet,exposure}).sudden,false);assert.equal(demonJudge(1,{...helmet,exposure:.35}).sudden,true);});
test('every royal order is independently graded, with small dye spills still tolerated',()=>{assert.equal(demonJudge(2,royal).success,true);for(const change of [{leftEar:.89},{rightTip:0},{rightTip:1},{lengthOver:7},{eyes:.8},{black:.9499},{silverLine:false},{browLeft:.69},{browRight:.69},{lips:false},{eyelidLeft:false},{eyelidRight:false},{adornments:[true,false]}])assert.equal(demonJudge(2,{...royal,...change}).success,false,JSON.stringify(change));assert.equal(demonJudge(2,{...royal,black:.95,facePaintCore:40}).success,true);assert.equal(demonJudge(2,{...royal,black:.96}).success,true);assert.equal(demonFacePaintLimit(10),6);});
test('royal accessories accept a matching pair of large horns or one tiara',()=>{
 const p=(name,x,y)=>({sticker:{resourceFile:name+'.png'},x,y}),left=p('T_hornBig_L',106,66),right=p('T_hornBig_R',230,66),tiara=p('T_tara',166,26);
 assert.deepEqual(demonRoyalStickers([left,right]),[true,true]);assert.deepEqual(demonRoyalStickers([tiara]),[true,true]);
 for(const items of [[],[left],[right],[left,left],[tiara,left,right],[p('T_hornBig_R',106,66),p('T_hornBig_L',230,66)],[p('T_tara',166,220)],[p('T_blackCrown',166,26)],[tiara,p('T_earring_L',110,180)],[tiara,p('T_Cross',233,180)]])assert(!demonRoyalStickers(items).every(Boolean),JSON.stringify(items));
});
test('beauty ends at handsome phase two; goblin is never a beauty phase',async()=>{assert.throws(()=>demonGuest(3));assert.equal(demonJudge(3,royal).success,false);const story=await fs.readFile(new URL('../src/demon-story.js',import.meta.url),'utf8');assert(!story.includes('changeDemonPhase(3)'));assert(story.includes("form:'handsome'"));});
test('retired standalone game and its combat implementation are absent',async()=>{for(const p of ['../src/demon/app.js','../src/demon/model.js','../src/demon/index.html'])await assert.rejects(fs.access(new URL(p,import.meta.url)));const app=await fs.readFile(new URL('../src/app.js',import.meta.url),'utf8');assert(!app.includes("frame.id='demonVisit'"));const index=await fs.readFile(new URL('../src/index.html',import.meta.url),'utf8');assert(!index.includes('마왕 방문 · 미용 시험'));});

test('horn contour permits a size-four brush fringe but still rejects distant growth',()=>{const mask=new Uint8Array(49);mask[24]=1;const a=demonHornAllowance(mask,7,7);assert.equal(a[24],1);assert.equal(a[26],1);assert.equal(a[10],1);assert.equal(a[27],0);assert.equal(a[8],0);assert.equal(demonJudge(1,{...helmet,growthRatio:.31}).success,false);});
test('horn contour allowance stays inside grid edges without wrapping rows',()=>{const mask=new Uint8Array(25);mask[0]=1;const a=demonHornAllowance(mask,5,5);assert.equal(a[2],1);assert.equal(a[10],1);assert.equal(a[4],0);assert.equal(a[24],0);});

const W=160,H=175;
const silhouette=points=>Uint8Array.from({length:W*H},(_,n)=>+demonPolygon(n%W*2+1,Math.floor(n/W)*2+1,points));
test('top hair silhouette and eyebrow tail no longer impose a pixel-shape order',()=>{
 assert.equal(demonJudge(2,{...royal,roofPeaks:0,centerHighest:false,forelock:0,brow:0,rightBrowPaint:1}).success,true);
 for(const stage of ['cut','draw'])assert(!demonGuest(2).beauty.requestNotes[stage].match(/세 봉우리|세 칸|원래대로/));
});
test('silver stripe can move and vary in width, but a broad patch or an unrelated streak fails',()=>{
 const hair=new Uint8Array(W*H);for(let y=15;y<73;y++)for(let x=40;x<110;x++)hair[y*W+x]=1;
 const paintLine=(x,y,w,h)=>{const p=new Uint8ClampedArray(W*H*4);for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)p.set([236,235,244,255],(yy*W+xx)*4);return p;};
 for(const [x,w] of [[50,1],[85,2],[88,3]])assert.equal(demonSilverStripe(hair,paintLine(x,63,w,10),W,H).valid,true);
 assert.equal(demonSilverStripe(hair,paintLine(82,63,12,10),W,H).valid,false);
 assert.equal(demonSilverStripe(hair,paintLine(25,63,3,10),W,H).valid,false);
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

test('free face decoration is not a cleanliness failure while requested makeup still matters',()=>{
 assert.equal(demonJudge(2,{...royal,facePaintCore:2000,visibleFace:2000}).success,true);
 for(const bad of [{browLeft:0},{browRight:0},{lips:false},{eyelidLeft:false},{eyelidRight:false}])assert.equal(demonJudge(2,{...royal,facePaintCore:2000,...bad}).success,false);
 assert.equal(demonGuest(2).beauty.requestBriefNotes.draw.split('\n').length,5);
 assert(!demonGuest(2).beauty.requestBriefNotes.draw.includes('깨끗'));
});
test('subtle lipstick accepts 15–30 percent red, but not opaque red, pink or a broad smear',()=>{
 const face=new Uint8ClampedArray(W*H*4);for(let n=0;n<W*H;n++)face.set([235,235,240,255],n*4);
 const masks=demonMakeupMasks(face,W,H),hair=new Uint8Array(W*H);
 const lip=(alpha,rows=1,color=[255,48,36])=>{const p=new Uint8ClampedArray(face.length);for(let y=97;y<97+rows;y++)for(let x=78;x<89;x++)p.set([...color,alpha],(y*W+x)*4);return demonMakeup(hair,p,masks,W,H).lips;};
 for(const alpha of [38,51,64,77])assert(lip(alpha));
 for(const alpha of [0,35,80,128,255])assert(!lip(alpha));
 assert(!lip(51,3));assert(!lip(51,1,[255,103,167]));
});
test('both painted eyebrows and both thin upper-eye creases are required',()=>{
 const base=new Uint8ClampedArray(W*H*4);for(let n=0;n<W*H;n++)base.set([235,235,240,255],n*4);
 const masks=demonMakeupMasks(base,W,H),hair=new Uint8Array(W*H),paint=new Uint8ClampedArray(base.length);
 const fill=k=>{for(let n=0;n<W*H;n++)if(masks[k][n])paint.set([24,21,31,255],n*4);};
 fill('brow');let m=demonMakeup(hair,paint,masks,W,H);assert.equal(m.browLeft,1);assert.equal(m.browRight,0);assert.equal(m.eyelidLeft,false);
 fill('browRight');fill('eyelidLeft');fill('eyelidRight');m=demonMakeup(hair,paint,masks,W,H);assert.equal(m.browRight,1);assert(m.eyelidLeft);assert(m.eyelidRight);
});
test('published phase-two dialogue matches the current requests and details',()=>{
 const g=project.guests.find(g=>g.id===10007),lines=project.combat.sheets.find(s=>s.name==='대사').rows,guest=demonGuest(2);
 for(const stage of ['cut','draw','attach'])for(const [key,list]of [['RequestGroupID',guest.demonRequest[stage]],['DetailGroupID',guest.demonRequestDetails[stage]]]){
  const actual=lines.filter(r=>r.GroupID===g.demonPhaseDialogue[2][stage][key]).sort((a,b)=>a.Order-b.Order).map(r=>r.Text);
  assert.deepEqual(actual,list.map(v=>Array.isArray(v)?v[1]:v));
 }
});

test('eyebrow masks exclude pale skin and remain separate from lowered eyelid creases',()=>{
 const base=new Uint8ClampedArray(W*H*4);for(let n=0;n<W*H;n++)base.set([215,215,225,255],n*4);
 // Original white brow bodies; nearby pale skin must not become a dye target.
 for(let y=71;y<=73;y++)for(const [a,b]of [[61,77],[90,106]])for(let x=a;x<=b;x++)base.set([240,240,246,255],(y*W+x)*4);
 const masks=demonMakeupMasks(base,W,H),paint=new Uint8ClampedArray(base.length),hair=new Uint8Array(W*H);
 for(let n=0;n<W*H;n++){
  assert(!((masks.brow[n]||masks.browRight[n])&&(masks.eyelidLeft[n]||masks.eyelidRight[n])));
  if(masks.brow[n]||masks.browRight[n]){assert(Math.min(...base.slice(n*4,n*4+3))>=225);paint.set([24,21,31,255],n*4);}
  if(masks.eyelidLeft[n]||masks.eyelidRight[n])assert(Math.floor(n/W)*2+1>=151);
 }
 const m=demonMakeup(hair,paint,masks,W,H);assert.equal(m.browLeft,1);assert.equal(m.browRight,1);assert.equal(m.eyelidLeft,false);assert.equal(m.eyelidRight,false);
});
