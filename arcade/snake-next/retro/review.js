import {Training} from '../runtime/training.js';
import {createRetroFixture} from './fixtures.js';
import {bodyCell} from '../simulation/body.js';
import {RetroRenderer} from './renderer.js';
import {RetroEffects} from './effects.js';
import {RetroAudio} from './audio.js';
import {PortalMachine,transferState} from './portal.js';

/** Isolated proof adapter; foundation tick/input/collision remain untouched. */
export class RetroReview extends Training {
 constructor(root){super(root,{rendererFactory:canvas=>new RetroRenderer(canvas)});this.effects=new RetroEffects();this.audio=new RetroAudio();this.portal=new PortalMachine();this.positive=0;this.negative=0;this.combo=1;this.death=0;this.history=[];this.options={length:8,shape:'straight',speed:5};}
 start(options={}){
  const config={...this.options,...options};this.options=config;this.fixture=createRetroFixture(config);this.stop();this.portal.reset();this.effects.clear();this.positive=this.negative=this.death=0;this.combo=1;this.history=[];
  this.objects=config.benchmark?[]:[{kind:'positive',cell:30*96+44,used:false},{kind:'negative',cell:30*96+47,used:false},{kind:'portal',cell:30*96+51,used:false},{kind:'portal',cell:44*96+35,used:false}];
  super.start(this.fixture);if(this.ui!=='playing')return;
  this.audio.music();this.renderer.scene=this;this.paint(1,true);if(config.auto)this.auto=this.routeAuto.bind(this);
 }
 routeAuto(state){const head=bodyCell(state,0),route=this.fixture.route,at=route.indexOf(head),next=route[(at-1+route.length)%route.length],delta=next-head;return delta===1?1:delta===-1?3:delta===96?2:0;}
 input(...args){return this.portal?.locked?false:super.input(...args);}
 tick(){if(this.portal.locked)return;const before=bodyCell(this.state,0);this.inTick=true;try{super.tick();}finally{this.inTick=false;}
  if(this.state.status!=='playing'){this.death=.001;this.show('dying');this.audio.stop();this.audio.effect('death');this.lastFrame=0;this.scheduleFrame();return;}
  for(const event of this.state.events)if(event.type==='food-consumed'){this.effects.burst('food',event.cell,this.arena.width);this.audio.effect('food');this.combo++;this.history.push('food');}
  const head=bodyCell(this.state,0);if(head===before)return;
  for(const o of this.objects){if(o.used||o.cell!==head)continue;
   if(o.kind==='positive'||o.kind==='negative'){o.used=true;this[o.kind]=o.kind==='positive'?6:4;this.effects.burst(o.kind,head,this.arena.width);this.audio.effect(o.kind);this.history.push(o.kind);}
   else {const portals=this.objects.filter(p=>p.kind==='portal'),exit=portals.find(p=>p!==o).cell;if(this.portal.begin(head,exit,this.state.length)){this.clock.pause();clearTimeout(this.timer);this.timer=0;this.commands.length=0;this.state.turnCount=0;this.accepted.length=0;this.receipts.clear();this.audio.effect('enter');this.history.push('enter');}}
  }
 }
 schedule(){if(this.portal?.locked)return;super.schedule();}
 paint(_alpha,reset=false,now=performance.now()){
  const dt=this.ui==='playing'||this.ui==='dying'?(this.lastFrame?Math.min(.05,(now-this.lastFrame)/1000):0):0;
  if(this.ui==='playing'){
   this.effects?.update(dt);this.positive=Math.max(0,this.positive-dt);this.negative=Math.max(0,this.negative-dt);
   this.portal?.update(dt,()=>{const next=transferState(this.state,this.arena,this.rules,this.portal.exit);if(!next)return false;this.state=next;this.snapshots.reset(next);this.renderer.camera.ready=false;return true;},success=>{if(success){this.audio.effect('exit');this.history.push('exit');}this.clock.resume(now);this.schedule();});
  }
  if(this.ui==='dying')this.death+=dt;
  super.paint(1,reset,now);
  if(this.state){this.root.querySelector('#hud').textContent=`${String(this.state.score).padStart(4,'0')}  ·  LENGTH ${this.state.length}  ·  COMBO ×${this.combo}`;this.root.querySelector('#positive').hidden=this.positive<=0;this.root.querySelector('#negative').hidden=this.negative<=0;this.root.querySelector('#positive-time').textContent=`${this.positive.toFixed(1)}s`;this.root.querySelector('#negative-time').textContent=`${this.negative.toFixed(1)}s`;}
  if(this.ui==='dying'&&(this.death>=.8||document.hidden)){this.suspendClocks();this.audio.stop();this.effects.clear();this.positive=this.negative=0;this.portal.reset();this.root.querySelector('#positive').hidden=this.root.querySelector('#negative').hidden=true;this.show('result');}
 }
 scheduleFrame(){if(this.raf||!['playing','dying'].includes(this.ui))return;this.raf=requestAnimationFrame(now=>{this.raf=0;if(!['playing','dying'].includes(this.ui))return;const began=performance.now();this.paint(1,false,now);if(this.recordPerf)this.sample(this.metrics.whole,performance.now()-began+this.simSinceFrame);this.simSinceFrame=0;this.scheduleFrame();});}
 pause(reason='user'){super.pause(reason);if(this.ui==='paused')this.audio.stop();}
 resume(){super.resume();if(this.ui==='playing'){if(this.portal.locked){this.clock.pause();clearTimeout(this.timer);this.timer=0;}this.audio.music();}}
 stop(){super.stop();if(this.inTick)return;this.audio?.stop();this.effects?.clear();this.portal?.reset();this.positive=this.negative=0;this.root.querySelector('#positive').hidden=this.root.querySelector('#negative').hidden=true;this.renderer?.dispose?.();this.renderer=null;}
 summary(){const s=super.summary();s.resources.audio=this.audio.sources.size;return {...s,portal:this.portal.phase,transfers:this.portal.transfers,rejected:this.portal.rejected,history:[...this.history],positive:this.positive,negative:this.negative,memory:this.renderer?.inventory?.(),audioBytes:this.audio.bytes};}
 dispose(){this.stop();this.audio.dispose();}
}

