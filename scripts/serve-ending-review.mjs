import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';
const root=path.resolve('dist');const fixture=`
window.__endingFixture={
 start(records=[]){story=createStoryState(copy(BASE),10007);story.stars=3;story.records=records;story.guest=installDemonDialogue(story.project,demonGuest(2));showPage('story');loadSalon(story.guest);},
 finish(portrait,head){story.portrait=portrait;story.headPortrait=head;story.demonSuccessLocked=true;story.demonEnding={ending:'beauty',status:'returning'};sendSalon('demon-finish',{portrait,headPortrait:head});},
 state(){return {status:story?.demonEnding?.status,session:!!beautyEndingSession,records:story?.records};}
};`;
http.createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!p.startsWith(root+path.sep))throw Error();let b=await fs.readFile(p);if(/^app\..*\.js$/.test(path.basename(p)))b=Buffer.concat([b,Buffer.from(fixture)]);if(/^ending-app\..*\.js$/.test(path.basename(p)))b=Buffer.concat([b,Buffer.from('\nwindow.__endingTest={seek(ms){endingTime=ms;renderEnding();},get(){return {time:endingTime,plan:endingPlan,posts:endingPosts,paused:endingPaused};}};')]);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.woff2':'font/woff2'})[path.extname(p)]||'application/octet-stream');res.end(b);}catch{res.writeHead(404).end();}}).listen(4181,'127.0.0.1',()=>console.log('ending review http://127.0.0.1:4181'));
