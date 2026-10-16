// The lesson guides normal input; it never edits pixels or awards score.
const beautyLessonSteps=[];
if(B.steps.cut){
 beautyLessonSteps.push({id:'cut',phase:'cut',tool:hammer?'hammer':'scissors',title:hammer?'빛나는 부분을 조금 다듬어요':'선을 따라 한 번 잘라요',text:hammer?'망치·정을 고르고, 동그라미 안을 조금 다듬어 보세요.':'가위를 고르고, 동그라미 안에서 점선을 따라 누른 채 움직인 뒤 놓아 주세요.',practice:true});
 if(B.growth?.enabled!==false)beautyLessonSteps.push({id:'grow',phase:'cut',tool:'grow',title:'방금 자른 곳을 다시 길러요',text:B.growth?.connected?'발모제를 고르고, 남아 있는 뿔에서 잘린 자리로 이어 발라 주세요.':'발모제를 고르고, 방금 자른 동그라미 안에 누른 채 발라 보세요.',practice:true});
}
beautyLessonSteps.push({id:'request',title:'부탁은 지키고, 모양은 자유롭게',text:'왼쪽 메모는 손님의 최소 요구예요. 지금은 도구만 연습했으니 아직 체크가 없어도 괜찮아요. 손질 가이드를 켜서 부탁한 위치를 찾아보세요.',target:'#showBeautyZones',practice:true});
if(B.steps.draw){
 beautyLessonSteps.push({id:'draw',phase:'draw',tool:'paint',title:'작은 부분에 색을 칠해요',text:'오른쪽에서 색을 고르고, 동그라미 안을 누른 채 짧게 칠해 보세요. 칠한 색은 되돌리거나 지울 수 있어요.',practice:true});
 if(B.steps.cut){
  beautyLessonSteps.push({id:'stagesBack',title:'앞 단계로 돌아가 볼까요?',text:'위의 ‘1. 형태 만들기’를 눌러 보세요. 칠한 색은 그대로 두고 머리 모양을 다시 손질할 수 있어요.',target:'[data-phase="cut"]',goPhase:'cut',practice:true});
  beautyLessonSteps.push({id:'stagesReturn',title:'다시 그리기로 돌아와요',text:'위의 ‘색·무늬 꾸미기’를 눌러 보세요. 이렇게 단계를 자유롭게 오갈 수 있어요.',target:'[data-phase="draw"]',goPhase:'draw',practice:true});
 }
}
if(B.steps.attach)beautyLessonSteps.push({id:'attach',phase:'attach',title:'장식을 끌어서 붙여요',text:'빛나는 장식을 잡고 점선을 따라 동그라미 안에 놓아 보세요. 장식을 고른 뒤 그 자리를 클릭해도 돼요.',practice:true});
beautyLessonSteps.push({id:'done',title:'이제 자유롭게 손질해요',text:'연습한 모양은 그대로 남아요. 왼쪽 부탁을 확인하며 마무리해 주세요. 자세한 부탁은 ‘다시 듣기’, 장식은 다시 눌러 떼기! 준비되면 ‘미용 완성’을 눌러요.'});
let beautyLessonIndex=0,beautyLessonDone=!GUEST.tutorialBeauty,beautyLessonPassed=false,lessonTimer=0,lessonHintTimer=0,lessonPoint=null,lessonFrom=null,lessonRemoved=[],lessonFeedback='';
const beautyLesson=document.createElement('section');beautyLesson.id='beautyTutorial';beautyLesson.hidden=true;beautyLesson.setAttribute('aria-label','미용 연습');beautyScreen.append(beautyLesson);
const lessonOverlay=document.createElementNS('http://www.w3.org/2000/svg','svg');lessonOverlay.id='beautyLessonOverlay';lessonOverlay.setAttribute('aria-hidden','true');lessonOverlay.style.display='none';beautyScreen.append(lessonOverlay);
function clearLessonTimers(){clearTimeout(lessonTimer);clearTimeout(lessonHintTimer);lessonTimer=lessonHintTimer=0;}
function finishBeautyLesson(){clearLessonTimers();beautyLessonDone=true;beautyLesson.hidden=true;lessonOverlay.style.display='none';beautyScreen.classList.remove('learningBeauty');document.querySelectorAll('.lessonTarget').forEach(e=>e.classList.remove('lessonTarget'));send('tutorial-done',{kind:'beauty'});}
function lessonSticker(){return STICKERS.find(s=>s.tag===B.attachTag&&B.attachRegions.some(r=>r.stickerIDs.includes(s.id)))||STICKERS[0];}
function setupLessonTarget(){
 const step=beautyLessonSteps[beautyLessonIndex];lessonPoint=null;lessonFrom=null;
 if(step.id==='cut'){
  lessonPoint=beautyLessonPoint({material:current,protectedMask:masks.protectedFace,anchors:sculptAnchors,regions:B.cutRegions.filter(r=>r.rule==='trim'),near:{x:110,y:60}});
 }else if(step.id==='grow'){
  const allowed=lessonRemoved.filter(p=>inBeautyRegion(p.x,p.y,growthRegion));
  lessonPoint=allowed[Math.floor(allowed.length/2)]||null;
  if(lessonPoint&&B.growth?.connected)lessonFrom=beautyLessonPoint({material:current,protectedMask:masks.eyes,near:lessonPoint});
 }else if(step.id==='draw'){
  lessonPoint=beautyLessonPoint({material:current,face:bone?[]:masks.face,mode:'paint',regions:B.drawRegions.filter(r=>r.kind==='good'),near:{x:130,y:65}});
 }else if(step.id==='attach'){
  const sticker=lessonSticker(),r=B.attachRegions.find(r=>r.stickerIDs.includes(sticker?.id));
  if(r)lessonPoint={x:r.x+r.w/2,y:r.y+r.h/2};
 }
}
function advanceBeautyLesson(){
 clearLessonTimers();if(beautyLessonDone)return;
 const step=beautyLessonSteps[beautyLessonIndex];if(step.practice&&!beautyLessonPassed)return;
 if(++beautyLessonIndex>=beautyLessonSteps.length){finishBeautyLesson();return;}
 beautyLessonPassed=false;lessonFeedback='';const nextStep=beautyLessonSteps[beautyLessonIndex];
 setupLessonTarget();
 if(nextStep.id==='request'&&zonesVisible){zonesVisible=false;guideButton.setAttribute('aria-pressed','false');renderPortrait();}
 if(nextStep.phase&&nextStep.phase!==beautyPhase)setBeautyPhase(nextStep.phase);
 renderBeautyLesson();
}
function passBeautyLesson(){if(beautyLessonDone||beautyLessonPassed)return;beautyLessonPassed=true;lessonFeedback='✓ 좋아요! 다음 연습으로 이어져요.';renderBeautyLesson();}
function lessonMessage(step){
 if(step.tool&&step.tool!==activeTool)return '먼저 오른쪽에서 '+({scissors:'가위',hammer:'망치·정',grow:'발모제',paint:'색'}[step.tool])+'를 골라 주세요.';
 if(step.id==='cut')return hammer?'동그라미 안의 재료를 누르거나 짧게 끌어 주세요.':'① 누르기 → ② 점선을 따라 움직이기 → ③ 마우스 놓기';
 if(step.id==='grow')return B.growth?.connected?'남아 있는 뿔에서 시작해 잘린 자리까지 이어 주세요.':'잘린 자리에 누른 채 발라 주세요. 다 바르면 놓아요.';
 if(step.id==='draw')return '빈 공간에는 칠해지지 않아요. 동그라미 안에서 짧게 칠해 보세요.';
 if(step.id==='attach')return '장식을 동그라미 안까지 끌고 와서 놓아 주세요.';
 return '빛나는 버튼을 눌러 직접 해보세요.';
}
function renderBeautyLesson(){
 clearTimeout(lessonHintTimer);clearTimeout(lessonTimer);
 document.querySelectorAll('.lessonTarget').forEach(e=>e.classList.remove('lessonTarget'));
 const active=!beautyLessonDone&&beautyActive&&!finishing;
 beautyScreen.classList.toggle('learningBeauty',active);beautyLesson.hidden=!active||briefing;lessonOverlay.style.display='none';
 if(!active||briefing||!ready)return;
 const step=beautyLessonSteps[beautyLessonIndex],wrong=step.phase&&beautyPhase!==step.phase;
 if(!lessonPoint&&['cut','grow','draw','attach'].includes(step.id))setupLessonTarget();
 beautyLesson.dataset.step=step.id;
 beautyLesson.innerHTML='<small>한 동작씩 미용 연습 · '+(beautyLessonIndex+1)+' / '+beautyLessonSteps.length+'</small><h3>'+step.title+'</h3><p>'+step.text+'</p><div class="lessonFeedback" role="status">'+(wrong?'다른 단계에 와 있어요. 연습하던 단계로 돌아가면 이어서 할 수 있어요.':lessonFeedback||(step.practice?lessonMessage(step):''))+'</div><div class="lessonButtons"><button id="beautyTutorialSkip">연습 건너뛰기</button>'+(wrong?'<button id="beautyTutorialReturn">연습 단계로 돌아가기</button>':step.practice?(beautyLessonPassed?'<span>다음 안내로 이동 중…</span>':'<span>직접 해보세요</span>'):'<button id="beautyTutorialNext">자유롭게 손질하기</button>')+'</div>';
 document.getElementById('beautyTutorialSkip').onclick=finishBeautyLesson;
 const back=document.getElementById('beautyTutorialReturn');if(back)back.onclick=()=>setBeautyPhase(step.phase);
 const nextButton=document.getElementById('beautyTutorialNext');if(nextButton)nextButton.onclick=advanceBeautyLesson;
 let selector=step.target;
 if(step.tool)selector=step.tool==='paint'?'#paintTools':('[data-tool="'+step.tool+'"]');
 if(step.id==='attach'){const s=lessonSticker();selector=s?'[data-sticker="'+s.id+'"]':'#decorationTools';}
 const target=document.querySelector(wrong?'[data-phase="'+step.phase+'"]':selector||'.sculptStatus');
 if(target){target.classList.add('lessonTarget');if(step.id==='attach')target.scrollIntoView({block:'nearest'});}
 drawLessonOverlay(target,wrong?null:lessonPoint,step);
 if(beautyLessonPassed){lessonTimer=setTimeout(()=>{if(!briefing&&!gesture)advanceBeautyLesson();else renderBeautyLesson();},850);}
 else if(step.practice&&!wrong)lessonHintTimer=setTimeout(()=>{if(!beautyLesson.hidden&&!beautyLessonPassed)beautyLesson.querySelector('.lessonFeedback').textContent=lessonMessage(step);},6500);
}
function drawLessonOverlay(target,p,step){
 const s=beautyScreen.getBoundingClientRect(),sx=beautyScreen.clientWidth/s.width,sy=beautyScreen.clientHeight/s.height,w=beautyScreen.clientWidth,h=beautyScreen.clientHeight;
 if(!w||!h)return;
 const rect=e=>{const r=e.getBoundingClientRect();return {x:(r.left-s.left)*sx,y:(r.top-s.top)*sy,w:r.width*sx,h:r.height*sy};};
 const holes=[];let marks='';const t=target?rect(target):null;
 if(t)holes.push('<rect x="'+(t.x-6)+'" y="'+(t.y-6)+'" width="'+(t.w+12)+'" height="'+(t.h+12)+'" rx="9" fill="black"/>');
 if(p){
  const r=rect(portrait),map=q=>({x:r.x+q.x/320*r.w,y:r.y+q.y/350*r.h}),b=map(p);
  const a=step.id==='attach'&&t?{x:t.x+t.w/2,y:t.y+t.h/2}:lessonFrom?map(lessonFrom):{x:b.x-13,y:b.y};
  const end=step.id==='attach'||lessonFrom?b:{x:b.x+13,y:b.y};
  holes.push('<circle cx="'+b.x+'" cy="'+b.y+'" r="29" fill="black"/>');
  if(lessonFrom)holes.push('<circle cx="'+a.x+'" cy="'+a.y+'" r="20" fill="black"/>');
  marks='<circle class="lessonRing" cx="'+b.x+'" cy="'+b.y+'" r="25"/><path class="lessonTrail" d="M '+a.x+' '+a.y+' L '+end.x+' '+end.y+'" marker-end="url(#lessonArrow)"/><circle class="lessonCursor" r="5" style="--lx:'+a.x+'px;--ly:'+a.y+'px;--dx:'+(end.x-a.x)+'px;--dy:'+(end.y-a.y)+'px"/><text class="lessonMapLabel" x="'+b.x+'" y="'+(b.y-35)+'">'+(step.id==='attach'?'여기에 놓기':step.id==='grow'?'잘린 자리':step.id==='draw'?'여기에 칠하기':'여기서 연습')+'</text>';
 }
 lessonOverlay.setAttribute('viewBox','0 0 '+w+' '+h);
 lessonOverlay.innerHTML='<defs><mask id="lessonSpotlight"><rect width="100%" height="100%" fill="white"/>'+holes.join('')+'</mask><marker id="lessonArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#fff3aa"/></marker></defs><rect width="100%" height="100%" fill="#191a29" opacity=".38" mask="url(#lessonSpotlight)"/>'+marks;
 lessonOverlay.style.display='block';
}
function beautyLessonStroke(g){
 if(beautyLessonDone)return;const step=beautyLessonSteps[beautyLessonIndex];
 if(step.phase!==beautyPhase||step.tool!==g.kind)return;
 const changed=g.kind==='paint'?paint.some((v,i)=>v!==g.paint[i]):current.some((v,i)=>v!==g.snapshot[i]);
 if(changed){if(step.id==='cut')lessonRemoved=beautyLessonRemoved(g.snapshot,current,W);passBeautyLesson();}
 else {lessonFeedback=g.kind==='scissors'?'아직 잘린 머리가 없어요. 동그라미 안에서 누르고 끈 뒤 놓아 주세요.':lessonMessage(step);renderBeautyLesson();}
}
function beautyLessonSticker(){if(!beautyLessonDone&&beautyLessonSteps[beautyLessonIndex].id==='attach')passBeautyLesson();}
function beautyLessonPhase(phase){if(!beautyLessonDone&&beautyLessonSteps[beautyLessonIndex].goPhase===phase)passBeautyLesson();}
function beautyLessonGuide(){if(!beautyLessonDone&&beautyLessonSteps[beautyLessonIndex].id==='request'&&zonesVisible)passBeautyLesson();}
addEventListener('resize',()=>{if(!beautyLessonDone)renderBeautyLesson();});

