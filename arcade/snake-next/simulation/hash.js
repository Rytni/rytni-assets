import {hashText} from './prng.js';
import {bodyCell} from './body.js';
// Semantic state, not ring layout/scratch/presentation; events have stable sequence.
export function stateHash(state) {
  let h=hashText(`${state.session}|${state.rulesVersion}|${state.status}|${state.reason}`);
  const word=value=>{h=Math.imul(h^(value>>>0),16777619)>>>0;};
  for(const key of ['seed','rulesKey','arenaHash','tick','movePhase','direction','length','growth','score','food','rng','lastInputSequence','turnCount','eventSequence'])word(state[key]);
  for(let i=0;i<state.turnCount;i++)word(state.turns[i]);
  for(let i=0;i<state.length;i++)word(bodyCell(state,i));
  for(const n of state.occupancy)word(n);
  return h.toString(16).padStart(8,'0');
}