const root=document.getElementById('retro');
if(root){
 const game=new RetroReview(root);window.retro=game;
 const action=fn=>()=>{game.audio.unlock();game.audio.effect('ui');fn();};
 root.querySelector('#start').onclick=action(()=>game.start());root.querySelector('#pause').onclick=()=>game.pause();root.querySelector('#resume').onclick=action(()=>game.resume());root.querySelectorAll('[data-restart]').forEach(b=>b.onclick=action(()=>game.start()));root.querySelectorAll('[data-main]').forEach(b=>b.onclick=()=>game.main());
 root.querySelector('#fullscreen').onclick=()=>game.fullscreen();root.querySelector('#sound').onclick=action(()=>{game.audio.enabled=!game.audio.enabled;if(!game.audio.enabled)game.audio.stop();else if(game.ui==='playing')game.audio.music();root.querySelector('#sound').textContent=game.audio.enabled?'♫':'♪';root.querySelector('#sound').setAttribute('aria-pressed',String(game.audio.enabled));});
 root.querySelector('#apply').onclick=action(()=>game.start({length:Number(root.querySelector('#length').value),shape:root.querySelector('#shape').value,speed:Number(root.querySelector('#speed').value),auto:root.querySelector('#auto').checked,benchmark:root.querySelector('#auto').checked}));
 window.addEventListener('pagehide',()=>game.dispose(),{once:true});
 if(new URLSearchParams(location.search).get('qa')==='1')window.retroQA={game,fixture:o=>game.start(o),freeze:()=>{game.clock.pause();game.suspendClocks();},frame:dt=>{game.lastFrame=performance.now()-dt*1000;game.paint(1);},summary:()=>game.summary()};
}
