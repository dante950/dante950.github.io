// Demon beauty is a two-phase guest of the shared salon. Battle remains unconnected.
export const DEMON_GUEST_ID=10007;
export const DEMON_FACE_LIMIT=.35;
export const demonFacePaintLimit=visible=>Math.max(6,Math.floor((visible||0)*.02));
export function demonHornAllowance(mask,width,height,radius=2){
 const allowed=new Uint8Array(mask.length);
 for(let n=0;n<mask.length;n++)if(mask[n]){const x=n%width,y=Math.floor(n/width);for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const xx=x+dx,yy=y+dy;if(dx*dx+dy*dy<=radius*radius&&xx>=0&&xx<width&&yy>=0&&yy<height)allowed[yy*width+xx]=1;}}
 return allowed;
}
export const DEMON_DESIGN={
 roof:[[110,100],[122,56],[145,86],[166,28],[187,86],[207,56],[220,100]],
 roofBox:{x:52,y:8,w:220,h:92},
 forelock:{x:171,y:104,w:12,h:40},silver:{x:174,y:128,w:4,h:16},
 silverZone:{x:50,y:12,w:220,h:142},
 eyes:[{x:112,y:150,w:44,h:18},{x:183,y:150,w:44,h:18}],
 brows:[{x:118,y:140,w:42,h:10},{x:176,y:140,w:42,h:10}],
 eyelids:[[[120,151],[145,151],[155,155]],[[175,155],[185,151],[211,151]]],
 lips:{x:151,y:192,w:30,h:8},
 helmetStickerArea:{x:12,y:4,w:296,h:296},
 crown:{x:126,y:4,w:80,h:58},hornLeft:{x:70,y:20,w:72,h:96},hornRight:{x:194,y:20,w:72,h:96}
};
export const DEMON_REQUIREMENTS={
 1:{cut:['양쪽 뿔의 높이·굵기 균형 복원','투구 본체 보존 · 얼굴을 뚫지 않기','상단·옆면 꾸미기는 투구 크기의 30% 안에서'],draw:['기스가 보이지 않게 덮기','짙은 바탕 70% 이상 · 나머지 색은 자유'],attach:['작은 장식 최대 두 개 · 위치 자유 · 안 붙여도 좋음']},
 2:{cut:['화면 왼쪽 귀는 끝까지 드러내기','오른쪽 귀는 끝만 살짝 가리기','머리 전체 길이는 귓불 아래로 내려오지 않게','두 눈과 양쪽 눈썹 드러내기'],draw:['이마 가운데로 내려온 앞머리에 얇은 은빛 세로 브릿지 한 줄','은빛 브릿지를 제외한 머리를 검정으로','양쪽 눈썹을 검정으로 염색','빨강 · 불투명도 15~30%로 얇은 입술','양쪽 눈 위에 얇은 검정 쌍꺼풀'],attach:['왼쪽·오른쪽 큰 뿔 한 쌍','티아라 또는 검은 왕관 하나 추가']}
};
export const DEMON_LINES={"arrival":[["마왕 부하","약속드린 날짜가 되어<wait=0.25> <color=#653D7C>마왕님</color>을 모셔왔습니다."],["몬스터","호오…<wait=0.45> 단기간에 미용 실력을 증명했다던 자가<wait=0.35> <color=#285780>자네</color>인가?"],["플레이어","네.<wait=0.2> 손님들이 꽤 <color=#285780>까다로우시더라고요.</color>"],["마왕 부하","그 까다로운 손님들이 <color=#24634D>인정한 솜씨</color>입니다."],["몬스터","소문은 들었다.<wait=0.35> 다만…<wait=0.3> <color=#653D7C>남의 칭찬만으로</color> 내 머리를 맡길 수는 없지."],["플레이어","마음에 드시면,<wait=0.25> 저를 <color=#285780>돌려보내 주신다는 약속</color>은요?"],["몬스터","왕의 <color=#653D7C>약속</color>은 가볍지 않네.<wait=0.35> 그대도 그에 걸맞은 솜씨를 보여주게."],["몬스터","그럼…<wait=0.35> 우선 <color=#285780>이 모습</color>부터 맡겨보지."]],"warning":"그곳은 복원할 곳이 아니다.<wait=0.4> <cps=22><size=20><color=#A13636>손을 멈추게.</color></size></cps>","warningAgain":"얼굴에는<wait=0.35> <cps=22><size=20><color=#A13636>손대지 말라고</color></size> 했을 텐데.</cps>","face":"그곳까지 칠해 달라고 하지는 않았네. 닦아주게.","color":"<size=20><color=#43536B>검은 머리와 은빛 한 줄.</color></size><wait=0.45> 내 주문을 다시 살펴보게.","sticker":"위치와 수를 다시 보게. 장식에도 격식이 있지.","helmetSticker":"투구보다 <size=20><color=#285780>장식이 먼저 입장할</color></size> 기세로군.<wait=0.45> 조금 줄여주게.","exterior":[["마왕 부하","마왕님,<wait=0.25> 이곳입니다."]],"gates":["<size=20><color=#285780>별 하나 없는 곳</color></size>에<wait=0.35> 내 머리를 맡기라는 것이냐?","흥…<wait=0.35> 별이 <size=20><color=#285780>하나뿐</color></size>인가.<wait=0.4> 형편없는 미용실이군.","별이 둘이라…<wait=0.5> 내 머리를 맡기엔 <size=20><color=#285780>부족하군.</color></size>","흠..<wait=0.35> <size=20><color=#285780>3스타 미용실</color></size>..<wait=0.45> 일단 합격이군."],"enter":"<wait=0.3>들어가 보도록 하지.","phase1Success":[["몬스터","…<wait=0.3>…<wait=0.3>제법이군.<wait=0.45> 이제 <size=20><color=#24634D>투구를 벗어도</color></size> 되겠어."],["몬스터","내가 <color=#285780>손대지 말라 한 곳은 지키면서도</color>…<wait=0.4> 솜씨를 보였군."],["몬스터","좋다.<wait=0.4> 이제 그대에게 <color=#653D7C>내 얼굴을 보여주도록 하지.</color>"]],"failure":[["몬스터","…<wait=0.4>…<wait=0.45><cps=22>이게 <size=20><color=#A13636>무엇이냐.</color></size></cps>"],["몬스터","나를…<wait=0.55> <cps=24><size=20><color=#A13636>웃음거리</color></size>로 만들 셈이냐?</cps>"],["마왕 부하","폐하,<wait=0.2> 잠시 진정하시고—"],["몬스터","<size=22><color=#A13636><shake=1.5 dur=0.6>입 다물어라!</shake></color></size><wait=0.4> 이 모욕은<wait=0.25> <size=22><color=#A13636><shake=1.2 dur=0.6>야차로 갚게 하겠다!</shake></color></size>"]],"sudden":[["몬스터","얼굴에는<wait=0.35> <cps=22><size=20><color=#A13636>손대지 말라고</color></size> 했을 텐데.</cps>"],["몬스터","이 모욕은<wait=0.25> <size=22><color=#A13636><shake=1.2 dur=0.6>야차로 갚게 하겠다!</shake></color></size>"]],"success":[["몬스터","…<wait=0.3>…<wait=0.3>내가 요구한 것은<wait=0.25> <size=20><color=#24634D>모두 해냈군.</color></size>"],["몬스터","분노와 관용.<wait=0.35> 그리고 <size=20><color=#653D7C>왕의 품격</color></size>까지.<wait=0.45> 훗…<wait=0.3> 마음에 드는군."]]};
export function demonGate(stars){const n=Math.max(0,Math.min(3,Math.floor(Number(stars)||0)));return {stars:n,admitted:n===3,line:DEMON_LINES.gates[n]};}
export function demonInside(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
export function demonPolygon(x,y,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function demonStickerFile(p){return (p.sticker.resourceFile||p.sticker.src.split('/').pop()).replace(/\.png$/i,'');}
export function demonRoyalStickers(placements){
 let tiara=0,left=0,right=0;
 for(const p of placements){const id=demonStickerFile(p);
  if(['T_tara','T_blackCrown'].includes(id)&&demonInside(p.x,p.y,DEMON_DESIGN.crown))tiara++;
  else if(id==='T_hornBig_L'&&demonInside(p.x,p.y,DEMON_DESIGN.hornLeft))left++;
  else if(id==='T_hornBig_R'&&demonInside(p.x,p.y,DEMON_DESIGN.hornRight))right++;
 }
 return [left>=1&&right>=1,tiara>=1];
}
export function demonJudge(phase,m={}){
 if(phase!==1&&phase!==2)return {success:false,sudden:false,checks:[false,false,false],requirements:{cut:[],draw:[],attach:[]}};
 const requirements=phase===1?{
 cut:[m.hornRatio>=.78&&m.hornRatio<=1.25&&m.hornHeight<=10&&m.hornWidth<=14,m.bodyLoss<=.04&&m.exposure===0,m.growthRatio<=.30],
 draw:[m.scratches>=.90,m.darkBase>=.70],attach:[m.decorCount<=2&&m.decorArea<=.18]
 }:{cut:[m.leftEar>=.90,m.rightTip>=.35&&m.rightTip<=.85&&m.rightEar>=.90,m.lengthOver<=6,m.eyes>=.94],
 draw:[m.silverLine&&m.silverSpill<=Math.max(6,(m.silverTotal||0)*.25),m.black>=.95,m.browLeft>=.70&&m.browRight>=.70,m.lips,m.eyelidLeft&&m.eyelidRight],attach:m.adornments||[false,false]};
 const checks=['cut','draw','attach'].map(stage=>requirements[stage].every(Boolean));return {success:checks.every(Boolean),sudden:phase===1&&m.exposure>=DEMON_FACE_LIMIT,checks,requirements};
}
// Judge the visible skyline, not occupancy of a hidden target polygon.
export function demonRoofProfile(material,width,height){
 const left=Math.ceil(52/2),right=Math.floor(272/2),bottom=Math.min(height,60),top=[];
 for(let x=left;x<=right;x++){let y=bottom;for(let q=0;q<bottom;q++)if(material[q*width+x]){y=q;break;}top.push(y);}
 const smooth=top.map((y,i)=>[top[Math.max(0,i-1)],y,top[Math.min(top.length-1,i+1)]].sort((a,b)=>a-b)[1]);
 const peaks=[];
 for(let i=0;i<smooth.length;){let end=i;while(end+1<smooth.length&&smooth[end+1]===smooth[i])end++;
  const y=smooth[i],before=i?smooth[i-1]:bottom,after=end+1<smooth.length?smooth[end+1]:bottom;
  if(y<bottom-4&&y<before&&y<after){
   let l=i-1,r=end+1,lv=y,rv=y;
   while(l>=0&&smooth[l]>=y){lv=Math.max(lv,smooth[l--]);if(lv-y>=4)break;}
   while(r<smooth.length&&smooth[r]>=y){rv=Math.max(rv,smooth[r++]);if(rv-y>=4)break;}
   if(Math.min(lv,rv)-y>=4)peaks.push({x:(left+(i+end)/2)*2,y:y*2});
  }i=end+1;
 }
 return {peaks,roofPeaks:peaks.length,centerHighest:peaks.length===3&&peaks[1].y+6<=Math.min(peaks[0].y,peaks[2].y)};
}
export function demonSilverStripe(material,paint,width,height){
 const selected=new Uint8Array(material.length),seen=new Uint8Array(material.length),components=[];let tip=0,total=0;
 const zone=DEMON_DESIGN.silverZone;
 for(let n=0;n<material.length;n++)if(material[n]&&demonInside((n%width+.5)*2,(Math.floor(n/width)+.5)*2,zone)){
  tip=Math.max(tip,Math.floor(n/width));const i=n*4;
  if(paint[i+3]>=230&&Math.min(paint[i],paint[i+1],paint[i+2])>=190&&Math.max(paint[i],paint[i+1],paint[i+2])-Math.min(paint[i],paint[i+1],paint[i+2])<=40){selected[n]=1;total++;}
 }
 for(let n=0;n<selected.length;n++)if(selected[n]&&!seen[n]){
  const cells=[n];seen[n]=1;let x0=width,x1=0,y0=height,y1=0;
  for(let q=0;q<cells.length;q++){const k=cells[q],x=k%width,y=Math.floor(k/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,i=yy*width+xx;if(xx>=0&&xx<width&&yy>=0&&yy<height&&selected[i]&&!seen[i]){seen[i]=1;cells.push(i);}}
  }components.push({cells,x0,x1,y0,y1});
 }
 components.sort((a,b)=>b.cells.length-a.cells.length);const line=components[0],mask=new Uint8Array(material.length);
 if(line)for(const n of line.cells)mask[n]=1;
 const w=line?line.x1-line.x0+1:0,h=line?line.y1-line.y0+1:0;
 const valid=!!line&&h>=6&&w<=4&&h>=w*3&&line.cells.length>=w*h*.5&&total-line.cells.length<=6;
 return {valid,total:line?.cells.length||0,mask,allowance:demonHornAllowance(mask,width,height,2)};
}
// Grading uses painted pixels, not the currently selected colour or opacity slider.
export const demonBlackPaint=(paint,i)=>paint[i+3]>=230&&Math.max(paint[i],paint[i+1],paint[i+2])<=65;
export const demonLipPaint=(paint,i)=>paint[i]>=180&&paint[i+1]<=90&&paint[i+2]<=100&&paint[i+3]>=38&&paint[i+3]<=77;
export function demonMakeupMasks(base,width,height){
 const result=Object.fromEntries(['brow','browRight','eyelidLeft','eyelidRight','lips'].map(k=>[k,new Uint8Array(width*height)]));
 const distance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);};
 for(let n=0;n<width*height;n++){const i=n*4,x=(n%width+.5)*2,y=(Math.floor(n/width)+.5)*2;if(base[i+3]<=100)continue;
  DEMON_DESIGN.brows.forEach((box,k)=>{result[k?'browRight':'brow'][n]=+(demonInside(x,y,box)&&Math.min(base[i],base[i+1],base[i+2])>=225);});
  DEMON_DESIGN.eyelids.forEach((line,k)=>{result[k?'eyelidRight':'eyelidLeft'][n]=+(line.slice(1).some((b,j)=>distance(x,y,line[j],b)<=1.8));});
  result.lips[n]=+demonInside(x,y,DEMON_DESIGN.lips);
 }
 const union=Uint8Array.from({length:width*height},(_,n)=>+Object.values(result).some(mask=>mask[n]));
 result.makeupAllowance=demonHornAllowance(union,width,height,2);
 return result;
}
export function demonMakeup(material,paint,masks,width,height){
 const coverage=key=>{let total=0,dyed=0;for(let n=0;n<material.length;n++)if(masks[key][n]){total++;if(!material[n]&&demonBlackPaint(paint,n*4))dyed++;}return total?dyed/total:0;};
 const stroke=(key,predicate,minWidth,maxHeight,minCoverage=0)=>{
  let count=0,total=0,x0=width,x1=-1,y0=height,y1=-1;
  for(let n=0;n<material.length;n++)if(masks[key][n]){total++;if(!material[n]&&predicate(paint,n*4)){count++;x0=Math.min(x0,n%width);x1=Math.max(x1,n%width);y0=Math.min(y0,Math.floor(n/width));y1=Math.max(y1,Math.floor(n/width));}}
  const w=x1-x0+1,h=y1-y0+1;return count>=minWidth&&w>=minWidth&&h<=maxHeight&&w>=h*3&&count>=w*(minCoverage?.75:h*.5)&&count>=total*minCoverage;
 };
 // Reject a thick/opaque lipstick overlay even when some pixels remain in range.
 let lipWrong=0;for(let n=0;n<material.length;n++)if(masks.lips[n]&&!material[n]&&paint[n*4+3]&&!demonLipPaint(paint,n*4))lipWrong++;
 return {browLeft:coverage('brow'),browRight:coverage('browRight'),lips:stroke('lips',demonLipPaint,8,2)&&lipWrong<=2,eyelidLeft:stroke('eyelidLeft',demonBlackPaint,11,4,.45),eyelidRight:stroke('eyelidRight',demonBlackPaint,11,4,.45)};
}
// Fill only brush-covered cells connected to the pre-stroke material or a
// restorable source pixel. Flooding a separate mask makes input order irrelevant.
export function demonGrowthCells(current,restore,cells,width,height,canGrow){
 const candidates=new Uint8Array(current.length),connected=new Uint8Array(current.length),queue=[];
 const neighbors=n=>{const x=n%width,y=Math.floor(n/width),out=[];if(x)out.push(n-1);if(x+1<width)out.push(n+1);if(y)out.push(n-width);if(y+1<height)out.push(n+width);return out;};
 for(const n of cells)if(n>=0&&n<current.length&&canGrow(n))candidates[n]=1;
 for(const n of cells)if(candidates[n]&&!connected[n]&&(restore[n]||current[n]||neighbors(n).some(k=>current[k]))){connected[n]=1;queue.push(n);}
 for(let i=0;i<queue.length;i++)for(const k of neighbors(queue[i]))if(candidates[k]&&!connected[k]){connected[k]=1;queue.push(k);}
 return connected;
}
// Continue material colour, never extrude a scratch, painted detail or PNG shadow stripe.
export function demonGrowthPalette(pixels,width,height,helmet=false){
 const filled=new Uint8Array(width*height),colors=new Uint8ClampedArray(pixels.length),queue=[];
 const occupied=Uint8Array.from({length:width*height},(_,n)=>pixels[n*4+3]>100?1:0);
 const buckets=[new Map(),new Map()],seeds=[];
 for(let n=0;n<occupied.length;n++){const x=n%width,y=Math.floor(n/width),i=n*4;
  const r=pixels[i],g=pixels[i+1],b=pixels[i+2],blue=b>110&&b>r*1.7&&b>g*1.5;
  const scratch=r>85&&r<205&&g>85&&b-r<55&&Math.abs(r-g)<40;
  if(!occupied[n]||x===0||x===width-1||y===0||y===height-1||!occupied[n-1]||!occupied[n+1]||!occupied[n-width]||!occupied[n+width])continue;
  if(helmet?(scratch||!blue&&(Math.max(r,g,b)>85||Math.max(r,g,b)<36)):Math.max(r,g,b)<=35)continue;
  const type=helmet&&blue?1:0;seeds.push([n,type]);
  const key=[r,g,b].map(v=>v>>3).join(','),bucket=buckets[type].get(key)||[0,0,0,0];
  bucket[0]+=r;bucket[1]+=g;bucket[2]+=b;bucket[3]++;buckets[type].set(key,bucket);
 }
 const dominant=buckets.map((map,t)=>{const best=[...map.values()].sort((a,b)=>b[3]-a[3])[0];return best?best.slice(0,3).map(v=>Math.round(v/best[3])):t?[72,83,248]:[36,34,54];});
 for(const [n,type]of seeds){filled[n]=1;colors.set(helmet?[...dominant[type],255]:pixels.subarray(n*4,n*4+4),n*4);queue.push(n);}
 for(let q=0;q<queue.length;q++){const n=queue[q],x=n%width,y=Math.floor(n/width);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(xx<0||xx>=width||yy<0||yy>=height)continue;const k=yy*width+xx;if(!filled[k]){filled[k]=1;colors.set(colors.subarray(n*4,n*4+4),k*4);queue.push(k);}}}
 if(!queue.length)for(let n=0;n<occupied.length;n++)colors.set([...dominant[0],255],n*4);
 return colors;
}
export function demonGuest(phase=1){
 if(phase!==1&&phase!==2)throw Error('마왕 미용은 두 페이즈입니다.');
 const notes=DEMON_REQUIREMENTS[phase];
 const request=phase===1?{"cut":["전장의 흔적은 지워주게.<wait=0.4> <size=20><color=#653D7C>위엄</color></size>까지 지우지는 말고.","부러진 뿔을 반대쪽과 <size=20><color=#285780>균형 있게</color></size> 복원하게.<wait=0.3> 상단과 옆면의 장식은 그대의 안목을 보겠네.","단,<wait=0.45> <cps=24>투구 안을 들여다볼 생각은 <size=20><color=#A13636>버리게.</color></size></cps>"],"draw":["기스가 <size=20><color=#285780>남아 보이지 않게</color></size><wait=0.2> 덮어주게.","짙은 바탕은 <size=20><color=#285780>일곱 할 이상</color></size> 남기고,<wait=0.3> 나머지 색과 무늬는 맡기지.","눈 부분의 색과 무늬도<wait=0.25> <size=20><color=#24634D>그대에게</color></size> 맡기겠네."],"attach":["작은 장식은 <size=20><color=#285780>두 개</color></size>까지 허락하겠네.<wait=0.35> 안 붙여도 좋고.","작은 장식이라면 눈 부분을 포함해 얼굴 어디에 붙여도 좋네.<wait=0.4> <size=20><color=#285780>투구보다 장식이 커서는</color></size><wait=0.25> 곤란하고."]}:{"cut":[["몬스터","이것이 <color=#653D7C>내 얼굴</color>일세."],["플레이어","……<wait=0.35>투구를 쓰고 계셨을 때랑 <color=#285780>인상이 꽤 다르시네요.</color>"],["몬스터","하지만 이 정도로는 만족스럽지 않네.<wait=0.35> <color=#653D7C>왕의 얼굴</color>에는 부족함이 없어야 하니."],["몬스터","어려운 일은 아닐세.<wait=0.35> <color=#653D7C>몇 가지만</color> 손봐주면 되네.<wait=0.5>"],["몬스터","왼쪽 귀는 <size=20><color=#285780>전부</color></size> 드러내게.<wait=0.2> 오른쪽은 <size=20><color=#285780>끝만 살짝</color></size> 가리고.<wait=0.4> 모든 말을 들을 생각은 없으니."],["몬스터","머리 전체를 <size=20><color=#285780>귓불 아래로 내려오지 않게</color></size> 다듬게.<wait=0.25> 전투 중 목에 닿으면 거슬리니."],["몬스터","두 눈과 양쪽 눈썹은 드러내게.<wait=0.35> 내 표정을 신하들이 <size=20><color=#285780>읽을 수는</color></size> 있어야지."],["몬스터","이마 가운데로 내려온 앞머리에 <size=20><color=#43536B>가느다란 은빛 세로 브릿지 한 줄</color></size>을 넣게.<wait=0.3> 그 한 줄을 제외한 머리는 <size=20><color=#242236>검게.</color></size><wait=0.4> 세월은 <size=20><color=#285780>한 가닥</color></size>이면 충분하네."],["몬스터","눈썹은 양쪽 모두 검게.<wait=0.2> 눈 위에는 가는 검정 선으로 <size=20><color=#285780>쌍꺼풀</color></size>도 만들어주게.<wait=0.3> 위엄에도 또렷함이 필요하니."],["몬스터","입술은 빨강을 불투명도 <size=20><color=#285780>십오에서 삼십</color></size> 사이로,<wait=0.2> 얇게만 올리게.<wait=0.4> 생기를 원하지,<wait=0.3> <size=20><color=#A13636>피를 마신 흔적</color></size>을 원하지는 않네."],["몬스터","머리 위에는 좌우에 맞는 <size=20><color=#285780>큰 뿔 한 쌍</color></size>을 붙이고,<wait=0.2> 티아라나 검은 왕관 하나도 올려주게.<wait=0.4> 왕관이 없다고 <size=20><color=#653D7C>누가 왕인지</color></size><wait=0.25> 헷갈려서는 곤란하지."],["몬스터","…<wait=0.3>…<wait=0.35>이상일세."],["플레이어","방금<wait=0.3> <size=20><color=#285780>미용 주문</color></size>하신 거 맞죠?<wait=0.45> 국가 운영 방침 아니고?"],["마왕 부하","오늘은<wait=0.3> 상당히 <size=20><color=#285780>간소하게</color></size><wait=0.25> 말씀하신 편입니다."],["몬스터","아.<wait=0.4> 주문한 눈썹과 눈매,<wait=0.2> 입술만 살려두면<wait=0.25> 나머지 얼굴은 <size=20><color=#24634D>그대 마음대로</color></size> 꾸며도 좋네."]],"draw":["<size=20><color=#285780>이마 가운데로 내려온 앞머리</color></size>에 가느다란 은빛 세로 브릿지 한 줄을 넣게.<wait=0.3> 그 한 줄을 제외한 머리는 <size=20><color=#242236>검게</color></size> 물들이게.","눈썹은 양쪽 모두 검게.<wait=0.25> 양쪽 눈 위에는 <size=20><color=#285780>얇은 검정 쌍꺼풀 선</color></size>을 그어주게.","입술에는 빨강을<wait=0.2> 불투명도 <size=20><color=#285780>15~30%</color></size>로 얇게 올리게.","주문한 화장 외의 얼굴은 <size=20><color=#24634D>자유롭게</color></size> 꾸미게.<wait=0.35> 그대의 감각도 보고 싶군."],"attach":["화면 왼쪽에는 <size=20><color=#285780>왼쪽 큰 뿔</color></size>,<wait=0.25> 오른쪽에는 <size=20><color=#285780>오른쪽 큰 뿔</color></size>을 붙여주게.","거기에 티아라나 검은 왕관 중 하나를 올리게.<wait=0.25> 뿔 한 쌍과 머리 장식이 <size=20><color=#285780>모두</color></size> 있어야 하네.<wait=0.35> 그 외의 장식은 그대 마음대로 더해도 좋네."]};
 const details=phase===1?{"cut":["반대쪽 뿔을 보고 <size=20><color=#285780>높이와 굵기</color></size>를 맞추게.<wait=0.25> 발모제로 채우고 망치·정으로 다듬으면 되네.","실수로 낸 구멍이라면 <color=#285780>서둘러 메우게.</color><wait=0.4> 내 인내심에도 한계는 있으니.","그 선을 넘으면…<wait=0.4> 다음에는 미용이 아니라 <size=20><color=#A13636>야차</color></size>일세.","상단·옆면 외형은<wait=0.2> 원래 투구 크기의 <size=20><color=#285780>삼 할</color></size>까지 늘려도 좋네."],"draw":["기스가 <size=20><color=#285780>남아 보이지 않게</color></size><wait=0.2> 덮어주게.","짙은 바탕은 <size=20><color=#285780>일곱 할 이상</color></size> 남기고,<wait=0.3> 나머지 색과 무늬는 맡기지.","눈 부분의 색과 무늬도<wait=0.25> <size=20><color=#24634D>그대에게</color></size> 맡기겠네."],"attach":["작은 장식은 <size=20><color=#285780>두 개</color></size>까지 허락하겠네.<wait=0.35> 안 붙여도 좋고.","작은 장식이라면 눈 부분을 포함해 얼굴 어디에 붙여도 좋네.<wait=0.4> <size=20><color=#285780>투구보다 장식이 커서는</color></size><wait=0.25> 곤란하고."]}:{"cut":["좌우는 <size=20><color=#285780>화면 기준</color></size>일세.<wait=0.25> 왼쪽 귀 전체,<wait=0.2> 오른쪽 귀는 아래가 드러나고 끝만 머리에 가리면 되네.","귓불 아래의 초록색 머리는 덜어내고,<wait=0.2> 두 눈과 양쪽 눈썹은 드러내게.<wait=0.3> 정수리 모양은 <size=20><color=#24634D>그대에게</color></size> 맡기지.","손질 가이드는 <size=20><color=#285780>초록 부분을 덜고,</color></size><wait=0.25> 금빛 안쪽을 남기거나 채우는 표시일세."],"draw":["<size=20><color=#285780>이마 가운데로 내려온 앞머리</color></size>를 따라 은빛 선을 세로로 길고 얇게 넣게.<wait=0.25> 도구 크기 1~3 정도면 좋겠네.","금빛 눈썹은 검게 물들이고,<wait=0.2> 눈썹 아래 하늘색 표시에는 가는 검정 쌍꺼풀 선을 그리게.<wait=0.25> 도구 크기는 <size=20><color=#285780>1~2</color></size>로.","입술의 붉은 표시를 따라 빨강,<wait=0.2> 불투명도 <size=20><color=#285780>15~30%</color></size>,<wait=0.2> 도구 크기 1~2로 얇게 긋게.<wait=0.25> 색을 겹쳐 너무 진해졌다면 지우고 다시 칠하면 되네."],"attach":["화면 왼쪽에는 <size=20><color=#285780>왼쪽 큰 뿔</color></size>,<wait=0.25> 오른쪽에는 <size=20><color=#285780>오른쪽 큰 뿔</color></size>을 붙여주게.","거기에 티아라나 검은 왕관 중 하나를 올리게.<wait=0.25> 뿔 한 쌍과 머리 장식이 <size=20><color=#285780>모두</color></size> 있어야 하네.<wait=0.35> 그 외의 장식은 그대 마음대로 더해도 좋네."]};
 return {id:DEMON_GUEST_ID,name:'마왕',demon:true,demonPhase:phase,workbookExcluded:false,battle:'none',bindings:{},note:'4일차 마왕. 투구 복원과 미형 미용의 두 페이즈. 미용 성공 후 미용실로 복귀하여 엔딩 분기에 전달. 고블린은 야차에서만 공개. 야차 전투 미연결.',demonRequest:request,demonRequestDetails:details,
 beauty:{enabled:true,designVersion:2,steps:{cut:true,draw:true,attach:true},weights:{cut:60,draw:30,attach:10},cutTool:phase===1?'hammer':'scissors',growth:{enabled:true,material:phase===1?'horn':'hair',color:phase===1?'#242236':'#ECEBF4',outline:phase===1?'#18151F':'#242236',allowFace:true,region:{x:12,y:6,w:296,h:310}},drawColors:['#242236','#18151F','#4853F8','#ECEBF4'],cutRegions:[{key:'DemonShape',label:notes.cut[0],x:0,y:0,w:320,h:350,kind:'keep',rule:'free',points:60,tolerance:0}],drawRegions:[],attachRegions:[],requestBriefNotes:Object.fromEntries(Object.entries(notes).map(([k,v])=>[k,v.join('\n')])),requestNotes:Object.fromEntries(Object.entries(notes).map(([k,v])=>[k,v.join('\n')]))},
 resultLines:{satisfied:phase===1?'…<wait=0.3>…<wait=0.3>제법이군.<wait=0.45> 이제 <size=20>투구를 벗어도</size> 되겠어.':'훗…<wait=0.35> 정말 <size=20>만족스럽군!</size>',angry:'…<wait=0.4>…<wait=0.45><cps=22>이게 <size=20>무엇이냐.</size></cps>',neutral:'……'},basePay:0,tipRate:0};
}
// Existing workbook sheets keep the prose; phase selection stays in project JSON.
export function ensureDemonDialogueCatalogue(project){
 const g=project?.guests?.find(g=>g.id===DEMON_GUEST_ID);if(!g||!project.combat?.sheets)return project;
 g.workbookExcluded=false;
 const rows=name=>project.combat.sheets.find(s=>s.name===name)?.rows||[],groups=rows('대화 그룹'),lines=rows('대사'),links=rows('미용 대사 연결');
 g.bindings||={};
 if(!g.bindings.exterior){
  const id=Math.max(80000,...groups.map(r=>r.GroupID))+1;g.bindings.exterior=id;
  groups.push({GroupID:id,Name:'마왕 · 미용실 외부 등장 씬',PlaybackMode:'순서대로',PauseCombat:true,AdvanceMode:'입력',CPS:30,HoldMs:1400,GapMs:100,Notes:'미용실 외관 · 별 확인 전',ActorEffect:'없음',FinishEffect:'없음'});
  for(const [i,line]of DEMON_LINES.exterior.entries())lines.push({DialogueID:Math.max(900000,...lines.map(r=>r.DialogueID))+1,GroupID:id,Order:i+1,Speaker:line[0],Text:line[1],Notes:'미용실 외부 등장 씬'});
 }
 g.demonPhaseDialogue||={};g.demonPhaseDialogue[1]||=Object.fromEntries(links.filter(r=>r.MonsterID===g.id).map(r=>[r.Stage,{RequestGroupID:r.RequestGroupID,DetailGroupID:r.DetailGroupID}]));
 const second=g.demonPhaseDialogue[2]||={},guest=demonGuest(2);
 for(const stage of ['cut','draw','attach']){second[stage]||={};for(const [key,texts]of [['RequestGroupID',guest.demonRequest[stage]],['DetailGroupID',guest.demonRequestDetails[stage]]]){
  if(groups.some(r=>r.GroupID===second[stage][key]))continue;
  const id=Math.max(80000,...groups.map(r=>r.GroupID))+1;second[stage][key]=id;
  groups.push({GroupID:id,Name:'마왕 · 미형 · '+stage+(key==='DetailGroupID'?' 상세':''),PlaybackMode:'순서대로',PauseCombat:true,AdvanceMode:'입력',CPS:30,HoldMs:1400,GapMs:100,Notes:'마왕 2페이즈 미용 · 페이즈 연결은 프로젝트 JSON',ActorEffect:'없음',FinishEffect:'없음'});
  for(const [i,line]of texts.entries())lines.push({DialogueID:Math.max(900000,...lines.map(r=>r.DialogueID))+1,GroupID:id,Order:i+1,Speaker:Array.isArray(line)?line[0]:'몬스터',Text:Array.isArray(line)?line[1]:line,Notes:'마왕 2페이즈 미용'});
 }}return project;
}
export function installDemonDialogue(project,g){
 ensureDemonDialogueCatalogue(project);const source=project.guests.find(x=>x.id===g.id),configured=source?.demonPhaseDialogue?.[g.demonPhase];
 if(configured&&['cut','draw','attach'].every(k=>configured[k])){g.bindings={...source.bindings};const links=project.combat.sheets.find(s=>s.name==='미용 대사 연결').rows;for(const stage of ['cut','draw','attach']){const row={MonsterID:g.id,Stage:stage,...configured[stage]},old=links.find(r=>r.MonsterID===g.id&&r.Stage===stage);if(old)Object.assign(old,row);else links.push(row);}return g;}
 const rows=n=>project.combat.sheets.find(s=>s.name===n).rows,groups=rows('대화 그룹'),lines=rows('대사'),links=rows('미용 대사 연결');
 const add=(name,texts)=>{const id=Math.max(80000,...groups.map(r=>r.GroupID))+1;groups.push({GroupID:id,Name:'마왕 · '+name,PlaybackMode:'순서대로',PauseCombat:true,AdvanceMode:'입력',CPS:30,HoldMs:1400,GapMs:100,Notes:'마왕 미용 · 웹 전용',ActorEffect:'없음',FinishEffect:'없음'});for(const [i,line]of texts.entries())lines.push({DialogueID:Math.max(900000,...lines.map(r=>r.DialogueID))+1,GroupID:id,Order:i+1,Speaker:Array.isArray(line)?line[0]:'몬스터',Text:Array.isArray(line)?line[1]:line,Notes:'마왕 미용 · 웹 전용'});return id;};
 g.bindings.exterior=source?.bindings?.exterior||add('미용실 외부 등장 씬',DEMON_LINES.exterior);
 g.bindings.arrival=add('등장',DEMON_LINES.arrival);
 for(const stage of ['cut','draw','attach']){const link={MonsterID:g.id,Stage:stage,RequestGroupID:add(stage,g.demonRequest[stage]),DetailGroupID:add(stage+' 상세',g.demonRequestDetails[stage])},old=links.find(r=>r.MonsterID===g.id&&r.Stage===stage);if(old)Object.assign(old,link);else links.push(link);}return g;
}
export async function prepareDemonSkins(){
 const images={},names=['helmet','face','ears','hair','king'];
 await Promise.all(names.map(async name=>{const im=new Image();im.src='./media/demon/'+name+'.png';await im.decode();images[name]=im;}));
 const layer=(name,box)=>{const c=document.createElement('canvas');c.width=320;c.height=350;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(images[name],...box);const p=x.getImageData(0,0,320,350);for(let i=0;i<p.data.length;i+=4)p.data[i+3]=p.data[i+3]>100?255:0;x.putImageData(p,0,0);return c;};
 const descriptor=c=>({src:c.toDataURL(),x:0,y:0,w:320,h:350});
 const skins={};
 for(const phase of [1,2]){
  const faceY=phase===2?-37:-7;
  const head=layer('face',[-17,faceY,371,371]),ears=layer('ears',[-17,faceY,371,371]);
  if(phase===2)head.getContext('2d').drawImage(ears,0,0);
  const material=layer(phase===1?'helmet':'hair',phase===1?[-12,-10,344,305]:[-57,-112,456,456]);
  const target=document.createElement('canvas');target.width=320;target.height=350;const tx=target.getContext('2d');tx.drawImage(material,0,0);
  if(phase===1){const src=tx.getImageData(0,0,320,350).data,out=tx.getImageData(0,0,320,350);for(let y=0;y<117;y++)for(let x=185;x<292;x++){const s=(y*320+318-x)*4,i=(y*320+x)*4;if(src[s+3]&&src[s+2]>110&&src[s]<125&&src[s+1]<145)out.data.set(src.subarray(s,s+4),i);}tx.putImageData(out,0,0);}
  const stones=null;
  const p=document.createElement('canvas');p.width=320;p.height=350;const px=p.getContext('2d');px.drawImage(head,0,0);px.drawImage(material,0,0);if(stones)px.drawImage(stones,0,0);
  skins[phase]={full:'./media/demon/king.png',head:head.toDataURL(),hair:material.toDataURL(),portrait:p.toDataURL(),layers:{head:descriptor(head),material:descriptor(material),target:descriptor(target),ears:descriptor(ears),...(stones?{stones:descriptor(stones)}:{})}};
 }
 return skins;
}
