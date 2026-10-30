import {PRESENTATION_HELLO,PRESENTATION_REFUSALS,PRESENTATION_STORY,PRESENTATION_SLIDES,PRESENTATION_SUMMARY,INTRO_HOLD_MS} from './presentation-data.js';

export class MinionPresentation{
 constructor(host,room,{sound,done}){
  this.room=room;this.sound=sound;this.done=done;this.clock=0;this.generation=0;this.waiters=[];this.active=false;this.paused=false;
  this.root=document.createElement('section');this.root.id='presentation';this.root.hidden=true;
  this.root.innerHTML=`<div class="presentation-dark"></div><canvas class="presenter" width="950" height="531" aria-label="발표하는 마왕 부하"></canvas>
   <div class="projector-beam"></div><section class="projection-screen" aria-label="발표 스크린"><div class="screen-paper"><div class="story-viewport"><div class="story-scroll" aria-label="마왕의 이야기와 영업 안내"></div></div></div><div class="screen-rod"></div></section>
   <div class="presentation-title" aria-hidden="true">왕실 소환 경위 보고서 <span>ROYAL BRIEFING / No. 666</span></div>
   <section class="presentation-speech" aria-label="마왕 부하의 발표"><span class="presentation-speaker">마왕 부하</span><p aria-live="polite"></p><button class="presentation-next" aria-label="다음 발표 대사">다음 <kbd>F</kbd></button><div class="presentation-choices" hidden><button data-listen>듣는다</button><button data-refuse>안 듣는다</button></div></section>
   <button class="hold-skip" aria-label="Space Bar 또는 버튼을 1.2초 길게 눌러 인트로 건너뛰기"><span>Space Bar 꾹 · 인트로 건너뛰기</span><i></i></button>`;
  host.append(this.root);this.actor=this.root.querySelector('.presenter').getContext('2d');this.story=this.root.querySelector('.story-scroll');this.text=this.root.querySelector('.presentation-speech p');this.nextButton=this.root.querySelector('.presentation-next');this.choices=this.root.querySelector('.presentation-choices');this.skip=this.root.querySelector('.hold-skip');
  this.nextButton.onclick=()=>this.next();this.text.onclick=()=>this.finishTyping();
  this.root.querySelector('[data-listen]').onclick=()=>{if(this.mode==='choice')this.listen();};
  this.root.querySelector('[data-refuse]').onclick=()=>{if(this.mode==='choice')this.refuse();};
  this.skip.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();this.skip.setPointerCapture(e.pointerId);this.beginHold('pointer');};
  this.skip.onpointerup=this.skip.onpointercancel=this.skip.onlostpointercapture=()=>this.cancelHold();
  this.skip.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();this.beginHold('button');}};
  this.skip.onkeyup=e=>{if(e.key==='Enter'){e.preventDefault();this.cancelHold();}};
  this.skip.onclick=e=>e.preventDefault();
  this.drawStoryboard();this.last=performance.now();this.frame=requestAnimationFrame(t=>this.tick(t));
 }
 setMode(mode){this.mode=mode;this.root.dataset.mode=mode;this.modeSince=this.clock;}
 wait(ms){return new Promise(resolve=>this.waiters.push({at:this.clock+ms,resolve}));}
 cancel(){this.generation++;this.active=false;this.root.hidden=true;this.cancelHold();for(const w of this.waiters)w.resolve(false);this.waiters=[];this.onLinesDone=null;this.lines=null;}
 pause(on){this.paused=on;this.cancelHold();}
 async start({story=false,slides=false}={}){
  this.cancel();this.active=true;this.paused=false;this.clock=0;this.root.hidden=false;this.refusals=0;this.screenDown=false;this.skipping=false;this.storyY=0;this.storyTarget=0;this.bow=0;this.bowTarget=0;this.mirror=0;this.mirrorTarget=0;this.sighAt=null;this.revealed=false;this.actorX=475;this.actorScale=.45;this.actorFeet=215;
  this.root.className='resetting';this.root.querySelector('.presentation-speech').hidden=true;this.root.querySelector('.presentation-title').hidden=false;
  void this.root.offsetHeight;this.root.classList.remove('resetting');
  this.skip.hidden=false;this.setMode('enter');
  if(slides){this.storyY=4;this.storyTarget=4;this.slide(0);return;}
  if(story){this.actorX=785;this.beginStory();return;}
  if(!await this.wait(3450))return;
  this.setMode('greeting');this.speak(PRESENTATION_HELLO,()=>this.offer());
 }
 speak(lines,done){this.lines=lines;this.lineIndex=0;this.onLinesDone=done;this.root.querySelector('.presentation-speech').hidden=false;this.choices.hidden=true;this.nextButton.hidden=false;this.showLine();}
 showLine(){this.fullText=this.lines[this.lineIndex];this.lineSince=this.clock;this.forcedText=false;this.text.textContent='';}
 finishTyping(){this.forcedText=true;this.text.textContent=this.fullText||'';}
 next(){
  if(!this.active||this.paused||!this.lines||['lowering','raising','clicking','enter'].includes(this.mode))return;
  if(this.text.textContent!==this.fullText){this.finishTyping();return;}
  if(++this.lineIndex<this.lines.length){this.showLine();return;}
  const done=this.onLinesDone;this.lines=null;this.onLinesDone=null;done?.();
 }
 offer(){this.setMode('choice');this.nextButton.hidden=true;this.choices.hidden=false;this.root.querySelector('[data-listen]').focus();}
 refuse(){
  this.refusals++;this.choices.hidden=true;this.setMode('refusal');
  if(this.refusals<3)this.speak([PRESENTATION_REFUSALS[this.refusals-1]],()=>this.offer());
  else this.speak(['……알겠습니다.\n준비한 사람의 마음까지 들으실 필요는 없겠지요.'],()=>this.skipIntro());
 }
 listen(){this.setMode('accept');this.choices.hidden=true;this.speak(['감사합니다. 앞쪽을 봐주십시오.'],()=>this.lower());}
 async lower(){
  this.lines=null;this.root.querySelector('.presentation-speech').hidden=true;this.setMode('clicking');this.sound('click');
  if(!await this.wait(550))return;
  this.screenDown=true;this.root.classList.add('screen-down');this.root.querySelector('.presentation-title').hidden=true;this.setMode('lowering');this.sound('motor');
  if(!await this.wait(1600))return;this.beginStory();
 }
 beginStory(){this.screenDown=true;this.root.classList.add('screen-down','projecting');this.root.querySelector('.presentation-title').hidden=true;this.setMode('story');this.storyIndex=0;this.storyBeat();}
 storyBeat(){
  const b=PRESENTATION_STORY[this.storyIndex];this.storyTarget=b.at;this.bowTarget=b.bowing||this.storyIndex>4?1:0;this.mirrorTarget=b.mirror||this.storyIndex>6?1:0;
  this.setMode('story');
  this.sighAt=null;
  if(b.sigh)this.queueSigh();
  this.speak([b.text],()=>{if(++this.storyIndex<PRESENTATION_STORY.length)this.storyBeat();else this.slide(0);});
 }
 async queueSigh(){
  const index=this.storyIndex,generation=this.generation;
  if(!await this.wait(1200)||generation!==this.generation||this.storyIndex!==index||this.skipping)return;
  this.sighPose=PRESENTATION_STORY[index].mirror?'mirror':'sigh';this.sighAt=this.clock;this.sound('sigh');
 }
 async raise(skipped){
  this.lines=null;this.root.querySelector('.presentation-speech').hidden=true;this.root.querySelector('.presentation-title').hidden=true;
  this.root.classList.remove('screen-down','projecting');this.setMode('raising');this.revealed=true;this.root.classList.add('room-revealed');
  if(this.screenDown)this.sound('motor');this.screenDown=false;
  if(!await this.wait(skipped?1600:1700))return;
  this.complete();
 }
 slide(index){
  this.slideIndex=index;this.screenDown=true;this.storyTarget=4+index;
  this.root.querySelector('.presentation-title').hidden=true;this.root.classList.add('screen-down','projecting');
  this.setMode('slides');this.sound('click');
  this.speak(PRESENTATION_SLIDES[index].lines,()=>{if(index+1<PRESENTATION_SLIDES.length)this.slide(index+1);else this.endSlides();});
 }
 endSlides(){
  this.setMode('wrapup');
  this.speak(['갑자기 장사를 하라니 당황스러우실 법도 합니다.','하지만 당신은 뭔가 다를 것 같다는 느낌이 듭니다.','말로 설명드리는 것보다는,\n직접 확인하시는 편이 낫겠지요.','마침 소개해 드릴 손님이 있습니다.'],()=>this.raise(false));
 }
 skipIntro(){
  if(!this.active||this.skipping)return;
  this.skipping=true;this.generation++;for(const w of this.waiters)w.resolve(false);this.waiters=[];this.cancelHold();this.skip.hidden=true;this.sighAt=null;
  this.setMode('wrapup');this.speak(PRESENTATION_SUMMARY,()=>this.raise(true));
 }
 complete(){this.cancel();this.done();}
 beginHold(source){if(!this.active||this.paused||this.skipping||this.hold)return;this.hold={at:this.clock,source};}
 cancelHold(){this.hold=null;this.skip?.style.setProperty('--hold','0%');}
 keyDown(e){if(!this.active)return false;if(e.code==='Space'){e.preventDefault();if(!e.repeat)this.beginHold('space');return true;}if(['Enter','f','F'].includes(e.key)){if(e.key==='Enter'&&e.target.closest('button'))return false;e.preventDefault();if(!e.repeat)this.next();return true;}return false;}
 keyUp(e){if(!this.active||e.code!=='Space')return;const short=this.hold?.source==='space'&&this.clock-this.hold.at<INTRO_HOLD_MS;this.cancelHold();if(short&&this.mode!=='choice')this.next();}
 tick(now){
  const dt=Math.min(80,now-this.last);this.last=now;
  if(this.active&&!this.paused){
   this.clock+=dt;const ready=this.waiters.filter(w=>w.at<=this.clock);this.waiters=this.waiters.filter(w=>w.at>this.clock);for(const w of ready)w.resolve(true);
   if(this.lines&&!this.forcedText)this.text.textContent=this.fullText.slice(0,Math.floor((this.clock-this.lineSince)/27));
   if(this.hold){const p=Math.min(1,(this.clock-this.hold.at)/INTRO_HOLD_MS);this.skip.style.setProperty('--hold',`${p*100}%`);if(p===1)this.skipIntro();}
   this.drawActor();this.drawStory(dt);
  }
  this.frame=requestAnimationFrame(t=>this.tick(t));
 }
 drawActor(){
  const c=this.actor;c.clearRect(0,0,950,531);c.imageSmoothingEnabled=false;
  const age=this.clock-this.modeSince,enter=this.mode==='enter',walk=enter||this.mode==='clicking',target=enter?475:this.revealed?690:['greeting','choice','refusal','accept'].includes(this.mode)?475:800;
  this.actorX+=(target-this.actorX)*.065;
  const t=enter?Math.min(1,age/3200):1,bob=walk?Math.sin(this.clock/95)*2:Math.sin(this.clock/650)*.7;
  this.actorScale+=((this.revealed?1.2:.45+1.3*t)-this.actorScale)*.065;this.actorFeet+=((this.revealed?425:enter?215+150*t:365)-this.actorFeet)*.065;
  const scale=this.actorScale,feet=this.actorFeet;
  c.save();c.globalAlpha=enter?Math.min(1,t*2):1;c.translate(this.actorX,feet+bob);c.scale(scale,scale);
  c.fillStyle='#0004';c.beginPath();c.ellipse(0,-2,32,5,0,0,Math.PI*2);c.fill();
  const a=this.room.assets.minion.animation.front,frame=walk?Math.floor(this.clock/a.frameMs)%a.count:0;
  for(const key of ['body','head','hair']){const im=this.room.images.get(a[key]);if(im)c.drawImage(im,frame*a.fw,0,a.fw,a.fh,-a.fw/2,-a.fh,a.fw,a.fh);}
  // Temporary remote prop; supplied walking sprites are retained unchanged.
  if(!enter){c.save();c.translate(-31,-63);c.rotate(this.mode==='clicking'?-.8:-.15);c.fillStyle='#252a29';c.fillRect(-5,-16,10,22);c.fillStyle='#e4b56a';c.fillRect(-2,-13,4,4);c.restore();}
  c.restore();if(walk&&Math.floor(this.clock/350)!==this.lastFoot){this.lastFoot=Math.floor(this.clock/350);this.sound('foot');}
 }
 drawStoryboard(){
  const art=(src,alt,cls='')=>'<img class="'+cls+'" src="./media/intro/'+src+'" alt="'+alt+'" draggable="false">';
  const panel=(i,body,cls='')=>'<section class="story-panel '+cls+'" style="top:'+i*100+'%">'+body+'</section>';
  this.story.innerHTML=[
   panel(0,art('pt/throne.png','왕좌에 앉은 제666대 마왕')+art('pt/bowing.png','마왕 앞에 엎드린 부하들','bowing-layer')),
   panel(1,art('pt/sigh.png','한숨 쉬는 마왕','sigh-layer')+art('pt/mirror.png','나라의 일보다 거울을 들여다보는 마왕','mirror-layer')+'<svg class="king-sigh" viewBox="0 0 120 72" aria-label="마왕의 한숨"><path d="M8 49 Q28 41 34 30 Q40 17 53 23 Q61 6 76 17 Q98 13 102 32 Q117 38 105 51 Q84 64 66 54 Q48 66 34 54 Z" fill="#dceaf4"/><path d="M20 49 Q33 46 40 40" stroke="#dceaf4" stroke-width="5" fill="none"/><text x="62" y="43" text-anchor="middle" fill="#7d8fa5" font-size="16">후우…</text></svg>'),
   panel(2,art('pt/reflection.png','거울 속 모습에도 만족하지 못하는 마왕')),
   panel(3,art('intro-4.png','플레이어를 소환하는 마왕 부하'),'full-art'),
   ...PRESENTATION_SLIDES.map((slide,i)=>panel(4+i,art('intro-'+(5+i)+'.png',slide.headline),'business-art'))
  ].join('');
  this.bowLayer=this.story.querySelector('.bowing-layer');this.mirrorLayer=this.story.querySelector('.mirror-layer');this.sighLayer=this.story.querySelector('.sigh-layer');this.sighIcon=this.story.querySelector('.king-sigh');
 }
 drawStory(dt){
  const ease=Math.min(1,dt/650);this.storyY+=(this.storyTarget-this.storyY)*ease;this.bow+=(this.bowTarget-this.bow)*Math.min(1,dt/750);this.mirror+=(this.mirrorTarget-this.mirror)*Math.min(1,dt/850);
  this.story.style.transform='translateY(-'+this.storyY*100+'%)';this.bowLayer.style.opacity=this.bow;this.bowLayer.style.transform='translateY('+((1-this.bow)*9)+'%)';
  this.mirrorLayer.style.opacity=this.mirror;this.sighLayer.style.opacity=1-this.mirror;
  const age=this.sighAt===null?2:(this.clock-this.sighAt)/1700,alpha=age<1?Math.sin(Math.PI*Math.max(0,age)):0;
  const mirrorSigh=this.sighPose==='mirror';
  this.sighIcon.style.left=mirrorSigh?'43%':'31%';this.sighIcon.style.top=mirrorSigh?'35%':'51%';
  this.sighIcon.style.opacity=alpha*(mirrorSigh?this.mirror:1-this.mirror);this.sighIcon.style.transform='translate('+age*30+'px,'+(-age*15)+'px) scale('+(.65+age*.35)+')';
 }
}
