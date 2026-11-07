import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
// Frozen pre-optimization renderer is only a test oracle, never shipped.
const baseline=await fs.readFile(new URL('../tests/fixtures/salon-render-baseline.txt',import.meta.url),'utf8');
export async function checkPortraitRendering(frame,label,{exercise=false}={}){
 const result=await frame.evaluate(({baseline,exercise})=>{
  const beforeRender=(0,eval)('('+baseline+')');
  const saved={phase:beautyPhase,zones:zonesVisible,expression,talking,mouthFrame,finishing,brushRadius,paintColor,paintOpacity,touched:{...touched},current:current.slice(),paint:paint.slice(),source:sourcePixels.slice(),history:[...history.draw]};
  const a=offscreen().getContext('2d'),b=offscreen().getContext('2d');
  let comparisons=0;
  const compare=(label,includeCape=true)=>{
   beforeRender(true,a,includeCape);renderPortrait(true,b,includeCape);
   const left=a.getImageData(0,0,W,H).data,right=b.getImageData(0,0,W,H).data;
   for(let n=0;n<left.length;n++)if(left[n]!==right[n])throw Error(label+' pixel mismatch at '+n+': '+left[n]+' / '+right[n]);
   comparisons++;
  };
  try{
   for(const phase of ['cut','draw','attach']){beautyPhase=phase;zonesVisible=true;compare(phase+' guides');}
   zonesVisible=false;
   for(const mood of ['neutral','angry','satisfied'])for(const open of [false,true]){expression=mood;talking=true;mouthFrame=open;compare(mood+' mouth '+open);}
   talking=false;finishing=true;compare('result');compare('head capture',false);finishing=false;
   renderPortrait(false);
   const cached={...beautyRenderStats};
   for(let n=0;n<10;n++)renderPortrait(false);
   if(beautyRenderStats.materialBuilds!==cached.materialBuilds||beautyRenderStats.facePaintBuilds!==cached.facePaintBuilds)throw Error('Unchanged portraits rebuilt pixel layers');
   // Measure the old and new renderers in alternating order on the same browser.
   const time=fn=>{const start=performance.now();for(let i=0;i<30;i++)fn(false,b);return (performance.now()-start)/30;};
   for(let i=0;i<5;i++){beforeRender(false,b);renderPortrait(false,b);}
   const old=[],optimized=[];
   for(let i=0;i<5;i++){if(i%2){optimized.push(time(renderPortrait));old.push(time(beforeRender));}else{old.push(time(beforeRender));optimized.push(time(renderPortrait));}}
   const median=x=>x.sort((a,b)=>a-b)[Math.floor(x.length/2)];
   if(exercise){
    beautyPhase='draw';brushRadius=2;paintColor='#FF3024';paintOpacity=.3;
    const n=Array.from(current.keys()).find(n=>canPaintAt(n)),point={x:(n%W+.5)*PIX,y:(Math.floor(n/W)+.5)*PIX};
    pushUndo();gesture={paint:paint.slice()};applyStroke([point],'paint');gesture=null;compare('paint');
    undoBeauty();compare('undo');
    gesture={paint:paint.slice()};applyStroke([point],'erase');gesture=null;compare('erase');
    beautyPhase='cut';
    gesture={snapshot:current.slice(),paint:paint.slice(),touched:{...touched},pointerId:1,undoAdded:false};
    applyStroke([point],hammer?'hammer':'scissors');compare('cut');
    cancelGesture();compare('cancel');
    gesture={paint:paint.slice(),growthAllowed:true};applyStroke([point],'grow');gesture=null;compare('grow');
   }
   return {comparisons,baselineMs:median(old),optimizedMs:median(optimized),unchangedRebuilds:0};
  }finally{
   gesture=null;current.set(saved.current);paint.set(saved.paint);sourcePixels.set(saved.source);history.draw=saved.history;touched=saved.touched;
   beautyPhase=saved.phase;zonesVisible=saved.zones;expression=saved.expression;talking=saved.talking;mouthFrame=saved.mouthFrame;finishing=saved.finishing;brushRadius=saved.brushRadius;paintColor=saved.paintColor;paintOpacity=saved.paintOpacity;
   beautyPixelRevision++;if(isDemon){demonGeometryDirty=true;demonScoreCache=null;demonPendingStroke=null;}
   updateBeautyScore();renderPortrait();
  }
 },{baseline,exercise});
 assert(result.comparisons>=10);assert.equal(result.unchangedRebuilds,0);
 console.log('PORTRAIT_PERFORMANCE',label,JSON.stringify(result));
 return result;
}
export async function checkIdlePlayer(frame){
 const count=await frame.evaluate(async()=>{
  let mutations=0;const observer=new MutationObserver(items=>mutations+=items.length);
  render(false);observer.observe(player,{attributes:true,attributeFilter:['style']});
  for(let i=0;i<120;i++)render(false);
  await Promise.resolve();observer.disconnect();return mutations;
 });
 assert.equal(count,0,'stationary player should not rewrite style attributes');
}
