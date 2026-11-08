import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {DEMON_EVENT_DIALOGUES,demonWorkshopGuest,installDemonDialogue,DEMON_LINES,demonGrowthCells,demonGuest,demonJudge,demonGate,demonHornAllowance,demonFacePaintLimit,DEMON_FACE_LIMIT,demonRoyalStickers,demonRoofProfile,demonPolygon,DEMON_DESIGN,demonSilverStripe,demonGrowthPalette,demonMakeupMasks,demonMakeup,demonLipPaint,ensureDemonDialogueCatalogue} from '../src/demon-guest.js';
import {projectProblems,storyStartOptions} from '../src/model.js';
const project=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));
test('demon stays a fourth-day beauty guest in workbook data; its story controller owns the battle branch',()=>{assert.deepEqual(projectProblems(project),[]);const start=storyStartOptions(project).find(x=>x.guest.id===10007);assert.equal(start.day,4);assert.equal(start.guest.battle,'none');assert.equal(start.guest.workbookExcluded,false);});
test('only three stars admit the visit',()=>{for(const n of [0,1,2])assert.equal(demonGate(n).admitted,false);assert.equal(demonGate(3).admitted,true);});
const helmet={hornRatio:1,hornHeight:0,hornWidth:0,bodyLoss:0,exposure:0,growthRatio:0,scratches:1,darkBase:1,eyePaint:0,decorCount:0,decorArea:0,decorEyes:0};
const royal={leftEar:1,rightEar:1,rightTip:.5,lengthOver:0,roofPeaks:3,centerHighest:true,eyes:1,forelock:1,black:1,silverLine:true,silverTotal:16,silverSpill:0,browLeft:1,browRight:1,lips:true,eyelidLeft:true,eyelidRight:true,facePaintCore:0,visibleFace:2000,adornments:[true,true]};
test('helmet permits creative silhouette, accents and two small stickers, including over the eye openings',()=>{assert.equal(demonJudge(1,helmet).success,true);assert.equal(demonJudge(1,{...helmet,growthRatio:.3,darkBase:.7,eyePaint:1,decorCount:2,decorArea:.18,decorEyes:1}).success,true);for(const m of [{hornRatio:.7},{hornHeight:12},{growthRatio:.31},{scratches:.89},{darkBase:.69},{decorCount:3},{decorArea:.181}])assert.equal(demonJudge(1,{...helmet,...m}).success,false,JSON.stringify(m));});
test('face warnings do not interrupt until thirty-five percent',()=>{assert.equal(DEMON_FACE_LIMIT,.35);for(const exposure of [.15,.20,.349])assert.equal(demonJudge(1,{...helmet,exposure}).sudden,false);assert.equal(demonJudge(1,{...helmet,exposure:.35}).sudden,true);});
test('every royal order is independently graded, with small dye spills still tolerated',()=>{assert.equal(demonJudge(2,royal).success,true);for(const change of [{leftEar:.89},{rightTip:0},{rightTip:1},{lengthOver:7},{eyes:.8},{black:.9499},{silverLine:false},{browLeft:.69},{browRight:.69},{lips:false},{eyelidLeft:false},{eyelidRight:false},{adornments:[true,false]}])assert.equal(demonJudge(2,{...royal,...change}).success,false,JSON.stringify(change));assert.equal(demonJudge(2,{...royal,black:.95,facePaintCore:40}).success,true);assert.equal(demonJudge(2,{...royal,black:.96}).success,true);assert.equal(demonFacePaintLimit(10),6);});
test('royal accessories require the horn pair and crown, allowing any additional stickers',()=>{
 const p=(name,x,y)=>({sticker:{resourceFile:name+'.png'},x,y}),left=p('T_hornBig_L',106,66),right=p('T_hornBig_R',230,66),tiara=p('T_tara',166,26),crown=p('T_blackCrown',166,26);
 for(const head of [tiara,crown]){
  assert.deepEqual(demonRoyalStickers([left,right,head]),[true,true]);
  for(const extra of [p('T_earring_L',110,180),p('T_Cross',233,180),p('T_Heart',160,200),left,right,tiara,crown,p('T_hornBig_R',110,180)]){
   assert.deepEqual(demonRoyalStickers([left,right,head,extra]),[true,true]);
  }
  for(const items of [[head],[left,head],[right,head],[left,left,head],[p('T_hornBig_R',106,66),p('T_hornBig_L',230,66),head]])assert(!demonRoyalStickers(items).every(Boolean),JSON.stringify(items));
 }
 assert.deepEqual(demonRoyalStickers([left,right]),[true,false]);
 for(const items of [[],[left],[right],[left,right,p('T_tara',166,220)]])assert(!demonRoyalStickers(items).every(Boolean),JSON.stringify(items));
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
test('silver bridge must stay within the central forelock, including every silver hair pixel',()=>{
 const hair=new Uint8Array(W*H);for(let y=15;y<80;y++)for(let x=40;x<110;x++)hair[y*W+x]=1;
 const paintLine=(x,y,w,h)=>{const p=new Uint8ClampedArray(W*H*4);for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)p.set([236,235,244,255],(yy*W+xx)*4);return p;};
 for(const [x,w] of [[85,1],[87,2],[88,3]])assert.equal(demonSilverStripe(hair,paintLine(x,56,w,12),W,H).valid,true);
 for(const [x,y,w,h] of [[50,56,1,12],[85,35,1,12],[85,65,1,12],[84,56,2,12],[91,56,2,12],[85,56,6,12]]){
  assert.equal(demonSilverStripe(hair,paintLine(x,y,w,h),W,H).valid,false,JSON.stringify({x,y,w,h}));
 }
 const extra=paintLine(87,56,2,12);extra.set([236,235,244,255],(60*W+50)*4);
 assert.equal(demonSilverStripe(hair,extra,W,H).valid,false,'one silver hair cell outside the forelock fails');
 hair[60*W+50]=0;
 assert.equal(demonSilverStripe(hair,extra,W,H).valid,true,'free face painting is not a hair bridge');
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
 ensureDemonDialogueCatalogue(p);const before=structuredClone(p);ensureDemonDialogueCatalogue(p);assert.deepEqual(p,before);assert.equal(line.Text,'수정한 미형 요청');
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
test('both published phases match their current requests and details',()=>{
 const g=project.guests.find(g=>g.id===10007),lines=project.combat.sheets.find(s=>s.name==='대사').rows;
 for(const phase of [1,2]){const guest=demonGuest(phase);
 for(const stage of ['cut','draw','attach'])for(const [key,list]of [['RequestGroupID',guest.demonRequest[stage]],['DetailGroupID',guest.demonRequestDetails[stage]]]){
  const actual=lines.filter(r=>r.GroupID===g.demonPhaseDialogue[phase][stage][key]).sort((a,b)=>a.Order-b.Order).map(r=>r.Text);
  assert.deepEqual(actual,list.map(v=>Array.isArray(v)?v[1]:v));
 }}
 assert.deepEqual(g.beauty.requestBriefNotes,demonGuest(1).beauty.requestBriefNotes);
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

test('demon authored dialogue retains valid effects in both configured beauty phases',async()=>{
 const {parseDialogueText}=await import('../src/text-effects.js');
 const g=project.guests.find(g=>g.id===10007),rows=project.combat.sheets.find(s=>s.name==='대사').rows;
 for(const phase of [1,2])for(const stage of ['cut','draw','attach'])for(const [key,field]of [['RequestGroupID','demonRequest'],['DetailGroupID','demonRequestDetails']]){
  const gid=g.demonPhaseDialogue[phase][stage][key],actual=rows.filter(l=>l.GroupID===gid).sort((a,b)=>a.Order-b.Order);
  assert(actual.length>0,'configured request group must contain authored lines');
  const restored=JSON.parse(JSON.stringify(project));ensureDemonDialogueCatalogue(restored);
  assert.deepEqual(restored.combat.sheets.find(s=>s.name==='대사').rows.filter(l=>l.GroupID===gid).sort((a,b)=>a.Order-b.Order),actual);
  for(const row of actual){const parsed=parseDialogueText(row.Text);assert.deepEqual(parsed.warnings,[]);assert(parsed.duration>0);assert(row.Text.includes('<'));}
 }
 for(const row of rows.filter(l=>l.GroupID===g.bindings.arrival))assert.deepEqual(parseDialogueText(row.Text).warnings,[]);
 for(const phase of [1,2])for(const line of Object.values(demonGuest(phase).resultLines))assert.deepEqual(parseDialogueText(line).warnings,[]);
});

test('phase-two success hands off exactly once after an authenticated room return',async()=>{
 const {default:vm}=await import('node:vm');
 const runtime=await fs.readFile(new URL('../src/demon-story.js',import.meta.url),'utf8');
 const frame={},nodes={salon:{contentWindow:frame,focus(){}},storyHint:{}},messages=[],events=[],listeners=[];
 let done,spoken,endingStarts=0;
 const ctx={DEMON_LINES,DEMON_GUEST_ID:10007,ensureDemonDialogueCatalogue,page:'story',playGroup:(project,g,gid,callback)=>{spoken=project.combat.sheets.find(s=>s.name==='대사').rows.filter(l=>l.GroupID===gid).map(l=>l.Text);done=callback;},story:{project:structuredClone(project),guest:{demon:true,demonPhase:2},portrait:'edited-portrait',headPortrait:'edited-head'},salonToken:'current-token',
  startBeautyEnding(){endingStarts++;ctx.story.demonEnding.status='playing';},el:id=>nodes[id],copy:structuredClone,updateStoryHud(){},sendSalon:(type,data)=>messages.push({type,data}),
  addEventListener:(type,fn)=>listeners.push(fn),window:{dispatchEvent:e=>events.push(e)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
 vm.createContext(ctx);vm.runInContext(runtime,ctx);
 ctx.finishDemonBeauty({success:true});
 assert.equal(spoken.length,2);assert(!spoken.join('').match(/사진|셀카/));assert.equal(ctx.story.demonEnding.status,'returning');
 assert.equal(events.length,0);done();assert.equal(messages.at(-1).type,'demon-finish');
 const ready={source:frame,data:{source:'yachacha-salon',type:'demon-room-ready',token:'current-token'}};
 listeners[0]({...ready,source:{}});listeners[0]({...ready,data:{...ready.data,token:'old-token'}});assert.equal(events.length,0);
 listeners[0](ready);listeners[0](ready);ctx.finishDemonBeauty({success:true});
 assert.equal(events.length,1);assert.equal(events[0].type,'yachacha-ending-ready');assert.equal(events[0].detail.form,'handsome');assert.equal(events[0].detail.portrait,'edited-portrait');assert.equal(ctx.story.outcome,'beauty');
 assert.equal(messages.filter(x=>x.type==='demon-finish').length,1);assert.equal(endingStarts,1);assert.equal(messages.at(-1).data.headPortrait,'edited-head');
});

test('connected growth fills the same brush footprint in either cell order without row wrapping',()=>{
 const w=11,h=9,current=new Uint8Array(w*h),restore=new Uint8Array(w*h);current[4*w+5]=1;
 const cells=[];for(let y=2;y<=6;y++)for(let x=3;x<=7;x++)cells.push(y*w+x);
 const forward=demonGrowthCells(current,restore,cells,w,h,()=>true),backward=demonGrowthCells(current,restore,[...cells].reverse(),w,h,()=>true);
 assert.deepEqual(forward,backward);assert.equal(forward.reduce((a,b)=>a+b,0),25);
 assert.equal(current.reduce((a,b)=>a+b,0),1,'selection must not mutate the source');
 const border=new Uint8Array(12);border[3]=1;
 assert.equal(demonGrowthCells(border,new Uint8Array(12),[4],4,3,()=>true)[4],0,'right edge does not wrap to next row');
 const isolated=demonGrowthCells(current,restore,[0,1],w,h,()=>true);assert.equal(isolated.reduce((a,b)=>a+b,0),0);
 restore[0]=1;assert.equal(demonGrowthCells(current,restore,[0,1],w,h,n=>n===0)[0],1,'source holes can be restored');
 assert.equal(demonGrowthCells(current,restore,[0,1],w,h,n=>n===0)[1],0,'restricted cells remain empty');
});

test('helmet growth extends blue horn and dark metal colours without copying scratches',()=>{
 const w=19,h=9,p=new Uint8ClampedArray(w*h*4);
 for(let y=1;y<8;y++)for(let x=1;x<18;x++){
  const edge=x===1||x===17||y===1||y===7;
  p.set(edge?[24,21,31,255]:x<9?[72,83,248,255]:[36,34,54,255],(y*w+x)*4);
 }
 p.set([140,140,155,255],(4*w+15)*4);
 const colors=demonGrowthPalette(p,w,h,true);
 assert.deepEqual([...colors.slice((4*w)*4,(4*w)*4+3)],[72,83,248]);
 assert.deepEqual([...colors.slice((4*w+18)*4,(4*w+18)*4+3)],[36,34,54]);
 for(let n=0;n<w*h;n++)assert.notDeepEqual([...colors.slice(n*4,n*4+3)],[140,140,155]);
});

test('outside scene binding is editable and older projects acquire it only once',()=>{
 const p=structuredClone(project),g=p.guests.find(g=>g.id===10007),rows=n=>p.combat.sheets.find(s=>s.name===n).rows;
 const group=rows('대화 그룹').find(r=>r.GroupID===g.bindings.exterior);assert.equal(group.Name,'마왕 · 미용실 외부 등장 씬');
 const exterior=rows('대사').find(r=>r.GroupID===group.GroupID);assert.equal(exterior.Speaker,'마왕 부하');assert.match(exterior.Text,/^마왕님,/);
 exterior.Text='직접 수정한 외관 대사';ensureDemonDialogueCatalogue(p);const before=structuredClone(p);ensureDemonDialogueCatalogue(p);assert.deepEqual(p,before);
 const legacy=structuredClone(project),lg=legacy.guests.find(g=>g.id===10007);delete lg.bindings.exterior;ensureDemonDialogueCatalogue(legacy);
 const once=structuredClone(legacy);ensureDemonDialogueCatalogue(legacy);assert.deepEqual(legacy,once);assert(lg.bindings.exterior);
});

test('demon dialogue emphasis uses only the agreed dark palette and valid tags',async()=>{
 const {parseDialogueText}=await import('../src/text-effects.js');
 const allowed=new Set(['#653D7C','#285780','#24634D','#A13636','#242236','#43536B']);
 const strings=[];const walk=v=>{if(typeof v==='string')strings.push(v);else if(v&&typeof v==='object')Object.values(v).forEach(walk);};
 walk(DEMON_LINES);for(const phase of [1,2]){const g=demonGuest(phase);walk(g.demonRequest);walk(g.demonRequestDetails);}
 let colors=0;for(const text of strings){assert.deepEqual(parseDialogueText(text).warnings,[]);for(const m of text.matchAll(/<color=([^>]+)>/g)){assert(allowed.has(m[1]),m[1]);colors++;}}
 assert(colors>40);assert.equal(DEMON_LINES.arrival.length,8);assert.equal(DEMON_LINES.phase1Success.length,3);assert.equal(demonGuest(2).demonRequest.cut.length,15);
 assert(!JSON.stringify(DEMON_LINES).includes('투구 뒤에 숨'));
});

test('helmet extension does not stretch highlight bands or opaque scratch pixels into slabs',()=>{
 const w=25,h=21,p=new Uint8ClampedArray(w*h*4);
 for(let y=2;y<19;y++)for(let x=3;x<22;x++){
  const edge=x===3||x===21||y===2||y===18,blue=y<9&&x<11;
  p.set(edge?[0,0,0,255]:blue?[72,83,248,255]:[36,34,54,255],(y*w+x)*4);
 }
 for(let y=10;y<17;y++)p.set([65,62,91,255],(y*w+20)*4);
 p.set([51,55,57,255],(17*w+20)*4);
 p.set([150,155,162,255],(15*w+20)*4);
 const before=p.slice(),colors=demonGrowthPalette(p,w,h,true),used=new Set();
 for(let n=0;n<w*h;n++){assert.equal(colors[n*4+3],255);used.add([...colors.slice(n*4,n*4+3)].join(','));}
 assert.deepEqual([...used].sort(),['36,34,54','72,83,248']);
 assert.deepEqual(p,before,'authored source and scratches remain intact');
});

test('workshop phase settings survive switches and JSON without changing the story starting phase',()=>{
 const p=structuredClone(project),source=p.guests.find(g=>g.id===10007),original=structuredClone(source.beauty);
 const second=demonWorkshopGuest(source,2);second.beauty.growth.color='#d8d0e0';second.beauty.requestNotes.draw='2페이즈 작업 메모';
 assert.equal(source.demonPhase,1);assert.deepEqual(source.beauty,original);
 assert.equal(demonWorkshopGuest(source,1),source);
 assert.equal(demonWorkshopGuest(source,2).beauty.growth.color,'#d8d0e0');
 const restored=JSON.parse(JSON.stringify(p)),saved=restored.guests.find(g=>g.id===10007);
 assert.equal(demonWorkshopGuest(saved,2).beauty.requestNotes.draw,'2페이즈 작업 메모');
 const played=installDemonDialogue(restored,demonGuest(2));
 assert.equal(played.beauty.growth.color,'#d8d0e0');
 for(const stage of ['cut','draw','attach']){
  const link=restored.combat.sheets.find(s=>s.name==='미용 대사 연결').rows.find(r=>r.MonsterID===10007&&r.Stage===stage);
  assert.equal(link.RequestGroupID,saved.demonPhaseDialogue[2][stage].RequestGroupID);
 }
 assert.deepEqual(projectProblems(p),[]);
 source.demonPhaseBeauty[2].growth.color='invalid';
 assert(projectProblems(p).some(m=>m.includes('마왕 2페이즈 발모제 색상')));
});

test('demon result dialogue is editable per phase and preserved through migration and save/load',()=>{
 const p=structuredClone(project);ensureDemonDialogueCatalogue(p);
 const g=p.guests.find(g=>g.id===10007),lines=p.combat.sheets.find(s=>s.name==='대사').rows;
 for(const phase of [1,2]){
  const links=g.demonResultDialogue[phase];
  for(const [event,expected]of [['normal',phase===1?DEMON_LINES.phase1Success:DEMON_LINES.success],['fail',DEMON_LINES.failure],...(phase===1?[['sudden',DEMON_LINES.sudden]]:[])]){
   const group=lines.filter(l=>l.GroupID===links[event]).sort((a,b)=>a.Order-b.Order);
   const configuredID=project.guests.find(g=>g.id===10007).demonResultDialogue?.[phase]?.[event];
   const configured=project.combat.sheets.find(s=>s.name==='대사').rows.filter(l=>l.GroupID===configuredID).sort((a,b)=>a.Order-b.Order);
   assert.deepEqual(group.map(l=>l.Text),configured.length?configured.map(l=>l.Text):expected.map(l=>Array.isArray(l)?l[1]:l));
   group[0].Text='편집한 '+phase+' '+event;
  }
 }
 assert.notEqual(g.demonResultDialogue[1].normal,g.demonResultDialogue[2].normal);
 const saved=JSON.parse(JSON.stringify(p));ensureDemonDialogueCatalogue(saved);assert.deepEqual(saved,p);
 assert.deepEqual(projectProblems(saved),[]);
});

test('star gate and beauty reaction lines live in editable workbook groups without replacing author edits',()=>{
 const p=structuredClone(project);ensureDemonDialogueCatalogue(p);
 const g=p.guests.find(g=>g.id===10007),lines=p.combat.sheets.find(s=>s.name==='대사').rows;
 for(const [key,,texts]of DEMON_EVENT_DIALOGUES){
  const group=lines.filter(l=>l.GroupID===g.bindings[key]).sort((a,b)=>a.Order-b.Order);
  assert.deepEqual(group.map(l=>l.Text),texts);group[0].Text='수정한 '+key+'<wait=0.2><color=#285780>강조</color>';
 }
 const saved=JSON.parse(JSON.stringify(p));ensureDemonDialogueCatalogue(saved);assert.deepEqual(saved,p);
 assert.deepEqual(projectProblems(saved),[]);
 for(const phase of [1,2])assert.deepEqual(installDemonDialogue(saved,demonGuest(phase)).bindings,g.bindings);
});
