async()=>{
 await document.fonts.ready;const rows=[],errors=[];
 for(const e of document.querySelectorAll('.btn:not(.btn-icon) .button-label,.shortcut-label,.score-value,.rank-value,.count,.result-score,.result-note,.ranking-summary,.leaderboard .score,.attempt-tray small,.record-plaque small')){
  const b=e.getBoundingClientRect();if(!b.width||getComputedStyle(e).visibility==='hidden')continue;
  const r=document.createRange();r.selectNodeContents(e);const t=r.getBoundingClientRect();
  const target=e.matches('.button-label:not(.shortcut-label)')?e.closest('button'):e,box=target.getBoundingClientRect(),s=getComputedStyle(target);
  const safe={x:box.x+(parseFloat(s.paddingLeft)||0),y:box.y+(parseFloat(s.paddingTop)||0),right:box.right-(parseFloat(s.paddingRight)||0),bottom:box.bottom-(parseFloat(s.paddingBottom)||0)};
  const lines=[...r.getClientRects()].filter(r=>r.width>0).length;
  const row={text:e.textContent,safe,textRect:{x:t.x,y:t.y,right:t.right,bottom:t.bottom},font:getComputedStyle(e).fontFamily,fontSize:parseFloat(getComputedStyle(e).fontSize),lines};
  if(t.x<safe.x-1||t.right>safe.right+1||t.y<safe.y-2||t.bottom>safe.bottom+2||lines>1)errors.push(row);rows.push(row);
 }
 const board=document.querySelector('.tournament-preview');if(board&&board.getBoundingClientRect().width){const b=board.getBoundingClientRect(),slots=[[.35,.56],[.56,.78],[.78,.95]];[...board.querySelectorAll('.preview-leaders li')].forEach((li,i)=>{for(const e of li.querySelectorAll('span,b')){const r=document.createRange();r.selectNodeContents(e);const t=r.getBoundingClientRect();if(t.top<b.top+slots[i][0]*b.height+3||t.bottom>b.top+slots[i][1]*b.height-3)errors.push({text:e.textContent,reason:'TOP3 painted divider',row:i+1});}});}
 return {rows,errors,fontsReady:document.fonts.status==='loaded'};
}
