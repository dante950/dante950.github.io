import {DialoguePlayer,validateDialogues} from './dialogue.js';
export const clone=x=>JSON.parse(JSON.stringify(x));
export const rows=(d,n)=>d.sheets.find(s=>s.name===n)?.rows||[];
export const same=(a,b)=>String(a)===String(b);
export const on=x=>x===true||x==='켜기'||x===1;
export const empty=x=>x==null||x==='';
const num=(x,min=0)=>typeof x==='number'&&Number.isFinite(x)&&x>=min;
const integer=(x,min=0)=>num(x,min)&&Number.isInteger(x);
export const tileList=x=>empty(x)?[]:String(x).split(',').map(x=>Number(x.trim()));
export const rule=(d,k)=>rows(d,'공통 규칙').find(r=>r.RuleID===k)?.Value;
export const extra=(d,id)=>rows(d,'이동·연출').find(r=>same(r.PatternID,id))||{};
const fallback=(x,y)=>empty(x)?y:x;
export function weighted(a,rng=Math.random){const total=a.reduce((s,x)=>s+x.Weight,0);if(!(total>0))throw Error('선택 비중의 합계가 0입니다.');let v=rng()*total;return a.find(x=>(v-=x.Weight)<0)||a.at(-1);}
const rangeKey=g=>[...new Set(g)].sort((a,b)=>a-b).join(',');
export function candidates(d,id,pos){return rows(d,'범위 풀').filter(r=>same(r.ShapePoolID,id)&&on(r.Enabled)&&r.Weight>0).map(r=>({...r,tiles:r.SelectMode==='플레이어 행'?[1,2,3].map(t=>t+3*Math.floor((pos-1)/3)):r.SelectMode==='플레이어 열'?[1,4,7].map(t=>t+(pos-1)%3):tileList(r.Tiles)}));}
export function unavoidableCandidates(d,p){if(on(p.CanDefend)||p.RangeMode!=='범위 반복')return [];return candidates(d,p.ShapePoolID,5).filter(c=>new Set(c.tiles).size===9);}
export function telegraphVisual(b){const plan=b?.planInfo;if(b?.state!=='attack'||!plan)return null;const combo=b.pattern.RangeMode==='범위 반복'&&plan.groups.length>1;const q=b.preview;if(combo){if(!q||b.time-q.previewAt>=400||b.time>=plan.firstHit)return null;const age=Math.max(0,b.time-q.previewAt),p=age/400;return {tiles:q.tiles,combo:true,age,alpha:1-Math.pow(p,.55),numberAlpha:p<.3?p/.3:Math.max(0,(1-p)/.7),scale:p<.3?.5+p/.3*.7:1.2-(p-.3)/.7*.2,label:String(q.count-q.index+1)};}return q?{tiles:q.tiles,combo:false,age:b.time-q.previewAt,alpha:1,label:null}:null;}
export function pushDestination(pos,direction,distance,blocked=new Set()){
 const delta={'왼쪽':[-1,0],'오른쪽':[1,0],'위':[0,-1],'아래':[0,1]}[direction];if(!delta)throw Error('밀 방향을 선택하세요.');
 for(const sign of [1,-1]){const x=(pos-1)%3+delta[0]*distance*sign,y=Math.floor((pos-1)/3)+delta[1]*distance*sign,t=y*3+x+1;if(x>=0&&x<3&&y>=0&&y<3&&!blocked.has(t))return t;}return null;
}
export function makePlan(d,p,m,{pos=5,time=0,broken={},rng=Math.random}={}){
 const unsafe=unavoidableCandidates(d,p);if(unsafe.length)throw Error(`공격 ${p.PatternID}: 방어 불가인데 풀 ${p.ShapePoolID}의 후보 ${unsafe.map(c=>c.Candidate).join(', ')}가 전체 9칸입니다. 전체 타일을 제외한 풀을 연결하세요.`);
 const e=extra(d,p.PatternID),speed=m.AttackSpeed,random=(a,b)=>a+rng()*(b-a);let groups=[],push=null;
 if(p.RangeMode==='범위 반복'){
  const n=p.HitMin+Math.floor(rng()*(p.HitMax-p.HitMin+1)),all=candidates(d,p.ShapePoolID,pos);
  for(let i=0;i<n;i++){const alternatives=on(p.AvoidRepeat)&&i?all.filter(c=>rangeKey(c.tiles)!==rangeKey(groups.at(-1))):all;groups.push([...weighted(alternatives.length?alternatives:all,rng).tiles]);}
 }else if(p.RangeMode==='경로 순차')groups=(empty(p.TilePath)?weighted(candidates(d,p.ShapePoolID,pos),rng).tiles:tileList(p.TilePath)).map(t=>[t]);
 else if(p.RangeMode==='밀친 위치'){
  const direction=e.PushDirection==='좌우 무작위'?(rng()<.5?'왼쪽':'오른쪽'):e.PushDirection;
  const dest=pushDestination(pos,direction,e.PushTiles,new Set(Object.entries(broken).filter(([,v])=>v>time).map(([t])=>+t)));
  if(dest===null)return {cancel:true};groups=[[dest]];
  const lead=fallback(e.PushLeadMs,rule(d,'DefaultPushLeadMs'))/speed,duration=fallback(e.PushMoveMs,rule(d,'DefaultPushMoveMs'))/speed;
  push={dest,start:time+lead,end:time+lead+duration,started:false,done:false};
 }else throw Error('범위 사용 방식을 확인하세요.');
 const gapMin=fallback(p.GapMinMs,rule(d,'DefaultGapMinMs')),gapMax=fallback(p.GapMaxMs,rule(d,'DefaultGapMaxMs'));
 const offsets=[0];for(let i=1;i<groups.length;i++)offsets.push(offsets.at(-1)+random(gapMin,gapMax)/speed);
 const response=(fallback(p.ResponseMs,rule(d,'DefaultResponseMs'))+random(fallback(p.ExtraMinMs,0),fallback(p.ExtraMaxMs,0))+(groups.some(g=>new Set(g).size===9)?rule(d,'AoeExtraResponseMs'):0))/speed;
 const first=time+offsets.at(-1)+response+(push?push.end-time:0);
 const queue=groups.map((tiles,i)=>({tiles,index:i+1,count:groups.length,previewAt:time+offsets[i],due:first+offsets[i],announced:false}));
 return {groups,queue,push,speed,started:time,motionStart:push?push.start:time+offsets.at(-1),firstHit:first,lastHit:queue.at(-1).due,motionEnd:queue.at(-1).due,response,snapshot:pos,extra:e,motionStarted:false};
}
export function validate(d,{monsterID=null,phaseID=null,patternID=null,preview=false}={}){
 const errors=[],warnings=[],add=x=>errors.push(x),ms=rows(d,'몬스터 페이즈'),ps=rows(d,'공격 만들기'),mp=rows(d,'몬스터 사용 패턴');
 const all=monsterID===null;
 const required=['공격 만들기','이동·연출','몬스터 사용 패턴','몬스터 페이즈','범위 풀','플레이어','공통 규칙'];for(const n of required)if(!d.sheets.some(s=>s.name===n))add(`시트 없음: ${n}`);
 const unique=(name,keys)=>{const seen=new Set();for(const r of rows(d,name)){const k=keys.map(k=>r[k]).join('/');if(keys.some(k=>empty(r[k])))add(`${name}: 필수 ID 누락`);if(seen.has(k))add(`${name}: 중복 ID ${k}`);seen.add(k);}};
 for(const [s,ks]of [['공격 만들기',['PatternID']],['이동·연출',['PatternID']],['몬스터 페이즈',['MonsterID','PhaseID']],['몬스터 사용 패턴',['MonsterID','PhaseID','PatternID']],['범위 풀',['ShapePoolID','Candidate']],['공통 규칙',['RuleID']]])unique(s,ks);
 const player=rows(d,'플레이어')[0];if(!player)add('플레이어 값이 없습니다.');else for(const k of ['MaxHP','DodgeDamage','GuardMax','ParryMs','GuardHitCost','GuardHoldPerSec','GuardRegenPerSec','GuardBreakSec'])if(!num(player[k],['MaxHP','GuardMax'].includes(k)?0.001:0))add(`플레이어: ${k} 값 확인`);
 for(const k of ['DefaultResponseMs','DefaultGapMinMs','DefaultGapMaxMs','DefaultPushLeadMs','DefaultPushMoveMs','AoeExtraResponseMs','TileRestoreSec','GroggyDrainPerSec','PostGroggyLockMs'])if(!num(rule(d,k),['TileRestoreSec','GroggyDrainPerSec'].includes(k)?0.001:0))add(`공통 규칙: ${k} 값 확인`);
 for(const [k,v]of Object.entries({PushBoundary:'반대쪽 확인 후 취소',PushInput:'이동 종료 후 허용',PhaseOrder:'전환 우선',CombatPause:'전투 시간만 정지'}))if(rule(d,k)!==v)add(`공통 규칙 ${k}: 현재 지원 값은 '${v}'입니다.`);
 const selected=ms.filter(m=>(all||same(m.MonsterID,monsterID))&&(phaseID==null||same(m.PhaseID,phaseID)));
 if(!selected.length)add('선택한 몬스터 페이즈가 없습니다.');
 const pids=new Set(patternID==null?[]:[String(patternID)]);
 for(const m of selected){const label=`${m.Name} ${m.PhaseID}페이즈`;
  for(const k of ['MaxHP','GaugeMax','ParryGain','GuardGain','DodgeGain','RecoveryMs','AttackSpeed','PlayerDodgeMissCount'])if(!num(m[k],['MaxHP','GaugeMax','AttackSpeed'].includes(k)?0.001:0))add(`${label}: ${k} 미입력 또는 잘못된 값`);
  for(const k of ['OpeningDamageDisplay'])if(!empty(m[k])&&!integer(m[k],1))add(`${label}: ${k}는 빈칸 또는 1 이상 정수`);
  if(!integer(m.PlayerDodgeMissCount))add(`${label}: MISS 기회 수는 0 이상 정수`);
  if(!['HP 0','빈틈공격 성공','없음'].includes(m.TransitionTrigger))add(`${label}: 전환 사건 미정`);
  if(ms.filter(x=>same(x.MonsterID,m.MonsterID)&&on(x.IsInitial)).length!==1)add(`${m.Name}: 시작 페이즈를 하나 선택하세요.`);
  if(!empty(m.NextPhaseID)&&(!ms.some(n=>same(n.MonsterID,m.MonsterID)&&same(n.PhaseID,m.NextPhaseID))||!['HP 0','빈틈공격 성공'].includes(m.TransitionTrigger)))add(`${label}: 다음 페이즈 연결 확인`);
  let current=m;const seen=new Set();while(current&&!empty(current.NextPhaseID)){if(seen.has(String(current.PhaseID))){add(`${label}: 페이즈가 순환 연결되어 있습니다.`);break;}seen.add(String(current.PhaseID));current=ms.find(n=>same(n.MonsterID,m.MonsterID)&&same(n.PhaseID,current.NextPhaseID));}
  if(!preview){const a=mp.filter(r=>same(r.MonsterID,m.MonsterID)&&same(r.PhaseID,m.PhaseID)&&on(r.Enabled));if(!a.some(r=>num(r.Weight)&&r.Weight>0))add(`${label}: 사용 패턴을 켜고 양수 비중을 입력하세요.`);for(const r of a){if(!num(r.HitDamage)||!num(r.Weight))add(`${label}: 패턴 ${r.PatternID} 피해·비중 확인`);pids.add(String(r.PatternID));}}

 }
 if(all)ps.forEach(p=>pids.add(String(p.PatternID)));
 for(const pid of pids){const p=ps.find(p=>same(p.PatternID,pid));if(!p){add(`공격 ${pid} 없음`);continue;}const e=extra(d,pid),label=`공격 ${pid}`;
  const unsafe=unavoidableCandidates(d,p);if(unsafe.length)add(`${label}: 방어 불가 + 전체 타일. 풀 ${p.ShapePoolID} 후보 ${unsafe.map(c=>c.Candidate).join(', ')}를 제외한 풀로 바꾸세요.`);
  if(!integer(p.PatternID,1))add(`${label}: 패턴 ID는 양의 정수`);
  if(!['범위 반복','경로 순차','밀친 위치'].includes(p.RangeMode))add(`${label}: 범위 사용 방식 확인`);
  for(const [lo,hi,dl,dh]of [['GapMinMs','GapMaxMs','DefaultGapMinMs','DefaultGapMaxMs'],['ExtraMinMs','ExtraMaxMs',null,null]]){const a=fallback(p[lo],dl?rule(d,dl):0),b=fallback(p[hi],dh?rule(d,dh):0);if(!num(a)||!num(b)||a>b)add(`${label}: ${lo}~${hi} 최소·최대 확인`);}
  if(!num(fallback(p.ResponseMs,rule(d,'DefaultResponseMs'))))add(`${label}: 피할 시간 확인`);
  if(p.RangeMode==='범위 반복'&&(!integer(p.HitMin,1)||!integer(p.HitMax,1)||p.HitMax>5||p.HitMin>p.HitMax||empty(p.ShapePoolID)))add(`${label}: 반복은 풀 ID와 1~5회 최소·최대가 필요합니다.`);
  if(p.RangeMode==='경로 순차'&&empty(p.ShapePoolID)===empty(p.TilePath))add(`${label}: 범위 풀 또는 직접 경로 중 하나를 입력하세요.`);
  if(!empty(p.TilePath)&&(!tileList(p.TilePath).length||tileList(p.TilePath).some(t=>!integer(t,1)||t>9)))add(`${label}: 타일 번호는 1~9`);
  if(!empty(p.ShapePoolID)&&p.RangeMode!=='밀친 위치'){const pool=rows(d,'범위 풀').filter(r=>same(r.ShapePoolID,p.ShapePoolID)&&on(r.Enabled));if(!pool.some(r=>num(r.Weight)&&r.Weight>0))add(`${label}: 범위 풀 ${p.ShapePoolID}의 사용·비중을 확인하세요.`);for(const r of pool){if(!num(r.Weight))add(`풀 ${r.ShapePoolID}/${r.Candidate}: 비중 확인`);if(!['직접 입력','플레이어 행','플레이어 열'].includes(r.SelectMode))add(`풀 ${r.ShapePoolID}: 범위 선택 방식 확인`);if(r.SelectMode==='직접 입력'&&(!tileList(r.Tiles).length||tileList(r.Tiles).some(t=>!integer(t,1)||t>9)))add(`풀 ${r.ShapePoolID}/${r.Candidate}: 타일 번호 확인`);}}
  if(p.RangeMode==='밀친 위치'){if(!['왼쪽','오른쪽','위','아래','좌우 무작위'].includes(e.PushDirection)||!integer(e.PushTiles,1))add(`${label}: 이동·연출에 밀 방향과 칸 수가 필요합니다.`);for(const [k,dk]of [['PushLeadMs','DefaultPushLeadMs'],['PushMoveMs','DefaultPushMoveMs']])if(!num(fallback(e[k],rule(d,dk))))add(`${label}: ${k} 확인`);}
  if(!empty(e.MoveType)&&!['없음','대상까지','고정 거리'].includes(e.MoveType))add(`${label}: 몬스터 이동 방식 확인`);
  if(!empty(e.MoveSpeed)&&!num(e.MoveSpeed,0.001))add(`${label}: 이동 속도는 양수`);
  if(e.MoveType==='고정 거리'&&!num(e.MoveDistance))add(`${label}: 고정 이동 거리 필요`);
  if(!empty(e.Effect)&&!['기본','블래스터 레이저'].includes(e.Effect))add(`${label}: 지원하지 않는 공격 연출`);
  if(!empty(e.EffectMs)&&!num(e.EffectMs))add(`${label}: 연출 표시 시간 확인`);
 }
 if(all){for(const r of mp){if(!ms.some(m=>same(m.MonsterID,r.MonsterID)&&same(m.PhaseID,r.PhaseID)))add(`몬스터 연결 ${r.MonsterID}/${r.PhaseID} 없음`);if(!ps.some(p=>same(p.PatternID,r.PatternID)))add(`연결된 패턴 ${r.PatternID} 없음`);}for(const e of rows(d,'이동·연출'))if(!ps.some(p=>same(p.PatternID,e.PatternID)))add(`이동·연출: 패턴 ${e.PatternID} 없음`);}
 const dialogueCheck=validateDialogues(d,monsterID);errors.push(...dialogueCheck.errors);warnings.push(...dialogueCheck.warnings);
 return {errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}
export class Battle{
 constructor(d,rng=Math.random){this.data=clone(d);this.rng=rng;this.events=[];this.cues=[];this.serial=0;this.time=0;this.visualTime=0;this.finale=null;this.actorDead=false;this.state='idle';this.pos=5;this.broken={};this.queue=[];this.flash=[];this.paused=false;this.guardHeld=false;this.stats={parry:0,guard:0,dodge:0,hit:0,miss:0,damage:0};}
 cue(kind,detail={}){this.cues.push({id:++this.serial,time:this.time,visualTime:this.visualTime,kind,...detail});if(this.cues.length>100)this.cues.shift();}
 log(text,kind='info'){this.events.unshift({time:this.time,text,kind});this.events.length=Math.min(this.events.length,100);if(kind!=='info')this.cue(kind,{text});}
 rule(k){return Number(rule(this.data,k));}
 start(id,phase,options={}){this.options=options;const v=validate(this.data,{monsterID:id,phaseID:options.patternID?phase:null,patternID:options.patternID,preview:!!options.patternID});if(v.errors.length)throw Error(v.errors.join('\n'));if(options.patternID&&!num(options.damage))throw Error('시험 피해를 0 이상 숫자로 입력하세요.');this.player=rows(this.data,'플레이어')[0];this.hp=this.player.MaxHP;this.guard=this.player.GuardMax;this.guardBreak=0;this.id=id;this.dialogues=new DialoguePlayer(this);this.enter(phase);this.dialogues.event('전투 시작');this.dialogues.checkHP();}
 enter(phase){this.monster=rows(this.data,'몬스터 페이즈').find(m=>same(m.MonsterID,this.id)&&same(m.PhaseID,phase));this.enemyHP=this.monster.MaxHP;this.gauge=0;this.opportunities=0;this.openingSuccessCount=0;this.openingResult=null;this.lastOpeningResult=null;this.pending=false;this.queue=[];this.pattern=null;this.planInfo=null;this.guardHeld=false;this.state='recover';this.next=this.time+500;this.log(`${this.monster.Name} · ${phase}페이즈 / HP ${this.enemyHP}`,'phase');this.dialogues?.resetPhase();this.dialogues?.event('페이즈 진입');if(this.monster.EntryDialogueGroupID)this.dialogues?.play(this.monster.EntryDialogueGroupID,{priority:95,pause:on(this.monster.PauseForEntryDialogue)});}
 plan(){const a=this.options.patternID?{...rows(this.data,'몬스터 사용 패턴').find(r=>same(r.MonsterID,this.id)&&same(r.PhaseID,this.monster.PhaseID)&&same(r.PatternID,this.options.patternID)),PatternID:this.options.patternID,HitDamage:this.options.damage}:weighted(rows(this.data,'몬스터 사용 패턴').filter(r=>same(r.MonsterID,this.id)&&same(r.PhaseID,this.monster.PhaseID)&&on(r.Enabled)&&r.Weight>0),this.rng);const p=rows(this.data,'공격 만들기').find(p=>same(p.PatternID,a.PatternID));const speed=this.monster.AttackSpeed;this.pattern={...p,HitDamage:a.HitDamage,AttackSpeed:speed};const plan=makePlan(this.data,p,{...this.monster,AttackSpeed:speed},{pos:this.pos,time:this.time,broken:this.broken,rng:this.rng});this.planInfo=plan;if(plan.cancel){this.log('밀 목적지가 양쪽 모두 불가하여 이번 패턴 취소');this.recover();return;}this.queue=plan.queue;this.state='attack';this.log(`${p.Name} · ${plan.groups.length}타 · 피해 ${a.HitDamage}`);this.dialogues?.event('공격 시작',p.PatternID);if(!this.dialogueBlocking)this.advanceEvents();}
 get dialogueBlocking(){return !!this.dialogues?.blocking||!!(this.finale?.blocking&&this.visualTime<this.finale.end);}
 onDialogueStart(group){if(group.ActorEffect==='부활 후 대사'){this.entryEffect={type:'부활',start:this.visualTime,end:this.visualTime+3100};this.actorDead=false;this.guardHeld=false;this.log('부활 연출 시작 · 연출이 끝난 뒤 대사');return 3100;}return 0;}
 onDialogueComplete(group){if(group.FinishEffect==='소멸'){this.finale={type:'소멸',start:this.visualTime,end:this.visualTime+1200,blocking:true};this.guardHeld=false;}else if(group.FinishEffect==='소울 해금 연출')this.finale={type:'소울 해금 연출',start:this.visualTime,end:this.visualTime+6000,blocking:false};}
 recover(){this.state='recover';this.next=this.time+this.monster.RecoveryMs/(this.planInfo?.speed??this.monster.AttackSpeed);this.queue=[];}
 move(dx,dy){if(this.paused||this.dialogueBlocking||['idle','victory','defeat'].includes(this.state)||this.guardHeld||this.forcedMoving)return false;const x=(this.pos-1)%3+dx,y=Math.floor((this.pos-1)/3)+dy;if(x<0||x>2||y<0||y>2)return false;const to=y*3+x+1;if(this.broken[to]>this.time)return false;const from=this.pos;this.pos=to;this.cue('move',{from,to});return true;}
 get forcedMoving(){const p=this.planInfo?.push;return this.state==='attack'&&p?.started&&!p.done;}
 setGuard(down){if(!down){this.guardHeld=false;return;}if(this.paused||this.dialogueBlocking||this.forcedMoving||this.state==='opening'||['idle','victory','defeat'].includes(this.state))return;if(!this.guardHeld&&this.guard>0&&this.guardBreak<=this.time){this.guardHeld=true;this.guardStart=this.time;}}
 addGauge(n){if(['opening','victory','defeat'].includes(this.state))return;this.gauge=Math.min(this.monster.GaugeMax,this.gauge+n);if(this.gauge>=this.monster.GaugeMax)this.open();}
 open(){
  if(this.paused||this.dialogueBlocking||this.pending||['opening','openingResult','victory','defeat'].includes(this.state))return false;
  this.queue=[];this.planInfo=null;this.guardHeld=false;this.state='opening';this.gauge=this.monster.GaugeMax;this.opportunities++;this.pending=false;this.openingResult={attempts:0,hits:0,misses:0,damage:0};
  this.log(`빈틈 기회 ${this.opportunities}${this.opportunities<=this.monster.PlayerDodgeMissCount?' · 전체 MISS':''}`,'opening');this.dialogues?.event('빈틈 발생');return true;
 }
 attack(){
  if(this.state!=='opening'||this.paused||this.dialogueBlocking)return false;
  const result=this.openingResult;result.attempts++;
  if(this.opportunities<=this.monster.PlayerDodgeMissCount||this.player.DodgeDamage===0){result.misses++;this.stats.miss++;this.log('플레이어 빈틈공격 MISS','miss');if(result.misses===1)this.dialogues?.event('빈틈공격 MISS');return true;}
  const n=this.player.DodgeDamage;
  // A phase condition is resolved only once, after the complete opening window.
  const floor=0;
  const hp=Math.max(floor,this.enemyHP-n),actual=this.enemyHP-hp;this.enemyHP=hp;result.hits++;result.damage+=actual;this.stats.damage+=actual;
  this.log(`빈틈 연타 ${result.hits}타 · ${n} 피해${actual<n?' (초과 피해 포함)':''}`,'damage');
  this.cue('openingHit',{value:empty(this.monster.OpeningDamageDisplay)?n:this.monster.OpeningDamageDisplay,actualDamage:actual,hit:result.hits});
  if(this.enemyHP<=0)this.pending=true;
  return true;
 }
 endOpening(){
  if(this.state!=='opening'||this.dialogueBlocking||this.paused)return false;
  this.gauge=0;const result=this.openingResult;this.lastOpeningResult={...result};this.state='openingResult';
  if(result.hits){this.openingSuccessCount++;if(this.monster.TransitionTrigger==='빈틈공격 성공'){this.enemyHP=0;this.pending=true;}}
  this.log(`빈틈 종료 · ${result.hits}타 명중 / ${result.misses}타 MISS / 실제 피해 ${result.damage}`);
  // HP and result dialogue are evaluated only after the complete mash window.
  this.dialogues?.checkHP();
  if(result.hits)this.dialogues?.event('빈틈공격 성공');
  if(!this.pending)this.recoverFromOpening();else this.finishOpeningResult();return true;
 }
 recoverFromOpening(){this.state='recover';this.pattern=null;this.planInfo=null;this.next=this.time+this.rule('PostGroggyLockMs');}
 finishOpeningResult(){
  if(this.state!=='openingResult'||this.dialogueBlocking||this.dialogues?.active||this.dialogues?.queue.length)return false;
  if(this.options.patternID){this.enemyHP=this.monster.MaxHP;this.pending=false;this.actorDead=false;this.finale=null;this.openingSuccessCount=0;this.log('패턴 시험: HP를 회복하고 같은 패턴 반복');this.recoverFromOpening();}
  else if(['HP 0','빈틈공격 성공'].includes(this.monster.TransitionTrigger)&&!empty(this.monster.NextPhaseID))this.enter(this.monster.NextPhaseID);
  else{this.state='victory';this.pattern=null;this.planInfo=null;this.log('모든 페이즈 승리','victory');this.dialogues?.event('승리');}
  return true;
 }
 hit(q){const p=this.pattern,available=q.tiles.filter(t=>!(this.broken[t]>this.time));this.flash=available;this.flashUntil=this.time+130;this.cue('strike',{tiles:q.tiles,index:q.index});if(p.HitDamage===0){this.stats.miss++;this.log('몬스터 MISS · 피해·가드 소모·빈틈 증가 없음','miss');}else if(!available.length)this.log('파괴된 범위: 타격 생략');else if(!available.includes(this.pos)){this.stats.dodge++;this.log('회피 성공','dodge');this.addGauge(this.monster.DodgeGain);}else if(on(p.CanDefend)&&this.guardHeld&&this.guard>0){if(this.time-this.guardStart<=this.player.ParryMs){this.stats.parry++;this.guard=this.player.GuardMax;this.log('패링 성공','parry');this.addGauge(this.monster.ParryGain);}else if(this.guard>=this.player.GuardHitCost){this.stats.guard++;this.guard-=this.player.GuardHitCost;this.log('가드 성공','guard');this.addGauge(this.monster.GuardGain);if(this.guard<=0)this.breakGuard();}else{const n=Math.round(p.HitDamage*(1-this.guard/this.player.GuardHitCost));this.breakGuard();this.damage(n);}}else this.damage(p.HitDamage);
  if(on(p.BreakTiles)&&available.length){for(const t of available)this.broken[t]=this.time+this.rule('TileRestoreSec')*1000;this.cue('break',{tiles:available});}
 }
 damage(n){this.hp=Math.max(0,this.hp-n);this.stats.hit++;this.log(`피격 ${n}`,'hit');this.dialogues?.checkHP();if(this.hp<=0){this.state='defeat';this.queue=[];this.planInfo=null;this.guardHeld=false;this.dialogues?.event('패배');}}
 breakGuard(){this.guard=0;this.guardHeld=false;this.guardBreak=this.time+this.player.GuardBreakSec*1000;this.log('가드 붕괴','hit');}
 advanceEvents(){const plan=this.planInfo;if(this.state!=='attack'||!plan)return;for(const q of this.queue){if(!q.announced&&q.previewAt<=this.time){q.announced=true;this.preview=q;this.cue('telegraph',{tiles:q.tiles,index:q.index,count:q.count});}}
  if(!plan.motionStarted&&this.time>=plan.motionStart){plan.motionStarted=true;plan.motionTarget=this.pos;this.cue('motion',{patternID:this.pattern.PatternID});}
  const push=plan.push;if(push&&!push.started&&this.time>=push.start){if(this.broken[push.dest]>this.time){this.log('밀 목적지가 파괴되어 패턴 취소');this.planInfo=null;this.recover();return;}push.started=true;push.from=this.pos;this.guardHeld=false;this.cue('push',{from:push.from,to:push.dest});}if(push?.started&&!push.done&&this.time>=push.end){push.done=true;this.pos=push.dest;}
  const next=this.queue[0];if(next&&next.index===1&&!plan.ready&&next.due-this.time<=120){plan.ready=true;this.cue('ready');}
  while(this.state==='attack'&&!this.dialogueBlocking&&this.queue[0]?.due<=this.time){this.hit(this.queue.shift());}
  if(this.state==='attack'&&!this.queue.length&&this.time>=plan.motionEnd)this.recover();
 }
 tick(ms){if(this.paused)return;let left=ms;while(left>0&&!this.paused){const dt=Math.min(10,left);left-=dt;const blocked=this.dialogueBlocking;this.visualTime+=dt;this.dialogues?.tick(dt);if(this.finale?.type==='소멸'&&!this.actorDead&&this.visualTime>=this.finale.end){this.actorDead=true;}if(this.state==='openingResult')this.finishOpeningResult();if(blocked||this.dialogueBlocking||['idle','victory','defeat'].includes(this.state))continue;this.time+=dt;for(const[t,due]of Object.entries(this.broken))if(due<=this.time)delete this.broken[t];if(this.guardHeld){this.guard=Math.max(0,this.guard-this.player.GuardHoldPerSec*dt/1000);if(this.guard<=0)this.breakGuard();}else if(this.time>=this.guardBreak)this.guard=Math.min(this.player.GuardMax,this.guard+this.player.GuardRegenPerSec*dt/1000);if(this.state==='opening'){this.gauge=Math.max(0,this.gauge-this.rule('GroggyDrainPerSec')*dt/1000);if(this.gauge<=0)this.endOpening();}else if(this.state==='recover'&&this.time>=this.next)this.plan();else if(this.state==='attack')this.advanceEvents();}}
}
