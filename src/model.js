export const FLOW_VERSION='통합 플레이 0.10 · 자유로운 손질과 부탁 메모';
export const SALON_EVENTS=[['arrival','손님 등장'],['cut','형태 만들기 요청'],['draw','색·무늬 요청'],['attach','장식 요청'],['best','미용 매우 만족'],['normal','미용 만족'],['fail','미용 불만족'],['proposal','야차 제안'],['afterWin','야차 승리 후 미용실'],['afterLoss','야차 패배 후 미용실'],['leave','손님 퇴장']];
export function modelRows(p,name){return p.combat.sheets.find(s=>s.name===name)?.rows||[];}
export function defaultProject(combat,assets){
 const p={format:'YACHACHA_FULLFLOW',schemaVersion:1,version:1,updatedAt:null,combat:structuredClone(combat),guests:[],schedule:[[10001,10002],[10003]]};
 const region=(key,label,x,y,w,h,kind='good',extra={})=>({key,label,x,y,w,h,kind,shape:'rect',points:0,stickerIDs:[],...extra});
 const base={enabled:true,steps:{cut:true,attach:true,draw:true},weights:{cut:50,attach:30,draw:20},cutTool:'scissors',request:'눈이 보이게 앞머리를 단정하게 잘라 주세요.',attachTag:'Tag_Gentle',attachFirst:30,attachExtra:15,attachMisplaced:10,attachWrong:15,attachHint:'단정한 인상으로 부탁드려요.',drawHint:'노출된 뇌를 연두색이나 초록색으로 가려 주세요.',drawColors:['#00DC0A','#228947'],cutRegions:[],attachRegions:[],drawRegions:[],basePay:1000,tipRate:.3};
 const z={id:10001,name:'취준좀비',beauty:structuredClone(base),bindings:{arrival:80001,cut:80002,best:80005,normal:80006,fail:80007,proposal:80008,leave:80028},battle:'proposal',note:'좀비 기획서와 v35 기준. 정답 영역 좌표는 프로토타입 좌표이며 편집할 수 있습니다.'};
 z.beauty.cutRegions=[region('protect','보존할 윗머리',58,0,189,65,'bad'),region('bang','자를 앞머리',95,78,116,60),region('side','자유 손질',57,64,190,80,'keep')];
 z.beauty.attachRegions=[region('Eye','눈',112,87,96,40,'good',{stickerIDs:['ST-GENTLE-GLASSES-HORN']}),region('UnderNose','코 아래',132,127,58,30,'good',{stickerIDs:['ST-GENTLE-MOUSTACHE']}),region('Neck','목',120,180,82,48,'good',{stickerIDs:['ST-GENTLE-BOWTIE-BLACK']})];
 z.beauty.drawRegions=[region('Brain','노출된 뇌',150,53,68,50,'good',{shape:'ellipse',points:20}),region('EyeL','왼쪽 눈',111,103,40,32,'bad',{shape:'ellipse',points:5}),region('EyeR','오른쪽 눈',170,103,40,32,'bad',{shape:'ellipse',points:5}),region('Mouth','입',131,136,58,30,'bad',{shape:'ellipse',points:5}),region('Face','나머지 얼굴',88,38,144,156,'bad',{shape:'ellipse',points:5}),region('Clothes','의상',48,163,224,180,'bad',{shape:'ellipse',points:3})];
 const d={id:10002,name:'취객',beauty:{...structuredClone(base),enabled:false,steps:{cut:false,attach:false,draw:false},basePay:0},bindings:{},battle:'forced',note:'미용 없이 야차. 술이 깨면 미용실에서 가업과 몬스터 소울 이야기를 이어갑니다.'};
 const s={id:10003,name:'샌즈',beauty:{...structuredClone(base),steps:{cut:true,attach:true,draw:false},weights:{cut:70,attach:30,draw:0},cutTool:'hammer',request:'망치·정으로 얼굴 테두리를 망치·정으로 조금씩 깎아 주세요.',attachTag:'Tag_Strong',attachHint:'강해 보이는 Tag_Strong 스티커를 붙여 주세요.',drawHint:'이번 손님은 그리기를 진행하지 않습니다.'},bindings:{},battle:'forced',note:'사용자 확정: 망치·정 / 얼굴 테두리 / Tag_Strong. 점수 70+30, 테두리 6곳과 스티커 얼굴 영역은 편집 가능한 임시값입니다.'};
 s.beauty.cutRegions=[region('outline1','①',92,44,25,30),region('outline2','②',138,28,39,22),region('outline3','③',205,44,25,30),region('outline4','④',87,103,22,39),region('outline5','⑤',211,103,22,39),region('outline6','⑥',132,163,56,22)];
 s.beauty.attachRegions=[region('Face','얼굴·머리',80,20,160,175,'good',{stickerIDs:assets.stickers.filter(x=>x.tag==='Tag_Strong').map(x=>x.id)})];
 p.guests=[z,d,s];
 const add=(g,event,name,texts)=>{const groups=modelRows(p,'대화 그룹'),lines=modelRows(p,'대사'),id=Math.max(80053,...groups.map(x=>x.GroupID))+1;groups.push({GroupID:id,Name:name,PlaybackMode:'순서대로',PauseCombat:true,AdvanceMode:'입력',CPS:30,HoldMs:1400,GapMs:100,Notes:'통합 프로토타입 미용실 대사',ActorEffect:'없음',FinishEffect:'없음'});let lid=Math.max(0,...lines.map(x=>x.DialogueID));texts.forEach((text,i)=>lines.push({DialogueID:++lid,GroupID:id,Order:i+1,Speaker:'몬스터',Text:text,Notes:'통합 플레이'}));g.bindings[event]=id;};
 add(z,'attach','좀비 · 스티커 요청',['면접에는 첫인상이 중요하다고 하더군요... <color=#FFD166>단정한 장식</color>을 부탁드립니다. 으어어...']);
 add(z,'draw','좀비 · 그리기 요청',['앗, 뇌가 좀 나왔네요. <wave=2>긴장해서 그렇습니다.</wave> 연두색이나 초록색으로, 머리카락처럼 가려 주세요...']);
 add(z,'afterWin','좀비 · 미용실 복귀',['으어어... 머리도 정리하고, 정신도 번쩍 들었네요. 내일은 <color=#FFD166>면접장에 부활</color>하겠습니다!']);
 add(z,'afterLoss','좀비 · 연습 종료',['으어어... 연습은 여기까지 하죠. 저도 내일 면접이 있어서요.']);
 add(d,'arrival','취객 · 불 켜진 미용실',['<shake=2>으하하하!</shake> 오랜만이구먼, 제이!!','가게에 불이 켜져 있길래 냅다 뛰어왔지! 이야, 얼굴이 좀... <wave=3>두 개로 보이는구먼!</wave>']);
 add(d,'afterWin','취객 · 돌아온 가업',['...자네, 제이가 아니었구먼. 허허. 이제야 제대로 보이는군.','제이가 사라진 뒤로 이 가게도, 내 손끝도 멈춘 줄 알았지. 일용직 일 끝내고 한잔하는 게 하루의 전부였어.','우리 집안은 몬스터의 소울에 남은 힘을 <color=#9FE8D1>장비와 기술로 빚어내던</color> 일을 했네. 아는 이만 찾던 오래된 가업이지.','세상이 편리해지니 그 솜씨를 찾는 이도 줄었어. 다시 쓸 일이 없을 줄 알았는데... 자네를 보니, <wave=2>손이 근질근질하구먼!</wave>','좋아. 머물러도 된다면 손끝부터 다시 깨워 보지. <color=#FFD166>몬스터 소울을 다루는 법</color>도 차근차근 알려 주겠네.']);
 add(d,'leave','취객 · 잠깐의 외출',['허허, 오늘은 술 대신 물 한 잔이면 되겠어. 도구를 챙겨 올 테니, 가게 불은 꺼뜨리지 말게!']);
 add(s,'arrival','샌즈 · 방문',['...헤. 여기 솜씨가 좋다는 소문을 들었거든.','뼈 있는 부탁 하나 해도 될까? <color=#FFD166>얼굴 테두리</color>만 다듬어 줘. 머리카락은... 보다시피 휴가 중이야.']);
 add(s,'cut','샌즈 · 망치와 정',['가위 말고 <color=#FFD166>망치랑 정</color>으로. 테두리만 톡톡, 알지? <wave=2>속까지 시원해질 필요는 없거든.</wave>']);
 add(s,'attach','샌즈 · 강한 장식',['이번엔 좀 <shake=1><color=#FFA568>강해 보이게</color></shake> 해 줘. 불꽃이나 흉터 같은 거. 뼈대는 이미 완성됐으니까.']);
 add(s,'best','샌즈 · 미용 만족',['헤. 꽤 뼈대 있는 실력이네. 그럼... 몸도 한번 풀어 볼까?']);
 add(s,'normal','샌즈 · 미용 보통',['나쁘지 않네. 이번엔 다른 솜씨도 보여 줄래?']);
 add(s,'fail','샌즈 · 미용 실패',['...친구, 이건 좀 뼈아픈데. 잠깐 밖에서 얘기할까?']);
 add(s,'afterWin','샌즈 · 야차가 끝난 미용실',['미용실로 돌아오자, 문에 달린 종이 작게 울렸다. 오늘의 마지막 손님과의 야차가 끝났다.']);
modelRows(p,'대사').filter(l=>l.GroupID===s.bindings.afterWin).forEach(l=>l.Speaker='나레이션');
 for(const g of p.guests){const preset=BEAUTY_PRESETS[g.id];if(preset){g.beauty=structuredClone(preset.beauty);g.note=preset.note;}}
 return p;
}
export function projectProblems(p){const errors=[];if(p?.format!=='YACHACHA_FULLFLOW'||p.schemaVersion!==1||!p.combat?.sheets||!Array.isArray(p.guests))return ['이 통합 개발실에서 저장한 프로젝트 파일이 아닙니다.'];for(const name of ['대사','대화 그룹','몬스터 페이즈'])if(!p.combat.sheets.some(s=>s.name===name))errors.push(name+' 시트가 없습니다.');if(p.guests.length!==3||p.guests.some(g=>![10001,10002,10003].includes(g.id)))errors.push('이번 버전은 좀비·취객·샌즈 세 손님을 사용합니다.');for(const g of p.guests){const b=g.beauty;if(!b?.steps||!b.weights||!b.cutRegions||!b.attachRegions||!b.drawRegions){errors.push(g.name+' 미용 설정 누락');continue;}if(b.enabled){if(!Object.values(b.steps).some(Boolean))errors.push(g.name+' 미용 단계를 하나 이상 켜 주세요.');if(Object.keys(b.steps).reduce((s,k)=>s+(b.steps[k]?+b.weights[k]:0),0)!==100)errors.push(g.name+' 켜진 단계의 점수 합계는 100이어야 합니다.');for(const r of [...b.cutRegions,...b.attachRegions,...b.drawRegions])if(![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.w<=0||r.h<=0||r.x<0||r.y<0||r.x+r.w>320||r.y+r.h>350)errors.push(g.name+' 영역 '+r.label+'이 얼굴 편집판을 벗어났습니다.');if(!b.drawColors.every(c=>/^#[0-9a-f]{6}$/i.test(c)))errors.push(g.name+' 색상 형식 확인');}}
 for(const g of p.guests){const b=g.beauty;if(b?.designVersion>=2){for(const r of b.cutRegions){if(!['clear','cover','trim','preserve','free'].includes(r.rule)||!Number.isFinite(r.points)||r.points<0||!Number.isFinite(r.tolerance)||r.tolerance<0||r.tolerance>=1)errors.push(g.name+' 형태 판정 설정 확인');}if(b.steps.cut&&Math.abs(b.cutRegions.reduce((s,r)=>s+r.points,0)-b.weights.cut)>.01)errors.push(g.name+' 형태 조건 배점 합계가 단계 점수와 다릅니다.');const growth=b.growth;if(growth){const r=growth.region;if(!/^#[0-9a-f]{6}$/i.test(growth.color)||!/^#[0-9a-f]{6}$/i.test(growth.outline))errors.push(g.name+' 발모제 색상 확인');if(!r||![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.x<0||r.y<0||r.w<=0||r.h<=0||r.x+r.w>320||r.y+r.h>350)errors.push(g.name+' 발모제 범위 확인');}}}
 return errors;
}
export function stageForGuest(g){return g.beauty.enabled?'beauty':'battle';}

// Start positions come from the same schedule used when a guest leaves.
export function storyStartOptions(project){
 const options=[];
 for(const [dayIndex,ids] of project.schedule.entries()){
  for(const [index,id] of ids.entries()){
   const guest=project.guests.find(g=>g.id===id);
   if(guest&&!options.some(x=>x.guest.id===id))options.push({guest,day:dayIndex+1,index});
  }
 }
 return options;
}
export function createStoryState(project,guestID){
 const start=storyStartOptions(project).find(x=>x.guest.id===guestID);
 if(!start)throw new Error('선택한 손님이 영업 순서에 없습니다.');
 return {project,day:start.day,index:start.index,money:0,records:[],guest:null,lastScore:0,portrait:null,soulUnlocked:false,preview:false};
}

const BEAUTY_PRESETS={
  "10001": {
    "beauty": {
      "enabled": true,
      "steps": {
        "cut": true,
        "draw": true,
        "attach": true
      },
      "weights": {
        "cut": 70,
        "draw": 0,
        "attach": 30
      },
      "cutTool": "scissors",
      "request": "으어어... 내일 면접인데... <color=#266B4D>앞이 좀 환해지고</color>,\n<color=#9A4935>민망한 곳은 안 보였으면</color> 좋겠어요...",
      "attachTag": "Tag_Gentle",
      "attachFirst": 30,
      "attachExtra": 15,
      "attachMisplaced": 10,
      "attachWrong": 15,
      "attachHint": "면접에선... 첫인상이 중요하다던데요...\n<color=#9A5B22><pulse=1.06>단정한 인상</pulse></color>이면... 덜 긴장할 것 같아요...",
      "drawHint": "염색이요...? <wave=1.2><color=#71508F>자유롭게</color></wave> 부탁드려요...\n<color=#266B4D>지금 머리 색도</color> 저는 좋은데...",
      "drawColors": [
        "#75452D"
      ],
      "cutRegions": [
        {
          "key": "EyeL",
          "label": "왼쪽 눈 드러내기",
          "x": 105,
          "y": 90,
          "w": 50,
          "h": 47,
          "kind": "bad",
          "shape": "rect",
          "points": 20,
          "stickerIDs": [],
          "rule": "clear",
          "tolerance": 0.08,
          "mask": "eyes"
        },
        {
          "key": "EyeR",
          "label": "오른쪽 눈 드러내기",
          "x": 169,
          "y": 90,
          "w": 48,
          "h": 47,
          "kind": "bad",
          "shape": "rect",
          "points": 20,
          "stickerIDs": [],
          "rule": "clear",
          "tolerance": 0.08,
          "mask": "eyes"
        },
        {
          "key": "Brain",
          "label": "뇌를 머리카락으로 덮기",
          "x": 155,
          "y": 25,
          "w": 73,
          "h": 68,
          "kind": "good",
          "shape": "rect",
          "points": 30,
          "stickerIDs": [],
          "rule": "cover",
          "tolerance": 0.08,
          "mask": "brain"
        }
      ],
      "attachRegions": [
        {
          "key": "Eye",
          "label": "눈",
          "x": 112,
          "y": 87,
          "w": 96,
          "h": 40,
          "kind": "good",
          "shape": "rect",
          "points": 0,
          "stickerIDs": [
            "ST-GENTLE-GLASSES-HORN"
          ]
        },
        {
          "key": "UnderNose",
          "label": "코 아래",
          "x": 132,
          "y": 127,
          "w": 58,
          "h": 30,
          "kind": "good",
          "shape": "rect",
          "points": 0,
          "stickerIDs": [
            "ST-GENTLE-MOUSTACHE"
          ]
        },
        {
          "key": "Neck",
          "label": "목",
          "x": 120,
          "y": 180,
          "w": 82,
          "h": 48,
          "kind": "good",
          "shape": "rect",
          "points": 0,
          "stickerIDs": [
            "ST-GENTLE-BOWTIE-BLACK"
          ]
        }
      ],
      "drawRegions": [],
      "basePay": 1000,
      "tipRate": 0.3,
      "designVersion": 2,
      "growth": {
        "enabled": true,
        "material": "hair",
        "color": "#71EE8C",
        "outline": "#045112",
        "region": {
          "x": 40,
          "y": 0,
          "w": 240,
          "h": 330
        }
      },
      "requestNotes": {
        "cut": "눈은 잘 보이게\n뇌는 머리로 가리기",
        "draw": "지금 색도 좋아요\n색·무늬는 자유롭게",
        "attach": "면접에 어울리게\n단정한 장식 하나"
      },
      "requestDetails": {
        "cut": "<color=#266B4D>두 눈이 잘 보이게</color> 앞머리를 잘라 주세요...\n아, <color=#9A4935>튀어나온 뇌는 머리카락으로 가려</color> 주시고요... <wave=1.2>부탁드립니다...</wave>",
        "draw": "<color=#71508F>어떤 색이나 무늬든</color> 괜찮아요...\n<color=#266B4D>염색하지 않아도 좋아요.</color> 머리는 지금도 마음에 들어서...",
        "attach": "면접장에서 <color=#9A5B22>단정하고 점잖아 보일 장식</color>으로...\n<color=#9A5B22>하나만</color> 골라 주시겠어요...? <wave=1.2>너무 요란하진 않게요...</wave>"
      },
      "requestBriefNotes": {
        "cut": "앞은 환하게\n민망한 곳은 감춰서",
        "draw": "지금 색도 좋아요\n자유롭게 꾸며 주세요",
        "attach": "면접을 앞둔 손님\n단정한 첫인상으로"
      }
    },
    "note": "첫 손님: 눈 드러내기 + 뇌를 머리카락으로 가리기 + 젠틀 장식. 염색은 자유 체험. 영역·허용 오차·배점은 시험값이며 Unity 미용 계약은 미정입니다. 표정은 기존 얼굴을 이용한 임시 눈·입 표현입니다."
  },
  "10003": {
    "beauty": {
      "enabled": true,
      "steps": {
        "cut": true,
        "draw": true,
        "attach": true
      },
      "weights": {
        "cut": 70,
        "draw": 0,
        "attach": 30
      },
      "cutTool": "hammer",
      "request": "헤. 오늘은 <color=#52609B>인상 좀 다듬으러</color> 왔어.\n<color=#52609B>각진 데만 가볍게.</color> <wave=1.3>뼈대는 괜찮잖아?</wave>",
      "attachTag": "Tag_Strong",
      "attachFirst": 30,
      "attachExtra": 15,
      "attachMisplaced": 10,
      "attachWrong": 15,
      "attachHint": "이번엔 좀 <color=#9A4935><shake=0.6>만만하지 않은 인상</shake></color>이면 좋겠어.\n<color=#9A4935>장식</color>으로 한 수 보여 줄래?",
      "drawHint": "색은 <color=#71508F>네 감각에 맡길게.</color>\n<color=#52609B>원래 뼈 색</color>도 꽤 멋지거든. <wave=1.2>뼈가 있는 색이지.</wave>",
      "drawColors": [
        "#E9E2D6"
      ],
      "cutRegions": [
        {
          "key": "outline1",
          "label": "왼쪽 윗테두리",
          "x": 92,
          "y": 44,
          "w": 25,
          "h": 30,
          "kind": "good",
          "shape": "rect",
          "points": 11.666666666666666,
          "stickerIDs": [],
          "rule": "trim",
          "tolerance": 0.15
        },
        {
          "key": "outline2",
          "label": "정수리 테두리",
          "x": 138,
          "y": 28,
          "w": 39,
          "h": 22,
          "kind": "good",
          "shape": "rect",
          "points": 11.666666666666666,
          "stickerIDs": [],
          "rule": "trim",
          "tolerance": 0.15
        },
        {
          "key": "outline3",
          "label": "오른쪽 윗테두리",
          "x": 205,
          "y": 44,
          "w": 25,
          "h": 30,
          "kind": "good",
          "shape": "rect",
          "points": 11.666666666666666,
          "stickerIDs": [],
          "rule": "trim",
          "tolerance": 0.15
        },
        {
          "key": "outline4",
          "label": "왼쪽 옆테두리",
          "x": 87,
          "y": 103,
          "w": 22,
          "h": 39,
          "kind": "good",
          "shape": "rect",
          "points": 11.666666666666666,
          "stickerIDs": [],
          "rule": "trim",
          "tolerance": 0.15
        },
        {
          "key": "outline5",
          "label": "오른쪽 옆테두리",
          "x": 211,
          "y": 103,
          "w": 22,
          "h": 39,
          "kind": "good",
          "shape": "rect",
          "points": 11.666666666666666,
          "stickerIDs": [],
          "rule": "trim",
          "tolerance": 0.15
        },
        {
          "key": "outline6",
          "label": "턱 테두리",
          "x": 132,
          "y": 163,
          "w": 56,
          "h": 22,
          "kind": "good",
          "shape": "rect",
          "points": 11.666666666666666,
          "stickerIDs": [],
          "rule": "trim",
          "tolerance": 0.15
        }
      ],
      "attachRegions": [
        {
          "key": "Face",
          "label": "얼굴·머리",
          "x": 80,
          "y": 20,
          "w": 160,
          "h": 175,
          "kind": "good",
          "shape": "rect",
          "points": 0,
          "stickerIDs": [
            "ST-STRONG-FLAME-BLUE",
            "ST-STRONG-SCAR-01",
            "ST-STRONG-SCAR-02",
            "ST-STRONG-CROWN-01",
            "ST-STRONG-CROWN-02"
          ]
        }
      ],
      "drawRegions": [],
      "basePay": 1000,
      "tipRate": 0.3,
      "designVersion": 2,
      "growth": {
        "enabled": true,
        "material": "bone",
        "color": "#E9E2D6",
        "outline": "#7478B6",
        "region": {
          "x": 40,
          "y": 0,
          "w": 240,
          "h": 210
        }
      },
      "requestNotes": {
        "cut": "얼굴 테두리만 살짝\n안쪽은 조심조심",
        "draw": "지금 색도 좋아\n색·무늬는 자유롭게",
        "attach": "만만해 보이지 않게\n강렬한 인상"
      },
      "requestDetails": {
        "cut": "<color=#52609B>얼굴 바깥 테두리만</color> 망치랑 정으로 톡톡 다듬어 줘.\n<color=#9A4935>눈코입은 그대로.</color> <wave=1.2>속까지 시원해질 필요는 없거든.</wave>",
        "draw": "<color=#71508F>더한 뼈와 바깥 테두리</color>에 마음 가는 색을 칠해 봐.\n<color=#52609B>그대로 둬도 좋아.</color> 취향엔 정답이 없으니까. 헤.",
        "attach": "<color=#9A4935>강해 보이는 장식 하나</color>를 <color=#52609B>얼굴이나 머리 쪽</color>에 부탁해.\n딱 봤을 때 <shake=0.6>쉽게 덤비지는 못하겠다</shake> 싶은 걸로."
      },
      "requestBriefNotes": {
        "cut": "각진 인상을\n가볍게 다듬기",
        "draw": "원래 뼈 색도 좋아\n색·무늬는 자유롭게",
        "attach": "만만하지 않은 인상\n장식으로 표현하기"
      }
    },
    "note": "망치·정 / 얼굴 테두리 / Tag_Strong. 발모제는 기존 두개골과 이어지는 뼈 재료. 형태 목표·배점은 기존 임시값을 유지한 시험 설정입니다. 눈·입 표현도 임시입니다."
  }
};
