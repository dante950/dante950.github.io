// Short, contextual instructions use the same tools as the selected customer.
export function playGuideContent(kind,guest){
 if(kind==='battle')return {label:'첫 야차 · 조작 안내',title:'피하고, 때리고, 빈틈을 잡으세요',intro:'야차는 손님과 겨루는 전투입니다. 공격 예고를 보고 안전한 칸으로 움직이세요.',cards:[
  {key:'W A S D',title:'예고를 피해 이동',text:'바닥에 공격 예고가 나타나면 다른 칸으로 이동하세요.'},
  {key:'마우스 클릭',title:'몬스터를 때리기',text:'몬스터를 클릭하면 기본 공격합니다. 다시 공격할 준비가 되면 한 번 더 클릭하세요. 노란 무력화 바를 모두 줄이면 빈틈이 열립니다.'},
  {key:'누른 채 ↔',title:'빈틈에는 가위 연타',text:'빈틈이 열리면 몬스터 위에서 마우스를 누른 채 좌우로 여러 번 긁으세요. 클릭만 하거나 가만히 누르고 있으면 가위가 적중하지 않습니다.'}
 ],note:'안내를 닫으면 야차가 시작됩니다. 전투 중 일시정지 버튼이나 Esc로 쉴 수 있어요.',action:'준비됐어요 · 야차 시작'};
 const b=guest?.beauty||{},hammer=b.cutTool==='hammer',cards=[];
 if(b.steps?.cut){cards.push({key:hammer?'클릭 · 드래그':'누르기 → 끌기 → 놓기',title:hammer?'망치·정으로 조금씩 다듬기':'가위로 선을 그어 자르기',text:hammer?'망치·정을 고른 뒤 깎을 곳을 누르거나 드래그하세요.':'자를 곳을 마우스로 누르고 선을 그은 뒤 놓으면 잘립니다.'});if(b.growth?.enabled!==false)cards.push({key:'누른 채 바르기',title:'발모제로 다시 기르기',text:b.growth?.connected?'붙어 있는 뿔 위에서 시작해 이어 바르세요. 눈을 피하며 원하는 모양으로 다시 다듬을 수 있어요.':'발모제를 고르고 늘릴 곳에 누른 채 바르세요. 길어진 부분은 다시 다듬을 수 있어요.'});}
 if(b.steps?.draw)cards.push({key:'색 선택 → 드래그',title:'색·무늬 꾸미기',text:'색을 고르고 누른 채 칠하세요. 도구 크기로 굵기를 조절하고, 실수하면 색만 지우거나 되돌릴 수 있어요.'});
 if(b.steps?.attach)cards.push({key:'장식 선택 → 클릭',title:'장식 붙이기',text:'장식을 고른 뒤 붙일 곳을 클릭하세요. 이미 붙인 장식은 다시 클릭하면 뗄 수 있어요.'});
 return {label:'첫 미용 · 조작 안내',title:'손님의 부탁을 듣고 손질하세요',intro:'부탁이 헷갈리면 “네?”로 다시 물어보세요. 왼쪽 메모와 ‘손질 가이드’에서 필요한 부분을 확인할 수 있어요.',cards,note:'각 단계가 끝나면 ‘다음 단계’를 누르세요. 마지막에는 ‘미용 완성’으로 결과를 확인합니다.',action:'알겠어요 · 손질 시작'};
}
