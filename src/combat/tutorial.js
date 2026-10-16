// The tutorial owns its pause. Normal resume / focus changes cannot release it.
let combatLesson=null,openingLessonSeen=false;
const battleLessonPanel=document.createElement('section');battleLessonPanel.id='battleTutorial';battleLessonPanel.hidden=true;battleLessonPanel.setAttribute('aria-label','야차 연습');$('battleArea').append(battleLessonPanel);
function combatLessonActive(){return !!combatLesson;}
function showCombatLesson(id){pauseBattle();combatLesson={id,moved:false};renderCombatLesson();}
function renderCombatLesson(){
 if(!combatLesson){battleLessonPanel.hidden=true;return;}
 const id=combatLesson.id,sans=battle?.usesHeartBoards;
 const content={
  move:['1 / 3 · 시간 정지','W A S D로 움직여 보세요','왼쪽 바닥의 아홉 칸을 이동할 수 있어요. 지금은 시간이 멈춰 있으니, W·A·S·D 중 하나를 눌러 옆 칸으로 움직여 보세요.'],
  gauges:['2 / 3 · 시간 정지','체력과 무력화를 살펴봐요',sans?'내 머리 위 초록 바는 내 HP예요. 샌즈는 위쪽 하트 세 개가 목숨이에요. 주먹으로 노란 무력화 바를 줄여 빈틈을 열고, 빈틈에 적중하면 하트 하나를 깰 수 있어요.':'내 머리 위 초록 바는 내 HP, 위쪽 빨간 바는 손님의 HP예요. 주먹으로 노란 무력화 바를 모두 줄이면, 가위로 연타할 빈틈이 열려요.'],
  punch:['3 / 3 · 시간 정지','주먹으로 때릴 곳과 타이밍','테두리 안이 공격이 닿는 범위예요. 이 안에 마우스를 가져가면 주먹이 밝아져요. 클릭으로 공격하고, 주먹 둘레와 오른쪽 아래의 준비 표시가 다시 차면 다음 공격을 할 수 있어요.'],
  opening:['첫 빈틈 · 시간 정지','지금이 가위로 연타할 기회!','밝은 테두리 안에서 마우스를 누른 채 좌우로 여러 번 긁어 주세요. 클릭만 하거나 가만히 누르고 있으면 적중하지 않아요. 안내를 닫은 뒤부터 빈틈 시간이 흐릅니다.' ]
 }[id];
 battleLessonPanel.hidden=false;battleLessonPanel.dataset.step=id;
 battleLessonPanel.innerHTML='<small>'+content[0]+'</small><h3>'+content[1]+'</h3><p>'+content[2]+'</p>'+(id==='opening'?'<div class="scratchDemo" aria-hidden="true">누른 채 <span>✂ ↔</span></div>':'')+'<div class="lessonFeedback" role="status">'+(id==='move'?(combatLesson.moved?'✓ 이동했어요!':'W · A · S · D 중 하나를 눌러 보세요.'):'')+'</div><div class="lessonButtons"><button id="battleTutorialSkip">'+(id==='opening'?'설명 닫기':'시작 안내 건너뛰기')+'</button><button id="battleTutorialNext" '+(id==='move'&&!combatLesson.moved?'disabled':'')+'>'+(id==='opening'?'준비됐어요 · 빈틈 시작':id==='punch'?'준비됐어요 · 야차 시작':'다음')+'</button></div>';
 $('pause').disabled=true;
 $('battleTutorialSkip').onclick=finishCombatLesson;
 $('battleTutorialNext').onclick=()=>{if(id==='move'){if(!combatLesson.moved)return;showCombatLesson('gauges');}else if(id==='gauges')showCombatLesson('punch');else finishCombatLesson();};
}
function finishCombatLesson(){
 if(!combatLesson)return;const kind=combatLesson.id==='opening'?'opening':'battle';
 combatLesson=null;battleLessonPanel.hidden=true;$('pause').disabled=false;clearCursorInput();notifyHost('tutorial-done',{kind});
 battle.paused=hostSuspended||document.hidden;$('pause').textContent=battle.paused?'계속하기':'일시정지';$('battleArea').focus();
}
function installBattleLessons(){
 if(HOST.mode!=='story'||!battle)return;
 openingLessonSeen=!HOST.tutorialOpening;
 // Called at the transition itself, before any opening time can elapse.
 const open=battle.open.bind(battle);
 battle.open=function(){const opened=open();if(opened&&!openingLessonSeen){openingLessonSeen=true;showCombatLesson('opening');}return opened;};
 if(HOST.tutorialBattle)showCombatLesson('move');
}
window.addEventListener('keydown',e=>{
 if(!combatLesson)return;
 if(e.key==='Tab')return;
 if(e.target.closest?.('#battleTutorial')&&['Enter',' '].includes(e.key))return;
 e.preventDefault();e.stopImmediatePropagation();
 const moves={w:[0,-1],a:[-1,0],s:[0,1],d:[1,0]};
 if(combatLesson.id==='move'&&moves[e.key.toLowerCase()]&&!hostSuspended){
  // A discrete rehearsal move; neither tick nor combat damage is advanced.
  const [dx,dy]=moves[e.key.toLowerCase()],x=(battle.pos-1)%3+dx,y=Math.floor((battle.pos-1)/3)+dy;
  if(x>=0&&x<3&&y>=0&&y<3){const from=battle.pos;battle.pos=y*3+x+1;battle.cue('move',{from,to:battle.pos});combatLesson.moved=true;renderCombatLesson();}
 }
},true);
function drawCombatLesson(g,b,view){
 if(!combatLesson)return;const id=combatLesson.id;
 g.save();g.strokeStyle='#ffe58c';g.fillStyle='#ffe58c12';g.lineWidth=3;
 const box=(x,y,w,h)=>{g.fillRect(x,y,w,h);g.strokeRect(x,y,w,h);};
 if(id==='move')box(100,345,565,239);
 if(id==='gauges'){box(350,20,560,b.usesHeartBoards?165:90);const p=view.playerPosition??view.point(b.pos);box(p.x-107,p.y-177,300,32);}
 if(id==='punch'||id==='opening'){const r=id==='opening'?view.scratchBox:view.box;box(r.x,r.y,r.w,r.h);if(id==='punch')box(1003,613,248,35);}
 g.restore();
}
