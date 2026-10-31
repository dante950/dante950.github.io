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
 const accessoriesOK=placements.length===2&&scores.attach>=b.weights.attach-1e-9;
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
