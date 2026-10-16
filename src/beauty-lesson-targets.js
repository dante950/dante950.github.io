import {beautyInside} from './beauty-rules.js';

// Pick real editable pixels rather than hard-coding a point in empty artwork.
export function beautyLessonPoint({material,face=[],protectedMask=[],anchors=[],width=160,height=175,regions=[],mode='cut',near={x:130,y:70}}){
 let best=null,bestScore=Infinity;
 for(let n=0;n<width*height;n++){
  if(mode==='cut'?!material[n]||protectedMask[n]||anchors[n]:!material[n]&&!face[n])continue;
  const p={x:(n%width+.5)*2,y:(Math.floor(n/width)+.5)*2};
  const preferred=regions.some(r=>beautyInside(p.x,p.y,r));
  const score=(p.x-near.x)**2+(p.y-near.y)**2+(regions.length&&!preferred?100000:0);
  if(score<bestScore){best=p;bestScore=score;}
 }
 return best;
}
export function beautyLessonRemoved(before,after,width=160){
 const removed=[];
 for(let n=0;n<before.length;n++)if(before[n]&&!after[n])removed.push({x:(n%width+.5)*2,y:(Math.floor(n/width)+.5)*2});
 return removed;
}
