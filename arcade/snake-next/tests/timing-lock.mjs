// Strip ONLY explicitly unlocked optional timing/model additions before the
// historical byte-lock checks. Collision/turns/spatial rendering stay exact.
export function withoutTimingAdditions(file,source){
 let s=source.replace(/\r\n/g,'\n');
 if(file==='simulation/step.js')s=s.replace("import {MOVE_UNIT} from './timing.js';\n",'').replace("  ++state.movePhase;\n  if(state.movement){\n    state.movement.progress+=state.movement.rate;\n    if(state.movement.progress<MOVE_UNIT)return true;\n    state.movement.progress-=MOVE_UNIT;\n  }else if(state.movePhase<state.cadence)return true;","  if(++state.movePhase<state.cadence)return true;");
 if(file==='forest-training/motion.js')s=s.replace("import {movementAlpha} from '../simulation/timing.js';\n",'').replace("    if(session.state.movement&&!entering)return this.alpha=Math.max(this.floor,this.alpha,movementAlpha(session.state,fraction));\n",'');
 if(file==='progressive-run/config.js')s=s.replace("import {WORLDS} from '../effect-playground/capacity-model.js';\n",'').replace(" if(c.model==='fit-world-v2'&&(c.startStage>3||![15,25,35].includes(c.freeTrigger??15)))throw Error('Invalid FIT WORLD V2 stage/trigger');\n",'').replace(" if(c.model==='fit-world-v2'){const i=Math.min(3,c.startStage);return {...STAGES[i],world:WORLDS[i],index:i};}\n",'');
 return s;
}
