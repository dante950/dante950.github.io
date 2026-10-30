// Draft first-customer reward. Shared by the tutorial and its Day 1 handoff.
export const COFFEE_TUTORIAL_FOLLOWERS=100;
export const COFFEE_TUTORIAL_STORAGE='yachacha-coffee-tutorial-handoff-v1';
export const COFFEE_TUTORIAL_REVIEW=Object.freeze({
 user:'coffee_ghost',place:'몬스터 헤어살롱 · 첫 손님',
 text:'눈도 셋! 뿔도 한 쌍! 오늘은 부하님을 조금 닮았어요.\n머리도 다듬고, 비어 있던 곳도 쑥쑥! 대련은 졌지만 멋은 이긴 것 같아요.\n이제 부하님이랑 눈 개수도 똑같아요. 세 눈으로 꼼꼼히 보고 추천합니다!\n#몬스터헤어살롱 #첫손님 #부하님처럼',
 draft:true
});
const coffeeSafePortrait=value=>typeof value==='string'&&/^data:image\/(png|webp|jpeg);base64,/.test(value)&&value.length<1_000_000?value:null;
export function createCoffeeTutorialVisit({portrait=null,headPortrait=null,skipped=false}={}){
 return {id:10005,day:0,name:'커피 유령',score:100,mood:'happy',outcome:skipped?'tutorialSkipped':'victory',skipped:!!skipped,forced:false,
  base:COFFEE_TUTORIAL_FOLLOWERS,bonus:0,gain:COFFEE_TUTORIAL_FOLLOWERS,before:0,after:COFFEE_TUTORIAL_FOLLOWERS,
  portrait:coffeeSafePortrait(portrait),headPortrait:coffeeSafePortrait(headPortrait),tutorial:true,review:{...COFFEE_TUTORIAL_REVIEW}};
}
export function coffeeTutorialClosingInit(token,visit,socialChoices={}){
 return {source:'yachacha-story',type:'init',token,day:0,tutorial:true,autoClose:true,
  records:[createCoffeeTutorialVisit(visit)],socialChoices};
}
export function coffeeSaveHandoff(visit,socialChoices={},storage=globalThis.sessionStorage){
 const data={version:1,visit:createCoffeeTutorialVisit(visit),socialChoices};
 try{storage?.setItem(COFFEE_TUTORIAL_STORAGE,JSON.stringify(data));return true;}catch{return false;}
}
export function coffeeReadHandoff(mode,storage=globalThis.sessionStorage){
 if(!['complete','skip'].includes(mode))return null;
 let data=null;try{data=JSON.parse(storage?.getItem(COFFEE_TUTORIAL_STORAGE)||'null');}catch{}
 const visit=createCoffeeTutorialVisit(mode==='skip'?{skipped:true}:data?.version===1?data.visit:{});
 return {visit,socialChoices:data?.version===1&&data.socialChoices&&typeof data.socialChoices==='object'?data.socialChoices:{}};
}
export function coffeeApplyHandoff(story,handoff){
 if(!handoff||story.records.some(r=>r.id===10005&&r.day===0))return story;
 const visit=createCoffeeTutorialVisit(handoff.visit);
 return {...story,followers:(story.followers||0)+visit.gain,records:[visit,...story.records],socialChoices:handoff.socialChoices||{}};
}
