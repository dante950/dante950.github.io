// Shared by the salon runtime and tests. Coordinates use the 320 × 350 portrait.
export const BEAUTY_STAGES=['cut','draw','attach'];
export function inBeautyRegion(x,y,r){
 if(r.shape==='ellipse')return ((x-r.x-r.w/2)/(r.w/2))**2+((y-r.y-r.h/2)/(r.h/2))**2<=1;
 return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;
}
export function strokeCells(width,height,points,radius,scale=2){
 const cells=new Set();
 for(let i=0;i<points.length;i++){
  const a=points[Math.max(0,i-1)],b=points[i],dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  const x0=Math.max(0,Math.floor((Math.min(a.x,b.x)-radius)/scale)),x1=Math.min(width-1,Math.ceil((Math.max(a.x,b.x)+radius)/scale));
  const y0=Math.max(0,Math.floor((Math.min(a.y,b.y)-radius)/scale)),y1=Math.min(height-1,Math.ceil((Math.max(a.y,b.y)+radius)/scale));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const px=(x+.5)*scale,py=(y+.5)*scale,t=len?Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/len)):0;
   if((px-a.x-t*dx)**2+(py-a.y-t*dy)**2<=radius*radius)cells.add(y*width+x);
  }
 }
 return cells;
}
// Keep only material connected to a fixed scalp/core anchor. Diagonal pixel joins count.
export function detachedBeautyCells(material,anchors,width,height){
 const seen=new Uint8Array(material.length),queue=[];
 for(let n=0;n<material.length;n++)if(material[n]&&anchors[n]){seen[n]=1;queue.push(n);}
 for(let i=0;i<queue.length;i++){
  const n=queue[i],x=n%width,y=Math.floor(n/width);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;
   const next=yy*width+xx;if(material[next]&&!seen[next]){seen[next]=1;queue.push(next);}
  }
 }
 const detached=[];for(let n=0;n<material.length;n++)if(material[n]&&!seen[n])detached.push(n);
 return detached;
}
export function beautyToolAllowed(kind,n,bone,original,face){
 if(!face[n])return true;
 // Original bangs can still be cut and dyed; tools never edit the face underneath.
 if(!bone)return kind!=='grow';
 return !['hammer','scissors','grow','paint'].includes(kind);
}
export function scoreShape(current,original,b,width=160,height=175,masks={}){
 if(!b.designVersion)return scoreLegacyShape(current,original,b,width,height);
 let points=0;const details=[];
 for(const r of b.cutRegions){
  let total=0,met=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const n=y*width+x;
   if(!inBeautyRegion((x+.5)*2,(y+.5)*2,r))continue;
   if(r.mask&&masks[r.mask]&&!masks[r.mask][n])continue;
   const rule=r.rule||(r.kind==='bad'?'preserve':r.kind==='keep'?'free':'trim');
   if(rule==='free'||((rule==='trim'||rule==='preserve')&&!original[n]))continue;
   if(b.growth?.material==='bone'&&masks.face?.[n]&&(rule==='trim'||rule==='preserve'))continue;
   total++;if(rule==='clear'||rule==='trim'?!current[n]:!!current[n])met++;
  }
  const ratio=total?met/total:0,fulfilled=total?Math.min(1,ratio/Math.max(.01,1-(r.tolerance??.05))):0;
  const value=fulfilled*(r.points||0);
  points+=value;details.push({key:r.key,label:r.label,ratio,fulfilled,points:value,total});
 }
 // Bone additions may be freely sculpted; damage to the original interior lowers the result.
 if(b.growth?.material==='bone'){
  let keep=0,lost=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const n=y*width+x;if(!original[n])continue;
   if(b.cutRegions.some(r=>(r.rule==='trim'||!r.rule&&r.kind==='good')&&inBeautyRegion((x+.5)*2,(y+.5)*2,r)))continue;
   keep++;if(!current[n])lost++;
  }
  points-=b.weights.cut*Math.min(1,lost/Math.max(1,keep)*3);
  const eyes=masks.eyes;let eyeTotal=0,eyeCover=0;
  if(eyes)for(let n=0;n<eyes.length;n++)if(eyes[n]){eyeTotal++;if(current[n]===2)eyeCover++;}
  points-=b.weights.cut*eyeCover/Math.max(1,eyeTotal);
 }
 return {score:Math.max(0,Math.min(b.weights.cut,points)),details};
}
export function liveBeautyMood(score,previous='neutral',touched=false){
 if(!touched)return 'neutral';
 if(previous==='satisfied'&&score>=76)return 'satisfied';
 if(previous==='angry'&&score<44)return 'angry';
 return score>=82?'satisfied':score<36?'angry':'neutral';
}
export function beautyStageOrder(b){return BEAUTY_STAGES.filter(k=>b.steps[k]);}


function scoreLegacyShape(current,original,b,width,height){
 let total=0,removed=0,goodTotal=0,goodCut=0,badTotal=0,badCut=0,wrongCut=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const n=y*width+x;if(!original[n])continue;total++;
  const r=b.cutRegions.find(r=>inBeautyRegion((x+.5)*2,(y+.5)*2,r)),gone=!current[n];
  if(r?.kind==='good'){goodTotal++;if(gone)goodCut++;}
  if(r?.kind==='bad'){badTotal++;if(gone)badCut++;}
  if(gone){removed++;if(r?.kind!=='good')wrongCut++;}
 }
 if(b.cutTool==='hammer')return {score:Math.max(0,Math.min(b.weights.cut,b.weights.cut*(goodCut-wrongCut)/Math.max(1,goodTotal))),details:[]};
 const good=goodCut/Math.max(1,goodTotal),bad=badCut/Math.max(1,badTotal),amount=100*removed/Math.max(1,total);
 const value=Math.min(1,good/.55)*50-Math.max(0,Math.min(1,(good-.78)/.22))*22-bad*42-Math.max(0,Math.min(1,(amount-62)/25))*25;
 return {score:Math.max(0,Math.min(50,value))*b.weights.cut/50,details:[]};
}
