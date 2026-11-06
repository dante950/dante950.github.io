// Guest-specific rules, using the existing salon canvas and tools.
const demonPhase=Number(GUEST.demonPhase)||0;
const demonStones=new Uint8ClampedArray(W*H*4),demonTarget=new Uint8ClampedArray(W*H*4);
let demonMasks=null,demonWarningCount=0,demonLastProtest=-Infinity,demonSudden=false,demonMemoAll=demonPhase===2;
function prepareDemonBeauty(){
 const readLayer=asset=>{const c=offscreen(),x=c.getContext('2d');x.imageSmoothingEnabled=false;drawPortraitLayer(x,asset);return x.getImageData(0,0,W,H).data;};
 const base=readLayer(portraitLayers.head),ears=readLayer(portraitLayers.ears);demonTarget.set(readLayer(portraitLayers.target));
 demonMasks=Object.fromEntries(['horn','scratch','face','earL','earR','tip','tipKeep','eyeOpening','roof','roofZone','forelock','silver','brow','browRight','eyes','sideL','sideR','overL','overR'].map(k=>[k,new Uint8Array(W*H)]));
 const D=DEMON_DESIGN,segmentDistance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);};
 for(let n=0;n<W*H;n++){
  const i=n*4,x=(n%W+.5)*PIX,y=(Math.floor(n/W)+.5)*PIX,r=sourcePixels[i],g=sourcePixels[i+1],b=sourcePixels[i+2],originalHere=!!original[n];masks.protectedFace[n]=0;
  demonMasks.face[n]=Number(base[i+3]>100&&(demonPhase!==1||y>=168&&y<258&&x>85&&x<232));
  if(demonPhase===1){
   demonMasks.horn[n]=Number(x>185&&y<117&&demonTarget[i+3]>100&&demonTarget[i+2]>110&&demonTarget[i]<125);
   demonMasks.scratch[n]=Number(originalHere&&r>85&&r<205&&g>85&&b-r<55&&Math.abs(r-g)<40);
   demonMasks.eyeOpening[n]=Number(x>110&&x<210&&y>160&&y<250&&((b>100&&b>r*1.35)||(!originalHere&&base[i+3]>100)));
   continue;
  }
  const isEar=ears[i+3]>100,isRight=isEar&&x>160,isTip=isRight&&x>=242&&y<=164;
  demonMasks.earL[n]=Number(isEar&&!isRight);demonMasks.earR[n]=Number(isRight&&!isTip);demonMasks.tip[n]=Number(isTip);demonMasks.tipKeep[n]=Number(isTip&&x>=252);
  demonMasks.roofZone[n]=Number(demonInside(x,y,D.roofBox));demonMasks.roof[n]=Number(demonPolygon(x,y,D.roof));
  demonMasks.forelock[n]=Number(originalHere&&demonInside(x,y,D.forelock));demonMasks.silver[n]=Number(originalHere&&demonInside(x,y,D.silver));
  demonMasks.brow[n]=Number(base[i+3]>100&&segmentDistance(x,y,...D.browLeft)<=2.1);demonMasks.browRight[n]=Number(base[i+3]>100&&demonInside(x,y,D.browRight));
  demonMasks.eyes[n]=Number(D.eyes.some(box=>demonInside(x,y,box))||segmentDistance(x,y,...D.browLeft)<=4);
  for(const [suffix,region]of [['L',D.leftSide],['R',D.rightSide]])if(demonInside(x,y,region)){demonMasks['side'+suffix][n]=Number(originalHere&&!isEar&&y>=region.end-12&&y<=region.end);demonMasks['over'+suffix][n]=Number(y>region.end+6);}
 }
 demonMasks.hornAllowance=demonHornAllowance(demonMasks.horn,W,H,4);demonMasks.roofAllowance=demonHornAllowance(demonMasks.roof,W,H,2);demonMasks.silverAllowance=demonHornAllowance(demonMasks.silver,W,H,2);demonMasks.browAllowance=demonHornAllowance(demonMasks.brow,W,H,2);
}
function demonDecorationMetrics(){
 const c=offscreen(),x=c.getContext('2d');x.imageSmoothingEnabled=false;
 for(const p of placements){const im=stickerImages.get(p.sticker.id);if(im?.complete&&im.naturalWidth)x.drawImage(im,p.x/2-p.sticker.w*.375,p.y/2-p.sticker.h*.375,p.sticker.w*.75,p.sticker.h*.75);}
 const data=x.getImageData(0,0,W,H).data;let area=0,covered=0,total=0,body=0;
 for(let n=0;n<W*H;n++){if(original[n])body++;if(data[n*4+3]>100)area++;if(demonMasks.eyeOpening[n]){total++;if(data[n*4+3]>100)covered++;}}
 return {decorCount:placements.length,decorArea:area/Math.max(1,body),decorEyes:covered/Math.max(1,total)};
}
function demonBeautyStatus(){
 if(!demonMasks)return {success:false,checks:[false,false,false],requirements:{cut:[],draw:[],attach:[]},metrics:{}};
 const count=mask=>{let total=0,kept=0;for(let n=0;n<W*H;n++)if(mask[n]){total++;if(current[n])kept++;}return {total,kept,ratio:total?kept/total:1};};
 const metrics={};let body=0,loss=0,face=0,exposed=0,extra=0,scratch=0,st=0,dark=0,baseTotal=0,ep=0,et=0,hair=0,black=0,silver=0,silverTotal=0,silverSpill=0,brow=0,browTotal=0,rb=0,rbt=0,facePaint=0,facePaintCore=0,visibleFace=0;
 const fringe=demonPhase===2?demonHornAllowance(current,W,H):null,isBlack=i=>paint[i+3]>=242&&paint[i]<=40&&paint[i+1]<=40&&paint[i+2]<=55,isSilver=i=>paint[i+3]>=242&&Math.min(paint[i],paint[i+1],paint[i+2])>=195&&Math.max(paint[i],paint[i+1],paint[i+2])-Math.min(paint[i],paint[i+1],paint[i+2])<=35;
 for(let n=0;n<W*H;n++){
  const i=n*4,exists=!!current[n],p=paint[i+3]>0,x=(n%W+.5)*PIX,y=(Math.floor(n/W)+.5)*PIX;
  if(demonMasks.face[n]&&original[n]){face++;if(!exists)exposed++;}
  if(demonPhase===1){
   if(original[n]&&!demonMasks.horn[n]){body++;if(!exists)loss++;}
   if(exists&&!original[n]&&!demonTarget[i+3])extra++;
   if(demonMasks.scratch[n]){st++;if(exists&&paint[i+3]>=230)scratch++;}
   if(original[n]&&!demonMasks.eyeOpening[n]&&y>=110){baseTotal++;const color=p?paint.subarray(i,i+3):sourcePixels.subarray(i,i+3);if(.2126*color[0]+.7152*color[1]+.0722*color[2]<110)dark++;}
   if(demonMasks.eyeOpening[n]){et++;if(p)ep++;}
  }else{
   if(exists&&!demonMasks.silverAllowance[n]){hair++;if(isBlack(i))black++;}
   if(demonMasks.silver[n]){silverTotal++;if(exists&&isSilver(i))silver++;}
   if(exists&&!demonMasks.silverAllowance[n]&&isSilver(i))silverSpill++;
   if(demonMasks.brow[n]){browTotal++;if(!exists&&isBlack(i))brow++;}
   if(demonMasks.browRight[n]&&!exists&&!fringe[n]){rbt++;if(p)rb++;}
   if(demonMasks.face[n]&&!exists){visibleFace++;if(p){facePaint++;if(!fringe[n]&&!demonMasks.browAllowance[n])facePaintCore++;}}
  }
 }
 if(demonPhase===1){
  const horn=right=>{let area=0,x0=320,x1=0,y0=350,y1=0;for(let n=0;n<W*H;n++){const x=(n%W+.5)*PIX,y=(Math.floor(n/W)+.5)*PIX;if(current[n]&&y>=8&&y<110&&(right?x>=212&&x<280:x>40&&x<=108)){area++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}return {area,w:x1-x0,h:y1-y0};},left=horn(false),right=horn(true);
  Object.assign(metrics,{hornRatio:right.area/Math.max(1,left.area),hornHeight:Math.abs(right.h-left.h),hornWidth:Math.abs(right.w-left.w),bodyLoss:loss/Math.max(1,body),exposure:exposed/Math.max(1,face),growthRatio:extra/Math.max(1,body),scratches:scratch/Math.max(1,st),darkBase:dark/Math.max(1,baseTotal),eyePaint:ep/Math.max(1,et)},demonDecorationMetrics());
 }else{
  const coverage=k=>count(demonMasks[k]).ratio;let roofExtra=0;for(let n=0;n<W*H;n++)if(demonMasks.roofZone[n]&&!demonMasks.roofAllowance[n]&&current[n])roofExtra++;
  Object.assign(metrics,{leftEar:1-coverage('earL'),rightEar:1-coverage('earR'),rightTip:coverage('tip'),leftSide:coverage('sideL'),rightSide:coverage('sideR'),leftOver:count(demonMasks.overL).kept/Math.max(1,count(demonMasks.sideL).total),rightOver:count(demonMasks.overR).kept/Math.max(1,count(demonMasks.sideR).total),roof:coverage('roof'),roofOver:roofExtra/Math.max(1,count(demonMasks.roof).total),eyes:1-coverage('eyes'),forelock:coverage('forelock'),black:black/Math.max(1,hair),silver:silver/Math.max(1,silverTotal),silverTotal,silverSpill,brow:brow/Math.max(1,browTotal),rightBrowPaint:rb/Math.max(1,rbt),facePaint,facePaintCore,visibleFace,adornments:demonRoyalStickers(placements),exposure:0});
 }
 return {...demonJudge(demonPhase,metrics),phase:demonPhase,metrics};
}
function demonProtest(kind){if(performance.now()-demonLastProtest<5500)return;demonLastProtest=performance.now();showBeautyReaction(DEMON_LINES[kind],'angry');}
function applyDemonStroke(cells,kind){
 let changed=false,faceHit=false;
 for(const n of cells){const i=n*4,x=(n%W+.5)*PIX,y=(Math.floor(n/W)+.5)*PIX,prev=current[n];
  if(kind==='hammer'&&demonPhase===1||kind==='scissors'&&demonPhase===2){if(current[n]){if(demonMasks.face[n])faceHit=true;current[n]=0;paint.fill(0,i,i+4);changed=true;}}
  else if(kind==='grow'){
   if(!demonInside(x,y,B.growth.region))continue;
   if(demonPhase===1){if(demonMasks.eyeOpening[n]&&!original[n])continue;if(demonTarget[i+3]){current[n]=1;sourcePixels.set(demonTarget.subarray(i,i+4),i);}else if((y<165||(x<110||x>210)&&y<250)&&(current[n]||[n-1,n+1,n-W,n+W].some(q=>q>=0&&q<current.length&&current[q])))current[n]=2;}
   else if(original[n])current[n]=1;else if(current[n]||[n-1,n+1,n-W,n+W].some(q=>q>=0&&q<current.length&&current[q]))current[n]=2;
   if(prev!==current[n]){paint.fill(0,i,i+4);changed=true;}
  }else if(kind==='erase'){if(paint[i+3]){paint.fill(0,i,i+4);changed=true;}}
  else if(kind==='paint'&&(current[n]||masks.face[n])){const value=blendBeautyRGBA(gesture.paint.subarray(i,i+4),rgb(paintColor),paintOpacity);if(value.some((v,k)=>v!==paint[i+k]))changed=true;paint.set(value,i);if(demonMasks.face[n]&&!current[n])faceHit=true;}
 }
 if(!changed)return;touched[beautyPhase]=true;
 if(demonPhase===1&&kind==='hammer'&&faceHit&&demonWarningCount<2&&!gesture?.demonWarned){if(gesture)gesture.demonWarned=true;showBeautyReaction(demonWarningCount++?DEMON_LINES.warningAgain:DEMON_LINES.warning,'angry');}
 if(kind==='paint'){const m=demonBeautyStatus().metrics;if(demonPhase===1&&m.eyePaint>.1)demonProtest('helmetEye');if(demonPhase===2){if(faceHit&&m.facePaintCore>demonFacePaintLimit(m.visibleFace))demonProtest('face');else{const c=rgb(paintColor);if(!((c[0]<=40&&c[1]<=40&&c[2]<=55)||(Math.min(...c)>=195&&Math.max(...c)-Math.min(...c)<=35)))demonProtest('color');}}}
}
function demonStickerReaction(){const r=demonBeautyStatus();if(demonPhase===1&&!r.checks[2])demonProtest('helmetSticker');if(demonPhase===2&&!r.requirements.attach[2])demonProtest('sticker');}
function updateDemonScore(action){
 const result=demonBeautyStatus(),stage=result.requirements[beautyPhase]||result.checks;
 cutScore=result.checks[0]?B.weights.cut:0;drawScore=result.checks[1]?B.weights.draw:0;attachScore=result.checks[2]?B.weights.attach:0;
 totalSatisfaction=result.success?100:Math.min(39,cutScore+drawScore+attachScore);liveSatisfaction=100*stage.filter(Boolean).length/Math.max(1,stage.length);shapeProgress={score:cutScore,hardFailure:!result.success,details:[],demon:result};
 if(action&&!finishing){expression=stage.every(Boolean)?'satisfied':'angry';beautyCustomer.dataset.expression=expression;}renderRequestStatus();
 if(result.sudden&&!demonSudden&&!finishing){demonSudden=true;setTimeout(()=>{if(finishing)return;const g=gesture;gesture=null;if(g&&portrait.hasPointerCapture(g.pointerId))portrait.releasePointerCapture(g.pointerId);finishing=true;beautyPhase='result';panel.inert=true;nav.inert=true;actions.inert=true;next.disabled=true;clearReturningReactions();renderPortrait(false);send('demon-sudden',{details:result,portrait:captureBeautyCustomer(),headPortrait:captureBeautyHead()});},0);}
}
function drawDemonStones(){}
function drawDemonGuides(target){
 if(!demonMasks)return;target.save();
 for(let n=0;n<W*H;n++){let color=null;
  if(demonPhase===1){if(beautyPhase==='cut')color=demonMasks.face[n]?'#E9484855':demonMasks.horn[n]?'#FFD87366':null;if(beautyPhase==='draw')color=demonMasks.eyeOpening[n]?'#E9484877':demonMasks.scratch[n]?'#5DCD8588':null;}
  else if(beautyPhase==='cut'){
   const remove=demonMasks.earL[n]||demonMasks.earR[n]||demonMasks.eyes[n]||demonMasks.overL[n]||demonMasks.overR[n]||demonMasks.roofZone[n]&&!demonMasks.roofAllowance[n]||demonMasks.tip[n]&&!demonMasks.tipKeep[n];
   const keep=demonMasks.roof[n]||demonMasks.forelock[n]||demonMasks.sideL[n]||demonMasks.sideR[n]||demonMasks.tipKeep[n];
   color=remove&&current[n]?'#5DCD8588':keep?'#FFD87366':null;
  }else if(beautyPhase==='draw')color=demonMasks.silver[n]?'#CFE8FFFF':demonMasks.brow[n]?'#FFD873DD':current[n]?'#5DCD8544':demonMasks.face[n]&&!demonMasks.browAllowance[n]?'#E9484833':null;
  if(color){target.fillStyle=color;target.fillRect(n%W,Math.floor(n/W),1,1);}
 }
 if(beautyPhase==='attach'){target.lineWidth=1;target.strokeStyle='#D7A331';target.setLineDash([3,2]);const boxes=demonPhase===2?[DEMON_DESIGN.crown,DEMON_DESIGN.earLeft,DEMON_DESIGN.earRight]:[{x:74,y:112,w:172,h:42}];for(const box of boxes)target.strokeRect(box.x/2,box.y/2,box.w/2,box.h/2);}
 target.restore();
}
if(isDemon){
 beautyScreen.classList.add('demonBeauty');status.classList.add('demonMemo');
 const toggle=document.createElement('button');toggle.id='demonAllOrders';toggle.textContent='전체 주문 보기';toggle.hidden=demonPhase!==2;toggle.onclick=()=>{demonMemoAll=!demonMemoAll;renderRequestStatus();};status.insertBefore(toggle,status.querySelector('.requestText'));
 const help=document.createElement('small');help.className='demonGuideLegend';help.textContent='좌우는 화면 기준 · 가이드: 초록 덜기 / 금빛 남기기·채우기';status.append(help);
}
