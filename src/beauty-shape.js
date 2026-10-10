// Shared by the salon runtime and tests. Coordinates use the 320 × 350 portrait.
export const BEAUTY_STAGES=['cut','draw','attach'];
// Source-over blending keeps the material opaque and preserves translucent paint for Undo.
export function blendBeautyRGBA(base,color,opacity){
 const a=Math.max(0,Math.min(1,opacity)),under=(base[3]||0)/255,alpha=a+under*(1-a);
 if(!alpha)return [0,0,0,0];
 return [...[0,1,2].map(i=>Math.round((color[i]*a+base[i]*under*(1-a))/alpha)),Math.round(alpha*255)];
}
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
// Compare each material island before/after one committed cut. Growth itself never detaches.
export function detachedByBeautyCut(before,after,width,height,anchors=new Uint8Array(before.length)){
 const label=new Int32Array(before.length).fill(-1),seen=new Uint8Array(before.length),groups=[];
 const flood=(start,mask,visit)=>{
  const cells=[start];visit(start);
  for(let i=0;i<cells.length;i++){
   const n=cells[i],x=n%width,y=Math.floor(n/width);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;
    const q=yy*width+xx;if(mask(q)){visit(q);cells.push(q);}
   }
  }
  return cells;
 };
 for(let n=0;n<before.length;n++)if(before[n]&&label[n]<0){
  const id=groups.length;groups.push([]);
  flood(n,q=>before[q]&&label[q]<0,q=>{label[q]=id;});
 }
 for(let n=0;n<after.length;n++)if(after[n]&&!seen[n]&&label[n]>=0){
  const cells=flood(n,q=>after[q]&&!seen[q],q=>{seen[q]=1;});
  groups[label[n]].push({cells,roots:cells.reduce((sum,q)=>sum+(anchors[q]?1:0),0)});
 }
 const removed=[];
 for(const pieces of groups){
  if(pieces.length<2)continue;
  // Prefer the scalp/body side, then the largest remainder. Row order breaks equal-size ties.
  let keep=pieces[0];
  for(const p of pieces)if(p.roots>keep.roots||p.roots===keep.roots&&p.cells.length>keep.cells.length)keep=p;
  for(const p of pieces)if(p!==keep)removed.push(...p.cells);
 }
 return removed;
}
// A request check means a sufficient trim, while the existing score still rewards precision.
const BONE_TRIM_COMPLETION=.70,BONE_PRESERVE_TOLERANCE=.05;
export function scoreShape(current,original,b,width=160,height=175,masks={}){
 if(!b.designVersion)return scoreLegacyShape(current,original,b,width,height,masks);
 let points=0,interiorIntact=true,interiorLossRatio=0,eyeCoverRatio=0;const details=[];
 for(const r of b.cutRegions){
  let total=0,met=0,protectedTotal=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const n=y*width+x;
   if(!inBeautyRegion((x+.5)*2,(y+.5)*2,r))continue;
   if(r.mask&&masks[r.mask]&&!masks[r.mask][n])continue;
   const rule=r.rule||(r.kind==='bad'?'preserve':r.kind==='keep'?'free':'trim');
   if(masks.protectedFace?.[n]){if(original[n])protectedTotal++;continue;}
   if(rule==='free'||((rule==='trim'||rule==='preserve')&&!original[n]))continue;
   total++;if(rule==='clear'||rule==='trim'?!current[n]:!!current[n])met++;
  }
  const excluded=!total&&protectedTotal>0,ratio=total?met/total:excluded?1:0,fulfilled=total?Math.min(1,ratio/Math.max(.01,1-(r.tolerance??.05))):excluded?1:0;
  const value=fulfilled*(r.points||0);
  points+=value;details.push({key:r.key,label:r.label,rule:r.rule||(r.kind==='bad'?'preserve':r.kind==='keep'?'free':'trim'),ratio,fulfilled,points:value,total,protectedTotal});
 }
 // Bone additions may be freely sculpted; damage to the original interior lowers the result.
 if(b.growth?.material==='bone'){
  let keep=0,lost=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const n=y*width+x;if(!original[n])continue;
   if(b.cutRegions.some(r=>(r.rule==='trim'||!r.rule&&r.kind==='good')&&inBeautyRegion((x+.5)*2,(y+.5)*2,r)))continue;
   keep++;if(!masks.protectedFace?.[n]&&!current[n])lost++;
  }
  interiorLossRatio=lost/Math.max(1,keep);
  points-=b.weights.cut*Math.min(1,interiorLossRatio*3);
  const eyes=masks.eyes;let eyeTotal=0,eyeCover=0;
  if(eyes)for(let n=0;n<eyes.length;n++)if(eyes[n]&&!masks.protectedFace?.[n]){eyeTotal++;if(current[n]===2)eyeCover++;}
  eyeCoverRatio=eyeCover/Math.max(1,eyeTotal);
  points-=b.weights.cut*eyeCoverRatio;
  interiorIntact=interiorLossRatio<=BONE_PRESERVE_TOLERANCE&&eyeCoverRatio<=BONE_PRESERVE_TOLERANCE;
 }
 return {score:Math.max(0,Math.min(b.weights.cut,points)),details,interiorIntact,interiorLossRatio,eyeCoverRatio};
}
// Memo completion follows existing requirements, never the number of strokes.
export function beautyRequirementChecks(b,phase,shape,scores,placementCount){
 if(phase==='cut'){
  const groups=[...new Set(shape.details.filter(r=>r.rule!=='free').map(r=>r.rule))];
  const bone=b.designVersion&&b.growth?.material==='bone';
  const checks=groups.map(rule=>shape.details.filter(r=>r.rule===rule).every(r=>
   r.fulfilled>=1-1e-9||bone&&rule==='trim'&&r.ratio>=BONE_TRIM_COMPLETION));
  if(bone)checks.push(shape.interiorIntact===true);
  return checks.length?checks:[scores.cut>=b.weights.cut-1e-9];
 }
 if(phase==='attach')return [placementCount===1&&scores.attach>=b.weights.attach-1e-9];
 return [!b.weights.draw||scores.draw>=b.weights.draw-1e-9];
}
export function liveBeautyMood(score,previous='neutral',touched=false){
 if(!touched)return 'neutral';
 if(previous==='satisfied'&&score>=76)return 'satisfied';
 if(previous==='angry'&&score<44)return 'angry';
 return score>=82?'satisfied':score<36?'angry':'neutral';
}
export function beautyStageOrder(b){return BEAUTY_STAGES.filter(k=>b.steps[k]);}


function scoreLegacyShape(current,original,b,width,height,masks={}){
 let total=0,removed=0,goodTotal=0,goodCut=0,badTotal=0,badCut=0,wrongCut=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const n=y*width+x;if(!original[n]||masks.protectedFace?.[n])continue;total++;
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
