// Live beauty reveal: reuse the styled portrait, never a prerecorded result GIF.
let resultMood='neutral',resultRevealed=false,resultRevealTimer=0,resultEndTimer=0;
const resultCamera=document.createElement('div');resultCamera.className='beautyResultCamera';
for(const node of beautyScreen.querySelectorAll('.beautyMirror,.beautyCustomer,.beautyCounter'))resultCamera.append(node);
beautyScreen.prepend(resultCamera);
const resultEffects=document.createElement('div');resultEffects.className='beautyResultEffects';resultEffects.setAttribute('aria-hidden','true');
resultEffects.innerHTML='<div class="resultGlow"></div><div class="resultFlowers"></div>';
beautyScreen.append(resultEffects);
const resultHand=document.createElement('canvas');resultHand.width=28;resultHand.height=40;resultHand.className='beautyResultHand';resultHand.setAttribute('aria-hidden','true');beautyCustomer.append(resultHand);
// Temporary code-drawn pixel hands. Bone joints and a blue cuff distinguish Sans.
function drawResultHand(){
 const c=resultHand.getContext('2d');c.clearRect(0,0,28,40);
 const palette=bone?{edge:'#45425E',shade:'#A6A0BA',base:'#E9E2D6',light:'#FFF6DE',cuff:'#526BA4'}:{edge:'#204659',shade:'#29988F',base:'#5BDEC7',light:'#9CF3D6',cuff:'#B7C8CF'};
 const rect=(color,x,y,w,h)=>{c.fillStyle=palette[color];c.fillRect(x,y,w,h);};
 c.fillStyle=palette.edge;c.beginPath();for(const [i,p] of [[10,2],[15,2],[17,5],[17,14],[23,14],[26,17],[26,29],[23,33],[22,39],[4,39],[4,31],[2,28],[2,20],[5,17],[8,16],[8,5]].entries())i?c.lineTo(...p):c.moveTo(...p);c.closePath();c.fill();
 rect('base',10,5,5,14);rect('light',10,5,2,10);rect('shade',13,5,2,12);
 rect('base',7,18,17,12);rect('base',5,21,4,7);rect('base',9,29,13,4);
 rect('shade',9,28,14,3);rect('light',8,19,3,8);
 for(const y of [18,23,28]){rect('edge',15,y,8,1);rect('light',15,y+1,8,1);}
 if(bone){rect('shade',10,11,5,2);rect('edge',10,16,4,1);rect('shade',11,21,2,7);rect('light',6,21,2,5);}
 rect('edge',5,33,18,7);rect('cuff',7,34,14,6);rect('light',7,34,3,2);
}
drawResultHand();
const flowerPositions=[[28,26,19,'#FF9BBD'],[69,23,16,'#FFE1A0'],[24,52,15,'#FFE1A0'],[74,46,21,'#FFB5D4'],[34,14,12,'#FFFFFF'],[65,64,13,'#FFFFFF']];
for(const [i,[x,y,size,color]] of flowerPositions.entries()){
 const flower=document.createElement('span');flower.className='resultFlower';
 flower.style.cssText=`left:${x}%;top:${y}%;--flower-size:${size}px;--petal:${color};--delay:${i*110}ms;--turn:${i%2?16:-14}deg`;
 flower.innerHTML='<i></i><i></i><i></i><i></i><b></b>';resultEffects.querySelector('.resultFlowers').append(flower);
}
const resultCaption=document.createElement('div');resultCaption.className='beautyResultCaption';resultCaption.setAttribute('role','status');beautyScreen.append(resultCaption);
const resultContinue=document.createElement('button');resultContinue.className='beautyResultContinue';resultContinue.id='beautyResultContinue';resultContinue.hidden=true;resultContinue.onclick=advanceBeautyResult;beautyScreen.append(resultContinue);
function revealBeautyResult(){
 if(resultRevealed)return;resultRevealed=true;expression=resultMood;talking=false;mouthFrame=false;
 beautyCustomer.dataset.expression=expression;beautyScreen.dataset.resultMood=resultMood;beautyScreen.classList.add('resultRevealed');
 resultCaption.textContent=bone?(resultMood==='satisfied'?'헤. 꽤 멋진데?':resultMood==='angry'?'…뼈아픈데.':'음. 이 정도면 됐어.'):(resultMood==='satisfied'?'정말… 마음에 들어요…!':resultMood==='angry'?'어… 이건 좀…':'음… 괜찮아요…');
 resultContinue.textContent='계속하기 →';renderPortrait(false);
}
function advanceBeautyResult(){
 if(!beautyResultActive)return;clearTimeout(resultRevealTimer);clearTimeout(resultEndTimer);revealBeautyResult();
 beautyResultActive=false;resultContinue.hidden=true;beautyScreen.classList.add('resultSettled');
 send('beauty-result',{score:totalSatisfaction,portrait:captureBeautyCustomer()});
}
function startBeautyResult(){
 if(!ready||finishing||briefing)return;cancelGesture();updateBeautyScore();finishing=true;beautyPhase='result';beautyResultActive=true;
 resultMood=totalSatisfaction>=80?'satisfied':totalSatisfaction>=40?'neutral':'angry';
 expression='neutral';talking=false;mouthFrame=false;zonesVisible=false;fallingPieces=[];renderPortrait(false);
 next.disabled=true;finish.disabled=true;state.keys.clear();
 panel.inert=true;nav.inert=true;actions.inert=true;status.inert=true;
 beautyScreen.classList.add('resultPlaying');resultContinue.hidden=false;resultContinue.textContent='연출 건너뛰기';resultContinue.focus({preventScroll:true});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 resultRevealTimer=setTimeout(revealBeautyResult,reduced?150:2600);
 resultEndTimer=setTimeout(advanceBeautyResult,reduced?1800:6500);
}
addEventListener('keydown',e=>{
 if(!beautyResultActive||!['Enter',' ','f','F','Escape'].includes(e.key))return;
 e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)advanceBeautyResult();
},true);
