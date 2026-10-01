import {deriveSeed} from './prng.js';
import {mark} from './body.js';
import {chooseFood,validateFood} from './food.js';
import {createArena} from '../world/arena.js';

export function createState({seed,session='training',rules,arena,body=arena.initialBody,direction=arena.initialDirection,food}) {
  if(arena.width!==rules.width||arena.height!==rules.height)throw Error('Rules/arena dimensions mismatch');
  createArena({...arena.exportTopology(),initialBody:body,initialDirection:direction,runwayCells:0});
  const state={seed,session,rulesVersion:rules.version,rulesKey:rules.key,arenaHash:arena.topologyHash,status:'playing',reason:null,tick:0,movePhase:0,direction,turns:new Uint8Array(2),turnCount:0,lastInputSequence:-1,body:new Uint32Array(arena.cells),headIndex:0,length:body.length,occupancy:new Uint32Array(Math.ceil(arena.cells/32)),growth:0,score:0,food:-1,rng:deriveSeed(seed,`food:${rules.key}`),eventSequence:0,events:[],scratch:{seen:new Uint8Array(arena.cells),queue:new Uint32Array(arena.cells),candidates:new Uint32Array(arena.cells)}};
  state.body.set(body);for(const cell of body)mark(state,cell,true);
  if(food!==undefined){if(!validateFood(state,arena,food))throw Error('Unsafe initial food');state.food=food;}else state.food=chooseFood(state,arena);
  if(state.food<0){state.status='full';state.reason=state.length===arena.freeCount?'arena-filled':'no-legal-food';}
  return state;
}
export function emit(state,type,data={}) { state.events.push({sequence:++state.eventSequence,tick:state.tick,type,...data}); }
