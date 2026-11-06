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
 const active=story;el('salon').style.transition='opacity .35s';el('salon').style.opacity='0';
 setTimeout(()=>{
  if(story!==active)return;
  story.demonPhase=phase;story.guest=installDemonDialogue(story.project,demonGuest(phase));story.beautyDetails=null;
  loadSalon(story.guest,'story',()=>{if(story!==active)return;sendSalon('beauty-start');updateStoryHud('미용');el('salon').style.opacity='1';el('salon').focus();});
 },350);
}
function finishDemonBeauty(details,sudden=false){
 if(!story?.guest?.demon)return;
 const phase=story.guest.demonPhase;updateStoryHud('미용 결과');
 if(!details?.success){
  const lines=sudden?['얼굴에는 손대지 말라고 했을 텐데.','이 모욕은 야차로 갚게 하겠다!']:['……이게 무엇이냐.','나를… 웃음거리로 만들 셈이냐?',['마왕 부하','폐하, 잠시 진정하시고—'],'입 다물어라! 이 모욕은 야차로 갚게 하겠다!'];
  playDemonLines(lines,()=>{modal('<h2>마왕이 야차를 신청했습니다.</h2><p>마왕 야차는 아직 연결하지 않았습니다.<br>팔로워와 스타를 유지한 채 미용을 다시 진행할 수 있습니다.</p><div class="actions">'+btn('demonRetryBeauty','미용 다시 하기',true)+btn('demonExit','메인으로')+'</div>');el('demonRetryBeauty').onclick=()=>{closeModal();changeDemonPhase(1);};el('demonExit').onclick=homeNow;});
  return;
 }
 if(phase===1){playDemonLines(['……제법이군. 이제 투구를 벗어도 되겠어.'],()=>changeDemonPhase(2));return;}
 if(phase===2){
  story.demonSuccessLocked=true;
  sendSalon('demon-applause');
  playDemonLines(['……내가 요구한 것은 모두 해냈군.','하지만 그대에게 아직 보여주지 못한 모습이 있다.','그대의 솜씨는 충분히 보았다.','이제는…… 내 진짜 모습을 맡기고 싶군.'],()=>changeDemonPhase(3));return;
 }
 story.demonEnding={ending:'beauty',portrait:story.portrait,headPortrait:story.headPortrait};sendSalon('demon-finish',{portrait:story.portrait});
 playDemonLines(['훗. 이런 차림은 처음이군.',['마왕 부하','그럼 약속대로… 원래 세계로 돌려보내 드리겠습니다.'],['커피 유령','잠깐! 가기 전에 사진 한 장 찍어요!']],()=>{
  sendSalon('demon-photo');
  setTimeout(()=>playDemonLines([['마왕 부하','모두, 이쪽을 봐 주십시오.']],()=>{sendSalon('demon-shutter');setTimeout(()=>{modal('<h2>마왕 미용 성공</h2><p>그대의 솜씨, 잊지 않겠네.</p><div class="actions">'+btn('demonFinishHome','메인으로',true)+'</div>');el('demonFinishHome').onclick=homeNow;},800);}),350);
 });
}
function demonGameOver(){
 modal('<h2>GAME OVER</h2><p>마왕이 미용실을 지나쳤습니다.</p><div class="actions">'+btn('demonRestart','다시 시작',true)+btn('demonHome','메인으로')+'</div>');
 el('demonRestart').onclick=()=>{homeNow();chooseStoryStart(false);};el('demonHome').onclick=homeNow;
}
