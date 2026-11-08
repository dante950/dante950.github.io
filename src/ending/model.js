import {runFromStory} from '../closing/model.js';
import {reviewPost} from '../closing/social-model.js';
export const ENDING_CREDITS=[
 ['PD','기획 / 프로그래밍','한시윤'],
 ['기획','LD','고현정'],['기획','','임시현'],
 ['그래픽','AD / 애니메이션 / 이펙트','이수하'],
 ['그래픽','PM / 캐릭터 / 애니메이션','신유현'],
 ['그래픽','캐릭터 / 애니메이션','김주형'],
 ['그래픽','배경','남연우'],['그래픽','배경','한주희'],['그래픽','배경','노봄'],
 ['그래픽','UI / UX','김가은'],
 ['프로그래밍','TD','송이레'],['사운드','TA','정호준']
];
export const ENDING_LINES=[
 ['몬스터','그대에게 큰 상을 내리겠노라.'],
 ['마왕 부하','그럼 약속대로… 원래 세계로 돌려보내 드리겠습니다.'],
 ['커피 유령','잠깐! 가기 전에 사진 한 장 찍어요!'],
 ['마왕 부하','모두, 이쪽을 봐 주십시오.']
];
// Temporary ending-only showcase, requested 2026-11-08. Never write these into story records.
export const ENDING_SAMPLE_GUESTS=[['coffee',0],['zombie',1],['sans',1],['minion',2],['returningZombie',3]];
export function endingReviews(records=[],catalog){
 const visits=runFromStory(records,4).visits;
 return ENDING_SAMPLE_GUESTS.map(([guestId,day])=>{
  const completed=visits.find(v=>v.guestId===guestId&&!v.skipped&&v.outcome!=='tutorialSkipped');
  const successful=completed&&(Number.isFinite(completed.score)?completed.score>=40:completed.reviewKind!=='battle');
  const visit={...(successful?completed:{}),id:'ending-sample-'+guestId,guestId,day,score:100,outcome:'beauty',reviewKind:'beauty',forced:false};
  const post={...reviewPost(visit,catalog),day,kind:'beauty',endingSample:true};
  if(guestId==='coffee'&&!post.photo)post.samplePortrait='coffee';
  if(guestId==='returningZombie'&&!catalog)Object.assign(post,{user:'Rookie_Zom',text:'으어… 첫 월급 받고 다시 왔어요!\n반짝이는 이도, 새 액세서리도 마음에 듭니다…\n내일 출근은 조금 자신 있어요. 감사합니다!\n#몬스터헤어살롱 #첫월급 #단골예약',photo:successful&&completed.portrait||'./media/returning-zombie/front.png',draft:true});
  return post;
 });
}
export function endingSchedule(count){
 // One clock controls both reviews and credits, including runs started at the boss.
 const total=Math.max(ENDING_CREDITS.length*3200,count*6500);
 return {total,reviewMs:count?total/count:0,creditMs:total/ENDING_CREDITS.length};
}
export const ENDING_POST='마지막 영업을 마쳤습니다.\n약속대로, 원래 세계까지 무사히 모셔다드렸습니다.\n그동안 감사했습니다, 미용사님.';
export const ENDING_COMMENTS=[
 {user:'커피유령',text:'다음에는 손님으로 와! 커피는 내가 살게!'},
 {user:'마왕',text:'다음 예약은 어디서 하는 것이냐?'}
];

// Victory branch from the cutscene specification; separate from beauty success.
export const BATTLE_ENDING_NEWS=[
 {
  "id": "royal-aftermath",
  "user": "왕실 보도",
  "place": "왕실 소식",
  "groupPhoto": true,
  "text": "마왕, 인간 미용사의 귀환을 배웅하다\n\n왕실은 오늘, 마계에서 미용실을 운영해 온 인간 미용사가 원래 세계로 무사히 돌아갔다고 전했다.\n\n귀환에 앞서 열린 야차에서는 인간 미용사가 승리했다. 마왕은 패배를 인정했으며, 승리자가 새로운 마왕의 자리 대신 귀환을 선택하자 직접 배웅에 나섰다.\n\n마왕과 부하들, 인간 미용사가 함께한 사진에는 투구를 벗은 마왕의 모습이 담겼다.\n\n이번 사진은 마왕의 요청으로 공개됐다. 왕실 관계자는 마왕이 사진 속 자신의 모습을 한동안 바라본 뒤, “이 사진으로 실어 주게.”라고 말했다고 전했다.\n\n마왕은 같은 사진을 집무실에도 걸어 두도록 했다. 함께 찍은 이들이 모두 잘 보이는 크기로 준비해 달라는 부탁도 덧붙였다.\n\n인간 미용사가 머물렀던 미용실은 당분간 그대로 보존된다. 마왕은 그가 다시 마계를 찾는 날에는 편히 쉬어 갈 수 있도록 준비하라고 당부했다."
 }
];
export const BATTLE_ENDING_COMMENTS=[
 {
  "user": "마계 회사원",
  "text": "마왕님, 사진 잘 봤습니다. 혹시 밀린 결재 서류도 봐주실 수 있을까요? 서류들이 저보다 오래 퇴근을 못 하고 있습니다."
 },
 {
  "user": "마왕",
  "reply": true,
  "text": "……전부 내 책상 위에 있는 건가?"
 },
 {
  "user": "마왕 부하",
  "reply": true,
  "text": "책상 옆에도 있습니다, 마왕님."
 },
 {
  "user": "마왕",
  "reply": true,
  "text": "……알겠다. 오늘부터 처리하지."
 }
];

// Measure the rendered article so wrapping and future copy edits cannot crop its ending.
export function battleNewsSchedule(overflow,textLength){
 const lead=4500,scroll=Math.max(10000,Math.max(0,overflow)/14*1000,Math.max(0,textLength)/9*1000),tail=5000,comments=14000;
 return {lead,scroll,tail,comments,commentsAt:lead+scroll+tail,total:lead+scroll+tail+comments};
}
