import {createFlySimulation} from './fly-simulation.js';
import {TunnelSession} from '../../arcade/snake-next/gate-one/session.js';

const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join()===keys.sort().join();
export const MAX_TICKS=2592000; // Existing 12-hour attempt lifetime, not a client-selected limit.
function requireProof(ok){if(!ok)throw Error('invalid_replay');}
export function verifyFly(seed,proof){
 requireProof(exact(proof,['version','ticks','events'])&&proof.version==='fly-proof-v1'&&integer(proof.ticks,1,MAX_TICKS)&&Array.isArray(proof.events)&&proof.events.length<=30000);
 let prior=-1;const counts=new Map();
 for(const e of proof.events){requireProof(Array.isArray(e)&&integer(e[0],0,proof.ticks-1)&&e[0]>=prior&&((e.length===2&&e[1]===1)||(e.length===3&&e[1]===2&&(e[2]===0||e[2]===1))));prior=e[0];counts.set(prior,(counts.get(prior)||0)+1);requireProof(counts.get(prior)<=32);}
 const game=createFlySimulation(seed);let index=0,holding=false;
 for(let tick=0;tick<proof.ticks;tick++){
  requireProof(game.model.running);
  while(index<proof.events.length&&proof.events[index][0]===tick){const e=proof.events[index++];if(e[1]===1)game.boost();else holding=e[2]===1;}
  game.step(holding);
 }
 requireProof(index===proof.events.length&&!game.model.running&&game.model.crashing);
 const summary=game.summary();return {...summary,duration_ms:Math.round(summary.ticks*1000/60)};
}
export function verifySnake(seed,proof){
 requireProof(exact(proof,['version','ticks','commands'])&&proof.version==='snake-proof-v1'&&integer(proof.ticks,1,MAX_TICKS+27)&&Array.isArray(proof.commands)&&proof.commands.length<=30000);
 let prior=0;const counts=new Map();
 for(const e of proof.commands){requireProof(Array.isArray(e)&&e.length===4&&integer(e[0],1,proof.ticks)&&e[0]>=prior&&integer(e[1],0,2147483647)&&integer(e[2],0,3)&&(e[3]===0||e[3]===1));prior=e[0];counts.set(prior,(counts.get(prior)||0)+1);requireProof(counts.get(prior)<=32);}
 const s=new TunnelSession({seed,touch:false,progression:{model:'fit-world-v2',freeTrigger:15,startStage:0,maxWorldStage:2}});
 let index=0,activeTicks=0,maxCombo=0,bonuses=0;
 for(let tick=1;tick<=proof.ticks;tick++){
  requireProof(s.status!=='result');const commands=[];
  while(index<proof.commands.length&&proof.commands[index][0]===tick){const e=proof.commands[index++];commands.push({tick:1,sequence:e[1],direction:e[2],repeat:e[3]===1});}
  if(s.status==='playing')activeTicks++;else requireProof(commands.length===0);
  s.advance(commands);maxCombo=Math.max(maxCombo,s.combo||0);bonuses+=s.events.filter(e=>e.kind==='positive'||e.kind==='negative').length;
 }
 requireProof(index===proof.commands.length&&s.status==='result');
 return {score:s.score,ticks:activeTicks,duration_ms:Math.round(activeTicks*1000/60),audit:{seed,foods:s.foods,length:s.state.length,max_combo:maxCombo,portal_uses:s.portalCompleted||s.portal.transfers||0,expansions:s.capacityExpansions?.length||0,stage:s.stage.index,bonuses,final_hash:s.hash()}};
}
export function verifyClaim(game,seed,proof,claimed){
 requireProof(claimed&&typeof claimed==='object'&&!Array.isArray(claimed));
 const summary=game==='snake'?verifySnake(seed,proof):game==='fly'?verifyFly(seed,proof):null;
 requireProof(summary!==null&&summary.score===claimed.score);
 if(game==='fly')for(const key of ['spores','gates','jumps'])requireProof(claimed[key]===summary[key]);
 if(game==='snake')requireProof(claimed.active_ticks===summary.ticks&&claimed.final_hash===summary.audit.final_hash);
 return summary;
}
