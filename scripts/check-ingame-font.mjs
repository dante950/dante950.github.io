import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const root=path.resolve('dist'),out=path.resolve('docs/ingame-galmuri9');
await fs.mkdir(out,{recursive:true});
const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html')));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch();
const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));

await p.addInitScript(()=>{const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__canvasFonts??={};window.__canvasFonts[String(text)]=this.font;return fill.call(this,text,...args);};});
const font=async(frame,selector,want=true)=>{const family=await frame.locator(selector).first().evaluate(e=>getComputedStyle(e).fontFamily);assert.equal(family.includes('Galmuri9'),want,selector+': '+family);};
const loaded=async(frame)=>{await frame.evaluate(()=>document.fonts.ready);assert(await frame.evaluate(()=>document.fonts.check('16px Galmuri9','가나다 ABC 0123')));};
const capture=async(name)=>p.screenshot({path:path.join(out,name+'.png')});
try{
 await p.goto(base);await p.locator('#play').waitFor();await font(p,'body',false);await font(p,'#play',false);await capture('main-unchanged');await p.locator('#developer').click();await font(p,'#devScreen',false);
 await p.goto(base);await p.locator('#play').click();await p.locator('[data-start-guest="10006"]').click();await p.locator('#returnEmployed').click();await p.locator('body.playing').waitFor();await loaded(p);await font(p,'#talkText');await font(p,'#talkNext');await p.waitForTimeout(1800);await capture('story-dialogue');
 await p.goto(base+'/tutorial.html?intro=3');await p.locator('#startBusiness').waitFor();await loaded(p);await font(p,'.labbar',false);await font(p,'#labStage');await p.locator('#startBusiness').click();await p.waitForTimeout(3900);await capture('intro');
 await p.locator('#labRestart').click();await p.locator('[data-jump="beauty"]').click();let f=await (await p.locator('#beautyFrame').elementHandle()).contentFrame();await f.waitForFunction(()=>window.beautyDebug?.ready);await loaded(f);await p.locator('#acceptRequest').waitFor();await font(p,'#dialogueText');await p.locator('#acceptRequest').click();await p.locator('#coachClose').click();await f.waitForFunction(()=>!beautyDebug.briefing);await p.waitForTimeout(4200);await font(f,'.requestText');assert(await f.locator('.beautyMoney').evaluate(e=>e.scrollWidth<=e.clientWidth),'followers stay inside the label');await font(f,'[data-tool="grow"]');await capture('beauty');
 for(const width of [1024]){await p.setViewportSize({width,height:768});await p.waitForTimeout(250);await capture('beauty-'+width);}await p.setViewportSize({width:1440,height:900});
 await p.locator('#labRestart').click();await p.locator('[data-jump="battle"]').click();f=await (await p.locator('#battleFrame').elementHandle()).contentFrame();await f.waitForFunction(()=>window.__canvasFonts?.['라이브 채팅']);await loaded(f);await font(f,'body');await f.waitForFunction(()=>Object.values(window.__canvasFonts).some(x=>x.includes('Galmuri9')));const hud=await f.evaluate(()=>Object.fromEntries(Object.entries(window.__canvasFonts).filter(([k])=>['LIVE','HP','무력화','라이브 채팅','시청자 128'].includes(k))));assert(Object.keys(hud).length>=4);for(const v of Object.values(hud))assert(v.includes('Galmuri9'),v);await f.locator('#fightGate').waitFor({state:'hidden'});await f.waitForFunction(()=>window.__canvasFonts?.['커피 유령']);await capture('battle');
 await p.goto(base+'/battle-results.html?case=zombie');await p.locator('.yacha-result').waitFor();await loaded(p);await font(p,'.yacha-result button');await capture('battle-result');
 await p.goto(base+'/closing.html');await p.locator('#closeShop').waitFor();await loaded(p);await font(p,'.toolbar',false);await font(p,'#stage');await p.locator('#closeShop').click();await p.locator('[data-confirm-management]').waitFor({timeout:20000});await font(p,'.bot-bubble');await font(p,'[data-confirm-management]');await capture('phone');await p.locator('[data-confirm-management]').click();await p.locator('#settlement').waitFor();await p.waitForTimeout(1500);await font(p,'#receipt');await font(p,'.post-copy');await capture('receipt');
 assert.deepEqual(errors,[]);console.log('Galmuri9 loaded in story, intro, beauty, battle HUD, result, phone and receipt; main/developer/toolbars unchanged.',hud);
}finally{await browser.close();server.close();}
