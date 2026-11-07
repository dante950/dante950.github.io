// Story orchestration only; the salon iframe is the same one used by every guest.
let demonSkins={};
function startDemonVisit(){
 stopChildren();closeModal();talk=null;el('talkLayer').hidden=true;story.day=4;story.index=0;story.demonPhase=1;story.demonSuccessLocked=false;story.demonEnding=null;story.outcome=null;story.demonBattleEnding=false;
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
  playDemonResult(sudden?'sudden':'fail',()=>{story.outcome=null;startBattle();});
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
 story.demonEnding.status='ready';updateStoryHud(story.demonEnding.ending==='battle'?'야차 승리':'미용 성공');el('storyHint').hidden=true;el('salon').focus();
 window.dispatchEvent(new CustomEvent('yachacha-ending-ready',{detail:copy(story.demonEnding)}));
 if(story.demonEnding.ending==='battle'){const active=story,fade=document.getElementById('endingRoomFade');if(fade)fade.style.opacity='0';setTimeout(()=>{fade?.remove();if(story===active)startBattleVictoryEnding();},500);}else startBeautyEnding();
});
function demonGameOver(){
 modal('<h2>GAME OVER</h2><p>마왕이 미용실을 지나쳤습니다.</p><div class="actions">'+btn('demonRestart','다시 시작',true)+btn('demonHome','메인으로')+'</div>');
 el('demonRestart').onclick=()=>{homeNow();chooseStoryStart(false);};el('demonHome').onclick=homeNow;
}

function stopDemonBattleMusic(){gameAudio.wanted=null;gameAudio.epoch++;if(gameAudio.track){try{gameAudio.track.src.stop();}catch{}gameAudio.track=null;}}
async function finishDemonBattle(outcome,stats){
 if(!story?.guest?.demon||story.demonBattleEnding)return;const active=story;story.stats=stats;stopDemonBattleMusic();
 if(outcome==='defeat'){
  story.outcome=null;el('storyBattle').srcdoc='';combatFrame=null;el('battleHost').hidden=true;document.body.classList.remove('inBattle');
  showBattleResult({outcome,monsterID:10007,portrait:'./media/demon-battle/demon_idle1.png',canAccept:false,onRetry:()=>{if(story===active)startBattle();},onRetryBeauty:()=>{if(story!==active)return;story.demonBattleEnding=false;story.outcome=null;gameAudio.music('salon');changeDemonPhase(1);}});return;
 }
 story.demonBattleEnding=true;story.outcome='victory';story.demonSuccessLocked=true;document.body.classList.add('beauty-ending');
 story.guest.endingPortrait='./media/demon-battle/goblin-portrait.png';
 await endingTalk([['몬스터','……내가 졌다.'],['몬스터','환영도, 허세도 없이… 내 힘을 다했다.'],['몬스터','그런데도 네가 이겼군.']]);if(story!==active)return;
 gameAudio.effect('clash');
 await new Promise(resolve=>{const dispose=showBattleResult({outcome:'victory',monsterID:10007,onContinue:resolve});setTimeout(()=>{dispose();resolve();},1500);});if(story!==active)return;
 const fade=document.createElement('div');fade.id='endingRoomFade';fade.style.cssText='position:fixed;inset:0;background:#000;z-index:100;pointer-events:none;opacity:0;transition:opacity .5s';document.body.append(fade);requestAnimationFrame(()=>fade.style.opacity='1');
 await new Promise(r=>setTimeout(r,520));if(story!==active){fade.remove();return;}
 el('storyBattle').srcdoc='';combatFrame=null;el('battleHost').hidden=true;document.body.classList.remove('inBattle');
 story.demonEnding={ending:'battle',form:'goblin',status:'returning'};sendSalon('demon-battle-return');
 // Fade-in waits for the authenticated room-ready message.
}
