import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {DEFAULT_SOCIAL_CATALOG,ensureSocialCatalogue,socialFeedPosts,socialReviewPost,socialPreviewRecords,socialCatalogueProblems} from '../src/social-catalog.js';
import {runFromStory} from '../src/closing/model.js';
import {chooseComment} from '../src/closing/social-model.js';
import {ensureDemonDialogueCatalogue,installDemonDialogue,demonGuest} from '../src/demon-guest.js';
const catalog=structuredClone(DEFAULT_SOCIAL_CATALOG);
test('authored day-zero through day-three posts exclude discarded and disabled content',()=>{
 assert.equal(catalog.posts.length,24);assert.deepEqual(socialCatalogueProblems(catalog),[]);
 const feed=socialFeedPosts({...runFromStory([],0),social:catalog});
 assert.equal(feed.length,4);assert(feed.every(p=>p.day===0&&!p.guest));
 assert(!socialFeedPosts({...runFromStory([],3),social:catalog}).some(p=>/빗자루/.test(p.title)));
});
test('completed visit, outcome, release day and returning branch control actual reviews',()=>{
 const run=runFromStory(socialPreviewRecords(catalog,3,'beauty'),3);run.social=catalog;
 const success=socialFeedPosts(run);assert.equal(success.filter(p=>p.guest).length,5);assert(success.filter(p=>p.guest).every(p=>p.kind==='beauty'));
 const fail={...runFromStory(socialPreviewRecords(catalog,3,'failure'),3),social:catalog};
 assert.equal(socialFeedPosts(fail).filter(p=>p.guest).length,4);
 const visit={id:'z',guestId:'zombie',day:1,score:0,outcome:'defeat'};
 assert.equal(socialReviewPost(visit,catalog),null);
 assert.equal(socialReviewPost({...visit,score:100,skipped:true},catalog),null);
 const delayed=structuredClone(catalog);delayed.posts.find(p=>p.id==='guest-10001-beauty').day=2;
 assert.equal(socialReviewPost({...visit,score:100},delayed,1),null);assert(socialReviewPost({...visit,score:100},delayed,2));
 const edited=structuredClone(catalog),p=edited.posts.find(p=>p.id==='guest-10006-beauty');
 p.branch='job';p.text='내 작업본 취업 후기';
 const returning={id:'r',guestId:'returningZombie',day:3,beautySuccess:true,score:0,returnBranch:'employed'};
 assert.equal(socialReviewPost(returning,edited).text,p.text);assert.equal(socialReviewPost({...returning,returnBranch:'lottery'},edited),null);
 p.enabled=false;assert.equal(socialReviewPost(returning,edited),null);
});
test('choice replies keep their own author through save and restore',()=>{
 const p=socialFeedPosts({...runFromStory([],1),social:catalog}).find(p=>p.choices.some(c=>c.replyUser!==p.user));
 const choice=p.choices.findIndex(c=>c.replyUser!==p.user),state=chooseComment({},p,choice,'salon_owner');
 assert.equal(state[p.id].comments[1].user,p.choices[choice].replyUser);
 assert.deepEqual(chooseComment({},p,JSON.parse(JSON.stringify(state))[p.id].choiceIndex,'salon_owner'),state);
 assert.deepEqual(chooseComment(state,p,1-choice),state);
});
test('social catalogue edits, empty feeds and uploaded assets survive JSON migration',()=>{
 const p={social:{version:1,posts:[]}};ensureSocialCatalogue(p);assert.equal(p.social.posts.length,0);
 const old={};ensureSocialCatalogue(old);old.social.posts[0].avatar='data:image/png;base64,YQ==';
 const restored=JSON.parse(JSON.stringify(old));ensureSocialCatalogue(restored);assert.deepEqual(restored,old);
 assert.deepEqual(socialCatalogueProblems(restored.social),[]);
 restored.social.posts.push(restored.social.posts[0]);assert(socialCatalogueProblems(restored.social).length);
});
test('exterior departure and ending dialogue retain speakers and authored edits in both phases',async()=>{
 const p=JSON.parse(await fs.readFile(new URL('../data/project.json',import.meta.url),'utf8'));ensureDemonDialogueCatalogue(p);
 const g=p.guests.find(g=>g.id===10007),rows=p.combat.sheets.find(s=>s.name==='대사').rows;
 const departure=rows.filter(r=>r.GroupID===g.bindings.gateDeparture).sort((a,b)=>a.Order-b.Order);
 assert.deepEqual(departure.map(r=>r.Speaker),['마왕 부하','몬스터','마왕 부하']);
 assert.match(departure[1].Text,/시간을 낭비/);assert.match(departure[2].Text,/마왕님/);
 departure[0].Text='수정한 부하 대사';const saved=JSON.parse(JSON.stringify(p));ensureDemonDialogueCatalogue(saved);assert.deepEqual(saved,p);
 for(const phase of [1,2])assert.equal(installDemonDialogue(saved,demonGuest(phase)).bindings.gateDeparture,g.bindings.gateDeparture);
 for(const key of ['gateAfter','battleScene0','endingScene0','endingScene9','returnFarewell','returnAwake','returnMemory'])assert(rows.some(r=>r.GroupID===g.bindings[key]),key);
});
