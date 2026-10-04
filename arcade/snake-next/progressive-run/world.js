import {createArena} from '../entry.js';
import {bodyCells,bodyCell,occupied} from '../simulation/body.js';
import {STRIDE,ROWS} from './config.js';
import {distances,manhattan} from '../tuning-lab/measure.js';

export function topology(world,body=Array.from({length:8},(_,i)=>5*STRIDE+11-i),direction=1){
 const blocked=[],stones=new Set([...world.obstacles.map(o=>o.cell),...world.hazards.map(o=>o.cell)]);
 for(let y=0;y<ROWS;y++)for(let x=0;x<STRIDE;x++){const c=y*STRIDE+x;if(x<1||y<1||x>=world.width-1||y>=world.height-1||stones.has(c))blocked.push(c);}
 return createArena({width:STRIDE,height:ROWS,blockedCells:blocked,initialBody:body,initialDirection:direction,runwayCells:0,theme:world.biome});
}
export function installTopology(s){
 const arena=topology(s.world,bodyCells(s.state),s.state.direction);s.arena=arena;s.state.arenaHash=arena.topologyHash;
 s.rocks=s.world.obstacles.map(o=>({x:o.cell%STRIDE,y:Math.floor(o.cell/STRIDE)}));s.world.revision++;
}
export function expandWorld(s,stage){
 const old={width:s.world.width,height:s.world.height};s.world.width=Math.max(old.width,stage.world[0]);s.world.height=Math.max(old.height,stage.world[1]);s.world.biome=stage.biome;
 // New families only in newly revealed territory. No existing entity moves.
 const additions=[],count=s.config.density*(stage.biome==='forest'?1:2);
 for(let y=3;y<s.world.height-3&&additions.length<count;y+=5)for(let x=4;x<s.world.width-3&&additions.length<count;x+=7){
  if(x<old.width&&y<old.height)continue;
  const cells=stage.biome==='caves'?[y*STRIDE+x,y*STRIDE+x+1,(y+1)*STRIDE+x]:[y*STRIDE+x];
  for(const cell of cells)if(!occupied(s.state,cell)&&cell!==s.state.food&&!s.portals.includes(cell)&&!s.pickups.some(p=>p.cell===cell))additions.push({cell,kind:stage.biome==='caves'?'crystal':stage.biome==='swamp'?'stump':'root'});
 }
 s.world.obstacles.push(...additions);installTopology(s);
}
export function hazardSafe(s,cell){
 if(!Number.isInteger(cell)||s.arena.blocked(cell)||occupied(s.state,cell)||s.forbidden(cell)||manhattan(cell,s.state.food,STRIDE)<3)return false;
 if(s.portals.some(c=>manhattan(c,cell,STRIDE)<4)||bodyCells(s.state).some(c=>manhattan(c,cell,STRIDE)<4))return false;
 // Generous orthogonal envelope, not a one-cell passage or dead-end spawn.
 for(const n of [cell-1,cell+1,cell-STRIDE,cell+STRIDE])if(s.arena.blocked(n))return false;
 const occupiedCells=new Set(bodyCells(s.state).slice(1,-1)),base=distances(s.arena,bodyCell(s.state,0),occupiedCells),next=distances(s.arena,bodyCell(s.state,0),new Set([...occupiedCells,cell]));
 if(base[s.state.food]>=0&&next[s.state.food]<0)return false;
 if(Array.from(next).filter(v=>v>=0).length<Array.from(base).filter(v=>v>=0).length-1)return false;
 try{topology({...s.world,hazards:[...s.world.hazards,{cell}]},bodyCells(s.state),s.state.direction);}catch{return false;}
 return true;
}
