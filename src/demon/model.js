export const DEMON_SIZE={width:320,height:350};
export const DEMON_STAR_THRESHOLDS=[5000,5500,6100]; // Playtest pacing: retain the existing first-star milestone.
export const DEMON_FACE_LIMIT=.15;
export const DEMON_LINES={
 arrival:[['부하','약속드린 날짜가 되어 마왕님을 모셔왔습니다.'],['마왕','호오.. 단기간에 미용 실력을 증명했다던 자가 자네인가?'],['마왕','그럼.. 우선 이 모습부터 맡겨보지']],
 warning:'그곳은 복원할 곳이 아니다. 손을 멈추게.',
 warningAgain:'얼굴에는 손대지 말라고 했을 텐데.',
 face:'머리만 부탁했네. 얼굴에 묻은 것은 닦아주게.',
 color:'그 색은 눈에 띄는군. 이번에는 검정으로 부탁하네.',
 sticker:'장식은 거추장스럽군. 전투에 나설 때는 필요 없네.',
 confession:[['마왕','……내가 요구한 것은 모두 해냈군.'],['마왕','하지만 그대에게 아직 보여주지 못한 모습이 있다.']],
 freedom:[['마왕','이번에는 전장을 위한 차림이 아니네.'],['마왕','이 모습에 어울리는 것을…… 그대에게 맡겨보고 싶군.']]
};
export function demonGate(stars){
 const n=Math.max(0,Math.min(3,Math.floor(Number(stars)||0)));
 return {stars:n,admitted:n===3,line:n===3?'흠.. 3스타 미용실.. 일단 합격이군.':[
  '별 하나 없는 곳에 내 머리를 맡기라는 것이냐?',
  '흥… 별이 하나뿐인가. 형편없는 미용실이군.',
  '별이 둘이라… 내 머리를 맡기엔 부족하군.'
 ][n]};
}
export function demonJudge(phase,m={}){
 if(phase===3)return {success:true,locked:true,checks:[true]};
 if(phase===1){const checks=[m.horn>=.92&&m.excess<=.06,m.scratches>=.96&&m.bodyLoss<=.02,m.exposure===0&&m.stickers===0];return {success:checks.every(Boolean),sudden:m.exposure>=DEMON_FACE_LIMIT,checks};}
 const checks=[m.trim>=.97&&m.keep>=.55,m.black>=.995,m.facePaint===0&&m.stickers===0];
 return {success:checks.every(Boolean),sudden:false,checks};
}
export function demonProtest(phase,kind){
 if(phase!==2)return '';
 return ({face:DEMON_LINES.face,color:DEMON_LINES.color,sticker:DEMON_LINES.sticker})[kind]||'';
}
export class DemonPixels {
 constructor(phase,layers,width=320,height=350){
  this.phase=phase;this.w=width;this.h=height;this.count=width*height;this.base=layers.base;
  this.source=layers.material.slice();this.material=layers.material.slice();
  this.stones=(layers.stones||new Uint8ClampedArray(this.count*4)).slice();
  this.paint=new Uint8ClampedArray(this.count*4);this.placements=[];this.history=[];
  this.target=(layers.hornTarget||layers.material).slice();this.ears=layers.ears||new Uint8ClampedArray(this.count*4);
  this.faceMask=new Uint8Array(this.count);this.scratchMask=new Uint8Array(this.count);this.trimMask=new Uint8Array(this.count);this.hornMask=new Uint8Array(this.count);
  for(let n=0;n<this.count;n++){
   const x=n%width,y=Math.floor(n/width),i=n*4,r=this.source[i],g=this.source[i+1],b=this.source[i+2],a=this.source[i+3];
   this.faceMask[n]=Number(this.base[i+3]>180&&(phase!==1||y>=168&&y<258)&&x>85&&x<232);
   this.scratchMask[n]=Number(phase===1&&a>180&&r>85&&r<205&&g>85&&b-r<55&&Math.abs(r-g)<40);
   this.hornMask[n]=Number(phase===1&&x>185&&y<117&&this.target[i+3]>180&&this.target[i+2]>110&&this.target[i]<125);
   this.trimMask[n]=Number(phase===2&&a>180&&(y>224||this.ears[i+3]>100));
  }
 }
 save(){this.history.push({material:this.material.slice(),stones:this.stones.slice(),paint:this.paint.slice(),placements:this.placements.map(p=>({...p}))});if(this.history.length>14)this.history.shift();}
 undo(){const p=this.history.pop();if(p)Object.assign(this,p);return !!p;}
 stroke(x,y,radius,tool,color=[24,21,31]){
  let changed=false,faceHit=false,colored=false;const w=this.w;
  for(let py=Math.max(0,Math.floor(y-radius));py<=Math.min(this.h-1,Math.ceil(y+radius));py++)for(let px=Math.max(0,Math.floor(x-radius));px<=Math.min(w-1,Math.ceil(x+radius));px++){
   if((px-x)**2+(py-y)**2>radius**2)continue;const n=py*w+px,i=n*4;
   if(tool==='hammer'){
    const layer=this.phase===3?this.stones:this.phase===1?this.material:null;
    if(layer?.[i+3]){if(this.phase===1&&this.faceMask[n])faceHit=true;layer[i+3]=0;this.paint.fill(0,i,i+4);changed=true;}
   }else if(tool==='scissors'&&this.phase!==1){if(this.material[i+3]){this.material[i+3]=0;this.paint.fill(0,i,i+4);changed=true;}}
   else if(tool==='tonic'){
    if(this.phase===1){
     if(px<185||px>291||py>117)continue;
     if(this.target[i+3])this.material.set(this.target.subarray(i,i+4),i);
     else this.material.set([72,83,248,255],i);
     changed=true;
    }else if(this.source[i+3]||this.material[i-4+3]||this.material[i+4+3]){this.material.set(this.source[i+3]?this.source.subarray(i,i+4):[235,235,245,255],i);changed=true;}
   }else if(tool==='paint'&&(this.material[i+3]||this.base[i+3]||this.stones[i+3])){
    this.paint.set([...color,255],i);changed=true;colored=true;
    if(this.faceMask[n]&&!this.material[i+3])faceHit=true;
   }else if(tool==='erase'&&this.paint[i+3]){this.paint.fill(0,i,i+4);changed=true;}
  }
  return {changed,faceHit,colored};
 }
 metrics(){
  let horn=0,hornTotal=0,extra=0,scratch=0,scratchTotal=0,removed=0,body=0,face=0,exposed=0,trim=0,trimTotal=0,keep=0,keepTotal=0,hair=0,black=0,facePaint=0;
  for(let n=0;n<this.count;n++){
   const i=n*4,exists=this.material[i+3]>100,orig=this.source[i+3]>100,painted=this.paint[i+3]>0;
   if(this.hornMask[n]){hornTotal++;if(exists)horn++;}
   if(this.phase===1&&exists&&!this.target[i+3])extra++;
   if(this.scratchMask[n]){scratchTotal++;if(exists&&painted&&this.paint[i]<65&&this.paint[i+1]<65&&this.paint[i+2]<90)scratch++;}
   if(this.phase===1&&orig&&!this.hornMask[n]){body++;if(!exists)removed++;}
   if(this.faceMask[n]&&orig){face++;if(!exists)exposed++;}
   if(this.trimMask[n]){trimTotal++;if(!exists)trim++;}else if(orig){keepTotal++;if(exists)keep++;}
   if(exists){hair++;if(painted&&this.paint[i]<=35&&this.paint[i+1]<=35&&this.paint[i+2]<=45)black++;}
   if(this.faceMask[n]&&!exists&&painted)facePaint++;
  }
  return {horn:hornTotal?horn/hornTotal:1,excess:extra/Math.max(1,hornTotal),scratches:scratchTotal?scratch/scratchTotal:1,bodyLoss:removed/Math.max(1,body),exposure:exposed/Math.max(1,face),trim:trimTotal?trim/trimTotal:1,keep:keep/Math.max(1,keepTotal),black:hair?black/hair:0,facePaint,stickers:this.placements.length};
 }
 judge(){return demonJudge(this.phase,this.metrics());}
}
