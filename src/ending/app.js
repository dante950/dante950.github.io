import {parseDialogueText,dialogueGlyphStyle} from '../text-effects.js';
import {ENDING_CREDITS,ENDING_POST,ENDING_COMMENTS,BATTLE_ENDING_NEWS,BATTLE_ENDING_COMMENTS,endingReviews,endingSchedule,battleNewsSchedule} from './model.js';
import {runFromStory} from '../closing/model.js';
import {createSocialPhone,photoMarkup} from '../closing/social-ui.js';
const endingToken=new URLSearchParams(location.search).get('story'),E=id=>document.getElementById(id);
let endingData=null,endingTime=0,endingLast=0,endingPaused=false,endingMuted=false,endingRaf=0,endingPhone=null,endingPosts=[],endingPlan=null,endingPhotoIndex=0,endingCreditIndex=-1,endingSounds=new Set(),endingNewsPlan=null,endingNewsOverflow=0;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
function endingMessage(type,extra={}){parent.postMessage({source:'yachacha-ending',type,token:endingToken,...extra},location.origin);}
function resizeEnding(){document.documentElement.style.setProperty('--ending-scale',Math.min(innerWidth/1200,innerHeight/675));}
addEventListener('resize',resizeEnding);resizeEnding();
function endingSound(key){if(endingSounds.has(key))return;endingSounds.add(key);endingMessage('sound',{key});}
function endingCard(p,group=false){
 return '<article class="ending-post '+((p.photo||p.groupPhoto)&&group?'ending-news':'')+'" data-review="'+esc(p.id)+'"><div class="post-card"><header><b>'+esc(p.user)+'</b><small>'+esc(p.place||'몬스터 헤어살롱')+'</small></header>'+
 (group?'<div class="ending-group">'+(!p.photo&&endingData.ending!=='battle'?'<div class="ending-artwork">':'')+'<img src="'+esc(p.photo||(endingData.ending==='battle'?endingData.photo:'./media/social/imported/reviews/demon-beauty.png'))+'" alt="'+(p.photo?'고블린 모습의 마왕':endingData.ending==='battle'?'고블린 마왕과 주인공, 마왕 부하, 커피유령의 단체사진':'플레이어가 꾸민 마왕과 주인공, 마왕 부하, 커피유령의 단체사진')+'">'+(!p.photo&&endingData.ending!=='battle'?'<img class="ending-beauty-head" src="'+esc(endingData.headPortrait||'./media/demon/face.png')+'" alt="손질한 마왕의 모습"></div>':'')+'</div>':photoMarkup(p))+
 '<div class="ending-actions">♡ ▢ ⌑</div><p class="ending-copy">'+esc(p.text)+'</p></div></article>';
}
async function endingCoffeeSample(){
 const c=document.createElement('canvas');c.width=320;c.height=350;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 const layers=[['body.png',116,192,88,112],['hands.png',52,164,216,72],['head-base.png',68,110,144,116],['hair-complete.png',46,66,228,244],['eyes-happy.png',68,110,144,116],['mouth-normal-sheet.png',68,110,144,116,36,0,36,29]];
 for(const [file,dx,dy,w,h,sx,sy,sw,sh]of layers){const im=new Image();im.src='./media/coffee-ghost/'+file;await im.decode();if(sw)x.drawImage(im,sx,sy,sw,sh,dx,dy,w,h);else x.drawImage(im,dx,dy,w,h);}
 x.fillStyle='#000';x.beginPath();x.ellipse(170,163,12,4,0,0,Math.PI*2);x.fill();
 for(const [side,dx]of [['L',100],['R',184]]){const im=new Image();im.src='./media/stickers/T_hornBig_'+side+'.png';await im.decode();x.drawImage(im,dx,78,42,58);}
 return c.toDataURL();
}
async function endingHeadPortrait(source){
 const im=new Image();im.src=source||'./media/demon/face.png';await im.decode();
 const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
 const x=c.getContext('2d');x.drawImage(im,0,0);const pixels=x.getImageData(0,0,c.width,c.height).data;
 let left=c.width,top=c.height,right=-1,bottom=-1;
 for(let y=0;y<c.height;y++)for(let col=0;col<c.width;col++)if(pixels[(y*c.width+col)*4+3]>16){left=Math.min(left,col);right=Math.max(right,col);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<left)return source;
 const head=document.createElement('canvas');head.width=right-left+1;head.height=bottom-top+1;head.getContext('2d').drawImage(c,left,top,head.width,head.height,0,0,head.width,head.height);return head.toDataURL();
}
async function initEnding(data){
 if(endingData)return;endingData=data;endingMuted=data.muted===true;E('endingMute').textContent=endingMuted?'소리 꺼짐':'소리 켜짐 ♪';
 const sky=E('returnSky');await sky.decode();if(data.ending!=='battle')endingData.headPortrait=await endingHeadPortrait(data.headPortrait);endingPosts=endingReviews(data.records,data.social);for(const post of endingPosts)if(post.samplePortrait==='coffee')post.photo=await endingCoffeeSample();endingPlan=endingSchedule(endingPosts.length);endingPhotoIndex=endingPosts.length;
 const run={...runFromStory(data.records,4,{settings:data.settings}),social:data.social};endingPhone=createSocialPhone(E('endingPhoneHost'),{getRun:()=>run,onManagement(){},onExit(){}});
 endingPhone.restore(data.socialChoices||{});endingPhone.show(true);
 E('memoryTrack').innerHTML=endingPosts.map(p=>endingCard(p)).join('')+(data.ending==='battle'?BATTLE_ENDING_NEWS.map(p=>endingCard(p,true)).join(''):'')+endingCard({id:'ending-group',user:'money_slave',place:'몬스터 헤어살롱 · 마지막 영업',text:data.ending==='battle'?'마지막 영업, 그리고 작별의 기념사진.':ENDING_POST},true);
 await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));
 E('endingComments').querySelector('div:last-child').innerHTML=(data.ending==='battle'?BATTLE_ENDING_COMMENTS:ENDING_COMMENTS).map(c=>'<p'+(c.reply?' class="ending-reply"':'')+'><b>'+(c.reply?'↳ ':'')+esc(c.user)+'</b>'+esc(c.text)+'</p>').join('');
 if(data.ending==='battle'){
  await document.fonts.ready;
  const article=E('memoryTrack').querySelector('.ending-news .post-card');
  endingNewsOverflow=Math.max(0,article.scrollHeight-article.clientHeight);
  endingNewsPlan=battleNewsSchedule(endingNewsOverflow,BATTLE_ENDING_NEWS[0].text.length);
 }
 E('endingLoading').remove();endingLast=performance.now();endingRaf=requestAnimationFrame(tickEnding);endingMessage('started');
}
function setEndingPause(value){endingPaused=value;E('endingPause').textContent=value?'계속 보기':'일시정지';endingMessage('pause',{paused:value});}
E('endingPause').onclick=()=>setEndingPause(!endingPaused);
E('endingMute').onclick=()=>{endingMuted=!endingMuted;E('endingMute').textContent=endingMuted?'소리 꺼짐':'소리 켜짐 ♪';endingMessage('mute',{muted:endingMuted});};
E('endingHome').onclick=()=>endingMessage('home');
E('endingReplay').onclick=()=>{endingTime=0;endingSounds.clear();endingCreditIndex=-1;E('endingDone').hidden=true;setEndingPause(false);endingMessage('replay');};
addEventListener('keydown',e=>{if(e.key==='Escape'||e.code==='Space'){e.preventDefault();setEndingPause(!endingPaused);}});
addEventListener('visibilitychange',()=>endingMessage('pause',{paused:endingPaused||document.hidden}));
function renderEnding(){
 const t=endingTime,sky=E('returnSky'),shade=E('nightShade'),mono=E('monologue'),fade=E('endingFade'),star=E('fallingStar');
 E('endingStage').dataset.phase=t<4000?'farewell':t<21000?'sky':t<25500?'phone':t<25500+endingPlan.total?'memories':'group';
 const monoKey=t<2600?'returnFarewell':t>=8500&&t<13500?'returnAwake':t>=14000&&t<20200?'returnMemory':null;const monoText=monoKey?(endingData.monologues?.[monoKey]??{"returnFarewell":"그럼, 안녕히…","returnAwake":"……돌아온 건가.","returnMemory":"그곳에서의 생활도…\n나름 나쁘지 않았지."}[monoKey]):'';if(mono.dataset.text!==monoText){mono.dataset.text=monoText;mono.replaceChildren(...parseDialogueText(monoText).glyphs.map(g=>{const span=document.createElement('span');span.textContent=g.char;span.style.color=g.style.color;span.style.fontSize=(g.style.size/17)+'em';return span;}));}
 mono.style.opacity=t<2600?Math.min(clamp(t/500),clamp((2600-t)/500)):t>=8500&&t<13500?Math.min(clamp((t-8500)/700),clamp((13500-t)/700)):t>=14000&&t<20200?Math.min(clamp((t-14000)/700),clamp((20200-t)/700)):0;
 star.style.opacity=t>=2600&&t<4200?Math.sin(clamp((t-2600)/1600)*Math.PI):0;star.style.transform='translateY('+clamp((t-2600)/1600)*370+'px) scale('+(1-clamp((t-2600)/1600)*.9)+')';
 sky.style.opacity=clamp((t-4000)/1400);sky.style.transform='translateY('+(-1125*smooth((t-5500)/14000))+'px)';
 fade.style.opacity=1-clamp(t/650);
 const phone=E('endingPhoneHost').querySelector('#socialPhone');phone.style.transform='translateY('+(720*(1-smooth((t-21200)/600)))+'px)';phone.style.opacity=1-clamp((t-24700)/800);
 if(t>=20800)endingSound('ending-vibrate');if(t>=21200)endingSound('ending-notify');
 const app=E('endingPhoneHost').querySelector('[data-feed]');if(app)app.style.transform='scale('+(t>=23800&&t<24200?.9:1)+')';
 if(t>=24000)endingSound('ending-click');
 shade.style.opacity=smooth((t-24200)/1300);
 const memoryT=t-25500,total=endingPlan.total,view=E('memoryViewport'),track=E('memoryTrack'),credit=E('endingCredit');
 view.style.opacity=clamp(memoryT/600);
 const idx=endingPosts.length?Math.min(endingPosts.length,Math.floor(Math.max(0,memoryT)/endingPlan.reviewMs)):0;
 const prev=Math.max(0,idx-1),start=idx===endingPosts.length?total:idx*endingPlan.reviewMs;
 let pos=idx===0?0:prev+smooth((memoryT-start)/800);
 const battleEnding=endingData.ending==='battle',aftermathT=memoryT-total;
 if(battleEnding){
  const article=E('memoryTrack').querySelector('.ending-news .post-card');
  article.scrollTop=endingNewsOverflow*clamp((aftermathT-endingNewsPlan.lead)/endingNewsPlan.scroll);
  if(aftermathT>=0){const page=aftermathT>=endingNewsPlan.total?1:0;pos=endingPosts.length-1+page+smooth((aftermathT-page*endingNewsPlan.total)/800);}
 }
 track.style.transform='translateY('+(-pos*590)+'px)';
 if(!endingPosts.length&&memoryT<total)view.style.opacity=0;
 if(memoryT>=0&&memoryT<total){
  const ci=Math.min(ENDING_CREDITS.length-1,Math.floor(memoryT/endingPlan.creditMs)),ct=memoryT-ci*endingPlan.creditMs;
  if(ci!==endingCreditIndex){endingCreditIndex=ci;const [team,role,name]=ENDING_CREDITS[ci];credit.querySelector('small').textContent=team;credit.querySelector('p').textContent=role||' ';credit.querySelector('h1').textContent=name;}
  credit.style.opacity=Math.min(clamp(ct/450),clamp((endingPlan.creditMs-ct)/450));
 }else credit.style.opacity=0;
 const finalT=memoryT-total-(battleEnding?endingNewsPlan.total:0);view.style.left=memoryT>=total?'415px':'110px';
 const commentT=battleEnding?aftermathT-endingNewsPlan.commentsAt+5000:finalT,comments=E('endingComments');comments.style.opacity=(battleEnding&&aftermathT>=endingNewsPlan.total)?0:clamp((commentT-5000)/500);comments.style.transform='translateY('+(500*(1-smooth((commentT-5000)/700)))+'px)';
 comments.querySelectorAll('p').forEach((p,i)=>p.style.opacity=clamp((commentT-5700-i*(battleEnding?2800:1700))/450));
 if(commentT>=5700)endingSound('ending-comment-1');if(commentT>=7400)endingSound('ending-comment-2');
 if(finalT>=11500){fade.style.opacity=clamp((finalT-11500)/2400);if(finalT>=12000)endingSound('ending-music-fade');}
 E('endingThanks').style.opacity=finalT<14200?0:Math.min(clamp((finalT-14200)/2000),clamp((22200-finalT)/2000));
 if(finalT>=22500){E('endingDone').hidden=false;E('endingStage').dataset.phase='done';if(!endingSounds.has('done')){endingSounds.add('done');endingMessage('complete');}}
}
function tickEnding(now){
 const dt=Math.min(80,now-endingLast);endingLast=now;if(!endingPaused&&!document.hidden)endingTime+=dt;
 renderEnding();endingRaf=requestAnimationFrame(tickEnding);
}
addEventListener('message',e=>{const m=e.data;if(e.source!==parent||e.origin!==location.origin||m?.source!=='yachacha-story'||m.token!==endingToken)return;if(m.type==='init')initEnding(m).catch(error=>{E('endingLoading').textContent='엔딩을 불러오지 못했습니다. 다시 시도해 주세요.';endingMessage('error',{message:error.message});});});
endingMessage('ready');
