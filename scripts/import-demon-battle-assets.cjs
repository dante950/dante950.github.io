// Deterministic extraction from the supplied artwork. Source files are never changed.
const fs=require('fs'),path=require('path'),sharp=require('sharp'),zlib=require('zlib');
const source=process.argv[2],dest='public/media/demon-battle';
if(!source)throw Error('Pass the simulator asset directory.');
fs.mkdirSync(dest,{recursive:true});
const battle=path.join(source,'애니메이션/전투/마왕'),sprites=path.join(source,'캐릭터/몬스터/마왕');
(async()=>{
 const manifest={};
 await sharp('public/media/demon/goblin.png').trim().png().toFile(dest+'/goblin-portrait.png');
 function add(key,file,fw,fh,count,cols){manifest[key]={src:'./media/demon-battle/'+file,fw,fh,count,cols,file};}
 const sheets=[['demon_idle1','T_Adversary_Phase1.png',208,231,1,1],['demon_idle2','T_Adversary_Phase2.png',151,182,1,1],['demon_idle3','T_Adversary_Phase3.png',175,97,1,1],['demon_cross','T_Combat_Finalboss_explosion_cross.png',509,316,6,3],['demon_down','T_Combat_Finalboss_explosion_down.png',509,316,6,3],['demon_up','T_Combat_Finalboss_explosion_up.png',509,316,9,3],['demon_explosion_return','T_Combat_Finalboss_explosion_retrival.png',509,316,9,3],['demon_slash','T_Combat_Finalboss_slash_attack.png',509,316,9,3],['demon_charge','T_Combat_Finalboss_slash_charge.png',509,316,6,3],['demon_slash_return','T_Combat_Finalboss_slash_retrival.png',509,316,6,3]];
 for(const [key,file,fw,fh,count,cols]of sheets){fs.copyFileSync(path.join(sprites,file),dest+'/'+key+'.png');add(key,key+'.png',fw,fh,count,cols);}
 for(const [key,file,fw,fh,count,cols]of [['demon_beam','T_Finalboss_2nd_beam_sheet.png',244,199,19,5],['demon_mirror_center','T_Finalboss_2nd_mirror_center_sheet.png',102,174,17,5],['demon_mirror_side','T_Finalboss_2nd_mirror_left_right_sheet.png',55,87,13,4],['demon_hit','T_Finalboss_Hit.png',264,231,1,1],['demon_hit3','T_Finalboss3_Hit.png.png',935,755,1,1]]){fs.copyFileSync(path.join(battle,file),dest+'/'+key+'.png');add(key,key+'.png',fw,fh,count,cols);}
 // The GIF is a staging preview on gray, with a beige target and a red baseline.
 // Extract its colored character/effects only; exact neutral gray, target and baseline are removed.
 const gif=path.join(battle,'DemonKing3Pase.gif');
 async function frame(page){const {data,info}=await sharp(gif,{page,pages:1}).ensureAlpha().raw().toBuffer({resolveWithObject:true});let minX=info.width,minY=info.height,maxX=0,maxY=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){let i=(y*info.width+x)*4,r=data[i],g=data[i+1],b=data[i+2];const neutral=r===144&&g===144&&b===144,target=r===230&&g===202&&b===177,ground=r===193&&g===40&&b===40;
 if(neutral||target||ground||y>info.height*.88)data[i+3]=0;else if(data[i+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
 if(maxX<minX)throw Error('Empty GIF pose '+page);
 return sharp(data,{raw:info}).extract({left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1}).resize({height:240,kernel:'nearest'}).png().toBuffer();}
 // 26 and 30 are the two distinct tracking strikes; 0-16 is the iaido sequence.
 for(const [key,pages]of [['demon_double1',[26]],['demon_double2',[30]],['demon_iaido',[0,8,9,10,11,12,13,14,15,16]]]){let images=await Promise.all(pages.map(frame)),meta=await Promise.all(images.map(b=>sharp(b).metadata())),w=Math.max(...meta.map(m=>m.width));await sharp({create:{width:w*pages.length,height:240,channels:4,background:'#00000000'}}).composite(images.map((input,i)=>({input,left:i*w+Math.floor((w-meta[i].width)/2),top:0}))).png().toFile(dest+'/'+key+'.png');add(key,key+'.png',w,240,pages.length,pages.length);}
 // BossMirror is a mesh/material prefab, not a sprite. Project its actual triangles
 // into web sprites; Unity shader lighting is approximated, geometry is preserved.
 const tar=zlib.gunzipSync(fs.readFileSync(path.join(battle,'BossMirror.unitypackage'))),entries={};
 for(let o=0;o+512<tar.length;){const n=tar.subarray(o,o+100).toString().split('\0')[0];if(!n)break;const size=parseInt(tar.subarray(o+124,o+136).toString().replace(/\0/g,''),8)||0;entries[n]=tar.subarray(o+512,o+512+size);o+=512+Math.ceil(size/512)*512;}
 const colors={Frame:'#151c35',Glass:'#a9d8f3',Outline:'#07152b',Gem:'#4fb5f7',Blue:'#2b50a3',Silver:'#c5d9e8'};
 for(const [key,angle]of [['demon_tile_mirror',0],['demon_tile_mirror_turned',.7]]){const faces=[];
 for(const [n,value]of Object.entries(entries)){if(!n.endsWith('/asset'))continue;const txt=value.toString(),name=txt.match(/m_Name: SM_BossMirror_(\w+)/)?.[1];if(!name)continue;const hex=txt.match(/_typelessdata: ([a-f0-9]+)/)?.[1],idx=txt.match(/m_IndexBuffer: ([a-f0-9]+)/)?.[1];if(!hex||!idx)continue;const bytes=Buffer.from(hex,'hex'),indices=Buffer.from(idx,'hex'),verts=[];for(let i=0;i<bytes.length;i+=64){const x=bytes.readFloatLE(i),y=bytes.readFloatLE(i+4),z=bytes.readFloatLE(i+8);verts.push([x*Math.cos(angle)+z*Math.sin(angle),y,z*Math.cos(angle)-x*Math.sin(angle)]);}for(let i=0;i<indices.length;i+=6){let v=[0,2,4].map(k=>verts[indices.readUInt16LE(i+k)]);faces.push({z:v.reduce((s,p)=>s+p[2],0)/3,points:v.map(p=>(128+p[0]*110).toFixed(2)+','+(145-p[1]*110).toFixed(2)).join(' '),color:colors[name]||'#254175'});}}
 faces.sort((a,b)=>a.z-b.z);const svg='<svg xmlns="http://www.w3.org/2000/svg" width="256" height="280">'+faces.map(f=>'<polygon points="'+f.points+'" fill="'+f.color+'"/>').join('')+'</svg>';await sharp(Buffer.from(svg)).png().toFile(dest+'/'+key+'.png');add(key,key+'.png',256,280,1,1);}
 fs.writeFileSync(dest+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');const assets=JSON.parse(fs.readFileSync('src/combat/assets.json'));Object.assign(assets.images,manifest);fs.writeFileSync('src/combat/assets.json',JSON.stringify(assets,null,2)+'\n');console.log('Extracted '+Object.keys(manifest).length+' assets.');
})();
