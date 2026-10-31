/** Earned stars are permanent; only progress toward the next star can decrease. */
export function starThresholds(settings={}){
 const values=Array.isArray(settings.starThresholds)?settings.starThresholds:[settings.threshold||5000];
 return values.filter((n,i)=>Number.isFinite(n)&&n>0&&(i===0||n>values[i-1])).slice(0,3);
}
export function retainedStars(earned,total,thresholds){return Math.max(Math.max(0,Math.floor(earned||0)),thresholds.filter(n=>total>=n).length);}
export function starProgress(total,earned=0,thresholds=[5000]){
 const stars=Math.max(0,Math.floor(earned||0)),floor=stars?thresholds[stars-1]??0:0,next=thresholds[stars];
 if(stars>=3)return {stars,floor,next:null,ratio:1,remaining:0,max:true};
 if(next==null)return {stars,floor,next:null,ratio:0,remaining:null,max:false};
 return {stars,floor,next,ratio:Math.max(0,Math.min(1,(total-floor)/(next-floor))),remaining:Math.max(0,next-total),max:false};
}

/** Only an earned star protects its threshold; nominal rewards remain unchanged. */
export function followerChange(total,requestedGain,earned=0,thresholds=[5000],savedFloor=0){
 const floor=earned>0?(savedFloor>0?savedFloor:thresholds[Math.floor(earned)-1]??0):0;
 const unprotected=total+requestedGain;
 const after=requestedGain<0&&floor>0?Math.max(floor,unprotected):unprotected;
 return {before:total,after,gain:after-total,requestedGain,protectedAmount:Math.max(0,after-unprotected),followerFloor:floor};
}
