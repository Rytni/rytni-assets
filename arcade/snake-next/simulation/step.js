import {enqueueTurn,takeTurn} from '../input/turns.js';
import {neighbour} from './rules.js';
import {occupied,bodyCell,moveBody} from './body.js';
import {chooseFood} from './food.js';
import {emit} from './state.js';

/** One authoritative tick; no render timestamps.
 * @param {import('./types.js').State} state
 * @param {ReturnType<typeof import('../world/arena.js').createArena>} arena
 * @param {ReturnType<typeof import('./rules.js').createRules>} rules
 * @param {import('./types.js').TurnCommand[]} commands
 * @returns {boolean} Whether the run remains active.
 */
export function step(state,arena,rules,commands=[]) {
  state.events.length=0;
  if(state.status!=='playing')return false;
  if(state.rulesKey!==rules.key||state.arenaHash!==arena.topologyHash)throw Error('Session configuration mismatch');
  state.tick++;
  for(const command of commands)enqueueTurn(state,command);
  if(++state.movePhase<rules.ticksPerCell)return true;
  state.movePhase=0;state.direction=takeTurn(state);
  const next=neighbour(bodyCell(state,0),state.direction,arena.width,arena.height);
  const eat=next===state.food,grow=state.growth+(eat?rules.foodGrowth:0)>0;
  const tail=bodyCell(state,state.length-1);
  const collision=arena.blocked(next)?'obstacle':occupied(state,next)&&!(next===tail&&!grow)?'self':null;
  if(collision){state.status='dead';state.reason=collision;emit(state,'death',{reason:collision,cell:next});return false;}
  moveBody(state,next,grow);if(grow)state.growth+=(eat?rules.foodGrowth:0)-1;
  if(eat){
    state.score+=rules.foodScore;state.food=-1;emit(state,'food-consumed',{cell:next,score:state.score});
    state.food=chooseFood(state,arena);
    if(state.food<0){state.status='full';state.reason=state.length===arena.freeCount?'arena-filled':'no-legal-food';emit(state,'terminal',{reason:state.reason});}
    else emit(state,'food-spawned',{cell:state.food});
  }
  return state.status==='playing';
}
