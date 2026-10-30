// One large presentation; positions are viewport heights along the supplied artwork.
export const PRESENTATION_HELLO=[
 '크흠. 안녕하십니까.',
 '저는 이 몬스터 세계의 제666대 마왕님을 모시는 직속 부하입니다.',
 '갑작스러운 소환으로 많이 당황하셨을 줄 압니다.\n혼란을 덜어드리고자, 간단한 설명 자료를 준비했습니다.',
 '제목은… 「당신이 이곳에 오게 된 경위」입니다.\n그럼, 시작해도 되겠습니까?'
];
export const PRESENTATION_REFUSALS=[
 '정말요…? 왜 이곳에 오셨는지,\n어떻게 돌아가실 수 있는지에 관한 내용인데도요…?',
 '…그림도 준비했습니다.\n글자만 빼곡한 자료는 아닙니다만.'
];
export const PRESENTATION_STORY=[
 {at:0,text:'이것은 한 인간과, 몬스터들의 세계와,\n제666대 마왕에 관한 이야기입니다.'},
 {at:0.035,text:'몬스터들이 사는 세계.'},
 {at:0.07,text:'모든 몬스터들은 같은 종족이라면 같은 모습이라는 것이\n전통으로 당연하게 여겨지는 곳, 개성이라고는 없는 세계입니다.'},
 {at:0.1,text:'이곳에는 자신의 외모가 늘 마음에 들지 않는 마왕님이 계셨습니다.'},
 {at:0.18,bowing:true,text:'위엄 있는 갑옷도, 모두가 고개를 숙이는 권세도\n그분의 걱정을 덜어 주지는 못했지요.'},
 {at:1,sigh:true,text:'“국민이 굶는 것도… 내가 못생긴 탓이겠지.”'},
 {at:1.04,mirror:true,sigh:true,text:'마왕님은 나라에 문제가 생길 때마다 거울을 들여다보았습니다.\n그럴수록, 돌보지 못한 나라의 일은 쌓여가고 말았죠.'},
 {at:2,text:'“조금만 더 멋있어진다면… 모든 게 나아질 텐데.”'},
 {at:2.08,text:'하지만 아무리 본인의 모습을 바꿔나가도\n마왕님은 만족하지 못하셨습니다.'},
 {at:3,text:'보다 못한 저는 마침내,\n마왕님의 고민을 해결해 줄 당신을 소환하게 되었습니다…'}
];
export const PRESENTATION_SLIDES=[
 {number:'01',label:'돌아갈 조건',headline:'닷새 안에, 별 세 개.',kind:'stars',art:['pt/day-five.png','pt/salon.png','pt/star-one.png','pt/star-two.png','pt/star-three.png'],lines:[
  '이 미용실을 맡아 주십시오.\n마왕님께서 만족하실 수 있도록, 당신의 손길이 필요합니다.',
  '마왕님은 별 세 개를 얻지 못한 가게에는 발도 들이지 않으십니다.\n방문 예정일인 5일차까지, 이곳을 3스타 미용실로 만들어야 합니다.',
  '손님들의 부탁을 들어주고 좋은 후기를 얻으십시오.\n팔로워가 모이면, 미용실의 별도 올라갈 겁니다.'
 ]},
 {number:'02',label:'중간 점검',headline:'2일차, 제가 찾아오겠습니다.',kind:'calendar',art:['pt/day-one.png','pt/day-two.png','pt/day-four.png'],lines:[
  '2일차에는 제가 먼저 방문하겠습니다.\n마왕님을 맡겨도 될 실력인지, 직접 확인해야 하니까요.',
  '미용 솜씨는 물론, 필요하다면 야차 실력까지.\n점검 과제는 그때 말씀드리겠습니다.'
 ]},
 {number:'03',label:'닷새 뒤의 약속',headline:'마왕님을 만족시켜 주십시오.',kind:'promise',lines:[
  '5일차, 이곳에 마왕님을 모시겠습니다.\n그때까지 별 세 개를 갖춰 주십시오.',
  '그리고 당신의 미용으로 마왕님을 만족시켜 주신다면…\n책임지고 원래 세계로 돌려보내 드리겠습니다.'
 ]}
];
export const PRESENTATION_SUMMARY=[
 '요점만 말씀드리겠습니다.\n닷새 안에 이곳을 3스타 미용실로 만들어 주십시오.',
 '마왕님을 만족시켜 주시면,\n원래 세계로 돌려보내 드리겠습니다.'
];
export const INTRO_HOLD_MS=1200;
export function normalizeNickname(value){return String(value??'').normalize('NFC').trim().replace(/\s+/gu,' ');}
export function nicknameProblem(value){const name=normalizeNickname(value);if(!name)return '몬스타그램에서 사용할 이름을 입력해 주세요.';if([...name].length>16)return '닉네임은 16자 이내로 입력해 주세요.';if(/[<>\p{Cc}\p{Cf}]/u.test(name))return '꺾쇠나 보이지 않는 제어 문자는 사용할 수 없어요.';return '';}
