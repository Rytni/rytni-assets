// OFFLINE design probes, never imported by the playable Lab. Not a human bot
// feature, not a benchmark, not a production policy and no privileged spawns.
import {writeFileSync,mkdirSync} from 'node:fs';
import {designSession,ARENAS} from './arena.js';
import {PRESETS,profileCadence,targetSpeed} from './config.js';
import {arenaMeasurements,distances,manhattan} from './measure.js';
import {bodyCells,bodyCell} from '../simulation/body.js';
import {neighbour} from '../simulation/rules.js';

function choose(s,policy){
 const a=s.arena,body=bodyCells(s.state),head=body[0],tail=body.at(-1),blocked=new Set(body.slice(1));if(s.state.growth===0)blocked.delete(tail);
 const from=distances(a,head,blocked),active=s.portal.phase==='armed'&&s.portalAvailable();let goal=s.state.food;
 if(policy==='opportunity'){
  for(const p of s.pickups.filter(p=>p.kind!=='rush'))if(from[p.cell]>=0&&from[p.cell]<=from[goal]+2&&!s.effects.some(e=>e.kind===p.kind))goal=p.cell;
  if(active)for(const entry of s.portals){const exit=s.portals.find(c=>c!==entry),distance=from[entry],remaining=manhattan(exit,goal,a.width);if(distance>=0&&distance+remaining+2<from[goal]-2)goal=entry;}
 }
 const target=distances(a,goal,blocked),choices=[];
 for(let d=0;d<4;d++){
  if(d===(s.state.direction+2)%4)continue;const n=neighbour(head,d,a.width,a.height);if(a.blocked(n)||blocked.has(n))continue;
  const grow=n===s.state.food||s.state.growth>0,next=[n,...(grow?body:body.slice(0,-1))],occupied=new Set(next.slice(1,-1)),future=distances(a,n,occupied),tailSafe=future[next.at(-1)]>=0,area=Array.from(future).filter(v=>v>=0).length;
  const dt=target[n];let score=dt>=0?dt:100+Math.max(0,future[next.at(-1)]);
  if(!tailSafe)score+=1000;if(future[goal]<0&&n!==goal)score+=50;
  score-=area*.002;
  if(s.pickups.some(p=>p.cell===n&&p.kind==='rush'))score+=30;
  if(active&&s.portals.includes(n)&&goal!==n)score+=40;
  if(active&&s.portals.includes(n)){
   const exit=s.portals.find(c=>c!==n),destination=neighbour(exit,d,a.width,a.height),dx=destination%a.width-n%a.width,dy=Math.floor(destination/a.width)-Math.floor(n/a.width);
   if(next.some(c=>{const x=c%a.width+dx,y=Math.floor(c/a.width)+dy;return x<0||x>=a.width||y<0||y>=a.height||a.blocked(y*a.width+x);}))score+=2000;
  }
  choices.push({d,score});
 }
 return choices.sort((a,b)=>a.score-b.score||a.d-b.d)[0]?.d??s.state.direction;
}
const current=[];
for(const touch of [false,true])for(const policy of ['food','opportunity'])for(const seed of [56103,17,777]){
 const s=designSession(PRESETS.B,{touch,seed}),checkpoints=[];
 for(let tick=1;tick<=18000&&s.status==='playing';tick++){
  const command=!['entering','teleport'].includes(s.portal.phase)&&s.state.movePhase>=s.cadence()-1?[{tick:1,sequence:tick,direction:choose(s,policy)}]:[];s.advance(command);
  if([3600,7200,18000].includes(tick))checkpoints.push({requestedSeconds:tick/60,censored:false,...structuredClone(s.telemetry.summary(s)),...s.telemetry.pacingSummary(s)});
 }
 for(const seconds of [60,120,300])if(!checkpoints.some(r=>r.requestedSeconds===seconds))checkpoints.push({requestedSeconds:seconds,censored:true,...structuredClone(s.telemetry.summary(s)),...s.telemetry.pacingSummary(s)});
 current.push({touch,policy,seed,checkpoints,endCoreStatus:s.state.status,endCoreReason:s.state.reason,foodSpawns:s.telemetry.foodSpawns,foodTrips:s.telemetry.foodTrips,bonusSpawns:s.telemetry.bonusSpawns});
}
const arenas=[];for(const touch of [false,true])for(const arenaPreset of Object.keys(ARENAS))for(const density of ['LOW','MEDIUM','HIGH'])arenas.push({touch,arenaPreset,density,...arenaMeasurements(designSession(PRESETS.B,{touch,arenaPreset,density}))});
const travel=[0,60,120,300].map(seconds=>{const cadence=profileCadence(PRESETS.B,seconds*60),speed=60/cadence;return {seconds,target:targetSpeed(PRESETS.B,seconds*60),cadence,effective:speed,horizontal25:25/speed,vertical9:9/speed,oppositeCorners34:34/speed};});
const result={method:'Deterministic legal-input model probes: food-first and opportunity-aware planners; 3 seeds each on desktop/mobile. Not human typical runs. No hidden spawn, restart, length cap or simulation override. Dead runs are censored, not counted as completed 300s runs.',arenas,travel,current};
const out=new URL('../../../docs/qa/forest-design-review/',import.meta.url);mkdirSync(out,{recursive:true});writeFileSync(new URL('measurements.json',out),JSON.stringify(result,null,2)+'\n');
for(const r of current)console.log(JSON.stringify({touch:r.touch,policy:r.policy,seed:r.seed,checkpoints:r.checkpoints.map(c=>({seconds:c.requestedSeconds,censored:c.censored,actual:c.duration,foods:c.foods,length:c.length,positive:c.positivePickups,negative:c.negativePickups,portal:c.portalUses,appearances:c.portalAppearances,combo:c.averageCombo,breaks:c.comboBreaks.length,quiet:c.quietIntervals.length,foodDistance:c.averageSpawnDistance,trip:c.averageTripSeconds}))}));
