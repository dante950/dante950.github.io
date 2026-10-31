import {GUESTS,OUTCOMES,DEFAULT_SETTINGS,createRun,nextGuest,completeVisit,canClose,closingSummary,closeDay,nextDay,runFromStory} from './model.js';
import {REVIEW_COPY,reviewPost,closingExitAction} from './social-model.js';
import {createSocialPhone,photoMarkup,phoneFrameMarkup} from './social-ui.js';

const $=id=>document.getElementById(id),fmt=n=>Math.round(n).toLocaleString('ko-KR');
const ART={salon:'./media/closing-salon.png',upgrade:'./media/closing-upgrade.png',zombie:'./media/5b433c40abe0135346bc3d4a.png',sans:'./media/b749b05d33003554c844eab2.png',zombiePost:'./media/51e1a320f21fd4fcfad6d5f8.png'};
const DEFAULT_CHOICES={zombie:'beauty',sans:'forcedWin',minion:'offerWin'};
const DEFAULT_COPY=Object.fromEntries(Object.entries(REVIEW_COPY).map(([id,c])=>[id,{beauty:c.beauty,battle:c.battle}]));
let choices={...DEFAULT_CHOICES},copies=structuredClone(DEFAULT_COPY),settings=structuredClone(DEFAULT_SETTINGS);
const storyToken=new URLSearchParams(location.search).get('story');
const storyMode=!!storyToken&&parent!==window;
let storyInitialized=false,tutorialMode=false,closeAfterRegistration=false;
function storyMessage(type){parent.postMessage({source:'yachacha-closing',token:storyToken,type,socialChoices:phone.selected},location.origin);}
if(storyMode){document.body.classList.add('story-mode');$('settingsOpen').hidden=true;$('restart').hidden=true;document.querySelector('.toolbar .title b').textContent='오늘의 영업 마감';document.querySelector('.lab-label').textContent='본편 플레이';}
const DEFAULT_SPEED=1.5;
let run=createRun(),summary=null,index=0,epoch=0,busy=false,quick=true,startDay=1,speed=DEFAULT_SPEED,sound=false,audio=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const stage=$('stage'),star=$('starCanvas').getContext('2d'),fx=$('particles').getContext('2d');
const cancelled=Symbol('cancelled');
function guard(token){if(token!==epoch)throw cancelled;}
function pause(ms,token){return new Promise(resolve=>setTimeout(resolve,ms/speed)).then(()=>guard(token));}
function action(fn){return (...args)=>Promise.resolve().then(()=>fn(...args)).catch(error=>{if(error===cancelled)return;console.error(error);busy=false;setStatus('연출을 불러오지 못했어요. 다시 보기를 눌러 주세요.');if(!$('loading').hidden){$('loading').querySelector('b').textContent='리소스를 불러오지 못했어요';$('loading').querySelector('span').textContent='인터넷 연결을 확인하고 다시 불러와 주세요.';const retry=document.createElement('button');retry.textContent='다시 불러오기';retry.onclick=()=>location.reload();$('loading').append(retry);}});}
function setStatus(text){$('status').textContent=text;}
function phase(name){stage.dataset.phase=name;stage.dataset.day=run.day;stage.dataset.actualFollowers=run.total;stage.dataset.stars=run.stars;}
function show(id,yes=true){$(id).hidden=!yes;}
function resize(){if(storyMode){const width=Math.min(innerWidth,innerHeight*16/9);$('viewport').style.width=width+'px';$('viewport').style.height=width*9/16+'px';stage.style.transform=`scale(${width/1280})`;return;}const vp=$('viewport'),available=document.querySelector('main').clientWidth-(innerWidth<650?16:innerWidth<950?28:60);const limit=innerWidth<650?Infinity:Math.max(200,innerHeight-174);const width=Math.min(available,limit*16/9);vp.style.width=width+'px';vp.style.height=width*9/16+'px';stage.style.transform=`scale(${width/1280})`;}
addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);
function beep(frequency=440,duration=.06,type='square',gain=.025){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),volume=audio.createGain(),t=audio.currentTime;osc.type=type;osc.frequency.value=frequency;volume.gain.setValueAtTime(gain,t);volume.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(volume);volume.connect(audio.destination);osc.start(t);osc.stop(t+duration);}catch{sound=false;$('sound').textContent='♪ 소리 사용 불가';}}
function chord(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.25,'triangle',.08),i*85));}
function drawStar(total){const ratio=Math.min(1,total/settings.threshold),points=[[20,1],[25,13],[38,15],[28,24],[31,38],[20,31],[8,38],[11,24],[1,15],[15,13]];star.clearRect(0,0,40,40);star.beginPath();points.forEach(([x,y],i)=>i?star.lineTo(x,y):star.moveTo(x,y));star.closePath();star.fillStyle='#1e172c';star.fill();star.save();star.clip();star.fillStyle='#8a8193';star.fillRect(0,0,40,40);star.fillStyle='#f5c847';star.fillRect(0,40*(1-ratio),40,40*ratio);star.fillStyle='#ffe484';star.fillRect(0,Math.floor(40*(1-ratio)),40,2);star.restore();star.strokeStyle='#291c39';star.lineWidth=2;star.stroke();star.fillStyle='#fff1ba';if(ratio>.9){star.fillRect(19,8,2,5);star.fillRect(17,12,2,2);}$('starPercent').textContent=Math.floor(ratio*100)+'%';$('starRemaining').textContent=total>=settings.threshold?'1스타 목표 달성!':'1스타까지 '+fmt(settings.threshold-total)+'명';$('starCanvas').setAttribute('aria-label',`1스타 진행률 ${Math.floor(ratio*100)}퍼센트`);}
function displayed(total,gain){stage.dataset.displayedFollowers=Math.round(total);$('totalCount').textContent=fmt(total);$('todayCount').textContent='+'+fmt(total-summary.start);$('currentGain').textContent='+'+fmt(gain);drawStar(total);}
function particles(time,burst=false){fx.clearRect(0,0,320,180);if(reduced.matches)return;for(let n=0;n<(burst?36:12);n++){const p=((time/1300+n*.127)%1),x=burst?200+Math.cos(n*2.4)*p*110:122+p*80,y=burst?70+Math.sin(n*2.4)*p*55+p*p*30:95-Math.sin(p*Math.PI)*30+(n%4)*3;fx.globalAlpha=1-p;fx.fillStyle=n%3?'#ffd570':'#f386ae';fx.fillRect(Math.round(x),Math.round(y),n%3?1:2,2);}fx.globalAlpha=1;}
// These are the content being previewed. Reduced motion still removes decorative
// particles and idle animation, but must not turn the requested count/scroll into a cut.
const COUNT_MS=6000,FEED_SCROLL_MS=1800;
const smooth=p=>p*p*(3-2*p);
function animateCount(visit,token){
 const duration=COUNT_MS/speed;
 return new Promise((resolve,reject)=>{
  let begin=null,lastTick=-1;
  function frame(t){
   if(token!==epoch){reject(cancelled);return;}
   begin??=t;
   const p=Math.min(1,(t-begin)/duration),gain=Math.round(visit.gain*smooth(p));
   displayed(visit.before+gain,gain);particles(t-begin);
   const tick=Math.floor(p*24);
   if(tick!==lastTick&&p<1){lastTick=tick;beep(300+tick*18,.035,'square',.009);}
   if(p<1)requestAnimationFrame(frame);
   else{fx.clearRect(0,0,320,180);resolve();}
  }
  requestAnimationFrame(frame);
 });
}
function scrollFeed(which,token){
 const feed=$('feed'),posts=feed.children;
 const from=new DOMMatrixReadOnly(getComputedStyle(feed).transform).m42;
 const to=-(posts[which].offsetTop-posts[0].offsetTop),duration=FEED_SCROLL_MS/speed;
 feed.style.transition='none';
 return new Promise((resolve,reject)=>{
  let begin=null;
  function frame(t){
   if(token!==epoch){reject(cancelled);return;}
   begin??=t;
   const p=Math.min(1,(t-begin)/duration);
   feed.style.transform=`translateY(${from+(to-from)*smooth(p)}px)`;
   if(p<1)requestAnimationFrame(frame);else resolve();
  }
  requestAnimationFrame(frame);
 });
}
function escape(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function post(visit){const p=reviewPost(visit);return `<article class="post" data-visit="${visit.id}"><div class="post-person"><div><b>${escape(p.user)}</b><small>${visit.day===0?'튜토리얼':'DAY '+visit.day} · ${escape(p.place)}${p.draft?' · 임시 후기':''}</small></div></div>${photoMarkup(p)}<div class="post-actions"><span>♥ ♡</span><span>⌑</span></div><p class="post-copy">${escape(p.kind?(copies[visit.guestId]?.[p.kind]??p.text):p.text)}</p></article>`;}
$('phone').innerHTML=phoneFrameMarkup('<div class="feed-viewport"><div id="feed" class="feed"></div></div>').replace('data-home','data-review-home').replace('data-back','data-review-back');
$('phone').querySelector('.phone-app-title').textContent='monstagram';
// The receipt sequence can only be advanced with its dedicated review button.
$('phone').querySelectorAll('[data-review-home],[data-review-back]').forEach(button=>{button.disabled=true;button.setAttribute('aria-label',button.getAttribute('aria-label')+' · 정산 중 사용 불가');});
let managementReviewed=false,exitPending=false;
const phone=createSocialPhone(stage,{getRun:()=>run,onManagement:()=>action(openManagement)(),onExit:()=>action(exitPhone)(),onRegistration:()=>{if(closeAfterRegistration){phone.hide();action(close)();}else storyMessage('registration-complete');}});
function phoneHome(initialView='home'){busy=false;show('settlement',false);show('finishBanner',false);phase('phone');phone.show(managementReviewed,initialView);setStatus('몬스타그램을 둘러보거나 가게 관리에서 오늘의 정산을 확인하세요.');}
async function openManagement(){if(busy||managementReviewed)return;busy=true;phone.hide();await openReview(epoch);}
async function exitPhone(){if(busy)return;exitPending=true;if(closingExitAction(managementReviewed)==='management')await openManagement();else{phone.hide();await advanceDay(epoch);}}
async function completeManagement(token){busy=true;phase('finish');const awarded=summary.eligibleForStar&&!managementReviewed;$('finishBanner').classList.toggle('award',awarded);$('finishEyebrow').textContent=awarded?'YOUR FIRST STAR':'TODAY’S FOLLOWERS';$('finishTitle').textContent=awarded?'★ 첫 번째 스타 획득!':'오늘도 한 걸음 더!';$('finishMessage').textContent=`오늘 +${fmt(summary.gain)}명 · 누적 ${fmt(run.total)}명`;show('finishBanner');if(awarded)chord();await pause(1900,token);managementReviewed=true;hud();show('finishBanner',false);if(exitPending)await advanceDay(token);else phoneHome();}

function hud(){$('hudDay').textContent=tutorialMode?'튜토리얼':String(run.day).padStart(2,'0');$('hudTotal').textContent=fmt(run.total);$('hudStar').textContent=run.stars;$('hudStar').setAttribute('aria-label',`${run.stars}스타`);stage.dataset.actualFollowers=run.total;stage.dataset.stars=run.stars;}
function clearScene(){phone.hide();for(const id of ['settlement','closeBanner','finishBanner','calendarScreen','upgradeLoading','ending','retryPanel','visitPanel','closeShop','upgradeSign'])show(id,false);$('blackout').classList.remove('dark');$('receipt').classList.remove('visible');$('salonBackground').style.backgroundImage=`url('${ART.salon}')`;$('calendarLeaf').classList.remove('flip');fx.clearRect(0,0,320,180);}
function renderSalon(){phase('salon');hud();const ready=storyMode||canClose(run),guest=storyMode?null:nextGuest(run);show('closeShop',ready);show('visitPanel',!ready&&!!guest);show('retryPanel',false);if(guest){$('visitName').textContent=guest.name;$('visitOutcome').textContent=OUTCOMES[choices[guest.id]];}$('completeGuest').disabled=false;setStatus(ready?`DAY ${run.day} · 영업 종료를 눌러 오늘의 후기를 확인하세요.`:`DAY ${run.day} · ${guest?.name||''}의 결과를 시험해 보세요.`);}
function applyGuest(outcome){const guest=nextGuest(run);if(!guest)return false;const result=completeVisit(run,guest.id,outcome||choices[guest.id]);run=result.run;hud();if(result.reason==='retry'){show('retryPanel');show('visitPanel',false);phase('retry');setStatus(`${guest.name} · 강제 야차 패배. 팔로워 지급 없이 재도전합니다.`);return false;}beep(650,.13,'triangle',.04);return !!result.visit;}
function prepareDay(){managementReviewed=false;exitPending=false;renderSalon();if(quick){while(nextGuest(run)){if(!applyGuest())return;}renderSalon();}}
function begin(){phone.reset();managementReviewed=false;exitPending=false;epoch++;busy=false;summary=null;index=0;run=createRun(settings);if(startDay===2){while(nextGuest(run))applyGuest(choices[nextGuest(run).id]);run=nextDay(closeDay(run));}clearScene();show('loading',false);prepareDay();resize();}
async function openReview(token){phase('review');show('closeBanner',false);show('settlement');$('feed').style.transition='none';$('feed').style.transform='translateY(0)';$('feed').innerHTML=summary.visits.map(post).join('');$('receipt').classList.remove('visible');displayed(summary.start,0);await review(0,token,true);}
async function review(which,token,first=false){
 busy=true;index=which;const visit=summary.visits[index];
 $('nextReview').disabled=true;
 if(!first){
  $('nextReview').textContent='다음 후기로 이동 중…';
  $('reviewHint').textContent='다음 손님의 게시글을 올려 보고 있어요.';
  beep(470,.07);
  await scrollFeed(index,token);
 }
 $('reviewIndex').textContent=`${String(index+1).padStart(2,'0')} / ${String(summary.visits.length).padStart(2,'0')}`;
 $('currentName').textContent=visit.name+'의 후기';
 $('bonusLabel').textContent=visit.bonus?`기본 ${fmt(visit.base)} + 야차 보너스 ${fmt(visit.bonus)}`:'기본 팔로워 '+fmt(visit.base);
 displayed(visit.before,0);
 $('nextReview').textContent='팔로워가 모이는 중…';
 $('reviewHint').textContent='후기를 통해 새 팔로워가 찾아오고 있어요.';
 await pause(650,token);$('receipt').classList.add('visible');await pause(300,token);
 await animateCount(visit,token);
 beep(880,.18,'triangle',.05);busy=false;$('nextReview').disabled=false;
 $('nextReview').textContent=index<summary.visits.length-1?'다음 후기 →':exitPending?'다음 날로 →':'홈으로 돌아가기 →';
 $('reviewHint').textContent=index<summary.visits.length-1?'후기를 읽고, 다음 손님의 이야기로 넘어가세요.':'오늘 도착한 후기를 모두 확인했어요.';
 setStatus(`${visit.name} · +${fmt(visit.gain)}명. 다음 진행을 기다리고 있어요.`);
}
async function close(){if(busy||(!storyMode&&!canClose(run)))return;busy=true;const token=epoch;summary=closingSummary(run);if(storyMode){summary.eligibleForStar=run.day===2&&run.total>=settings.threshold;run={...run,status:'closed',stars:summary.eligibleForStar?1:run.stars};}else run=closeDay(run);phase('closing');show('closeShop',false);show('visitPanel',false);$('closedDay').textContent=tutorialMode?'연습':run.day;$('closingGreeting').textContent='수고했어요, '+phone.selected.__state.nickname+'님!';show('closeBanner');setStatus('오늘의 영업이 끝났습니다.');beep(220,.2,'triangle',.07);await pause(1600,token);show('closeBanner',false);phoneHome('management');}
async function advanceDay(token){busy=true;phone.hide();$('blackout').classList.add('dark');await pause(750,token);show('settlement',false);show('finishBanner',false);phase('calendar');$('oldDay').textContent=tutorialMode?'튜토리얼':run.day;$('newDay').textContent=run.day+1;show('calendarScreen');$('calendarLeaf').classList.remove('flip');await pause(500,token);$('calendarLeaf').classList.add('flip');beep(150,.1,'triangle',.08);await pause(1700,token);if(tutorialMode){storyMessage('next-day');return;}run=nextDay(run);show('calendarScreen',false);if(run.status==='ending'){await ending(token);}else if(storyMode){storyMessage('next-day');}else{clearScene();prepareDay();busy=false;}}
async function upgradeLoading(token){
 phase('upgrading');
 const message='미용실 업그레이드 중...',letters=Array.from(message),cycle=letters.length*240+720;
 $('upgradeLoadingText').replaceChildren(...letters.map((letter,i)=>{
  const span=document.createElement('span');span.className='upgrade-letter';span.textContent=letter;
  span.style.animationDuration=(cycle/speed)+'ms';span.style.animationDelay=(i*240/speed)+'ms';
  return span;
 }));
 show('upgradeLoading');setStatus(message);
 await pause(4800,token);
 show('upgradeLoading',false);
}
async function ending(token){
 const award=run.stars>0;
 if(award)await upgradeLoading(token);
 phase('ending');hud();show('closeShop',false);show('visitPanel',false);
 $('salonBackground').style.backgroundImage=`url('${award?ART.upgrade:ART.salon}')`;
 show('upgradeSign',award);
 $('ending').querySelector('h2').innerHTML=award?'우리 미용실에<br>첫 번째 별이 떴어요.':'오늘의 이야기를<br>함께해 주셔서 감사해요.';
 $('ending').querySelector('.ending-star').textContent=award?'★':'☆';
 $('ending').querySelector('small').textContent=award?'YOUR FIRST STAR, YOUR NEXT CHAPTER':'THANK YOU FOR PLAYING';
 $('ending').querySelector('span').textContent=award?'미용실의 다음 모습, 곧 만나요.':`1스타까지 ${fmt(settings.threshold-run.total)}명 · 설정을 바꿔 다시 시험할 수 있어요.`;
 $('blackout').classList.remove('dark');
 setStatus(award?'DAY 3 · 업그레이드 미리보기. 이 장면은 감상만 할 수 있어요.':'정산 완료 · 이번 설정은 1스타 기준에 도달하지 않았어요.');
 await pause(2200,token);show('ending');if(award)chord();busy=false;if(storyMode){const home=document.createElement('button');home.className='pixel-button';home.textContent='메인으로';home.onclick=()=>storyMessage('home');$('ending').append(home);}
}
function readForm(mode){if(!$('settingsForm').reportValidity())return;const nextChoices=Object.fromEntries(GUESTS.map(g=>[g.id,$('result-'+g.id).value])),day=Number($('startDay').value);if(day===2&&GUESTS.filter(g=>g.day===1).some(g=>nextChoices[g.id]==='forcedLoss')){$('settingsError').textContent='2일차부터 보려면 1일차 두 손님의 결과를 완료 상태로 바꿔 주세요. 강제 야차 패배는 재도전이 필요해요.';return;}settings={threshold:Number($('threshold').value),bonus:Number($('bonus').value),base:Object.fromEntries(GUESTS.map(g=>[g.id,Number($('base-'+g.id).value)]))};copies=Object.fromEntries(GUESTS.map(g=>[g.id,Object.fromEntries(['beauty','battle'].map(kind=>[kind,$('copy-'+g.id+'-'+kind).value]))]));choices=nextChoices;startDay=day;speed=Number($('speed').value);quick=mode;$('settings').close();begin();}
function fillForm(values={settings,choices,copies,startDay,speed}){const {settings,choices,copies,startDay,speed}=values;$('startDay').value=startDay;$('speed').value=speed;$('threshold').value=settings.threshold;$('bonus').value=settings.bonus;$('settingsError').textContent='';$('guestSettings').innerHTML=GUESTS.map(g=>`<div class="guest-setting"><label>${g.name}<select id="result-${g.id}" aria-label="${g.name} 결과">${Object.entries(OUTCOMES).map(([key,label])=>`<option value="${key}" ${choices[g.id]===key?'selected':''}>${label}</option>`).join('')}</select></label><small>DAY ${g.day}${g.id==='minion'?' · 후기 원본 연결':''} · 시연용 결과 선택</small></div>`).join('');$('baseSettings').innerHTML=GUESTS.map(g=>`<label>${g.name}<input id="base-${g.id}" type="number" min="0" max="99999" required value="${settings.base[g.id]}"></label>`).join('');$('reviewSettings').innerHTML=GUESTS.map(g=>['beauty','battle'].map(kind=>`<label>${g.name} · ${kind==='beauty'?'미용':'야차'} 후기<textarea id="copy-${g.id}-${kind}" maxlength="220">${escape(copies[g.id][kind])}</textarea></label>`).join('')).join('');}
$('closeShop').onclick=action(close);
$('nextReview').onclick=action(async()=>{if(busy||stage.dataset.phase!=='review')return;busy=true;const token=epoch;if(index+1<summary.visits.length)await review(index+1,token);else await completeManagement(token);});
$('completeGuest').onclick=()=>{if(busy||stage.dataset.phase!=='salon')return;if(applyGuest())renderSalon();};
$('retryBattle').onclick=()=>{if(stage.dataset.phase!=='retry')return;if(applyGuest('forcedWin'))prepareDay();};
$('restart').onclick=()=>{if($('loading').hidden)begin();};
$('settingsOpen').onclick=()=>{fillForm();$('settings').showModal();};$('settingsClose').onclick=()=>$('settings').close();
$('settingsForm').onsubmit=e=>{e.preventDefault();readForm(true);};$('manualStart').onclick=()=>readForm(false);
$('defaults').onclick=()=>fillForm({settings:DEFAULT_SETTINGS,choices:DEFAULT_CHOICES,copies:DEFAULT_COPY,startDay:1,speed:DEFAULT_SPEED});
$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',sound);$('sound').textContent=sound?'♪ 소리 끄기':'♪ 소리 켜기';if(sound)beep(660,.14,'triangle',.07);};
$('fullscreen').onclick=action(async()=>{if(document.fullscreenElement)await document.exitFullscreen();else if(document.body.requestFullscreen)await document.body.requestFullscreen();else setStatus('이 브라우저에서는 전체 화면을 지원하지 않아요. 가로 화면으로 확인해 주세요.');});
addEventListener('keydown',e=>{if($('settings').open||e.repeat||!['Enter',' '].includes(e.key)||/INPUT|SELECT|TEXTAREA|BUTTON|A/.test(document.activeElement?.tagName))return;e.preventDefault();if(!busy&&stage.dataset.phase==='review')$('nextReview').click();else if(stage.dataset.phase==='salon'&&(storyMode||canClose(run)))$('closeShop').click();});
resize();
action(async()=>{await Promise.all([ART.salon,ART.upgrade,ART.zombie,ART.sans,ART.zombiePost].map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=()=>reject(Error('Missing image '+src));img.src=src;})));await document.fonts.ready;if(storyMode){storyMessage('ready');}else begin();})().catch(()=>{});

