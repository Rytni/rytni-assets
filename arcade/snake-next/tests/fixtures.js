import {createRules,Direction} from '../simulation/rules.js';
import {createArena,generateArena} from '../world/arena.js';
import {createState} from '../simulation/state.js';
export function cycle(width,height,x0=0,y0=0,stride=width) {
  if(height%2)throw Error('Even cycle height required');
  const cells=[y0*stride+x0];
  for(let y=0;y<height;y++)for(let i=1;i<width;i++){const x=y%2?width-i:i;cells.push((y+y0)*stride+x+x0);}
  for(let y=height-1;y>0;y--)cells.push((y+y0)*stride+x0);
  return cells;
}
export function directionBetween(a,b,width) {
  if(b===a+1&&Math.floor(a/width)===Math.floor(b/width))return Direction.RIGHT;
  if(b===a-1&&Math.floor(a/width)===Math.floor(b/width))return Direction.LEFT;
  if(b===a+width)return Direction.DOWN;if(b===a-width)return Direction.UP;
  throw Error('Non-cardinal cycle');
}
export function loopFixture(length=8,ticksPerCell=15) {
  const rules=createRules({ticksPerCell,obstacleBlocks:0,minFreeCells:1201});
  const path=cycle(92,60,2,2,rules.width),body=Array.from({length},(_,i)=>path[(path.length-i)%path.length]);
  const blocked=[];for(let x=0;x<96;x++){blocked.push(x,63*96+x);}for(let y=0;y<64;y++)blocked.push(y*96,y*96+95);
  const arena=createArena({width:96,height:64,blockedCells:blocked,initialBody:body,minFreeCells:1201});
  const options={seed:123,arena,rules,food:97},state=createState(options);
  const commands=tick=>{
    if(tick%ticksPerCell)return [];
    const move=Math.floor((tick-1)/ticksPerCell),a=path[move%path.length],b=path[(move+1)%path.length];
    return [{tick,sequence:tick,direction:directionBetween(a,b,rules.width)}];
  };
  return {state,rules,arena,path,commands,options};
}
export function straightFixture(ticksPerCell=3) {
  const rules=createRules({ticksPerCell}),arena=generateArena(1,rules);
  return {rules,arena,state:createState({seed:1,rules,arena,food:arena.initialBody[0]+6})};
}
