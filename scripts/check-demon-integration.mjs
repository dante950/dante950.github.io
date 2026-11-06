import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const dist=path.resolve('dist');
const version=JSON.parse(await fs.readFile(path.join(dist,'version.json'),'utf8'));
// Test-only completed-day fixture. Served in memory; never written into dist.
const fixture=`
window.__demonHandoffFixture=stars=>{
 stopChildren();closeModal();
 const total=stars===3?6100:5500;
 story={...createStoryState(BASE,10006),day:3,stars,followers:total,followerFloor:total,
  starSettings:{starThresholds:[5000,5500,6100]},
  records:[{id:10006,day:3,name:'재등장 좀비',before:5000,after:total,gain:total-5000,outcome:'beauty',beautySuccess:true}]};
 showPage('story');settlement();
};
`;
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  const file=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(!file.startsWith(dist+path.sep))return res.writeHead(403).end();
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.ogg':'audio/ogg'})[path.extname(file)]||'application/octet-stream');
  let content=await fs.readFile(file);
  if(path.basename(file)===version.files.app)content=content.toString()+fixture;
  res.end(content);
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
async function nextAll(frame){
 await frame.evaluate(()=>{let n=0;while(window.demonLab.mode==='cutscene'&&n++<100)window.demonLab.advance();});
}
try{
 for(const [name,type]of Object.entries({chromium,webkit})){
  const browser=await type.launch();
  try{
   const page=await browser.newPage({viewport:{width:1280,height:960}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const stars of [2,3]){
    await page.goto(base);
    await page.waitForFunction(()=>typeof window.__demonHandoffFixture==='function');
    await page.evaluate(stars=>window.__demonHandoffFixture(stars),stars);
    const before=await page.evaluate(()=>window.fullflow.story);
    const closing=await page.locator('#storyClosing').elementHandle();
    const closingFrame=await closing.contentFrame();
    await closingFrame.waitForFunction(()=>document.getElementById('closeShop')&&!document.getElementById('closeShop').hidden);
    // This represents the completed recap, testing the real next-day message handler.
    await closingFrame.evaluate(stars=>parent.postMessage({
     source:'yachacha-closing',token:new URLSearchParams(location.search).get('story'),
     type:'next-day',stars,followerFloor:stars===3?6100:5500,settings:{starThresholds:[5000,5500,6100]},socialChoices:{}
    },location.origin),stars);
    const demon=page.frameLocator('#demonVisit');
    await demon.locator('#open').waitFor();
    assert.equal(await demon.locator('#previewSettings').isVisible(),false);
    assert.equal(await demon.locator('#beautyShortcuts').isVisible(),false);
    const after=await page.evaluate(()=>window.fullflow.story);
    assert.equal(after.day,4);assert.equal(after.followers,before.followers);assert.deepEqual(after.records,before.records);
    const frame=await (await page.locator('#demonVisit').elementHandle()).contentFrame();
    await demon.locator('#open').click();
    await frame.waitForFunction(()=>window.demonLab.mode==='cutscene');
    await nextAll(frame);
    if(stars===2){
     await demon.getByRole('heading',{name:'GAME OVER',exact:true}).waitFor();
     await demon.locator('#restart').click();
     await page.locator('#storyStartTitle').waitFor();
     await page.locator('#cancelStoryStart').click();
     assert.equal(await page.evaluate(()=>window.fullflow.story),null);
     assert.equal(await page.evaluate(()=>window.fullflow.page),'home');
    }else{
     await frame.waitForFunction(()=>window.demonLab.mode==='room');
     assert.equal(await page.evaluate(()=>window.fullflow.story.followers),6100);
     await demon.locator('#homeLink').click();
     await page.locator('#demonVisit').waitFor({state:'detached'});
     assert.equal(await page.evaluate(()=>window.fullflow.story),null);
    }
   }
   assert.deepEqual(errors,[]);
   console.log(name+': day-three handoff, earned-star gate, unchanged records and game-over restart passed');
  }finally{await browser.close();}
 }
}finally{await new Promise(r=>server.close(r));}
