// A convenience lock for the public static demo, not server-side authorization.
// The shared password itself is never bundled or stored in browser storage.
export const PASSWORD_CONFIG=Object.freeze({salt:'yachacha-workshop-v1-7ddf1c98-54e8-4e81-a7c3-03c2e7500aa9',iterations:210000,hash:'96688705ef9c66c20b2b351f6cd96ae7f264c8e04e4b9b9255346a1a358dafbc'});
export async function verifyWorkshopPassword(password,config=PASSWORD_CONFIG){
 if(typeof password!=='string'||!password||password.length>256)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const result=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(config.salt),iterations:config.iterations},key,256));
 const expected=config.hash.match(/.{2}/g)?.map(s=>parseInt(s,16));if(expected?.length!==result.length)return false;
 let different=0;for(let i=0;i<result.length;i++)different|=result[i]^expected[i];return different===0;
}
export function createOwnerAccess({verifyPassword=verifyWorkshopPassword,requestUnlock=async()=>false,onChange=()=>{},onMessage=()=>{},now=Date.now}={}){
 let expiresAt=0,timer=null,epoch=0;
 const allowed=()=>expiresAt>now();
 function lock(message=''){epoch++;expiresAt=0;clearTimeout(timer);onChange(null);if(message)onMessage(message);}
 async function unlock(password){const attempt=epoch;if(!await verifyPassword(password)||attempt!==epoch)return false;expiresAt=now()+8*3600000;clearTimeout(timer);timer=setTimeout(()=>lock('잠금 해제 시간이 끝났어요. 비밀번호를 다시 입력해 주세요.'),8*3600000);onChange({expiresAt});return true;}
 return {
  unlock,
  async restore(){lock();return false;},
  async login(){return allowed()||requestUnlock();},
  async verify({quiet=false}={}){return allowed()||(!quiet&&await requestUnlock());},
  async logout(){lock('저장 기능을 다시 잠갔어요.');},
  get allowed(){return allowed();},
  get identity(){return allowed()?{expiresAt}:null;}
 };
}
