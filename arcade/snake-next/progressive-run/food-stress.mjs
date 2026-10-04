// Functional deterministic stress, not a performance/fun benchmark.
import {writeFileSync,mkdirSync} from 'node:fs';
import {ProgressiveSession} from './session.js';
import {choose} from './food-planner.mjs';
import {foodField,foodLegal} from './food.js';
import {bodyCell} from '../simulation/body.js';
const seeds=[17,56103,777,0,1,2,3,7,42,99,65535,4294967295];
let rng=0x95ab321;while(seeds.length<50){rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;rng>>>=0;if(!seeds.includes(rng))seeds.push(rng);}
const runs=[];let warningActivations=0,warningRejections=0;
for(const seed of seeds){
 const s=new ProgressiveSession({seed}),replay=[],stages=[],pendingEpisodes=[];let oldStage=-1,unsafeSpawn=0,unreachableAtSpawn=0,expansionInvalidation=0,hazardInvalidation=0,spawnChecks=0;
 const directorStep=s.director.step.bind(s.director);
 s.director.step=q=>{
  const due=q.director.warnings.some(w=>w.starts<=q.tick)||q.world.hazards.some(h=>h.ends<=q.tick),food=q.state.food,field=due?foodField(q):null,revision=q.world.revision;
  // A biome expansion does not relocate food. Motion may transiently close
  // its route independently; do not mislabel that as a topology failure.
  if(q.events.some(e=>e.kind==='expansion')&&food>=0&&!foodLegal(q,food))expansionInvalidation++;
  directorStep(q);
  if(due&&revision!==q.world.revision&&food>=0&&field.seen[food]&&(!foodLegal(q,food)||!foodField(q).seen[food]))hazardInvalidation++;
 };
 for(let tick=1;tick<=54000&&s.status==='playing'&&s.foods<260;tick++){
  const commands=!['entering','teleport'].includes(s.portal.phase)&&s.state.movePhase>=s.cadence()-1?[{sequence:tick,direction:choose(s),tick:1}]:[];
  if(commands.length)replay.push({tick,commands});s.advance(commands);
  if(s.foodSpawn.pendingSince!==null&&pendingEpisodes.at(-1)?.started!==s.foodSpawn.pendingSince)pendingEpisodes.push({started:s.foodSpawn.pendingSince,foods:s.foods});
  if(s.foodSpawn.pendingSince===null&&pendingEpisodes.at(-1)&&!pendingEpisodes.at(-1).ended)pendingEpisodes.at(-1).ended=s.tick;
  if(s.foodSpawn.last?.tick===s.tick&&s.foodSpawn.last.outcome==='spawned'){
   spawnChecks++;const c=s.state.food;if(!foodLegal(s,c))unsafeSpawn++;if(!foodField(s).seen[c])unreachableAtSpawn++;
  }
  if(s.stage.index!==oldStage){stages.push({tick:s.tick,foods:s.foods,stage:s.stage.index,chapter:s.stage.chapter,world:[s.world.width,s.world.height],length:s.state.length});oldStage=s.stage.index;}
 }
 const mobile=new ProgressiveSession({seed,touch:true});let at=0;for(let tick=1;tick<=s.tick;tick++)mobile.advance(replay[at]?.tick===tick?replay[at++].commands:[]);
 // Independent seeded warning+expiry fixture supplements natural routes:
 // same candidate/effect config, not imported into the playable game.
 const h=new ProgressiveSession({seed,progression:{startStage:3}});h.collect('anchor',0);h.collect('guard',0);h.collect('brambles',0);
 const food=h.state.food,warnings=h.director.warnings.length;h.tick=120;h.director.step(h);warningActivations+=h.world.hazards.length;warningRejections+=warnings-h.world.hazards.length;
 if(!foodLegal(h,food)||!foodField(h).seen[food])hazardInvalidation++;h.tick=480;h.director.step(h);if(h.world.hazards.length)throw Error('Hazard expiry failed');
 const result={seed,ticks:s.tick,seconds:s.tick/60,foods:s.foods,length:s.state.length,status:s.status,reason:s.state.reason,stages,pendingEpisodes,spawnChecks,unsafeSpawn,unreachableAtSpawn,expansionInvalidation,hazardInvalidation,spawn:s.foodSpawn,hash:s.hash(),replayHash:mobile.hash(),director:s.director.counts,activePositive:s.effects.filter(e=>['focus','harvest','anchor','guard','spores','portalPrize'].includes(e.kind)).length,head:bodyCell(s.state,0)};
 runs.push(result);console.log(JSON.stringify({seed,foods:result.foods,length:result.length,reason:result.reason,temporary:result.spawn.counts['temporarily unreachable'],parity:result.hash===result.replayHash}));
}
const totals={seeds:runs.length,allChapters:runs.filter(r=>r.stages.some(s=>s.stage>=4)).length,length100:runs.filter(r=>r.length>=100).length,length250:runs.filter(r=>r.length>=250).length,trueNoLegalFood:runs.filter(r=>r.reason==='no-legal-food').length,boardFull:runs.filter(r=>r.reason==='board_full').length,generatorErrors:runs.reduce((n,r)=>n+r.spawn.counts.generator_error,0),unsafeSpawn:runs.reduce((n,r)=>n+r.unsafeSpawn,0),unreachableAtSpawn:runs.reduce((n,r)=>n+r.unreachableAtSpawn,0),expansionInvalidation:runs.reduce((n,r)=>n+r.expansionInvalidation,0),hazardInvalidation:runs.reduce((n,r)=>n+r.hazardInvalidation,0),spawnChecks:runs.reduce((n,r)=>n+r.spawnChecks,0),temporaryAttempts:runs.reduce((n,r)=>n+r.spawn.counts['temporarily unreachable'],0),tiers:[1,2,3,4].map(t=>runs.reduce((n,r)=>n+r.spawn.tiers[t],0)),hashParity:runs.every(r=>r.hash===r.replayHash),naturalHazards:runs.reduce((n,r)=>n+r.director.hazards,0),warningActivations,warningRejections,endReasons:Object.fromEntries([...new Set(runs.map(r=>r.reason||'test-limit'))].map(reason=>[reason,runs.filter(r=>(r.reason||'test-limit')===reason).length]))};
const dir=new URL('../../../docs/qa/food-reliability/',import.meta.url);mkdirSync(dir,{recursive:true});writeFileSync(new URL('stress.json',dir),JSON.stringify({method:'50 natural seeded runs; unchanged archived legal-input planner; 900s or260 mushrooms or natural terminal; mobile command replay; supplementary seeded2+1 warning/expiry fixtures. No fun or performance claim.',totals,runs},null,2)+'\n');console.log(JSON.stringify(totals));
if(totals.trueNoLegalFood||totals.generatorErrors||totals.unsafeSpawn||totals.unreachableAtSpawn||totals.expansionInvalidation||totals.hazardInvalidation||!totals.hashParity||!totals.length250)throw Error('Food reliability gate failed');
