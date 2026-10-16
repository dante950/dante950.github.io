// Each paragraph is a player-paced beat; older workshop cards remain readable.
export function introBeats(cards){
 return (Array.isArray(cards)?cards:[]).flatMap((card,scene)=>
  (card.paragraphs||[]).map((text,paragraph)=>({
   scene,paragraph,title:card.title||'',image:card.image||'',alt:card.alt||card.title||'',
   speaker:card.speakers?.[paragraph]||card.speaker||'내레이션',text,
   count:card.paragraphs.length,scenes:cards.length
  })));
}

export function mountStoryIntro(host,cards,onFinish){
 const beats=introBeats(cards),events=new AbortController();let index=0,finished=false;
 const dispose=()=>{finished=true;events.abort();};
 const finish=()=>{if(finished)return;dispose();onFinish();};
 if(!beats.length){finish();return dispose;}
 host.innerHTML=`<div class="introToolbar"><span id="introScene"></span><button id="introSkip">이야기 건너뛰기</button></div>
  <button id="introArt" class="introArt" aria-label="다음 설명"><img id="introImage" alt="" draggable="false"></button>
  <div class="introDialogue"><div class="introHeading"><strong id="introSpeaker"></strong><span id="introTitle"></span></div>
  <p id="introText" aria-live="polite"></p>
  <div class="introControls"><span id="introHint">화면 클릭 · Enter / Space로 다음</span><div><button id="introBack">이전</button><button id="introNext" class="primary">다음 →</button></div></div></div>`;
 const get=id=>host.querySelector('#'+id);
 function render(){
  const beat=beats[index],img=get('introImage');
  if(img.getAttribute('src')!==beat.image){
   if(beat.image)img.src=beat.image;else img.removeAttribute('src');
  }
  img.hidden=!beat.image;img.alt=beat.alt;
  get('introScene').textContent=`이야기 ${beat.scene+1} / ${beat.scenes}`;
  get('introTitle').textContent=beat.title;
  get('introSpeaker').textContent=beat.speaker;
  get('introText').textContent=beat.text;
  get('introBack').disabled=index===0;
  get('introNext').textContent=index===beats.length-1?'첫 손님 맞이하기':'다음 →';
  get('introNext').setAttribute('aria-label',index===beats.length-1?'첫 손님 맞이하기':`다음 설명 (${beat.paragraph+1} / ${beat.count})`);
  host.dataset.introBeat=String(index);
  const nextImage=beats.find((b,i)=>i>index&&b.image!==beat.image)?.image;
  if(nextImage){const preload=new Image();preload.src=nextImage;}
 }
 function next(){if(finished)return;if(index===beats.length-1)finish();else{index++;render();}}
 function back(){if(finished||index===0)return;index--;render();}
 host.addEventListener('click',e=>{
  if(e.detail>1)return;
  const button=e.target.closest('button');
  if(button?.id==='introSkip')finish();
  else if(button?.id==='introBack')back();
  else if(button?.id==='introNext'||button?.id==='introArt'||e.target.closest('.introDialogue'))next();
 },{signal:events.signal});
 host.addEventListener('keydown',e=>{
  e.stopPropagation();
  if(e.key==='Tab'){
   const buttons=[...host.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   return;
  }
  if(['Enter',' ','f','F','ArrowRight','ArrowLeft','Escape'].includes(e.key)){
   e.preventDefault();if(e.repeat)return;
   if(e.key==='Escape')finish();
   else if(e.key==='ArrowLeft')back();
   else if(['Enter',' '].includes(e.key)&&document.activeElement?.id==='introSkip')finish();
   else if(['Enter',' '].includes(e.key)&&document.activeElement?.id==='introBack')back();
   else next();
  }
 },{signal:events.signal});
 render();get('introNext').focus();return dispose;
}
