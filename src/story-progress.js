// Prototype follower rewards are granted once when the visit ends, never by the closing animation.
export function recordStoryVisit(story,portrait){
 if(story.resultRecorded)return story;
 if(story.forcedBattle&&story.outcome==='defeat')return story;
 const g=story.guest,base=g.id===10004?2000:1500;
 const bonus=!story.forcedBattle&&story.outcome==='victory'?200:0;
 const before=story.followers||0,gain=base+bonus;
 const record={day:story.day,id:g.id,name:g.name,score:Math.round(story.lastScore),mood:story.lastMood,outcome:story.outcome,forced:!!story.forcedBattle,base,bonus,gain,before,after:before+gain,portrait};
 return {...story,followers:record.after,resultRecorded:true,records:[...story.records,record]};
}
