// Returning zombie simulator rules. Tolerances/rewards are provisional playtest values.
export const RETURNING_ZOMBIE_ID=10006;
export function returningZombieBranch(records,override){
 if(override==='employed'||override==='lottery')return override;
 const first=records.find(r=>r.id===10001&&r.day===1);
 if(!first)return 'employed';
 const success=first.beautySuccess??(first.mood?first.mood!=='angry':first.score>=40);
 return success?'employed':'lottery';
}
export function returningBeautyStatus(original,current,b,scores,placements){
 let total=0,lost=0,added=0;
 for(let i=0;i<original.length;i++){if(original[i]){total++;if(!current[i])lost++;}else if(current[i])added++;}
 const lossRatio=lost/Math.max(1,total),changeRatio=(lost+added)/Math.max(1,total);
 const hairOK=changeRatio<=(b.hairTolerance??.03);
 const teethOK=scores.draw>=b.weights.draw-1e-9;
 const accessoriesOK=placements.length===(b.attachCount??b.attachRegions.length)&&scores.attach>=b.weights.attach-1e-9;
 return {success:hairOK&&teethOK&&accessoriesOK,hairOK,teethOK,accessoriesOK,lossRatio,changeRatio,hairRuined:lossRatio>=(b.ruinedHairRatio??.35)};
}
export function returningDialogueEvent(branch,success,hairRuined,event){
 const prefix=branch==='lottery'?'lottery':'employed';
 if(event==='arrival')return prefix+'Arrival';
 if(event==='leave')return prefix+(success?'SuccessLeave':hairRuined?'HairFailLeave':'FailLeave');
 return prefix+(success?'Success':hairRuined?'HairFail':'Fail');
}
export async function prepareReturningZombieSkin(sk){
 if(!sk)return;
 const images=new Map();
 const load=async src=>{if(images.has(src))return;const image=new Image();image.src=src;await image.decode();images.set(src,image);};
 await Promise.all([sk.layers.head,sk.layers.material,sk.layers.eyes.neutral,sk.layers.mouth.closed].map(l=>load(l.src)));
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=350;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 for(const l of [sk.layers.head,sk.layers.eyes.neutral,sk.layers.mouth.closed,sk.layers.material]){
  const image=images.get(l.src);
  if(l.sw)ctx.drawImage(image,l.sx||0,l.sy||0,l.sw,l.sh,l.x,l.y,l.w,l.h);else ctx.drawImage(image,l.x,l.y,l.w,l.h);
 }
 sk.portrait=canvas.toDataURL();
}

export function returningStrokeReaction(gesture,current,paint,b,width,height,pixelSize){
 if(['grow','scissors'].includes(gesture.kind))return current.some((v,i)=>v!==gesture.snapshot[i])?(gesture.kind==='grow'?'returnGrow':'returnCut'):null;
 if(gesture.kind!=='paint')return null;
 const r=b.toothReactionRegion||b.drawRegions.find(r=>r.key==='Tooth'),colors=b.drawColors.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
 for(let n=0;n<width*height;n++){const x=(n%width+.5)*pixelSize,y=(Math.floor(n/width)+.5)*pixelSize,i=n*4;if(x<r.x||x>r.x+r.w||y<r.y||y>r.y+r.h||paint[i+3]===0)continue;if(!paint.subarray(i,i+4).some((v,k)=>v!==gesture.paint[i+k]))continue;if(!colors.some(c=>c.every((v,j)=>Math.abs(v-paint[i+j])<10)))return 'returnWrongTooth';}
 return null;
}
