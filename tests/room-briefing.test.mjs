import test from 'node:test';
import assert from 'node:assert/strict';
import {MinionPresentation} from '../src/tutorial/presentation.js';
import {ROOM_BRIEFING,PRESENTATION_STORY,LOCAL_PRESENTATION_SLIDES,ROOM_BRIEFING_V2,introVariant} from '../src/tutorial/presentation-data.js';
function actor(){const p=Object.create(MinionPresentation.prototype);Object.assign(p,{active:true,roomBriefing:true,clock:0,root:{dataset:{},querySelector:()=>({}),classList:{add(){},remove(){}}},room:{setPose(){},briefing:null},skip:{style:{setProperty(){}}},wait:async()=>true,sound(){},text:{},choices:{},choiceHint:{},nextButton:{},choiceButtons:[{classList:{toggle(){}},setAttribute(){},focus(){}},{classList:{toggle(){}},setAttribute(){},focus(){}}]});return p;}
test('local PT continues from summoning through goals before revealing room',async()=>{
 const p=actor();p.storyIndex=PRESENTATION_STORY.length-1;p.storyBeat();p.finishTyping();p.next();
 assert.equal(p.mode,'slides');assert.equal(p.slideIndex,0);assert.equal(p.revealed,undefined);
 for(let i=0;i<LOCAL_PRESENTATION_SLIDES.length;i++){
  for(const line of LOCAL_PRESENTATION_SLIDES[i].lines){assert.equal(p.fullText,line);p.finishTyping();p.next();}
 }
 await Promise.resolve();assert.equal(p.mode,'briefing');assert.equal(p.revealed,true);assert.equal(p.text.textContent,ROOM_BRIEFING[0][0]);
});
test('ten room bullets advance once per F and warning has its own fighting pose',()=>{
 const p=actor();assert.deepEqual(ROOM_BRIEFING.map(x=>x.length),[2,2,1,2,1,2]);p.briefingBeat(0);let count=0;
 for(let i=0;i<ROOM_BRIEFING.length;i++){const pose=p.room.briefing;for(const line of ROOM_BRIEFING[i]){assert.equal(p.room.briefing,pose);assert.equal(p.text.textContent,line);count++;if(count<10)p.keyDown({key:'f',preventDefault(){},repeat:false});}}
 assert.equal(p.mode,'customer-choice');assert.equal(p.choices.hidden,false);
});
test('skip omits goals and warning, retaining the three-line guest invitation',async()=>{
 const p=actor();Object.assign(p,{waiters:[],generation:0,screenDown:true});p.skipIntro();await Promise.resolve();
 assert.equal(p.briefingIndex,4);assert.equal(p.text.textContent,ROOM_BRIEFING[4][0]);
 p.next();assert.equal(p.text.textContent,ROOM_BRIEFING[5][0]);p.next();assert.equal(p.mode,'customer-choice');
});
test('default presentation retains the original three business slides and wrap-up',()=>{
 const p=actor();p.roomBriefing=false;assert.equal(p.slides.length,3);let raised=false;p.raise=()=>{raised=true;};p.endSlides();assert.equal(raised,true);
});
test('remote cue plays once during raising and is not repeated on the first line',async()=>{const p=actor();const sounds=[];p.sound=k=>sounds.push(k);await p.raiseToRoom(0);const pose=p.room.briefing;p.next();assert.deepEqual(sounds,['remote']);assert.equal(p.room.briefing,pose);});

test('public URL variants resolve without a localhost requirement',()=>{
 assert.equal(introVariant('?intro=1'),1);assert.equal(introVariant('?intro=2'),2);assert.equal(introVariant('?intro=3'),3);
 assert.equal(introVariant('?intro=room-v1'),3);assert.equal(introVariant(''),1);assert.equal(introVariant('?intro=invalid'),1);
});
test('variant two raises after summoning and retains all 14 original bullets',async()=>{
 const p=actor();p.variant=2;p.storyIndex=PRESENTATION_STORY.length-1;p.storyBeat();p.finishTyping();p.next();await Promise.resolve();
 assert.equal(p.mode,'briefing');assert.equal(p.briefingIndex,0);assert.deepEqual(p.briefingLines.map(x=>x.length),[4,3,2,2,3]);let count=0;
 for(let i=0;i<5;i++)for(const line of ROOM_BRIEFING_V2[i]){assert.equal(p.text.textContent,line);assert.equal(p.room.briefing.variant,2);count++;if(count<14)p.next();}
 assert.equal(p.mode,'customer-choice');
});
test('variant two skip preserves the complete last invitation group',async()=>{
 const p=actor();Object.assign(p,{variant:2,waiters:[],generation:0,screenDown:true});p.skipIntro();await Promise.resolve();
 assert.equal(p.briefingIndex,4);assert.equal(p.text.textContent,ROOM_BRIEFING_V2[4][0]);p.next();p.next();assert.equal(p.mode,'customer-choice');
});
