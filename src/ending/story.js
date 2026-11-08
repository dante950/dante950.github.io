let beautyEndingSession=null;
function stopBeautyEnding(){
 const s=beautyEndingSession;if(s){s.cancelled=true;s.resolve?.();s.frame?.remove();}beautyEndingSession=null;
 document.body.classList.remove('beauty-ending');document.getElementById('endingRoomFade')?.remove();
}
function waitEndingRoom(scene){
 return new Promise(resolve=>{if(!beautyEndingSession)return resolve();beautyEndingSession.waiting=scene;beautyEndingSession.resolve=resolve;sendSalon('demon-ending-scene',{scene});});
}
function endingTalk(event){return new Promise(resolve=>{ensureDemonDialogueCatalogue(story.project);const source=story.project.guests.find(g=>g.id===DEMON_GUEST_ID);playGroup(story.project,story.guest,source.bindings[event],resolve);});}
async function startBeautyEnding(){
 if(beautyEndingSession||!story?.demonSuccessLocked)return;
 const s={story,cancelled:false,photo:null,token:token()};beautyEndingSession=s;story.demonEnding.status='playing';
 document.body.classList.add('beauty-ending');el('storyHint').hidden=true;
 story.guest.endingPortrait=story.headPortrait||story.portrait;
 const active=()=>beautyEndingSession===s&&!s.cancelled&&story===s.story;
 await endingTalk('endingScene0');if(!active())return;
 await waitEndingRoom('coffee');if(!active())return;
 await endingTalk('endingScene1');if(!active())return;
 await waitEndingRoom('group');if(!active())return;
 await endingTalk('endingScene2');if(!active())return;
 endingEffect('ending-shutter');await waitEndingRoom('photo');if(!active())return;
 endingEffect('ending-return');await waitEndingRoom('return');if(!active())return;
 const frame=document.createElement('iframe');frame.id='beautyEnding';frame.title='미용 성공 엔딩 · 인간세계 귀환';frame.allow='autoplay';frame.src='./ending.html?story='+encodeURIComponent(s.token);s.frame=frame;el('storyScreen').append(frame);
 if(gameAudio.track)gameAudio.track.gain.gain.setTargetAtTime(.12,gameAudio.ctx.currentTime,.5);
}
function endingEffect(key){
 if(key==='ending-music-fade'){if(gameAudio.track)gameAudio.track.gain.gain.setTargetAtTime(0,gameAudio.ctx.currentTime,.7);return;}
 if(!gameAudio.enabled||!gameAudio.ctx||!gameAudio.master)return;
 const ctx=gameAudio.ctx,now=ctx.currentTime;
 const tone=(hz,at,duration,volume,type='sine',end=hz)=>{
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(hz,now+at);o.frequency.exponentialRampToValueAtTime(end,now+at+duration);
  g.gain.setValueAtTime(.0001,now+at);g.gain.exponentialRampToValueAtTime(volume,now+at+.015);g.gain.exponentialRampToValueAtTime(.0001,now+at+duration);o.connect(g).connect(gameAudio.master);o.start(now+at);o.stop(now+at+duration+.03);o.onended=()=>{o.disconnect();g.disconnect();};
 };
 if(key==='ending-vibrate'){for(const at of [0,.18,.38])tone(75,at,.13,.07,'sawtooth');}
 else if(key==='ending-notify'){tone(880,0,.2,.08);tone(1320,.18,.45,.06);}
 else if(key==='ending-click')tone(1200,0,.06,.045,'square',600);
 else if(key.startsWith('ending-comment'))tone(1050,0,.13,.04,'sine',1450);
 else if(key==='ending-shutter'){tone(1800,0,.065,.09,'sawtooth',120);tone(500,.08,.08,.05,'square',100);}
 else if(key==='ending-return'){tone(180,0,2.8,.06,'sine',980);tone(360,.2,2.6,.04,'triangle',1960);}
}
addEventListener('message',e=>{
 const s=beautyEndingSession,m=e.data;if(!s||!story||story!==s.story)return;
 if(e.source===el('salon').contentWindow&&m?.source==='yachacha-salon'&&m.token===salonToken){
  if(m.type==='demon-ending-room-done'&&m.scene===s.waiting){if(m.photo)s.photo=m.photo;const done=s.resolve;s.resolve=null;s.waiting=null;done?.();}
  if(m.type==='demon-ending-shutter')endingEffect('ending-shutter');
  if(m.type==='demon-ending-error'){toast('엔딩 장면을 준비하지 못했습니다: '+m.message);}
 }
 if(e.source!==s.frame?.contentWindow||e.origin!==location.origin||m?.source!=='yachacha-ending'||m.token!==s.token)return;
 if(m.type==='ready')s.frame.contentWindow.postMessage({source:'yachacha-story',type:'init',token:s.token,ending:story.demonEnding.ending,records:copy(story.records||[]),social:copy(story.project.social),monologues:Object.fromEntries(['returnFarewell','returnAwake','returnMemory'].map(key=>[key,modelRows(story.project,'대사').filter(r=>r.GroupID===story.project.guests.find(g=>g.id===10007).bindings[key]).sort((a,b)=>a.Order-b.Order).map(r=>r.Text).join('\n')])),photo:s.photo,headPortrait:story.headPortrait,settings:story.starSettings,socialChoices:story.socialChoices||{},muted:!soundOn},location.origin);
 if(m.type==='sound')endingEffect(m.key);
 if(m.type==='mute'){soundOn=!m.muted;gameAudio.enable(soundOn);el('soundToggle').textContent=soundOn?'소리 켜짐 ♪':'소리 꺼짐';}
 if(m.type==='pause'&&gameAudio.track)gameAudio.track.gain.gain.setTargetAtTime(m.paused?0:.12,gameAudio.ctx.currentTime,.12);
 if(m.type==='replay'&&gameAudio.track)gameAudio.track.gain.gain.setTargetAtTime(.12,gameAudio.ctx.currentTime,.3);
 if(m.type==='complete')story.demonEnding.status='complete';
 if(m.type==='home')homeNow();
});

