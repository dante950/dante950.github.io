// Beauty only. The room, guest order, and combat bridge live in salon.html.
const B=GUEST.beauty,W=160,H=175,PIX=2;
const bone=B.cutTool==='hammer';
let beautyActive=false,beautyResultActive=false,beautyPhase='cut',totalSatisfaction=0;
let cutScore=0,attachScore=0,drawScore=0,placements=[],selectedSticker=null;
let ready=false,finishing=false,gesture=null,activeTool=bone?'hammer':'scissors';
let brushRadius=10,paintColor='#75452D',expression='neutral',talking=false,mouthFrame=false;
let touched={cut:false,draw:false,attach:false},zonesVisible=false,history={draw:[],attach:[]},briefing=false,requestSerial=0;
const current=new Uint8Array(W*H),original=new Uint8Array(W*H),paint=new Uint8ClampedArray(W*H*4);
const sourcePixels=new Uint8ClampedArray(W*H*4),originalBorder=new Uint8Array(W*H);
const masks={eyes:new Uint8Array(W*H),brain:new Uint8Array(W*H)};
const faceImage=new Image(),hairImage=new Image(),capeImage=new Image();
faceImage.src=GUEST.skin.head;hairImage.src=GUEST.skin.hair;
capeImage.src=beautyCustomer.querySelector('.cape').src;
const offscreen=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
const portrait=offscreen(),materialCanvas=offscreen(),faceCanvas=offscreen();
portrait.className='sculptCanvas';portrait.setAttribute('aria-label',GUEST.name+' 미용 작업 영역');
portrait.setAttribute('role','img');portrait.style.cssText='position:absolute;inset:0;width:320px;height:350px;touch-action:none;image-rendering:pixelated;z-index:12';
beautyCustomer.replaceChildren(portrait);
const ctx=portrait.getContext('2d');ctx.imageSmoothingEnabled=false;
const panel=document.querySelector('.beautyPanel');
panel.innerHTML='<div class="sculptTools"><h3>형태 만들기</h3><div id="shapeTools"></div><label class="brushLabel">도구 크기 <select id="sculptSize"><option value="5">작게</option><option value="10" selected>보통</option><option value="18">넓게</option></select></label><div id="paintTools" hidden></div><div id="decorationTools" hidden></div></div>';
document.querySelector('.beautyMood').remove();
const status=document.createElement('section');status.className='sculptStatus'+(bone?' bone':'');
status.innerHTML='<span class="requestCaption">손님의 부탁</span><p class="requestText"></p><button id="repeatBeautyRequest" aria-label="손님의 부탁 다시 듣기">다시 듣기 ↻</button>';status.hidden=true;
beautyScreen.append(status);
const nav=document.createElement('div');nav.className='sculptNav';beautyScreen.append(nav);
const actions=document.createElement('div');actions.className='sculptActions';
actions.innerHTML='<button id="undoBeauty" disabled>되돌리기</button>';if(GUEST.mode==='preview')actions.insertAdjacentHTML('beforeend','<button id="showBeautyZones" class="devGuide" aria-pressed="false">판정 영역</button>');
beautyScreen.append(actions);
const hint=document.createElement('div');hint.className='sculptHint';panel.querySelector('.sculptTools').append(hint);
const next=document.querySelector('.beautyNext'),finish=document.querySelector('.beautyFinish'),stageTag=document.querySelector('.beautyStageTag');
finish.style.display='none';next.disabled=true;
next.addEventListener('click',()=>{const stages=beautyStageOrder(B),n=stages.indexOf(beautyPhase);if(n===stages.length-1)startBeautyResult();else setBeautyPhase(stages[n+1]);});
finish.addEventListener('click',startBeautyResult);
const shapeTools=document.getElementById('shapeTools');
for(const [key,name] of [[bone?'hammer':'scissors',bone?'망치·정':'가위'],['grow',bone?'발모제 · 뼈 잇기':'발모제 · 머리 늘리기']]){
 if(key==='grow'&&B.growth?.enabled===false)continue;
 const button=document.createElement('button');button.className='sculptTool';button.dataset.tool=key;button.textContent=name;
 button.onclick=()=>{cancelGesture();activeTool=key;refreshTools();};shapeTools.append(button);
}
document.getElementById('sculptSize').onchange=e=>{cancelGesture();brushRadius=+e.target.value;};
const colors=['#FF3024','#FF8800','#FFD342','#00DC0A','#228947','#75452D','#4A2C26','#483ADF','#A439F4','#FF67A7','#E9E2D6','#FFFFFF'];
const paintTools=document.getElementById('paintTools');
paintTools.innerHTML='<div class="sculptPalette"></div><button id="erasePaint">색만 지우기</button>';
for(const color of colors){const button=document.createElement('button');button.style.background=color;button.dataset.color=color;button.title=color;button.setAttribute('aria-label','색상 '+color);button.onclick=()=>{activeTool='paint';paintColor=color;refreshTools();};paintTools.querySelector('.sculptPalette').append(button);}
document.getElementById('erasePaint').onclick=()=>{activeTool='erase';refreshTools();};
const stickerImages=new Map(),STICKERS=GUEST.stickers||[];
const decorations=document.getElementById('decorationTools');
decorations.innerHTML='<div class="sculptStickers"></div>';
for(const sticker of STICKERS){
 const img=new Image();img.src=sticker.src;stickerImages.set(sticker.id,img);
 const button=document.createElement('button');button.dataset.sticker=sticker.id;button.title=sticker.name;
 button.innerHTML='<img src="'+safeText(sticker.src)+'" alt=""><span>'+safeText(sticker.name)+'</span>';
 button.onclick=()=>{selectedSticker=sticker;refreshTools();};decorations.querySelector('.sculptStickers').append(button);
 img.onload=()=>{if(ready)renderPortrait();};
}
const guideButton=document.getElementById('showBeautyZones');if(guideButton)guideButton.onclick=()=>{zonesVisible=!zonesVisible;guideButton.setAttribute('aria-pressed',String(zonesVisible));renderPortrait();};
document.getElementById('repeatBeautyRequest').onclick=()=>announceBeautyRequest();
document.getElementById('undoBeauty').onclick=undoBeauty;
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const materialColor=rgb(B.growth?.color||(bone?'#E9E2D6':'#62CB70'));
const outlineColor=rgb(B.growth?.outline||(bone?'#7478B6':'#416333'));
const growthRegion=B.growth?.region||{x:45,y:0,w:230,h:bone?210:330};
function emptyNeighbor(mask,n){const x=n%W,y=Math.floor(n/W);return x===0||x===W-1||y===0||y===H-1||!mask[n-1]||!mask[n+1]||!mask[n-W]||!mask[n+W];}
async function prepareBeauty(){
 await Promise.all([faceImage.decode(),hairImage.decode(),capeImage.decode()]);
 const c=offscreen(),cctx=c.getContext('2d');cctx.imageSmoothingEnabled=false;
 cctx.drawImage(faceImage,43,14,74,74*faceImage.naturalHeight/faceImage.naturalWidth);
 const head=cctx.getImageData(0,0,W,H).data;
 // Fixed masks are sampled once from the neutral source, never from an animated expression.
 for(let n=0;n<W*H;n++){
  const i=n*4,x=(n%W+.5)*PIX,y=(Math.floor(n/W)+.5)*PIX,r=head[i],g=head[i+1],bl=head[i+2],a=head[i+3];
  if(!a)continue;
  if(!bone&&y<90&&r>120&&bl>60&&g<150&&r>g*1.3)masks.brain[n]=1;
  if(y>88&&y<136&&x>103&&x<215){
   if(bone?(r<100&&g<110&&bl<130):(r>170&&bl<160&&g>140||r>180&&g<100&&bl<150))masks.eyes[n]=1;
  }
 }
 if(!bone){cctx.clearRect(0,0,W,H);cctx.drawImage(hairImage,28.5,-1.5,95,95*hairImage.naturalHeight/hairImage.naturalWidth);}
 const src=cctx.getImageData(0,0,W,H).data;
 for(let n=0;n<W*H;n++){
  const i=n*4;if(src[i+3]<=100)continue;
  // The pink patch in the old hair sprite is exposed brain, not cuttable hair.
  if(!bone&&src[i]>120&&src[i+2]>60&&src[i+1]<150&&src[i]>src[i+1]*1.3)continue;
  current[n]=original[n]=1;sourcePixels.set(src.subarray(i,i+4),i);
 }
 for(let n=0;n<W*H;n++)originalBorder[n]=original[n]&&emptyNeighbor(original,n)?1:0;
 ready=true;next.disabled=briefing;updateBeautyScore();refreshTools();renderPortrait();
}
function syncUndo(){const button=document.getElementById('undoBeauty');button.hidden=beautyPhase==='cut';button.disabled=briefing||!history[beautyPhase]?.length;}
function pushUndo(){
 if(beautyPhase==='cut')return false;
 const stack=history[beautyPhase];stack.push(beautyPhase==='draw'?{paint:paint.slice(),touched:touched.draw}:{placements:placements.map(p=>({...p})),touched:touched.attach});if(stack.length>30)stack.shift();syncUndo();return true;
}
function undoBeauty(){
 if(beautyPhase==='cut'||briefing||finishing)return;cancelGesture();const old=history[beautyPhase]?.pop();if(!old)return;
 if(beautyPhase==='draw'){paint.set(old.paint);for(let n=0;n<current.length;n++)if(!current[n]&&B.designVersion)paint.fill(0,n*4,n*4+4);touched.draw=old.touched;}
 else {placements=old.placements;touched.attach=old.touched;}
 syncUndo();updateBeautyScore();renderPortrait();
}
function point(e){const r=portrait.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*320,y:(e.clientY-r.top)/r.height*350};}
function applyStroke(points,kind){
 const cells=strokeCells(W,H,points,brushRadius);
 for(const n of cells){
  const x=(n%W+.5)*PIX,y=(Math.floor(n/W)+.5)*PIX,i=n*4;
  if(kind==='grow'){
   if(!inBeautyRegion(x,y,growthRegion))continue;
   // Existing facial features are covered only when growth is deliberately painted over them.
   if(!bone){current[n]=2;paint.fill(0,i,i+4);}
   else if(!current[n]){current[n]=original[n]?1:2;paint.fill(0,i,i+4);}
   else if(!originalBorder[n])current[n]=2;
  }else if(kind==='scissors'||kind==='hammer'){current[n]=0;paint.fill(0,i,i+4);}
  else if(kind==='erase')paint.fill(0,i,i+4);
  else if(kind==='paint'&&(current[n]||!B.designVersion)){paint.set([...rgb(paintColor),255],i);}
 }
 if(kind==='grow'&&bone&&!touched.cut){touched.cut=[...cells].some(n=>masks.eyes[n]&&current[n]===2);}else touched[beautyPhase]=true;
}
portrait.addEventListener('pointerdown',e=>{
 if(!ready||finishing||briefing||e.button!==0)return;e.preventDefault();const p=point(e);
 if(beautyPhase==='attach'){
  const hit=[...placements].reverse().find(q=>Math.abs(p.x-q.x)<q.sticker.w*.75&&Math.abs(p.y-q.y)<q.sticker.h*.75);
  if(hit){pushUndo();placements=placements.filter(q=>q!==hit);touched.attach=true;updateBeautyScore();renderPortrait();}
  else if(selectedSticker)placeSticker(selectedSticker,p.x,p.y);
  return;
 }
 const undoAdded=pushUndo();gesture={undoAdded,pointerId:e.pointerId,from:p,to:p,last:p,kind:activeTool,snapshot:current.slice(),paint:paint.slice(),touched:{...touched}};
 portrait.setPointerCapture(e.pointerId);
 if(activeTool!=='scissors'){applyStroke([p],activeTool);updateBeautyScore();}
 renderPortrait();
});
portrait.addEventListener('pointermove',e=>{
 if(!gesture||e.pointerId!==gesture.pointerId)return;e.preventDefault();const p=point(e);gesture.to=p;
 if(gesture.kind!=='scissors'){applyStroke([gesture.last,p],gesture.kind);updateBeautyScore();}
 gesture.last=p;renderPortrait();
});
portrait.addEventListener('pointerup',e=>{
 if(!gesture||e.pointerId!==gesture.pointerId)return;
 const g=gesture;g.to=point(e);
 if(g.kind==='scissors'){applyStroke([g.from,g.to],'scissors');}
 gesture=null;
 if(portrait.hasPointerCapture(e.pointerId))portrait.releasePointerCapture(e.pointerId);
 if(beautyPhase==='cut'){history.draw=[];history.attach=[];syncUndo();}
 if(g.kind==='hammer')send('sound',{key:'hammer'});
 updateBeautyScore();renderPortrait();
});
function cancelGesture(){
 if(!gesture)return;const g=gesture;gesture=null;current.set(g.snapshot);paint.set(g.paint);touched=g.touched;if(g.undoAdded)history[beautyPhase].pop();
 if(portrait.hasPointerCapture(g.pointerId))portrait.releasePointerCapture(g.pointerId);
 syncUndo();updateBeautyScore();renderPortrait();
}
portrait.addEventListener('pointercancel',cancelGesture);portrait.addEventListener('lostpointercapture',()=>{if(gesture)cancelGesture();});
addEventListener('blur',cancelGesture);
addEventListener('keydown',e=>{if(!beautyActive)return;if(e.key==='Escape')cancelGesture();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undoBeauty();}},true);
function placeSticker(sticker,x,y){
 if(!ready||finishing||briefing||beautyPhase!=='attach'||placements.length>=5)return;
 pushUndo();const region=B.attachRegions.find(r=>inBeautyRegion(x,y,r))?.key||'Other';
 placements.push({sticker,region,x,y});touched.attach=true;updateBeautyScore();renderPortrait();
}
function updateBeautyScore(){
 if(!ready)return;
 const shape=scoreShape(current,original,B,W,H,masks);cutScore=shape.score;
 attachScore=beautyAttachScore(placements,B);
 if(B.weights.draw){const full=new Uint8ClampedArray(320*350*4);for(let y=0;y<350;y++)for(let x=0;x<320;x++){const n=(Math.floor(y/2)*W+Math.floor(x/2))*4;full.set(paint.subarray(n,n+4),(y*320+x)*4);}drawScore=beautyDrawScore(full,B);}else drawScore=0;
 totalSatisfaction=beautyTotal({cut:cutScore,draw:drawScore,attach:attachScore},B);
 const scores={cut:cutScore,draw:drawScore,attach:attachScore};
 const live=BEAUTY_STAGES.reduce((s,k)=>s+(B.steps[k]?(touched[k]?scores[k]:B.weights[k]*.5):0),0);
 expression=liveBeautyMood(live,expression,Object.values(touched).some(Boolean));
 beautyCustomer.dataset.expression=expression;beautyCustomer.dataset.talking=String(talking);
}
function paintFace(){
 const f=faceCanvas.getContext('2d');f.imageSmoothingEnabled=false;f.clearRect(0,0,W,H);
 f.save();f.translate(43,14);f.scale(74/29,74/29);f.drawImage(faceImage,0,0,29,31);
 // Provisional pixel eyelids and mouth use the supplied neutral face. They do not alter masks.
 const skin=bone?'#E9E2D6':'#5BDEC7',dark=bone?'#454259':'#265479';
 if(expression!=='neutral'){
  f.fillStyle=skin;
  if(expression==='angry'){f.fillRect(5,13,3,2);f.fillRect(8,14,3,2);f.fillRect(19,14,3,2);f.fillRect(22,13,2,2);}
  else {f.fillRect(5,13,6,2);f.fillRect(19,13,5,2);f.fillRect(6,18,4,1);f.fillRect(20,18,4,1);}
 }
 if(!bone){
  f.fillStyle=skin;f.fillRect(10,25,9,4);f.fillStyle=dark;
  if(talking){if(mouthFrame){f.fillRect(10,25,9,4);f.fillStyle='#FDFF81';f.fillRect(11,25,2,1);f.fillRect(15,25,2,1);}else f.fillRect(10,27,9,1);}
  else if(expression==='angry'){f.fillRect(11,26,6,1);f.fillRect(10,27,1,1);f.fillRect(17,27,1,1);}
  else if(expression==='satisfied'){f.fillRect(10,26,1,1);f.fillRect(18,26,1,1);f.fillRect(11,27,7,1);}
  else {f.fillRect(10,25,9,4);f.fillStyle='#FDFF81';f.fillRect(11,26,2,2);f.fillRect(15,26,2,1);}
 }else if(talking&&mouthFrame){f.fillStyle=dark;f.fillRect(7,24,15,2);}
 f.restore();
}
function renderPortrait(includeGuides=true,target=ctx){
 if(!ready)return;
 target.imageSmoothingEnabled=false;target.clearRect(0,0,W,H);
 target.drawImage(capeImage,24,79.5,112,112*capeImage.naturalHeight/capeImage.naturalWidth);
 paintFace();
 if(!bone)target.drawImage(faceCanvas,0,0);
 const materialCtx=materialCanvas.getContext('2d'),data=materialCtx.createImageData(W,H),face=faceCanvas.getContext('2d').getImageData(0,0,W,H).data;
 for(let n=0;n<W*H;n++){
  if(!current[n])continue;const i=n*4;
  const edge=emptyNeighbor(current,n),joining=originalBorder[n]&&!edge;
  const sourceDark=!bone&&sourcePixels[i+1]<140;
  const nearGrowth=!bone&&sourceDark&&[-2*W,-W,-2,-1,1,2,W,2*W].some(d=>current[n+d]===2);
  const color=edge?outlineColor:current[n]===2||joining||nearGrowth?materialColor:null;
  if(color)data.data.set([...color,255],i);else data.data.set((bone?face:sourcePixels).subarray(i,i+4),i);
  if(paint[i+3])data.data.set(paint.subarray(i,i+4),i);
 }
 if(!B.designVersion)for(let n=0;n<W*H;n++){const i=n*4;if(paint[i+3])data.data.set(paint.subarray(i,i+4),i);}
 materialCtx.putImageData(data,0,0);target.drawImage(materialCanvas,0,0);
 for(const p of placements){const image=stickerImages.get(p.sticker.id);if(image?.complete&&image.naturalWidth)target.drawImage(image,p.x/2-p.sticker.w*.375,p.y/2-p.sticker.h*.375,p.sticker.w*.75,p.sticker.h*.75);}
 if(includeGuides&&zonesVisible){
  target.save();target.lineWidth=.8;target.font='5px sans-serif';
  const regions=beautyPhase==='cut'?B.cutRegions:beautyPhase==='attach'?B.attachRegions:B.drawRegions;
  if(beautyPhase==='cut'){target.strokeStyle='#92713F';target.setLineDash([2,2]);target.strokeRect(growthRegion.x/2,growthRegion.y/2,growthRegion.w/2,growthRegion.h/2);target.setLineDash([]);}
  for(const r of regions){target.strokeStyle=r.rule==='cover'?'#FCBB52':'#E95665';target.fillStyle=r.rule==='cover'?'#FCBB5225':'#E9566525';target.fillRect(r.x/2,r.y/2,r.w/2,r.h/2);target.strokeRect(r.x/2,r.y/2,r.w/2,r.h/2);}
  target.restore();
 }
 if(includeGuides&&gesture?.kind==='scissors'){
  target.save();target.strokeStyle='#FF643FA0';target.lineWidth=brushRadius;target.lineCap='round';target.beginPath();target.moveTo(gesture.from.x/2,gesture.from.y/2);target.lineTo(gesture.to.x/2,gesture.to.y/2);target.stroke();
  target.strokeStyle='#FFF2DD';target.lineWidth=.8;target.setLineDash([2,2]);target.stroke();target.restore();
 }
}
function captureBeautyCustomer(){const c=offscreen();renderPortrait(false,c.getContext('2d'));return c.toDataURL();}
function refreshTools(){
 for(const b of shapeTools.children)b.classList.toggle('selected',b.dataset.tool===activeTool);
 for(const b of paintTools.querySelectorAll('[data-color]'))b.classList.toggle('selected',activeTool==='paint'&&b.dataset.color===paintColor);
 document.getElementById('erasePaint').classList.toggle('selected',activeTool==='erase');
 for(const b of decorations.querySelectorAll('[data-sticker]'))b.classList.toggle('selected',b.dataset.sticker===selectedSticker?.id);
 hint.textContent=beautyPhase==='attach'?'붙인 장식은 눌러 떼기':beautyPhase==='draw'?'머리 위에 쓱쓱':activeTool==='grow'?'누른 채 발라 주세요':activeTool==='scissors'?'드래그 후 놓으면 싹둑':'누른 채 조금씩 다듬기';
}
function setBeautyPhase(phase,announce=true){
 if(finishing||briefing)return;cancelGesture();beautyPhase=phase;
 const names={cut:'형태 만들기',draw:'색·무늬 꾸미기',attach:'장식 붙이기'},stages=beautyStageOrder(B);
 stageTag.textContent=(stages.indexOf(phase)+1)+'. '+names[phase];
 panel.querySelector('h3').textContent=names[phase];
 shapeTools.hidden=phase!=='cut';paintTools.hidden=phase!=='draw';decorations.hidden=phase!=='attach';panel.querySelector('.brushLabel').hidden=phase==='attach';
 activeTool=phase==='cut'?(bone?'hammer':'scissors'):phase==='draw'?'paint':'sticker';
 status.querySelector('.requestText').textContent=B.requestNotes?.[phase]||({cut:bone?'얼굴 테두리 다듬기':'눈이 보이게 · 앞머리 손질',draw:B.weights.draw?'부탁한 색과 무늬로': '색·무늬는 자유롭게',attach:'손님에게 어울리는 장식'}[phase]);
 nav.innerHTML=stages.map((k,i)=>'<button data-phase="'+k+'" class="'+(phase===k?'selected':'')+'">'+(i+1)+'. '+names[k]+'</button>').join('');
 for(const button of nav.children)button.onclick=()=>setBeautyPhase(button.dataset.phase);
 next.textContent=stages.indexOf(phase)===stages.length-1?'미용 완성':phase==='draw'&&!B.weights.draw?'꾸미기 마치기':'다음 단계';
 next.disabled=!ready;syncUndo();refreshTools();updateBeautyScore();renderPortrait();if(announce)announceBeautyRequest();
}
function announceBeautyRequest(){
 if(finishing||briefing)return;cancelGesture();briefing=true;status.hidden=true;panel.inert=true;nav.inert=true;actions.inert=true;next.disabled=true;syncUndo();
 send('stage-request',{stage:beautyPhase,requestId:++requestSerial});
}
function finishBeautyRequest(id){
 if(!briefing||id!==requestSerial)return;briefing=false;talking=false;mouthFrame=false;beautyCustomer.dataset.talking='false';status.hidden=false;panel.inert=false;nav.inert=false;actions.inert=false;next.disabled=!ready;syncUndo();renderPortrait();
}
function enterAttachPhase(){setBeautyPhase('attach');}
function enterDrawPhase(){setBeautyPhase('draw');}
function calculateDrawScore(){updateBeautyScore();}
function enterBeauty(){
 dialogueState.active=false;beautyActive=true;state.keys.clear();interactionAvailable=false;interactPrompt.style.display='none';
 beautyScreen.style.display='block';beautyScreen.setAttribute('aria-hidden','false');
 requestAnimationFrame(()=>beautyScreen.classList.add('active'));
 setBeautyPhase(beautyStageOrder(B)[0]);
}
function advanceBeautyResult(){}
function startBeautyResult(){
 if(!ready||finishing||briefing)return;cancelGesture();updateBeautyScore();finishing=true;beautyPhase='result';
 expression=totalSatisfaction>=80?'satisfied':totalSatisfaction>=40?'neutral':'angry';renderPortrait();
 next.disabled=true;finish.disabled=true;state.keys.clear();
 send('beauty-result',{score:totalSatisfaction,portrait:captureBeautyCustomer()});
}
addEventListener('message',e=>{if(e.source!==parent||e.data?.token!==GUEST.token)return;if(e.data.type==='beauty-request-done'){finishBeautyRequest(e.data.requestId);return;}if(e.data.type!=='beauty-speaking')return;talking=!!e.data.speaking;mouthFrame=!!e.data.open;beautyCustomer.dataset.talking=String(talking);renderPortrait();});
prepareBeauty().catch(error=>{hint.textContent='미용 리소스를 불러오지 못했어요. 새로고침해 주세요.';console.error(error);});
window.beautyDebug={get ready(){return ready;},get material(){return Array.from(current);},get paint(){return Array.from(paint);},get original(){return Array.from(original);},get masks(){return masks;},get expression(){return expression;},get scores(){return {cut:cutScore,draw:drawScore,attach:attachScore,total:totalSatisfaction};},get placements(){return placements.map(p=>({id:p.sticker.id,x:p.x,y:p.y}));},get historyLength(){return history[beautyPhase]?.length||0;},get briefing(){return briefing;},get mouthFrame(){return mouthFrame;}};

