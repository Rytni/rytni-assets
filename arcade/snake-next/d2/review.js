import {Training} from '../runtime/training.js';
import {D2Renderer} from './renderer.js';
import {D2Resources,D2_ASSETS} from './resources.js';
import {createD2Fixture} from './fixtures.js';
import {bodyCell} from '../simulation/body.js';
import {stateHash} from '../simulation/hash.js';

export class D2Review extends Training {
  constructor(root,{resources=new D2Resources(),manifest=D2_ASSETS}={}){super(root);this.resources=resources;this.manifest=manifest;this.epoch=0;this.view={lod:'auto',grayscale:false,debug:false};this.options={shape:'S',length:30,speed:4,direction:1,automatic:false};this.rendererFactory=(canvas,capacity)=>{const r=new D2Renderer(canvas,capacity,this.resources,{fixture:this.fixture});r.setView(this.view);return r;};}
  async prepare(options,activate){const epoch=++this.epoch;this.stop();this.show('loading');try{await this.resources.load(this.manifest);if(epoch!==this.epoch)return;activate(options);}catch(error){if(epoch===this.epoch){this.show('error');this.root.querySelector('#load-error').textContent=error.message;}}}
  async start(options={}){Object.assign(this.options,options);return this.prepare(this.options,opts=>{this.fixture=createD2Fixture(opts);super.start(this.fixture);this.setView(this.view);if(opts.automatic&&this.state){this.auto=state=>this.trackDirection(state);} });}
  trackDirection(state){const route=this.fixture.route,head=bodyCell(state,0),index=route.indexOf(head);if(index<0)return undefined;const next=route[(index-1+route.length)%route.length],d=next-head;if(Math.abs(d)!==1&&Math.abs(d)!==96)return undefined;const dir=d===1?1:d===-1?3:d===96?2:0;return dir===state.direction?undefined:dir;}
  input(direction,repeat=false,source='qa',time){if(source==='keyboard'||source==='dpad'){this.auto=null;this.options.automatic=false;this.root.querySelector('#automatic').checked=false;}return super.input(direction,repeat,source,time);}
  setView(view){Object.assign(this.view,view);this.renderer?.setView(this.view);this.canvas.style&&(this.canvas.style.filter=this.view.grayscale?'grayscale(1)':'none');if(this.state&&this.ui!=='playing')this.paint(this.alpha??1);}
  stop(){super.stop();this.renderer?.dispose();this.renderer=null;}
  main(){this.epoch++;super.main();}
  dispose(){this.epoch++;this.stop();this.resources.dispose();}
  summary(){return {...super.summary(),raster:this.resources.inventory(),view:{...this.view},automatic:!!this.auto};}
  geometrySummary(){const g=this.renderer.body,h=g.head,t=g.tail,c=this.renderer.camera;return {alpha:g.alpha,head:{...h},tail:{...t},count:g.count,points:Array.from(g.polygon.subarray(0,g.count*4)),width:96,corridor:Array.from(g.corridor),scale:c.scale,transform:{x:this.renderer.width/2-c.x*c.scale,y:this.renderer.height/2-c.y*c.scale},hash:stateHash(this.state)};}
  async captureMetrics(frameCount=600){const values=[];this.recordPerf=true;this.metrics.renderer.length=0;while(values.length<frameCount){await new Promise(resolve=>requestAnimationFrame(resolve));if(this.ui!=='playing')throw Error(`Benchmark interrupted: ${this.ui}`);if(this.metrics.renderer.length){values.push(this.metrics.renderer.at(-1));}}this.recordPerf=false;values.sort((a,b)=>a-b);return {p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],max:values.at(-1),spikes:{over4:values.filter(v=>v>4).length,over8:values.filter(v=>v>8).length,over16_7:values.filter(v=>v>16.7).length},memory:this.resources.inventory()};}
}

export function installD2QA(review){return {scene:options=>review.start(options),phase:alpha=>{review.pause();review.paint(alpha);review.root.querySelector('[data-screen=paused]').hidden=true;return review.geometrySummary();},advance:ticks=>{for(let i=0;i<ticks;i++)review.tick();review.paint(.5);return review.summary();},view:v=>review.setView(v),summary:()=>review.summary(),inventory:()=>review.resources.inventory(),geometrySummary:()=>review.geometrySummary(),captureMetrics:n=>review.captureMetrics(n),stop:()=>review.main(),resume:()=>review.resume()};}
