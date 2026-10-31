import test from 'node:test';
import assert from 'node:assert/strict';
import {COFFEE_TUTORIAL_FOLLOWERS,createCoffeeTutorialVisit,coffeeTutorialClosingInit,coffeeSaveHandoff,coffeeReadHandoff,coffeeApplyHandoff} from '../src/tutorial/closing.js';
import {runFromStory,closingSummary} from '../src/closing/model.js';
import {followerWidgetData,reviewPost} from '../src/closing/social-model.js';
import {recordStoryVisit} from '../src/story-progress.js';

const storage=()=>{const items=new Map();return {getItem:key=>items.get(key)??null,setItem:(key,value)=>items.set(key,value)};};
const emptyStory=()=>({followers:0,records:[],day:1});

test('completed and skipped tutorial begin Day 1 with the same single reward',()=>{
 const saved=storage(),visit=createCoffeeTutorialVisit({portrait:'data:image/png;base64,AA=='});
 coffeeSaveHandoff(visit,{__state:{seen:{'day-0-coffee':0}}},saved);
 const complete=coffeeApplyHandoff(emptyStory(),coffeeReadHandoff('complete',saved));
 const skipped=coffeeApplyHandoff(emptyStory(),coffeeReadHandoff('skip',saved));
 assert.equal(complete.followers,COFFEE_TUTORIAL_FOLLOWERS);
 assert.equal(skipped.followers,complete.followers);
 assert.equal(complete.records[0].portrait,visit.portrait);
 assert.equal(skipped.records[0].skipped,true);
 assert.equal(complete.records.length,1);
 assert.equal(coffeeApplyHandoff(complete,coffeeReadHandoff('complete',saved)),complete);
 assert.equal(coffeeApplyHandoff(skipped,coffeeReadHandoff('skip',saved)),skipped);
});

test('closing replays the tutorial reward without changing the completed record',()=>{
 const visit=createCoffeeTutorialVisit(),snapshot=structuredClone(visit),message=coffeeTutorialClosingInit('token',visit);
 assert.equal(message.day,0);assert.equal(message.tutorial,true);assert.equal(message.autoClose,true);
 const run=runFromStory(message.records,0);
 for(let i=0;i<5;i++)assert.deepEqual(closingSummary(run),{day:0,start:0,total:100,gain:100,visits:run.visits,eligibleForStar:false});
 assert.equal(run.total,100);assert.deepEqual(visit,snapshot);
 assert.deepEqual(followerWidgetData(run).days,[{day:0,gain:100}]);
 assert.equal(reviewPost(run.visits[0]).draft,true);
});

test('later guest rewards keep the tutorial total and do not replay its gain on Day 1',()=>{
 let story=coffeeApplyHandoff(emptyStory(),coffeeReadHandoff('skip',storage()));
 story={...story,guest:{id:10001,name:'취준좀비'},lastScore:100,lastMood:'happy',outcome:'declined',forcedBattle:false};
 story=recordStoryVisit(story,null);
 assert.equal(story.followers,1600);
 const run=runFromStory(story.records,1),summary=closingSummary(run);
 assert.equal(summary.start,100);assert.equal(summary.gain,1500);assert.equal(summary.total,1600);
 assert.equal(summary.visits.length,1);assert.equal(summary.visits[0].guestId,'zombie');
 assert.deepEqual(followerWidgetData(run).days,[{day:0,gain:100},{day:1,gain:1500}]);
 assert.equal(run.visits[0].guestId,'coffee');
});

test('handoff does not trust stored reward amounts or require browser storage',()=>{
 const saved=storage();coffeeSaveHandoff({...createCoffeeTutorialVisit(),gain:99999,after:99999}, {},saved);
 assert.equal(coffeeReadHandoff('complete',saved).visit.gain,100);
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.equal(coffeeSaveHandoff(createCoffeeTutorialVisit(),{},blocked),false);
 assert.equal(coffeeReadHandoff('complete',blocked).visit.gain,100);
 assert.equal(coffeeReadHandoff('ordinary',saved),null);
});

test('completed closing previews replay coffee review; an explicitly skipped visit does not auto-close',()=>{
 const preview=coffeeTutorialClosingInit('preview',createCoffeeTutorialVisit());
 assert.equal(preview.autoClose,true);assert.equal(preview.records[0].skipped,false);
 assert.equal(reviewPost(runFromStory(preview.records,0).visits[0]).user,'coffee_ghost');
 const skip=coffeeTutorialClosingInit('skip',createCoffeeTutorialVisit({skipped:true}));
 assert.equal(skip.autoClose,false);assert.equal(skip.records[0].skipped,true);
});
