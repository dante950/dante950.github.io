import {COFFEE_REQUESTS} from './narrative.js';
// A dialogue-only workshop guest; the tutorial retains its own beauty and battle setup.
const coffeeLine=(text,speaker='커피 유령')=>[speaker,text];
export const COFFEE_DIALOGUES=[
 ['introduce','첫 손님 소개',[coffeeLine('첫 손님입니다.','마왕 부하')]],
 ['arrival','손님 등장',[coffeeLine('저도 부하님처럼 되고 싶어요!'),coffeeLine('…이 아이를 먼저 부탁드리겠습니다.','마왕 부하')]],
 ['minionTalk','착석 후 · 마왕 부하 말걸기',['이 아이를 먼저 부탁드립니다.','당황스러우시겠지만, 부탁드립니다.','아이에게 다가가 말을 걸어보시겠습니까?'].map(t=>coffeeLine(t,'마왕 부하'))],
 ['coffeeTalk','착석 후 · 커피 유령 말걸기',[coffeeLine('부하님은 눈도 셋이고, 뿔도 멋있고… 저도 그렇게 되고 싶어요!')]],
 ...Object.entries(COFFEE_REQUESTS).flatMap(([stage,texts])=>texts.map((text,i)=>[stage+(i?'Detail'+i:''),{cut:'형태 만들기 요청',draw:'색·무늬 요청',attach:'장식 요청'}[stage]+[' · 처음',' · 네? 1회',' · 네? 2회'][i],[coffeeLine(text)]])),
 ['cutReaction','미용 중 · 첫 가위 사용',[coffeeLine('오, 싹둑! 눈을 가린 앞머리도 잘라주시고, 오른쪽 파인 곳은 발모제로 채워주세요.')]],
 ['cutEyesReaction','미용 중 · 눈을 드러낸 첫 가위 사용',[coffeeLine('와, 이제 잘 보여요! 오른쪽에 파인 머리도 발모제로 채워주실래요?')]],
 ['growReaction','미용 중 · 첫 발모제 사용',[coffeeLine('우와, 자란다! 비어 있는 곳이 주변 머리랑 이어지게 채워주세요. 삐죽한 쪽은 가위로 정리해주시고요.')]],
 ['incomplete','미용 중 · 미완료 요구 안내',[coffeeLine('저… {미완료요구}도 조금만 더 봐주실래요? 손질 가이드에 표시해둘게요.')]],
 ['proposal','미용 완료 · 야차 제안 (3안)',[coffeeLine('눈도 셋이고… 뿔도 있고…! 이제 저도 부하님처럼 강해 보이죠?'),coffeeLine('보이는 것만으로 강해지는 것은 아닙니다.','마왕 부하'),coffeeLine('그럼 야차도 해볼래요! 제가 얼마나 멋있어졌는지 봐주세요!'),coffeeLine('제가 지켜보겠습니다. 이 아이와 먼저 몸을 풀어보시죠.','마왕 부하')]],
 ['proposalLegacy','미용 완료 · 야차 제안 (1·2안)',[coffeeLine('눈도 셋이고… 뿔도 있고…! 이제 저도 부하님처럼 강해 보이죠?'),coffeeLine('보이는 것만으로 강해지는 것은 아닙니다.','마왕 부하'),coffeeLine('그럼 야차도 해볼래요! 제가 얼마나 멋있어졌는지 봐주세요!'),coffeeLine('이곳에서는 야차를 청하는 손님도 만날 겁니다. 제가 지켜보겠습니다. 이 아이와 먼저 몸을 풀어보시죠.','마왕 부하')]],
 ['battlePhase2','야차 · 2페이즈 시작',[coffeeLine('한 번만 더요! 이번엔 저도 제대로 해볼게요!')]],
 ['battleVictory','야차 · 대련 마무리',[coffeeLine('휴우… 모습은 닮았는데, 야차는 아직 멀었네요!')]],
 ['battleRetry','야차 · 빈틈 재도전',[coffeeLine('앗, 가위를 놓치셨네요! 괜찮아요. 다시 해봐요!')]],
 ['leave','야차 후 · 후기 약속과 퇴장',[coffeeLine('대련은 졌지만, 오늘 정말 멋있어졌어요! 후기 꼭 남길게요!'),coffeeLine('고생하셨습니다. 오늘은 여기까지 하고 가보겠습니다.','마왕 부하'),coffeeLine('저는 말씀드린 대로 2일차에 다시 방문하도록 하겠습니다.','마왕 부하'),coffeeLine('부하님, 같이 가요! 눈이 셋이라 길도 세 번 잘 보인다니까요!')]]
];
export const COFFEE_DIALOGUE_EVENTS=COFFEE_DIALOGUES.map(([key,label])=>[key,label]);
const coffeeRows=(project,name)=>project?.combat?.sheets?.find(s=>s.name===name)?.rows||[];
export function ensureCoffeeDialogues(project){
 if(!project?.guests||!project?.combat?.sheets)return project;
 let guest=project.guests.find(g=>g.id===10005);
 if(!guest){guest={id:10005,name:'커피 유령',dialogueOnly:true,workbookExcluded:true,battle:'none',bindings:{},beauty:{enabled:false,steps:{cut:false,draw:false,attach:false},weights:{cut:0,draw:0,attach:0},cutRegions:[],drawRegions:[],attachRegions:[],drawColors:[]},note:'인트로·튜토리얼 전용 대사. 본편 영업 일정에는 포함하지 않습니다.'};project.guests.push(guest);}
 const groups=coffeeRows(project,'대화 그룹'),lines=coffeeRows(project,'대사');
 for(const [event,label,texts] of COFFEE_DIALOGUES){
  if(guest.bindings[event]!=null)continue;
  const id=Math.max(90000,...groups.map(g=>g.GroupID))+1;guest.bindings[event]=id;
  groups.push({GroupID:id,Name:'커피 유령 · '+label,PlaybackMode:'순서대로',PauseCombat:true,AdvanceMode:'입력',CPS:1000/23,HoldMs:1400,GapMs:0,ActorEffect:'없음',FinishEffect:'없음',Notes:'튜토리얼 전용 · 프로젝트 JSON 보관'});
  let lid=Math.max(1000000,...lines.map(l=>l.DialogueID));
  texts.forEach(([Speaker,Text],i)=>lines.push({DialogueID:++lid,GroupID:id,Order:i+1,Speaker,Text,Notes:'커피 유령 튜토리얼'}));
 }
 return project;
}
export function coffeeDialogueLines(project,event){
 const id=project?.guests?.find(g=>g.id===10005)?.bindings?.[event];
 if(id!=null){const lines=coffeeRows(project,'대사').filter(l=>l.GroupID===id).sort((a,b)=>a.Order-b.Order).map(l=>[l.Speaker==='몬스터'?'커피 유령':l.Speaker,l.Text]);Object.defineProperty(lines,'settings',{value:coffeeRows(project,'대화 그룹').find(g=>g.GroupID===id)});return lines;}
 return structuredClone(COFFEE_DIALOGUES.find(([key])=>key===event)?.[2]||[]);
}
export function coffeeDialogueText(project,event){return coffeeDialogueLines(project,event).map(l=>l[1]).join('\n');}
export function coffeeRequestText(project,stage,level){return coffeeDialogueText(project,stage+(level?'Detail'+level:''));}
export function applyCoffeeBattleDialogues(data,project){
 const groupRows=data.sheets.find(s=>s.name==='대화 그룹').rows,lineRows=data.sheets.find(s=>s.name==='대사');
 for(const [id,event] of [[89091,'battlePhase2'],[89092,'battleVictory'],[89093,'battleRetry']]){
  const sourceID=project?.guests?.find(g=>g.id===10005)?.bindings?.[event],source=coffeeRows(project,'대화 그룹').find(g=>g.GroupID===sourceID);
  const target=groupRows.find(g=>g.GroupID===id);
  if(source)for(const key of ['CPS','AdvanceMode','HoldMs','GapMs'])target[key]=source[key];
  lineRows.rows=lineRows.rows.filter(l=>l.GroupID!==id);
  let next=Math.max(990100,...lineRows.rows.map(l=>l.DialogueID));
  coffeeDialogueLines(project,event).forEach(([Speaker,Text],i)=>lineRows.rows.push({DialogueID:++next,GroupID:id,Order:i+1,Speaker:Speaker==='커피 유령'?'몬스터':Speaker,Text}));
 }
 return data;
}
