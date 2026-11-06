// Guest-specific material and judgement; all controls and layout are the shared salon.
const demonPhase=Number(GUEST.demonPhase)||0;
const demonStones=new Uint8ClampedArray(W*H*4),demonTarget=new Uint8ClampedArray(W*H*4);
let demonMasks=null,demonWarningCount=0,demonLastProtest=-Infinity,demonSudden=false;
function prepareDemonBeauty(){
 const readLayer=asset=>{const c=offscreen(),x=c.getContext('2d');x.imageSmoothingEnabled=false;drawPortraitLayer(x,asset);return x.getImageData(0,0,W,H).data;};
 const target=readLayer(portraitLayers.target),base=readLayer(portraitLayers.head),ears=readLayer(portraitLayers.ears);
 demonTarget.set(target);if(portraitLayers.stones)demonStones.set(readLayer(portraitLayers.stones));
 demonMasks={horn:new Uint8Array(W*H),scratch:new Uint8Array(W*H),face:new Uint8Array(W*H),trim:new Uint8Array(W*H)};
 for(let n=0;n<W*H;n++){
  const i=n*4,x=(n%W+.5)*PIX,y=(Math.floor(n/W)+.5)*PIX,r=sourcePixels[i],g=sourcePixels[i+1],b=sourcePixels[i+2];
  masks.protectedFace[n]=0;
  demonMasks.horn[n]=Number(demonPhase===1&&x>185&&y<117&&target[i+3]>100&&target[i+2]>110&&target[i]<125);
  demonMasks.scratch[n]=Number(demonPhase===1&&original[n]&&r>85&&r<205&&g>85&&b-r<55&&Math.abs(r-g)<40);
  demonMasks.face[n]=Number(base[i+3]>100&&(demonPhase!==1||y>=168&&y<258&&x>85&&x<232));
  demonMasks.trim[n]=Number(demonPhase===2&&original[n]&&(y>224||ears[i+3]>100));
 }
 demonMasks.hornAllowance=demonHornAllowance(demonMasks.horn,W,H);
}
function demonBeautyStatus(){
 let horn=0,ht=0,extra=0,scratch=0,st=0,body=0,loss=0,face=0,exposed=0,trim=0,tt=0,keep=0,kt=0,hair=0,black=0,facePaint=0;
 if(!demonMasks)return {success:false,checks:[false,false,false],metrics:{}};
 for(let n=0;n<W*H;n++){
  const i=n*4,exists=!!current[n],orig=!!original[n],p=paint[i+3]>0;
  if(demonMasks.horn[n]){ht++;if(exists)horn++;}
  if(demonPhase===1&&exists&&!demonTarget[i+3]&&!demonMasks.hornAllowance[n])extra++;
  if(demonMasks.scratch[n]){st++;if(exists&&p&&paint[i+3]>=245&&paint[i]<65&&paint[i+1]<65&&paint[i+2]<90)scratch++;}
  if(demonPhase===1&&orig&&!demonMasks.horn[n]){body++;if(!exists)loss++;}
  if(demonMasks.face[n]&&orig){face++;if(!exists)exposed++;}
  if(demonMasks.trim[n]){tt++;if(!exists)trim++;}else if(orig){kt++;if(exists)keep++;}
  if(exists){hair++;if(p&&paint[i+3]>=250&&paint[i]<=35&&paint[i+1]<=35&&paint[i+2]<=45)black++;}
  if(demonMasks.face[n]&&!exists&&p)facePaint++;
 }
 const metrics={horn:ht?horn/ht:1,excess:extra/Math.max(1,ht),scratches:st?scratch/st:1,bodyLoss:loss/Math.max(1,body),exposure:exposed/Math.max(1,face),trim:tt?trim/tt:1,keep:keep/Math.max(1,kt),black:hair?black/hair:0,facePaint,stickers:placements.length};
 return {...demonJudge(demonPhase,metrics),phase:demonPhase,metrics};
}
function demonProtest(kind){
 if(demonPhase!==2||performance.now()-demonLastProtest<5500)return;
 demonLastProtest=performance.now();showBeautyReaction(DEMON_LINES[kind],'angry');
}
function applyDemonStroke(cells,kind){
 let changed=false,faceHit=false;
 for(const n of cells){
  const i=n*4,x=(n%W+.5)*PIX,y=(Math.floor(n/W)+.5)*PIX,prev=current[n];
  if(kind==='hammer'){
   if(demonPhase===3){if(demonStones[i+3]){demonStones[i+3]=0;paint.fill(0,i,i+4);changed=true;}}
   else if(demonPhase===1&&current[n]){if(demonMasks.face[n])faceHit=true;current[n]=0;paint.fill(0,i,i+4);changed=true;}
  }else if(kind==='scissors'&&demonPhase!==1){if(current[n]){current[n]=0;paint.fill(0,i,i+4);changed=true;}}
  else if(kind==='grow'){
   if(demonPhase===1){if(x<185||x>291||y>=117)continue;if(demonTarget[i+3]){current[n]=1;sourcePixels.set(demonTarget.subarray(i,i+4),i);}else current[n]=2;}
   else{if(!original[n]&&!current[n-1]&&!current[n+1]&&!current[n-W]&&!current[n+W])continue;current[n]=original[n]?1:2;}
   if(prev!==current[n]){paint.fill(0,i,i+4);changed=true;}
  }else if(kind==='erase'){if(paint[i+3]){paint.fill(0,i,i+4);changed=true;}}
  else if(kind==='paint'&&(current[n]||masks.face[n]||demonStones[i+3])){
   const value=blendBeautyRGBA(gesture.paint.subarray(i,i+4),rgb(paintColor),paintOpacity);if(value.some((v,k)=>v!==paint[i+k]))changed=true;paint.set(value,i);if(demonMasks.face[n]&&!current[n])faceHit=true;
  }
 }
 if(!changed)return;
 touched[beautyPhase]=true;
 if(demonPhase===1&&kind==='hammer'&&faceHit&&demonWarningCount<2&&!gesture?.demonWarned){if(gesture)gesture.demonWarned=true;showBeautyReaction(demonWarningCount++?DEMON_LINES.warningAgain:DEMON_LINES.warning,'angry');}
 if(demonPhase===2&&kind==='paint'){if(faceHit)demonProtest('face');else{const c=rgb(paintColor);if(c[0]>35||c[1]>35||c[2]>45)demonProtest('color');}}
}
function updateDemonScore(action){
 const result=demonBeautyStatus(),m=result.metrics;
 cutScore=result.checks[0]?B.weights.cut:0;drawScore=result.checks[1]?B.weights.draw:0;attachScore=result.checks[2]?B.weights.attach:0;
 totalSatisfaction=result.success?100:Math.min(39,cutScore+drawScore+attachScore);
 liveSatisfaction=result.success?100:0;shapeProgress={score:cutScore,hardFailure:!result.success,details:[],demon:result};
 if(action&&demonPhase!==3&&!finishing){expression=result.success?'satisfied':'angry';beautyCustomer.dataset.expression=expression;}
 if(action&&demonPhase===3){expression='satisfied';beautyCustomer.dataset.expression='satisfied';}
 renderRequestStatus();
 if(result.sudden&&!demonSudden&&!finishing){demonSudden=true;setTimeout(()=>{if(finishing)return;const g=gesture;gesture=null;if(g&&portrait.hasPointerCapture(g.pointerId))portrait.releasePointerCapture(g.pointerId);finishing=true;beautyPhase='result';panel.inert=true;nav.inert=true;actions.inert=true;next.disabled=true;clearReturningReactions();renderPortrait(false);send('demon-sudden',{details:result,portrait:captureBeautyCustomer(),headPortrait:captureBeautyHead()});},0);}
}
function drawDemonStones(target){
 if(demonPhase!==3)return;
 const c=offscreen(),x=c.getContext('2d'),data=x.createImageData(W,H);data.data.set(demonStones);
 for(let n=0;n<W*H;n++){const i=n*4;if(data.data[i+3]&&paint[i+3])data.data.set(blendBeautyRGBA(data.data.subarray(i,i+4),paint.subarray(i,i+3),paint[i+3]/255),i);}
 x.putImageData(data,0,0);target.drawImage(c,0,0);
}
function drawDemonGuides(target){
 if(!demonMasks)return;
 target.save();
 for(let n=0;n<W*H;n++){
  const i=n*4;let color=null;
  if(demonPhase===1){if(beautyPhase==='cut')color=demonMasks.face[n]?'#F0505055':current[n]&&!demonTarget[i+3]&&!demonMasks.hornAllowance[n]?'#F0505088':demonMasks.horn[n]?'#5DCD8566':null;else if(beautyPhase==='draw'&&demonMasks.scratch[n])color='#5DCD8588';}
  if(demonPhase===2){if(beautyPhase==='cut'&&demonMasks.trim[n])color='#5DCD8577';if(beautyPhase==='draw')color=current[n]?'#5DCD8555':demonMasks.face[n]?'#F0505055':null;}
  if(demonPhase===3&&beautyPhase==='cut')color=demonStones[i+3]?'#FFD87388':null;
  if(color){target.fillStyle=color;target.fillRect(n%W,Math.floor(n/W),1,1);}
 }
 target.restore();
}