async function startBattleVictoryEnding(){
 if(beautyEndingSession||!story?.demonSuccessLocked)return;
 const s={story,cancelled:false,photo:null,token:token()};beautyEndingSession=s;story.demonEnding.status='playing';document.body.classList.add('beauty-ending');el('storyHint').hidden=true;
 const active=()=>beautyEndingSession===s&&!s.cancelled&&story===s.story;
 await endingTalk('endingScene3');if(!active())return;
 await waitEndingRoom('loyalty');if(!active())return;
 await endingTalk('endingScene4');if(!active())return;
 await waitEndingRoom('coffee');if(!active())return;
 await endingTalk('endingScene5');if(!active())return;
 await waitEndingRoom('group');if(!active())return;
 await endingTalk('endingScene6');if(!active())return;
 // Play the supplied phone animation once, alongside the player's shooting line.
 await Promise.all([waitEndingRoom('camera'),endingTalk('endingScene7')]);if(!active())return;
 await waitEndingRoom('photo');if(!active())return;
 await endingTalk('endingScene8');if(!active())return;
 endingEffect('ending-return');await waitEndingRoom('portal');if(!active())return;
 await endingTalk('endingScene9');if(!active())return;
 await waitEndingRoom('depart');if(!active())return;
 await gameAudio.music('salon');if(!active())return;if(gameAudio.track)gameAudio.track.gain.gain.setTargetAtTime(.12,gameAudio.ctx.currentTime,.5);
 const frame=document.createElement('iframe');frame.id='beautyEnding';frame.title='야차 승리 엔딩 · 인간세계 귀환';frame.allow='autoplay';frame.src='./ending.html?story='+encodeURIComponent(s.token);s.frame=frame;el('storyScreen').append(frame);
}
