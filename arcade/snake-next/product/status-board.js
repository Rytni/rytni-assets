const fmt=n=>Number(n||0).toLocaleString('ru-RU');
const token=(src,active)=>`<img src="${src}" width="20" height="20" class="${active?'':'spent'}" alt="">`;
/** Four intrinsic compartments in one authored nine-slice board. */
export function playerStatusBoard(h){
 const normal=Math.max(0,Math.min(1,h?.attempts_remaining||0)),used=Math.max(0,Math.min(2,h?.sponsor_attempts_used||0)),credit=h?.sponsor_attempt_credits||0;
 return `<section class="player-status-board" aria-label="Статус игрока"><div class="status-grid"><div class="status-block"><small>ЕЖЕДНЕВНЫЕ</small><div class="status-contents"><span class="status-tokens">${[0].map(i=>token('/grib/mushroom-snake-ui-v4-1/icons/attempt-48.png',i<normal)).join('')}</span><b>${normal} / 1</b></div></div><div class="status-block"><small>ОТ СПОНСОРА</small><div class="status-contents"><span class="status-tokens">${[0,1].map(i=>token('/grib/mushroom-snake-ui-v4/icons/sponsor-48.png',i<credit)).join('')}</span><b>${used} / 2</b></div></div><div class="status-block"><small>РЕКОРД</small><strong>${fmt(h?.best_score)}</strong></div><div class="status-block"><small>МЕСТО</small><strong>${h?.my_rank?'№'+Math.max(1,Math.floor(Number(h.my_rank))):'—'}</strong></div></div></section>`;
}
