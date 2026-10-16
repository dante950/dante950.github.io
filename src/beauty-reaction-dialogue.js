// Reaction text shares Dialogue/DialogueGroup; timing and conditions remain salon settings.
export const BEAUTY_REACTIONS=[
 ['eyeContactLine','눈에 닿았을 때 · 첫 항의','세 눈 중 하나라도 뿔에 닿으면 처음 한 번 말해요.','angry'],
 ['eyeContactSecondLine','다시 눈에 닿았을 때 · 두 번째 항의','눈에 닿은 뿔을 치운 뒤 다시 찌르면 말해요. 이후에는 눈 항의를 하지 않아요.','sigh'],
 ['areaWarningLine','뿔을 줄인 뒤 다시 불어날 때','뿔의 목표 면적을 넘도록 다시 기르면 한 번 말해요.','sigh'],
 ['areaOverflowLine','처음보다 뿔이 더 많아졌을 때','처음 방문한 뿔의 면적을 넘으면 한 번 말해요.','angry']
];
const reactionRows=(p,n)=>p.combat.sheets.find(s=>s.name===n)?.rows||[];
export function beautyReactionLines(p,g,key){return reactionRows(p,'대사').filter(l=>l.GroupID===g.bindings?.[key]).sort((a,b)=>a.Order-b.Order);}
export function beautyReactionText(p,g,key){return beautyReactionLines(p,g,key).map(l=>l.Text).join('\n');}
export function beautyWithDialogue(p,g){const b=structuredClone(g.beauty);for(const [key]of BEAUTY_REACTIONS)if(g.bindings?.[key])b[key]=beautyReactionText(p,g,key);return b;}
export function migrateBeautyReactions(p){
 if(!p?.combat?.sheets||!p.guests)return p;
 const groups=reactionRows(p,'대화 그룹'),lines=reactionRows(p,'대사');
 for(const g of p.guests){
  // This established beauty-only guest now participates in the workbook flow.
  if(g.id===10004)g.workbookExcluded=false;
  for(const [key,label]of BEAUTY_REACTIONS){
   const text=g.beauty?.[key];g.bindings??={};
   if(!g.bindings[key]&&typeof text==='string'&&text.trim()){
    const gid=Math.max(80000,...groups.map(r=>r.GroupID))+1;
    groups.push({GroupID:gid,Name:g.name+' · '+label,PlaybackMode:'순서대로',PauseCombat:false,AdvanceMode:'자동',CPS:30,HoldMs:5500,GapMs:100,Notes:'미용 중 반응 · 조건과 재생 시점은 미용 설정',ActorEffect:'없음',FinishEffect:'없음'});
    lines.push({DialogueID:Math.max(900000,...lines.map(r=>r.DialogueID))+1,GroupID:gid,Order:1,Speaker:'몬스터',Text:text,Notes:g.name+' · '+label});
    g.bindings[key]=gid;
   }
   if(g.bindings[key])delete g.beauty[key];
  }
 }
 return p;
}
