import {deriveSeed,randomIndex,hashText} from '../simulation/prng.js';
import {Direction,neighbour} from '../simulation/rules.js';

// Private collision buffer cannot be mutated through the returned arena API.
// Simulation state itself stays structured-cloneable; arena is a separate input.
export function createArena({width,height,blockedCells=[],initialBody,initialDirection=Direction.RIGHT,runwayCells=0,minFreeCells=1,decor=[],theme='forest'}) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width*height>1000000)throw RangeError('Invalid arena size');
  if(!Number.isInteger(runwayCells)||runwayCells<0||!Number.isInteger(minFreeCells)||minFreeCells<1)throw RangeError('Invalid arena safety requirements');
  const cells=width*height,mask=new Uint8Array(cells);
  for(const cell of blockedCells){if(!Number.isInteger(cell)||cell<0||cell>=cells)throw RangeError('Invalid obstacle');mask[cell]=1;}
  const freeCount=cells-mask.reduce((a,b)=>a+b,0);
  const body=Array.from(initialBody||[]);
  let topologyHash=hashText(`${width},${height}`);
  for(let i=0;i<cells;i++)topologyHash=Math.imul(topologyHash^mask[i],16777619)>>>0;
  const arena=Object.freeze({width,height,cells,freeCount,topologyHash,initialBody:Object.freeze(body),initialDirection,runwayCells,minFreeCells,decor:Object.freeze(decor.map(v=>Object.freeze({...v}))),theme,
    blocked:cell=>cell<0||cell>=cells||!!mask[cell],
    collisionCopy:()=>mask.slice(),
    exportTopology:()=>({width,height,blockedCells:Array.from(mask.keys()).filter(i=>mask[i]),initialBody:body.slice(),initialDirection,runwayCells,minFreeCells})});
  validateArena(arena);return arena;
}
export function validateArena(arena) {
  const {width,height,cells,initialBody:body}=arena;
  if(!body.length||body.length>arena.freeCount||arena.freeCount<arena.minFreeCells)throw Error('Insufficient free area/body');
  const bodySet=new Set();
  for(let i=0;i<body.length;i++){
    const c=body[i];if(!Number.isInteger(c)||arena.blocked(c)||bodySet.has(c))throw Error('Invalid initial body');
    if(i&&Math.abs(c%width-body[i-1]%width)+Math.abs(Math.floor(c/width)-Math.floor(body[i-1]/width))!==1)throw Error('Body must be cardinal and continuous');
    bodySet.add(c);
  }
  if(!Number.isInteger(arena.initialDirection)||arena.initialDirection<0||arena.initialDirection>3||body.length>1&&neighbour(body[0],arena.initialDirection,width,height)===body[1])throw Error('Initial direction reverses into neck');
  const seen=new Uint8Array(cells),queue=new Uint32Array(cells);let end=1;queue[0]=body[0];seen[body[0]]=1;
  for(let at=0;at<end;at++)for(let d=0;d<4;d++){const n=neighbour(queue[at],d,width,height);if(n>=0&&!seen[n]&&!arena.blocked(n)){seen[n]=1;queue[end++]=n;}}
  if(end!==arena.freeCount)throw Error('Sealed/disconnected playable region');
  let cell=body[0];
  for(let i=0;i<arena.runwayCells;i++){
    cell=neighbour(cell,arena.initialDirection,width,height);
    if(cell<0||arena.blocked(cell)||bodySet.has(cell))throw Error('Initial runway blocked');
    let exits=0;for(let d=0;d<4;d++)if(!arena.blocked(neighbour(cell,d,width,height)))exits++;
    if(exits<2)throw Error('Initial runway one-cell trap');
  }
  return {connectedCells:end,freeCount:arena.freeCount,runway:arena.runwayCells};
}
export function generateArena(seed,rules) {
  const {width,height}=rules,blocked=new Set();
  for(let x=0;x<width;x++){blocked.add(x);blocked.add((height-1)*width+x);}
  for(let y=0;y<height;y++){blocked.add(y*width);blocked.add(y*width+width-1);}
  const row=Math.floor(height/2),headX=rules.initialLength+2,body=Array.from({length:rules.initialLength},(_,i)=>row*width+headX-i);
  const rng={rng:deriveSeed(seed,`arena:${rules.key}`)};
  // Widely spaced 2x2 islands; runway corridor stays clear. No one-cell alleys.
  const candidates=[];
  for(let y=3;y+2<height-2;y+=6)for(let x=3;x+2<width-2;x+=6)if(Math.abs(y-row)>3)candidates.push(y*width+x);
  const blocks=Math.min(rules.obstacleBlocks,candidates.length,Math.floor(((width-2)*(height-2)-rules.minFreeCells)/4));
  if(blocks<0)throw Error('Arena cannot meet free area budget');
  for(let i=0;i<blocks;i++){const at=randomIndex(rng,candidates.length),c=candidates[at];candidates[at]=candidates.at(-1);candidates.pop();for(const n of [c,c+1,c+width,c+width+1])blocked.add(n);}
  return createArena({width,height,blockedCells:blocked,initialBody:body,runwayCells:rules.runwayCells,minFreeCells:rules.minFreeCells});
}
