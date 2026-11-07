import {CursorBattle} from './cursor-engine.js';
import {clone,rows} from './engine.js';
// Simulator-only tuning. No Unity sheet/enum contract or source workbook is changed.
export const DEMON_BATTLE_TUNING=Object.freeze({maxHP:1000,basicDamage:14,scratchDamage:16,basicCooldown:600,staggerPerHit:14,phase3StaggerPerHit:1,recoveryMs:1450,telegraphMs:1350,trackingMs:950,iaidoFlashMs:300,mirrorLeadMs:1900,mirrorStepMs:120,hitDamage:16,returnMs:430,transitionMs:1100});
export const DEMON_TILES=Object.freeze(Array.from({length:25},(_,i)=>i+1));
export const DEMON_CENTER=Object.freeze([7,8,9,12,13,14,17,18,19]);
export const DEMON_CROSS=Object.freeze([8,12,13,14,18]);
const xy=t=>({x:(t-1)%5,y:Math.floor((t-1)/5)}),tile=(x,y)=>y*5+x+1;
export function demonPhaseAt(percent){return percent>70?1:percent>=35?2:3;}
export function demonActiveTiles(percent){return percent<10?[...DEMON_CROSS]:percent<=20?[...DEMON_CENTER]:[...DEMON_TILES];}
export function demonTrackingTiles(pos,hit,percent){const p=xy(pos),active=demonActiveTiles(percent);return active.filter(t=>{const a=xy(t),dx=Math.abs(a.x-p.x),dy=Math.abs(a.y-p.y);return percent<10?t===pos:percent<=20?(hit===1?a.x===p.x:a.y===p.y):(hit===1?dx+dy<=1:dx===dy&&dx<=1);});}
export function demonCombatData(source,tuning={}){const d=clone(source),cfg={...DEMON_BATTLE_TUNING,...tuning};
 // The existing 3x3 editor continues using its original schema. These runtime
 // phase rows select the main-game controller; 5x5 plans live in this module.
 const ms=rows(d,'몬스터 페이즈'),links=rows(d,'몬스터 사용 패턴'),pattern=rows(d,'공격 만들기').find(p=>p.RangeMode==='경로 순차')||rows(d,'공격 만들기')[0];
 for(const s of d.sheets)if(['몬스터 페이즈','몬스터 사용 패턴','전투 대사 연결'].includes(s.name))s.rows=s.rows.filter(r=>Number(r.MonsterID)!==10007);
 for(let phase=1;phase<=3;phase++){rows(d,'몬스터 페이즈').push({...ms[0],MonsterID:10007,Name:'마왕 · '+phase+'페이즈',PhaseID:phase,IsInitial:phase===1,MaxHP:cfg.maxHP,GaugeMax:100,ParryGain:0,GuardGain:0,DodgeGain:0,RecoveryMs:cfg.recoveryMs,AttackSpeed:1,PlayerDodgeMissCount:0,OpeningDamageDisplay:null,TransitionTrigger:'없음',NextPhaseID:null,EntryDialogueGroupID:null,PauseForEntryDialogue:false});rows(d,'몬스터 사용 패턴').push({MonsterID:10007,PhaseID:phase,PatternID:pattern.PatternID,Enabled:true,Weight:1,HitDamage:cfg.hitDamage});}
 return d;
}
export class DemonCursorBattle extends CursorBattle {
 constructor(data,rng=Math.random,settings={}){const tuning={...DEMON_BATTLE_TUNING,...settings.demon};super(demonCombatData(data,tuning),rng,{...settings,...tuning,requireOpeningFinish:false});this.tuning=tuning;this.isDemon=true;this.boardSize=5;this.shadowMode=false;this.demonCycle=0;this.attackReturnUntil=0;this.activeTiles=[...DEMON_TILES];}
 start(id=10007,phase=1,options={}){super.start(10007,1,{...options,patternID:undefined});this.pos=13;this.enemyHP=this.tuning.maxHP;this.next=this.time+1700;}
 get percent(){return this.enemyHP/this.tuning.maxHP*100;}
 get phase(){return Number(this.monster?.PhaseID||1);}
 move(dx,dy){if(this.paused||this.dialogueBlocking||!['attack','recover','opening'].includes(this.state))return false;const p=xy(this.pos),x=p.x+dx,y=p.y+dy,t=tile(x,y);if(x<0||x>4||y<0||y>4||!this.activeTiles.includes(t))return false;this.pos=t;this.cue('move',{tile:t});return true;}
 damageFloor(){if(this.phase===1)return this.tuning.maxHP*.7;if(this.phase===2)return this.shadowMode?Math.max(0,this.tuning.maxHP*.35-1):this.tuning.maxHP*.5;return 0;}
 basicAttack(inside){const damage=this.settings.basicDamage,stagger=this.settings.staggerPerHit;this.settings.basicDamage=Math.min(damage,Math.max(0,this.enemyHP-this.damageFloor()));this.settings.staggerPerHit=this.phase===3?this.tuning.phase3StaggerPerHit:stagger;const accepted=super.basicAttack(inside);this.settings.basicDamage=damage;this.settings.staggerPerHit=stagger;if(accepted){this.attackReturnUntil=this.time+this.tuning.returnMs;this.next=Math.max(this.next,this.attackReturnUntil);}return accepted;}
 scratchAttack(inside){const d=this.settings.scratchDamage;this.settings.scratchDamage=Math.min(d,Math.max(0,this.enemyHP-this.damageFloor()));const ok=super.scratchAttack(inside);this.settings.scratchDamage=d;return ok;}
 finishOpeningResult(){if(this.enemyHP>0){this.pending=false;this.recoverFromOpening();return true;}return super.finishOpeningResult();}
 recoverFromOpening(){super.recoverFromOpening();this.next=Math.max(this.next,this.time+600);}
 checkStage(){if(this.enemyHP<=0||this.state!=='recover'||this.time<this.attackReturnUntil)return false;
 const nextPhase=demonPhaseAt(this.percent),shadow=nextPhase===2&&this.percent<=50,nextTiles=nextPhase===3?demonActiveTiles(this.percent):[...DEMON_TILES];
 if(nextPhase===this.phase&&shadow===this.shadowMode&&nextTiles.length===this.activeTiles.length)return false;
 const changed=nextPhase!==this.phase,hp=this.enemyHP,from=this.phase;if(changed){super.enter(nextPhase);this.enemyHP=hp;this.demonCycle=0;}
 this.shadowMode=shadow;this.activeTiles=nextTiles;this.broken=Object.fromEntries(DEMON_TILES.filter(t=>!nextTiles.includes(t)).map(t=>[t,Infinity]));
 if(!nextTiles.includes(this.pos)){const p=xy(this.pos);this.pos=[...nextTiles].sort((a,b)=>{const x=xy(a),y=xy(b);return Math.abs(x.x-p.x)+Math.abs(x.y-p.y)-Math.abs(y.x-p.x)-Math.abs(y.y-p.y);})[0];}
 this.queue=[];this.preview=null;this.planInfo=null;this.mirrors=null;this.cycle=null;this.state='demonTransition';this.transition={started:this.visualTime,end:this.visualTime+this.tuning.transitionMs,from,to:nextPhase,label:changed?(nextPhase===2?'거울의 군주':'환영이 걷히다'):shadow?'그림자 속의 거울':nextTiles.length===9?'무너지는 전장':'마지막 다섯 칸'};this.cue('phase');if(nextTiles.length<25)this.cue('break',{tiles:DEMON_TILES.filter(t=>!nextTiles.includes(t))});return true;
 }
 plan(){if(this.checkStage())return;if(this.time<this.attackReturnUntil){this.next=this.attackReturnUntil;return;}
 const kind=this.phase===1?(this.demonCycle%2?'fissure':'slash'):this.phase===2?(this.demonCycle%4===3?'reflect':'beam'):(this.demonCycle%4===3?'iaido':'double');this.demonCycle++;this.beginDemonPattern(kind);
 }
 beginDemonPattern(kind){const t=this.time,lead=this.tuning.telegraphMs;this.pattern={PatternID:910000+this.phase,Name:{slash:'검기 발사',fissure:'지면 폭파',beam:'거울 레이저',reflect:'반사 레이저',double:'추적 2연격',iaido:'발도술'}[kind],RangeMode:'마왕',HitDamage:this.tuning.hitDamage,CanDefend:false,BreakTiles:false};
 this.state='attack';this.preview=null;this.mirrors=null;this.cycle={id:++this.cycleSerial,resolved:0,damaged:false};this.queue=[];
 const q=(tiles,previewAt,due,extra={})=>({tiles,index:this.queue.length+1,count:1,previewAt,due,announced:false,...extra});
 if(kind==='slash'){const safe=Math.floor(this.rng()*5);this.queue.push(q(DEMON_TILES.filter(t=>xy(t).y!==safe),t,t+lead));}
 if(kind==='fissure'){const cross=this.rng()<.5,first=DEMON_TILES.filter(t=>{const p=xy(t);return cross?p.x===2||p.y===2:p.x===p.y||p.x+p.y===4;});this.queue.push(q(first,t,t+lead));this.queue.push(q(DEMON_TILES.filter(t=>!first.includes(t)),t+lead+300,t+lead+1400));}
 if(kind==='beam'){const r=Math.floor(this.rng()*5),r2=(r+2+Math.floor(this.rng()*2))%5;this.queue.push(q(DEMON_TILES.filter(t=>[r,r2].includes(xy(t).y)),t,t+lead));}
 if(kind==='double'){this.queue.push(q([],t,t+this.tuning.trackingMs,{tracking:1}));this.queue.push(q([],t+this.tuning.trackingMs+380,t+this.tuning.trackingMs*2+380,{tracking:2}));}
 if(kind==='iaido')this.queue.push(q([],t,t+1200+this.tuning.iaidoFlashMs,{iaido:true,lockAt:t+1200,locked:false}));
 if(kind==='reflect'){
 const rr=[0,1,2,3,4];for(let i=4;i>0;i--){const j=Math.floor(this.rng()*(i+1));[rr[i],rr[j]]=[rr[j],rr[i]];}const c=Math.floor(this.rng()*2),four=this.rng()<.5,points=[tile(4,rr[0]),tile(2,rr[0]),tile(2,rr[1]),tile(c,rr[1])];if(four)points.push(tile(c,rr[2]));const last=xy(points.at(-1)),prev=xy(points.at(-2)),end=last.x===prev.x?tile(4,last.y):tile(last.x,last.y<2?4:0);points.push(end);
 this.mirrors=points.slice(1,-1).map((tile,i)=>({tile,last:i===points.length-3,turned:false,orientation:xy(points[i]).x===xy(tile).x?'vertical':'horizontal'}));this.rayPoints=points;this.rayStart=t+this.tuning.mirrorLeadMs+this.mirrors.length*220;
 for(let i=1;i<points.length;i++){const a=xy(points[i-1]),b=xy(points[i]),tiles=DEMON_TILES.filter(t=>{const p=xy(t);return a.x===b.x?p.x===a.x&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y):p.y===a.y&&p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x);});this.queue.push(q(tiles,t+(i-1)*220,this.rayStart+(i-1)*this.tuning.mirrorStepMs,{segment:i,intercept:i===this.mirrors.length}));}
 }
 for(const e of this.queue)e.count=this.queue.length;
 this.planInfo={kind,groups:this.queue.map(q=>q.tiles),queue:this.queue,started:t,motionStart:t,firstHit:this.queue[0].due,lastHit:this.queue.at(-1).due,motionEnd:this.queue.at(-1).due+400,speed:1,extra:{},snapshot:this.pos,motionStarted:true};this.cycle.total=this.queue.length;this.cycle.name=this.pattern.Name;this.advanceEvents();
 }
 rotateMirror(tile){const last=this.mirrors?.at(-1);if(this.paused||this.dialogueBlocking||this.state!=='attack'||!last||last.tile!==tile||last.turned||!this.attackReady||this.time>=this.rayStart+(this.mirrors.length-1)*this.tuning.mirrorStepMs)return false;last.turned=true;this.attackCooldownLeft=this.settings.basicCooldown;this.cue('mirrorTurn',{tile});return true;}
 advanceEvents(){const plan=this.planInfo;if(this.state!=='attack'||!plan)return;
 for(const q of this.queue){if(q.previewAt<=this.time&&!q.announced){if(q.tracking){q.snapshot=this.pos;q.tiles=demonTrackingTiles(this.pos,q.tracking,this.percent);plan.groups[q.index-1]=q.tiles;}q.announced=true;this.preview=q;this.cue('telegraph',{tiles:q.tiles,index:q.index,count:q.count});}
 if(q.iaido&&q.announced&&!q.locked){q.tiles=this.activeTiles.filter(t=>xy(t).y===xy(this.pos).y);if(this.time>=q.lockAt){q.locked=true;q.snapshot=this.pos;this.cue('eyeFlash',{tile:this.pos});}}}
 while(this.state==='attack'&&this.queue[0]?.due<=this.time){const q=this.queue.shift();this.lastStrike={time:this.time,index:q.index,kind:plan.kind,tiles:q.tiles,target:q.snapshot??this.pos};if(q.intercept&&this.mirrors?.at(-1)?.turned){this.cue('mirrorReturn',{tile:this.mirrors.at(-1).tile});this.state='recover';this.stagger=this.settings.staggerMax;this.beginStagger('mirror');return;}this.hit(q);}
 if(this.state==='attack'&&!this.queue.length&&this.time>=plan.motionEnd){this.preview=null;this.recover();}
 }
 tick(ms){if(this.paused)return;let left=ms;while(left>0&&!this.paused){const dt=Math.min(10,left);left-=dt;if(this.state==='demonTransition'){this.visualTime+=dt;if(this.visualTime>=this.transition.end){this.state='recover';this.next=this.time+600;this.transition=null;}continue;}if(this.checkStage())continue;super.tick(dt);}}
}
