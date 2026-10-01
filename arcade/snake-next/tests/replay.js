import {step} from '../simulation/step.js';
import {createState} from '../simulation/state.js';
import {stateHash} from '../simulation/hash.js';
export function replay({seed,rules,arena,inputs=[],ticks,stateOptions={}}) {
  if(!Number.isSafeInteger(ticks)||ticks<0)throw Error('Invalid replay tick count');
  for(let i=0;i<inputs.length;i++)if(inputs[i].tick<1||!Number.isSafeInteger(inputs[i].tick)||!Number.isSafeInteger(inputs[i].sequence)||inputs[i].sequence<0||!Number.isInteger(inputs[i].direction)||inputs[i].direction<0||inputs[i].direction>3||i&&(inputs[i].tick<inputs[i-1].tick||inputs[i].sequence<=inputs[i-1].sequence))throw Error('Input log must be valid and tick/sequence ordered');
  const state=createState({seed,rules,arena,...stateOptions}),events=[];let at=0;
  for(let tick=1;tick<=ticks&&state.status==='playing';tick++){
    const commands=[];while(at<inputs.length&&inputs[at].tick===tick)commands.push(inputs[at++]);
    step(state,arena,rules,commands);events.push(...state.events);
  }
  return {state,hash:stateHash(state),events};
}
