// Renderer reused from the same user-provided reference as cursor-engine.js.
class RoomRenderer extends GameScene {
 async loadRoom(spec){this.canvas.width=950;this.canvas.height=531;this.ctx=this.canvas.getContext('2d');this.room=spec;this.roomImages={};const entries=[['wall',spec.wall],['floor',spec.floor],['carpet',spec.carpet],...spec.layers.map((l,i)=>['prop'+i,l.src]),...Object.entries(spec.bars)];await Promise.all(entries.map(async([key,src])=>{const img=new Image();img.src=src;await img.decode();this.roomImages[key]=img;}));}
 roomBackdrop(){const g=this.ctx,a=this.roomImages;g.imageSmoothingEnabled=false;g.fillStyle='#332b2b';g.fillRect(0,0,950,531);if(!this.room)return;g.save();g.filter='saturate(.82) brightness(.9)';g.drawImage(a.wall,0,0,950,324);g.restore();g.save();g.filter='brightness(.71) saturate(.72)';const tile=a.floor,h=118*tile.height/tile.width;for(let y=265;y<531;y+=h)for(let x=0;x<950;x+=118)g.drawImage(tile,x,y,118,h);g.restore();g.fillStyle='#90b7aa';g.fillRect(0,53,219,229);g.fillStyle='#526e62';for(let i=0;i<5;i++)g.fillRect(i*48,150+(i%2)*18,32,130);
 const dim=(v,base)=>v?.endsWith('%')?parseFloat(v)*base/100:parseFloat(v)||0;
 const layers=this.room.layers.map((l,i)=>({...l,img:a['prop'+i]})).sort((a,b)=>(+a.style['z-index']||0)-(+b.style['z-index']||0));
 for(const l of layers){if(l.name.includes('carpet')){g.drawImage(a.carpet,70,280,845,231);continue;}const s=l.style,img=l.img;let w=dim(s.width,950)||img.width,h=dim(s.height,531)||w*img.height/img.width,x=s.left&&s.left!=='auto'?dim(s.left,950):950-dim(s.right,950)-w,y=s.top?dim(s.top,531):531-dim(s.bottom,531)-h;const scale=Math.min(w/img.width,h/img.height),dw=img.width*scale,dh=img.height*scale;g.save();g.globalAlpha=s.opacity?+s.opacity:1;g.translate(x+w/2,y+h/2);const angle=Number(s.transform?.match(/rotate\(([-\d.]+)/)?.[1]||0);g.rotate(angle*Math.PI/180);g.drawImage(img,-dw/2,-dh/2,dw,dh);g.restore();}
 const light=g.createRadialGradient(520,300,30,520,300,510);light.addColorStop(0,'#fff3b500');light.addColorStop(1,'#1b121947');g.fillStyle=light;g.fillRect(0,0,950,531);
 }

}
class CursorScene extends GameScene {
 constructor(canvas,assets){super(canvas,assets);this.box=monsterHitbox('zombie',{x:962,y:534});this.scratchBox=openingHitbox(this.box);this.pointer=null;this.trails=[];}
 get attackBox(){return this.battle?.state==='opening'?this.scratchBox:this.box;}
 async loadBackdrop(room){const canvas=document.createElement('canvas'),r=new RoomRenderer(canvas,this.assets);await r.loadRoom(room);r.roomBackdrop();this.backdrop=canvas;}
 point(tile){const c=(tile-1)%3,r=Math.floor((tile-1)/3);return this.floor((c+.5)/3,(r+.5)/3);}
 floor(u,v){return {x:164-73*v+(351+151*v)*u,y:355+219*v};}
 tilePath(tile){const c=(tile-1)%3,r=Math.floor((tile-1)/3),g=this.ctx;g.beginPath();[[c,r],[c+1,r],[c+1,r+1],[c,r+1]].forEach(([u,v],i)=>{const p=this.floor(u/3,v/3);i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);});g.closePath();}
 shadow(x,y,w){const g=this.ctx;g.fillStyle='#1a111788';g.beginPath();g.ellipse(x,y,w,14,0,0,Math.PI*2);g.fill();}
 actor(key,frame,x,feet,height,flip=false,alpha=1){const g=this.ctx;g.save();g.translate(x,0);if(flip)g.scale(-1,1);this.sprite(key,frame,0,feet,height,alpha);g.restore();}
 coffeeActor(asset,frame,x,feet,height,alpha=1){
  if(asset==='coffee_attack'){this.actor(asset,frame,x,feet,height,false,alpha);return;}
  // captureBeautyCustomer already contains the entire ghost, including its
  // body and hands. Drawing the raw pieces as well duplicates those parts.
  if(this.images.coffee_portrait){this.actor('coffee_portrait',0,x,feet+height*.13,height,false,alpha);return;}
  const g=this.ctx;g.save();g.globalAlpha=alpha;g.imageSmoothingEnabled=false;
  // Keep the user's original pieces separate. The optional portrait carries
  // the player's actual haircut, paint and stickers from the salon.
  // Same 320 × 350 authored pose as the salon; the tail's authored base is y304.
  const scale=height/304,draw=key=>{const img=this.images[key],spec=this.assets.images[key],pose=spec?.pose;if(!img||!spec||!pose)return;g.drawImage(img,pose.sx||0,pose.sy||0,spec.fw,spec.fh,x+(pose.x-160)*scale,feet+(pose.y-304)*scale,pose.w*scale,pose.h*scale);};
  draw('coffee_body');draw('coffee_head');draw('coffee_eyes');draw('coffee_mouth');draw('coffee_hair');draw('coffee_hands');
  g.restore();
 }
 stroke(from,to,time){this.trails.push({from,to,time});this.trails=this.trails.slice(-80);}
 play(kind,b,cue){
  if(kind==='stoneRise'){this.rewardTone(80,.4,'triangle',.2);return;}
  if(kind==='rushLock'){this.rewardTone(420,.1,'square',.07);return;}
  if(kind==='stoneCrash'){super.play('break',b,cue);this.rewardTone(65,.28,'sawtooth',.16);this.rewardTone(740,.24,'triangle',.14,.08);return;}
  if(kind==='hpBars'){this.rewardTone(600+Math.min(8,cue.lost)*60,.045,'triangle',.06);return;}
  if(kind==='staggerBurst'){
   super.play('break',b,cue);this.rewardTone(95,.22,'sine',.4);
   [523.25,659.25,783.99,1046.5].forEach((f,i)=>this.rewardTone(f,.24,'triangle',.12,i*.065));return;
  }
  super.play(kind,b,cue);
 }
 rewardTone(frequency,duration,type,volume,delay=0){
  if(!this.audioReady||!this.enabled)return;
  const o=this.audio.createOscillator(),gain=this.audio.createGain(),t=this.audio.currentTime+delay;o.type=type;o.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.01);gain.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(gain);gain.connect(this.master);this.voices.add(o);o.onended=()=>this.voices.delete(o);o.start(t);o.stop(t+duration+.03);
 }
 gravestone(b){
  const r=b?.rush;if(!r)return;
  const g=this.ctx,p=this.point(r.stone),safe=this.point(r.stone-1),rise=Math.min(1,(b.time-r.started)/320),age=b.time-r.impactAt;
  g.save();
  if(!r.resolved){
   this.tilePath(r.stone-1);g.fillStyle='#54f4c433';g.fill();g.strokeStyle='#91ffe5';g.lineWidth=3;g.stroke();
   g.textAlign='center';g.font='bold 13px Malgun Gothic';g.fillStyle='#cdfff1';g.fillText('유도 위치',safe.x,safe.y+39);
   const row=Math.floor((r.target-1)/3),col=(r.target-1)%3;
   for(let c=col;c<3;c++){this.tilePath(row*3+c+1);g.fillStyle=r.stage==='aim'?'#ff567522':'#ff567566';g.fill();g.strokeStyle=r.stage==='aim'?'#ffb79099':'#ff718c';g.lineWidth=2;g.stroke();}
   const target=this.point(r.target);g.strokeStyle=r.stage==='aim'?'#ffc483':'#ff6388';g.setLineDash([14,10]);g.lineWidth=r.stage==='aim'?2:4;g.beginPath();g.moveTo((b.footwork.position(b.time).x)-28,target.y+10);g.lineTo(target.x,target.y+10);g.stroke();g.setLineDash([]);
   g.beginPath();g.ellipse(target.x,target.y+10,27,12,0,0,Math.PI*2);g.stroke();
   this.shadow(p.x,p.y+14,48);g.translate(p.x,p.y+17);g.scale(1,rise);g.shadowColor='#a879ff';g.shadowBlur=17;
   // Pixel stone, built in canvas to match the existing pixel-art scene.
   g.fillStyle='#393342';g.fillRect(-39,-103,78,112);g.fillRect(-29,-119,58,17);g.fillRect(-18,-128,36,10);g.shadowBlur=0;
   g.fillStyle='#70647d';g.fillRect(-33,-101,59,101);g.fillRect(-24,-114,46,13);g.fillRect(-14,-122,27,9);
   g.fillStyle='#b3a0bf';g.fillRect(-32,-98,6,85);g.fillRect(-23,-113,43,5);g.fillStyle='#92819c';g.fillRect(-43,0,87,14);g.fillStyle='#b4a2bd';g.fillRect(-42,0,85,5);
   g.fillStyle='#dbb8ff';g.fillRect(-4,-88,9,45);g.fillRect(-19,-76,39,9);g.fillStyle='#332c3d';g.fillRect(-19,-27,38,5);g.fillRect(-13,-17,26,4);
  }else{
   g.fillStyle='#685c73';for(let i=0;i<6;i++)g.fillRect(p.x-39+i*14,p.y+3-(i%3)*6,12,8);
  }
  g.restore();
 }
 breakEffects(b){
  if(!this.breakFX||!b)return;
  const age=b.visualTime-this.breakFX.time;if(age<0||age>1500)return;
  const g=this.ctx,cx=this.enemy?.x??962,cy=(this.enemy?.y??534)-157,progress=Math.min(1,age/650),fade=Math.max(0,1-age/1300);
  g.save();
  if(age<650){g.fillStyle='#091e2490';g.globalAlpha=Math.min(1,age/90)*Math.min(1,(650-age)/220);g.fillRect(0,0,1280,650);}
  g.globalAlpha=fade;
  const radius=28+progress*280;g.strokeStyle='#fff5bc';g.lineWidth=8*(1-progress)+1;g.shadowColor='#82fff0';g.shadowBlur=25;g.beginPath();g.ellipse(cx,cy,radius,radius*.75,0,0,Math.PI*2);g.stroke();g.lineWidth=2;g.strokeStyle='#67f8e7';g.beginPath();g.ellipse(cx,cy,radius*.75,radius*.56,0,0,Math.PI*2);g.stroke();
  for(let i=0;i<22;i++){
   const angle=i*2.39996,dist=22+progress*(110+(i%5)*31),x=cx+Math.cos(angle)*dist,y=cy+Math.sin(angle)*dist*.8+progress*progress*90;
   g.save();g.translate(x,y);g.rotate(angle+progress*(i%2?3:-3));g.fillStyle=i%3?'#c9fcf7':'#ffe5a6';g.shadowBlur=10;g.beginPath();g.moveTo(-5-(i%4),-11);g.lineTo(8,0);g.lineTo(2,15);g.lineTo(-9,6);g.closePath();g.fill();g.restore();
  }
  g.shadowBlur=0;
  if(age<650){
   const entrance=Math.min(1,age/140),alpha=Math.min(1,(650-age)/100);g.globalAlpha=alpha;g.translate(598,257);g.rotate(-.045);g.scale(1+Math.max(0,1-entrance)*.3,1+Math.max(0,1-entrance)*.3);
   g.fillStyle='#102c35f5';g.strokeStyle='#b3fff0';g.lineWidth=3;g.beginPath();g.moveTo(-238,-52);g.lineTo(243,-52);g.lineTo(224,46);g.lineTo(-254,46);g.closePath();g.fill();g.stroke();
   g.fillStyle='#adfff1';g.textAlign='center';g.font='bold 11px monospace';g.fillText('OPENING FOUND',0,-31);g.font='900 59px sans-serif';g.lineWidth=5;g.strokeStyle='#183640';g.strokeText('GROGGY!',0,25);g.fillStyle='#fff2b2';g.fillText('GROGGY!',0,25);g.font='bold 18px Malgun Gothic';const reward=this.breakFX.source==='gravestone'?'비석 유도 성공! 무력화 완전 붕괴!':'잘했어! 이제 네 차례야.';g.strokeText(reward,0,77);g.fillStyle='#edfff7';g.fillText(reward,0,77);
  }
  g.restore();
  if(age<115){g.save();g.globalAlpha=.52*(1-age/115);g.fillStyle='#fff7c9';g.fillRect(0,0,1280,650);g.restore();}
 }
 render(b,character,now=0){
  if(this.battle!==b){this.stop();this.battle=b;this.seen=0;this.cues=[];this.trails=[];this.breakFX=null;this.enemy=null;}
  if(b){for(const c of b.cues){if(c.id<=this.seen)continue;this.seen=c.id;this.cues.push(c);if(c.kind==='staggerBurst')this.breakFX={time:c.visualTime,source:c.source,from:this.enemy?{x:this.enemy.x,y:this.enemy.y}:b.footwork.position(b.time)};if(!b.paused)this.play(c.kind,b,c);}this.cues=this.cues.filter(c=>b.visualTime-c.visualTime<1600);}
  const g=this.ctx,t=b?.time??now,vt=b?.visualTime??now,home=b?.footwork.position(t)??{x:962,y:534};g.clearRect(0,0,1280,650);
  g.save();const crash=this.cues.filter(c=>c.kind==='stoneCrash').at(-1),crashAge=crash?vt-crash.visualTime:Infinity;const breakAge=this.breakFX?vt-this.breakFX.time:Infinity;if(Math.min(breakAge,crashAge)<300){const age=Math.min(breakAge,crashAge),strength=9*(1-age/300);g.translate(Math.sin(age*.19)*strength,Math.cos(age*.23)*strength*.5);}
  g.save();g.filter='blur(3px) brightness(.55) saturate(.65)';if(this.backdrop)g.drawImage(this.backdrop,-8,-12,1296,665);else{g.fillStyle='#473a39';g.fillRect(0,0,1280,650);}g.restore();
  const shade=g.createLinearGradient(0,0,0,650);shade.addColorStop(0,'#11141af2');shade.addColorStop(.34,'#15152177');shade.addColorStop(.7,'#261d2500');shade.addColorStop(1,'#11141a77');g.fillStyle=shade;g.fillRect(0,0,1280,650);
  // The tutorial guide watches from the right of the salon, above the mat.
  if(character==='coffee')this.actor('coffee_coach',0,1080,332,300);
  // Gold fighting mat on the salon floor, behind the crisp characters and tiles.
  g.beginPath();g.moveTo(98,329);g.lineTo(1162,329);g.lineTo(1260,610);g.lineTo(18,610);g.closePath();const mat=g.createLinearGradient(0,320,0,610);mat.addColorStop(0,'#aa733bba');mat.addColorStop(1,'#d39e52dd');g.fillStyle=mat;g.fill();g.lineWidth=5;g.strokeStyle='#f8d497a0';g.stroke();
  g.save();g.strokeStyle='#ffe4a343';g.lineWidth=5;g.beginPath();g.ellipse(676,480,190,85,0,0,Math.PI*2);g.stroke();g.beginPath();g.moveTo(666,345);g.lineTo(692,602);g.stroke();g.restore();
  if(b?.state==='opening'||b?.state==='staggerBreak'){g.save();g.fillStyle='#10182455';g.fillRect(0,160,1280,490);const spot=g.createRadialGradient(home.x,home.y-149,30,home.x,home.y-149,310);spot.addColorStop(0,'#abfff833');spot.addColorStop(1,'#70eaff00');g.fillStyle=spot;g.fillRect(620,160,660,490);g.restore();}
  const plan=b?.planInfo,attacking=b?.state==='attack',combo=b?.pattern?.RangeMode==='범위 반복'&&plan?.groups?.length>1;
  const pulse=combo?telegraphVisual(b):null,upcoming=b?.queue?.[0];let warning=attacking?(b.preview??upcoming):null;
  if(attacking&&plan&&t>=plan.firstHit)warning=upcoming;if(combo)warning=pulse?b.preview:null;
  const numbers=[];
  for(let tile=1;tile<=9;tile++){
   const p=this.point(tile),broken=b?.broken[tile]>t,warn=warning?.tiles.includes(tile),hit=b?.flashUntil>t&&b?.flash.includes(tile);
   g.save();this.tilePath(tile);g.fillStyle=broken?'#27232e':hit?'#ff5544':warn?(combo?blendColor('#553e2a','#20d6f1',pulse.alpha):'#ffbf45d9'):'#57311f44';g.fill();g.lineWidth=warn||hit?3:2;g.strokeStyle=hit?'#fff9d7':warn?(combo?'#a7f7ff':'#fff1c0'):'#4e301de6';g.stroke();
   g.font='11px monospace';g.fillStyle='#ffedc7a6';g.fillText(String(tile),p.x-31,p.y+22);
   if(b?.pos===tile&&!broken){g.strokeStyle='#fff0bc88';g.lineWidth=1;g.beginPath();g.ellipse(p.x,p.y,26,10,0,0,Math.PI*2);g.stroke();}
   if(broken){g.strokeStyle='#090e1b';g.lineWidth=5;g.beginPath();g.moveTo(p.x-25,p.y-23);g.lineTo(p.x+12,p.y-7);g.lineTo(p.x-10,p.y+8);g.lineTo(p.x+25,p.y+28);g.stroke();g.fillStyle='#ced4da';g.font='12px monospace';g.fillText(((b.broken[tile]-t)/1000).toFixed(1)+'s',p.x-13,p.y+26);}
   if(warn&&!broken&&combo)numbers.push({p,pulse});
   if(warn&&!broken&&!combo){const progress=Math.max(0,Math.min(1,(t-warning.previewAt)/Math.max(1,warning.due-warning.previewAt)));g.strokeStyle='#fff4d4';g.lineWidth=3;g.beginPath();g.ellipse(p.x,p.y,Math.max(3,38*(1-progress)),Math.max(2,22*(1-progress)),0,0,Math.PI*2);g.stroke();g.font='bold 17px monospace';g.fillText(String(warning.index),p.x+36,p.y+20);}
   g.restore();
  }
  this.gravestone(b);
  let ex=home.x,ey=home.y,asset=character+'_idle',frame=0,height=character==='drunk'?280:character==='sans'?265:285;
  if(character==='drunk'){asset='drunk_'+Math.floor(t/200)%4;}
  if(plan?.motionStarted&&attacking&&t<plan.motionEnd){
   const end=plan.lastHit+220/plan.speed,e=plan.extra,p=Math.max(0,Math.min(.999,(t-plan.motionStart)/Math.max(1,end-plan.motionStart)));
   asset=character==='sans'?(b.pattern.RangeMode==='밀친 위치'?'sans_push':'sans_blaster'):character==='zombie'?'zombie_attack':asset;
   if(e.MotionKey){const custom=Object.keys(this.assets.images).find(k=>k===e.MotionKey||this.assets.images[k].file===e.MotionKey||this.assets.images[k].file.replace(/\.png$/i,'')===e.MotionKey);if(custom)asset=custom;}
   frame=p*(this.assets.images[asset]?.count??1);
   if(asset==='zombie_attack')frame=t<plan.firstHit?Math.min(1,Math.floor((t-plan.motionStart)/Math.max(1,plan.firstHit-plan.motionStart)*2)):2+Math.min(4,(t-plan.firstHit)/Math.max(1,end-plan.firstHit)*5);
   if(asset==='sans_push'||asset==='sans_blaster')frame=t<plan.firstHit?Math.min(1,Math.floor((t-plan.motionStart)/Math.max(1,plan.firstHit-plan.motionStart)*2)):2;
   height=character==='sans'?325:character==='zombie'?325:280;
   if(e.MoveType==='대상까지'||e.MoveType==='고정 거리'){
    const pt=this.point(plan.motionTarget),distance=e.MoveType==='고정 거리'?e.MoveDistance*130:Math.hypot(pt.x-ex,pt.y+22-ey),d=Math.hypot(pt.x-ex,pt.y+22-ey)||1;
    const duration=Math.max(1,Math.min(plan.firstHit-plan.motionStart,e.MoveSpeed?distance/(e.MoveSpeed*130*plan.speed)*1000:plan.firstHit-plan.motionStart));let v=Math.min(1,(t-plan.motionStart)/duration);
    if(t>plan.lastHit)v*=Math.max(0,1-(t-plan.lastHit)/(end-plan.lastHit));ex+=(pt.x-ex)/d*distance*v;ey+=(pt.y+22-ey)/d*distance*v;
   }
   if(character==='drunk')ex+=Math.sin(p*Math.PI)*25;
  }else if(!['opening','staggerBreak'].includes(b?.state))ey+=Math.sin(t/240)*2;
  if(b?.rush){
   const r=b.rush,target=this.point(r.target),end=this.point(r.blocked?r.stone:r.target),aim=Math.min(1,(t-r.started)/300);
   ey=home.y+(target.y+22-home.y)*aim;
   if(['locked','charge','impact'].includes(r.stage)){asset='zombie_attack';height=325;frame=r.stage==='locked'?1:r.stage==='charge'?2:4;}
   let travel=Math.max(0,Math.min(1,(t-r.chargeAt)/r.travelMs));
   if(r.resolved)travel*=1-Math.min(1,Math.max(0,(t-r.impactAt-240)/(r.recoveryMs-240)));
   ex+=(end.x+(r.blocked?52:0)-home.x)*travel;
   if(r.stage==='impact'&&r.success)ex+=Math.sin((t-r.impactAt)/23)*4*Math.max(0,1-(t-r.impactAt)/400);
  }
  if(b?.state==='staggerBreak'&&this.breakFX){const u=Math.min(1,(vt-this.breakFX.time)/420),e=u*u*(3-2*u),from=this.breakFX.from;ex=from.x+(home.x-from.x)*e;ey=from.y+(home.y-from.y)*e;}
  const actor=b?.dialogues?.active?.group.ActorEffect;
  if(actor==='비틀거림')ex+=Math.sin(vt/300)*9;if(actor==='놀람')ey-=Math.abs(Math.sin(vt/140))*6;
  if(b?.state==='opening'){g.save();g.fillStyle='#68eaf4';g.shadowColor='#64e6ed';g.shadowBlur=15;for(let i=0;i<3;i++){const a=vt/430+i*Math.PI*2/3;g.beginPath();g.arc(ex+Math.cos(a)*56,ey-height-20+Math.sin(a)*10,4,0,Math.PI*2);g.fill();}g.restore();}
  const reviving=b?.entryEffect?.type==='부활'&&vt<b.entryEffect.end;
  if(reviving&&this.assets.images[character+'_revive']){asset=character+'_revive';frame=(vt-b.entryEffect.start)/(b.entryEffect.end-b.entryEffect.start)*this.assets.images[asset].count;height=325;ex=home.x;}
  let alpha=b?.actorDead?0:1;
  if(b?.finale?.type==='소멸'){const p=Math.min(1,(vt-b.finale.start)/1200);if(character==='sans'){asset='sans_dead';frame=Math.min(6,Math.floor(p*7));height=325;}alpha*=Math.max(0,1-Math.max(0,p-.65)/.35);}
  const lastEnemyHit=this.cues.filter(c=>['basicHit','openingHit'].includes(c.kind)).at(-1),recoiling=lastEnemyHit&&vt-lastEnemyHit.visualTime<90;
  if(recoiling)ex+=Math.sin(vt/8)*5;
  this.enemy={x:ex,y:ey,height};
  this.box=monsterHitbox(character,{x:ex,y:ey});this.scratchBox=openingHitbox(this.box);
  const area=this.attackBox,opening=b?.state==='opening',hovering=insideBox(this.pointer,area),canTarget=b&&!b.paused&&!b.dialogueBlocking&&(opening||b.canPunch());
  if(opening||this.showHitbox||hovering&&canTarget){
   g.save();g.strokeStyle=opening?'#9effedbb':hovering?'#9ef8f1':'#9ac8d78c';g.fillStyle=opening?'#83eee80b':hovering?'#83eee80c':'#00000000';g.lineWidth=2;g.setLineDash(opening?[12,7]:hovering?[]:[7,6]);g.strokeRect(area.x,area.y,area.w,area.h);g.fillRect(area.x,area.y,area.w,area.h);g.font='10px monospace';g.fillStyle='#ccece8';g.fillText(opening?'좌우로 긁기 ↔':'HIT AREA',area.x+6,opening?area.y+16:area.y-9);
   if(opening&&this.showHitbox){g.strokeStyle='#9ac8d75c';g.setLineDash([3,6]);g.strokeRect(this.box.x,this.box.y,this.box.w,this.box.h);}g.restore();
  }
  this.shadow(ex,ey,character==='drunk'?89:55);
  g.save();
  if(recoiling){g.filter='brightness(1.8)';}
  if(character==='coffee')this.coffeeActor(asset,frame,ex,ey,height,alpha);else this.actor(asset,frame,ex,ey,height,true,alpha);g.restore();
  let pp=this.point(b?.pos??5);const push=plan?.push;
  if(attacking&&push?.started&&!push.done){const from=this.point(push.from),to=this.point(push.dest),p=Math.min(1,(t-push.start)/(push.end-push.start));pp={x:from.x+(to.x-from.x)*p,y:from.y+(to.y-from.y)*p};}
  // The last idle cell is transparent; use its eight populated frames.
  const feedback=this.cues.filter(c=>['hit','basicHit','openingHit'].includes(c.kind)).at(-1);let player='player_idle',pf=Math.floor(t/120)%8;
  if(feedback&&t-feedback.time<300&&feedback.kind==='hit'){player='player_hit';pf=Math.floor((t-feedback.time)/75);}
  // The published sheet declares 16 frames but its final two cells are empty.
  else if(feedback&&t-feedback.time<400&&feedback.kind!=='hit'){player='player_attack';pf=Math.min(13,Math.floor((t-feedback.time)/25));}
  this.playerPosition=pp;
  this.shadow(pp.x,pp.y+16,39);this.actor(player,pf,pp.x,pp.y+26,282,true);
  if(plan?.extra.Effect==='블래스터 레이저'){
   const life=fallback(plan.extra.EffectMs,500)/plan.speed;
   for(const c of this.cues.filter(c=>c.kind==='strike'&&t-c.time<life)){this.actor('blaster',0,800,310,95,true);for(const tile of c.tiles){const p=this.point(tile);g.save();g.globalAlpha=Math.max(0,1-(t-c.time)/life);g.strokeStyle='#70dcf9';g.lineWidth=25;g.beginPath();g.moveTo(800,300);g.lineTo(p.x,p.y);g.stroke();g.strokeStyle='#efffff';g.lineWidth=9;g.stroke();g.restore();}}
  }
  for(const {p,pulse}of numbers){g.save();g.globalAlpha=pulse.numberAlpha;g.translate(p.x,p.y);g.scale(pulse.scale,pulse.scale);g.fillStyle='#fff';g.strokeStyle='#193344';g.lineWidth=5;g.font='bold 50px monospace';g.textAlign='center';g.shadowColor='#38ddff';g.shadowBlur=15;g.strokeText(pulse.label,0,8);g.fillText(pulse.label,0,8);g.restore();}
  for(const c of this.cues){const age=vt-c.visualTime;
   if(c.kind==='stoneCrash'&&age<1300){
    const p=this.point(c.tile),progress=Math.min(1,age/700);g.save();g.globalAlpha=Math.min(1,(1300-age)/400);g.strokeStyle='#d5a6ff';g.lineWidth=6*(1-progress)+1;g.beginPath();g.ellipse(p.x,p.y-45,25+progress*125,17+progress*80,0,0,Math.PI*2);g.stroke();
    for(let i=0;i<14;i++){const a=i*2.4,dist=progress*(55+i%4*20);g.fillStyle=i%3?'#b497cb':'#f3dbff';g.fillRect(p.x+Math.cos(a)*dist,p.y-60+Math.sin(a)*dist+progress*progress*70,7+i%4,9);}
    g.textAlign='center';g.font='900 29px Malgun Gothic';g.lineWidth=5;g.strokeStyle='#291735';g.fillStyle='#e7c4ff';if(this.breakFX?.source!=='gravestone'){g.strokeText('비석 충돌!  무력화 붕괴',640,251-age*.018);g.fillText('비석 충돌!  무력화 붕괴',640,251-age*.018);}g.restore();
   }
   if(['basicHit','openingHit'].includes(c.kind)&&age<800){g.save();g.globalAlpha=Math.min(1,(800-age)/220);g.textAlign='center';g.font='900 '+(c.value>100000?36:32)+'px monospace';g.lineWidth=5;g.strokeStyle='#341b24';g.fillStyle=c.kind==='openingHit'?'#b6fffa':'#ffe2a4';const x=ex+((c.hit%5)-2)*27,y=ey-height+55-age*.13,label=c.immune?'MISS':String(c.value);g.strokeText(label,x,y);g.fillText(label,x,y);g.restore();}
   if(c.kind==='basicHit'&&age<480){g.save();g.globalAlpha=1-age/480;g.strokeStyle='#fff0b2';g.lineWidth=4;const r=16+age*.15;for(let i=0;i<8;i++){const a=i*Math.PI/4;g.beginPath();g.moveTo(ex+Math.cos(a)*r,ey-140+Math.sin(a)*r);g.lineTo(ex+Math.cos(a)*(r+14),ey-140+Math.sin(a)*(r+14));g.stroke();}g.restore();}
   if(c.kind==='hit'&&age<320){g.save();g.globalAlpha=(1-age/320)*.17;g.fillStyle='#ff264d';g.fillRect(0,0,1280,650);g.restore();}
  }
  this.trails=this.trails.filter(c=>t-c.time<190);g.save();g.lineCap='round';for(const s of this.trails){g.globalAlpha=(1-(t-s.time)/190)*.85;g.strokeStyle='#b5ffff';g.lineWidth=4;g.shadowColor='#43f2ee';g.shadowBlur=10;g.beginPath();g.moveTo(s.from.x,s.from.y);g.lineTo(s.to.x,s.to.y);g.stroke();}g.restore();
  if(b?.state==='opening'){g.save();g.strokeStyle='#64e6edaa';g.lineWidth=6;g.shadowColor='#7ffff0';g.shadowBlur=20;g.strokeRect(3,3,1274,644);g.restore();}
  this.breakEffects(b);g.restore();
 }
}

