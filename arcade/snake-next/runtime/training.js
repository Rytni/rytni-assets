import {generateArena} from '../world/arena.js';
import {createTrainingRules} from '../simulation/difficulty.js';
import {createState} from '../simulation/state.js';
import {step} from '../simulation/step.js';
import {bodyCell} from '../simulation/body.js';
import {stateHash} from '../simulation/hash.js';
import {FixedClock} from '../simulation/clock.js';
import {keyboardCommand} from '../input/turns.js';
import {BodySnapshots} from '../presentation/path.js';
import {DevRenderer} from '../presentation/renderer.js';

export function createTrainingRenderer(canvas,capacity,factory){return factory?factory(canvas,capacity):new DevRenderer(canvas,capacity);}

/** Local-only Training adapter owns clocks/input/UI; renderer is a read-only sink. */
export class Training {
  constructor(root,{rendererFactory}={}){
    this.rendererFactory=rendererFactory;
    this.root=root;this.canvas=root.querySelector('canvas');this.ui='main';this.raf=0;this.timer=0;this.cleanups=[];this.commands=[];this.sequence=0;this.latencies=[];this.accepted=[];this.receipts=new Map();this.inputLog=[];
    this.metrics={simulation:[],renderer:[],whole:[]};this.frames=0;this.recoveries=0;this.lastFrame=0;this.recordPerf=false;this.simSinceFrame=0;
    this.show('main');
  }
  show(ui){this.ui=ui;this.root.dataset.state=ui;for(const screen of this.root.querySelectorAll('[data-screen]'))screen.hidden=screen.dataset.screen!==ui;this.root.querySelector('#pause').disabled=ui!=='playing';}
  listen(target,event,handler){target.addEventListener(event,handler);this.cleanups.push(()=>target.removeEventListener(event,handler));}
  start(options={}){
    this.stop();
    if(innerHeight>innerWidth){this.show('main');this.root.querySelector('#diagnostic').textContent='Rotate to landscape to start Training.';return;}
    this.rules=options.rules||createTrainingRules();this.arena=options.arena||generateArena(options.seed??7,this.rules);
    this.state=createState({seed:options.seed??7,rules:this.rules,arena:this.arena,...options.stateOptions});
    this.snapshots=new BodySnapshots(this.arena.cells);this.snapshots.reset(this.state);this.renderer=createTrainingRenderer(this.canvas,this.arena.cells,this.rendererFactory);
    this.commands.length=0;this.sequence=0;this.latencies.length=0;this.accepted.length=0;this.receipts.clear();this.inputLog.length=0;this.auto=null;this.frames=0;this.recoveries=0;
    this.lastFrame=0;this.simSinceFrame=0;this.metrics={simulation:[],renderer:[],whole:[]};
    this.clock=new FixedClock({tickHz:this.rules.tickHz,maxCatchUpTicks:this.rules.maxCatchUpTicks,onTick:()=>this.tick()});
    this.listen(window,'keydown',event=>{
      const command=keyboardCommand(event.code,{tick:this.state.tick+1,sequence:this.sequence+1,repeat:event.repeat});
      if(command){event.preventDefault();this.input(command.direction,event.repeat,'keyboard',event.timeStamp);}
      else if(event.code==='Escape'&&!event.repeat){event.preventDefault();if(document.fullscreenElement)this.exitFullscreen();else if(this.ui==='playing')this.pause();else if(this.ui==='paused')this.resume();}
    });
    this.listen(this.root.querySelector('#dpad'),'pointerdown',event=>{const button=event.target.closest('[data-dir]');if(button){event.preventDefault();this.input(Number(button.dataset.dir),false,'dpad',event.timeStamp);}});
    this.listen(document,'visibilitychange',()=>{if(document.hidden&&this.ui==='playing')this.pause('hidden');});
    this.listen(window,'resize',()=>{this.resize();if(innerHeight>innerWidth&&this.ui==='playing')this.pause('portrait');});
    this.listen(document,'fullscreenchange',()=>this.resize());
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.canvas);
    this.show('playing');this.resize();this.paint(0,true);this.clock.resume(performance.now());this.schedule();this.scheduleFrame();
  }
  input(direction,repeat=false,source='qa',eventMs=performance.now()){
    if(this.ui!=='playing')return false;
    const command={tick:this.state.tick+1,sequence:++this.sequence,direction,repeat};
    // Bounded mailbox too: rapid spam cannot grow memory before the next pure tick.
    if(this.commands.length>=32)return false;
    this.commands.push(command);this.receipts.set(command.sequence,{eventMs,commandEnqueueMs:performance.now(),source,direction});
    return true;
  }
  tick(){
    const started=performance.now();
    if(this.auto){const dir=this.auto(this.state,this.arena,this.rules);if(dir!==undefined)this.input(dir,false,'autopilot');}
    const pending=this.commands;this.commands=[];
    for(const command of pending){if(this.inputLog.length<100000)this.inputLog.push({...command});}
    step(this.state,this.arena,this.rules,pending);this.snapshots.capture(this.state);
    const enqueuedAt=performance.now();
    for(const event of this.state.events){
      if(event.type==='turn-queued'){
        const receipt=this.receipts.get(event.inputSequence);if(receipt)this.accepted.push({...receipt,enqueueMs:enqueuedAt,eventTick:this.state.tick});
      }
      if(event.type==='turn-applied'){
        const receipt=this.accepted.shift();if(receipt){this.latencies.push({...receipt,appliedMs:enqueuedAt,appliedTick:this.state.tick,commandEnqueueLatencyMs:receipt.commandEnqueueMs-receipt.eventMs,simulationEnqueueLatencyMs:receipt.enqueueMs-receipt.commandEnqueueMs,enqueueLatencyMs:receipt.enqueueMs-receipt.eventMs,boundaryWaitMs:enqueuedAt-receipt.enqueueMs});if(this.latencies.length>128)this.latencies.shift();}
      }
    }
    for(const command of pending)this.receipts.delete(command.sequence);
    const cost=performance.now()-started;this.simSinceFrame+=cost;if(this.recordPerf)this.sample(this.metrics.simulation,cost);
    if(this.state.status!=='playing'){
      this.clock.pause();this.stop();this.paint(1);this.root.querySelector('#result-copy').textContent=`${this.state.reason} · ${this.state.score} points · ${this.state.length} cells · ${(this.state.tick/this.rules.tickHz).toFixed(1)}s`;this.show('result');
    }
  }
  sample(array,n){array.push(n);if(array.length>6000)array.shift();}
  schedule(){
    if(this.ui!=='playing'||this.timer)return;
    this.timer=setTimeout(()=>{this.timer=0;if(this.ui!=='playing')return;this.clock.advance(performance.now());if(this.clock.status==='recovery'){this.recoveries++;this.pause('scheduler-lag');}else this.schedule();},4);
  }
  scheduleFrame(){if(this.raf||this.ui!=='playing')return;this.raf=requestAnimationFrame(now=>{this.raf=0;if(this.ui!=='playing')return;const started=performance.now();this.paint(undefined,false,now);if(this.recordPerf)this.sample(this.metrics.whole,performance.now()-started+this.simSinceFrame);this.simSinceFrame=0;this.scheduleFrame();});}
  paint(alpha,resetCamera=false,now=performance.now()){
    if(!this.renderer)return;
    const started=performance.now();
    const dt=this.lastFrame?Math.min(.05,(now-this.lastFrame)/1000):1/60;this.lastFrame=now;
    // Exactly one shared phase. A completed authoritative move is buffered by one cell interval.
    if(alpha===undefined)alpha=Math.min(1,(this.state.movePhase+this.clock.debt/this.clock.tickMs)/this.state.cadence);
    this.alpha=alpha;
    const food=alpha<1&&this.snapshots.moved?this.snapshots.previousFood:this.state.food;
    this.renderer.draw({snapshots:this.snapshots,arena:this.arena,food,alpha,dt,resetCamera});this.frames++;
    if(this.recordPerf)this.sample(this.metrics.renderer,performance.now()-started);
    if(this.frames%6===0||resetCamera){this.root.querySelector('#hud').textContent=`${this.state.score} points · ${this.state.length} cells · ${(this.state.tick/60).toFixed(1)}s · ${(60/this.state.cadence).toFixed(1)} cells/s · combo ×1`;this.root.querySelector('#diagnostic').textContent=this.renderer.diagnostic;}
  }
  resize(){const rect=this.canvas.getBoundingClientRect();this.renderer?.resize(rect.width,rect.height,devicePixelRatio);if(this.ui!=='playing')this.paint(this.alpha??0);}
  suspendClocks(){if(this.timer)clearTimeout(this.timer);this.timer=0;if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;}
  pause(reason='user'){if(this.ui!=='playing')return;this.paint();this.pausedDebt=this.clock.debt;this.clock.pause();this.suspendClocks();this.pauseReason=reason;this.root.querySelector('#pause-copy').textContent=reason==='portrait'?'Rotate to landscape, then resume.':reason==='scheduler-lag'?'Scheduler lag: explicitly resume when ready.':'Simulation frozen. Resume continues the same tick.';this.show('paused');}
  resume(){if(this.ui!=='paused')return;if(innerHeight>innerWidth){this.root.querySelector('#pause-copy').textContent='Rotate to landscape before resuming.';return;}this.show('playing');this.clock.resume(performance.now());this.clock.debt=this.pausedDebt||0;this.schedule();this.lastFrame=0;this.scheduleFrame();}
  stop(){this.suspendClocks();for(const dispose of this.cleanups)dispose();this.cleanups.length=0;this.observer?.disconnect();this.observer=null;this.commands.length=0;this.accepted.length=0;this.receipts.clear();if(this.clock)this.clock.pause();}
  main(){this.stop();this.auto=null;this.show('main');}
  async fullscreen(){try{await this.root.requestFullscreen();}catch(error){this.root.querySelector('#diagnostic').textContent=`Fullscreen unavailable: ${error.message}`;}}
  async exitFullscreen(){if(document.fullscreenElement)await document.exitFullscreen();}
  summary(){return {ui:this.ui,tick:this.state?.tick,score:this.state?.score,length:this.state?.length,food:this.state?.food,hash:this.state?stateHash(this.state):null,cadence:this.state?.cadence,frames:this.frames,recoveries:this.recoveries,rendererFaults:this.renderer?.faults,backing:this.renderer?{width:this.canvas.width,height:this.canvas.height,dpr:this.renderer.dpr,resizes:this.renderer.resizes}:null,resources:{raf:Number(!!this.raf),timers:Number(!!this.timer),listeners:this.cleanups.length,observers:Number(!!this.observer),audio:0}};}
}
