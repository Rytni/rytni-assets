import {TunnelSession} from '../gate-one/session.js';
import {installProgression} from '../progressive-run/adapter.js';
import {EffectRibbonSprites} from './appearance/effect-ribbon.js';
import {installProductShell} from './cabinet-shell.js';
import {productWorldLayout} from './world-layout.js';
import {productClockDriver} from './clock-driver.js';
import {installProductInput} from './input-owner.js';

/** Product owns input/lifecycle/timing policy; child owns canonical engine,
 * renderer/audio, and presentation-only resize. */
export class ProductBridge {
 constructor(frame,{onPause,onLifecycle,onResult,onAction,onEvent=()=>{},settings}){Object.assign(this,{frame,onPause,onLifecycle,onResult,onAction,onEvent,settings});this.promise=this.install();}
 ready(){return this.promise;}
 async install(){
  const game=await new Promise((resolve,reject)=>{let tries=0;const check=()=>{const g=this.frame.contentWindow?.snakeProductGame;if(g)return resolve(g);if(++tries>500)return reject(Error('Игровые ресурсы недоступны. Перезагрузите страницу.'));setTimeout(check,30);};check();});
  if(game.mode!=='product')throw Error('Embedded Product mode required');
  this.game=game;const win=this.frame.contentWindow;this.oldSprites=game.renderer.smoothSprites;
  game.productClockDriver=productClockDriver(data=>this.onEvent('SCHEDULER_RECOVERY',data));
  game.ribbonV4=new EffectRibbonSprites(game.art);game.renderer.smoothSprites=game.ribbonV4;
  this.progression=installProgression(game,{cameraDebug:()=>false});this.progression.presentation.appearanceMode='skin';this.progression.presentation.quality=this.settings.quality;
  this.progression.presentation.fitLayout=productWorldLayout;this.progression.presentation.ambientBackdrop=true;
  game.sessionFactory=options=>{this.metrics={maxCombo:0,bonusCount:0,activeTicks:0};this.progression.reset();const s=new TunnelSession({...options,seed:this.seed,progression:{model:'fit-world-v2',freeTrigger:15,startStage:this.previewStage||0,maxWorldStage:2}});s.startsKey=game.starts+1;return s;};
  const originalStart=game.start.bind(game),show=game.show.bind(game),pause=game.pause.bind(game),render=game.render.bind(game),tick=game.tick.bind(game);
  this.engineStart=originalStart;
  this.enginePause=pause;
  this.engineResume=game.resume.bind(game);
  game.resume=()=>this.onAction('resume');
  // Keyboard R/Enter and HUD actions must route through product attempt policy.
  game.start=()=>this.onAction(game.session&&game.status!=='result'?'restart':'play');
  game.action=action=>{if(action==='fullscreen')this.onAction('fullscreen');else if(action==='pause')game.status==='playing'?game.pause('explicit-pause-button'):this.onAction('resume');else this.onAction(action==='main'?'exit':action==='start'?'play':action);};
  game.show=()=>{game.root.querySelector('#overlay').hidden=true;};
  game.pause=(reason='product-route')=>{
   this.onEvent('PAUSE_REQUEST',{reason});
   const active=['playing','dying'].includes(game.status);pause();if(active)this.onPause(reason);
  };
  this.inputOwner=installProductInput(game,win,{action:a=>game.action(a),event:(type,data)=>this.onEvent(type,data)});
  this.childOff=[];
  const report=(target,type,name)=>{const fn=()=>{this.onEvent(name);if(type==='visibilitychange'&&win.document.hidden)this.onLifecycle('visibility-hidden');if(type==='pagehide')this.onLifecycle('host-inactive');};target.addEventListener(type,fn);this.childOff.push(()=>target.removeEventListener(type,fn));};
  report(win,'blur','WINDOW_BLUR_CHILD');report(win,'resize','RESIZE_CHILD');
  report(win.document,'visibilitychange','VISIBILITY_CHILD');report(win.document,'fullscreenchange','FULLSCREEN_CHILD');
  report(win,'pagehide','PAGEHIDE_CHILD');
  if(win.visualViewport)report(win.visualViewport,'resize','VISUAL_VIEWPORT_RESIZE');
  game.render=()=>{if(game.session){game.ribbonV4.setSession(game.session,{quality:this.settings.quality});this.progression.presentation.quality=this.settings.quality;}render();};
  game.tick=()=>{const active=game.status==='playing';tick();const s=game.session;if(!s)return;if(active)this.metrics.activeTicks++;this.metrics.maxCombo=Math.max(this.metrics.maxCombo,s.combo||0);this.metrics.bonusCount+=s.events.filter(e=>e.kind==='positive'||e.kind==='negative').length;if(game.status==='result'&&!this.completed){this.completed=true;void this.onResult(this.stats());}};
  game.fullscreen=()=>this.onAction('fullscreen');
  installProductShell(game);
  this.applySettings();game.main();game.show();
  // Parent fullscreen changes resize the iframe; normal viewport geometry is
  // still computed by the current FIT WORLD renderer and square-cell scale.
  this.legacyShow=show;this.win=win;return this;
 }
 start(seed){this.seed=seed;this.completed=false;this.engineStart();this.frame.contentWindow.focus();}
 pause(){this.game?.pause();}
 pauseForLifecycle(reason){this.onEvent('PAUSE_REQUEST',{reason});const active=['playing','dying'].includes(this.game?.status);this.enginePause?.();if(active)this.onPause(reason);}
 suspendPresentation(){if(this.game?.status==='playing'){this.settleFraction=this.game.renderFraction();this.game.motion.freeze(this.game.session,this.settleFraction);this.game.stop();}}
 continuePresentation(){if(this.game?.status==='playing'){this.game.motion.resume();this.game.run();this.game.clock.debt=(this.settleFraction||0)*this.game.clock.tickMs;this.game.audio.startMusic();}}
 resume(){
  // Product chrome can resize the nested viewport on resume. Settle its
  // presentation while the fixed clock is paused, never as gameplay debt.
  this.game?.resize();this.game?.render();
  this.engineResume?.();this.frame.contentWindow.focus();
 }
 stop(){this.game?.stop();}
 stats(){const s=this.game?.session;if(!s)return null;return {score:s.score,foods:s.foods,length:s.state.length,max_combo:this.metrics.maxCombo,portal_uses:s.portalCompleted||s.portal.transfers||0,expansions:s.capacityExpansions?.length||0,stage:s.stage.index,world:[s.world.width,s.world.height],active_ticks:this.metrics.activeTicks,active_seconds:Math.round(this.metrics.activeTicks/60),bonuses:this.metrics.bonusCount,final_hash:s.hash()};}
 applySettings(){if(!this.game)return;Object.assign(this.game.audio.volumes,{master:this.settings.master,music:this.settings.music,sfx:this.settings.sfx});this.game.audio.muted=this.settings.muted;this.game.audio.apply();}
 sound(kind){this.game?.audio.unlock().then(()=>this.game.audio.play(kind==='back'?'turn':kind==='panel'?'arrival':'click')).catch(()=>{});}
 dispose(){this.inputOwner?.dispose();for(const remove of this.childOff||[])remove();this.game?.dispose();this.oldSprites?.release();this.progression?.presentation.release();}
}
