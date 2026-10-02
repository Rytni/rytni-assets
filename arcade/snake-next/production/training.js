import {Training} from '../runtime/training.js';
import {ProductionRenderer} from './renderer.js';

/** Standalone production adapter; the accepted timer/input/snapshot owner is unchanged. */
export class ArtTraining extends Training {
  constructor(root,assets){super(root);this.assets=assets;}
  paint(...args){
    if(this.renderer&&!(this.renderer instanceof ProductionRenderer)){const previous=this.renderer;this.renderer=new ProductionRenderer(this.canvas,this.arena.cells,this.assets);this.renderer.resize(previous.width,previous.height,previous.dpr);}
    if(this.renderer&&this.assets.forest){this.renderer.forest=this.assets.forest;this.renderer.neutral=false;}
    super.paint(...args);
  }
}

export class SliceTraining extends ArtTraining {
  constructor(root,assets,mixer,notify){super(root,assets);this.mixer=mixer;this.notify=notify;}
  paint(...args){
    super.paint(...args);
    if(this.renderer){
      const state=this.state;
      const visibleFood=this.alpha<1&&this.snapshots.moved?this.snapshots.previousFood:state.food;
      if(this.presentedFood>=0&&visibleFood!==this.presentedFood&&this.pendingPickup){this.pendingPickup--;this.mixer?.play('pickup');}
      this.presentedFood=visibleFood;
      if(state&&(this.frames%6===0||args[1]))this.root.querySelector('#hud').textContent=`${state.score} очков · ${state.length} длина · ${(state.tick/60).toFixed(1)} с`;
      const diagnostic=this.root.querySelector('#diagnostic');if(!this.renderer.faults)diagnostic.textContent='';
    }
  }
  start(options={}){this.pendingPickup=0;this.presentedFood=-1;super.start(options);}
  show(ui){super.show(ui);this.notify?.(ui);}
  stop(){super.stop();this.mixer?.stopAll();}
  pause(reason){super.pause(reason);if(this.ui==='paused'){this.mixer?.stopAll();this.mixer?.play('pause');}}
  resume(){if(innerHeight>innerWidth||matchMedia('(pointer:coarse)').matches&&!document.fullscreenElement){this.show('prompt');return;}super.resume();if(this.ui==='playing'){this.mixer?.play('resume');this.mixer?.startMusic();}}
  tick(){
    super.tick();
    for(const event of this.state.events)if(event.type==='food-consumed')this.pendingPickup++;
  }
  summary(){const summary=super.summary();summary.resources.audio=this.mixer?.sources.size||0;return{...summary,audio:this.mixer?.summary()};}
}
