import {ProgressPresentation} from './presentation.js';
import {installBiomeAudio} from './audio.js';
import {config} from './config.js';
import {drawHudType} from '../forest-training/hud-type.js';

export const progressiveEnabled=()=>document.querySelector('#run-model').value==='progressive';
export function labConfig(){return config({startStage:Number(document.querySelector('#progress-stage').value),pressure:Number(document.querySelector('#event-pressure').value),positiveInterval:Number(document.querySelector('#director-positive').value),negativeInterval:Number(document.querySelector('#director-negative').value),portalInterval:Number(document.querySelector('#director-portal').value),density:Number(document.querySelector('#progress-density').value),candidates:document.querySelector('#dev-candidates').checked,speedCaps:document.querySelector('#speed-caps').value.split(',').map(Number),thresholds:document.querySelector('#chapter-thresholds').value.split(',').map(Number)});}
export function installProgression(game){
 const presentation=new ProgressPresentation(game.art),baseRender=game.render.bind(game),baseDraw=game.renderer.render.bind(game.renderer),baseTick=game.tick.bind(game),music=installBiomeAudio(game.audio,()=>game.session);let actual=null;
 game.renderer.render=(s,options)=>s?.world?presentation.render(game.renderer,actual||s,options,document.querySelector('#camera-debug').checked):baseDraw(s,options);
 game.render=()=>{
  const s=game.session;if(!s?.world){if(game.root.querySelector('#effects').dataset.progressEffects!==undefined){delete game.root.querySelector('#effects').dataset.progressEffects;game.effectKey=null;}baseRender();return;}
  actual=s;const facade=Object.assign(Object.create(s),{effects:[]});game.session=facade;
  try{baseRender();presentation.effects(game.root.querySelector('#effects'),s,game.compact);drawHudType(game.root.querySelector('#hud'));}finally{game.session=s;actual=null;}
 };
 game.tick=()=>{baseTick();const s=game.session;if(s?.world){if(game.status==='playing')music.sync(s);for(const e of s.events)if(e.effect&&!['focus','harvest','rush'].includes(e.effect))music.cue(e.effect);}};
 window.addEventListener('pagehide',()=>{presentation.release();},{once:true});
 return {presentation,music,reset:()=>presentation.reset()};
}
