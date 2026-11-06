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
 if(!story?.guest?.demon)return;
 const phase=story.guest.demonPhase;updateStoryHud('미용 결과');
 if(!details?.success){
  const lines=sudden?['얼굴에는 손대지 말라고 했을 텐데.','이 모욕은 야차로 갚게 하겠다!']:['……이게 무엇이냐.','나를… 웃음거리로 만들 셈이냐?',['마왕 부하','폐하, 잠시 진정하시고—'],'입 다물어라! 이 모욕은 야차로 갚게 하겠다!'];
  playDemonLines(lines,()=>{modal('<h2>마왕이 야차를 신청했습니다.</h2><p>마왕 야차는 아직 연결하지 않았습니다.<br>팔로워와 스타를 유지한 채 미용을 다시 진행할 수 있습니다.</p><div class="actions">'+btn('demonRetryBeauty','미용 다시 하기',true)+btn('demonExit','메인으로')+'</div>');el('demonRetryBeauty').onclick=()=>{closeModal();changeDemonPhase(1);};el('demonExit').onclick=homeNow;});
  return;
 }
 if(phase===1){playDemonLines(['……제법이군. 이제 투구를 벗어도 되겠어.'],()=>changeDemonPhase(2));return;}
 if(phase!==2)return;
 story.demonSuccessLocked=true;
 const active=story;story.demonEnding={ending:'beauty',form:'handsome',portrait:story.portrait,headPortrait:story.headPortrait};
 sendSalon('demon-applause');
 playDemonLines(['……내가 요구한 것은 모두 해냈군.','분노와 관용. 그리고 왕의 품격까지. 훗… 마음에 드는군.',['플레이어','그럼 기념사진 한 장만 같이 찍어주세요.'],'좋다. 백성들에게도 보여주도록 하지.'],()=>{
  if(story!==active)return;sendSalon('demon-finish',{portrait:story.portrait});
  playDemonLines([['플레이어','조금만 더 이쪽으로요. 왕관도 나오게!'],'이 거리에선 위엄이 다 담기지 않을 텐데.',['플레이어','그럼 조금 웃어주세요.']],()=>{
   if(story!==active)return;sendSalon('demon-photo');
   setTimeout(()=>{if(story!==active)return;playDemonLines(['……이 정도면 되겠나?'],()=>{
    if(story!==active)return;sendSalon('demon-shutter');
    setTimeout(()=>{if(story!==active)return;updateStoryHud('미용 성공 · 기념 셀카');el('storyHint').hidden=true;modal('<h2>마왕 미용 성공</h2><p>“그대의 솜씨, 왕의 이름으로 인정하지.”</p><p>완성한 모습 그대로, 마왕과 기념사진을 남겼습니다.</p><div class="actions">'+btn('demonViewPhoto','셀카 보기',true)+btn('demonFinishHome','메인으로')+'</div>');el('demonFinishHome').onclick=homeNow;el('demonViewPhoto').onclick=()=>{closeModal();sendSalon('demon-view-photo');};},1100);
   });},650);
  });
 });
}
function demonGameOver(){
 modal('<h2>GAME OVER</h2><p>마왕이 미용실을 지나쳤습니다.</p><div class="actions">'+btn('demonRestart','다시 시작',true)+btn('demonHome','메인으로')+'</div>');
 el('demonRestart').onclick=()=>{homeNow();chooseStoryStart(false);};el('demonHome').onclick=homeNow;
}
