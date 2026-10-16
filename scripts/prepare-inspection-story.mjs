import fs from 'node:fs/promises';
const file=new URL('../data/project.json',import.meta.url),p=JSON.parse(await fs.readFile(file,'utf8'));
const before=structuredClone(p),g=p.guests.find(g=>g.id===10004),b=g.beauty;
p.storyIntro=[
 {title:'힘으로 왕이 되었지만',paragraphs:['고블린은 이 세계에서 가장 낮게 취급받는 종족이다. 한 고블린은 야차에서 거듭 승리해, 마침내 마왕의 자리에 올랐다.','하지만 누구도 그의 힘을 보려 하지 않았다. 고블린의 외모와 출신만으로 왕을 인정하지 않았다. 상처는 외모에 대한 집착이 되었고, 마왕은 나라를 돌볼 수도 없게 되었다.']},
 {title:'마왕을 바꿀 손길을 찾아',paragraphs:['“마왕님을 도울 수 있는 누군가를 보내 주십시오.”','마왕 부하의 소환 마법에 이끌려, 인간 세계에 있던 당신이 이곳으로 왔다. 당신에게 맡겨진 일은 미용실을 키우고, 마왕이 만족할 변화를 만드는 것.']},
 {title:'돌아갈 조건, 별 세 개',paragraphs:['마왕의 방문 예정일은 5일차. 하지만 별 세 개를 얻지 못한 가게에는 발도 들이지 않는다. 손님들의 부탁을 해결하고, 후기로 팔로워를 모아 그전까지 미용실을 3스타로 키워야 한다.','마왕이 방문해 미용에 만족하면, 원래 세계로 돌아갈 수 있다. 그 전에 2일차에는 부하가 중간 점검을 하러 온다. 먼저 오늘의 손님부터 맞이하자.']}
];
const lines={
 900115:'점검은 <color=#52609B>손님의 부탁을 얼마나 정확히 이루어 주는지</color> 보겠습니다. 제 부탁으로 시험하지요.',
 900116:'우선 이 뿔부터입니다. 보고서는 정리했는데, 제 머리 위는 아직이군요.\n눈을 찌르면 점검표도 읽을 수 없습니다.',
 900117:'<color=#52609B>눈 세 개는 무사하게, 뿔은 왔을 때보다 가볍게</color> 부탁드립니다.\n모양은 맡기겠습니다. 정해진 답을 베끼는 시험은 아니니까요.',
 900118:'<color=#52609B>세 눈에 닿지 않게</color> 뿔을 다듬어 주세요.\n모양은 자유입니다. 다만 전체 양은 처음보다 줄어야 합니다. 줄여 달랬는데 늘어나면 곤란하겠지요.',
 900120:'이제 본시험입니다. 저는 <color=#52609B>666년 동안 단 한 번도 반차를 승인받지 못했습니다.</color> 무슨 수를 써도 “멀쩡해 보인다”시더군요.\n<color=#52609B>세 눈 아래 모두, 가장 어두운 색으로 다크서클</color>을 만들어 주십시오. 쉬어야 한다는 말이 얼굴만 봐도 전해지도록요.',
 900121:'<color=#52609B>이마의 눈과 안경 쓴 두 눈, 세 눈 아래를 모두</color> 짙게 해 주세요.\n눈 자체와 나머지 얼굴은 깔끔하게. 피곤한 인상을 만드는 솜씨를 보는 거지, 보고서를 못 읽게 하는 시험은 아닙니다.',
 900122:'마지막으로 <color=#D94B4B>코끝에 빨간 코 장식 하나</color>를 붙여 주십시오.\n마왕님이 제 얼굴을 보고 먼저 “오늘은 쉬어라” 하신다면…… 그보다 확실한 실력 증명이 있겠습니까?',
 900123:'<color=#D94B4B>빨간 코는 코 주변에 하나</color>면 됩니다.\n아파 보이되 우스꽝스럽지는 않게. 반차 신청서이지, 궁정 축제 참가 신청서가 아닙니다.',
 900124:'실례합니다. 마왕님의 직속 부하입니다. 예고드린 <color=#FFD166>중간 점검</color>을 하러 왔습니다.\n5일차에 마왕님을 모시려면, 별 세 개에 어울리는 솜씨를 보여 주셔야겠지요.',
 900125:'제게는 한 번도 통과하지 못한 결재가 있습니다. <color=#FFD166>반차 신청.</color>\n저조차 포기한 부탁을 미용으로 이루어 주실 수 있습니까? 오늘은 제가 직접 손님이 되어 확인하겠습니다. 커피는…… 들고 앉아도 되겠지요?',
 900126:'<wave=1.2>호오……</wave> 뿔은 가볍고, 세 눈과 코는 쉬어야 한다는 말을 분명히 전하는군요.\n부탁을 알아듣고 인상을 바꾸는 솜씨, 잘 보았습니다.',
 900127:'이번에는 반차 신청서에 제 얼굴도 첨부해야겠습니다.\n중간 점검에는 좋은 평가를 남기지요. 이 솜씨로 별 세 개까지 올라오십시오.',
 900128:'음…… 의도는 전해집니다. 다만 “당장 쉬어라”보다는 “커피 한 잔 더 마셔라”에 가깝군요.',
 900129:'점검 기록에는 조금 더 다듬을 여지가 있다고 적겠습니다.\n5일차까지 손님들의 부탁을 듣고, 그 차이를 익혀 보십시오. 제 반차도 아직 포기하지 않겠습니다.',
 900130:'<shake=0.8>하아……</shake> 반차를 설득할 얼굴을 부탁드렸는데, 설명해야 할 부분이 더 늘었군요.',
 900131:'중간 점검에는 보완이 필요하다고 남기겠습니다.\n손님이 어떤 모습이 되고 싶은지, 그 말을 놓치지 마십시오. 마왕님을 만날 때도 중요할 겁니다.',
 900132:'점검은 여기까지입니다. 보고서와 반차 신청서를 함께 올리러 가겠습니다.\n다음에 마왕님을 모시고 올 때는, <color=#FFD166>별 세 개</color>가 걸려 있기를 기대하지요.'
};
for(const row of p.combat.sheets.find(s=>s.name==='대사').rows)if(Object.hasOwn(lines,row.DialogueID)){row.Text=lines[row.DialogueID];row.Notes='중간 점검: 한 번도 승인되지 않은 반차를 외모 변화로 설득하는 과제. 로컬 검토 초안.';}
b.cutRegions.find(r=>r.key==='HornArea').label='왔을 때보다 가벼운 뿔';
b.requestNotes.cut='눈 세 개는 무사하게\n뿔은 왔을 때보다 가볍게';
b.requestBriefNotes={cut:b.requestNotes.cut,draw:'세 눈 아래 짙은 다크서클로\n쉬어야 할 얼굴 만들기',attach:'코 주변 빨간 코 하나로\n반차를 설득할 인상 완성'};
b.eyeContactLine='잠깐! 점검하는 눈입니다. 심사위원을 안 보이게 한다고 통과가 되는 건 아닙니다!';
b.eyeContactSecondLine='하아…… 눈은 세 개지만, 재시험 기회까지 세 번인 건 아닙니다.';
b.areaWarningLine='잠깐…… 뿔은 줄여 달라고 말씀드렸습니다. 점검표의 줄 수를 늘릴 생각은 아니시지요?';
b.areaOverflowLine='왔을 때보다 뿔이 더 많군요. “요구 이상의 성과”라고 적기에는 방향이 반대입니다만.';
b.resultLines={satisfied:'좋습니다. 말로는 못 얻은 반차를, 이 얼굴로 설득해 보지요.',neutral:'의도는 알겠습니다. 다만 결재를 뒤집으려면 한 끗이 더 필요하군요.',angry:'하아…… 부탁을 이루는 것과, 얼굴을 바꾸는 것은 다른 일입니다.'};
b.attachHint='코 주변에 빨간 코 하나 · 반차를 설득할 마지막 인상';
g.note='중간 점검 과제: 승인된 적 없는 반차를 받을 수 있는 인상 만들기. 뿔·세 다크서클·빨간 코 판정과 수치 유지. 현 시연은 미용만 연결.';
p.version=14;p.updatedAt=new Date().toISOString();
await fs.writeFile(file,JSON.stringify(p,null,2)+'\n');
const out=new URL('../../onboarding-2026-10-16/',import.meta.url);await fs.mkdir(out,{recursive:true});
await fs.writeFile(new URL('project-before.json',out),JSON.stringify(before,null,2));
await fs.writeFile(new URL('dialogue-changes.json',out),JSON.stringify(Object.entries(lines).map(([id,after])=>({DialogueID:+id,before:before.combat.sheets.find(s=>s.name==='대사').rows.find(r=>r.DialogueID===+id)?.Text,after})),null,2));
console.log('Prepared three intro cards and 18 existing inspection dialogue rows; gameplay values unchanged.');
