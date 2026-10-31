// Adapted from the user-provided YACHACHA_AP_Battle.html, SHA256 e89a4cca8c3fcd852e13c4320f705d235b4458db315481cf132e215057bcc84e.
// Rules: 야차차 야차 시스템 기획서 v1.0, 2026-10-12. Workbook values are not rewritten.
import {Battle,rows,tileList,rule} from './engine.js';
const MONSTER_GIMMICKS={10001:{kind:'gravestoneRush',afterPatterns:4,aimMs:1800,lockMs:750,travelMs:240,recoveryMs:700,hitDamage:20}};

export class EnemyFootwork {
 constructor(rng=Math.random){this.rng=rng;this.reset();}
 reset(){this.slot=4;this.from=this.to={x:962,y:534};this.started=0;this.duration=0;this.steps=0;}
 position(now){const t=this.duration?Math.max(0,Math.min(1,(now-this.started)/this.duration)):1,e=t*t*(3-2*t);return {x:this.from.x+(this.to.x-this.from.x)*e,y:this.from.y+(this.to.y-this.from.y)*e};}
 next(now){
  const choices=[0,1,2,3,4,5,6,7,8].filter(slot=>slot!==this.slot);
  this.from=this.position(now);this.slot=choices[Math.min(7,Math.floor(this.rng()*8))];
  const row=Math.floor(this.slot/3),col=this.slot%3;
  this.to={x:825+125*col,y:474+42*row};this.started=now;this.duration=320;this.steps++;
 }
 freeze(now){this.from=this.to=this.position(now);this.duration=0;}
}
export function monsterHitbox(character,{x,y}){
 const w=character==='drunk'?256:character==='sans'?222:208,h=character==='sans'?252:character==='drunk'?266:304;
 return {x:x-w/2,y:y-h,w,h:h+12};
}
export function openingHitbox(box){return {x:box.x-box.w*.3,y:box.y-box.h*.1,w:box.w*1.6,h:box.h*1.2};}
const RAID_HP_BARS=200;
export function raidHealth(hp,maxHP,totalBars=RAID_HP_BARS){
 const safe=Math.max(0,Math.min(maxHP,hp)),raw=maxHP>0?safe/maxHP*totalBars:0;
 const nearest=Math.round(raw),units=Math.abs(raw-nearest)<1e-8?nearest:raw;
 const lines=Math.ceil(units);
 return {lines,fill:lines?units-(lines-1):0,units};
}
export class RaidHealthAnimator {
 update(hp,maxHP,key,now){
  if(this.key!==key||this.maxHP!==maxHP||hp>this.target){this.key=key;this.maxHP=maxHP;this.target=hp;this.from=hp;this.shown=hp;this.start=now;this.duration=0;}
  const progress=this.duration?Math.min(1,Math.max(0,(now-this.start)/this.duration)):1;
  this.shown=this.from+(this.target-this.from)*progress;
  if(hp<this.target){this.from=this.shown;this.target=hp;this.start=now;this.duration=Math.min(320,180+(this.from-hp)/maxHP*RAID_HP_BARS*25);}
  return raidHealth(this.shown,maxHP);
 }
}
export class CursorBattle extends Battle {
 constructor(data,rng=Math.random,settings={}) {
  super(data,rng);

  // Remove simultaneous full-board shapes before selection; sequential paths still work.
  const simultaneousPools=new Set(rows(this.data,'공격 만들기').filter(p=>p.RangeMode==='범위 반복').map(p=>String(p.ShapePoolID)));
  for(const shape of rows(this.data,'범위 풀')){
   if(simultaneousPools.has(String(shape.ShapePoolID))&&new Set(tileList(shape.Tiles)).size===9)shape.Enabled='끄기';
  }
  this.settings={basicDamage:5,scratchDamage:10,groggyMs:3330,basicCooldown:600,breakRevealMs:650,staggerMax:100,staggerPerHit:5,...settings};
  // Explicit local-preview overrides, kept separate from workbook data.
  for(const phase of rows(this.data,'몬스터 페이즈')){
   const hp=settings.phaseHP?.[`${phase.MonsterID}:${phase.PhaseID}`];
   if(Number.isFinite(hp)&&hp>0)phase.MaxHP=hp;
  }
  // Independent randomness keeps positioning from changing authored pattern rolls.
  this.footwork=new EnemyFootwork(settings.motionRng??Math.random);
  this.attackCooldownLeft=0;this.cycle=null;this.cycleSerial=0;this.ledger=[];this.dodgedPatterns=0;this.basicHits=0;this.lastBasic=-Infinity;this.stagger=0;
 }
 enter(phase){this.heartDropped=false;super.enter(phase);this.footwork.reset();this.attackCooldownLeft=0;this.cycle=null;this.lastBasic=-Infinity;this.basicPending=false;this.stagger=0;this.staggerRestore=null;this.rush=null;this.patternsSinceRush=0;this.rushSuccesses??=0;}
 setGuard(){this.guardHeld=false;}
 damage(amount){
  // Only explicitly configured rehearsals have a floor; regular battles still reach zero.
  const floor=Math.max(0,Math.min(this.player.MaxHP,Number(this.settings.minimumPlayerHP)||0));
  super.damage(Math.min(Math.max(0,amount),Math.max(0,this.hp-floor)));
 }
 addGauge(){} // Dodging alone no longer deals stagger damage.
 get staggerRemaining(){return Math.max(0,this.settings.staggerMax-this.stagger);}
 get usesHeartBoards(){return Number(this.id)===10003;}
 get heartsRemaining(){return this.usesHeartBoards?Math.max(0,4-Number(this.monster.PhaseID)-(this.heartDropped?1:0)):null;}
 get attackReady(){return this.attackCooldownLeft===0;}
 get attackProgress(){return 1-Math.min(1,this.attackCooldownLeft/this.settings.basicCooldown);}
 addStagger(amount,source='punch'){
  if(!(amount>0)||!this.canPunch())return false;
  const before=this.stagger;this.stagger=Math.min(this.settings.staggerMax,this.stagger+amount);
  this.cue('staggerDamage',{value:this.stagger-before,source});
  if(this.stagger>=this.settings.staggerMax)return this.beginStagger(source,before);
  return false;
 }
 plan(){
  const mechanic=MONSTER_GIMMICKS[this.id];
  if(mechanic&&this.options.gimmicks!==false&&!this.options.patternID&&(this.options.gimmickOnly||this.patternsSinceRush>=mechanic.afterPatterns)&&this.beginRush())return;
  this.footwork.next(this.time);
  this.cycle={id:++this.cycleSerial,resolved:0,damaged:false};super.plan();
  if(this.cycle&&this.planInfo&&!this.planInfo.cancel){this.cycle.total=this.planInfo.groups.length;this.cycle.name=this.pattern.Name;
    // Recovery begins only after the attack sprite has finished returning to idle.
    this.planInfo.motionEnd=Math.max(this.planInfo.motionEnd,this.planInfo.lastHit+220/this.planInfo.speed);}
 }
 hit(q){
  const cycle=this.cycle,previousHits=this.stats.hit;this.guardHeld=false;super.hit(q);
  if(cycle){cycle.resolved++;cycle.damaged ||= this.stats.hit>previousHits;}
 }
 recover(){
  const cycle=this.cycle,plan=this.planInfo;
  const completed=!!(cycle&&plan&&!plan.cancel&&this.state==='attack'&&cycle.resolved===plan.groups.length&&!this.queue.length);
  super.recover();this.cycle=null;
  if(completed){
   this.patternsSinceRush++;
   const earned=!cycle.damaged&&this.pattern.HitDamage>0;
   this.ledger.unshift({id:cycle.id,name:this.pattern.Name,hits:cycle.resolved,earned,time:this.time});this.ledger.length=Math.min(30,this.ledger.length);
   if(earned){this.dodgedPatterns++;this.log('패턴 전체 회피 성공');}
   else this.log('패턴 종료'+(cycle.damaged?' (피격 포함)':' (무피해 패턴)'));
  }
  if(this.basicPending)this.resolveBasicKill();
 }
 beginStagger(source='punch',staggerBeforeBreak=0){
  if(this.stagger<this.settings.staggerMax||!this.canPunch())return false;
  this.staggerRestore=source==='gravestone'?staggerBeforeBreak:null;
  this.queue=[];this.planInfo=null;this.preview=null;this.cycle=null;this.flash=[];this.guardHeld=false;this.basicPending=false;this.rush=null;this.patternsSinceRush=0;
  this.state='staggerBreak';this.staggerRevealLeft=this.settings.breakRevealMs;this.staggerBreakEnd=this.visualTime+this.settings.breakRevealMs;
  this.footwork.freeze(this.time);this.cue('staggerBurst',{source});this.log('그로기! · 연출 후 빈틈공격 시작');return true;
 }
 open(){
  if(this.stagger<this.settings.staggerMax||this.state!=='staggerBreak')return false;
  if(!super.open())return false;
  this.groggyEnd=this.time+this.settings.groggyMs;this.cycle=null;return true;
 }
 rule(key){if(key==='GroggyDrainPerSec'&&this.settings)return this.monster.GaugeMax/(this.settings.groggyMs/1000);return super.rule(key);}
 attack(){return false;}
 canPunch(){return !this.paused&&!this.dialogueBlocking&&(this.state==='recover'||this.state==='gimmick'&&this.rush?.success)&&this.enemyHP>0;}
 cueBarDamage(before){
  const max=this.monster.MaxHP,previous=raidHealth(before,max),now=raidHealth(this.enemyHP,max),lost=previous.lines-now.lines;
  if(lost>0)this.cue('hpBars',{lost,remaining:now.lines});
 }
 basicAttack(inside){
  if(!inside||!this.canPunch()||!this.attackReady)return false;
  this.lastBasic=this.time;this.attackCooldownLeft=this.settings.basicCooldown;
  // Sans evades punches, but the latest build allows damage on every opening.
  const immune=Number(this.id)===10003,floor=this.monster.TransitionTrigger==='빈틈공격 성공'||this.settings.requireOpeningFinish?1:0,before=this.enemyHP;
  const actual=immune?0:Math.min(this.settings.basicDamage,Math.max(0,this.enemyHP-floor));
  this.enemyHP-=actual;this.stats.damage+=actual;this.basicHits++;
  this.cue('basicHit',{value:actual,hit:this.basicHits,immune});this.cue('damage');this.cueBarDamage(before);
  this.log(`주먹 공격 · ${actual} 피해`);
  // Killing blows resolve the phase instead of staggering an already defeated enemy.
  if(this.enemyHP===0){this.basicPending=true;if(this.state!=='attack')this.resolveBasicKill();}
  else this.addStagger(this.settings.staggerPerHit);
  return true;
 }
 resolveBasicKill(){
  this.basicPending=false;this.pending=true;this.state='openingResult';this.queue=[];this.planInfo=null;this.cycle=null;this.rush=null;this.dialogues?.checkHP();this.finishOpeningResult();
 }
 scratchAttack(inside){
  if(!inside||this.state!=='opening'||this.paused||this.dialogueBlocking)return false;
  if(this.usesHeartBoards){
   // One phase is one cardboard heart. Further strokes in this window cannot
   // carry into the next heart; the normal result/dialogue boundary still runs.
   if(this.openingResult.hits>0)return false;
   const damage=this.enemyHP;this.enemyHP=0;this.pending=true;
   this.openingResult.attempts++;this.openingResult.hits++;this.openingResult.damage+=damage;this.stats.damage+=damage;
   this.cue('openingHit',{value:'♥',actualDamage:damage,hit:1});
   this.cue('heartHit',{index:[2,0,1][Number(this.monster.PhaseID)-1]});
   this.log('하트 적중 · 빈틈 종료 때 판이 떨어집니다');
   return true;
  }
  const old=this.player.DodgeDamage,before=this.enemyHP;this.player.DodgeDamage=this.settings.scratchDamage;
  const accepted=super.attack();this.player.DodgeDamage=old;this.cueBarDamage(before);return accepted;
 }
 endOpening(){
  if(this.state!=='opening'||this.dialogueBlocking||this.paused)return false;
  if(this.usesHeartBoards&&this.openingResult.hits>0&&!this.heartDropped){
   this.heartDropped=true;
   this.cue('heartDrop',{index:[2,0,1][Number(this.monster.PhaseID)-1],remaining:this.heartsRemaining});
   this.log(`하트 판이 떨어졌다 · 남은 하트 ${this.heartsRemaining}`);
  }
  return super.endOpening();
 }
 recoverFromOpening(){super.recoverFromOpening();if(this.enemyHP>0)this.heartDropped=false;this.stagger=this.staggerRestore??0;this.staggerRestore=null;this.rush=null;this.patternsSinceRush=0;}
 finishOpeningResult(){
  const restore=this.staggerRestore,phase=this.monster?.PhaseID,finished=super.finishOpeningResult();
  // A gimmick opening also keeps punch progress if its damage triggers resurrection.
  if(finished&&this.monster?.PhaseID!==phase&&restore!=null)this.stagger=restore;
  if(finished&&this.state==='victory')this.staggerRestore=null;
  return finished;
 }
 move(dx,dy){
  if(this.state==='staggerBreak')return false;
  const x=(this.pos-1)%3+dx,y=Math.floor((this.pos-1)/3)+dy;
  if(this.rush&&!this.rush.resolved&&x>=0&&x<3&&y>=0&&y<3&&y*3+x+1===this.rush.stone)return false;
  return super.move(dx,dy);
 }
 beginRush(){
  const spec=MONSTER_GIMMICKS[this.id];if(!spec||!this.canPunch())return false;
  const candidates=[2,5,8].filter(tile=>tile!==this.pos&&![tile,tile-1].some(t=>this.broken[t]>this.time));
  if(!candidates.length)return false;
  const stone=this.options.gimmickOnly&&candidates.includes(5)?5:candidates[Math.min(candidates.length-1,Math.floor(this.rng()*candidates.length))];
  this.footwork.next(this.time);
  this.rush={...spec,stone,started:this.time,lockAt:this.time+spec.aimMs,chargeAt:this.time+spec.aimMs+spec.lockMs,impactAt:this.time+spec.aimMs+spec.lockMs+spec.travelMs,endAt:this.time+spec.aimMs+spec.lockMs+spec.travelMs+spec.recoveryMs,stage:'aim',target:this.pos,resolved:false,success:false};
  this.queue=[];this.planInfo=null;this.preview=null;this.cycle=null;this.flash=[];this.pattern=null;this.state='gimmick';this.patternsSinceRush=0;
  this.cue('stoneRise',{tile:stone});this.log(`비석 출현 · ${stone-1}번 타일로 돌진 유도`);return true;
 }
 tickRush(){
  const r=this.rush;if(!r||this.state!=='gimmick')return;
  if(r.stage==='aim'){
   r.target=this.pos;
   if(this.time>=r.lockAt){r.stage='locked';r.target=this.pos;r.row=Math.floor((r.target-1)/3);r.blocked=r.target===r.stone-1;this.cue('rushLock',{tile:r.target});}
  }
  if(r.stage==='locked'&&this.time>=r.chargeAt){r.stage='charge';this.cue('motion',{gimmick:true});}
  if(!r.resolved&&this.time>=r.impactAt){
   r.resolved=true;r.stage='impact';r.success=r.blocked;
   if(r.success){
    const remaining=this.staggerRemaining;
    this.rushSuccesses++;this.cue('stoneCrash',{tile:r.stone,value:remaining});this.log('비석 충돌 성공! 무력화 완전 붕괴');this.addStagger(remaining,'gravestone');
   }else{
    // Rush travels right-to-left to the locked target; moving to another row evades it.
    const column=(r.target-1)%3,tiles=[1,2,3].map(c=>r.row*3+c).filter(t=>(t-1)%3>=column);
    this.cue('strike',{tiles,index:1});this.flash=tiles;this.flashUntil=this.time+130;
    if(tiles.includes(this.pos))this.damage(r.hitDamage);else{this.stats.dodge++;this.log('돌진 회피 · 비석 충돌 실패');}
    if(this.state==='defeat')this.rush=null;
   }
  }
  if(this.state==='gimmick'&&this.time>=r.endAt){this.rush=null;this.state='recover';this.next=this.time+(this.options.gimmickOnly?1600:this.monster.RecoveryMs/this.monster.AttackSpeed);}
 }
 tick(ms){
  if(this.paused)return;
  let left=ms;
  while(left>0&&!this.paused){const dt=Math.min(10,left);left-=dt;
   if(this.state==='staggerBreak'){
    // Reveal time does not consume pattern, cooldown, or the actual drag window.
    const blocked=this.dialogueBlocking;this.visualTime+=dt;this.dialogues?.tick(dt);
    if(!blocked&&!this.dialogueBlocking){this.staggerRevealLeft=Math.max(0,this.staggerRevealLeft-dt);if(!this.staggerRevealLeft)this.open();}
   }else{
    const before=this.time,phase=this.monster?.PhaseID,charging=!this.dialogueBlocking&&['attack','recover','opening','gimmick'].includes(this.state);
    super.tick(dt);
    if(this.time>before&&!this.dialogueBlocking)this.tickRush();
    if(charging&&this.monster?.PhaseID===phase&&['attack','recover','opening','gimmick'].includes(this.state)){
     this.attackCooldownLeft=Math.max(0,this.attackCooldownLeft-(this.time-before));if(this.attackCooldownLeft<1e-7)this.attackCooldownLeft=0;
    }
   }
  }
 }
}

