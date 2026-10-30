// Canvas HUD and input for the confirmed click / stagger / drag combat.
class IntegratedCursorScene extends CursorScene{
 constructor(canvas,assets){super(canvas,assets);canvas.width=1280;canvas.height=650;this.healthView=new RaidHealthAnimator();}
 async loadRoom(spec){if(spec)await this.loadBackdrop(spec);}
 render(b,character,now=0){
  super.render(b,character,now);const g=this.ctx;
  g.save();
  const bar=(x,y,w,h,value,max,color)=>{g.fillStyle='#433842';g.fillRect(x,y,w,h);g.fillStyle=color;g.fillRect(x,y,w*Math.max(0,Math.min(1,value/Math.max(1,max))),h);};
  // UI arrangement from the user's actual 2026-10-16 Unity build screenshot.
  // Viewer count and chat are presentation samples, not a live service.
  g.fillStyle='#221b29c9';g.fillRect(18,20,216,36);g.fillStyle='#f34055';g.fillRect(30,32,12,12);
  g.textAlign='left';g.fillStyle='#fff';g.font='bold 14px Malgun Gothic';g.fillText('LIVE',50,44);g.fillStyle='#90c9ff';g.fillRect(112,31,14,14);g.fillStyle='#fff';g.fillText('시청자 128',136,44);
  g.textAlign='center';g.font='bold 23px Malgun Gothic';g.fillText(b?.monster?.Name||'손님',640,39);
  if(b?.usesHeartBoards){
   // Paper boards cover the HP display; stagger stays visible below them.
   g.fillStyle='#392b28';g.fillRect(390,87,520,12);drawHeartBoards(g,b);
  }else{
   bar(435,57,370,18,b?.enemyHP??0,b?.monster?.MaxHP??1,'#ef3b55');
   g.fillStyle='#fff';g.textAlign='right';g.font='bold 16px Malgun Gothic';g.fillText('HP',417,73);
   g.textAlign='left';g.font='bold 13px monospace';g.fillText(`${Math.ceil(b?.enemyHP??0)} / ${b?.monster?.MaxHP??0}`,832,72);
  }
  const gaugeY=b?.usesHeartBoards?157:85;
  bar(435,gaugeY,370,15,b?.staggerRemaining??100,b?.settings.staggerMax??100,'#ffbe2e');
  g.fillStyle='#fff';g.textAlign='right';g.font='bold 16px Malgun Gothic';g.fillText('무력화',417,gaugeY+14);
  g.textAlign='left';g.font='bold 13px monospace';g.fillText(`${Math.ceil(b?.staggerRemaining??100)} / ${b?.settings.staggerMax??100}`,832,gaugeY+14);
  // The supplied player sheet includes transparent headroom above the figure.
  const player=this.playerPosition??this.point(b?.pos??5),py=player.y-170;
  bar(player.x-100,py,200,18,b?.hp??100,b?.player?.MaxHP??100,'#36d39a');
  g.fillStyle='#fff';g.font='bold 12px monospace';g.fillText(`${Math.ceil(b?.hp??100)} / ${b?.player?.MaxHP??100}`,player.x+106,py+14);
  g.fillStyle='#38212ca6';g.fillRect(970,520,290,40);g.fillRect(895,570,365,31);g.fillStyle='#fff';g.font='bold 16px Malgun Gothic';g.fillText('라이브 채팅',994,546);g.font='13px Malgun Gothic';g.fillText('몬스타팬: 가위 소리, 은근히 중독성이 ...',910,590);
  g.fillStyle='#15131bdc';g.fillRect(0,609,1280,41);g.fillStyle='#f6e4c8';g.font='16px Malgun Gothic';
  let message='WASD 이동 · 몬스터 클릭 · 빈틈에는 누른 채 좌우로 긁기';
  if(b?.state==='opening')message=`${b.opportunities<=b.monster.PlayerDodgeMissCount?'이번 기회는 MISS · ':''}가위로 좌우로 긁기 · ${Math.max(0,(b.groggyEnd-b.time)/1000).toFixed(1)}초 · ${b.openingResult.attempts}타`;
  if(b?.state==='staggerBreak')message='무력화 붕괴! 잠시 뒤 가위로 긁어 주세요.';
  if(b?.rush)message=b.rush.stage==='aim'?`비석 왼쪽 ${b.rush.stone-1}번 칸으로 유도!`:'조준 고정 · 다른 줄로 피할 수 있어요';
  if(b?.dialogueBlocking)message='대화 중 · Enter로 다음 대사';
  g.fillText(message,30,636);
  if(b&&!['opening','staggerBreak'].includes(b.state)){bar(1010,621,235,7,b.attackProgress,1,'#d5c5ff');g.font='12px Malgun Gothic';g.textAlign='right';g.fillText(b.attackReady?'클릭 준비 완료':'공격 준비 중',1244,644);}
  if(b?.paused&&!combatLessonActive()){g.fillStyle='#12131bbb';g.fillRect(0,0,1280,650);g.textAlign='center';g.fillStyle='#fff2da';g.font='bold 30px Malgun Gothic';g.fillText('잠시 쉬어가기',640,300);g.font='18px Malgun Gothic';g.fillText('계속하기 또는 Esc',640,340);}
  const miss=b?.cues.filter(c=>c.kind==='miss').at(-1);if(miss&&b.visualTime-miss.visualTime<700){g.textAlign='center';g.fillStyle='#fff0b8';g.font='bold 38px monospace';g.fillText('MISS',this.enemy?.x??962,(this.enemy?.y??534)-280);}
  drawCombatLesson(g,b,this);
  if(this.pointer&&(!b?.paused||combatLessonActive())){const p=this.pointer,opening=b?.state==='opening',active=b&&!b.dialogueBlocking&&(opening||b.canPunch()||combatLessonActive())&&insideBox(p,this.attackBox);g.globalAlpha=active?1:.4;g.font='34px sans-serif';g.textAlign='center';g.fillStyle=active?'#fff8d5':'#a7a0a3';g.fillText(opening?'✂':'✊',p.x,p.y+8);if(b&&!opening){g.strokeStyle=b.attackReady?'#b0f4cb':'#b5b0df';g.lineWidth=3;g.beginPath();g.arc(p.x,p.y,26,-Math.PI/2,-Math.PI/2+Math.PI*2*b.attackProgress);g.stroke();}}
  g.restore();
 }
}
const cursorScratch=new ScratchTracker();let cursorPointerID=null,cursorState=null;
function clearCursorInput(){cursorPointerID=null;cursorScratch.reset();scene.pointer=null;}
function cursorPoint(e){const r=$('arena').getBoundingClientRect();return{x:(e.clientX-r.left)*1280/r.width,y:(e.clientY-r.top)*650/r.height};}
function cursorCanInteract(){return battle&&!battle.paused&&!battle.dialogueBlocking&&!hostSuspended;}
function installCursorInput(){
 const canvas=$('arena');canvas.style.touchAction='none';canvas.style.cursor='none';
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||cursorPointerID!==null)return;e.preventDefault();$('battleArea').focus();scene.pointer=cursorPoint(e);scene.unlock();
  if(HOST.coffeeTutorial&&combatLesson){
   if(hostSuspended)return;
   if(combatLesson.id==='punch'&&insideBox(scene.pointer,scene.box))finishCombatLesson({preserveCursor:true});
   else if(combatLesson.id==='opening'&&insideBox(scene.pointer,scene.scratchBox)){
    cursorPointerID=e.pointerId;canvas.setPointerCapture(e.pointerId);cursorScratch.begin(scene.pointer);combatLesson.dragStart=scene.pointer;return;
   }else return;
  }
  if(!cursorCanInteract())return;cursorPointerID=e.pointerId;canvas.setPointerCapture(e.pointerId);cursorScratch.begin(scene.pointer);
  if(battle.state!=='opening')battle.basicAttack(insideBox(scene.pointer,scene.box));
 });
 canvas.addEventListener('pointermove',e=>{
  const p=cursorPoint(e),previous=scene.pointer;scene.pointer=p;
  if(HOST.coffeeTutorial&&combatLesson?.id==='opening'&&cursorPointerID===e.pointerId&&!hostSuspended&&combatLesson.dragStart&&insideBox(p,scene.scratchBox)&&Math.hypot(p.x-combatLesson.dragStart.x,p.y-combatLesson.dragStart.y)>=6)finishCombatLesson({preserveCursor:true});
  if(cursorPointerID!==e.pointerId||!cursorCanInteract()||battle.state!=='opening')return;
  if(insideBox(p,scene.scratchBox)&&insideBox(previous,scene.scratchBox))scene.stroke(previous,p,battle.time);
  if(cursorScratch.move(p,scene.scratchBox,battle.time,scene.box.w))battle.scratchAttack(true);
 });
 const release=e=>{if(cursorPointerID===e.pointerId){cursorPointerID=null;cursorScratch.reset();if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,release);
 canvas.addEventListener('pointerleave',clearCursorInput);
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
}
function updateCursorInput(){if(cursorState!==battle?.state){cursorState=battle?.state;cursorScratch.reset();if(cursorState==='opening'&&cursorPointerID!==null&&scene.pointer)cursorScratch.begin(scene.pointer);}if((battle?.paused&&!(HOST.coffeeTutorial&&combatLesson?.id==='opening'&&!hostSuspended))||battle?.dialogueBlocking){cursorPointerID=null;cursorScratch.reset();}}

