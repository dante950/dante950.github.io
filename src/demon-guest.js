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
 leftSide:{x:70,y:176,w:70,h:130,end:194},rightSide:{x:208,y:176,w:60,h:130,end:214},
 eyes:[{x:112,y:150,w:44,h:18},{x:183,y:150,w:44,h:18}],
 browLeft:[[122,144],[116,138]],browRight:{x:182,y:137,w:34,h:13},
 crown:{x:126,y:4,w:80,h:58},earLeft:{x:88,y:157,w:44,h:45},earRight:{x:212,y:157,w:44,h:45}
};
export const DEMON_REQUIREMENTS={
 1:{cut:['양쪽 뿔의 높이·굵기 균형 복원','투구 본체 보존 · 얼굴을 뚫지 않기','상단·옆면 꾸미기는 투구 크기의 30% 안에서'],draw:['기스가 보이지 않게 덮기','짙은 바탕 70% 이상 · 나머지 색은 자유','눈 개구부의 인상 보존'],attach:['작은 장식 최대 두 개 · 안 붙여도 좋음','눈 개구부를 가리지 않기']},
 2:{cut:['화면 왼쪽 귀는 끝까지 드러내기','오른쪽 귀는 끝만 살짝 가리기','왼쪽 구레나룻은 귓불 높이까지','오른쪽 구레나룻은 한 단계 길게','정수리 세 갈래 · 가운데가 가장 높게','두 눈·왼쪽 눈썹 노출 · 가운데 앞머리는 남기기'],draw:['머리는 검정 · 가운데 은빛 부분 제외','가운데 앞머리 끝에 가는 은색 한 줄','왼쪽 눈썹 꼬리를 검정으로 세 칸 올리기','오른쪽 눈썹은 원래대로 · 얼굴은 깨끗이'],attach:['머리 위에 티아라 또는 검은 왕관 하나','귓불에 하트 귀걸이 또는 십자가 하나','그 밖의 장식은 제외']}
};
export const DEMON_LINES={arrival:[['마왕 부하','약속드린 날짜가 되어 마왕님을 모셔왔습니다.'],['몬스터','호오.. 단기간에 미용 실력을 증명했다던 자가 자네인가?'],['몬스터','그럼.. 우선 이 모습부터 맡겨보지']],warning:'그곳은 복원할 곳이 아니다. 손을 멈추게.',warningAgain:'얼굴에는 손대지 말라고 했을 텐데.',face:'그곳까지 칠해 달라고 하지는 않았네. 닦아주게.',color:'검은 머리와 은빛 한 줄. 내 주문을 다시 살펴보게.',sticker:'위치와 수를 다시 보게. 장식에도 격식이 있지.',helmetEye:'눈이 보이는 틈은 남겨두게. 앞을 볼 수는 있어야지.',helmetSticker:'투구보다 장식이 먼저 입장할 기세로군. 조금 줄여주게.'};
export function demonGate(stars){const n=Math.max(0,Math.min(3,Math.floor(Number(stars)||0)));return {stars:n,admitted:n===3,line:n===3?'흠.. 3스타 미용실.. 일단 합격이군.':['별 하나 없는 곳에 내 머리를 맡기라는 것이냐?','흥… 별이 하나뿐인가. 형편없는 미용실이군.','별이 둘이라… 내 머리를 맡기엔 부족하군.'][n]};}
export function demonInside(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
export function demonPolygon(x,y,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function demonStickerFile(p){return (p.sticker.resourceFile||p.sticker.src.split('/').pop()).replace(/\.png$/i,'');}
export function demonRoyalStickers(placements){
 const crowns=[],ears=[],other=[];
 for(const p of placements){const id=demonStickerFile(p);if(['T_tara','T_blackCrown'].includes(id)&&demonInside(p.x,p.y,DEMON_DESIGN.crown))crowns.push(p);else if((id==='T_earring_L'&&demonInside(p.x,p.y,DEMON_DESIGN.earLeft))||(id==='T_earring_R'&&demonInside(p.x,p.y,DEMON_DESIGN.earRight))||(id==='T_Cross'&&(demonInside(p.x,p.y,DEMON_DESIGN.earLeft)||demonInside(p.x,p.y,DEMON_DESIGN.earRight))))ears.push(p);else other.push(p);}
 return [crowns.length===1,ears.length===1,other.length===0&&crowns.length<=1&&ears.length<=1];
}
export function demonJudge(phase,m={}){
 if(phase!==1&&phase!==2)return {success:false,sudden:false,checks:[false,false,false],requirements:{cut:[],draw:[],attach:[]}};
 const requirements=phase===1?{
 cut:[m.hornRatio>=.78&&m.hornRatio<=1.25&&m.hornHeight<=10&&m.hornWidth<=14,m.bodyLoss<=.04&&m.exposure===0,m.growthRatio<=.30],
 draw:[m.scratches>=.90,m.darkBase>=.70,m.eyePaint<=DEMON_HELMET_EYE_PAINT_LIMIT],attach:[m.decorCount<=2&&m.decorArea<=.18,m.decorEyes<=.05]
 }:{cut:[m.leftEar>=.90,m.rightTip>=.35&&m.rightTip<=.85&&m.rightEar>=.90,m.leftSide>=.82&&m.leftOver<=.08,m.rightSide>=.82&&m.rightOver<=.08,m.roof>=.88&&m.roofOver<=.12,m.eyes>=.94&&m.forelock>=.80],
 draw:[m.black>=.97,m.silver>=.85&&m.silverSpill<=Math.max(8,(m.silverTotal||0)*.40),m.brow>=.80,m.rightBrowPaint<=.08&&m.facePaintCore<=demonFacePaintLimit(m.visibleFace)],attach:m.adornments||[false,false,false]};
 const checks=['cut','draw','attach'].map(stage=>requirements[stage].every(Boolean));return {success:checks.every(Boolean),sudden:phase===1&&m.exposure>=DEMON_FACE_LIMIT,checks,requirements};
}
export function demonGuest(phase=1){
 if(phase!==1&&phase!==2)throw Error('마왕 미용은 두 페이즈입니다.');
 const notes=DEMON_REQUIREMENTS[phase];
 const request=phase===1?{cut:['전장의 흔적은 지워주게. 위엄까지 지우지는 말고.','부러진 뿔을 반대쪽과 균형 있게 복원하게. 상단과 옆면의 장식은 그대의 안목을 보겠네.','단, 투구 안을 들여다볼 생각은 버리게.'],draw:['기스가 남아 보이지 않게 덮어주게.','짙은 바탕은 일곱 할 이상 남기고, 나머지 색과 무늬는 맡기지.','눈이 보이는 틈은 가리지 말게. 앞을 볼 수는 있어야지.'],attach:['작은 장식은 두 개까지 허락하겠네. 안 붙여도 좋고.','눈이 보이는 틈을 가리거나, 투구보다 장식이 커서는 곤란하네.']}:{cut:['내 주문은 간단하네.','왼쪽 귀는 전부 드러내게. 오른쪽은 끝만 살짝 가리고. 모든 말을 들을 생각은 없으니.','왼쪽 구레나룻은 귓불까지. 오른쪽은 그보다 한 단계 길게 남기게.','정수리는 세 갈래. 가운데가 가장 높아야 하네.','두 눈과 왼쪽 눈썹은 드러내되, 가운데 앞머리 한 가닥은 남기게.','머리는 검게. 가운데 앞머리 끝에만 가느다란 은빛 한 줄을 남겨두게.','왼쪽 눈썹 끝은 세 칸 올리고, 오른쪽은 그대로. 분노와 관용이 동시에 보여야 하니.','머리 위에는 티아라나 검은 왕관 하나. 왕관이 없다고 누가 왕인지 헷갈려서는 곤란하지.','……이상일세.',['플레이어','방금 미용 주문하신 거 맞죠? 국가 운영 방침 아니고?'],['마왕 부하','오늘은 상당히 간소하게 말씀하신 편입니다.'],'아. 귓불의 하트 귀걸이나 십자가 하나를 빠뜨렸군. 좌우는 거울에 보이는 쪽을 기준으로 하게.'],draw:['머리는 검게. 가운데 앞머리 끝에만 은빛 한 줄일세.','왼쪽 눈썹 꼬리는 검정으로 세 칸 올리고, 오른쪽 눈썹은 그대로 두게.','눈썹 밖 얼굴에 남은 색은 닦아주게.'],attach:['티아라나 검은 왕관을 머리 위에 하나 올려주게. 왕관이 없다고 누가 왕인지 헷갈려서는 곤란하지.','귀에는 좌우에 맞는 하트 귀걸이, 또는 십자가 하나. 그 밖의 장식은 제외하게.']};
 const details=phase===1?{cut:['반대쪽 뿔을 보고 높이와 굵기를 맞추게. 발모제로 채우고 망치·정으로 다듬으면 되네.','얼굴 쪽에 낸 구멍은 작은 동안 메울 수 있네. 선을 넘으면 그 즉시 야차일세.','상단·옆면 외형은 원래 투구 크기의 삼 할까지 늘려도 좋네.'],draw:request.draw,attach:request.attach}:{cut:['좌우는 화면 기준일세. 왼쪽 귀 전체, 오른쪽 귀는 아래가 드러나고 끝만 머리에 가리면 되네.','구레나룻은 가이드의 길이 범위에 맞추게. 정수리의 가운데 갈래는 양옆보다 높게.','손질 가이드는 초록 부분을 덜고, 금빛 안쪽을 남기거나 채우는 표시일세.'],draw:['은빛 줄과 왼쪽 눈썹 꼬리는 손질 가이드에 표시해두었네. 작은 손떨림까지 따지지는 않겠네.','머리의 검정 염색, 은빛 줄, 눈썹 꼬리의 모양을 함께 살피게.'],attach:request.attach};
 return {id:DEMON_GUEST_ID,name:'마왕',demon:true,demonPhase:phase,workbookExcluded:true,battle:'none',bindings:{},note:'4일차 마왕. 투구 복원과 미형 미용의 두 페이즈. 미용 성공은 미형 셀카, 고블린은 야차에서만 공개. 야차 전투 미연결.',demonRequest:request,demonRequestDetails:details,
 beauty:{enabled:true,designVersion:2,steps:{cut:true,draw:true,attach:true},weights:{cut:60,draw:30,attach:10},cutTool:phase===1?'hammer':'scissors',growth:{enabled:true,material:phase===1?'horn':'hair',color:phase===1?'#242236':'#ECEBF4',outline:phase===1?'#18151F':'#9695AB',allowFace:true,region:{x:12,y:6,w:296,h:310}},drawColors:['#242236','#18151F','#4853F8','#ECEBF4'],cutRegions:[{key:'DemonShape',label:notes.cut[0],x:0,y:0,w:320,h:350,kind:'keep',rule:'free',points:60,tolerance:0}],drawRegions:[],attachRegions:[],requestBriefNotes:Object.fromEntries(Object.entries(notes).map(([k,v])=>[k,v.join('\n')])),requestNotes:Object.fromEntries(Object.entries(notes).map(([k,v])=>[k,v.join('\n')]))},
 resultLines:{satisfied:phase===1?'……제법이군. 이제 투구를 벗어도 되겠어.':'훗… 정말 만족스럽군!',angry:'……이게 무엇이냐.',neutral:'……'},basePay:0,tipRate:0};
}
export function installDemonDialogue(project,g){
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
