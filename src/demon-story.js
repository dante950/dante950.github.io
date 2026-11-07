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
function playDemonResult(event,done){
 ensureDemonDialogueCatalogue(story.project);
 const source=story.project.guests.find(g=>g.id===DEMON_GUEST_ID),phase=story.guest.demonPhase;
 playGroup(story.project,story.guest,source.demonResultDialogue[phase][event],done);
}
function finishDemonBeauty(details,sudden=false){
 if(!story?.guest?.demon||story.demonSuccessLocked)return;
 const phase=story.guest.demonPhase;updateStoryHud('미용 결과');
 if(!details?.success){
  playDemonResult(sudden?'sudden':'fail',()=>{modal('<h2>마왕이 야차를 신청했습니다.</h2><p>마왕 야차는 아직 연결하지 않았습니다.<br>팔로워와 스타를 유지한 채 미용을 다시 진행할 수 있습니다.</p><div class="actions">'+btn('demonRetryBeauty','미용 다시 하기',true)+btn('demonExit','메인으로')+'</div>');el('demonRetryBeauty').onclick=()=>{closeModal();changeDemonPhase(1);};el('demonExit').onclick=homeNow;});
  return;
 }
 if(phase===1){playDemonResult('normal',()=>changeDemonPhase(2));return;}
 if(phase!==2)return;
 story.demonSuccessLocked=true;
 const active=story;story.outcome='beauty';
 story.demonEnding={ending:'beauty',form:'handsome',status:'returning',portrait:story.portrait,headPortrait:story.headPortrait};
 sendSalon('demon-applause');
 playDemonResult('normal',()=>{
  if(story!==active)return;
  sendSalon('demon-finish',{portrait:story.portrait,headPortrait:story.headPortrait});
 });
}
// Hand the completed beauty branch to the ending flow only after the room is ready.
addEventListener('message',e=>{
 if(e.source!==el('salon').contentWindow||e.data?.token!==salonToken||e.data?.source!=='yachacha-salon'||e.data?.type!=='demon-room-ready')return;
 if(!story?.demonSuccessLocked||story.demonEnding?.status!=='returning')return;
 story.demonEnding.status='ready';updateStoryHud('미용 성공');el('storyHint').hidden=true;el('salon').focus();
 window.dispatchEvent(new CustomEvent('yachacha-ending-ready',{detail:copy(story.demonEnding)}));
 startBeautyEnding();
});
function demonGameOver(){
 modal('<h2>GAME OVER</h2><p>마왕이 미용실을 지나쳤습니다.</p><div class="actions">'+btn('demonRestart','다시 시작',true)+btn('demonHome','메인으로')+'</div>');
 el('demonRestart').onclick=()=>{homeNow();chooseStoryStart(false);};el('demonHome').onclick=homeNow;
}
