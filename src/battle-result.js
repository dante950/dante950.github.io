const RESULT_ART='./media/battle-results/';
export function resultFollowerMessage(gain,lastGuest=false,protectedAmount=0){
 const next=lastGuest?'영업을 마칩니다.':'다음 손님으로 넘어갑니다.';
 if(gain<0)return '팔로워 '+Math.abs(gain).toLocaleString('ko-KR')+'명 감소 후\n'+next;
 if(gain>0)return '팔로워 '+gain.toLocaleString('ko-KR')+'명 획득 후\n'+next;
 return (protectedAmount>0?'스타 안전장치로 팔로워 유지 후\n':'팔로워 변동 없이\n')+next;
}
export function showBattleResult({outcome,monsterID=10001,portrait='',canAccept=true,gain=0,protectedAmount=0,lastGuest=false,onRetry=()=>{},onContinue=()=>{}}={}){
 const win=outcome==='victory',previous=document.activeElement,root=document.createElement('section');
 root.className='yacha-result';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',win?'야차 승리':'야차 패배');root.dataset.outcome=outcome;
 const board=document.createElement('div');board.className='yacha-result-board';root.append(board);
 const bg=document.createElement('img');bg.className='yacha-result-bg';bg.src=RESULT_ART+(win?'T_VictoryYacha.png':'T_DefeatYacha.png');bg.alt=win?'VICTORY YACHA':'DEFEAT YACHA';board.append(bg);
 const sprite=document.createElement('img');sprite.className='yacha-result-sprite';sprite.dataset.monster=String(monsterID);sprite.alt=win?'주인공 승리 포즈':'상대 몬스터 승리 포즈';
 const name={10001:'T_ZombieWin.png',10003:'T_SansWin.png',10004:'T_MidBossWin.png'}[monsterID];
 sprite.src=win?RESULT_ART+'T_PlayerWin.png':name?RESULT_ART+name:portrait;board.append(sprite);
 const menu=document.createElement('div');menu.className='yacha-result-menu';board.append(menu);let done=false;
 function dispose(){if(done)return;done=true;window.removeEventListener('keydown',key,true);root.remove();previous?.focus?.();}
 function finish(action){if(done)return;dispose();action();}
 if(win){const next=document.createElement('button');next.className='yacha-result-next';next.setAttribute('aria-label','클릭하여 넘어가기');next.textContent='';next.style.width='18%';next.style.height='8%';next.onclick=()=>finish(onContinue);board.append(next);board.onclick=()=>finish(onContinue);}
 else {
  const options=[['retryBattle','야차 재도전','재도전해도 팔로워는 감소하지 않습니다.',onRetry]];
  if(canAccept)options.push(['lossContinue',lastGuest?'패배 인정 · 영업 마치기':'패배 인정 다음 손님',resultFollowerMessage(gain,lastGuest,protectedAmount),onContinue]);
  for(const [id,label,help,action] of options){const button=document.createElement('button');button.id=id;button.className='yacha-result-choice';const title=document.createElement('span');title.textContent=label;const description=document.createElement('small');description.textContent=help;button.append(title,description);button.onclick=()=>finish(action);button.onfocus=()=>select(button);button.onpointerenter=()=>button.focus({preventScroll:true});menu.append(button);}
 }
 function select(active){for(const button of menu.children){const focused=button===active;button.classList.toggle('selected',focused);button.setAttribute('aria-pressed',String(focused));}}
 function key(e){if(!root.isConnected)return;const k=e.key.toLowerCase();if(['a','d','arrowleft','arrowright','f','enter',' ','tab','escape'].includes(k)){e.preventDefault();e.stopImmediatePropagation();}else return;if(e.repeat)return;if(win){if(['f','enter',' '].includes(k))finish(onContinue);return;}const buttons=[...menu.children];if(['a','arrowleft'].includes(k))buttons[0]?.focus();if(['d','arrowright'].includes(k))buttons.at(-1)?.focus();if(k==='tab'){const index=buttons.indexOf(document.activeElement);buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}if(['f','enter',' '].includes(k))(menu.querySelector('.selected')||buttons[0])?.click();}
 document.body.append(root);window.addEventListener('keydown',key,true);(menu.firstElementChild||board.querySelector('button'))?.focus({preventScroll:true});
 return dispose;
}
