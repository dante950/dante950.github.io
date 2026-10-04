import {parseDialogueText} from './text-effects.js';
const dialogueRows=(d,n)=>d.sheets.find(s=>s.name===n)?.rows||[];
const dialogueOn=x=>x===true||x==='켜기'||x===1;
const dialogueEmpty=x=>x==null||x==='';
const dialogueSame=(a,b)=>String(a)===String(b);
const dialogueEvents=['전투 시작','페이즈 진입','공격 시작','빈틈 발생','빈틈공격 성공','빈틈공격 MISS','몬스터 HP 이하','플레이어 HP 이하','승리','패배'];
export function validateDialogues(data,monsterID=null){
 const errors=[],warnings=[],groups=dialogueRows(data,'대화 그룹'),lines=dialogueRows(data,'대사'),links=dialogueRows(data,'전투 대사 연결');
 if(!groups.length&&!lines.length&&!links.length)return {errors,warnings};
 const keys=new Set();for(const [name,key,rs]of [['대화 그룹','GroupID',groups],['대사','DialogueID',lines],['전투 대사 연결','TriggerID',links]])for(const r of rs){const id=String(r[key]);if(!Number.isInteger(r[key])||r[key]<=0)errors.push(`${name}: ${key}는 양의 정수입니다.`);if(keys.has(name+id))errors.push(`${name}: 중복 ID ${id}`);keys.add(name+id);}
 for(const line of lines)for(const w of parseDialogueText(line.Text).warnings)warnings.push(`대사 ${line.DialogueID}: ${w}`);
 const order=new Set();for(const line of lines){if(!groups.some(g=>dialogueSame(g.GroupID,line.GroupID)))errors.push(`대사 ${line.DialogueID}: 그룹 ${line.GroupID} 없음`);if(!Number.isInteger(line.Order)||line.Order<1)errors.push(`대사 ${line.DialogueID}: 순번은 1 이상 정수`);const key=line.GroupID+'/'+line.Order;if(order.has(key))errors.push(`대사: 그룹 ${line.GroupID}의 순번 ${line.Order} 중복`);order.add(key);if(!['몬스터','플레이어','나레이션'].includes(line.Speaker))errors.push(`대사 ${line.DialogueID}: 화자를 확인하세요.`);}
 for(const g of groups){if(!dialogueEmpty(g.ActorEffect)&&!['없음','비틀거림','놀람','식은땀','부활 후 대사'].includes(g.ActorEffect))errors.push(`대화 그룹 ${g.GroupID}: 캐릭터 연출 확인`);if(!dialogueEmpty(g.FinishEffect)&&!['없음','소멸','소울 해금 연출'].includes(g.FinishEffect))errors.push(`대화 그룹 ${g.GroupID}: 마무리 연출 확인`);if(!['순서대로','무작위 한 줄'].includes(g.PlaybackMode)||!['자동','입력'].includes(g.AdvanceMode))errors.push(`대화 그룹 ${g.GroupID}: 재생 방식 확인`);for(const k of ['CPS','HoldMs','GapMs'])if(typeof g[k]!=='number'||!Number.isFinite(g[k])||g[k]<0)errors.push(`대화 그룹 ${g.GroupID}: ${k}는 0 이상 숫자`);}
 for(const r of links.filter(r=>dialogueOn(r.Enabled)&&(monsterID==null||dialogueSame(monsterID,r.MonsterID)))){
  if(!dialogueEmpty(r.EventCount)&&(!Number.isInteger(r.EventCount)||r.EventCount<1||!['빈틈공격 성공','빈틈공격 MISS'].includes(r.EventType)))errors.push(`대사 연결 ${r.TriggerID}: 결과 횟수는 빈틈공격 성공/MISS에만 1 이상의 정수로 입력합니다.`);
  const label=`대사 연결 ${r.TriggerID}`,g=groups.find(g=>dialogueSame(g.GroupID,r.GroupID));
  if(!g||!lines.some(l=>dialogueSame(l.GroupID,r.GroupID)&&String(l.Text??'').trim()))errors.push(`${label}: 그룹 ${r.GroupID}의 대사 내용을 먼저 입력하세요.`);
  if(!dialogueRows(data,'몬스터 페이즈').some(m=>dialogueSame(m.MonsterID,r.MonsterID)&&(dialogueEmpty(r.PhaseID)||dialogueSame(m.PhaseID,r.PhaseID))))errors.push(`${label}: 몬스터·페이즈 연결 확인`);
  if(!dialogueEvents.includes(r.EventType))errors.push(`${label}: 재생 사건 확인`);
  if(!['공통','미용 성공','미용 실패'].includes(r.BeautyCondition))errors.push(`${label}: 미용 결과 조건 확인`);
  if(!dialogueEmpty(r.PatternID)&&(r.EventType!=='공격 시작'||!dialogueRows(data,'공격 만들기').some(p=>dialogueSame(p.PatternID,r.PatternID))))errors.push(`${label}: 패턴 조건은 공격 시작에만 존재하는 PatternID로 입력하세요.`);
  if(r.EventType.endsWith('HP 이하')&&(typeof r.HPThresholdPct!=='number'||r.HPThresholdPct<0||r.HPThresholdPct>100))errors.push(`${label}: 기준 HP %를 0~100으로 입력하세요.`);
  for(const k of ['CooldownMs','MaxPerBattle'])if(!Number.isInteger(r[k])||r[k]<0)errors.push(`${label}: ${k}는 0 이상 정수`);
 }
 for(const m of dialogueRows(data,'몬스터 페이즈').filter(m=>monsterID==null||dialogueSame(m.MonsterID,monsterID)))if(!dialogueEmpty(m.EntryDialogueGroupID)&&!groups.some(g=>dialogueSame(g.GroupID,m.EntryDialogueGroupID)))errors.push(`${m.Name} ${m.PhaseID}페이즈: 진입 대화 그룹 ${m.EntryDialogueGroupID} 없음`);
 return {errors:[...new Set(errors)],warnings};
}
export class DialoguePlayer{
 constructor(host,rng=Math.random){this.host=host;this.rng=rng;this.active=null;this.queue=[];this.used=new Map();this.last=new Map();this.hpPrevious=new Map();this.history=[];this.eventCounts=new Map();this.clock=0;}
 get blocking(){return !!(this.active&&(this.active.pause||this.active.leadMs>0));}
 get line(){return this.active?.gap>0||this.active?.leadMs>0?null:this.active?.lines[this.active.index]??null;}
 get visibleGlyphs(){const a=this.active;if(!a||!this.line)return [];return a.rich.glyphs.filter(g=>a.reveal||g.at<=a.elapsed);}
 get visibleText(){return this.visibleGlyphs.map(g=>g.char).join('');}
 get textClock(){const a=this.active;return a?a.elapsed+(a.reveal?Math.max(0,a.rich.duration-a.revealedAt):0):0;}
 get complete(){return !!this.line&&(this.active.reveal||this.active.elapsed>=this.active.rich.duration);}
 resetPhase(){this.eventCounts.clear();for(const r of dialogueRows(this.host.data,'전투 대사 연결'))if(r.EventType==='몬스터 HP 이하')this.hpPrevious.delete(String(r.TriggerID));}
 matches(r,event,patternID){const h=this.host;return dialogueOn(r.Enabled)&&r.EventType===event&&dialogueSame(r.MonsterID,h.monster?.MonsterID)&&(dialogueEmpty(r.PhaseID)||dialogueSame(r.PhaseID,h.monster?.PhaseID))&&(r.BeautyCondition==='공통'||r.BeautyCondition===(h.options?.beauty||'미용 성공'))&&(dialogueEmpty(r.PatternID)||dialogueSame(r.PatternID,patternID));}
 event(event,patternID=null){const count=(this.eventCounts.get(event)||0)+1;this.eventCounts.set(event,count);for(const r of dialogueRows(this.host.data,'전투 대사 연결').filter(r=>this.matches(r,event,patternID)&&(dialogueEmpty(r.EventCount)||r.EventCount===count)))this.trigger(r);}
 trigger(r){const id=String(r.TriggerID),time=this.host.time||0,used=this.used.get(id)||0;if(r.MaxPerBattle>0&&used>=r.MaxPerBattle)return false;if(this.last.has(id)&&time-this.last.get(id)<r.CooldownMs)return false;if(r.EventType==='공격 시작'&&(this.active||this.queue.length))return false;
  const priority=['승리','패배'].includes(r.EventType)?100:['빈틈공격 성공','빈틈공격 MISS'].includes(r.EventType)?95:r.EventType==='페이즈 진입'?90:r.EventType==='전투 시작'?80:r.EventType==='공격 시작'?10:50;
  if(!this.play(r.GroupID,{priority}))return false;this.used.set(id,used+1);this.last.set(id,time);return true;
 }
 checkHP(){for(const r of dialogueRows(this.host.data,'전투 대사 연결')){if(!r.EventType?.endsWith('HP 이하')||!this.matches(r,r.EventType,null)||typeof r.HPThresholdPct!=='number')continue;const enemy=r.EventType==='몬스터 HP 이하',h=this.host,ratio=100*(enemy?h.enemyHP/h.monster.MaxHP:h.hp/h.player.MaxHP),id=String(r.TriggerID),previous=this.hpPrevious.get(id)??Infinity;this.hpPrevious.set(id,ratio);if(previous>r.HPThresholdPct&&ratio<=r.HPThresholdPct)this.trigger(r);}}
 play(groupID,{priority=80,pause=null,replace=false}={}){
  const group=dialogueRows(this.host.data,'대화 그룹').find(g=>dialogueSame(g.GroupID,groupID));let lines=dialogueRows(this.host.data,'대사').filter(l=>dialogueSame(l.GroupID,groupID)&&String(l.Text??'').trim()).sort((a,b)=>a.Order-b.Order);
  if(!group||!lines.length)return false;if(group.PlaybackMode==='무작위 한 줄')lines=[lines[Math.min(lines.length-1,Math.floor(this.rng()*lines.length))]];
  const item={group,lines,priority,pause:pause??dialogueOn(group.PauseCombat),index:0,elapsed:0,gap:0,reveal:false};
  if(replace||priority>=90){this.active=null;this.queue=[];}if(this.active){this.queue.push(item);return true;}this.begin(item);return true;
 }
 begin(item){this.active=item;item.leadMs=this.host.onDialogueStart?.(item.group)||0;if(item.pause||item.leadMs)this.host.guardHeld=false;if(!item.leadMs)this.noteLine();}
 noteLine(){const l=this.line;if(!l)return;this.active.rich=parseDialogueText(l.Text,this.active.group.CPS);this.history.push(l.DialogueID);this.host.log?.(`대사 · ${l.Speaker}: ${this.active.rich.plain}`,'dialogue');}
 stop(){this.active=null;this.queue=[];}
 nextLine(){const a=this.active;if(!a)return;if(a.index+1>=a.lines.length){this.active=null;this.host.onDialogueComplete?.(a.group);if(this.queue.length)this.begin(this.queue.shift());return;}a.index++;a.elapsed=0;a.reveal=false;a.gap=a.group.GapMs;if(!a.gap)this.noteLine();}
 advance(){const a=this.active;if(!a||a.leadMs>0)return;if(a.gap){a.gap=0;this.noteLine();return;}if(!this.complete){a.reveal=true;a.revealedAt=a.elapsed;a.autoEnd=a.elapsed+a.group.HoldMs;return;}this.nextLine();}
 tick(ms){this.clock+=ms;const a=this.active;if(!a)return;if(a.leadMs>0){const spent=Math.min(ms,a.leadMs);a.leadMs-=spent;ms-=spent;if(a.leadMs>0)return;this.noteLine();if(!ms)return;}if(a.gap>0){a.gap=Math.max(0,a.gap-ms);if(!a.gap)this.noteLine();return;}a.elapsed+=ms;const end=a.reveal?a.autoEnd:a.rich.duration+a.group.HoldMs;if(a.group.AdvanceMode==='자동'&&a.elapsed>=end)this.nextLine();}
}
