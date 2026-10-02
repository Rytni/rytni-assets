import {Assets,CRITICAL,GAME,prepareCharacter} from './assets.js';
import {SliceTraining} from './training.js';
import {Forest} from './forest.js';
import {Mixer} from './audio.js';

const root=document.getElementById('sn-next'),assets=new Assets(),mixer=new Mixer(),timing={boot:performance.now()},qa=new URLSearchParams(location.search).get('qa')==='1';
let app,gameReady,backTo='main',startToken=0,best=0,disposed=false;
try{best=Number(localStorage.getItem('snake-next-training-best'))||0;}catch{}
function phase(name){root.dataset.loading=name;timing[name]=performance.now();}
function focusScreen(){requestAnimationFrame(()=>{if(disposed)return;root.querySelector('[data-screen]:not([hidden]) button:not(:disabled)')?.focus({preventScroll:true});});}
function screen(ui){
  const session=!!app?.cleanups.length&&ui!=='main'&&ui!=='leave';root.toggleAttribute('data-session',session);
  if(ui==='main'){root.querySelector('#hud').textContent='';root.querySelector('#local-best').textContent=`Личный рекорд тренировки: ${best}`;}
  if(ui==='playing')mixer.startMusic();
  if(ui==='paused')root.querySelector('#pause-copy').textContent=app.pauseReason==='portrait'?'Поверни экран и продолжи тренировку.':app.pauseReason==='scheduler-lag'?'Игра остановлена после задержки браузера. Продолжи, когда будешь готов.':'Твоя тропинка сохранена. Продолжай, когда будешь готов.';
  if(ui==='result'&&app){
    mixer.stopAll();mixer.play(app.state.status==='dead'?'death':'result');
    root.querySelector('#result-score').textContent=app.state.score;root.querySelector('#result-length').textContent=app.state.length;root.querySelector('#result-time').textContent=(app.state.tick/60).toFixed(1)+' с';
    root.querySelector('#result-reason').textContent=app.state.reason==='self'?'Snake встретилась со своим хвостом.':app.state.reason==='obstacle'?'На тропинке оказалось препятствие.':'Лесная тренировка пройдена.';
    best=Math.max(best,app.state.score);try{localStorage.setItem('snake-next-training-best',String(best));}catch{}
  }
  if(ui!=='playing'&&ui!=='geometry')focusScreen();
}
function auxiliary(ui){if(app.ui==='playing')app.pause();backTo=app.ui;app.show(ui);}
function back(){app.show(backTo==='paused'?'paused':'main');}
function main(){startToken++;app.main();}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();}catch{root.querySelector('#diagnostic').textContent='Полный экран недоступен в этом браузере.';}}
function mobile(){return matchMedia('(pointer:coarse)').matches;}
async function start(){
  const token=++startToken;timing.lastStartClick=performance.now();
  // Call resume in the user activation turn, never after an asset await.
  const unlock=mixer.unlock();
  if(innerHeight>innerWidth||mobile()&&!document.fullscreenElement){app.stop();app.show('prompt');await unlock;return;}
  if(root.dataset.loading!=='READY'){app.stop();app.show('loading');root.querySelector('#loading-copy').textContent='Готовим лесную тропинку…';root.querySelector('[data-screen=loading] [data-action=main]').hidden=false;}
  try{await gameReady;await unlock;if(token!==startToken||disposed)return;
    if(innerHeight>innerWidth||mobile()&&!document.fullscreenElement){app.show('prompt');return;}
    app.start();timing.firstForestPaint=performance.now();requestAnimationFrame(()=>{if(token===startToken&&app.ui==='playing')timing.firstForestVisible=performance.now();});mixer.startMusic();mixer.play('arrival');
  }catch{if(token!==startToken||disposed)return;app.show('loading');root.querySelector('#loading-copy').textContent='Лес пока недоступен. Попробуй загрузить его снова.';root.querySelector('[data-action=retry]').hidden=false;}
}
root.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
  const action=button.dataset.action;
  // Critical-load failure has no app yet, but retry must still work.
  if(action==='retry'){location.reload();return;}if(!app)return;
  if(action!=='sound'){void mixer.unlock();mixer.play('click');}
  if(action==='training')await start();
  else if(action==='main')main();
  else if(action==='pause')app.pause();
  else if(action==='resume'){if(innerHeight>innerWidth||mobile()&&!document.fullscreenElement){app.show('prompt');return;}await mixer.unlock();app.resume();}
  else if(action==='how')auxiliary('how');
  else if(action==='settings')auxiliary('settings');
  else if(action==='restart')auxiliary('restart');
  else if(action==='confirm-restart')await start();
  else if(action==='back')back();
  else if(action==='fullscreen')await fullscreen();
  else if(action==='sound'){mixer.muted=!mixer.muted;mixer.apply();button.setAttribute('aria-pressed',String(!mixer.muted));if(mixer.muted)mixer.stopAll();else{await mixer.unlock();if(app.ui==='playing')mixer.startMusic();}}
  else if(action==='continue-landscape'){
    if(!document.fullscreenElement)try{await root.requestFullscreen();}catch{}
    if(innerHeight>innerWidth){root.querySelector('#diagnostic').textContent='Поверни устройство горизонтально.';return;}
    if(app.cleanups.length&&app.state?.status==='playing'){app.show('paused');await mixer.unlock();app.resume();}else await start();
  }
  else if(action==='leave'){startToken++;app.main();mixer.stopAll();app.show('leave');}
});
root.addEventListener('pointerover',event=>{if(event.target.closest('button')&&!event.target.closest('button').disabled)mixer.play('hover');});
root.addEventListener('input',event=>{if(event.target.matches('input[data-volume]')){const key=event.target.dataset.volume;mixer.volumes[key]=Number(event.target.value)/100;mixer.apply();root.querySelector(`output[data-volume=${key}]`).textContent=event.target.value+'%';}});
root.querySelector('#quality').addEventListener('change',event=>{if(assets.forest)assets.forest.ambient=event.target.value==='full';if(app?.renderer)app.paint(app.alpha);});
// Shell navigation is not a session resource. It owns only this standalone root.
window.addEventListener('keydown',event=>{if(!app||event.defaultPrevented||event.code!=='Escape'||event.repeat||['playing','paused'].includes(app.ui))return;if(document.fullscreenElement){event.preventDefault();event.stopImmediatePropagation();void fullscreen();}else if(['how','settings','restart'].includes(app.ui)){event.preventDefault();event.stopImmediatePropagation();back();}});
document.addEventListener('fullscreenchange',()=>{if(app?.ui==='playing'&&mobile()&&!document.fullscreenElement){app.pause();app.show('prompt');}});
window.addEventListener('resize',()=>{if(app?.renderer&&app.ui!=='playing')app.resize();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)mixer.stopAll();});
window.addEventListener('pagehide',()=>{disposed=true;startToken++;app?.stop();mixer.dispose();});

