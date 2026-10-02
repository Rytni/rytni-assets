import {createState} from '../simulation/state.js';
import {bodyCell} from '../simulation/body.js';
/** Proof-only transfer via the foundation's validated state constructor, never raw occupancy edits. */
export function transferState(state,arena,rules,destination){
 const tail=bodyCell(state,state.length-1),dx=destination%arena.width-tail%arena.width,dy=Math.floor(destination/arena.width)-Math.floor(tail/arena.width),body=[];
 for(let i=0;i<state.length;i++){const c=bodyCell(state,i),x=c%arena.width+dx,y=Math.floor(c/arena.width)+dy;if(x<0||x>=arena.width||y<0||y>=arena.height||arena.blocked(y*arena.width+x))return null;body.push(y*arena.width+x);}
 const safeFood=!body.includes(state.food)&&!arena.blocked(state.food),next=createState({seed:state.seed,session:state.session,rules,arena,body,direction:state.direction,...(safeFood?{food:state.food}:{})});
 for(const key of ['score','tick','growth','cadence','lastInputSequence','eventSequence'])next[key]=state[key];if(safeFood)next.rng=state.rng;return next;
}
export class PortalMachine {
 constructor(){this.reset();}
 reset(){this.phase='idle';this.elapsed=0;this.duration=.6;this.length=0;this.transfers=0;this.rejected=0;this.entry=null;this.exit=null;}
 get locked(){return this.phase==='entering'||this.phase==='exiting';}
 begin(entry,exit,length){if(this.phase!=='idle')return false;this.phase='entering';this.elapsed=0;this.entry=entry;this.exit=exit;this.length=length;this.duration=Math.max(.42,Math.min(.9,length*.065));return true;}
 get progress(){return Math.min(1,this.elapsed/(this.phase==='grace'?1.2:this.duration));}
 update(dt,transfer,onExit){
  if(this.phase==='idle')return;this.elapsed+=Math.max(0,dt);
  if(this.phase==='entering'&&this.elapsed>=this.duration){this.elapsed=0;if(transfer()){this.phase='exiting';this.transfers++;}else{this.phase='grace';this.rejected++;onExit(false);}}
  else if(this.phase==='exiting'&&this.elapsed>=this.duration){this.phase='grace';this.elapsed=0;onExit(true);}
  else if(this.phase==='grace'&&this.elapsed>=1.2){this.phase='idle';this.elapsed=0;}
 }
}
