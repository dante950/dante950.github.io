import test from 'node:test';import assert from 'node:assert/strict';
import {reviewVariant,reviewPost,chooseComment,WORLD_POSTS,rollWeather,closingExitAction,followerWidgetData} from '../src/closing/social-model.js';
import {beautyActionMood} from '../src/beauty-action-feedback.js';
import {createRun,completeVisit,closeDay,closingSummary} from '../src/closing/model.js';
test('review follows beauty result even for a forced battle guest; missing copy is explicit',()=>{
 assert.equal(reviewVariant({score:80,forced:true,outcome:'victory',reviewKind:'battle'}),'beauty');
 assert.equal(reviewVariant({score:30,outcome:'victory'}),'battle');
 assert.equal(reviewVariant({score:30,outcome:'beauty'}),null);
 assert.equal(reviewVariant({score:80,outcome:'defeat'}),'beauty');
 const p=reviewPost({guestId:'minion',score:30,outcome:'beauty'});assert(p.draft);assert.equal(p.photo,null);assert.equal(p.comments.length,0);
});
test('choice is once per post; player and author exchange carries no reward',()=>{
 const p=WORLD_POSTS[0],first=chooseComment({},p,1);assert.equal(first[p.id].comments.length,2);assert.equal(first[p.id].comments[0].user,'yacha_vely');assert.equal(first[p.id].comments[1].text,p.choices[1].reply);
 assert.equal(chooseComment(first,p,0),first);assert.deepEqual(chooseComment({},p,99),{});assert.equal(first[p.id].gain,undefined);
});
test('weather includes both endpoints and closing exit gates management',()=>{
 assert.deepEqual(rollWeather(()=>0),{day:22,night:13});assert.deepEqual(rollWeather(()=>.999999),{day:28,night:18});assert.equal(closingExitAction(false),'management');assert.equal(closingExitAction(true),'calendar');
});
test('management replay has no reward side effects',()=>{
 let run=createRun();run=completeVisit(run,'zombie','beauty').run;run=completeVisit(run,'sans','forcedWin').run;run=closeDay(run);const before=JSON.stringify(run);for(let n=0;n<5;n++){closingSummary(run).visits.map(reviewPost);}assert.equal(JSON.stringify(run),before);assert.equal(run.total,3000);
});
test('immediate feedback is a delta; final total cannot keep an angry or happy face',()=>{
 assert.equal(beautyActionMood(90,89),'angry');assert.equal(beautyActionMood(2,3),'satisfied');assert.equal(beautyActionMood(90,90),'neutral');assert.equal(beautyActionMood(0,0,false,true),'angry');assert.equal(beautyActionMood(0,0,true,false),'satisfied');
});
test('follower widget sums real visits per day and never invents a second-star threshold',()=>{
 const run={day:2,total:5200,settings:{threshold:5000},visits:[{day:1,gain:1500},{day:1,gain:1500},{day:2,gain:2200}]};
 assert.deepEqual(followerWidgetData(run),{days:[{day:1,gain:3000},{day:2,gain:2200}],total:5200,remaining:0,achieved:true});
 assert.equal(followerWidgetData({...run,total:3000}).remaining,2000);
 assert.deepEqual(followerWidgetData({...run,day:1,total:0,visits:[]}).days,[{day:1,gain:0}]);
});
test('both days mix passive and interactive posts; review replies match each result',()=>{
 for(const day of [1,2]){assert(WORLD_POSTS.some(p=>p.day===day&&!p.choices));assert(WORLD_POSTS.some(p=>p.day===day&&p.choices?.length));}
 for(const guestId of ['zombie','sans','minion'])for(const score of [30,80]){
  const post=reviewPost({id:'day-1-'+guestId,guestId,score,outcome:'victory'});assert.equal(post.choices.length,2);
  const selected=chooseComment({},post,1);assert.equal(selected[post.id].comments[1].user,post.user);assert.equal(selected[post.id].comments[1].text,post.choices[1].reply);
 }
});