function drawHeartBoards(g,b){
 const pixels=['01100110','11111111','11111111','11111111','01111110','00111100','00011000'];
 for(let i=0;i<3;i++){
  const drop=b.cues.filter(c=>c.kind==='heartDrop'&&c.index===i).at(-1),age=drop?b.visualTime-drop.visualTime:Infinity;
  const missing=[2,0,1].indexOf(i)<3-b.heartsRemaining;if(missing&&age>=1050)continue;
  const t=missing?Math.max(0,age/1050):0,x=475+i*166,y=96;
  g.save();g.globalAlpha=1-t*t;g.translate(x+(i%2?1:-1)*t*46,y+t*t*400);g.rotate((i%2?1:-1)*t*.7);
  g.shadowColor='#0008';g.shadowBlur=0;g.shadowOffsetY=5;
  g.fillStyle='#251a21';g.fillRect(-74,-45,148,92);g.shadowOffsetY=0;
  g.fillStyle='#ad784c';g.fillRect(-70,-41,140,84);g.fillStyle='#e7c68b';g.fillRect(-62,-34,124,70);
  g.fillStyle='#d5b47d';for(let n=0;n<4;n++)g.fillRect(-55+n*29,26+(n%2)*3,20,2);
  g.fillStyle='#fae8bc';g.fillRect(-60,-32,4,59);g.fillRect(-60,-32,116,3);
  // Tape and a pixel heart are canvas shapes, not edits of the reference art.
  g.save();g.rotate(-.22);g.fillStyle='#dfd9becf';g.fillRect(-51,-52,26,19);g.restore();
  g.save();g.rotate(.2);g.fillStyle='#cfcab3d9';g.fillRect(36,29,24,19);g.restore();
  for(let r=0;r<pixels.length;r++)for(let c=0;c<8;c++)if(pixels[r][c]==='1'){
   const border=r===0||r===6||c===0||c===7||pixels[r]?.[c-1]!=='1'||pixels[r]?.[c+1]!=='1'||pixels[r-1]?.[c]!=='1'||pixels[r+1]?.[c]!=='1';
   g.fillStyle=border?'#991d35':'#f63b50';g.fillRect(-32+c*8,-26+r*8,8,8);
  }
  if(missing){g.strokeStyle='#4f2928';g.lineWidth=4;g.beginPath();g.moveTo(5,-37);g.lineTo(-8,-15);g.lineTo(7,-3);g.lineTo(-6,16);g.lineTo(5,38);g.stroke();}
  g.restore();
 }
}

