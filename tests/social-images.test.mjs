import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {DEFAULT_SOCIAL_CATALOG as catalog,SOCIAL_IMAGE_ASSETS,socialReviewPost,ensureSocialCatalogue,socialCatalogueProblems} from '../src/social-catalog.js';
import {photoMarkup} from '../src/closing/social-ui.js';
test('all 33 supplied assets exist and published/default mappings agree',async()=>{
 assert.equal(SOCIAL_IMAGE_ASSETS.length,33);assert.equal(new Set(SOCIAL_IMAGE_ASSETS.map(a=>a.path)).size,33);
 for(const a of SOCIAL_IMAGE_ASSETS)assert((await fs.stat('public/'+a.path.slice(2))).size>0);
 const project=JSON.parse(await fs.readFile('data/project.json','utf8'));assert.deepEqual(project.social,catalog);assert.deepEqual(socialCatalogueProblems(catalog),[]);
 assert.equal(catalog.posts.filter(p=>p.kind==='world'&&p.imageMode==='image').length,11);
 assert.equal(catalog.posts.find(p=>p.id==='world-day2-1').enabled,false);
 assert(!catalog.posts.some(p=>p.image.endsWith('T_Monstagram_3.png')));
});
test('all six guest variants preserve the actual supplied head portrait',()=>{
 const portrait='data:image/png;base64,AAAA';for(const guestId of ['zombie','sans','minion'])for(const score of [100,0]){
 const p=socialReviewPost({id:'test',day:3,guestId,score,outcome:'victory',headPortrait:portrait},catalog);
 assert.equal(p.portrait,portrait);assert.equal(p.wholePortrait,false);assert.match(p.photo,/imported\/reviews\//);assert.match(p.avatar,/imported\/profiles\//);
 assert(photoMarkup(p).includes('src="'+portrait+'"'));assert(!photoMarkup(p).includes('sample-head'));
 }
});
test('existing authored image choices are preserved when loading projects',()=>{
 const project={social:structuredClone(catalog)};project.social.posts[0].image='https://example.com/custom.png';project.social.posts[0].imageMode='image';project.social.posts[0].avatar='https://example.com/avatar.png';
 const before=JSON.stringify(project);ensureSocialCatalogue(project);assert.equal(JSON.stringify(project),before);
});

test('new coffee and returning-zombie art follows beauty results in either return branch',()=>{
 const portrait='data:image/png;base64,AAAA';
 const coffee=socialReviewPost({id:'coffee',day:0,guestId:'coffee',score:100,headPortrait:portrait},catalog);
 assert.equal(coffee.photo,'./media/social/imported/reviews/coffee-ghost.png');assert.equal(coffee.wholePortrait,false);assert.equal(coffee.portrait,portrait);
 for(const returnBranch of ['employed','lottery'])for(const score of [100,0]){
  const post=socialReviewPost({id:'return',day:3,guestId:'returningZombie',score,returnBranch,headPortrait:portrait},catalog);
  assert.equal(post.photo,'./media/social/imported/reviews/returning-zombie-'+(score?'beauty':'failure')+'.png');assert.equal(post.portrait,portrait);
  assert(photoMarkup(post).includes('src="'+portrait+'"'));assert(!photoMarkup(post).includes('returning-sample-head'));
  const preview=photoMarkup({...post,portrait:null});assert(preview.includes('returning-sample-head'));assert(preview.includes('T_Successzombie_Eye_Normal.png'));
 }
});
