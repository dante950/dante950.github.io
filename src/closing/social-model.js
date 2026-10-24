// Authored review copy: Notion 403648bf6778803c987fe9ac906a6fe3 (2026-10-24).
export const REVIEW_COPY = {
 zombie:{user:'Dubuk_zom',place:'언데드 생명 보험 앞',beauty:'으어... 취직했다... 앞머리도 방구석 생활도 해방됨...... 몇달만에 사람 얼굴 제대로 보는 느낌ㅠㅠ #몬스터헤어살롱 덕분에 붙은 것 같아요 감사합니다. 모두 기 받아가세요! #취업성공 #취준생 #화이팅',battle:'으어… 여기 야차 맛집이였네요… 죽은 뒤로 방구석에만 있어서 굳은 몸은 확 풀렸습니다…\n이 기세로 면접까지 가봅니다…!\n#몬스터헤어살롱 #취준생 #셀카'},
 sans:{user:'SanzTheSkeleton',place:'오늘의 기록',beauty:'드디어 오늘 서코 다녀왔음!!\n몬스터헤어살롱에서 샌즈 완벽 재현하고 갔더니 코스어 형들이랑 사진 엄청 찍히뮤ㅠㅠ\n진짜 “뼈”가 빠지게 놀았다…\n원장님 덕분에 올해 최고로 행복한 하루임.\n다들 메갈로바니아 들으면서 지옥 불타보자고 ㅋㅋㅋ\n#오늘_밤_너는_지옥에서_불타게_될거야',battle:"헤. 오랜만에 뼈 좀 풀었는걸.\n내 '필살기'까지 사용하게 되다니 말이야.\n제법 하는걸, 꼬마야? 끝내주는 실력이었어, 물론 야차 말이야."},
 minion:{user:'money_slave',place:'오늘의 기록',beauty:'마왕님께 보고드렸습니다. 이 미용실, 실력이 보통이 아니라고.\n아 참, 저는 666년 만에 휴가를 받았습니다. 잘 쉬고 오겠습니다, 감사합니다.\n#몬스터헤어살롱 #감사합니다 #휴가는_몬스터헤어살롱에서',battle:'제 패배를 인정합니다. 이 정도 미용실이라면 마왕님도 분명 관심 가지시겠죠.\n아 참, 반차에 대해서는… 담당자분이 제 꼴을 보더니 소리를 지르시며 당장 쉬시는 게 좋겠다고 말했습니다. 덕분입니다, 감사합니다.\n#몬스터헤어살롱 #감사합니다 #반차는_몬스터헤어살롱에서'}
};
export const COLLEAGUE_COMMENTS=[{user:'hwesa_dongryo',text:'@money_slave님 마왕님 전용 헤어 루틴 정리 문서 어디에 있나요?'},{user:'hwesa_dongryo',text:'죄송한데 마왕님께서 많이 화가 나셔서 지금 빨리 와주셔야 할 것 같습니다'}];
export function reviewVariant(visit){
 const failed=Number.isFinite(visit.score)?visit.score<40:visit.reviewKind==='battle';
 if(!failed)return 'beauty';
 return ['victory','forcedWin','offerWin'].includes(visit.outcome)?'battle':null;
}
export function reviewPost(visit){
 const kind=reviewVariant(visit),copy=REVIEW_COPY[visit.guestId];
 return {id:visit.id,user:copy.user,place:copy.place,text:kind?copy[kind]:'이 결과의 후기 원문은 아직 준비 중입니다.',photo:kind?`./media/social/${visit.guestId}-${kind}.webp`:null,guest:visit.guestId,kind,portrait:visit.headPortrait||null,comments:kind&&visit.guestId==='minion'?COLLEAGUE_COMMENTS:[],draft:!kind};
}
// World posts and branching comments are clearly marked prototype writing.
export const WORLD_POSTS=[
 {id:'night-bus',day:1,user:'last_bus_666',place:'몬스터 시내버스',title:'막차는 누구에게나 평등하게',symbol:'☾',text:'[시연용 초안] 야간 버스에 햇빛 차단 커튼이 생겼습니다. 뱀파이어 승객 여러분, 이제 졸다가 종점까지 가셔도 괜찮습니다. 단, 관은 접어서 실어 주세요.',comments:[{user:'bat_commuter',text:'드디어 퇴근길에 두 눈을 감을 수 있겠네요.'}],choices:[{label:'관도 접이식이 있나요?',comment:'관도 접이식이 있나요?',reply:'출퇴근용은 접이식, 주말용은 원목입니다. 요즘 다들 두 개씩 써요.'},{label:'퇴근길 꿀잠을 응원해요.',comment:'퇴근길 꿀잠을 응원해요!',reply:'감사합니다. 기사님은 주무시면 안 됩니다.'}]},
 {id:'horn-office',day:2,user:'office_goblin',place:'마왕성 사무실',title:'회의실 문, 드디어 확장',symbol:'♜',text:'[시연용 초안] 뿔이 문에 걸려 지각하던 동료들을 위해 회의실 문을 넓혔습니다. 그랬더니 이번에는 날개가 걸립니다. 시설팀은 오늘도 야근입니다.',comments:[],choices:[{label:'날개는 접고 들어가면…',comment:'날개는 접고 들어가면 안 되나요?',reply:'그 말을 꺼낸 뒤로 팀장님이 날개를 더 크게 펴고 다니십니다.'},{label:'시설팀에도 반차를!',comment:'시설팀에도 반차를 주세요!',reply:'그 댓글, 결재 문서에 첨부하겠습니다.'}]}
];
WORLD_POSTS.push({id:'fortune-day1',day:1,user:'moonlight_oracle',place:'별빛 운세 연구소',title:'오늘의 운세 · 낯선 발견',symbol:'✦',draft:true,text:'당신은 달빛이 비치는 길을 걷고 있다. 골목 끝에서 처음 보는 무언가를 발견했다. 무엇을 보았는가?',comments:[],choices:[{label:'1. 혼자 빛나는 푸른 꽃',comment:'혼자 빛나는 푸른 꽃을 보았어요.',reply:'푸른 꽃을 고른 당신. 오늘은 지나치기 쉬운 작은 기쁨이 행운이 되는 날이에요. 마음에 드는 풍경 앞에서 잠깐 멈춰 보세요.'},{label:'2. 주인 없이 놓인 작은 열쇠',comment:'주인 없이 놓인 작은 열쇠를 보았어요.',reply:'작은 열쇠를 고른 당신. 오늘은 미뤄 둔 일에 새로운 실마리가 보일지도 몰라요. 가장 쉬운 것 하나부터 시작해 보세요.'},{label:'3. 나를 기다리는 듯한 검은 고양이',comment:'나를 기다리는 듯한 검은 고양이를 보았어요.',reply:'검은 고양이를 고른 당신. 오늘은 뜻밖의 만남이 반가운 이야기를 가져올 수 있어요. 먼저 건네는 인사에 귀를 기울여 보세요.'}]});
WORLD_POSTS.push({id:'fortune-day2',day:2,user:'moonlight_oracle',place:'별빛 운세 연구소',title:'오늘의 운세 · 숲속의 문',symbol:'✦',draft:true,text:'당신은 조용한 숲을 걷다 나무 사이에 서 있는 문을 발견했다. 손잡이를 돌리자 문이 열린다. 너머에는 무엇이 있는가?',comments:[],choices:[{label:'1. 별이 가득한 밤바다',comment:'문 너머에 별이 가득한 밤바다가 있었어요.',reply:'밤바다를 고른 당신. 오늘은 익숙한 자리에서 조금 벗어나면 생각이 맑아지는 날이에요. 짧은 산책에서 뜻밖의 답을 만날지도 몰라요.'},{label:'2. 따뜻한 빵 냄새가 나는 작은 집',comment:'따뜻한 빵 냄새가 나는 작은 집이 있었어요.',reply:'작은 집을 고른 당신. 오늘의 행운은 편안한 사람과 나누는 평범한 시간에 숨어 있어요. 안부 한마디를 먼저 건네 보세요.'},{label:'3. 아무도 타지 않은 하늘 기차',comment:'아무도 타지 않은 하늘 기차가 있었어요.',reply:'하늘 기차를 고른 당신. 오늘은 작은 호기심이 새로운 가능성으로 이어지는 날이에요. 평소와 다른 선택을 하나쯤 해 봐도 좋겠어요.'}]});

export function chooseComment(state,post,choiceIndex){
 if(state[post.id]||!post.choices?.[choiceIndex])return state;
 const c=post.choices[choiceIndex];return {...state,[post.id]:{choiceIndex,comments:[{user:'yacha_vely',text:c.comment},{user:post.user,text:c.reply,reply:true}]}};
}
export function rollWeather(random=Math.random){return {day:22+Math.min(6,Math.max(0,Math.floor(random()*7))),night:13+Math.min(5,Math.max(0,Math.floor(random()*6)))}};
export function closingExitAction(reviewed){return reviewed?'calendar':'management';}
