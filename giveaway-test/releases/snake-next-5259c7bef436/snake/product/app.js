import {createMockBackend} from './backend.js';
import {ProductController} from './controller.js';
import {ProductBridge} from './bridge.js';
import {view,EFFECTS} from './ui.js';
import {bodyCell} from '../simulation/body.js';

const params=new URLSearchParams(location.search),preview=params.get('preview'),local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const previewStates={'main-ready':'ready','main-one-attempt':'one-attempt-left','main-sponsor':'sponsor-available','no-attempts':'no-attempts','network-error':'network-error','leaderboard-empty':'leaderboard-empty','result-record':'record-result'};
// This candidate has no automatic live transport. Every URL is safe to open:
// mocks are memory-only and cannot reach Fly or production RPCs.
const backend=createMockBackend(params.get('mock')||previewStates[preview]||'ready');
const release='snake-product-local-v1',settings=loadSettings(),cabinet=document.querySelector('#cabinet'),menu=document.querySelector('#menu'),frame=document.querySelector('#game-frame');
let controller;
const mobile=()=>matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
const gate={ready:()=>!mobile()||innerWidth>innerHeight&&(document.fullscreenElement===cabinet||cabinet.classList.contains('pseudo-fullscreen')),async request(){await fullscreen(true);try{await screen.orientation?.lock?.('landscape');}catch{}return this.ready();}};
const bridge=new ProductBridge(frame,{settings,onPause:()=>controller?.pause(),onResult:stats=>controller?.finish(stats),onAction:action=>dispatch(action)});
controller=new ProductController({backend,bridge,gate,release});
controller.hostSwitch=typeof window.RytniArcadeHub?.leave==='function';
function render(){
 controller.fullscreenActive=document.fullscreenElement===cabinet||cabinet.classList.contains('pseudo-fullscreen');
 document.querySelector('#product').dataset.screen=controller.screen;
 window.SnakeTestHost?.state(controller.screen);
 cabinet.classList.toggle('playing',controller.screen==='playing');
 cabinet.classList.toggle('paused-game',!!controller.run&&['pause','rules','settings','confirm-restart','confirm-exit','mobile-gate'].includes(controller.screen));
 const label=document.querySelector('#run-label');label.hidden=!params.has('qa')||controller.screen!=='playing';label.textContent=controller.run?.mode==='training'?'ТРЕНИРОВКА · БЕЗ РЕЙТИНГА':params.get('test')==='1'?'РЕЙТИНГ · ДЕМО':'РЕЙТИНГ · LOCAL MOCK';
 menu.innerHTML=view(controller,settings);menu.setAttribute('aria-busy',String(!!controller.pending));
 if(controller.pending)menu.querySelectorAll('button').forEach(b=>b.disabled=true);
}
controller.subscribe(render);render();
async function dispatch(action){
 bridge.sound(action==='back'||action==='main'?'back':'button');
 if(action==='fullscreen'){await fullscreen();return;}
 if(action==='mute'){settings.muted=!settings.muted;saveSettings();bridge.applySettings();render();return;}
 if(action==='quality'){settings.quality=settings.quality==='eco'?'full':'eco';saveSettings();bridge.applySettings();render();return;}
 if(action==='no-attempts'){controller.show('no-attempts');return;}
 if(action==='share'){await share();return;}
 if(action==='other-game'){controller.dispose();bridge.dispose();window.RytniArcadeHub?.leave();return;}
 if(action==='play'&&controller.run&&!controller.result){controller.pause();controller.show('confirm-restart');return;}
 await controller.action(action);
 // Credit first, then an explicit safe sponsor link. Mock never opens a real
 // sponsor destination automatically; it offers the same declared URL.
 if(action==='sponsor'&&controller.sponsorCredited){controller.sponsorCredited=false;const a=document.createElement('a');a.href=backend.sponsorUrl;a.target='_blank';a.rel='noopener noreferrer';a.className='notice';a.textContent='Открыть спонсора ↗';menu.querySelector('.actions')?.after(a);}
}
menu.addEventListener('click',e=>{const tab=e.target.closest('[data-tab]');if(tab){controller.tab=tab.dataset.tab;bridge.sound('button');render();return;}const action=e.target.closest('[data-action]')?.dataset.action;if(action)void dispatch(action);});
menu.addEventListener('input',e=>{const key=e.target.dataset.setting;if(!['master','music','sfx'].includes(key))return;settings[key]=Number(e.target.value);e.target.nextElementSibling.textContent=Math.round(settings[key]*100)+'%';saveSettings();bridge.applySettings();});
async function fullscreen(force=false){
 if(!force&&cabinet.classList.contains('pseudo-fullscreen')){cabinet.classList.remove('pseudo-fullscreen');await window.SnakeTestHost?.fullscreen(false);if(controller.screen!=='playing')controller.emit();return;}
 try{if(document.fullscreenElement&&!force)await document.exitFullscreen();else if(!document.fullscreenElement)await cabinet.requestFullscreen();}
 catch{if(mobile()){const active=force||!cabinet.classList.contains('pseudo-fullscreen'),accepted=window.SnakeTestHost?await window.SnakeTestHost.fullscreen(active):true;cabinet.classList.toggle('pseudo-fullscreen',active&&accepted);}else{controller.message='Полный экран недоступен в этом браузере. Можно играть в окне.';controller.emit();}}
 if(controller.screen!=='playing')controller.emit();
}
async function share(){if(!controller.result?.accepted)return;const message=`Мой рекорд в Mushroom Snake — ${Number(controller.hub.best_score).toLocaleString('ru-RU')} очков!`;try{if(navigator.share)await navigator.share({title:'Mushroom Snake',text:message});else{await navigator.clipboard.writeText(message);controller.message='Результат скопирован.';const n=document.createElement('p');n.className='note';n.textContent=controller.message;menu.append(n);}}catch(error){if(error.name!=='AbortError'){const field=document.createElement('textarea');field.value=message;field.readOnly=true;field.setAttribute('aria-label','Текст для копирования');menu.append(field);field.select();}}}
function loadSettings(){let saved={};try{saved=JSON.parse(localStorage.getItem('mushroom_snake_settings_v1')||'{}');}catch{}return {master:volume(saved.master,.75),music:volume(saved.music,.5),sfx:volume(saved.sfx,.65),muted:saved.muted===true,quality:saved.quality==='eco'?'eco':'full'};}
function volume(v,d){return Number.isFinite(v)?Math.max(0,Math.min(1,v)):d;}
function saveSettings(){try{localStorage.setItem('mushroom_snake_settings_v1',JSON.stringify(settings));}catch{}}
function lifecyclePause(){controller.pause();bridge.game?.audio.stopAll();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)lifecyclePause();else if(!controller.run)void controller.refresh(true);});
// Focusing the nested game also emits blur on this window; the document still
// owns focus in that case. Only leaving the product/page should pause the run.
window.addEventListener('blur',()=>{if(!document.hasFocus())lifecyclePause();});
window.addEventListener('resize',()=>{if(controller.screen==='playing'&&!gate.ready()){lifecyclePause();controller.gateMode='resume';controller.show('mobile-gate');}});
document.addEventListener('fullscreenchange',()=>{if(controller.screen==='playing'&&!gate.ready()){lifecyclePause();controller.gateMode='resume';controller.show('mobile-gate');}});
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(e.code==='Escape'&&controller.screen!=='playing'){e.preventDefault();if(controller.screen==='pause')void controller.resume();else if(controller.screen.startsWith('confirm-'))void controller.action('cancel');else if(['rules','settings','rating'].includes(controller.screen))void controller.action('back');}else if(e.code==='Space'&&controller.screen==='pause'){e.preventDefault();void controller.resume();}});
let disposed=false;
function dispose(){if(disposed)return;disposed=true;controller.dispose();bridge.dispose();}
window.addEventListener('pagehide',dispose,{once:true});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});

