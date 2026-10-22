import {bodyCells} from '../simulation/body.js';
export {MOVE_UNIT,movementDue,movementAlpha} from '../simulation/timing.js';

export const TIMING_VERSION='fit-world-v2-fixed-point-v1';
// microcells/second / (60 ticks/second); all canonical arithmetic is integer.
export const WORLDS=Object.freeze([[30,12],[40,16],[50,20],[60,24]].map(Object.freeze));
export const SPEED_KNOTS=Object.freeze([4_200_000,5_300_000,7_000_000,7_900_000,8_000_000]);
export function capacity(s){
 const w=s.world,inside=c=>c%112>0&&c%112<w.width-1&&Math.floor(c/112)>0&&Math.floor(c/112)<w.height-1;
 const solids=new Set(w.obstacles.map(o=>o.cell).filter(inside));
 const traversableCapacity=(w.width-2)*(w.height-2)-solids.size;
 const snakeOccupied=new Set(bodyCells(s.state).filter(c=>inside(c)&&!solids.has(c))).size;
 const free=traversableCapacity-snakeOccupied,trigger=s.config.freeTrigger??15;
 return {traversableCapacity,snakeOccupied,free,freeRatio:free/traversableCapacity,trigger,
  predictedExpansionLength:Math.ceil(traversableCapacity*(100-trigger)/100),
  shouldExpand:free*100<=traversableCapacity*trigger};
}
export function pressureRate(s){
 const c=capacity(s),i=s.stage.index,start=s.stageEntryOccupied??8;
 const used=Math.max(0,Math.min(c.predictedExpansionLength-start,c.snakeOccupied-start));
 const range=Math.max(1,c.predictedExpansionLength-start);
 return SPEED_KNOTS[i]+Math.floor((SPEED_KNOTS[i+1]-SPEED_KNOTS[i])*used/range);
}
export function effectiveRate(s,tick=s.tick){
 let r=pressureRate(s);
 if(s.effects.some(e=>e.kind==='focus'&&e.ends>tick))r=Math.floor((r*100+61)/122);
 if(s.effects.some(e=>e.kind==='rush'&&e.ends>tick))r=Math.floor((r*5+2)/4);
 return r;
}