let monsterBubble=null;
function updateMonsterBubble(){
 const dialogue=battle?.dialogues,line=dialogue?.line;
 const monsterSpeech=!dialoguePreview&&line?.Speaker==='몬스터'&&!!scene.enemy;
 const visible=monsterSpeech&&!battle.paused;
 $('dialogueBox').classList.toggle('bubbleReplaced',!!monsterSpeech);
 if(!monsterBubble){
  monsterBubble=document.createElement('div');monsterBubble.id='monsterBubble';monsterBubble.className='monsterBubble';monsterBubble.hidden=true;
  monsterBubble.innerHTML='<b class="bubbleSpeaker"></b><p class="bubbleText"></p><button type="button" class="bubbleNext">다음 · Enter</button>';
  monsterBubble.setAttribute('aria-live','polite');$('battleArea').append(monsterBubble);
  monsterBubble.querySelector('button').onclick=()=>battle?.dialogues?.advance();
 }
 monsterBubble.hidden=!visible;if(!visible)return;
 const canvas=$('arena').getBoundingClientRect(),area=$('battleArea').getBoundingClientRect(),scale=canvas.width/1280;
 const text=monsterBubble.querySelector('p'),html=$('dialogueText').innerHTML.replace(/font-size:([\d.]+)px/g,(_,size)=>`font-size:${Number(size)*Math.max(.6,scale)}px`);
 if(text.innerHTML!==html)text.innerHTML=html;
 monsterBubble.querySelector('b').textContent=battle.monster.Name;
 const button=monsterBubble.querySelector('button');button.hidden=!dialogue.blocking&&dialogue.active.group.AdvanceMode!=='입력';
 button.textContent=dialogue.complete?'다음 · Enter':'바로 보기 · Enter';
 const width=Math.min(canvas.width-16,360*scale);
 monsterBubble.style.width=width+'px';monsterBubble.style.setProperty('--bubble-font',Math.max(10,19*scale)+'px');
 const cx=canvas.left-area.left+scene.enemy.x*scale,head=canvas.top-area.top+(scene.enemy.y-scene.enemy.height)*scale;
 const left=Math.max(canvas.left-area.left+8,Math.min(cx-width/2,canvas.right-area.left-width-8));
 const hudBottom=(battle.usesHeartBoards?184:112)*scale;
 const top=Math.max(canvas.top-area.top+hudBottom,head-monsterBubble.offsetHeight-14*scale);
 monsterBubble.style.left=left+'px';monsterBubble.style.top=top+'px';monsterBubble.style.setProperty('--bubble-tail',Math.max(18,Math.min(width-18,cx-left))+'px');
}
