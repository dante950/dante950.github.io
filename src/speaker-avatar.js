// Existing character art supplies dialogue icons; names remain available to assistive tools.
export function speakerAvatarSource(speaker,guest={},assets={}){
 if(['내레이션','나레이션',''].includes(speaker||''))return '';
 if(speaker==='플레이어'||speaker==='야차')return './media/4b01d6d010aabf733b346047.png';
 if(speaker==='마왕 부하')return assets.minion?.portrait||assets.minion?.full||'./media/minion-guide.png';
 if(speaker==='커피 유령')return guest.skin?.portrait||'./media/coffee-ghost/head-base.png';
 if(speaker==='마왕')return './media/intro/intro-1.png';
 if(guest.id===10004)return assets.minion?.portrait||guest.skin?.portrait||guest.skin?.full||'./media/minion-guide.png';
 if(guest.id===10003)return assets.sansHeadCropped||guest.skin?.head||assets.sans||'';
 if(guest.id===10002)return assets.drunkFull||guest.skin?.full||'';
 return assets.zombieHead||guest.skin?.head||guest.skin?.full||'';
}
export function updateSpeakerAvatar(node,speaker,guest={},assets={}){
 if(!node)return;const src=speakerAvatarSource(speaker,guest,assets),key=speaker+'|'+src;
 if(node.dataset.avatarKey===key)return;node.dataset.avatarKey=key;node.hidden=!src;
 node.dataset.kind=speaker==='플레이어'||speaker==='야차'?'player':speaker==='마왕'?'king':'monster';
 const image=node.querySelector('img');if(src)image.src=src;else image.removeAttribute('src');image.alt=speaker||'';
}
