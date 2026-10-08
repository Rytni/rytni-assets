import {hashText} from './prng.js';
export const Direction=Object.freeze({UP:0,RIGHT:1,DOWN:2,LEFT:3});
export const DX=Object.freeze([0,1,0,-1]),DY=Object.freeze([-1,0,1,0]);
export function createRules(options={}) {
  const r={version:'snake-next-foundation-1',width:96,height:64,tickHz:60,ticksPerCell:15,initialLength:8,runwayCells:12,minFreeCells:1201,obstacleBlocks:20,foodScore:100,foodGrowth:1,maxCatchUpTicks:5,...options};
  if(typeof r.version!=='string'||!r.version)throw RangeError('Rules version required');
  if(r.firstFoodAhead!==undefined&&(!Number.isSafeInteger(r.firstFoodAhead)||r.firstFoodAhead<1||r.firstFoodAhead>r.runwayCells))throw RangeError('First food must fit runway');
  if(r.calmTicks!==undefined){
    for(const k of ['calmTicks','mediumTicks','fastTicks','capTicks','mediumFoods','fastFoods','capFoods','mediumCadence','fastCadence','capCadence'])if(!Number.isSafeInteger(r[k])||r[k]<1)throw RangeError('Invalid difficulty: '+k);
    if(!(r.calmTicks<r.mediumTicks&&r.mediumTicks<r.fastTicks&&r.fastTicks<r.capTicks&&r.mediumFoods<r.fastFoods&&r.fastFoods<r.capFoods&&r.capCadence<=r.fastCadence&&r.fastCadence<=r.mediumCadence&&r.mediumCadence<=r.ticksPerCell))throw RangeError('Difficulty must be monotonic');
  }
  for(const k of ['width','height','tickHz','ticksPerCell','initialLength','runwayCells','minFreeCells','foodScore','foodGrowth','maxCatchUpTicks'])if(!Number.isSafeInteger(r[k])||r[k]<1)throw RangeError('Invalid rule: '+k);
  if(!Number.isInteger(r.obstacleBlocks)||r.obstacleBlocks<0||r.width<8||r.height<8||r.width*r.height>1000000||r.initialLength+2+r.runwayCells>=r.width||r.minFreeCells>r.width*r.height)throw RangeError('Invalid arena configuration');
  const key=Object.keys(r).sort().map(k=>`${k}:${r[k]}`).join('|');
  return Object.freeze({...r,key:hashText(key)});
}
export function neighbour(cell,direction,width,height) {
  const x=cell%width+DX[direction],y=Math.floor(cell/width)+DY[direction];
  return x<0||x>=width||y<0||y>=height?-1:y*width+x;
}
