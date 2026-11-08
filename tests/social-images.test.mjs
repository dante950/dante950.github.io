import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {DEFAULT_SOCIAL_CATALOG as catalog,SOCIAL_IMAGE_ASSETS,socialReviewPost,ensureSocialCatalogue,socialCatalogueProblems} from '../src/social-catalog.js';
import {photoMarkup} from '../src/closing/social-ui.js';
test('all 28 supplied assets exist and published/default mappings agree',async()=>{
 assert.equal(SOCIAL_IMAGE_ASSETS.length,28);assert.equal(new Set(SOCIAL_IMAGE_ASSETS.map(a=>a.path)).size,28);
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
