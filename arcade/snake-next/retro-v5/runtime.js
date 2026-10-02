import {createRules,createArena,createState,step,FixedClock,startMainThreadClock,keyboardCommand} from '../entry.js';
import {bodyCells} from '../simulation/body.js';
import {paint,layout,loadArt} from './renderer.js';
import {fixtures} from './geometry.mjs';
const toXY=(cell,width)=>({x:cell%width,y:Math.floor(cell/width)});
export class RetroReview {
  constructor(root,art) {
    this.root=root;this.canvas=root.querySelector('canvas');this.art=art;
    this.commands=[];this.sequence=0;this.moves=0;this.raf=0;this.cancelTimer=null;this.effects=[];this.vfx=[];this.metrics=[];
    this.status='paused';this.cleanups=[];this.camera=null;this.pressed='';
    this.listen(window,'keydown',e=>{
      if(e.target.matches('input,select'))return;
      if(e.code==='Escape'&&document.fullscreenElement){e.preventDefault();this.fullscreen();return;}
      if(['Space','KeyR','Enter','KeyF'].includes(e.code)) {
        e.preventDefault();
        if(e.code==='KeyR'||e.code==='Enter'&&this.status==='dead')this.start(this.requestedLength);
        else if(e.code==='KeyF')this.fullscreen();
        else this.togglePause();return;
      }
      const command=keyboardCommand(e.code,{tick:this.state.tick+1,sequence:++this.sequence,repeat:e.repeat});
      if(command){e.preventDefault();if(this.status==='playing')this.commands.push(command);}
    });
    this.listen(this.canvas,'pointerdown',e=>{
      const b=this.canvas.getBoundingClientRect(),x=(e.clientX-b.left)*this.width/b.width,y=(e.clientY-b.top)*this.height/b.height;
      const hit=this.lastLayout.hits.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
      if(!hit)return;
      e.preventDefault();this.canvas.setPointerCapture(e.pointerId);
      if(hit.dir!==undefined){this.pressed=hit.id;this.command(hit.dir);}
      else if(hit.id==='full')this.fullscreen();
      else if(hit.id==='restart')this.start(this.requestedLength);
      else this.togglePause();
      this.render();
    });
    this.listen(this.canvas,'pointerup',()=>{this.pressed='';this.render()});
    this.listen(this.canvas,'pointercancel',()=>{this.pressed='';this.render()});
    this.listen(window,'resize',()=>this.resize());
    this.listen(document,'fullscreenchange',()=>this.resize());
    this.listen(document,'visibilitychange',()=>{if(document.hidden)this.pause()});
    this.listen(window,'pagehide',()=>this.dispose());
    this.resize();this.start(8);
  }
  listen(target,type,fn){target.addEventListener(type,fn);this.cleanups.push(()=>target.removeEventListener(type,fn));}
  command(dir){if(this.status==='playing')this.commands.push({tick:this.state.tick+1,sequence:++this.sequence,direction:dir,repeat:false});}
  start(length=8) {
    this.stop();this.requestedLength=length;this.moves=0;this.commands=[];this.effects=[];this.vfx=[];this.fixture=null;this.eventLog=[];this.portalContacts=0;
    this.rules=createRules({width:96,height:64,obstacleBlocks:0,minFreeCells:1201,initialLength:8,firstFoodAhead:length===8?3:undefined,ticksPerCell:15});
    const width=96,height=64;
    let body,direction=1;
    if(length<=30)body=Array.from({length},(_,i)=>32*width+(length+10)-i);
    else {
      const route=[];for(let y=4;y<60;y++)for(let col=0;col<88;col++)route.push(y*width+(y%2?91-col:4+col));
      body=route.slice(0,length).reverse();
      const head=toXY(body[0],width),neck=toXY(body[1],width);
      direction=head.y===neck.y?(head.x>neck.x?1:3):2;
    }
    const blocked=[];
    for(let x=0;x<width;x++)blocked.push(x,(height-1)*width+x);
    for(let y=1;y<height-1;y++)blocked.push(y*width,y*width+width-1);
    const obstaclePoints=length<=30?[{x:length+18,y:29},{x:length+23,y:36},{x:length+7,y:36}]:[];
    blocked.push(...obstaclePoints.map(p=>p.y*width+p.x));
    this.arena=createArena({width,height,blockedCells:blocked,initialBody:body,initialDirection:direction,runwayCells:length===8?12:0,minFreeCells:1201});
    this.state=createState({seed:52102,rules:this.rules,arena:this.arena});
    const h=toXY(body[0],width);
    this.pickups=length<=30?[{kind:'positive',x:h.x+6,y:h.y},{kind:'negative',x:h.x+9,y:h.y},{kind:'portal',x:h.x+12,y:h.y}]:[];
    this.obstacles=obstaclePoints;
    this.camera=null;this.status='playing';
    this.clock=new FixedClock({tickHz:60,maxCatchUpTicks:5,onTick:()=>this.tick()});
    this.resume();
  }
  tick() {
    const old=this.state.body[this.state.headIndex],pending=this.commands;this.commands=[];
    step(this.state,this.arena,this.rules,pending);
    const current=this.state.body[this.state.headIndex];
    if(old!==current) {
      this.moves++;const head=toXY(current,this.arena.width);
      for(const event of this.state.events)if(event.type==='food-consumed')this.burst('seed',head);
      this.pickups=this.pickups.filter(o=>{
        if(o.x!==head.x||o.y!==head.y)return true;
        this.burst(o.kind,head);
        if(o.kind!=='portal')this.effects.push({kind:o.kind,ends:this.state.tick+60*8});
        this.portalContacts=(this.portalContacts||0)+(o.kind==='portal'?1:0);
        return o.kind==='portal';
      });
    }
    this.effects=this.effects.filter(e=>e.ends>this.state.tick);
    this.vfx=this.vfx.filter(e=>this.state.tick/60-e.start<.55);
    if(this.state.status!=='playing'){this.stop();this.status='dead';this.render();}
  }
  burst(kind,p){this.vfx.push({...p,kind,start:this.state.tick/60});this.eventLog ||= [];this.eventLog.push({kind,tick:this.state.tick});}
  stop(){if(this.cancelTimer)this.cancelTimer();this.cancelTimer=null;if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;if(this.clock)this.clock.pause();}
  pause(){if(this.status!=='playing')return;this.stop();this.status='paused';this.render();}
  resume() {
    if(this.state.status!=='playing'||this.fixture)return;
    this.status='playing';
    this.cancelTimer=startMainThreadClock(this.clock,{now:()=>performance.now(),schedule:(f,t)=>setTimeout(f,t),cancel:clearTimeout});
    const frame=()=>{this.raf=0;if(this.status!=='playing')return;if(this.clock.status==='recovery'){this.pause();return;}this.render();this.raf=requestAnimationFrame(frame)};
    this.raf=requestAnimationFrame(frame);this.render();
  }
  togglePause(){this.status==='playing'?this.pause():this.resume();}
  resize() {
    const b=this.root.getBoundingClientRect();this.width=Math.max(320,Math.round(b.width));this.height=Math.max(250,Math.round(b.height));
    const dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);
    this.dpr=dpr;if(this.state)this.render();
  }
  snapshot() {
    if(this.fixture)return this.fixture;
    const cells=bodyCells(this.state).map(c=>toXY(c,this.arena.width)),head=cells[0],l=layout(this.width,this.height);
    if(!this.camera)this.camera={x:Math.max(0,head.x-13),y:Math.max(0,head.y-Math.floor(l.rows/2))};
    if(head.x<this.camera.x+4)this.camera.x=Math.max(0,head.x-4);
    if(head.x>this.camera.x+21)this.camera.x=Math.min(this.arena.width-26,head.x-21);
    if(head.y<this.camera.y+2)this.camera.y=Math.max(0,head.y-2);
    if(head.y>this.camera.y+l.rows-3)this.camera.y=Math.min(this.arena.height-l.rows,head.y-l.rows+3);
    const objects=this.pickups.slice();if(this.state.food>=0)objects.push({kind:'seed',...toXY(this.state.food,this.arena.width)});
    const effect=this.effects.at(-1);
    return {cells,camera:this.camera,moves:this.moves,obstacles:this.obstacles,objects,vfx:this.vfx,time:this.state.tick/60,score:this.state.score,status:this.status,pressed:this.pressed,effect:effect?{...effect,remaining:(effect.ends-this.state.tick)/60}:null};
  }
  render() {
    const start=performance.now(),ctx=this.canvas.getContext('2d');ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    this.lastLayout=paint(ctx,this.art,this.width,this.height,this.snapshot());
    if(this.recordPerf){this.metrics.push(performance.now()-start);if(this.metrics.length>600)this.metrics.shift();}
  }
  reviewScene(shape='S') {
    this.stop();this.status='static';
    const fixture=fixtures.find(f=>f.id===shape)||fixtures.find(f=>f.id==='S');
    const l=layout(this.width,this.height),offset=Math.max(1,Math.floor((l.rows-5)/2));
    const cells=fixture.route.slice().reverse().map(([x,y])=>({x:x+7,y:y+offset}));
    this.fixture={cells,camera:{x:0,y:0},moves:40,obstacles:[{x:4,y:2},{x:20,y:4}],objects:[{kind:'seed',x:19,y:2},{kind:'positive',x:4,y:1},{kind:'negative',x:22,y:5},{kind:'portal',x:23,y:2}],vfx:[],time:1,score:2400,status:'static'};
    this.render();
  }
  async fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await this.root.requestFullscreen()}catch(e){this.fullscreenError=String(e)}}
  dispose(){this.stop();for(const cleanup of this.cleanups.splice(0))cleanup();}
}
const root=document.querySelector('#stage');
const art=await loadArt();
document.querySelector('#loading').hidden=true;root.hidden=false;
const review=new RetroReview(root,art);
for(const button of document.querySelectorAll('[data-action]'))button.addEventListener('click',()=>{
  const action=button.dataset.action;
  if(action==='restart')review.start(Number(document.querySelector('#length').value));
  if(action==='pause')review.togglePause();
  if(action==='fullscreen')review.fullscreen();
  if(action==='scene')review.reviewScene();
});
document.querySelector('#gray').addEventListener('change',e=>root.classList.toggle('gray',e.target.checked));
document.querySelector('#speed').addEventListener('change',e=>{review.state.cadence=Number(e.target.value);review.rules=createRules({...review.rules,ticksPerCell:Number(e.target.value)});review.state.rulesKey=review.rules.key});
window.retroV5=review;