async function boot(){
  phase('CRITICAL_ASSETS');
  try{
    await assets.group(CRITICAL);if(disposed)return;timing.criticalDecoded=performance.now();
    for(const panel of root.querySelectorAll('.sn-panel')){
      const content=document.createElement('div');content.className='sn-content';
      for(const child of [...panel.childNodes])if(!child.classList?.contains('sn-close'))content.append(child);
      panel.append(content);
    }
    for(const key of Object.keys(CRITICAL))root.style.setProperty('--sn-'+key,`url("${assets.get(key).src}")`);
    for(const image of root.querySelectorAll('[data-asset]'))image.src=assets.get(image.dataset.asset).src;
    // DOM image consumers share already-decoded resources; validate before reveal.
    await Promise.all([...root.querySelectorAll('[data-asset]')].map(image=>image.decode()));if(disposed)return;
    root.setAttribute('data-art-ready','');app=new SliceTraining(root,assets,mixer,screen);screen('main');phase('MAIN_READY');timing.mainVisible=performance.now();
    phase('GAME_ASSETS');gameReady=(async()=>{await Promise.all([assets.group(GAME),mixer.load()]);prepareCharacter(assets);assets.forest=new Forest(assets);phase('READY');timing.gameReady=performance.now();})();
    // Handled here too, so a failed optional background load never becomes an
    // unhandled rejection before the player presses Training.
    gameReady.catch(()=>{root.querySelector('#diagnostic').textContent='Лесная тропинка не загрузилась. Повтори загрузку.';});
    window.snakeNext={app,assets,mixer,timing,criticalCount:Object.keys(CRITICAL).length,gameCount:Object.keys(GAME).length,get ready(){return gameReady;}};
    if(qa){const{installQA}=await import('../tests/browser-qa.js');installQA(app);window.snakeDev=app;}
  }catch{root.querySelector('#loading-copy').textContent='Не удалось загрузить лес. Попробуй ещё раз.';root.querySelector('[data-action=retry]').hidden=false;}
}
void boot();
