// Isolated rehearsal data. It never enters the public project or Excel exports.
export const COFFEE_MONSTER_ID=10005;
export const COFFEE_CURSOR_SETTINGS=Object.freeze({
 basicDamage:5,scratchDamage:10,staggerMax:30,staggerPerHit:5,
 basicCooldown:600,groggyMs:3330,breakRevealMs:650,requireOpeningFinish:true,minimumPlayerHP:1
});

export function coffeeCombatAssets(baseURL='./',portraitLayers=null){
 const base=baseURL.replace(/\/?$/,'/');
 const image=(file,fw,fh,count=1,pose=null)=>({src:base+'media/coffee-ghost/'+file,file,fw,fh,count,cols:count,...(pose?{pose:{x:pose.x,y:pose.y,w:pose.w,h:pose.h,sx:pose.sx||0,sy:pose.sy||0}}:{})});
 const coffeePose=portraitLayers||{body:{x:116,y:192,w:88,h:112},hands:{x:52,y:164,w:216,h:72},head:{x:68,y:86,w:144,h:116},material:{x:46,y:10,w:228,h:244}};
 return {images:{
  coffee_head:image('head-base.png',36,29,1,coffeePose.head),coffee_hair:{...image('hair.png',57,61,1,coffeePose.material),whiteKey:true},
  coffee_body:image('body.png',22,28,1,coffeePose.body),coffee_hands:image('hands.png',54,18,1,coffeePose.hands),
  coffee_eyes:image('eyes-normal.png',36,29,1,coffeePose.eyes?.neutral||coffeePose.head),coffee_eyes_happy:image('eyes-happy.png',36,29,1,coffeePose.eyes?.satisfied||coffeePose.head),
  coffee_mouth:image('mouth-normal-sheet.png',36,29,2,coffeePose.mouth?.closed||coffeePose.head),
  coffee_attack:image('attack-sheet.png',122,96,6)
 }};
}

export function createCoffeeCombatData(baseCombat){
 const data=structuredClone(baseCombat);
 const set=(name,rows)=>{const sheet=data.sheets.find(s=>s.name===name);if(!sheet)throw Error('튜토리얼 전투 시트 없음: '+name);sheet.rows=rows;};
 set('공격 만들기',[{PatternID:20991,Name:'커피 유령 · 한 줄 예고',RangeMode:'범위 반복',ShapePoolID:60991,TilePath:null,HitMin:1,HitMax:1,GapMinMs:null,GapMaxMs:null,ResponseMs:1800,ExtraMinMs:0,ExtraMaxMs:0,AvoidRepeat:false,CanDefend:false,BreakTiles:false,Notes:'로컬 튜토리얼 대련. 예고된 한 줄에서 벗어나기.'}]);
 set('범위 풀',[{ShapePoolID:60991,Candidate:1,SelectMode:'플레이어 행',Tiles:null,Weight:1,Enabled:true,Notes:'현재 행에 예고한 뒤 1회 타격'}]);
 set('이동·연출',[{PatternID:20991,PatternName:'커피 유령 · 한 줄 예고',MoveType:'없음',MoveSpeed:null,MoveDistance:null,MotionKey:'coffee_attack',Effect:'기본',SoundKey:null,EffectMs:null,PushDirection:null,PushTiles:null,PushLeadMs:null,PushMoveMs:null,Notes:'제공 커피 유령 공격 6프레임 원화'}]);
 set('몬스터 페이즈',[1,2].map(phase=>({MonsterID:COFFEE_MONSTER_ID,Name:'커피 유령',PhaseID:phase,IsInitial:phase===1,MaxHP:60,GaugeMax:100,ParryGain:0,GuardGain:0,DodgeGain:0,RecoveryMs:1700,AttackSpeed:1,TransitionTrigger:'HP 0',NextPhaseID:phase===1?2:null,PlayerDodgeMissCount:0,EntryDialogueGroupID:phase===2?89091:null,PauseForEntryDialogue:true,DesignStatus:'로컬 튜토리얼 검토값',OpeningDamageDisplay:null})));
 set('몬스터 사용 패턴',[1,2].map(phase=>({MonsterID:COFFEE_MONSTER_ID,Name:'커피 유령',PhaseID:phase,PatternID:20991,PatternName:'커피 유령 · 한 줄 예고',HitDamage:5,Weight:1,Enabled:true,Notes:'같은 패턴으로 안내 후 스스로 한 번 더'})));
 const groups=[
  [89091,'한 번 더','한 번만 더요! 이번엔 저도 제대로 해볼게요!'],
  [89092,'대련 마무리','휴우… 모습은 닮았는데, 야차는 아직 멀었네요!'],
  [89093,'빈틈 다시 도전','앗, 가위를 놓치셨네요! 괜찮아요. 다시 해봐요!']
 ];
 set('대화 그룹',groups.map(([GroupID,Name])=>({GroupID,Name,PlaybackMode:'순서대로',PauseCombat:true,AdvanceMode:'입력',CPS:32,HoldMs:800,GapMs:0,ActorEffect:'없음',FinishEffect:'없음',Notes:'커피 유령 튜토리얼 초안'})));
 set('대사',groups.map(([GroupID,,Text],i)=>({DialogueID:990091+i,GroupID,Order:1,Speaker:'몬스터',Text,Notes:'커피 유령 튜토리얼 초안'})));
 set('전투 대사 연결',[{TriggerID:109091,MonsterID:COFFEE_MONSTER_ID,PhaseID:null,EventType:'승리',PatternID:null,BeautyCondition:'공통',GroupID:89092,HPThresholdPct:null,CooldownMs:0,MaxPerBattle:1,Enabled:true,Notes:'대련 승리 뒤에도 유령은 남는다',EventCount:null}]);
 const salon=data.sheets.find(s=>s.name==='미용 대사 연결');if(salon)salon.rows=[];
 return data;
}
