// Lives inside the actual salon; practice uses the normal tool handlers and scores.
const beautyLessonSteps=[];
if(B.steps.cut){
 beautyLessonSteps.push({id:'cut',phase:'cut',tool:hammer?'hammer':'scissors',title:hammer?'망치·정으로 조금 다듬어 볼까요?':'가위로 조금 잘라 볼까요?',text:hammer?'오른쪽 망치·정을 고르고, 다듬을 부분을 누르거나 드래그해 보세요.':'오른쪽 가위를 고르고, 머리카락 위에서 누른 채 선을 그은 뒤 놓아 보세요.',target:'[data-tool="'+(hammer?'hammer':'scissors')+'"]',practice:true});
 if(B.growth?.enabled!==false)beautyLessonSteps.push({id:'grow',phase:'cut',tool:'grow',title:'이번엔 발모제로 다시 길러요',text:B.growth?.connected?'발모제를 고른 뒤, 얼굴에 붙어 있는 뿔에서 시작해 바깥으로 이어 발라 보세요.':'발모제를 고른 뒤, 머리 가장자리나 방금 자른 곳에 누른 채 발라 보세요.',target:'[data-tool="grow"]',practice:true});
}
beautyLessonSteps.push({id:'request',title:'부탁은 지키고, 모양은 자유롭게',text:'왼쪽 메모가 손님의 최소 요구 사항이에요. 체크를 채우면서 원하는 모습으로 꾸며 주세요. ‘손질 가이드’로 부탁한 곳을 확인해요. 자세한 말을 놓쳤다면 ‘다시 듣기’ → ‘네?’로 되물어 보세요.',target:'.sculptStatus'});
if(B.steps.draw){
 beautyLessonSteps.push({id:'draw',phase:'draw',tool:'paint',title:'색과 무늬를 그려 볼까요?',text:'오른쪽에서 색을 고르고 머리나 얼굴 위에 누른 채 칠해 보세요. 도구 크기와 불투명도도 조절할 수 있어요.',target:'#paintTools',practice:true});
 beautyLessonSteps.push({id:'stages',title:'단계는 언제든 오갈 수 있어요',text:'위쪽 단계 버튼을 누르면 다시 자르거나 색을 고칠 수 있어요. 그리기와 장식은 ‘되돌리기’도 가능해요. 마지막에만 ‘미용 완성’을 눌러 주세요.',target:'.sculptNav'});
}
if(B.steps.attach)beautyLessonSteps.push({id:'attach',phase:'attach',title:'장식 하나를 붙여 볼까요?',text:'오른쪽에서 장식을 고르고 붙일 곳을 클릭해 보세요. 붙인 장식을 다시 누르면 뗄 수 있어요.',target:'#decorationTools',practice:true});
beautyLessonSteps.push({id:'done',title:'이제 당신의 미용실이에요',text:'연습한 손질은 그대로 남아 있어요. 손님의 부탁을 확인하며 마음껏 마무리하세요. 준비가 되면 ‘미용 완성’! 손님과 야차를 하게 되면 전투도 함께 익혀 볼게요.'});
let beautyLessonIndex=0,beautyLessonDone=!GUEST.tutorialBeauty,beautyLessonPassed=false;
const beautyLesson=document.createElement('section');beautyLesson.id='beautyTutorial';beautyLesson.hidden=true;beautyLesson.setAttribute('aria-label','미용 연습');beautyScreen.append(beautyLesson);
function finishBeautyLesson(){beautyLessonDone=true;beautyLesson.hidden=true;beautyScreen.classList.remove('learningBeauty');document.querySelectorAll('.lessonTarget').forEach(e=>e.classList.remove('lessonTarget'));send('tutorial-done',{kind:'beauty'});}
function renderBeautyLesson(){
 document.querySelectorAll('.lessonTarget').forEach(e=>e.classList.remove('lessonTarget'));
 const active=!beautyLessonDone&&beautyActive&&!finishing;
 beautyScreen.classList.toggle('learningBeauty',active);beautyLesson.hidden=!active||briefing;
 if(!active||briefing)return;
 const step=beautyLessonSteps[beautyLessonIndex],wrong=step.phase&&beautyPhase!==step.phase;
 beautyLesson.dataset.step=step.id;
 beautyLesson.innerHTML='<small>미용 연습 · '+(beautyLessonIndex+1)+' / '+beautyLessonSteps.length+'</small><h3>'+step.title+'</h3><p>'+step.text+'</p><div class="lessonFeedback" role="status">'+(wrong?'위쪽 단계 버튼으로 '+({cut:'형태 만들기',draw:'색·무늬 꾸미기',attach:'장식 붙이기'}[step.phase])+'에 돌아와 연습해 보세요.':step.practice?(beautyLessonPassed?'✓ 잘했어요! 다음으로 넘어가 볼까요?':'직접 해 보면 다음 안내가 열려요.'):'')+'</div><div class="lessonButtons"><button id="beautyTutorialSkip">연습 건너뛰기</button><button id="beautyTutorialNext" '+(step.practice&&!beautyLessonPassed?'disabled':'')+'>'+(step.id==='done'?'자유롭게 손질하기':'다음')+'</button></div>';
 if(!wrong&&step.target)document.querySelector(step.target)?.classList.add('lessonTarget');
 document.getElementById('beautyTutorialSkip').onclick=finishBeautyLesson;
 document.getElementById('beautyTutorialNext').onclick=()=>{
  if(step.practice&&!beautyLessonPassed)return;
  if(++beautyLessonIndex>=beautyLessonSteps.length){finishBeautyLesson();return;}
  beautyLessonPassed=false;const nextStep=beautyLessonSteps[beautyLessonIndex];
  if(nextStep.phase&&nextStep.phase!==beautyPhase)setBeautyPhase(nextStep.phase);
  renderBeautyLesson();
 };
}
function beautyLessonStroke(g){
 if(beautyLessonDone)return;const step=beautyLessonSteps[beautyLessonIndex];
 if(step.phase!==beautyPhase||step.tool!==g.kind)return;
 const changed=g.kind==='paint'?paint.some((v,i)=>v!==g.paint[i]):current.some((v,i)=>v!==g.snapshot[i]);
 if(changed){beautyLessonPassed=true;renderBeautyLesson();}
}
function beautyLessonSticker(){if(!beautyLessonDone&&beautyLessonSteps[beautyLessonIndex].id==='attach'){beautyLessonPassed=true;renderBeautyLesson();}}
