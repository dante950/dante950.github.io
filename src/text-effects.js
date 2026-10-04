// Dialogue is data: only these tags affect presentation. No HTML is interpreted.
const textTags=new Set(['color','shake','wave','wait','cps','speed','size','pulse','fade','rainbow']);
const textClamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const textNumber=(v,f,a,b)=>Number.isFinite(Number(v))&&v!==''?textClamp(Number(v),a,b):f;
const textColors={white:'#FFFFFF',black:'#000000',red:'#FF7777',blue:'#8BE9FD',yellow:'#FFD166',green:'#B7F4D0',orange:'#FFA568',pink:'#FF9BD4',purple:'#C8AAFF',cyan:'#8BE9FD'};
export function parseDialogueText(input,baseCPS=30){
 const source=String(input??''),glyphs=[],warnings=[],stack=[];let time=0,state={cps:baseCPS,color:'#F0EEE3',size:17};
 const literal=value=>{for(const char of Array.from(value)){time+=state.cps>0?1000/state.cps:0;glyphs.push({char,at:time,style:{...state}});}};
 for(const token of source.split(/(<[^>]*>)/g)){
  if(!token.startsWith('<')){literal(token);continue;}
  const match=token.match(/^<\s*(\/?)\s*([a-z]+)(?:\s*=\s*([^\s>]+))?([^>]*)>$/i);
  if(!match||!textTags.has(match[2].toLowerCase())){literal(token);warnings.push('지원하지 않는 태그: '+token);continue;}
  const close=!!match[1],tag=match[2].toLowerCase(),value=(match[3]??'').replace(/^['"]|['"]$/g,'');
  if(close){if(stack.at(-1)?.tag===tag){state=stack.pop().state;}else{literal(token);warnings.push('닫는 태그 순서 확인: '+token);}continue;}
  const attrs={};for(const m of match[4].matchAll(/([a-z]+)\s*=\s*([\w.#-]+)/gi))attrs[m[1].toLowerCase()]=m[2];
  if(tag==='wait'){time+=textNumber(value,0,0,60)*1000;continue;}
  stack.push({tag,state});state={...state};
  if(tag==='color')state.color=/^#[0-9a-f]{6}$/i.test(value)?value:textColors[value.toLowerCase()]||state.color;
  if(tag==='cps')state.cps=textNumber(value,baseCPS,0,240);
  if(tag==='speed')state.cps=baseCPS*textNumber(value,1,0.05,10);
  if(tag==='size')state.size=textNumber(value,17,10,40);
  if(['shake','wave','pulse','rainbow'].includes(tag))state[tag]={amount:textNumber(value,{shake:2,wave:3,pulse:1.1,rainbow:.6}[tag],tag==='pulse'?1:0,tag==='pulse'?2:tag==='rainbow'?1:12),speed:textNumber(attrs.speed??attrs.freq,tag==='shake'?16:5,.1,60),duration:textNumber(attrs.dur,0,0,60)*1000,delay:textNumber(attrs.delay,0,0,60)*1000};
  if(tag==='fade')state.fade=textNumber(value,.3,0,10)*1000;
 }
 if(stack.length)warnings.push('닫히지 않은 태그: '+stack.map(x=>x.tag).join(', '));
 return {glyphs,plain:glyphs.map(g=>g.char).join(''),duration:time,warnings};
}
export function dialogueGlyphStyle(g,index,clock){
 const s=g.style,age=Math.max(0,clock-g.at),active=f=>f&&age>=f.delay&&(!f.duration||age<f.delay+f.duration);let x=0,y=0,scale=1,color=s.color;
 if(active(s.shake)){const f=s.shake,t=age/1000*f.speed;x=Math.sin(t*5.3+index*11)*f.amount;y+=Math.sin(t*4.7+index*7)*f.amount;}
 if(active(s.wave))y+=Math.sin(age/1000*s.wave.speed-index*.65)*s.wave.amount;
 if(active(s.pulse))scale=1+(s.pulse.amount-1)*(Math.sin(age/1000*s.pulse.speed-index*.25)+1)/2;
 if(active(s.rainbow))color=`hsl(${(clock/1000*s.rainbow.speed*35+index*14)%360} ${Math.round(s.rainbow.amount*100)}% 74%)`;
 return {color,fontSize:s.size,x,y,scale,opacity:s.fade?Math.min(1,age/s.fade):1};
}
