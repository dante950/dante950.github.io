import test from 'node:test';import assert from 'node:assert/strict';
import {endingReviews,endingSchedule,ENDING_CREDITS} from '../src/ending/model.js';
test('ending only replays completed records and preserves order and portraits',()=>{
 const head='data:image/png;base64,player-styled';
 const records=[{id:10005,day:0,skipped:true},{id:10001,day:1,score:90,outcome:'beauty',headPortrait:head},{id:10002,day:1,outcome:'victory'},{id:10003,day:2,score:10,outcome:'victory'}];
 const before=structuredClone(records),posts=endingReviews(records);
 assert.equal(posts.length,2);assert.deepEqual(posts.map(p=>p.guest),['zombie','sans']);assert.equal(posts[0].portrait,head);assert.equal(posts[1].kind,'battle');assert.deepEqual(records,before);
});
test('no invented reviews when starting at the boss',()=>assert.deepEqual(endingReviews([]),[]));
test('credits and reviews share the exact end time for any count',()=>{for(const count of [0,1,3,6,20]){const s=endingSchedule(count);assert.equal(s.creditMs*ENDING_CREDITS.length,s.total);if(count)assert.equal(s.reviewMs*count,s.total);assert.ok(s.creditMs>=3200);}});
test('credits are in supplied order and contain no email addresses',()=>{assert.equal(ENDING_CREDITS.length,12);assert.deepEqual(ENDING_CREDITS.map(r=>r[2]),['한시윤','고현정','임시현','이수하','신유현','김주형','남연우','한주희','노봄','김가은','송이레','정호준']);assert.ok(!JSON.stringify(ENDING_CREDITS).includes('@'));});
