// Dedicated dialogue icons. Two-cell source sheets use their first authored 35x35 cell.
export const DIALOGUE_ICONS={king:'T_Boss_Talk1.png',coffee:'T_CoffeeGhost_Talk.png',dwarf:'T_Dwarf_Talk.png',gang:'T_Gang_Talk.png',minion:'T_MidBoss_Talk.png',sans:'T_Sans_Talk.png',zombie:'T_Zombie_Talk.png'};
export function speakerAvatarSource(speaker,guest={},assets={}){
 if(['내레이션','나레이션',''].includes(speaker||''))return '';
 if(speaker==='플레이어'||speaker==='야차')return './media/4b01d6d010aabf733b346047.png';
 const icon=key=>'./media/dialogue-icons/'+DIALOGUE_ICONS[key];
 // Named speakers take precedence over the current guest, including the two endings.
 if(speaker==='마왕 부하')return icon('minion');
 if(speaker==='커피 유령'||speaker==='커피유령')return icon('coffee');
 if(speaker==='마왕')return icon('king');
 if(['취준좀비','좀비','취업 성공 좀비'].includes(speaker))return icon('zombie');
 if(speaker==='샌즈')return icon('sans');
 if(speaker==='취객'||speaker==='드워프')return icon('dwarf');
 if(['양아치두목','양아치 두목'].includes(speaker))return icon('gang');
 const key=guest.demon?'king':({10001:'zombie',10002:'dwarf',10003:'sans',10004:'minion',10005:'coffee',10006:'zombie',10007:'king'})[Number(guest.id)];
 return key?icon(key):guest.skin?.portrait||guest.skin?.head||'';
}
export function updateSpeakerAvatar(node,speaker,guest={},assets={}){
 if(!node)return;const src=speakerAvatarSource(speaker,guest,assets),key=speaker+'|'+src;
 if(node.dataset.avatarKey===key)return;node.dataset.avatarKey=key;node.hidden=!src;
 node.dataset.kind=speaker==='플레이어'||speaker==='야차'?'player':'monster';
 const image=node.querySelector('img');if(src)image.src=src;else image.removeAttribute('src');image.alt=speaker||'';
}
