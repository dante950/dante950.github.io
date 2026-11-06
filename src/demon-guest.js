// The fourth-day guest uses the existing salon, dialogue and beauty runtime.
export const DEMON_GUEST_ID=10007;
export const DEMON_FACE_LIMIT=.15;
// The sculpt grid is 160×175. Permit a two-cell contour fringe so a size-4
// brush can restore the horn without having to trace single cells exactly.
export function demonHornAllowance(mask,width,height){
 const allowed=new Uint8Array(mask.length),radius=2;
 for(let n=0;n<mask.length;n++)if(mask[n]){
  const x=n%width,y=Math.floor(n/width);
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
   const xx=x+dx,yy=y+dy;if(dx*dx+dy*dy<=radius*radius&&xx>=0&&xx<width&&yy>=0&&yy<height)allowed[yy*width+xx]=1;
  }
 }
 return allowed;
}
export const DEMON_LINES={
 arrival:[['마왕 부하','약속드린 날짜가 되어 마왕님을 모셔왔습니다.'],['몬스터','호오.. 단기간에 미용 실력을 증명했다던 자가 자네인가?'],['몬스터','그럼.. 우선 이 모습부터 맡겨보지']],
 warning:'그곳은 복원할 곳이 아니다. 손을 멈추게.',
 warningAgain:'얼굴에는 손대지 말라고 했을 텐데.',
 face:'머리만 부탁했네. 얼굴에 묻은 것은 닦아주게.',
 color:'그 색은 눈에 띄는군. 이번에는 검정으로 부탁하네.',
 sticker:'장식은 거추장스럽군. 전투에 나설 때는 필요 없네.'
};
export function demonGate(stars){
 const n=Math.max(0,Math.min(3,Math.floor(Number(stars)||0)));
 return {stars:n,admitted:n===3,line:n===3?'흠.. 3스타 미용실.. 일단 합격이군.':[
 '별 하나 없는 곳에 내 머리를 맡기라는 것이냐?','흥… 별이 하나뿐인가. 형편없는 미용실이군.','별이 둘이라… 내 머리를 맡기엔 부족하군.'][n]};
}
export function demonJudge(phase,m={}){
 if(phase===3)return {success:true,locked:true,sudden:false,checks:[true,true,true]};
 if(phase===1){const checks=[m.horn>=.92&&m.excess<=.06,m.scratches>=.96&&m.bodyLoss<=.02,m.exposure===0];return {success:checks.every(Boolean),sudden:m.exposure>=DEMON_FACE_LIMIT,checks};}
 const checks=[m.trim>=.97&&m.keep>=.55,m.black>=.995&&m.facePaint===0,m.stickers===0];
 return {success:checks.every(Boolean),sudden:false,checks};
}
export function demonGuest(phase=1){
 const notes=phase===1?['투구를 깨끗이 복원','절대 얼굴을 보려하지 말 것']:phase===2?['귀가 드러나도록 머리 정리','머리만 검정색으로 염색','거추장스러운 장식은 제외']:['마음 가는 대로 자유롭게'];
 const request=phase===1?{cut:'뿔과 전투의 흔적을 말끔히 복원해 주게. 다만… 내 얼굴을 보려 하지는 말게.',draw:'투구에 남은 기스도 깨끗이 복원해 주게.',attach:'우선 이 모습부터 맡겨보지.'}:phase===2?{cut:'긴 머리가 전투에 거슬리는군. 귀가 드러나게 다듬고, 머리는 검게 해주게.',draw:'머리만 검정색으로 부탁하네.',attach:'거추장스러운 장식은 제외해 주게.'}:{cut:'이번에는 그대 마음대로 해보아라.',draw:'어떤 색이 어울릴지, 그대에게 맡기겠네.',attach:'이 모습에 어울리는 것을…… 그대에게 맡겨보고 싶군.'};
 return {id:DEMON_GUEST_ID,name:'마왕',demon:true,demonPhase:phase,workbookExcluded:true,battle:'none',bindings:{},note:'기존 본편의 4일차 손님. 야차 미연결. 2페이즈 성공 후 3페이즈 자유 미용.',demonRequest:request,
 beauty:{enabled:true,designVersion:2,steps:{cut:true,draw:true,attach:true},weights:{cut:60,draw:30,attach:10},cutTool:phase===1?'hammer':'scissors',
 shapeTools:phase===3?['scissors','hammer','grow']:undefined,
 growth:{enabled:true,material:phase===1?'horn':'hair',color:phase===1?'#4853F8':'#ECEBF4',outline:phase===1?'#242236':'#9695AB',allowFace:true,region:{x:0,y:0,w:320,h:350}},
 drawColors:['#242236','#18151F','#4853F8','#ECEBF4'],cutRegions:[{key:'DemonShape',label:notes[0],x:0,y:0,w:320,h:350,kind:'keep',rule:'free',points:60,tolerance:0}],drawRegions:[],attachRegions:[],
 requestBriefNotes:{cut:notes.join('\n'),draw:notes.join('\n'),attach:notes.join('\n')},requestNotes:{cut:notes.join('\n'),draw:notes.join('\n'),attach:notes.join('\n')},
 resultLines:{satisfied:phase===1?'……제법이군. 이제 투구를 벗어도 되겠어.':phase===2?'훗… 정말 만족스럽군!':'훗. 이런 차림은 처음이군.',angry:'……이게 무엇이냐.',neutral:'……'},basePay:0,tipRate:0}};
}
export function installDemonDialogue(project,g){
 const rows=n=>project.combat.sheets.find(s=>s.name===n).rows,groups=rows('대화 그룹'),lines=rows('대사'),links=rows('미용 대사 연결');
 const add=(name,texts)=>{
  const id=Math.max(80000,...groups.map(r=>r.GroupID))+1;
  groups.push({GroupID:id,Name:'마왕 · '+name,PlaybackMode:'순서대로',PauseCombat:true,AdvanceMode:'입력',CPS:30,HoldMs:1400,GapMs:100,Notes:'마왕 미용 · 웹 전용',ActorEffect:'없음',FinishEffect:'없음'});
  for(const [i,line]of texts.entries())lines.push({DialogueID:Math.max(900000,...lines.map(r=>r.DialogueID))+1,GroupID:id,Order:i+1,Speaker:Array.isArray(line)?line[0]:'몬스터',Text:Array.isArray(line)?line[1]:line,Notes:'마왕 미용 · 웹 전용'});
  return id;
 };
 g.bindings.arrival=add('등장',DEMON_LINES.arrival);
 for(const stage of ['cut','draw','attach']){
  const id=add(stage,[g.demonRequest[stage]]),old=links.find(r=>r.MonsterID===g.id&&r.Stage===stage);
  const link={MonsterID:g.id,Stage:stage,RequestGroupID:id,DetailGroupID:id};if(old)Object.assign(old,link);else links.push(link);
 }
 return g;
}
export async function prepareDemonSkins(){
 const images={},names=['helmet','face','ears','hair','goblin','goblinHair','stones','king'];
 await Promise.all(names.map(async name=>{const im=new Image();im.src='./media/demon/'+name+'.png';await im.decode();images[name]=im;}));
 const layer=(name,box)=>{const c=document.createElement('canvas');c.width=320;c.height=350;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(images[name],...box);const p=x.getImageData(0,0,320,350);for(let i=0;i<p.data.length;i+=4)p.data[i+3]=p.data[i+3]>100?255:0;x.putImageData(p,0,0);return c;};
 const descriptor=c=>({src:c.toDataURL(),x:0,y:0,w:320,h:350});
 const skins={};
 for(const phase of [1,2,3]){
  const head=layer(phase===3?'goblin':'face',phase===3?[0,0,320,320]:[-17,-7,371,371]),ears=layer('ears',[-17,-7,371,371]);
  if(phase===2)head.getContext('2d').drawImage(ears,0,0);
  const material=layer(phase===1?'helmet':phase===2?'hair':'goblinHair',phase===1?[-12,-10,344,305]:phase===2?[-57,-82,456,456]:[-6,-18,327,327]);
  const target=document.createElement('canvas');target.width=320;target.height=350;const tx=target.getContext('2d');tx.drawImage(material,0,0);
  if(phase===1){const src=tx.getImageData(0,0,320,350).data,out=tx.getImageData(0,0,320,350);for(let y=0;y<117;y++)for(let x=185;x<292;x++){const s=(y*320+318-x)*4,i=(y*320+x)*4;if(src[s+3]&&src[s+2]>110&&src[s]<125&&src[s+1]<145)out.data.set(src.subarray(s,s+4),i);}tx.putImageData(out,0,0);}
  const stones=phase===3?layer('stones',[10,-6,300,300]):null;
  const p=document.createElement('canvas');p.width=320;p.height=350;const px=p.getContext('2d');px.drawImage(head,0,0);px.drawImage(material,0,0);if(stones)px.drawImage(stones,0,0);
  skins[phase]={full:'./media/demon/king.png',head:head.toDataURL(),hair:material.toDataURL(),portrait:p.toDataURL(),layers:{head:descriptor(head),material:descriptor(material),target:descriptor(target),ears:descriptor(ears),...(stones?{stones:descriptor(stones)}:{})}};
 }
 return skins;
}
