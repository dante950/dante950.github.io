// The visit plays over the existing salon world. It never mounts a second game.
if(GUEST.demon&&GUEST.mode!=='backdrop'){
 const phase=GUEST.demonPhase||1,stars=GUEST.stars||0;
 const companion=document.createElement('img');companion.id='demonCompanion';companion.src=GUEST.companion;companion.alt='마왕 부하';companion.style.cssText='position:absolute;left:64%;top:50%;width:112px;height:177px;object-fit:contain;image-rendering:pixelated;z-index:48;pointer-events:none;display:none';gameWorld.append(companion);
 const mimic=document.createElement('img');mimic.id='demonMimic';mimic.src='./media/demon/mimic.png';mimic.alt='팁박스';mimic.style.cssText='position:absolute;left:78%;top:48%;width:64px;height:72px;object-fit:contain;image-rendering:pixelated;z-index:19;pointer-events:none';gameWorld.append(mimic);
 const standing=document.createElement('img');standing.id='demonStanding';standing.src='./media/demon/king.png';standing.alt='마왕';standing.style.cssText='position:absolute;left:48%;bottom:20%;width:225px;height:345px;object-fit:contain;image-rendering:pixelated;z-index:49;pointer-events:none;display:none';gameWorld.append(standing);
 const style=document.createElement('style');style.textContent='.demonCinema{position:absolute;inset:0;z-index:600;background:#100d17;pointer-events:auto;opacity:1;transition:opacity .45s}.demonCinema canvas{width:100%;height:100%;image-rendering:pixelated}.demonCinema button{position:absolute;right:24px;top:22px;font:16px Galmuri9;background:#fff4e1;color:#503a30;border:3px solid #775844;border-radius:9px;padding:10px 15px}.demonApplause{animation:demonClap .3s 6 alternate}@keyframes demonClap{to{transform:translateY(-5px) rotate(3deg)}}';document.head.append(style);
 let cinema=null,canvas=null,cx=null,sequence=[],index=0,at=0,frame=0,visitActive=false,waiting=false,last=0,elapsed=0;
 const art={},loadArt=Promise.all([['king','./media/demon/king.png'],['kingBack','./media/demon/T_Finalboss_walk_back_sheet.png'],['minionBackBody','./media/minion-walk-back-body.png'],['minionBackHead','./media/minion-walk-back-head.png'],['minionBackHair','./media/minion-walk-back-hair.png'],['minion',GUEST.companion],['mimic','./media/demon/mimic.png'],['hero',SPRITES.front],['outside','./media/demon/visit-exterior-reference.png']].map(async([key,src])=>{const i=new Image();i.src=src;await i.decode();art[key]=i;}));
 const sprite=(name,x,feet,h,flip=false)=>{const im=art[name];if(!im)return;const w=h*im.width/im.height;cx.save();cx.translate(x,feet);if(flip)cx.scale(-1,1);cx.drawImage(im,-w/2,-h,w,h);cx.restore();};
 function walkBack(name,x,feet,h,t){
  // King timing matches the supplied four-frame GIF; minion uses the existing layered walk.
  const king=name==='king',fw=king?180:120,fh=king?207:176,frame=Math.floor(t*1000/(king?200:140))%4,w=h*fw/fh;
  const layers=king?['kingBack']:['minionBackBody','minionBackHead','minionBackHair'];
  for(const key of layers)cx.drawImage(art[key],frame*fw,0,fw,fh,x-w/2,feet-h,w,h);
  cinema.dataset[name+'Frame']=frame;
 }
 function visitBeat(){const beat=sequence[index];if(!beat){endVisit();return;}elapsed=0;waiting=false;cinema.dataset.scene=beat.scene;if(beat.sound)send('sound',{key:beat.sound});}
 function advanceVisit(){if(!visitActive)return;index++;visitBeat();}
 function showExterior(scene,t){
  // Supplied storyboard image, displayed only as the exterior reference background.
  cx.drawImage(art.outside,272,117,195,135,0,0,950,531);
  cx.fillStyle='#E8E2AF';cx.fillRect(163,170,320,81);cx.strokeStyle='#867C4D';cx.lineWidth=4;cx.strokeRect(163,170,320,81);
  cx.fillStyle='#FFD341';cx.font='53px Galmuri9';cx.textAlign='center';cx.fillText('★'.repeat(stars),323,229);cx.textAlign='left';
  const p=Math.min(1,t/2.2);let x=220,y=500,h=350,mx=390,my=500,mh=210;
  if(scene==='walk'){x=-150+370*p;mx=-30+420*p;}
  if(scene==='enter'){x=220+105*p;y=500-105*p;h=350-180*p;mx=390-55*Math.max(0,(p-.2)/.8);my=500-105*p;mh=210-100*p;}
  if(scene==='pass'){x=220+1100*p;mx=390+1000*Math.max(0,(p-.3)/.7);}
  if(scene==='sign'){cx.save();cx.translate(475,265);cx.scale(1+p*.4,1+p*.4);cx.translate(-323,-205);cx.drawImage(art.outside,272,117,195,135,0,0,950,531);cx.fillStyle='#E8E2AF';cx.fillRect(163,170,320,81);cx.fillStyle='#FFD341';cx.font='53px Galmuri9';cx.fillText('★'.repeat(stars),181,229);cx.restore();return;}
  cinema.dataset.direction=scene==='enter'?'back':scene==='pass'?'right':'front';
  cinema.dataset.kingX=x;cinema.dataset.minionX=mx;
  if(scene==='enter'){walkBack('king',x,y,h,t);walkBack('minion',mx,my,mh,t);}
  else{const bob=['walk','pass'].includes(scene)?Math.sin(t*14)*3:0;sprite('king',x,y+bob,h);sprite('minion',mx,my-bob,mh);}
 }
 function drawVisit(){
  const beat=sequence[index];if(!beat)return;const t=elapsed/1000;cx.clearRect(0,0,950,531);cinema.style.background=['armor','foot'].includes(beat.scene)?'transparent':'#100d17';
  if(['outside','walk','sign','enter','pass'].includes(beat.scene))showExterior(beat.scene,t);
  else if(beat.scene==='door'){
   cx.fillStyle='#201820';cx.fillRect(0,0,950,531);cx.fillStyle='#FFF0C7';cx.fillRect(280,30,390,501);cx.save();cx.translate(280,30);cx.scale(Math.max(.04,1-t/2),1);cx.fillStyle='#735041';cx.fillRect(0,0,390,501);cx.strokeStyle='#C49A75';cx.lineWidth=13;cx.strokeRect(25,20,340,480);cx.fillStyle='#EFC779';cx.fillRect(333,263,15,22);cx.restore();
  }else if(beat.scene==='reaction'){
   cx.fillStyle='#41333C';cx.fillRect(0,0,950,531);cx.drawImage(art.hero,0,0,219,162,80,80,450,334);sprite('mimic',710,430,250);cx.fillStyle='#FFE6A7';cx.font='70px Galmuri9';cx.fillText('!',380,160);cx.fillText('!',735,130);
  }else if(beat.scene==='foot'){const im=art.king;cx.fillStyle='#140E1877';cx.fillRect(0,0,950,531);cx.drawImage(im,im.width*.38,im.height*.73,im.width*.37,im.height*.27,285,80+Math.min(1,t/.7)*100,380,310);}
  else if(beat.scene==='armor'){cx.fillStyle='#140E1866';cx.fillRect(0,0,950,531);const p=Math.min(1,t/3);sprite('king',475,1110-610*p,1000-520*p);sprite('minion',720,480,200);}
  else if(beat.scene==='black'){cx.fillStyle='#100d17';cx.fillRect(0,0,950,531);}
 }
 function tick(now){
  if(!visitActive)return;const dt=Math.min(60,now-last);last=now;if(!settingsOpen()&&!document.hidden&&!waiting)elapsed+=dt;drawVisit();
  const b=sequence[index];if(b&&!waiting&&elapsed>=b.ms){if(b.line||b.event){waiting=true;send('demon-gate-line',{line:b.line,event:b.event});}else advanceVisit();}
  if(visitActive)frame=requestAnimationFrame(tick);
 }
 function endVisit(){
  visitActive=false;cancelAnimationFrame(frame);cinema?.remove();cinema=null;
  if(stars<3){customerState.phase='closed';send('demon-gameover');return;}
  standing.style.display='block';companion.style.display='block';dialogueState.active=true;send('demon-arrival');
 }
 async function startDemonBusiness(){
  if(customerState.phase!=='closed')return;customerState.phase='cutscene';dialogueState.active=true;state.keys.clear();openShopBtn.disabled=true;openShopBtn.textContent='영업 중';
  cinema=document.createElement('div');cinema.className='demonCinema';canvas=document.createElement('canvas');canvas.width=950;canvas.height=531;cx=canvas.getContext('2d');cx.imageSmoothingEnabled=false;cinema.append(canvas);
  const skip=document.createElement('button');skip.textContent='건너뛰기';skip.onclick=()=>endVisit();cinema.append(skip);gameWorld.append(cinema);send('cutscene-start');
  try{await loadArt;}catch(error){console.error(error);cinema.remove();customerState.phase='closed';dialogueState.active=false;openShopBtn.disabled=false;return;}
  const gate=demonGate(stars);
  sequence=[{scene:'black',ms:450},{scene:'outside',ms:1000},{scene:'walk',ms:2300},{scene:'outside',ms:350,event:'exterior'},{scene:'sign',ms:1400,line:gate.line},...(gate.admitted?[{scene:'outside',ms:400,line:DEMON_LINES.enter},{scene:'enter',ms:2400},{scene:'black',ms:550},{scene:'door',ms:2100,sound:'door'},{scene:'reaction',ms:1300},{scene:'foot',ms:1200,sound:'foot0'},{scene:'armor',ms:3300},{scene:'black',ms:500}]:[{scene:'pass',ms:3000},{scene:'black',ms:650}])];
  visitActive=true;index=0;last=performance.now();visitBeat();frame=requestAnimationFrame(tick);
 }
 if(phase===1){openShopBtn.textContent='영업 시작 · 마왕 맞이';openShopBtn.onclick=startDemonBusiness;startBusiness=startDemonBusiness;}
 else companion.style.display='block';
 const roomUpdate=updateInteraction;updateInteraction=()=>{roomUpdate();interact.style.display=interactionAvailable?'block':'none';};
 const sharedUpdateCustomer=updateCustomer;updateCustomer=dt=>{if(GUEST.demon&&customerState.phase==='cutscene')return;sharedUpdateCustomer(dt);};
 /*__DEMON_ENDING_ROOM__*/
 addEventListener('message',e=>{
  if(e.source!==parent||e.data?.token!==GUEST.token)return;
  if(e.data.type==='demon-visit-next')advanceVisit();
  if(e.data.type==='demon-ending-scene')setDemonEndingScene(e.data.scene);
  if(e.data.type==='demon-seat'){
   standing.style.display='none';dialogueState.active=false;customerState.phase='door';customerState.wait=.2;customerState.x=670;customerState.y=430;customerState.target=2;doorSignal.classList.add('open');send('cutscene-end');
  }
  if(e.data.type==='demon-applause'){companion.classList.add('demonApplause');player.classList.add('demonApplause');send('sound',{key:'beauty-pleased'});}
  if(e.data.type==='demon-finish'||e.data.type==='demon-battle-return'){
   if(e.data.type==='demon-finish'&&customerState.phase==='closed'&&!beautyActive&&GUEST.demonStartBranch!=='beauty')return;
   beautyActive=false;beautyResultActive=false;dialogueState.active=false;customerState.phase='closed';state.keys.clear();
   clearTimeout(resultRevealTimer);clearTimeout(resultEndTimer);clearReturningReactions();
   beautyScreen.style.display='none';seatedCustomer.style.display='none';interact.style.display='none';interactPrompt.style.display='none';openShopBtn.style.display='none';
   standing.src=e.data.portrait||GUEST.skin.portrait;standing.style.cssText='position:absolute;left:48%;bottom:21%;width:180px;height:197px;object-fit:contain;image-rendering:pixelated;z-index:49;pointer-events:none';
   companion.style.display='block';companion.classList.remove('demonApplause');player.classList.remove('demonApplause');
   state.x=380;state.y=420;state.direction='right';render(false);updateInteraction();
   prepareDemonEndingRoom(e.data.headPortrait||e.data.portrait||GUEST.skin.portrait,e.data.type==='demon-battle-return'?'goblin':'handsome').catch(error=>send('demon-ending-error',{message:error.message}));
  }

 });
}
