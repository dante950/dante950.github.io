// Demon beauty is a two-phase guest of the shared salon. Battle remains unconnected.
export const DEMON_GUEST_ID=10007;
export const DEMON_FACE_LIMIT=.35;
// Preserve the eye opening while allowing the rim spill of a size-four restoration brush.
export const DEMON_HELMET_EYE_PAINT_LIMIT=.15;
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
 crown:{x:126,y:4,w:80,h:58},hornLeft:{x:70,y:20,w:72,h:96},hornRight:{x:194,y:20,w:72,h:96}
};
export const DEMON_REQUIREMENTS={
 1:{cut:['양쪽 뿔의 높이·굵기 균형 복원','투구 본체 보존 · 얼굴을 뚫지 않기','상단·옆면 꾸미기는 투구 크기의 30% 안에서'],draw:['기스가 보이지 않게 덮기','짙은 바탕 70% 이상 · 나머지 색은 자유','눈 개구부의 인상 보존'],attach:['작은 장식 최대 두 개 · 안 붙여도 좋음','눈 개구부를 가리지 않기']},
 2:{cut:['화면 왼쪽 귀는 끝까지 드러내기','오른쪽 귀는 끝만 살짝 가리기','머리 전체 길이는 귓불 아래로 내려오지 않게','두 눈과 양쪽 눈썹 드러내기'],draw:['은빛 브릿지를 제외한 머리를 검정으로','머리카락에 얇은 은빛 세로 브릿지 한 줄','양쪽 눈썹을 검정으로 염색','빨강 · 불투명도 15~30%로 얇은 입술','양쪽 눈 위에 얇은 검정 쌍꺼풀'],attach:['왼쪽·오른쪽 큰 뿔 한 쌍 또는 티아라 하나','그 밖의 장식은 제외']}
};
export const DEMON_LINES={arrival:[['마왕 부하','약속드린 날짜가 되어 마왕님을 모셔왔습니다.'],['몬스터','호오.. 단기간에 미용 실력을 증명했다던 자가 자네인가?'],['몬스터','그럼.. 우선 이 모습부터 맡겨보지']],warning:'그곳은 복원할 곳이 아니다. 손을 멈추게.',warningAgain:'얼굴에는 손대지 말라고 했을 텐데.',face:'그곳까지 칠해 달라고 하지는 않았네. 닦아주게.',color:'검은 머리와 은빛 한 줄. 내 주문을 다시 살펴보게.',sticker:'위치와 수를 다시 보게. 장식에도 격식이 있지.',helmetEye:'눈이 보이는 틈은 남겨두게. 앞을 볼 수는 있어야지.',helmetSticker:'투구보다 장식이 먼저 입장할 기세로군. 조금 줄여주게.'};
export function demonGate(stars){const n=Math.max(0,Math.min(3,Math.floor(Number(stars)||0)));return {stars:n,admitted:n===3,line:n===3?'흠.. 3스타 미용실.. 일단 합격이군.':['별 하나 없는 곳에 내 머리를 맡기라는 것이냐?','흥… 별이 하나뿐인가. 형편없는 미용실이군.','별이 둘이라… 내 머리를 맡기엔 부족하군.'][n]};}
export function demonInside(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
export function demonPolygon(x,y,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function demonStickerFile(p){return (p.sticker.resourceFile||p.sticker.src.split('/').pop()).replace(/\.png$/i,'');}
export function demonRoyalStickers(placements){
 let tiara=0,left=0,right=0,other=0;
 for(const p of placements){const id=demonStickerFile(p);
  if(id==='T_tara'&&demonInside(p.x,p.y,DEMON_DESIGN.crown))tiara++;
  else if(id==='T_hornBig_L'&&demonInside(p.x,p.y,DEMON_DESIGN.hornLeft))left++;
  else if(id==='T_hornBig_R'&&demonInside(p.x,p.y,DEMON_DESIGN.hornRight))right++;
  else other++;
 }
 const tiaraOnly=tiara===1&&left===0&&right===0,hornPair=tiara===0&&left===1&&right===1;
 return [tiaraOnly||hornPair,other===0&&tiara<=1&&left<=1&&right<=1&&!(tiara&&(left||right))];
}
export function demonJudge(phase,m={}){
 if(phase!==1&&phase!==2)return {success:false,sudden:false,checks:[false,false,false],requirements:{cut:[],draw:[],attach:[]}};
 const requirements=phase===1?{
 cut:[m.hornRatio>=.78&&m.hornRatio<=1.25&&m.hornHeight<=10&&m.hornWidth<=14,m.bodyLoss<=.04&&m.exposure===0,m.growthRatio<=.30],
 draw:[m.scratches>=.90,m.darkBase>=.70,m.eyePaint<=DEMON_HELMET_EYE_PAINT_LIMIT],attach:[m.decorCount<=2&&m.decorArea<=.18,m.decorEyes<=.05]
 }:{cut:[m.leftEar>=.90,m.rightTip>=.35&&m.rightTip<=.85&&m.rightEar>=.90,m.lengthOver<=6,m.eyes>=.94],
 draw:[m.black>=.97,m.silverLine&&m.silverSpill<=Math.max(6,(m.silverTotal||0)*.25),m.browLeft>=.70&&m.browRight>=.70,m.lips,m.eyelidLeft&&m.eyelidRight],attach:m.adornments||[false,false]};
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
// Extend the source palette into new material, keeping the original PNG unchanged.
export function demonGrowthPalette(pixels,width,height){
 const filled=new Uint8Array(width*height),colors=new Uint8ClampedArray(pixels.length),queue=[];
 const occupied=Uint8Array.from({length:width*height},(_,n)=>pixels[n*4+3]>100?1:0);
 for(let n=0;n<occupied.length;n++){const x=n%width,y=Math.floor(n/width),i=n*4;
  if(occupied[n]&&Math.max(pixels[i],pixels[i+1],pixels[i+2])>35&&x>0&&x<width-1&&y>0&&y<height-1&&occupied[n-1]&&occupied[n+1]&&occupied[n-width]&&occupied[n+width]){filled[n]=1;colors.set(pixels.subarray(i,i+4),i);queue.push(n);}
 }
 for(let q=0;q<queue.length;q++){const n=queue[q],x=n%width,y=Math.floor(n/width);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(xx<0||xx>=width||yy<0||yy>=height)continue;const k=yy*width+xx;if(!filled[k]){filled[k]=1;colors.set(colors.subarray(n*4,n*4+4),k*4);queue.push(k);}}}
 return colors;
}
export function demonGuest(phase=1){
 if(phase!==1&&phase!==2)throw Error('마왕 미용은 두 페이즈입니다.');
 const notes=DEMON_REQUIREMENTS[phase];
 const request=phase===1?{cut:['전장의 흔적은 지워주게. 위엄까지 지우지는 말고.','부러진 뿔을 반대쪽과 균형 있게 복원하게. 상단과 옆면의 장식은 그대의 안목을 보겠네.','단, 투구 안을 들여다볼 생각은 버리게.'],draw:['기스가 남아 보이지 않게 덮어주게.','짙은 바탕은 일곱 할 이상 남기고, 나머지 색과 무늬는 맡기지.','눈이 보이는 틈은 가리지 말게. 앞을 볼 수는 있어야지.'],attach:['작은 장식은 두 개까지 허락하겠네. 안 붙여도 좋고.','눈이 보이는 틈을 가리거나, 투구보다 장식이 커서는 곤란하네.']}:{cut:['내 주문은 간단하네.','왼쪽 귀는 전부 드러내게. 오른쪽은 끝만 살짝 가리고. 모든 말을 들을 생각은 없으니.','머리 전체를 귓불 아래로 내려오지 않게 다듬게. 전투 중 목에 닿으면 거슬리니.','두 눈과 양쪽 눈썹은 드러내게. 내 표정을 신하들이 읽을 수는 있어야지.','머리 전체는 검게. 그 안에 은빛 브릿지를 가늘게 한 줄, 세로로 넣게. 세월은 한 가닥이면 충분하네.','눈썹은 양쪽 모두 검게. 눈 위에는 가는 검정 선으로 쌍꺼풀도 만들어주게. 위엄에도 또렷함이 필요하니.','입술은 빨강을 불투명도 십오에서 삼십 사이로, 얇게만 올리게. 생기를 원하지, 피를 마신 흔적을 원하지는 않네.','머리 위에는 좌우에 맞는 큰 뿔 한 쌍, 또는 티아라 하나. 왕관이 없다고 누가 왕인지 헷갈려서는 곤란하지.','……이상일세.',['플레이어','방금 미용 주문하신 거 맞죠? 국가 운영 방침 아니고?'],['마왕 부하','오늘은 상당히 간소하게 말씀하신 편입니다.'],'아. 주문한 눈썹과 눈매, 입술만 살려두면 나머지 얼굴은 그대 마음대로 꾸며도 좋네.'],draw:['검은 머리에 가느다란 은빛 세로 브릿지 한 줄을 넣게. 앞머리 끝에 한정할 필요는 없네.','눈썹은 양쪽 모두 검게. 양쪽 눈 위에는 얇은 검정 쌍꺼풀 선을 그어주게.','입술에는 빨강을 불투명도 15~30%로 얇게 올리게.','주문한 화장 외의 얼굴은 자유롭게 꾸미게. 그대의 감각도 보고 싶군.'],attach:['화면 왼쪽에는 왼쪽 큰 뿔, 오른쪽에는 오른쪽 큰 뿔. 이렇게 한 쌍을 붙이거나 머리 위에 티아라 하나를 올려주게.','둘 중 한 차림이면 충분하네. 그 밖의 장식은 제외하게.']};
 const details=phase===1?{cut:['반대쪽 뿔을 보고 높이와 굵기를 맞추게. 발모제로 채우고 망치·정으로 다듬으면 되네.','얼굴 쪽에 낸 구멍은 작은 동안 메울 수 있네. 선을 넘으면 그 즉시 야차일세.','상단·옆면 외형은 원래 투구 크기의 삼 할까지 늘려도 좋네.'],draw:request.draw,attach:request.attach}:{cut:['좌우는 화면 기준일세. 왼쪽 귀 전체, 오른쪽 귀는 아래가 드러나고 끝만 머리에 가리면 되네.','귓불 아래의 초록색 머리는 덜어내고, 두 눈과 양쪽 눈썹은 드러내게. 정수리 모양은 그대에게 맡기지.','손질 가이드는 초록 부분을 덜고, 금빛 안쪽을 남기거나 채우는 표시일세.'],draw:['은빛 브릿지는 머리카락 안에서 세로로 길고 얇게. 도구 크기 1~3 정도면 좋겠네.','금빛 눈썹은 검게 물들이고, 눈썹 아래 하늘색 표시에는 가는 검정 쌍꺼풀 선을 그리게. 도구 크기는 1~2로.','입술의 붉은 표시를 따라 빨강, 불투명도 15~30%, 도구 크기 1~2로 얇게 긋게. 색을 겹쳐 너무 진해졌다면 지우고 다시 칠하면 되네.'],attach:request.attach};
 return {id:DEMON_GUEST_ID,name:'마왕',demon:true,demonPhase:phase,workbookExcluded:false,battle:'none',bindings:{},note:'4일차 마왕. 투구 복원과 미형 미용의 두 페이즈. 미용 성공은 미형 셀카, 고블린은 야차에서만 공개. 야차 전투 미연결.',demonRequest:request,demonRequestDetails:details,
 beauty:{enabled:true,designVersion:2,steps:{cut:true,draw:true,attach:true},weights:{cut:60,draw:30,attach:10},cutTool:phase===1?'hammer':'scissors',growth:{enabled:true,material:phase===1?'horn':'hair',color:phase===1?'#242236':'#ECEBF4',outline:phase===1?'#18151F':'#242236',allowFace:true,region:{x:12,y:6,w:296,h:310}},drawColors:['#242236','#18151F','#4853F8','#ECEBF4'],cutRegions:[{key:'DemonShape',label:notes.cut[0],x:0,y:0,w:320,h:350,kind:'keep',rule:'free',points:60,tolerance:0}],drawRegions:[],attachRegions:[],requestBriefNotes:Object.fromEntries(Object.entries(notes).map(([k,v])=>[k,v.join('\n')])),requestNotes:Object.fromEntries(Object.entries(notes).map(([k,v])=>[k,v.join('\n')]))},
 resultLines:{satisfied:phase===1?'……제법이군. 이제 투구를 벗어도 되겠어.':'훗… 정말 만족스럽군!',angry:'……이게 무엇이냐.',neutral:'……'},basePay:0,tipRate:0};
}
// Existing workbook sheets keep the prose; phase selection stays in project JSON.
export function ensureDemonDialogueCatalogue(project){
 const g=project?.guests?.find(g=>g.id===DEMON_GUEST_ID);if(!g||!project.combat?.sheets)return project;
 g.workbookExcluded=false;
 const rows=name=>project.combat.sheets.find(s=>s.name===name)?.rows||[],groups=rows('대화 그룹'),lines=rows('대사'),links=rows('미용 대사 연결');
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
