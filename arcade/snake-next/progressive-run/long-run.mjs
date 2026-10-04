// Offline legal-input architecture witness, never imported by the DEV game.
import {ProgressiveSession} from './session.js';
import {distances} from '../tuning-lab/measure.js';
import {bodyCells,occupied} from '../simulation/body.js';
import {neighbour} from '../simulation/rules.js';
import {validateFood} from '../simulation/food.js';
import {writeFileSync,mkdirSync} from 'node:fs';

function choose(s){
 const body=bodyCells(s.state),head=body[0],blocked=new Set(body.slice(1));if(!s.state.growth)blocked.delete(body.at(-1));const target=distances(s.arena,s.state.food,blocked),choices=[];
 for(let d=0;d<4;d++){
  if(d===(s.state.direction+2)%4)continue;const n=neighbour(head,d,s.arena.width,s.arena.height);if(s.arena.blocked(n)||blocked.has(n))continue;
  const grows=n===s.state.food||s.state.growth>0,after=[n,...(grows?body:body.slice(0,-1))],future=distances(s.arena,n,new Set(after.slice(1,-1))),tailSafe=future[after.at(-1)]>=0;
  let score=target[n]>=0?target[n]:100+(future[after.at(-1)]>=0?future[after.at(-1)]:500);if(!tailSafe)score+=1000;
  if(s.portalAvailable()&&s.portals.includes(n))score+=200;score-=Array.from(future).filter(v=>v>=0).length*.0001;choices.push({d,score});
 }
 return choices.sort((a,b)=>a.score-b.score||a.d-b.d)[0]?.d??s.state.direction;
}
const runs=[];
for(const seed of [17,56103,777]){
 const s=new ProgressiveSession({seed}),replay=[],stages=[];let old=-1,foodErrors=0,spawnErrors=0,expansionInvalidations=0,temporarilyUnreachableFrames=0;
 for(let tick=1;tick<=54000&&s.status==='playing'&&s.foods<260;tick++){
  const commands=!['entering','teleport'].includes(s.portal.phase)&&s.state.movePhase>=s.cadence()-1?[{sequence:tick,direction:choose(s),tick:1}]:[];
  const priorFood=s.state.food,priorRevision=s.world.revision,priorValid=validateFood(s.state,s.arena,priorFood);
  if(commands.length)replay.push({tick,commands});s.advance(commands);
  const valid=validateFood(s.state,s.arena,s.state.food);
  if(s.state.food>=0&&(s.arena.blocked(s.state.food)||occupied(s.state,s.state.food)||s.forbidden(s.state.food)))foodErrors++;
  if(s.state.food!==priorFood&&s.status==='playing'&&!valid)spawnErrors++;
  if(s.world.revision!==priorRevision&&priorValid&&s.state.food===priorFood&&!valid)expansionInvalidations++;
  if(!valid)temporarilyUnreachableFrames++;
  if(s.stage.index!==old){stages.push({tick:s.tick,foods:s.foods,stage:s.stage.chapter,biome:s.stage.biome,world:[s.world.width,s.world.height],length:s.state.length});old=s.stage.index;}
 }
 const replayed=new ProgressiveSession({seed,touch:true});let i=0;for(let tick=1;tick<=s.tick;tick++)replayed.advance(replay[i]?.tick===tick?replay[i++].commands:[]);
 const result={seed,seconds:s.tick/60,foods:s.foods,length:s.state.length,status:s.status,reason:s.state.reason,stages,foodErrors,spawnErrors,expansionInvalidations,temporarilyUnreachableFrames,hash:s.hash(),replayHash:replayed.hash(),director:s.director.counts};runs.push(result);console.log(JSON.stringify(result));
 if(s.foods>=260&&s.stage.index>=4&&s.hash()===replayed.hash()&&!foodErrors&&!spawnErrors&&!expansionInvalidations)break;
}
const path=new URL('../../../docs/qa/progressive-run/',import.meta.url);mkdirSync(path,{recursive:true});writeFileSync(new URL('long-run.json',path),JSON.stringify({method:'Offline deterministic legal-input planner; natural mushrooms and thresholds, no forced expansions or food spawns; mobile replay of identical commands.',runs},null,2)+'\n');
if(!runs.some(r=>r.foods>=260&&r.length>=250&&r.stages.some(s=>s.stage==='Caves')&&r.stages.some(s=>s.stage==='Swamp')&&r.hash===r.replayHash&&!r.foodErrors&&!r.spawnErrors&&!r.expansionInvalidations))throw Error('No complete deterministic long-run witness');
