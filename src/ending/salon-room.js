// Included inside the demon visitor closure. Uses the current salon and completed portrait.
let endingRoom=null;
async function prepareDemonEndingRoom(head,form='handsome'){
 const images={};
 await Promise.all(Object.entries({body:form==='goblin'?'./media/demon-battle/demon_idle3.png':'./media/ending/king-body-source.png',head:head||'./media/demon/goblin.png',
 camera:'./media/ending/T_yacha_win.png',hero:SPRITES.front,minion:GUEST.companion,coffee:'./media/coffee-ghost/appeared-sheet.png',
 magic:'./media/intro/pt/summoning.png'}).map(async([key,src])=>{
  const im=new Image();im.src=src;await im.decode();images[key]=im;
 }));
 const layer=document.createElement('canvas');layer.id='demonEndingRoom';layer.width=950;layer.height=531;
 layer.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:80;pointer-events:none;image-rendering:pixelated';
 gameWorld.append(layer);
 for(const n of [player,shadow,standing,companion,customer,customerShadow,seatedCustomer,mimic])n.style.visibility='hidden';
 for(const n of gameWorld.querySelectorAll('.phone,.hudTop,.help,.resourceNote,#interactPrompt'))n.style.visibility='hidden';
 dialogueState.active=true;customerState.phase='cutscene';state.keys.clear();
 endingRoom={form,layer,cx:layer.getContext('2d'),images,scene:'room',elapsed:0,group:0,coffee:0,loyalty:0,portalReady:false,last:performance.now(),ack:false};
 endingRoom.scenery={};
 await Promise.all(['.wall','.floor'].map(async selector=>{const url=getComputedStyle(gameWorld.querySelector(selector)).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];if(url){const im=new Image();im.src=url;await im.decode();endingRoom.scenery[url]=im;}}));
 renderDemonEndingRoom();
 requestAnimationFrame(demonEndingRoomTick);
 send('demon-room-ready');
}
function endingSprite(cx,im,x,feet,h){cx.drawImage(im,x-h*im.width/im.height/2,feet-h,h*im.width/im.height,h);}
function drawEndingActors(cx,{group=0,coffee=0,sink=0,portal=0,time=0}={}){
 const im=endingRoom.images,lerp=(a,b)=>a+(b-a)*group;
 const hx=lerp(330,endingRoom.form==='goblin'?520:300),kx=lerp(580,endingRoom.form==='goblin'?325:470),mx=lerp(745-endingRoom.loyalty*75,640),cy=420;
 cx.imageSmoothingEnabled=false;
 if(portal>0){
  cx.save();cx.globalAlpha=portal;cx.shadowColor='#44ffac';cx.shadowBlur=16;
  // Only the floor circle in the supplied summon art; no character is copied.
  cx.drawImage(im.magic,150,680,1250,260,hx-115,cy-20,230,49);
  cx.restore();
 }
 if(endingRoom.form==='goblin'){endingSprite(cx,im.body,kx,cy,155);}else{
 // Retain the team's body, excluding the original head region at runtime.
 const scale=1.32,bx=kx-76*scale,by=cy-181*scale;
 cx.save();cx.translate(bx,by);cx.scale(scale,scale);
 cx.beginPath();cx.rect(0,61,152,120);cx.rect(0,0,50,61);cx.rect(105,0,47,61);cx.clip();cx.drawImage(im.body,0,0,152,181);cx.restore();
 const hh=92,hw=hh*im.head.width/im.head.height;
 cx.drawImage(im.head,kx-hw/2,by-4,hw,hh);
 }
 endingSprite(cx,im.minion,mx,cy,170);
 cx.save();cx.beginPath();cx.rect(0,0,950,cy+2);cx.clip();cx.globalAlpha=1-sink*.85;
 const heroH=214,heroW=heroH*219/162;
 if(endingRoom.scene==='refuse'){cx.translate(hx,cy-heroH/2);cx.rotate(Math.sin(time/70)*.075);cx.translate(-hx,-cy+heroH/2);}
 if(['camera','photo'].includes(endingRoom.scene)&&endingRoom.form==='goblin'){
  // Authored sheet: nine 360x247 cells, shared visible bounds x153..221, y143..246.
  const frame=endingRoom.scene==='camera'?Math.min(8,Math.floor(time/120)):8,h=174,w=h*69/104;
  endingRoom.layer.dataset.cameraFrame=frame;
  cx.drawImage(im.camera,frame*360+153,143,69,104,hx-w/2,cy-h,w,h);
 }else cx.drawImage(im.hero,0,0,219,162,hx-heroW/2,cy-heroH+sink*220,heroW,heroH);
 cx.restore();
 if(coffee>0){
  const x=lerp(880,790),h=132;cx.globalAlpha=coffee;
  // Read the first authored walk sprite cell.
  const fw=89,fh=97;
  cx.drawImage(im.coffee,0,291,fw,fh,x-h/2,cy-h+Math.sin(time/360)*3,h,h);cx.globalAlpha=1;
 }
}
function drawDemonEndingBackdrop(cx){
 // Compose the live salon's scenery only: character layers are deliberately separate.
 const bounds=gameWorld.getBoundingClientRect(),sx=950/bounds.width,sy=531/bounds.height;
 cx.save();cx.scale(1,650/531);cx.fillStyle='#504340';cx.fillRect(0,0,950,531);
 for(const selector of ['.wall','.floor']){
  const el=gameWorld.querySelector(selector),style=getComputedStyle(el),url=style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
  const im=endingRoom.scenery?.[url];if(!im)continue;
  const b=el.getBoundingClientRect();cx.drawImage(im,(b.left-bounds.left)*sx,(b.top-bounds.top)*sy,b.width*sx,b.height*sy);
 }
 const props=[...gameWorld.querySelectorAll('img.prop')].sort((a,b)=>(parseInt(getComputedStyle(a).zIndex)||0)-(parseInt(getComputedStyle(b).zIndex)||0));
 for(const im of props){if(!im.complete||!im.naturalWidth)continue;const style=getComputedStyle(im);if(style.display==='none'||style.visibility==='hidden')continue;const b=im.getBoundingClientRect(),w=b.width*sx,h=b.height*sy,k=Math.min(w/im.naturalWidth,h/im.naturalHeight);cx.drawImage(im,(b.left-bounds.left)*sx+(w-im.naturalWidth*k)/2,(b.top-bounds.top)*sy+(h-im.naturalHeight*k)/2,im.naturalWidth*k,im.naturalHeight*k);}
 cx.restore();
}
function renderDemonEndingRoom(){
 const r=endingRoom;if(!r)return;const t=r.elapsed,cx=r.cx;cx.clearRect(0,0,950,531);
 let sink=0,portal=0;
 if(r.scene==='loyalty')r.loyalty=Math.min(1,t/700);
 if(r.scene==='coffee')r.coffee=Math.min(1,t/650);
 if(r.scene==='group')r.group=Math.min(1,t/850);
 if(r.scene==='portal'){r.group=Math.max(0,1-t/650);portal=Math.min(1,Math.max(0,(t-650)/650));}
 if(r.scene==='depart'){r.group=0;portal=1;sink=Math.min(1,t/650);}
 if(r.scene==='return'){r.group=Math.max(0,1-t/650);portal=Math.min(1,Math.max(0,(t-650)/1000));sink=Math.min(1,Math.max(0,(t-1650)/1200));}
 drawEndingActors(cx,{group:r.group,coffee:r.coffee,sink,portal,time:t});
 if(r.scene==='photo'&&r.form!=='goblin'&&t<160){cx.fillStyle='#fff';cx.globalAlpha=1-t/160;cx.fillRect(0,0,950,531);cx.globalAlpha=1;}
 if(r.scene==='depart'&&t>1000){cx.fillStyle='rgba(0,0,0,'+Math.min(1,(t-1000)/650)+')';cx.fillRect(0,0,950,531);}
 if(r.scene==='return'&&t>2850){cx.fillStyle='rgba(0,0,0,'+Math.min(1,(t-2850)/650)+')';cx.fillRect(0,0,950,531);}
}
function demonEndingRoomTick(now){
 const r=endingRoom;if(!r||!r.layer.isConnected)return;
 const paused=settingsOpen()||document.hidden;
 const dt=Math.min(80,now-r.last);r.last=now;if(!paused)r.elapsed+=dt;
 if(r.paused!==paused){r.paused=paused;send('demon-ending-paused',{paused});}
 renderDemonEndingRoom();
 if(r.scene==='camera'){for(const at of [120,720])if(r.elapsed>=at&&!r.shutters.has(at)){r.shutters.add(at);send('demon-ending-shutter');}}
 const durations={loyalty:750,refuse:1100,coffee:700,group:900,camera:1080,photo:800,portal:1350,depart:1700,return:3500};
 if(!r.ack&&r.elapsed>=(durations[r.scene]||Infinity)){
  r.ack=true;
  if(r.scene==='photo'){
   const c=document.createElement('canvas');c.width=950;c.height=650;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
   drawDemonEndingBackdrop(x);x.save();x.translate(0,80);drawEndingActors(x,{group:1,coffee:1});x.restore();
   send('demon-ending-room-done',{scene:r.scene,photo:c.toDataURL('image/png')});
  }else send('demon-ending-room-done',{scene:r.scene});
 }
 requestAnimationFrame(demonEndingRoomTick);
}
function setDemonEndingScene(scene){
 if(!endingRoom||!['loyalty','refuse','coffee','group','camera','photo','portal','depart','return'].includes(scene))return;
 endingRoom.scene=scene;endingRoom.layer.dataset.scene=scene;endingRoom.elapsed=0;endingRoom.ack=false;endingRoom.shutters=new Set();
}
