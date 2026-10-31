// Choreography made from supplied sprites. No new character artwork is generated.
export class TutorialRoom{
 constructor(canvas,assets,guest){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.assets=assets;this.guest=guest;this.images=new Map();this.pose='idle';this.since=performance.now();this.player={x:380,y:450,direction:'front',frame:0};this.keys=new Set();this.interactive=false;this.disposed=false;this.last=performance.now();this.result=null;this.sprites={front:'./media/a60f39797ec2a08be94bb830.png',back:'./media/a8779e7993df7187d998345f.png',left:'./media/855ab40978f1cafb6734db12.png',right:'./media/f3c56ecc6e0e4af16a6051d8.png'};}
 async load(){const room=this.assets.room,l=this.guest.skin.layers,sources=[room.wall,room.floor,room.carpet,...room.layers.map(p=>p.src),this.assets.minion.full,this.assets.zombieHead,this.assets.sansHead,...Object.values(this.sprites),...Object.entries(this.assets.minion.animation.front).filter(([k])=>["body","head","hair"].includes(k)).map(([,v])=>v)];for(const key of ['head','material','body','hands'])if(l[key])sources.push(l[key].src);for(const key of ['eyes','mouth'])for(const a of Object.values(l[key]||{}))sources.push(a.src);await Promise.all([...new Set(sources)].map(async src=>{const image=new Image();image.src=src;await image.decode();if(src===l.material.src&&l.material.whiteKey){const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i]>=250&&pixels.data[i+1]>=250&&pixels.data[i+2]>=250)pixels.data[i+3]=0;ctx.putImageData(pixels,0,0);this.images.set(src,canvas);}else this.images.set(src,image);}));this.loop(performance.now());}
 setPose(pose){this.pose=pose;this.since=performance.now();this.keys.clear();}
 async setPortrait(src){if(!src){this.result=null;return;}const image=new Image();image.src=src;await image.decode();this.result=image;}
 drawLayer(ctx,a){if(!a)return;const image=this.images.get(a.src);if(!image)return;if(a.sw)ctx.drawImage(image,a.sx||0,a.sy||0,a.sw,a.sh,a.x,a.y,a.w,a.h);else ctx.drawImage(image,a.x,a.y,a.w,a.h);}
 ghost(ctx,x,y,scale=1,hair=1,result=false){ctx.save();ctx.translate(x-160*scale,y-350*scale);ctx.scale(scale,scale);if(result&&this.result){ctx.drawImage(this.result,0,0,320,350);}else{const l=this.guest.skin.layers;this.drawLayer(ctx,l.body);this.drawLayer(ctx,l.head);this.drawLayer(ctx,l.eyes.neutral);this.drawLayer(ctx,l.mouth.closed);ctx.save();const a=l.material;ctx.translate(160,a.y+a.h);ctx.scale(1,hair);ctx.translate(-160,-a.y-a.h);this.drawLayer(ctx,a);ctx.restore();this.drawLayer(ctx,l.hands);}ctx.restore();}
 helper(canvas){const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,320,350);this.ghost(ctx,160,350,1,1);}
 room(){const c=this.ctx,r=this.assets.room;c.fillStyle='#211e24';c.fillRect(0,0,950,531);c.drawImage(this.images.get(r.wall),0,0,950,324);const tile=this.images.get(r.floor),th=118*tile.height/tile.width;for(let y=265;y<531;y+=th)for(let x=0;x<950;x+=118)c.drawImage(tile,x,y,118,th);const dim=(s,base)=>String(s).endsWith('%')?parseFloat(s)*base/100:parseFloat(s)||0;for(const p of [...r.layers].sort((a,b)=>(+a.style['z-index']||0)-(+b.style['z-index']||0))){const s=p.style,im=this.images.get(p.src),w=dim(s.width,950)||im.width,h=dim(s.height,531)||w*im.height/im.width,x=s.left&&s.left!=='auto'?dim(s.left,950):950-dim(s.right,950)-w,y=s.top?dim(s.top,531):531-dim(s.bottom,531)-h,ratio=Math.min(w/im.width,h/im.height);c.save();c.globalAlpha=s.opacity?+s.opacity:1;c.translate(x+w/2,y+h/2);c.rotate(Number(s.transform?.match(/rotate\(([-\d.]+)/)?.[1]||0)*Math.PI/180);c.drawImage(im,-im.width*ratio/2,-im.height*ratio/2,im.width*ratio,im.height*ratio);c.restore();}const light=c.createRadialGradient(520,280,70,520,280,650);light.addColorStop(0,'#09141b00');light.addColorStop(1,'#09141b9a');c.fillStyle=light;c.fillRect(0,0,950,531);}
 cup(c,x,y,scale=1){const image=this.images.get(this.assets.minion.full);c.save();c.imageSmoothingEnabled=false;/* Existing cup/hand crop, used as temporary choreography. */c.drawImage(image,24,50,18,26,x-9*scale,y-26*scale,18*scale,26*scale);c.restore();}
 minion(c,x=690,y=425,holding=false){const image=this.images.get(this.assets.minion.full);c.save();c.translate(x-80,y-210);c.scale(1.4,1.4);if(!holding){c.beginPath();c.rect(0,0,115,150);c.rect(0,0,33,50);c.rect(18,49,23,29);c.clip('evenodd');}c.drawImage(image,0,0);c.restore();}
 city(){const c=this.ctx;c.fillStyle='#1a2930';c.fillRect(0,0,950,531);c.fillStyle='#31474b';for(let i=0;i<12;i++)c.fillRect(i*83,65+(i%3)*20,70,265);c.fillStyle='#c6ddc030';for(let i=0;i<35;i++)c.fillRect((i*73)%950,95+Math.floor(i/13)*65,12,20);c.fillStyle='#111b24';c.fillRect(0,330,950,201);const z=this.images.get(this.assets.zombieHead),s=this.images.get(this.assets.sansHead);for(let i=0;i<7;i++){c.drawImage(z,90+i*112,260,68,84);c.drawImage(s,22,34,29,31,100+i*112,385,64,68);}c.textAlign='center';c.fillStyle='#e5d5b1';c.font='bold 20px Malgun Gothic';c.fillText('같은 종족, 같은 모습',475,55);}
 loop(now){if(this.disposed)return;const dt=Math.min(.05,(now-this.last)/1000);this.last=now;const age=now-this.since,c=this.ctx;c.imageSmoothingEnabled=false;c.clearRect(0,0,950,531);if(this.pose==='city')this.city();else{this.room();if(!['empty','depart','cup','presentation','briefing'].includes(this.pose))this.minion(c,690,425,this.pose==='idle');if(this.pose==='briefing'&&this.briefing){this.drawBriefing(now);}else if(this.pose==='cup'){c.fillStyle='#06100b99';c.fillRect(0,0,950,531);c.save();c.translate(475,280);c.scale(2.2,2.2);this.minion(c,0,100,true);c.restore();}else if(this.pose==='depart'){const t=Math.min(1,age/2150),ease=t*t*(3-2*t);c.save();c.globalAlpha=Math.min(1,(1-t)*6);this.minion(c,690-800*ease,425-Math.sin(t*Math.PI*8)*3);this.cup(c,640-800*ease,325-Math.sin(t*Math.PI*8)*3,1.4);this.ghost(c,505-575*ease,342+75*Math.sin(t*Math.PI/2),.48,1,true);c.restore();}else if(this.pose==='placing'){const t=Math.min(1,age/950),x=635-90*t,y=330+110*t;this.cup(c,x,y,1.4);}else if(this.pose==='emerge'){this.cup(c,545,445,1.4);const t=Math.min(1,age/1300),ease=1-Math.pow(1-t,3);c.save();c.globalAlpha=Math.min(1,t*3);this.ghost(c,545,440,Math.max(.03,ease*.48),Math.max(.05,Math.min(1,(age-650)/550)));c.restore();}else if(this.pose==='seat'){const t=Math.min(1,age/1200),ease=t*t*(3-2*t);this.cup(c,545,445,1.4);this.ghost(c,545+(505-545)*ease,440+(342-440)*ease-Math.sin(t*Math.PI)*45,.48);}else if(['seated','finish','idle'].includes(this.pose)){if(this.pose!=='idle'){this.cup(c,545,445,1.4);this.ghost(c,505,342+Math.sin(now/800)*2,.48,1,this.pose==='finish');}}
 if(this.interactive){let dx=Number(this.keys.has('d'))-Number(this.keys.has('a')),dy=Number(this.keys.has('s'))-Number(this.keys.has('w'));if(dx||dy){const factor=(dx&&dy)?Math.SQRT1_2:1;this.player.x=Math.max(110,Math.min(860,this.player.x+dx*180*dt*factor));this.player.y=Math.max(325,Math.min(485,this.player.y+dy*180*dt*factor));this.player.direction=Math.abs(dx)>=Math.abs(dy)?dx<0?'left':'right':dy<0?'back':'front';this.player.frame=Math.floor(now/120)%6;}else this.player.frame=0;}
 const p=this.player,im=this.images.get(this.sprites[p.direction]),f=p.frame;c.drawImage(im,(f%3)*219,Math.floor(f/3)*162,219,162,p.x-109.5,p.y-162,219,162);}
 this.raf=requestAnimationFrame(t=>this.loop(t));}
 distanceTo(actor){const target={coffee:{x:505,y:375},minion:{x:690,y:410}}[actor];return target?Math.hypot(this.player.x-target.x,this.player.y-target.y):Infinity;}
 canTalk(actor){return this.interactive&&this.distanceTo(actor)<=105;}
 nearest(){return ['coffee','minion'].filter(actor=>this.canTalk(actor)).sort((a,b)=>this.distanceTo(a)-this.distanceTo(b))[0]||null;}
 dispose(){this.disposed=true;cancelAnimationFrame(this.raf);this.keys.clear();}
 drawBriefing(now){
  const c=this.ctx,{index,since,variant}=this.briefing,age=Math.max(0,now-since),t=Math.min(1,age/850);
  // Keep the supplied minion; omit its baked-in tiny ghost while this larger pose acts.
  c.save();c.translate(610,215);c.scale(1.4,1.4);c.beginPath();c.rect(0,0,115,150);c.rect(0,0,33,50);c.clip('evenodd');c.drawImage(this.images.get(this.assets.minion.full),0,0);c.restore();
  const polygon=(points,fill,stroke='#0c6467')=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2.5;c.stroke();}};
  const star=(x,y,r,fill='#ffe26c')=>{const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}polygon(pts,fill,'#967235');};
  if(index===0){
   // A raised remote, a button press and a short signal towards the projector.
   c.save();c.translate(730,323);c.rotate(-.55*Math.min(1,t*3));
   polygon([[0,0],[13,-4],[20,-30],[8,-34]],'#272433','#171622');
   polygon([[5,-31],[20,-31],[20,-60],[5,-60]],'#303d4b','#161c26');
   c.fillStyle=age<550?'#ffdc83':'#b34f52';c.fillRect(9,-54,7,6);c.restore();
   if(age<1000){c.save();c.globalAlpha=Math.sin(Math.min(1,age/1000)*Math.PI);c.strokeStyle='#fff4aa';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.arc(737,271,12+i*9,-Math.PI*.85,-Math.PI*.3);c.stroke();}c.font='bold 15px Malgun Gothic';c.fillStyle='#fff4aa';c.fillText('삑',756,249);c.restore();}return;
  }
  // Temporary cup-ghost acting poses based on the user's five-panel storyboard.
  const rise=index===1?1-Math.pow(1-t,3):1,bob=Math.sin(age/480)*2;
  c.save();c.translate(615,303+bob);c.scale(1,Math.max(.05,rise));c.globalAlpha=Math.min(1,rise*2);
  c.beginPath();c.moveTo(25,0);c.bezierCurveTo(-13,-7,-3,-31,-18,-42);c.bezierCurveTo(-43,-52,-35,-85,-19,-94);c.bezierCurveTo(-9,-104,-19,-115,-10,-121);c.bezierCurveTo(9,-116,7,-103,4,-99);c.bezierCurveTo(33,-101,42,-77,30,-56);c.bezierCurveTo(16,-40,38,-27,25,0);c.closePath();c.fillStyle='#65e3b3';c.fill();c.strokeStyle='#126d76';c.lineWidth=3;c.stroke();
  c.fillStyle='#c7ffe2';c.beginPath();c.ellipse(-15,-82,7,4,-.4,0,Math.PI*2);c.fill();
  // Clearly readable eyes and a smile; no floating explanatory text.
  if(index!==4&&(index!==2||variant===2)){c.fillStyle='#174e52';c.fillRect(-17,-76,6,12);c.fillRect(9,-76,6,12);}
  c.beginPath();if(index===2&&variant!==2){c.moveTo(-8,-51);c.lineTo(7,-51);}else c.arc(-1,-57,8,0,Math.PI);c.strokeStyle='#174e52';c.lineWidth=3;c.stroke();
  if(index===1&&variant!==2){
   // Open palm: inviting the player's own aesthetic choices.
   polygon([[-23,-56],[-44,-53],[-54,-62],[-57,-58],[-51,-46],[-42,-43],[-23,-47]],'#91f5cb');
  }
  if(index===2&&variant!==2){
   // Determined eyebrows, narrow eyes, and two fists raised into a fighting stance.
   c.strokeStyle='#174e52';c.lineWidth=4;
   c.beginPath();c.moveTo(-23,-83);c.lineTo(-9,-77);c.moveTo(6,-77);c.lineTo(21,-83);c.stroke();
   c.fillStyle='#174e52';c.fillRect(-18,-74,9,5);c.fillRect(7,-74,9,5);
   const lift=1-Math.pow(1-t,3);
   for(const side of [-1,1]){
    c.save();c.scale(side,1);c.translate(26,-36-lift*20);
    polygon([[0,8],[16,7],[27,-7],[26,-20],[9,-20],[7,-7],[-2,0]],'#65e3b3');
    polygon([[8,-17],[6,-29],[11,-34],[17,-34],[21,-32],[27,-32],[31,-27],[30,-13],[25,-9],[12,-10]],'#91f5cb');
    c.strokeStyle='#126d76';c.lineWidth=2;c.beginPath();c.moveTo(15,-29);c.lineTo(15,-21);c.moveTo(22,-29);c.lineTo(22,-21);c.stroke();c.restore();
   }
  }
  if(variant===2&&index===1){
   polygon([[-24,-58],[-47,-71],[-50,-81],[-43,-79],[-38,-69],[-21,-67]],'#65e3b3');
   polygon([[24,-59],[43,-71],[46,-82],[52,-81],[49,-68],[27,-49]],'#65e3b3');
   for(let i=0;i<3;i++){c.save();const q=Math.min(1,Math.max(0,(age-280-i*170)/350));c.globalAlpha=q;star(-39+i*39,-143-Math.sin(q*Math.PI)*10,16);c.restore();}
  }
  if(variant===2&&index===2){
   c.save();c.translate(-28,-48-Math.sin(t*Math.PI)*9);
   polygon([[0,8],[-15,8],[-22,3],[-37,3],[-40,-3],[-39,-22],[-33,-27],[-32,-44],[-26,-48],[-21,-44],[-21,-29],[-12,-29],[-8,-23],[-12,-5],[0,-3]],'#91f5cb');c.restore();
  }
  if(variant===2&&index===3){
   const reach=Math.min(1,age/500);c.save();c.translate(22,-59);c.scale(Math.max(.1,reach),1);
   polygon([[0,0],[26,-3],[27,-10],[38,-10],[39,-7],[62,-7],[66,-3],[63,1],[44,1],[44,6],[38,12],[24,11],[0,9]],'#91f5cb');c.restore();
  }
  if(index===4){
   for(const x of [-14,12]){const pulse=1+.18*Math.sin(age/150);c.save();c.translate(x,-70);c.scale(pulse,pulse);polygon([[0,-11],[4,-4],[9,0],[4,4],[0,11],[-4,4],[-9,0],[-4,-4]],'#fff4a6','#408a77');c.restore();}
   for(let i=0;i<3;i++){const a=age/450+i*2;c.save();c.globalAlpha=.35+.65*Math.abs(Math.sin(a));star(-43+i*42,-104-(i%2)*13,5,'#fff6bc');c.restore();}
  }
  c.restore();
 }
}
