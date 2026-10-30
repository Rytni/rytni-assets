const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('ru-RU');
const logo='../../grib/mushroom-snake-retro-v5/logo.png';
const pickup='../../grib/mushroom-snake-effects-v1/assets/effects/';
export function mobileView(c,settings,{button,image,title,tabs,manual,board,EFFECTS}){
 const h=c.hub,notice=c.message?`<p class="notice">${esc(c.message)}</p>`:'';
 const shell=(kind,heading,content,actions)=>`<section class="mobile-panel mobile-${kind}">${heading}<div class="mobile-content">${content}</div><footer class="mobile-footer">${actions}</footer></section>`;
 if(c.screen==='main'&&!c.startRequest){
  const normal=Math.max(0,Math.min(1,h?.attempts_remaining||0)),used=Math.max(0,Math.min(2,h?.sponsor_attempts_used||0));
  const tokens=(num,total,file)=>Array.from({length:total},(_,i)=>`<img class="${i<num?'':'spent'}" src="${file}" width="28" height="28" alt="">`).join('');
  return `<section class="mobile-main"><img class="mobile-logo" src="${logo}" width="480" height="151" alt="MUSHROOM SNAKE"><div class="mobile-primary">${h?.success&&h.available!==false&&(normal||h.sponsor_attempt_credits)?button('play','ИГРАТЬ','play'):h?.sponsor_attempt_available?button('sponsor','ПОПЫТКА ОТ СПОНСОРА','play'):button('no-attempts','ПОПЫТКИ ИСЧЕРПАНЫ','play')}${button('training','ТРЕНИРОВКА')}</div>${image('snake-hero','mobile-hero')}<nav class="mobile-shortcuts">${[['rules','КАК ИГРАТЬ','guide'],['rating','РЕЙТИНГ','ranking'],['settings','НАСТРОЙКИ','settings']].map(([a,n,i])=>`<button data-action="${a}">${image('icon-'+i)}<span>${n}</span></button>`).join('')}</nav><div class="mobile-compact">${button('mute',settings.muted?'Звук выключен':'Звук включён','icon',settings.muted?'sound-off':'sound')}${button('fullscreen','Полный экран','icon','fullscreen')}</div><section class="mobile-status" aria-label="Статус игрока"><div><small>ЕЖЕДНЕВНЫЕ</small><span class="mobile-tokens">${tokens(normal,1,'../../grib/mushroom-snake-ui-v4-1/icons/attempt-48.png')}<b>${normal}/1</b></span></div><div><small>ОТ СПОНСОРА</small><span class="mobile-tokens">${tokens(h?.sponsor_attempt_credits||0,2,'../../grib/mushroom-snake-ui-v4/icons/sponsor-48.png')}<b>${used}/2</b></span></div><div class="mobile-stat">${image('icon-ranking')}<span><small>РЕКОРД</small><b>${fmt(h?.best_score)}</b></span></div><div class="mobile-stat">${image('icon-stat-length')}<span><small>МЕСТО</small><b>${h?.my_rank?'№'+Number(h.my_rank):'—'}</b></span></div></section>${notice}</section>`;
 }
 if(c.screen==='settings'){
  const tab=c.tab||'sound';const sound=Object.entries({master:'Общая громкость',music:'Музыка',sfx:'Эффекты'}).map(([key,name])=>`<section class="mobile-setting"><label for="volume-${key}">${image('icon-sound')}<span>${name}</span><output id="value-${key}">${Math.round(settings[key]*100)}%</output></label><input id="volume-${key}" type="range" data-setting="${key}" aria-label="${name}" aria-describedby="value-${key}" min="0" max="1" step=".05" value="${settings[key]}" style="--volume:${settings[key]*100}%"></section>`).join('')+`<div class="mobile-toggle">${button('mute',settings.muted?'ВКЛЮЧИТЬ ЗВУК':'БЕЗ ЗВУКА')}</div>`;
  const game=`<section class="mobile-setting"><h3>${image('icon-settings')}Визуальные эффекты</h3>${button('quality',settings.quality==='eco'?'БЕРЕЖНЫЕ':'ЯРКИЕ')}</section><section class="mobile-setting"><h3>${image('icon-fullscreen')}Полный экран</h3>${button('fullscreen',c.fullscreenActive?'ВЫЙТИ':'ОТКРЫТЬ')}</section>`;
  return shell('settings',title('ТВОЙ ЛЕС','НАСТРОЙКИ')+tabs([['sound','ЗВУК'],['game','ИГРА']],tab),tab==='sound'?sound:game,button('back','ГОТОВО'));
 }
 if(c.screen==='rules'){
  const tab=c.tab||'basics';const entries=EFFECTS.slice(tab==='bonuses'?0:5,tab==='bonuses'?5:9);
  const content=tab==='basics'?manual('basics'):entries.map(([,name,file,copy])=>`<article class="mobile-effect"><img src="${pickup+file}-field.png" width="64" height="64" alt=""><div><h3>${name}</h3><p>${esc(copy)}</p></div></article>`).join('');
  return shell('guide',title('ЛЕСНОЙ ПУТЕВОДИТЕЛЬ','КАК ИГРАТЬ')+tabs([['basics','ОСНОВЫ'],['bonuses','БОНУСЫ'],['hazards','ОПАСНОСТИ']],tab),content,button('back','ПОНЯТНО'));
 }
 if(c.screen==='rating')return shell('rating',title('СЕЗОН ЛЕСА','РЕЙТИНГ'),board(h),button('back','НАЗАД'));
 if(c.screen==='mobile-gate'||c.screen==='pause')return shell('gate',title(c.run?'ТЕКУЩАЯ ПОПЫТКА СОХРАНЕНА':'ПОПЫТКА ЕЩЁ НЕ ТРАТИТСЯ','ПОВЕРНИТЕ ТЕЛЕФОН'),image('snake-hero','mobile-hero')+'<div class="rotate-device" aria-hidden="true">↻<span></span></div><p class="notice">Игра запускается в горизонтальном режиме</p><p class="note">'+(c.run?'Вернитесь в горизонтальный режим и продолжите.':'Попытка не тратится до готовности экрана.')+'</p>'+notice,button(c.screen==='pause'?'resume':'gate-confirm','ПОЛНЫЙ ЭКРАН','play')+button(c.run?'exit':'gate-cancel','Главное меню'));
 return null;
}
