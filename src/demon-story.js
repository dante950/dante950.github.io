// Story orchestration only; the salon iframe is the same one used by every guest.
let demonSkins={};
function startDemonVisit(){
 stopChildren();closeModal();talk=null;el('talkLayer').hidden=true;story.day=4;story.index=0;story.demonPhase=1;story.demonSuccessLocked=false;story.demonEnding=null;
 story.guest=copy(story.project.guests.find(g=>g.id===DEMON_GUEST_ID)||BASE.guests.find(g=>g.id===DEMON_GUEST_ID));
 story.beautyDetails=null;story.lastScore=0;story.lastMood=null;story.portrait=null;story.headPortrait=null;story.arrivalBusy=false;
 showPage('story');el('phoneButton').hidden=true;updateStoryHud('손님 맞이');loadSalon(story.guest);
}
function playDemonLines(lines,done){
 const p=copy(story.project),groups=modelRows(p,'대화 그룹'),rows=modelRows(p,'대사'),id=Math.max(...groups.map(r=>r.GroupID))+1;
 groups.push({GroupID:id,PlaybackMode:'순서대로',AdvanceMode:'입력',CPS:30,HoldMs:1400,GapMs:100,PauseCombat:true});
 lines.forEach((text,i)=>rows.push({DialogueID:9900000+i,GroupID:id,Order:i+1,Speaker:Array.isArray(text)?text[0]:'몬스터',Text:Array.isArray(text)?text[1]:text}));
 playGroup(p,story.guest,id,done);
}
function changeDemonPhase(phase){
 if(phase!==1&&phase!==2)return;
 const active=story;el('salon').style.transition='opacity .35s';el('salon').style.opacity='0';
 setTimeout(()=>{
  if(story!==active)return;
  story.demonPhase=phase;story.guest=installDemonDialogue(story.project,demonGuest(phase));story.beautyDetails=null;
  loadSalon(story.guest,'story',()=>{if(story!==active)return;sendSalon('beauty-start');updateStoryHud('미용');el('salon').style.opacity='1';el('salon').focus();});
 },350);
}
function finishDemonBeauty(details,sudden=false){
 if(!story?.guest?.demon||story.demonSuccessLocked)return;
 const phase=story.guest.demonPhase;updateStoryHud('미용 결과');
 if(!details?.success){
  const lines=sudden?['얼굴에는<wait=0.35> <cps=22><size=20>손대지 말라고</size> 했을 텐데.</cps>','이 모욕은<wait=0.25> <size=22><shake=1.2 dur=0.6>야차로 갚게 하겠다!</shake></size>']:['…<wait=0.4>…<wait=0.45><cps=22>이게 <size=20>무엇이냐.</size></cps>','나를…<wait=0.55> <cps=24><size=20>웃음거리</size>로 만들 셈이냐?</cps>',['마왕 부하','폐하,<wait=0.2> 잠시 진정하시고—'],'<size=22><shake=1.5 dur=0.6>입 다물어라!</shake></size><wait=0.4> 이 모욕은<wait=0.25> <size=22><shake=1.2 dur=0.6>야차로 갚게 하겠다!</shake></size>'];
  playDemonLines(lines,()=>{modal('<h2>마왕이 야차를 신청했습니다.</h2><p>마왕 야차는 아직 연결하지 않았습니다.<br>팔로워와 스타를 유지한 채 미용을 다시 진행할 수 있습니다.</p><div class="actions">'+btn('demonRetryBeauty','미용 다시 하기',true)+btn('demonExit','메인으로')+'</div>');el('demonRetryBeauty').onclick=()=>{closeModal();changeDemonPhase(1);};el('demonExit').onclick=homeNow;});
  return;
 }
 if(phase===1){playDemonLines(['…<wait=0.3>…<wait=0.3>제법이군.<wait=0.45> 이제 <size=20>투구를 벗어도</size> 되겠어.'],()=>changeDemonPhase(2));return;}
 if(phase!==2)return;
 story.demonSuccessLocked=true;
 const active=story;story.outcome='beauty';
 story.demonEnding={ending:'beauty',form:'handsome',status:'returning',portrait:story.portrait,headPortrait:story.headPortrait};
 sendSalon('demon-applause');
 playDemonLines(["…<wait=0.3>…<wait=0.3>내가 요구한 것은<wait=0.25> <size=20>모두 해냈군.</size>","분노와 관용.<wait=0.35> 그리고 <size=20>왕의 품격</size>까지.<wait=0.45> 훗…<wait=0.3> 마음에 드는군."],()=>{
  if(story!==active)return;
  sendSalon('demon-finish',{portrait:story.portrait});
 });
}
// Hand the completed beauty branch to the ending flow only after the room is ready.
addEventListener('message',e=>{
 if(e.source!==el('salon').contentWindow||e.data?.token!==salonToken||e.data?.source!=='yachacha-salon'||e.data?.type!=='demon-room-ready')return;
 if(!story?.demonSuccessLocked||story.demonEnding?.status!=='returning')return;
 story.demonEnding.status='ready';updateStoryHud('미용 성공');el('storyHint').hidden=true;el('salon').focus();
 window.dispatchEvent(new CustomEvent('yachacha-ending-ready',{detail:copy(story.demonEnding)}));
});
function demonGameOver(){
 modal('<h2>GAME OVER</h2><p>마왕이 미용실을 지나쳤습니다.</p><div class="actions">'+btn('demonRestart','다시 시작',true)+btn('demonHome','메인으로')+'</div>');
 el('demonRestart').onclick=()=>{homeNow();chooseStoryStart(false);};el('demonHome').onclick=homeNow;
}
