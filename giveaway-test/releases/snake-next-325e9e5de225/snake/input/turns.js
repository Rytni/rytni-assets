import {Direction} from '../simulation/rules.js';
const KEYS=Object.freeze({ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3});
// Keyboard and D-pad both submit the same data command. No listeners/DOM here.
export function keyboardCommand(code,{tick,sequence,repeat=false}) {
  return Object.hasOwn(KEYS,code)?{tick,sequence,direction:KEYS[code],repeat}:null;
}
/** @param {import('../simulation/types.js').State} state
 * @param {import('../simulation/types.js').TurnCommand} command */
export function enqueueTurn(state,command) {
  if(!command||state.status!=='playing'||!Number.isSafeInteger(command.sequence)||command.sequence<=state.lastInputSequence||!Number.isSafeInteger(command.tick)||command.tick<1||command.tick>state.tick||!Number.isInteger(command.direction)||command.direction<Direction.UP||command.direction>Direction.LEFT)return false;
  state.lastInputSequence=command.sequence;
  if(command.repeat||state.turnCount===2)return false;
  const previous=state.turnCount?state.turns[state.turnCount-1]:state.direction;
  if(command.direction===previous||(command.direction+2)%4===previous)return false;
  state.turns[state.turnCount++]=command.direction;return true;
}
export function takeTurn(state) {
  if(!state.turnCount)return state.direction;
  const direction=state.turns[0];state.turns[0]=state.turns[1];state.turns[1]=0;state.turnCount--;
  return direction;
}
