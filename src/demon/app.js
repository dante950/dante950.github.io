import {DemonPixels,normalizeDemonPixels,DEMON_LINES,demonGate,demonProtest,DEMON_STAR_THRESHOLDS} from './model.js';
const $=id=>document.getElementById(id),scene=$('scene'),ctx=scene.getContext('2d'),portrait=$('portrait'),pc=portrait.getContext('2d');
const query=new URLSearchParams(location.search),storyToken=query.get('story');
let config={},images={},ready=false,mode='loading',since=performance.now(),last=since,beat=0,beats=[],speech=null,model=null,phase=1,successLocked=false,tool='hammer',color=[36,34,54],radius=7,drag=null,selectedSticker=null,sound=true,clock=0,busy=false,raf=0;
let earnedStars=3,player={x:720,y:430,direction:'front',frame:0},keys=new Set(),records=[],warnings=0,lastProtest=-Infinity,reactionTimer=0,portraitResult=null,battle=null,savePhase=1;
const aborter=new AbortController(),signal=aborter.signal;
const transparent=()=>{const c=document.createElement('canvas');c.width=320;c.height=350;return c;};
const materialCanvas=transparent(),materialCtx=materialCanvas.getContext('2d'),paintCanvas=transparent(),paintCtx=paintCanvas.getContext('2d'),baseCanvas=transparent(),stoneCanvas=transparent();
const media={king:'./media/demon/king.png',mimic:'./media/demon/mimic.png',helmet:'./media/demon/helmet.png',face:'./media/demon/face.png',ears:'./media/demon/ears.png',hair:'./media/demon/hair.png',goblin:'./media/demon/goblin.png',goblinHair:'./media/demon/goblinHair.png',stones:'./media/demon/stones.png',minion:'./media/minion-guide.png',shop:'./media/intro/pt/salon.png',hero:'./media/a60f39797ec2a08be94bb830.png',heroBack:'./media/a8779e7993df7187d998345f.png',heroLeft:'./media/855ab40978f1cafb6734db12.png',heroRight:'./media/f3c56ecc6e0e4af16a6051d8.png',cape:'./media/1605da332e79debabd5b6fcb.png'};
async function loadImage(src){if(images[src])return images[src];const im=new Image();im.src=src;await im.decode();images[src]=im;return im;}
function imageOf(name){return images[media[name]||name];}
function soundEffect(key){if(!sound)return;const src=config.audio?.[key];if(src){const a=new Audio(src);a.volume=.45;a.play().catch(()=>{});}}
function visibility(id,on){$(id).hidden=!on;}
function hostMessage(type,extra={}){if(storyToken)parent.postMessage({source:'yachacha-demon',type,token:storyToken,...extra},location.origin);}
function setMode(next){mode=next;since=performance.now();$('sceneTitle').textContent=({lobby:'마지막 손님',cutscene:'마왕 방문',room:'손님 맞이',beauty:'마왕 미용',battle:'야차',ending:'약속의 끝'})[next]||'';for(const id of ['lobby','roomControls','beauty','battleUI','ending'])visibility(id,({lobby:'lobby',roomControls:'room',beauty:'beauty',battleUI:'battle',ending:'ending'})[id]===next);visibility('skip',next==='cutscene');$('fade').classList.remove('dark');}
async function fadeTo(fn){if(busy)return;busy=true;$('fade').classList.add('dark');await new Promise(r=>setTimeout(r,650));fn();requestAnimationFrame(()=>$('fade').classList.remove('dark'));busy=false;}
function sprite(name,x,feet,height,alpha=1,flip=false){const im=imageOf(name);if(!im)return;const width=height*im.width/im.height;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,feet);if(flip)ctx.scale(-1,1);ctx.drawImage(im,-width/2,-height,width,height);ctx.restore();}
function hero(x,feet,height=160,frame=0,direction='front'){const im=imageOf(({front:'hero',back:'heroBack',left:'heroLeft',right:'heroRight'})[direction]);if(!im)return;const w=height*219/162;ctx.drawImage(im,(frame%3)*219,Math.floor(frame/3)*162,219,162,x-w/2,feet-height,w,height);}
function shadow(x,y,w){ctx.fillStyle='#170c3066';ctx.beginPath();ctx.ellipse(x,y,w,9,0,0,Math.PI*2);ctx.fill();}
function roomBackdrop(){
 ctx.fillStyle='#cc6588';ctx.fillRect(0,0,960,350);
 for(let x=0;x<960;x+=70){ctx.fillStyle=x%140?'#c25d81':'#d97596';ctx.fillRect(x,0,36,345);}
 ctx.fillStyle='#563344';ctx.fillRect(0,330,960,18);
 for(let y=345;y<540;y+=40)for(let x=0;x<960;x+=70){ctx.fillStyle=((x/70+(y-345)/40)%2)?'#4d3c50':'#715267';ctx.fillRect(x,y,70,40);}
 const layers=config.room?.layers||[];for(const l of layers){
  if(/windowLight|magazines|stationSide|counterSide|counterTop|sofaSide|sofaTop|poster|radio|salonProps|towel/.test(l.name))continue;
  const im=imageOf(l.src);if(!im)continue;const st=l.style,w=parseFloat(st.width||'10')*9.6,h=st.height?parseFloat(st.height)*5.4:w*im.height/im.width;
  const x=st.right?960-parseFloat(st.right)*9.6-w:parseFloat(st.left||'0')*9.6,y=st.bottom?540-parseFloat(st.bottom)*5.4-h:parseFloat(st.top||'0')*5.4;
  ctx.drawImage(im,x,y,w,h);
 }
 ctx.fillStyle='#ffe1a3';ctx.font='19px Galmuri';ctx.fillText('★ ★ ★',700,72);
 sprite('mimic',845,392,77);
}
function exterior(t,kind='outside'){
 const zoom=kind==='sign'?1+Math.min(1,t/1.2)*.4:1;ctx.save();ctx.translate(590,290);ctx.scale(zoom,zoom);ctx.translate(-590,-290);
 ctx.fillStyle='#77bed1';ctx.fillRect(-500,-500,1960,1040);ctx.fillStyle='#bce6df';
 for(let i=0;i<5;i++){const x=(i*220+t*3)%1200-120;ctx.fillRect(x,65+i%2*65,100,15);ctx.fillRect(x+25,50+i%2*65,45,20);}
 ctx.fillStyle='#779bab';ctx.fillRect(75,170,130,235);ctx.fillRect(775,125,150,290);
 ctx.fillStyle='#b7c2ad';ctx.fillRect(15,240,130,175);ctx.fillStyle='#d3c2ab';ctx.fillRect(800,260,160,155);
 ctx.fillStyle='#b6a997';ctx.fillRect(-500,410,1960,130);ctx.fillStyle='#dacfb6';ctx.fillRect(-500,412,1960,12);ctx.fillStyle='#8f8079';ctx.fillRect(-500,476,1960,9);
 const im=imageOf('shop');if(im)ctx.drawImage(im,im.width*.57,im.height*.38,im.width*.38,im.height*.43,390,150,385,300);
 ctx.fillStyle='#f4e4bc';ctx.fillRect(470,147,224,48);ctx.strokeStyle='#647d61';ctx.lineWidth=5;ctx.strokeRect(470,147,224,48);ctx.font='34px Galmuri';ctx.textAlign='center';ctx.fillStyle='#e4aa26';ctx.fillText('★'.repeat(earnedStars),580,183);ctx.textAlign='left';
 if(kind!=='sign'){
  let kx=280,mx=400,kh=310,mh=205,alpha=1;
  if(kind==='walk'){const p=Math.min(1,t/2.3);kx=-140+420*p;mx=-40+440*p;}
  if(kind==='pass'){kx=280+t*310;mx=400+Math.max(0,t-1.1)*340;}
  if(kind==='enter'){const p=Math.min(1,t/2.2);kx=280+330*p;mx=400+210*Math.max(0,(p-.18)/.82);kh=310-140*p;mh=205-90*p;alpha=1-Math.max(0,(p-.8)*5);}
  const walking=['walk','pass','enter'].includes(kind),bob=walking?Math.sin(t*14)*3:Math.sin(clock*.002)*1.5;
  shadow(kx,480,50);shadow(mx,480,30);sprite('king',kx,480+bob,kh,alpha);sprite('minion',mx,480-bob,mh,alpha);
 }
 ctx.restore();
}
function dayCard(){ctx.fillStyle='#100c17';ctx.fillRect(0,0,960,540);ctx.textAlign='center';ctx.fillStyle='#b998ac';ctx.font='13px Galmuri';ctx.fillText('새로운 하루가 찾아옵니다',480,153);ctx.fillStyle='#fff0d0';ctx.fillRect(401,182,158,158);ctx.fillStyle='#b95c77';ctx.fillRect(401,182,158,48);ctx.font='20px Galmuri';ctx.fillStyle='#fff5db';ctx.fillText('DAY',480,215);ctx.fillStyle='#302039';ctx.font='90px Galmuri';ctx.fillText('4',480,321);ctx.font='20px Galmuri';ctx.fillStyle='#ffd36f';ctx.fillText('YACHACHA OPEN!',480,385);ctx.textAlign='left';}
function drawCut(){
 const b=beats[beat];if(!b)return;const t=(performance.now()-since)/1000;
 if(b.scene==='calendar')dayCard();
 else if(['outside','walk','sign','pass','enter'].includes(b.scene))exterior(t,b.scene);
 else if(b.scene==='black'){ctx.fillStyle='#08060c';ctx.fillRect(0,0,960,540);}
 else if(b.scene==='door'){
  roomBackdrop();ctx.fillStyle='#331c36';ctx.fillRect(310,25,340,515);ctx.fillStyle='#f7dba2';ctx.fillRect(333,47,294,493);
  ctx.save();ctx.translate(333,47);ctx.scale(Math.max(.08,1-t/2.4),1);ctx.fillStyle='#735371';ctx.fillRect(0,0,294,493);ctx.strokeStyle='#bc8ca6';ctx.lineWidth=12;ctx.strokeRect(12,12,270,470);ctx.fillStyle='#e1bf73';ctx.fillRect(240,270,12,25);ctx.restore();
 }else if(b.scene==='reaction'){
  ctx.fillStyle='#3a1b4b';ctx.fillRect(0,0,960,540);ctx.fillStyle='#7e3a83';for(let i=0;i<14;i++)ctx.fillRect((i*96+t*150)%1300-100,0,25,540);
  hero(Math.min(365,150+t*150),460,330);sprite('mimic',Math.max(625,920-t*200),450,200);
  ctx.fillStyle='#ffdf87';ctx.font='60px Galmuri';ctx.fillText('!',370,210);ctx.fillText('!',700,220);
 }else if(b.scene==='foot'){
  roomBackdrop();ctx.save();ctx.translate(0,Math.sin(t*35)*Math.max(0,5-t*3));const im=imageOf('king');ctx.drawImage(im,im.width*.38,im.height*.73,im.width*.37,im.height*.27,320,130+Math.min(1,t/.7)*80,360,270);ctx.restore();ctx.fillStyle='#fff0b4';ctx.font='45px Galmuri';ctx.fillText(t>.65?'쿵':'',650,370);
 }else if(b.scene==='armor'){
  roomBackdrop();const p=Math.min(1,t/3.3);sprite('king',480,1000-490*p,870-380*p);sprite('minion',730,485,180);ctx.fillStyle='#10081955';ctx.fillRect(0,0,960,540);
 }else if(b.scene==='unmask'){
  roomBackdrop();pc.clearRect(0,0,320,350);const l=makeLayers(2);pc.drawImage(l.baseCanvas,0,0);pc.drawImage(l.materialCanvas,0,0);ctx.drawImage(portrait,320,60,320,350);ctx.globalAlpha=Math.max(0,1-t/2);ctx.drawImage(imageOf('helmet'),305,20-t*60,350,310);ctx.globalAlpha=1;
 }else if(b.scene==='applause'){
  roomBackdrop();if(portraitResult)ctx.drawImage(portraitResult,330,65,300,328);hero(220,470,190,Math.floor(t*5)%2);sprite('minion',745,445+Math.sin(t*10)*4,200);ctx.fillStyle='#ffe191';ctx.font='40px Galmuri';ctx.fillText('✿',350+Math.sin(t*2)*35,160);ctx.fillText('✿',660,240);ctx.font='18px Galmuri';ctx.fillText('짝짝짝',155,285);ctx.fillText('짝짝짝',710,215);
 }else if(b.scene==='reveal'){
  roomBackdrop();const p=Math.min(1,t/2);if(portraitResult){ctx.globalAlpha=1-p;ctx.drawImage(portraitResult,320,60,320,350);}
  ctx.globalAlpha=p;const l=makeLayers(3);ctx.drawImage(l.baseCanvas,320,60);ctx.drawImage(l.materialCanvas,320,60);ctx.drawImage(l.stoneCanvas,320,60);ctx.globalAlpha=1;
  }else {roomBackdrop();sprite('king',495,411,230);sprite('minion',712,427,175);hero(260,450,180);}
 const next=beats[beat+1],previous=beats[beat-1];let black=0;
 if(next?.scene==='black'&&b.duration)black=Math.max(0,(t-(b.duration-.6))/.6);
 if(previous?.scene==='black')black=Math.max(black,1-t/.6);
 if(black>0){ctx.fillStyle='rgba(0,0,0,'+Math.min(1,black)+')';ctx.fillRect(0,0,960,540);}
 if(b.duration&&t>=b.duration&&!speech)nextBeat();
}
let afterBeats=null;
function sequence(list,done){beats=list;beat=0;afterBeats=done;setMode('cutscene');enterBeat();}
function enterBeat(){
 const b=beats[beat];if(!b){visibility('dialogue',false);visibility('skip',false);const done=afterBeats;afterBeats=null;done?.();return;}
 since=performance.now();if(b.sound)soundEffect(b.sound);
 if(b.line)sayLine(b.line[0],b.line[1],nextBeat);else{speech=null;visibility('dialogue',false);}
}
function nextBeat(){speech=null;beat++;enterBeat();}
function sayLine(who,text,done){speech={who,text,done,start:performance.now(),all:false};$('speaker').textContent=who;$('line').textContent='';$('speakerPortrait').src=who==='부하'?media.minion:who==='마왕'&&phase>1&&portraitResult?portraitResult.toDataURL():who==='마왕'?media.king:media.mimic;visibility('dialogue',true);}
function advance(){if(busy)return;if(speech){if(!speech.all){speech.all=true;$('line').textContent=speech.text;}else{const done=speech.done;speech=null;visibility('dialogue',false);done?.();}}else if(mode==='cutscene')nextBeat();}
function startVisit(){
 earnedStars=demonGate(earnedStars).stars;successLocked=false;phase=1;
 fadeTo(()=>{const gate=demonGate(earnedStars);
 const list=[{scene:'calendar',duration:2.1},{scene:'outside',duration:1},{scene:'walk',duration:2.5},{scene:'outside',line:['마왕','이곳인가..']},{scene:'outside',line:['부하','그렇긴 합니다만...']},{scene:'sign',duration:1.5},{scene:'sign',line:['마왕',gate.line]}];
 if(gate.admitted)list.push({scene:'outside',line:['마왕','들어가보도록 하지.']},{scene:'outside',line:['부하','……예, 마왕님.']},{scene:'enter',duration:2.8},{scene:'black',duration:.8},{scene:'door',duration:2.4,sound:'door'},{scene:'reaction',duration:1.8},{scene:'foot',duration:1.5,sound:'foot0'},{scene:'armor',duration:3.5},{scene:'black',duration:.7},...DEMON_LINES.arrival.map(line=>({scene:'salon',line})));
 else list.push({scene:'outside',line:['마왕','가자. 시간을 낭비했군.']},{scene:'outside',line:['부하','……예, 폐하.']},{scene:'pass',duration:4.1},{scene:'black',duration:.8});
 sequence(list,()=>gate.admitted?seatKing():gameOver());
 });
}
function seatKing(){setMode('room');player={x:720,y:430,direction:'front',frame:0};$('hint').textContent='마왕이 의자에 앉았습니다. 가까이 다가가 F로 미용을 시작하세요.';soundEffect('sit');}
function drawRoom(dt){
 roomBackdrop();const age=(performance.now()-since)/1000,p=Math.min(1,age/1.6),x=270+235*p,y=470-70*p;
 sprite('king',x,y,240-45*p);sprite('minion',710,414,155);
 const dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
 player.x=Math.max(80,Math.min(900,player.x+dx*190*dt));player.y=Math.max(365,Math.min(515,player.y+dy*190*dt));
 if(dx||dy){player.direction=Math.abs(dx)>=Math.abs(dy)?dx<0?'left':'right':dy<0?'back':'front';player.frame=Math.floor(clock/130)%6;}else player.frame=0;
 hero(player.x,player.y,165,player.frame,player.direction);
 const near=Math.hypot(player.x-505,player.y-400)<170&&p===1;$('interact').disabled=!near;$('interact').textContent=near?'마왕에게 말 걸기 · F':'마왕에게 가까이 가세요';
}
function makeLayer(name,box){const c=transparent(),x=c.getContext('2d');x.imageSmoothingEnabled=false;const im=imageOf(name);if(im)x.drawImage(im,...box);const data=x.getImageData(0,0,320,350);data.data.set(normalizeDemonPixels(data.data));x.putImageData(data,0,0);return c;}
function pixels(c){return c.getContext('2d').getImageData(0,0,320,350).data;}
const layerCache={};
function makeLayers(p){
 if(layerCache[p])return layerCache[p];
 const base=makeLayer(p===3?'goblin':'face',p===3?[0,0,320,320]:[-17,-7,371,371]);
 const ear=makeLayer('ears',[-17,-7,371,371]);
 if(p===2)base.getContext('2d').drawImage(ear,0,0);
 const mat=makeLayer(p===1?'helmet':p===2?'hair':'goblinHair',p===1?[-12,-10,344,305]:p===2?[-57,-82,456,456]:[-6,-18,327,327]);
 const stone=p===3?makeLayer('stones',[10,-6,300,300]):transparent();
 const target=transparent(),tx=target.getContext('2d');tx.drawImage(mat,0,0);
 if(p===1){const orig=pixels(mat),out=tx.getImageData(0,0,320,350);for(let y=0;y<117;y++)for(let x=185;x<292;x++){const s=(y*320+(318-x))*4,i=(y*320+x)*4;if(orig[s+3]>100&&orig[s+2]>110&&orig[s]<125&&orig[s+1]<145)out.data.set(orig.subarray(s,s+4),i);}tx.putImageData(out,0,0);}
 return layerCache[p]={base:pixels(base),material:pixels(mat),stones:pixels(stone),ears:pixels(ear),hornTarget:pixels(target),baseCanvas:base,materialCanvas:mat,stoneCanvas:stone};
}
const phaseText={
 1:{title:'1페이즈 · 투구 복원',notes:['투구를 깨끗이 복원','절대 얼굴을 보려하지 말 것'],line:'뿔과 전투의 흔적을 말끔히 복원해 주게. 다만… 내 얼굴을 보려 하지는 말게.'},
 2:{title:'2페이즈 · 전투를 위한 차림',notes:['귀가 드러나도록 짧게','머리카락은 검정색으로','얼굴은 깨끗하게 · 장식 없이'],line:'긴 머리가 전투에 거추장스럽군. 귀가 보이도록 자르고, 머리카락은 검정으로 부탁하네.'},
 3:{title:'3페이즈 · 그대에게 맡기는 모습',notes:['마음 가는 대로 자유롭게'],line:'이번에는 그대의 감각에 맡기겠네.'}
};
function beginBeauty(p){
 phase=p;savePhase=p;warnings=0;lastProtest=-Infinity;drag=null;selectedSticker=null;visibility('reaction',false);clearTimeout(reactionTimer);
 const layers=makeLayers(p);model=new DemonPixels(p,layers);baseCanvas.getContext('2d').putImageData(new ImageData(layers.base,320,350),0,0);
 setMode('beauty');$('phaseName').textContent=phaseText[p].title;$('requirements').replaceChildren(...phaseText[p].notes.map(s=>Object.assign(document.createElement('li'),{textContent:s})));
 $('tools').innerHTML=(p===1?[['hammer','망치·정'],['tonic','발모제'],['paint','그리기'],['erase','지우개'],['sticker','스티커']]:[['scissors','가위'],...(p===3?[['hammer','망치·정']]:[]),['tonic','발모제'],['paint','그리기'],['erase','지우개'],['sticker','스티커']]).map(([k,n])=>'<button data-tool="'+k+'">'+n+'</button>').join('');
 $('tools').querySelectorAll('button').forEach(b=>b.onclick=()=>selectTool(b.dataset.tool));
 selectTool(p===1?'tonic':'scissors');color=p===1?[36,34,54]:[24,21,31];renderColors();renderStickers();updateBeauty();renderBeauty();
 $('hint').textContent=p===3?'가위는 머리카락, 망치·정은 돌껍질을 손질합니다. 어떤 모습이든 완료할 수 있습니다.':'도구를 선택하고 드래그해서 손질하세요. 되돌리기와 지우개로 수정할 수 있습니다.';
 sayLine('마왕',phaseText[p].line,()=>{});
}
function selectTool(value){tool=value;$('tools').querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===value));visibility('stickers',value==='sticker');visibility('colors',value==='paint');}
function renderColors(){
 const palette=[['투구색','#242236'],['검정','#18151f'],['뿔의 파랑','#4853f8'],['흰색','#ecebf4'],['분홍','#f48db4'],['빨강','#cb394f'],['금색','#e9b34d'],['초록','#4bb67d']];
 $('colors').innerHTML=palette.map(([n,v])=>'<button title="'+n+'" aria-label="'+n+'" data-color="'+v+'" style="background:'+v+'"></button>').join('')+'<input type="color" aria-label="직접 색 고르기" value="#18151f"><span>색 선택</span>';
 const pick=v=>{color=[1,3,5].map(n=>parseInt(v.slice(n,n+2),16));$('colors').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.color===v));};
 $('colors').querySelectorAll('button').forEach(b=>b.onclick=()=>pick(b.dataset.color));document.querySelector('#colors input').oninput=e=>pick(e.target.value);pick(phase===1?'#242236':'#18151f');
}
function renderStickers(){
 const selected=(config.stickers||[]).filter(s=>/ribbon|star|nose|flower|crown|moustache/i.test(s.src)).slice(0,12);
 $('stickers').innerHTML='';selected.forEach(s=>{const b=document.createElement('button');b.title=s.name;b.setAttribute('aria-label',s.name);const im=new Image();im.src=s.src;b.append(im);b.onclick=async()=>{await loadImage(s.src);selectedSticker=s;$('stickers').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));};$('stickers').append(b);});
}
function renderBeauty(){
 if(!model)return;pc.clearRect(0,0,320,350);pc.imageSmoothingEnabled=false;
 const cape=imageOf('cape');if(cape)pc.drawImage(cape,65,250,190,110);
 pc.drawImage(baseCanvas,0,0);
 materialCtx.putImageData(new ImageData(model.material,320,350),0,0);pc.drawImage(materialCanvas,0,0);
 stoneCanvas.getContext('2d').putImageData(new ImageData(model.stones,320,350),0,0);pc.drawImage(stoneCanvas,0,0);
 paintCtx.putImageData(new ImageData(model.paint,320,350),0,0);pc.drawImage(paintCanvas,0,0);
 for(const s of model.placements){const im=imageOf(s.src);if(im)pc.drawImage(im,s.x-s.w/2,s.y-s.h/2,s.w,s.h);}
}
function updateBeauty(){
 const status=model.judge(),lis=[...$('requirements').children];lis.forEach((li,i)=>li.classList.toggle('done',phase===1?i===0?status.checks[0]&&status.checks[1]:status.checks[2]:status.checks[i]));
 $('satisfaction').textContent=phase===3?'자유 미용 · 성공 확정':'미용 만족도 · '+(status.success?'만족':'불만족');$('undo').disabled=!model.history.length;
 if(status.sudden&&!busy&&mode==='beauty'){drag=null;failBeauty(true);}
}
function protest(kind){
 const text=demonProtest(phase,kind);if(!text||performance.now()-lastProtest<5500)return;
 lastProtest=performance.now();showReaction(text);
}
function showReaction(text){$('reaction').textContent=text;visibility('reaction',true);clearTimeout(reactionTimer);reactionTimer=setTimeout(()=>visibility('reaction',false),4300);}
function canvasPoint(e){const r=portrait.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*320,y:(e.clientY-r.top)/r.height*350};}
function strokePoint(p){
 const result=model.stroke(p.x,p.y,radius,tool,color);if(!result.changed)return;
 if(phase===1&&tool==='hammer'&&result.faceHit&&warnings<2){showReaction(warnings++?DEMON_LINES.warningAgain:DEMON_LINES.warning);}
 if(phase===2){if(result.faceHit&&tool==='paint')protest('face');else if(result.colored&&(color[0]>35||color[1]>35||color[2]>45))protest('color');}
 renderBeauty();
}
portrait.addEventListener('pointerdown',async e=>{
 if(mode!=='beauty'||speech||busy||e.button!==0)return;e.preventDefault();portrait.setPointerCapture(e.pointerId);model.save();const p=canvasPoint(e);
 if(tool==='sticker'){if(!selectedSticker){model.history.pop();showReaction('아래에서 붙일 장식을 골라 주세요.');return;}const s=selectedSticker;model.placements.push({src:s.src,x:p.x,y:p.y,w:Math.min(95,s.w*.8),h:Math.min(95,s.h*.8)});protest('sticker');renderBeauty();updateBeauty();return;}
 drag={...p,id:e.pointerId};strokePoint(p);updateBeauty();
},{signal});
portrait.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||mode!=='beauty')return;const p=canvasPoint(e),dx=p.x-drag.x,dy=p.y-drag.y,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/Math.max(1,radius/2)));for(let i=1;i<=n;i++)strokePoint({x:drag.x+dx*i/n,y:drag.y+dy*i/n});drag={...p,id:e.pointerId};updateBeauty();},{signal});
const finishDrag=()=>{drag=null;if(model&&mode==='beauty')updateBeauty();};portrait.addEventListener('pointerup',finishDrag,{signal});portrait.addEventListener('pointercancel',finishDrag,{signal});portrait.addEventListener('lostpointercapture',finishDrag,{signal});
function freezePortrait(){const c=transparent();c.getContext('2d').drawImage(portrait,0,0);portraitResult=c;}
function completeBeauty(){
 if(mode!=='beauty'||speech||busy)return;updateBeauty();if(mode!=='beauty')return;
 if(!model.judge().success){failBeauty(false);return;}
 freezePortrait();
 if(phase===1){fadeTo(()=>sequence([{scene:'salon',line:['마왕','……제법이군. 이제 투구를 벗어도 되겠어.']},{scene:'unmask',duration:2.2}],()=>beginBeauty(2)));return;}
 if(phase===2){successLocked=true;fadeTo(()=>sequence([{scene:'applause',duration:2.4},...DEMON_LINES.confession.map(line=>({scene:'salon',line})),{scene:'reveal',duration:2.5},...DEMON_LINES.freedom.map(line=>({scene:'salon',line}))],()=>beginBeauty(3)));return;}
 finishEnding('beauty');
}
function failBeauty(sudden){
 if(successLocked||phase===3)return;savePhase=phase;
 fadeTo(()=>sequence([{scene:'salon',line:['마왕',sudden?'……경고했을 텐데.':phase===1?'복원은 여기까지인가. 다른 솜씨를 확인해 보지.':'내가 부탁한 차림과는 다르군. 이번에는 야차로 확인하겠네.']}],()=>startBattle()));
}
function startBattle(){
 setMode('battle');battle={phase:1,hp:100,stagger:100,window:0,cycle:0,zone:0,attackAt:performance.now()+2600,pointer:{x:480,y:480},holding:false,lastX:0,hits:0,lastHit:0};visibility('dialogue',false);$('hint').textContent='붉은 예고 범위에서 커서를 피하세요. 마왕을 클릭해 빈틈을 열고, 누른 채 좌우로 긁으세요.';
}
function drawBattle(){
 if(!battle)return;const b=battle,now=performance.now();ctx.fillStyle='#1a1230';ctx.fillRect(0,0,960,540);ctx.fillStyle='#473051';ctx.fillRect(0,400,960,140);ctx.strokeStyle='#89668b';ctx.beginPath();ctx.ellipse(480,420,360,80,0,0,Math.PI*2);ctx.stroke();
 if(!b.window&&now>=b.attackAt){if(Math.floor(b.pointer.x/320)===b.zone)b.hp=Math.max(0,b.hp-18);soundEffect('clash');b.cycle++;b.zone=(b.cycle*2+1)%3;b.attackAt=now+2500;if(!b.hp){battleDefeat();return;}}
 const danger=b.attackAt-now<1050&&!b.window;if(danger){ctx.fillStyle='#ef4b6b55';ctx.fillRect(b.zone*320,0,320,540);ctx.fillStyle='#ffc5ba';ctx.font='18px Galmuri';ctx.fillText('위험',b.zone*320+130,140);}
 if(b.phase===1)sprite('king',480,460,380);
 else {const l=makeLayers(b.phase);ctx.drawImage(l.baseCanvas,320,85);ctx.drawImage(l.materialCanvas,320,85);if(b.phase===3)ctx.drawImage(l.stoneCanvas,320,85);if(b.phase===2){ctx.globalAlpha=.28;ctx.drawImage(l.baseCanvas,60,90);ctx.drawImage(l.materialCanvas,60,90);ctx.drawImage(l.baseCanvas,580,90);ctx.drawImage(l.materialCanvas,580,90);ctx.globalAlpha=1;}}
 if(b.window){ctx.fillStyle='#ffe194';ctx.font='24px Galmuri';ctx.fillText('빈틈!',445,90);if(now>b.window){b.window=0;b.stagger=100;b.attackAt=now+2000;}}
 $('battlePhase').textContent='마왕 야차 · '+b.phase+'페이즈';$('hp').value=b.hp;$('stagger').value=b.stagger;$('battleHint').textContent=b.window?'누른 채 마왕 위에서 좌우로 긁으세요.':'위험 구역을 피하면서 마왕을 클릭하세요.';
}
scene.addEventListener('pointermove',e=>{
 if(mode!=='battle'||!battle)return;const r=scene.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*960,y=(e.clientY-r.top)/r.height*540;battle.pointer={x,y};
 if(battle.holding&&battle.window&&x>310&&x<650&&y>90&&y<465&&Math.abs(x-battle.lastX)>16){battle.lastX=x;battle.hits++;if(battle.hits>=18){battle.phase++;battle.stagger=100;battle.hits=0;battle.window=0;battle.attackAt=performance.now()+2300;if(battle.phase>3)finishEnding('battle');}}
},{signal});
scene.addEventListener('pointerdown',e=>{if(mode!=='battle'||!battle)return;scene.setPointerCapture(e.pointerId);battle.holding=true;const r=scene.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*960,y=(e.clientY-r.top)/r.height*540;battle.pointer={x,y};battle.lastX=x;if(x>310&&x<650&&y>80&&y<470&&!battle.window&&performance.now()-battle.lastHit>100){battle.lastHit=performance.now();battle.stagger=Math.max(0,battle.stagger-12);if(!battle.stagger){battle.window=performance.now()+5000;battle.hits=0;}}},{signal});
for(const event of ['pointerup','pointercancel','lostpointercapture'])scene.addEventListener(event,()=>{if(battle)battle.holding=false;},{signal});
function battleDefeat(){setMode('ending');$('ending').innerHTML='<span class="eyebrow">TRY AGAIN</span><h2>아직 끝나지 않았습니다.</h2><p>재도전해도 팔로워와 스타는 감소하지 않습니다.</p><div class="actions"><button id="retryBattle" class="primary">야차 재도전</button><button id="retryBeauty">미용 재도전</button></div>';$('retryBattle').onclick=startBattle;$('retryBeauty').onclick=()=>beginBeauty(savePhase);}
function gameOver(){
 setMode('ending');$('ending').innerHTML='<span class="eyebrow">ENDING 01</span><h2>GAME OVER</h2><p>끝내, 마지막 손님은 문을 열지 않았다.</p><div class="actions"><button id="restart" class="primary">다시 시작</button><button id="title">타이틀로</button></div>';$('restart').onclick=()=>storyToken?hostMessage('restart'):showLobby();$('title').onclick=goHome;hostMessage('ending',{ending:'missed'});
}
function finishEnding(route){
 if(route==='beauty')freezePortrait();else{beginBattlePortrait();}
 const photo=portraitResult.toDataURL();
 setMode('ending');$('ending').innerHTML='<span class="eyebrow">ENDING '+(route==='beauty'?'02 · A PROMISE KEPT':'03 · AFTER THE YACHA')+'</span><h2>'+(route==='beauty'?'그대에게 맡기길 잘했군.':'이것이 나의 진짜 모습이다.')+'</h2><img class="photo" alt="직접 완성한 마왕의 모습"><p>부하: “약속대로, 원래 세계로 돌아갈 길을 열겠습니다.”</p><div class="actions"><button id="portal" class="primary">빛 너머로 돌아가기</button></div>';
 document.querySelector('#ending .photo').src=photo;$('portal').onclick=()=>fadeTo(()=>showMemories(photo,route));hostMessage('ending',{ending:route,portrait:photo,successLocked});
}
function beginBattlePortrait(){const l=makeLayers(3);const c=transparent(),x=c.getContext('2d');x.drawImage(l.baseCanvas,0,0);x.drawImage(l.materialCanvas,0,0);x.drawImage(l.stoneCanvas,0,0);portraitResult=c;}
function showMemories(photo,route){
 setMode('ending');$('ending').innerHTML='<span class="eyebrow">MONSTAGRAM · 현실 귀환</span><h2>돌아온 일상에, 새 알림 하나.</h2><img class="photo" alt="마왕이 올린 사진"><p>마왕님이 사진을 게시했습니다.<br>“오늘은, 이 모습도 제법 마음에 드는군.”</p><div class="memories"></div><button id="title" class="primary">타이틀로 돌아가기</button>';document.querySelector('#ending .photo').src=photo;
 for(const r of records){if(!r.portrait&&!r.headPortrait)continue;const im=new Image();im.src=r.headPortrait||r.portrait;im.alt=r.name||'함께한 손님';document.querySelector('#ending .memories').append(im);}
 $('title').onclick=goHome;
}
function goHome(){if(storyToken)hostMessage('home');else location.href='./';}
function showLobby(){speech=null;visibility('dialogue',false);successLocked=false;setMode('lobby');$('hint').textContent='문을 열면 약속한 손님이 찾아옵니다.';}
$('homeLink').onclick=e=>{e.preventDefault();goHome();};
$('open').onclick=startVisit;$('stars').onchange=e=>earnedStars=+e.target.value;$('next').onclick=advance;
$('skip').onclick=()=>{const ending=afterBeats;afterBeats=null;speech=null;visibility('dialogue',false);visibility('skip',false);ending?.();};
$('interact').onclick=()=>{if(!$('interact').disabled)beginBeauty(1);};$('size').oninput=e=>radius=+e.target.value;
$('undo').onclick=()=>{if(speech)return;model.undo();renderBeauty();updateBeauty();};$('clearStickers').onclick=()=>{if(speech||!model.placements.length)return;model.save();model.placements=[];renderBeauty();updateBeauty();};
$('finish').onclick=completeBeauty;$('requestAgain').onclick=()=>sayLine('마왕',phaseText[phase].line,()=>{});
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'소리 켜짐 ♪':'소리 꺼짐';};
$('replay').onclick=()=>{if(storyToken){hostMessage('home');return;}if(mode!=='lobby'&&!confirm('지금 손질한 내용을 지우고 처음으로 돌아갈까요?'))return;showLobby();};
document.querySelectorAll('[data-preview-phase]').forEach(b=>b.onclick=()=>{successLocked=+b.dataset.previewPhase===3;beginBeauty(+b.dataset.previewPhase);});
addEventListener('keydown',e=>{
 if(e.target.matches('input,select,textarea')||e.repeat)return;const k=e.key.toLowerCase();
 if(['f',' ','enter'].includes(k)&&speech){e.preventDefault();advance();return;}
 if(mode==='room'){if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(k))e.preventDefault();keys.add(k);if(k==='f')$('interact').click();}
 if(k==='escape'&&speech)advance();
},{signal});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()),{signal});addEventListener('blur',()=>{keys.clear();drag=null;if(battle)battle.holding=false;},{signal});
function draw(now){
 const dt=Math.min(.04,(now-last)/1000);last=now;clock=now;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,960,540);
 if(mode==='cutscene')drawCut();else if(mode==='room')drawRoom(dt);else if(mode==='battle')drawBattle();else if(mode==='lobby')roomBackdrop();
 if(speech){const n=speech.all?speech.text.length:Math.floor((now-speech.start)/32);$('line').textContent=speech.text.slice(0,n);if(n>=speech.text.length)speech.all=true;}
 raf=requestAnimationFrame(draw);
}
async function boot(){
 try{
  const r=await fetch('./demon-assets.json');if(!r.ok)throw Error('리소스 목록을 불러오지 못했습니다.');config=await r.json();
  const roomSources=(config.room?.layers||[]).map(l=>l.src);await Promise.all([...new Set([...Object.values(media),...roomSources])].map(loadImage));
  ready=true;visibility('loading',false);raf=requestAnimationFrame(draw);
  if(storyToken){visibility('previewSettings',false);visibility('beautyShortcuts',false);hostMessage('ready');}
  else showLobby();
 }catch(error){$('loading').textContent='준비 중 오류가 발생했습니다. 새로고침해 주세요. '+error.message;console.error(error);}
}
addEventListener('message',e=>{const m=e.data;if(e.source!==parent||e.origin!==location.origin||m?.source!=='yachacha-story'||m.token!==storyToken)return;if(m.type==='init'){earnedStars=demonGate(m.stars).stars;records=Array.isArray(m.records)?m.records:[];showLobby();}},{signal});
window.demonLab={get ready(){return ready;},get mode(){return mode;},get phase(){return phase;},get successLocked(){return successLocked;},get model(){return model;},get beat(){return beats[beat];},get metrics(){return model?.metrics();},get battle(){return battle;},advance,beginBeauty,completeBeauty,renderBeauty,updateBeauty,makeLayers};
boot();
