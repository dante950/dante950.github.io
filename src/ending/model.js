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
export function endingReviews(records=[]){
 return runFromStory(records,4).visits.filter(v=>!v.skipped&&v.outcome!=='tutorialSkipped').map(v=>({...reviewPost(v),day:v.day}));
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