addEventListener('message',e=>{
 const m=e.data;if(!storyMode||storyInitialized||e.source!==parent||e.origin!==location.origin||m?.source!=='yachacha-story'||m.token!==storyToken||m.type!=='init')return;
 if(!([1,2].includes(m.day)||(m.day===0&&m.tutorial===true))||!Array.isArray(m.records))return;
 storyInitialized=true;tutorialMode=m.day===0&&m.tutorial===true;document.body.classList.toggle('tutorial-mode',tutorialMode);phone.setWeather(m.day,m.weather);run=runFromStory(m.records,m.day);phone.restore(m.socialChoices);settings=run.settings;clearScene();show('loading',false);renderSalon();resize();
 if(tutorialMode){document.querySelector('.toolbar .title b').textContent='첫 손님의 하루 마감';document.querySelector('.lab-label').textContent='튜토리얼';document.querySelector('#closeBanner .mini-calendar small').textContent='TUTORIAL';}
 if(tutorialMode&&m.registration===true){closeAfterRegistration=m.autoClose===true&&run.visits.some(v=>v.guestId==='coffee'&&!v.skipped);show('closeShop',false);show('visitPanel',false);phase('registration');phone.showRegistration();return;}
 if(tutorialMode&&m.autoClose===true)action(close)();
});