export function insideBox(p,box){return !!p&&p.x>=box.x&&p.x<=box.x+box.w&&p.y>=box.y&&p.y<=box.y+box.h;}
export class ScratchTracker {
 constructor(){this.reset();}
 reset(){this.previous=null;this.distance=0;this.direction=0;this.strokeUsed=false;this.lastHit=-Infinity;}
 begin(point){this.reset();this.previous=point;}
 move(point,box,time,strokeWidth=box.w){
  const previous=this.previous;this.previous=point;
  if(!previous||!insideBox(point,box)||!insideBox(previous,box)){this.distance=0;this.direction=0;this.strokeUsed=false;return false;}
  const dx=point.x-previous.x,dy=point.y-previous.y;
  if(Math.abs(dx)<1)return false;
  if(Math.abs(dx)<Math.abs(dy)*1.2){this.distance=0;return false;}
  const direction=Math.sign(dx);
  if(direction!==this.direction){this.direction=direction;this.distance=0;this.strokeUsed=false;}
  this.distance+=Math.abs(dx);
  // One hit per horizontal stroke; reversing direction enables the next stroke.
  if(!this.strokeUsed&&this.distance>=Math.max(20,strokeWidth*.22)&&time-this.lastHit>=85){this.strokeUsed=true;this.lastHit=time;return true;}
  return false;
 }
}

