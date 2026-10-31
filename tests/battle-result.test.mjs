import test from 'node:test';
import assert from 'node:assert/strict';
import {resultFollowerMessage} from '../src/battle-result.js';
import {recordStoryVisit,storyVisitGain} from '../src/story-progress.js';
import {starProgress,retainedStars,followerChange} from '../src/star-progress.js';
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

test('earned-star safety clamps actual followers, not just the meter',()=>{
 const levels=[2100,3000,4000];
 for(const [before,requested,stars,after,gain] of [[2200,-200,1,2100,-100],[2200,-50,1,2150,-50],[2100,-100,1,2100,0],[2100,100,1,2200,100],[3100,-200,2,3000,-100],[4100,-200,3,4000,-100],[2200,-200,0,2000,-200]]){
  const actual=followerChange(before,requested,stars,levels);assert.equal(actual.after,after);assert.equal(actual.gain,gain);assert.equal(actual.requestedGain,requested);
 }
});
test('story preview, record and closing replay agree on the actual protected loss',()=>{
 const s={guest:{id:10001},day:1,records:[],followers:2150,stars:1,followerFloor:2100,lastScore:0,forcedBattle:true,outcome:'defeat',lossAccepted:true};
 const preview=storyVisitGain(s);assert.equal(preview.gain,-50);assert.equal(preview.protectedAmount,50);assert.match(resultFollowerMessage(preview.gain),/50명 감소/);
 const next=recordStoryVisit(s);assert.equal(next.followers,2100);assert.equal(next.records[0].gain,-50);assert.equal(next.records[0].requestedGain,-100);assert.equal(recordStoryVisit(next),next);
 const closing=runFromStory(next.records,1,{stars:1,followerFloor:2100});assert.equal(closing.total,2100);assert.equal(closing.visits[0].gain,-50);assert.equal(closing.followerFloor,2100);
 const atFloor={...s,followers:2100};const protectedResult=storyVisitGain(atFloor);assert.equal(protectedResult.gain,0);assert.match(resultFollowerMessage(0,false,protectedResult.protectedAmount),/스타 안전장치/);
});
test('star is protected only after award; closing transfers its threshold',()=>{
 const run=runFromStory([{id:10004,day:2,before:3000,after:5100,gain:2100}],2);
 const closed=closeDay(run);assert.equal(closed.stars,1);assert.equal(closed.followerFloor,5000);
 const next={guest:{id:10001},day:3,records:run.visits,followers:5050,stars:closed.stars,followerFloor:closed.followerFloor,forcedBattle:true,outcome:'defeat',lossAccepted:true};
 assert.equal(recordStoryVisit(next).followers,5000);
 const retry={...next,lossAccepted:false};assert.equal(recordStoryVisit(retry),retry);
});
