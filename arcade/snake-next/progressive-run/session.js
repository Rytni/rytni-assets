import {Session} from '../forest-training/session.js';
import {createRules,step} from '../entry.js';
import {bodyCell} from '../simulation/body.js';
import {hashText} from '../simulation/prng.js';
import {PRESETS} from '../tuning-lab/config.js';
import {attachTelemetry} from '../tuning-lab/telemetry.js';
import {config,VERSION,STRIDE,ROWS,stageAt,cadence,eventPressure} from './config.js';
import {topology,expandWorld,installTopology} from './world.js';
import {Director,DEFINITIONS} from './director.js';
import {manhattan,distances} from '../tuning-lab/measure.js';

export class ProgressiveSession extends Session {
 constructor(options={}){
  const c=config(options.progression),initial=stageAt(c.thresholds[c.startStage],c),world={width:initial.world[0],height:initial.world[1],biome:initial.biome,obstacles:c.density?[{cell:9*STRIDE+14,kind:'stone'}]:[],hazards:[],revision:0};
  const pacing={...PRESETS.B,config:{version:VERSION,...c},cadence:tick=>cadence(tick,initial.at,c),portalWindowOpen:()=>false};
  super({...options,touch:false,arena:topology(world),rules:createRules({version:VERSION,width:STRIDE,height:ROWS,ticksPerCell:14,runwayCells:4,minFreeCells:1,obstacleBlocks:0,firstFoodAhead:4}),pacing});
  this.config=c;this.world=world;this.progressBias=initial.at;this.progress=this.foods+this.progressBias;this.stage=initial;this.director=new Director(this.state.seed);
  this.spores=[];this.announcements=[];this.transitions=[];this.devCommands=[];this.stageChanges=0;this.design={arenaPreset:'PROGRESSIVE',density:c.density};
  this.director.next.positive=this.director.interval(this,'positive');this.director.next.negative=this.director.interval(this,'negative');
  this.portals=[3*STRIDE+10,8*STRIDE+18];this.nextPickup={positive:Number.MAX_SAFE_INTEGER,negative:Number.MAX_SAFE_INTEGER};
  this.view={x:0,y:0,cols:28,rows:12};this.rocks=world.obstacles.map(o=>({x:o.cell%STRIDE,y:Math.floor(o.cell/STRIDE)}));
  this.pacing.cadence=tick=>cadence(tick,this.progress,this.config);this.pacing.portalWindowOpen=()=>this.tick<this.director.windowEnd;
  if(initial.index>0){const start={...this.world,width:28,height:12};this.world=start;expandWorld(this,initial);}
  const t=attachTelemetry(this,PRESETS.B).telemetry,observe=t.observe.bind(t);
  // Existing telemetry understands old effects; keep it read-only via a facade.
  t.observe=(s,before)=>{const known=k=>['focus','harvest','rush'].includes(k),previous=new Set(before.pickups.map(p=>p.kind+':'+p.cell+':'+p.ends)),added=s.pickups.filter(p=>!known(p.kind)&&!previous.has(p.kind+':'+p.cell+':'+p.ends));
   for(const p of added){if(DEFINITIONS[p.kind].positive)t.positiveSpawns++;else t.negativeSpawns++;t.bonusSpawns.push({tick:s.tick,kind:p.kind,distance:manhattan(bodyCell(s.state,0),p.cell,STRIDE),terrainDistance:distances(s.arena,bodyCell(s.state,0))[p.cell]});}
   observe(Object.assign(Object.create(s),{pickups:s.pickups.filter(p=>known(p.kind)),events:[...s.events,...added.map(p=>({kind:'director-spawn',tick:s.tick,cell:p.cell,effect:p.kind}))]}),{...before,pickups:before.pickups.filter(p=>known(p.kind))});
  };
 }
 forbidden(cell){return super.forbidden(cell)||(this.spores||[]).some(p=>p.cell===cell)||(this.director?.warnings||[]).some(p=>p.cell===cell);}
 collect(kind,cell){const d=DEFINITIONS[kind];if(!d)return false;const existing=this.effects.find(e=>e.kind===kind);
  if(existing){existing.ends=this.tick+d.duration;existing.charges=d.charge?1:undefined;}
  else {if(this.effects.filter(e=>DEFINITIONS[e.kind].positive===d.positive).length>=(d.positive?2:1))return false;this.effects.push({kind,ends:this.tick+d.duration,...(d.charge?{charges:1}:{})});}
  if(kind==='brambles')this.director.warn(this);
  this.emit(d.positive?'positive':'negative',cell,{effect:kind,refresh:!!existing});this.feedback.push({kind:d.positive?'positive':'negative',effect:kind,cell,tick:this.tick,label:d.label});return true;
 }
 forceExpansion(){const next=this.stage.index<4?this.config.thresholds[this.stage.index+1]:this.config.thresholds[4]+(this.stage.index-3)*this.config.endlessInterval;this.devCommands.push({tick:this.tick+1,progress:next});}
 guardCollision(commands){if(this.status!=='playing'||['entering','teleport'].includes(this.portal.phase)||!this.effects.some(e=>e.kind==='guard')||this.state.movePhase<this.cadence()-1)return;
  const clone=structuredClone(this.state);clone.cadence=this.cadence();step(clone,this.arena,this.rules,commands.map(c=>({...c,tick:clone.tick+1})));
  if(clone.reason!=='obstacle')return;this.effects=this.effects.filter(e=>e.kind!=='guard');
  // Absorb one environment impact without passing through stone/wall. A full
  // cell interval to turn, with original input queue preserved. Never self.
  this.state.movePhase=-1;return true;
 }
 advance(commands=[]){
  const oldStatus=this.status,oldStage=this.stage.index,previousScore=this.score,previousLength=this.state.length;
  const dev=this.devCommands.filter(c=>c.tick===this.tick+1);for(const c of dev)this.progressBias=Math.max(this.progressBias,c.progress-this.foods);
  this.progress=this.progressBias+this.foods;
  if(this.effects.some(e=>e.kind==='anchor'&&e.ends>this.tick+1)&&this.combo>0)this.lastFood++;
  this.pacing.comboTimeout=this.effects.some(e=>e.kind==='decay')?7:12;
  const guarded=this.guardCollision([...this.transitCommands,...commands]);super.advance(commands);if(guarded){this.emit('guard-used',bodyCell(this.state,0));this.feedback.push({kind:'positive',cell:bodyCell(this.state,0),tick:this.tick,label:'ЩИТ'});}
  if(oldStatus!=='playing')return;
  const mushroom=this.events.find(e=>e.kind==='seed');
  if(mushroom){const normal=Math.round(100*(1+(14-this.pacing.cadence(this.tick))*.08)*(1+(this.combo-1)*.15))*(this.effects.some(e=>e.kind==='harvest')?2:1);const amount=Math.round(normal*this.stage.multiplier*(this.effects.some(e=>e.kind==='weak')?.6:1));this.score=previousScore+amount;mushroom.amount=amount;const fx=this.feedback.find(f=>f.kind==='seed'&&f.tick===this.tick);if(fx)fx.amount=amount;
   if(this.effects.some(e=>e.kind==='spores'))this.director.sporeDrop(this);
  }
  const head=bodyCell(this.state,0);for(const p of this.spores.filter(p=>p.cell===head)){const amount=Math.round(25*this.stage.multiplier);this.score+=amount;this.emit('spore',head,{amount});this.feedback.push({kind:'seed',cell:head,tick:this.tick,amount});}
  this.spores=this.spores.filter(p=>p.cell!==head);
  if(this.events.some(e=>e.kind==='portal-exit')&&this.effects.some(e=>e.kind==='portalPrize')){const amount=Math.round(300*this.stage.multiplier);this.score+=amount;this.combo=Math.min(8,this.combo+2);this.lastFood=this.tick;this.effects=this.effects.filter(e=>e.kind!=='portalPrize');this.emit('portal-reward',head,{amount});this.feedback.push({kind:'seed',cell:head,tick:this.tick,amount});}
  this.progress=this.foods+this.progressBias;const next=stageAt(this.progress,this.config);
  for(const milestone of [30,100,250])if(previousLength<milestone&&this.state.length>=milestone)this.announcements.push({tick:this.tick,text:'ДЛИНА '+milestone});
  if(next.index!==oldStage&&this.status==='playing'){
   const previous=this.stage;this.stage=next;expandWorld(this,next);this.stageChanges++;
   this.transitions.push({tick:this.tick,from:previous.biome,to:next.biome});if(this.transitions.length>12)this.transitions.shift();
   this.announcements.push({tick:this.tick,text:next.index===1?'ЛЕС РАСШИРЯЕТСЯ':next.chapter.toUpperCase()+' · ×'+next.multiplier.toFixed(2)});this.emit('expansion',head,{stage:next.index,width:this.world.width,height:this.world.height});
  }
  this.director.step(this);this.announcements=this.announcements.filter(a=>this.tick-a.tick<150);
  if(this.status!=='playing'){if(this.world.hazards.length){this.world.hazards=[];installTopology(this);}this.director.warnings=[];this.spores=[];}
  // No idle score or progression; only seed/spore/portal-prize awards above.
 }
 portalAvailable(){return !this.director?false:this.tick<this.director.windowEnd;}
 hash(){return hashText(JSON.stringify({version:VERSION,base:super.hash(),config:this.config,progress:this.progress,progressBias:this.progressBias,world:this.world,director:this.director.snapshot(),spores:this.spores,devCommands:this.devCommands,stage:this.stage.index})).toString(16).padStart(8,'0');}
 progressionSummary(){return {version:VERSION,progress:this.progress,foods:this.foods,stage:this.stage,world:[this.world.width,this.world.height],pressure:eventPressure(this.progress,this.config),speed:60/this.cadence(),multiplier:this.stage.multiplier,director:this.director.snapshot(),hazards:this.world.hazards.length,warning:this.director.warnings.length,preview:this.config.startStage>0||this.devCommands.length>0};}
}
