import {followerChange,starThresholds} from './star-progress.js';
// Final visit settlement is separate from result-screen previews and retries.
export function storyVisitGain(story){
 const loss=story.outcome==='defeat'&&story.forcedBattle&&story.lossAccepted;
 const base=story.guest.returningZombie?(story.beautyDetails?.success?1100:0):loss?-100:story.guest.id===10004?2000:1500;
 const bonus=!story.forcedBattle&&story.outcome==='victory'?200:0;
 return {base,bonus,...followerChange(story.followers||0,base+bonus,story.stars||0,starThresholds(story.starSettings),story.followerFloor||0)};
}
export function recordStoryVisit(story,portrait){
 if(story.resultRecorded)return story;
 if(story.outcome==='defeat'&&(story.guest.id===10004||(story.forcedBattle&&!story.lossAccepted)))return story;
 const g=story.guest,{base,bonus,gain,requestedGain,protectedAmount,after}=storyVisitGain(story),before=story.followers||0;
 const record={day:story.day,id:g.id,name:g.name,score:Math.round(story.lastScore),mood:story.lastMood,beautySuccess:story.beautyDetails?.success??(story.lastMood?story.lastMood!=='angry':story.lastScore>=40),returnBranch:story.returnBranch||null,outcome:story.outcome,forced:!!story.forcedBattle,base,bonus,gain,requestedGain,protectedAmount,before,after,portrait,headPortrait:story.headPortrait||null};
 return {...story,followers:record.after,resultRecorded:true,records:[...story.records,record]};
}
