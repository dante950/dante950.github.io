// Coffee-specific material rendering and visible-eye targets. Source art stays intact.
export function coffeeEyeMasks(pixels,width,height){
 const left=new Uint8Array(width*height),right=new Uint8Array(width*height);let lo=width,hi=-1;
 for(let n=0;n<left.length;n++)if(pixels[n*4+3]>100){lo=Math.min(lo,n%width);hi=Math.max(hi,n%width);}
 const mid=(lo+hi)/2;
 for(let n=0;n<left.length;n++)if(pixels[n*4+3]>100)(n%width<=mid?left:right)[n]=1;
 return {coffeeLeftEye:left,coffeeRightEye:right};
}
export function coffeeMaterialBoundary(material,width,height,radius=2){
 const edge=new Uint8Array(material.length);
 for(let n=0;n<material.length;n++){if(!material[n])continue;const x=n%width,y=Math.floor(n/width);
  outer:for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
   if(Math.abs(dx)+Math.abs(dy)>radius)continue;const xx=x+dx,yy=y+dy;
   if(xx<0||yy<0||xx>=width||yy>=height||!material[yy*width+xx]){edge[n]=1;break outer;}
  }
 }
 return edge;
}
export function coffeeHairPixelColor(value,edge,oldEdge,restored,fill,outline){
 return edge?outline:value===2||oldEdge||restored?fill:null;
}
