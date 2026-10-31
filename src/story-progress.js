// Final visit settlement is separate from result-screen previews and retries.
export function storyVisitGain(story){
 const loss=story.outcome==='defeat'&&story.forcedBattle&&story.lossAccepted;
 const base=loss?-100:story.guest.id===10004?2000:1500;
 const bonus=!story.forcedBattle&&story.outcome==='victory'?200:0;
 return {base,bonus,gain:base+bonus};
}
export function recordStoryVisit(story,portrait){
 if(story.resultRecorded)return story;
 if(story.outcome==='defeat'&&(story.guest.id===10004||(story.forcedBattle&&!story.lossAccepted)))return story;
 const g=story.guest,{base,bonus,gain}=storyVisitGain(story),before=story.followers||0;
 const record={day:story.day,id:g.id,name:g.name,score:Math.round(story.lastScore),mood:story.lastMood,outcome:story.outcome,forced:!!story.forcedBattle,base,bonus,gain,before,after:before+gain,portrait,headPortrait:story.headPortrait||null};
 return {...story,followers:record.after,resultRecorded:true,records:[...story.records,record]};
}
