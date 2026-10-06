import {neighbour} from '../simulation/rules.js';
import {bodyCell} from '../simulation/body.js';

export const manhattan=(a,b,w)=>Math.abs(a%w-b%w)+Math.abs(Math.floor(a/w)-Math.floor(b/w));
/** Read-only terrain distances. Never uses simulation scratch/RNG. */
export function distances(arena,start,extraBlocked=new Set()){
 const out=new Int32Array(arena.cells);out.fill(-1);const queue=new Int32Array(arena.cells);let end=1;queue[0]=start;out[start]=0;
 for(let i=0;i<end;i++)for(let d=0;d<4;d++){const n=neighbour(queue[i],d,arena.width,arena.height);if(n<0||out[n]>=0||arena.blocked(n)||extraBlocked.has(n))continue;out[n]=out[queue[i]]+1;queue[end++]=n;}
 return out;
}
export function arenaMeasurements(s){
 const a=s.arena,w=a.width,h=a.height,interior=(w-2)*(h-2),head=bodyCell(s.state,0),rocks=s.rocks||[],cells=rocks.map(p=>p.y*w+p.x),spawn=new Set(a.initialBody),portalDistances=s.portals.map(c=>Math.min(...cells.map(r=>manhattan(c,r,w))));
 const pair=[];for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++)pair.push(manhattan(cells[i],cells[j],w));
 let minExits=4;for(let c=0;c<a.cells;c++)if(!a.blocked(c)){let exits=0;for(let d=0;d<4;d++)if(!a.blocked(neighbour(c,d,w,h)))exits++;minExits=Math.min(minExits,exits);}
 const rockWall=rocks.map(p=>Math.min(p.x-1,w-2-p.x,p.y-1,h-2-p.y));
 return {columns:w,rows:h,interiorColumns:w-2,interiorRows:h-2,totalCells:a.cells,interiorCells:interior,traversableCells:a.freeCount,logicalAspect:w/h,interiorAspect:(w-2)/(h-2),stones:rocks,stoneCount:rocks.length,stoneOccupancy:rocks.length/interior,padBlocked:interior-a.freeCount-rocks.length,vacantAtStart:a.freeCount-s.state.length,minimumStoneSpacing:pair.length?Math.min(...pair):null,minimumStoneWallCorridor:rockWall.length?Math.min(...rockWall):null,minimumStaticExits:minExits,minimumStoneToSpawn:Math.min(...cells.flatMap(r=>[...spawn].map(c=>manhattan(r,c,w)))),minimumStoneToFood:Math.min(...cells.map(c=>manhattan(c,s.state.food,w))),minimumStoneToPortal:portalDistances.length?Math.min(...portalDistances):null,lengths:[8,30,100,250].map(length=>({length,occupancy:length/a.freeCount,vacant:a.freeCount-length,feasible:length<=a.freeCount})),initialFoodDistance:manhattan(head,s.state.food,w)};
}
