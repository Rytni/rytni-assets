import {bodyCell} from '../simulation/body.js';
import {validateFood} from '../simulation/food.js';
import {EFFECTS} from '../forest-training/session.js';

const mean=a=>a.length?a.reduce((s,n)=>s+n,0)/a.length:null;
export function deathCause(s){
 const death=s.state.events.find(e=>e.type==='death'),cell=death?.cell,w=s.arena.width,h=s.arena.height;
 if(s.state.reason==='self')return 'self';
 if(s.state.reason==='obstacle'){if(cell==null)return 'other';const x=cell%w,y=Math.floor(cell/w);return x<=0||x>=w-1||y<=0||y>=h-1?'wall':'obstacle';}
 return 'other';
}
export class Telemetry {
 constructor(profile){this.profile=profile;this.samples=[];this.events=[];this.foodIntervals=[];this.foodDistances=[];this.replacementTicks=[];this.foodFailures=0;this.positiveSpawns=0;this.negativeSpawns=0;this.positive=0;this.negative=0;this.portalAppearances=0;this.portalUses=0;this.portalRejected=0;this.maxCombo=0;this.comboSum=0;this.speedSum=0;this.count=0;this.comboBreaks=[];this.lastFood=null;this.death=null;this.end=null;this.wasVisible=false;}
 observe(s,before){
  if(before.status!=='playing')return;
  this.count++;const speed=60/s.cadence();this.speedSum+=speed;this.comboSum+=s.combo;this.maxCombo=Math.max(this.maxCombo,s.combo);
  const visible=['entering','teleport','exit-grace'].includes(s.portal.phase)||(s.portal.phase==='armed'&&s.portalAvailable());
  if(visible&&!this.wasVisible)this.portalAppearances++;this.wasVisible=visible;
  const existing=new Set(before.pickups.map(p=>p.kind+':'+p.cell+':'+p.ends));for(const p of s.pickups)if(!existing.has(p.kind+':'+p.cell+':'+p.ends)){if(EFFECTS[p.kind].positive)this.positiveSpawns++;else this.negativeSpawns++;}
  for(const e of s.events){
   if(e.kind==='seed'){
    if(this.lastFood){this.foodIntervals.push((e.tick-this.lastFood.tick)/60);this.foodDistances.push(s.moves-this.lastFood.moves);}
    this.lastFood={tick:e.tick,moves:s.moves};
    const valid=s.state.food>=0&&!s.forbidden(s.state.food)&&validateFood(s.state,s.arena,s.state.food);
    if(valid)this.replacementTicks.push(s.tick-e.tick);else this.foodFailures++;
   }
   if(e.kind==='positive')this.positive++;if(e.kind==='negative')this.negative++;
   if(e.kind==='portal-exit')this.portalUses++;if(e.kind==='portal-rejected')this.portalRejected++;
   if(e.kind==='death'){this.death={cause:deathCause(s),speed:60/s.state.cadence,duration:s.tick/60,length:s.state.length,score:s.score,effects:before.effects.map(e=>e.kind),cell:s.state.events.find(e=>e.type==='death')?.cell};this.finish(s,'death');}
   this.events.push({time:e.tick/60,...e});if(this.events.length>100)this.events.shift();
  }
  if(before.combo>0&&(s.combo===0||s.status==='dying')){this.comboBreaks.push({time:s.tick/60,reason:s.status==='dying'?'death':'timeout'});}
  if(s.tick%60===0)this.samples.push({time:s.tick/60,speed,score:s.score,combo:s.combo});if(this.samples.length>1800)this.samples.shift();
 }
 finish(s,reason){if(!this.end){if(reason!=='death'&&s.combo>0)this.comboBreaks.push({time:s.tick/60,reason});this.end={reason,time:s.tick/60,score:s.score,length:s.state.length,foods:s.foods};}}
 summary(s){return {preset:this.profile.id,profile:this.profile,duration:this.end?.time??s.tick/60,score:this.end?.score??s.score,length:this.end?.length??s.state.length,foods:this.end?.foods??s.foods,maxCombo:this.maxCombo,averageCombo:this.count?this.comboSum/this.count:0,comboBreaks:this.comboBreaks,averageSpeed:this.count?this.speedSum/this.count:0,positiveSpawns:this.positiveSpawns,negativeSpawns:this.negativeSpawns,positivePickups:this.positive,negativePickups:this.negative,portalAppearances:this.portalAppearances,portalUses:this.portalUses,portalRejected:this.portalRejected,portalCooldown:this.profile.portalCooldown,portalCooldownRemaining:s.portal.phase==='cooldown'?Math.max(0,this.profile.portalCooldown-s.portal.elapsed/60):0,averageFoodSeconds:mean(this.foodIntervals),averageFoodDistance:mean(this.foodDistances),maxReplacementTicks:this.replacementTicks.length?Math.max(...this.replacementTicks):null,foodFailures:this.foodFailures,death:this.death,end:this.end?.reason??s.status};}
 text(s){const r=this.summary(s),seconds=Math.floor(r.duration),f=n=>n==null?'—':n.toFixed(2);return [`Preset ${r.preset}`,`Config: ${JSON.stringify(this.profile)}`,`Run: ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')} (active time)`,`Score: ${r.score}`,`Length: ${r.length}`,`Foods: ${r.foods}`,`Max combo: ${r.maxCombo}; avg ${f(r.averageCombo)}; breaks ${r.comboBreaks.length} (${r.comboBreaks.map(b=>b.reason).join(', ')||'none'})`,`Positive pickups: ${r.positivePickups} / spawned ${r.positiveSpawns}`,`Negative pickups: ${r.negativePickups} / spawned ${r.negativeSpawns}`,`Portals: ${r.portalAppearances} appearances / ${r.portalUses} uses / ${r.portalRejected} unsafe rejects; cooldown ${r.portalCooldown}s`,`Avg speed: ${f(r.averageSpeed)} cells/s`,`Food interval: ${f(r.averageFoodSeconds)}s / ${f(r.averageFoodDistance)} cells; replacement ${r.maxReplacementTicks??'—'} ticks; failures ${r.foodFailures}`,`Death: ${r.death?JSON.stringify(r.death):'none'}`,`End: ${r.end}`].join('\n');}
}
export function attachTelemetry(s,profile){
 const telemetry=new Telemetry(profile),advance=s.advance.bind(s);s.advance=commands=>{const before={status:s.status,combo:s.combo,speed:60/s.cadence(),effects:s.effects.map(e=>({...e})),pickups:s.pickups.map(p=>({...p})),head:bodyCell(s.state,0)};advance(commands);telemetry.observe(s,before);};s.telemetry=telemetry;return s;
}
