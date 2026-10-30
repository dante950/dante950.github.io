import {COFFEE_STICKER_CATALOG} from './stickers.js';
// Local tutorial authoring data. These coordinates and scores are playtest values,
// independent of the published project and Excel/Unity import tables.
export const COFFEE_GUEST_ID=10005;
export const COFFEE_HORNS_ID='TUTORIAL-COFFEE-HORNS-PAIR';

export function createCoffeeGuest(assets){
 const coffeeMedia='./media/coffee-ghost/';
 const coffeeHead={x:68,y:110,w:144,h:116};
 const coffeeHair={x:46,y:66,w:228,h:244};
 const coffeeTrimPolygon=[[6,0],[17,0],[20,9],[22,13],[18,15],[15,19],[13,23],[10,20],[7,16],[6,11]].map(([x,y])=>({x:coffeeHair.x+x*4,y:coffeeHair.y+y*4}));
 const coffeeLayer=(file,box,frame)=>({src:coffeeMedia+file,...box,...(frame===undefined?{}:{sx:frame*36,sy:0,sw:36,sh:29})});
 const coffeeHorns={id:COFFEE_HORNS_ID,name:'부하님을 닮은 뿔 한 쌍',tag:'Tag_Strong',src:assets.minion?.layers?.target?.src||'./media/minion-horns-short.png',w:90,h:83.33};
 const coffeeRegion=(key,label,x,y,w,h,extra={})=>({key,label,x,y,w,h,shape:'rect',kind:'good',points:0,stickerIDs:[],...extra});
 const coffeeSkin={head:coffeeMedia+'head-base.png',hair:coffeeMedia+'hair.png',full:coffeeMedia+'head-base.png',layers:{
  body:coffeeLayer('body.png',{x:116,y:192,w:88,h:112}),
  hands:coffeeLayer('hands.png',{x:52,y:164,w:216,h:72}),
  head:coffeeLayer('head-base.png',coffeeHead),
  material:{...coffeeLayer('hair.png',coffeeHair),whiteKey:true},
  target:coffeeLayer('hair-complete.png',coffeeHair),
  eyes:{neutral:coffeeLayer('eyes-normal.png',coffeeHead),satisfied:coffeeLayer('eyes-happy.png',coffeeHead),angry:coffeeLayer('eyes-angry.png',coffeeHead)},
  mouth:{open:coffeeLayer('mouth-normal-sheet.png',coffeeHead,0),closed:coffeeLayer('mouth-normal-sheet.png',coffeeHead,1)}
 }};
 return {
  id:COFFEE_GUEST_ID,name:'커피 유령',coffeeTutorial:true,tutorialBeauty:false,workbookExcluded:true,battle:'forced',bindings:{},skin:coffeeSkin,
  stickers:[coffeeHorns,...COFFEE_STICKER_CATALOG],
  note:'커피 유령 인트로·튜토리얼 실험실 전용. 리소스는 제공 원화, 미용 영역·점수는 로컬 검토값입니다.',
  beauty:{
   designVersion:2,enabled:true,steps:{cut:true,draw:true,attach:true},weights:{cut:40,draw:30,attach:30},cutTool:'scissors',
   request:'왼쪽 삐죽한 머리와 눈을 가린 앞머리는 자르고, 오른쪽 패인 머리는 길러 주세요.',drawHint:'부하님처럼 이마에 눈 하나를 더 그려주세요.',attachHint:'부하님처럼 머리 위에 뿔 한 쌍을 붙여주세요.',
   requestBriefNotes:{cut:'왼쪽 삐죽한 머리 자르기\n오른쪽 빈 머리 채우기\n앞머리를 잘라 눈 보이게 하기',draw:'이마에 검정 눈 하나 더',attach:'머리 위에 뿔 한 쌍'},
   requestNotes:{cut:'왼쪽 삐죽한 머리 자르기\n오른쪽 빈 머리 채우기\n앞머리를 잘라 눈 보이게 하기',draw:'두 눈 사이 위쪽 점선에\n검정 눈 하나 더 그리기',attach:'머리 위에 뿔 한 쌍만 붙이기'},
   cutRegions:[
    coffeeRegion('Spikes','자를 곳 · 왼쪽 봉우리와 굴곡',46,66,228,244,{rule:'trim',mask:'coffeeTrim',polygon:coffeeTrimPolygon,points:15,tolerance:.20}),
    coffeeRegion('FillHair','기를 곳 · 오른쪽 패인 머리',46,66,228,244,{rule:'cover',mask:'coffeeRestore',points:15,tolerance:.15}),
    coffeeRegion('RevealLeftEye','자를 곳 · 왼쪽 눈 위 앞머리',68,110,144,116,{rule:'clear',mask:'coffeeLeftEye',points:5,tolerance:.08}),
    coffeeRegion('RevealRightEye','자를 곳 · 오른쪽 눈 위 앞머리',68,110,144,116,{rule:'clear',mask:'coffeeRightEye',points:5,tolerance:.08})
   ],
   growth:{enabled:true,material:'hair',mask:'template',allowFace:true,color:'#1CC988',outline:'#0A7B87',region:{x:46,y:42,w:228,h:290}},
   drawColors:['#000000'],drawRequiredRatio:.92,
   drawRegions:[
    coffeeRegion('ThirdEye','그릴 곳 · 세 번째 눈',154,156,32,14,{shape:'ellipse',points:30,requiredCoverage:.55}),
    coffeeRegion('ExistingEyes','피할 곳 · 원래 있던 두 눈',132,170,74,30,{kind:'bad',points:18,tolerance:.12}),
    coffeeRegion('Face','피할 곳 · 나머지 얼굴',108,132,104,86,{shape:'ellipse',kind:'bad',points:12,tolerance:.12})
   ],
   attachTag:'Tag_Strong',attachFirst:30,attachExtra:0,attachWrong:30,attachMisplaced:30,stickerScale:1,
   attachRegions:[coffeeRegion('Horns','붙일 곳 · 머리 위',112,126,96,24,{stickerIDs:[COFFEE_HORNS_ID]})],
   basePay:0,tipRate:0,
   resultLines:{satisfied:'눈도 셋, 뿔도 한 쌍! 이제 부하님을 조금 닮았나요?',neutral:'거울 한 번만 더 봐도 될까요?',angry:'조금만 더 다듬어주시면 괜찮아요!'}
  }
 };
}