async function fixture(name){
 if(!name)return;
 if(['pause-ranked','pause-training'].includes(name)){await controller.start(name==='pause-ranked'?'ranked':'training');if(controller.screen==='mobile-gate'){controller.show('main');return;}controller.pause();}
 else if(name.startsWith('rules-')){controller.show('rules');controller.tab=name.slice(6);controller.emit();}
 else if(name==='settings'){controller.tab='sound';controller.show('settings');}
 else if(name==='mobile-gate'){controller.gateMode='ranked';controller.show('mobile-gate');}
 else if(name==='no-attempts'){controller.show('no-attempts');}
 else if(name.startsWith('result-')){
  // Explicit local review fixture, never a claimed live gameplay capture.
  await controller.start(name==='result-training'?'training':'ranked');if(!controller.run)return;
  const stats={...bridge.stats(),score:name==='result-record'?12480:2480,foods:24,length:32,max_combo:5,portal_uses:2,expansions:1,stage:1,world:[40,16],active_ticks:6840,bonuses:9};await controller.finish(stats);
 }
 else if(name==='leaderboard-empty'){controller.show('rating');}
}
try{await bridge.ready();await controller.refresh();window.SnakeTestHost?.bind(dispose,active=>{if(!active){cabinet.classList.remove('pseudo-fullscreen');lifecyclePause();}});if(local)await fixture(preview);}catch(error){controller.message=error.message;controller.show('error');}
if(local&&(params.has('qa')||params.has('preview'))){
 function activate(kind){const s=bridge.game?.session;if(!s)return;if(kind==='clear')s.effects=[];else{const positive=EFFECTS.slice(0,5).some(e=>e[0]===kind),same=s.effects.filter(e=>EFFECTS.slice(0,5).some(p=>p[0]===e.kind)===positive);if(!same.some(e=>e.kind===kind)&&same.length>=(positive?2:1))s.effects=s.effects.filter(e=>e!==same[0]);s.collect(kind,bodyCell(s.state,0));}bridge.game.render();}
 window.snakeProduct={controller,bridge,backend,settings,dispatch,fixture,gate,release,activate,stats:()=>bridge.stats(),get game(){return bridge.game;}};
 const controls=document.querySelector('#preview-controls');controls.hidden=false;
 controls.innerHTML='<span>DEV · АКТИВИРОВАТЬ МАТЕРИАЛ:</span>'+EFFECTS.map(([key,label])=>`<button data-kind="${key}">${label}</button>`).join('')+'<button data-kind="clear">BASE</button>';
 controls.addEventListener('pointerdown',e=>e.preventDefault());
 controls.addEventListener('click',e=>{const kind=e.target.closest('[data-kind]')?.dataset.kind;if(!kind)return;activate(kind);frame.contentWindow.focus();});
}
