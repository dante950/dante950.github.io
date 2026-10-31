import test from 'node:test';
import assert from 'node:assert/strict';
import {resultFollowerMessage} from '../src/battle-result.js';
import {recordStoryVisit,storyVisitGain} from '../src/story-progress.js';
import {starProgress,retainedStars} from '../src/star-progress.js';
import {runFromStory,closeDay} from '../src/closing/model.js';
test('accepting a failed visit settles once; retry and minion defeat never settle',()=>{
 const s={guest:{id:10001},day:1,records:[],followers:2200,lastScore:0,forcedBattle:true,outcome:'defeat'};
 assert.equal(recordStoryVisit(s),s);
 const accepted=recordStoryVisit({...s,lossAccepted:true});assert.equal(accepted.followers,2100);assert.equal(accepted.records.length,1);assert.equal(recordStoryVisit(accepted),accepted);
 const minion={...s,guest:{id:10004},lossAccepted:true};assert.equal(recordStoryVisit(minion),minion);
 assert.equal(storyVisitGain({...s,forcedBattle:false}).gain,1500);
});
test('selected hint matches signed settlement and last-guest destination',()=>{
 assert.match(resultFollowerMessage(-100),/100명 감소/);assert.match(resultFollowerMessage(1500),/1,500명 획득/);assert.match(resultFollowerMessage(0),/변동 없이/);assert.match(resultFollowerMessage(-100,true),/영업을 마칩니다/);
});
test('earned stars persist through loss, with a zero floor and correct recovery',()=>{
 const levels=[2100,3000,4000];
 assert.equal(retainedStars(1,2000,levels),1);assert.equal(starProgress(2200,1,levels).ratio,100/900);
 assert.equal(starProgress(2000,1,levels).ratio,0);assert.equal(starProgress(2100,1,levels).ratio,0);assert.equal(starProgress(2200,1,levels).ratio,100/900);
 assert.equal(retainedStars(3,2900,levels),3);assert.equal(starProgress(2900,3,levels).ratio,1);
 assert.equal(retainedStars(1,4500,levels),3);
});
test('closing adapters preserve earned stars across iframe/day boundaries',()=>{
 const r=runFromStory([{id:10004,day:2,before:2200,after:2000,gain:-200}],2,{stars:1});assert.equal(r.stars,1);
 assert.equal(closeDay({...r,status:'salon'}).stars,1);
});
