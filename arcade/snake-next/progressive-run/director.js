import {deriveSeed,randomIndex} from '../simulation/prng.js';
import {EFFECTS} from '../forest-training/session.js';
import {eventPressure} from './config.js';
import {hazardSafe,installTopology} from './world.js';
import {bodyCell} from '../simulation/body.js';
import {manhattan} from '../tuning-lab/measure.js';
import {reachableFoodCells} from '../simulation/food.js';

export const DEFINITIONS=Object.freeze({...EFFECTS,
 anchor:{positive:true,duration:480,label:'ЯКОРЬ',icon:'clock',cue:'anchor'},
 spores:{positive:true,duration:600,label:'СПОРЫ',icon:'flower',cue:'spores'},
 guard:{positive:true,duration:1200,label:'ЩИТ',icon:'shield',cue:'guard',charge:true},
 portalPrize:{positive:true,duration:1080,label:'ПОРТАЛ+',icon:'ring',cue:'portalPrize',charge:true},
 weak:{positive:false,duration:480,label:'ПОРЧА',icon:'slash',cue:'weak'},
 decay:{positive:false,duration:480,label:'КОМБО-',icon:'hourglass',cue:'decay'},
 brambles:{positive:false,duration:480,label:'КОРНИ',icon:'thorns',cue:'brambles'},
 mist:{positive:false,duration:360,label:'ТУМАН',icon:'cloud',cue:'mist'}
});
export class Director {
 constructor(seed){this.rng=deriveSeed(seed,'content-director-v1');this.next={positive:600,negative:1080,portal:1800};this.windowEnd=0;this.counts={positive:0,negative:0,portal:0,hazards:0,spores:0};this.warnings=[];}
 interval(s,kind){const p=eventPressure(s.progress,s.config),base=s.config[kind+'Interval'],min={positive:4,negative:8,portal:24}[kind],biome=s.stage.biome;
  return Math.round(60*Math.max(min,base*(1-p*.45)*(kind==='portal'&&biome==='caves'?.85:kind==='negative'&&biome==='swamp'?.85:1)));
 }
 candidates(s,positive){let list=positive?['focus','harvest','harvest']:['rush'];
  if(s.config.candidates&&s.stage.index>=1)list.push(...(positive?['anchor','guard']:['weak','decay']));
  if(s.config.candidates&&s.stage.index>=2)list.push(...(positive?['spores','portalPrize']:['brambles','mist']));
  if(s.stage.biome==='forest'&&positive)list.push('focus','harvest');
  if(s.config.candidates&&s.stage.biome==='swamp'&&!positive)list.push('brambles','weak');
  if(s.config.candidates&&s.stage.index>=2&&eventPressure(s.progress,s.config)>.45)list.push(...(positive?['spores','portalPrize']:['brambles','weak']));
  return list.filter(k=>!s.pickups.some(p=>p.kind===k)&&s.effects.filter(e=>DEFINITIONS[e.kind].positive===positive).length<(positive?2:1));
 }
 spawn(s,positive){if(s.pickups.length>=3)return;const choices=this.candidates(s,positive);if(!choices.length)return;const cell=s.freeCell();if(cell<0)return;
  const kind=choices[randomIndex(this,choices.length)],p=eventPressure(s.progress,s.config);
  s.pickups.push({kind,cell,ends:s.tick+Math.round(60*(20-6*p))});this.counts[positive?'positive':'negative']++;
 }
 warn(s){if(this.warnings.length+s.world.hazards.length>=2||s.tick<(this.hazardCooldown||0))return;
  this.hazardCooldown=s.tick+1200;
  for(let i=0;i<40&&this.warnings.length+s.world.hazards.length<2;i++){const cell=s.freeCell();if(cell>=0&&!this.warnings.some(w=>w.cell===cell)&&hazardSafe(s,cell))this.warnings.push({cell,starts:s.tick+120,ends:s.tick+480});}
 }
 sporeDrop(s){const count=reachableFoodCells(s.state,s.arena),near=Array.from(s.state.scratch.candidates.subarray(0,count)).filter(c=>c!==s.state.food&&!s.forbidden(c)&&manhattan(c,bodyCell(s.state,0),s.arena.width)<=12);
  for(let i=0;i<2&&s.spores.length<4&&near.length;i++){const at=randomIndex(this,near.length),cell=near.splice(at,1)[0];s.spores.push({cell,ends:s.tick+300});this.counts.spores++;}
 }
 step(s){
  const expired=s.world.hazards.filter(h=>h.ends>s.tick);let dirty=expired.length!==s.world.hazards.length;s.world.hazards=expired;
  const waiting=[],warnings=this.warnings;this.warnings=[];for(const w of warnings){if(s.tick<w.starts)waiting.push(w);else if(hazardSafe(s,w.cell)){s.world.hazards.push(w);this.counts.hazards++;dirty=true;installTopology(s);}}
  this.warnings=waiting;if(dirty)installTopology(s);
  s.spores=s.spores.filter(p=>p.ends>s.tick);
  if(s.status!=='playing'||['entering','teleport'].includes(s.portal.phase))return;
  for(const [kind,positive] of [['positive',true],['negative',false]])if(s.tick>=this.next[kind]){this.spawn(s,positive);this.next[kind]=s.tick+this.interval(s,kind);}
  if(s.tick>=this.next.portal){this.windowEnd=s.tick+600;this.next.portal=s.tick+this.interval(s,'portal');this.counts.portal++;}
 }
 snapshot(){return {rng:this.rng,next:this.next,windowEnd:this.windowEnd,counts:this.counts,warnings:this.warnings,hazardCooldown:this.hazardCooldown||0};}
}
