import {ProgressPresentation} from './presentation.js';
import {installBiomeAudio} from './audio.js';
import {config} from './config.js';
import {drawHudType} from '../forest-training/hud-type.js';
import {TunnelMotion,snappedTunnelFrame} from '../gate-one/motion.js';
import {TunnelRibbon} from '../gate-one/ribbon.js';
import {portalExitCue} from '../gate-one/audio.js';
import {drawEffectLabels} from '../effect-playground/visuals.js';
import {installEffectSounds} from '../effect-playground/audio.js';

export const progressiveEnabled=()=>document.querySelector('#run-model').value==='progressive';
export function labConfig(){return config({model:'fit-world-v2',freeTrigger:Number(document.querySelector('#free-trigger').value),startStage:Number(document.querySelector('#progress-stage').value),pressure:Number(document.querySelector('#event-pressure').value),positiveInterval:Number(document.querySelector('#director-positive').value),negativeInterval:Number(document.querySelector('#director-negative').value),portalInterval:Number(document.querySelector('#director-portal').value),density:Number(document.querySelector('#progress-density').value),candidates:document.querySelector('#dev-candidates').checked});}
export function installProgression(game){
 const doc=game.root.ownerDocument,style=doc.createElement('link');style.rel='stylesheet';style.href='/arcade/snake-next/effect-playground/style.css';doc.head.append(style);game.root.classList.add('effect-playground');
 const presentation=new ProgressPresentation(game.art),baseRender=game.render.bind(game),baseDraw=game.renderer.render.bind(game.renderer),baseTick=game.tick.bind(game),music=installBiomeAudio(game.audio,()=>game.session);let actual=null;
 let tunnelRibbon=null;
 game.renderer.render=(s,options)=>{
  const session=actual||s;if(!session?.world)return baseDraw(s,options);
  // During discontinuities ALL DEV modes must respect the same canonical edge.
  // V2/snap remain unchanged elsewhere; no legacy renderer draws an A→B chord.
  const snapped=!options.motion&&session.portalEdges?.length?snappedTunnelFrame(session,game.motion):null;
  const motion=options.motion||snapped;
  if(motion?.spans){
   tunnelRibbon??=new TunnelRibbon(game.ribbonV4);const old=game.renderer.smoothSprites;game.renderer.smoothSprites=tunnelRibbon;
   try{return presentation.render(game.renderer,session,{...options,motion},document.querySelector('#camera-debug').checked);}finally{game.renderer.smoothSprites=old;}
  }
  return presentation.render(game.renderer,session,options,document.querySelector('#camera-debug').checked);
 };
 game.render=()=>{
  const s=game.session;game.root.classList.toggle('effect-playground',!!s?.world);if(!s?.world){if(game.root.querySelector('#effects').dataset.progressEffects!==undefined){delete game.root.querySelector('#effects').dataset.progressEffects;game.effectKey=null;}baseRender();return;}
  // Runtime constructs a fresh baseline motion after sessionFactory. Upgrade
  // before its FIRST render, preserving the runtime's single timer/RAF owner.
  if(s.portalEdges&&!(game.motion instanceof TunnelMotion))game.motion=new TunnelMotion(s);
  actual=s;const facade=Object.assign(Object.create(s),{effects:[]});game.session=facade;
  try{baseRender();presentation.effects(game.root.querySelector('#effects'),s,game.compact);drawHudType(game.root.querySelector('#hud'));drawEffectLabels(game.root.querySelector('#hud'));
   // Approved V3 wood/gold assets, four-direction cross; fixed CSS touch space,
   // never world-cell anchored (FIT WORLD can shrink cells below touch size).
   const pad=game.root.querySelector('#pad'),l=game.renderer.last;pad.style.left=Math.round(l.arena.x+10)+'px';pad.style.top=Math.round(l.arena.y+l.arena.h-156)+'px';
  }finally{game.session=s;actual=null;}
 };
 installEffectSounds(game.audio);const play=game.audio.play.bind(game.audio);game.audio.play=(name,loop=false)=>{const e=game.session?.events.findLast(e=>e.effect&&['positive','negative'].includes(e.kind));const key=!loop&&['buff','debuff'].includes(name)&&e&&game.audio.buffers.has('effect-'+e.effect)?'effect-'+e.effect:name;const source=play(key,loop);if(source&&!loop&&['pickup','combo'].includes(name))source.playbackRate.value=1+Math.min(7,Math.max(0,(game.session?.combo||1)-1))*.025;return source;};
 game.tick=()=>{baseTick();const s=game.session;if(s?.world){if(game.status==='playing')music.sync(s);for(const e of s.events){if(['spore','portal-reward'].includes(e.kind))game.audio.play('combo');if(e.kind==='guard-used')game.audio.play('debuff');if(e.kind==='portal-head-exit')portalExitCue(game.audio,e.cell,s.arena.width,presentation.lastView);if(e.kind==='expansion')play('buff');}}};
 window.addEventListener('pagehide',()=>{tunnelRibbon?.release();presentation.release();},{once:true});
 return {presentation,music,reset:()=>presentation.reset()};
}
