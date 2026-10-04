export async function loadAudioBytes(source){
 const response=await fetch(source);
 if(!response.ok)throw Error('음원 파일을 불러오지 못했어요. 연결을 확인한 뒤 다시 시작해 주세요.');
 return response.arrayBuffer();
}
