export const REMOTE_SPRITE='./media/intro/pt/minion-remote.png';
export const REMOTE_DURATION=1200;
export const REMOTE_CLICK_AT=520;
export function remoteFrame(age){return age<220?0:age<520?1:age<800?2:3;}
export function drawRemote(ctx,image,x,feet,height,age){
 if(!image)return false;
 const frame=remoteFrame(Math.max(0,age)),width=image.width/4,scale=height/620;
 // Align the supplied sheet by the character's feet, not uneven transparent margins.
 const anchors=[300,288,286,284];
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(image,frame*width,0,width,image.height,x-anchors[frame]*scale,feet-648*scale,width*scale,image.height*scale);
 ctx.restore();return true;
}
