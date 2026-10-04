import {createArena} from '../entry.js';
import {forestArena} from '../forest-training/session.js';
import {labSession} from './session.js';

// DEV topology choices, independent of balance A/B/C. B/MEDIUM is untouched.
export const ARENAS=Object.freeze({A:Object.freeze({id:'A',name:'Compact',width:24,height:11,headX:9,row:5}),B:Object.freeze({id:'B',name:'Current',width:28,height:12,headX:11,row:5}),C:Object.freeze({id:'C',name:'Expanded',width:34,height:14,headX:13,row:6})});
export const DENSITIES=Object.freeze({LOW:1,MEDIUM:3,HIGH:6});
export function designArena(id='B',density='MEDIUM',touch=false){
 const p=ARENAS[id];if(!p||!Object.hasOwn(DENSITIES,density))throw Error('Unknown DEV arena/density');
 if(id==='B'&&density==='MEDIUM')return {...forestArena(touch),portals:[3*28+10,8*28+18],preset:id,density};
 const {width:w,height:h}=p,blocked=[];
 for(let x=0;x<w;x++)blocked.push(x,(h-1)*w+x);
 for(let y=1;y<h-1;y++)blocked.push(y*w,y*w+w-1);
 const scale=([x,y])=>({x:Math.round(1+(x-1)*(w-3)/25),y:Math.round(1+(y-1)*(h-3)/9)});
 const candidates=[[5,2],[23,3],[14,9],[9,2],[20,9],[24,7]].map(scale);
 const rocks=density==='LOW'?[candidates[2]]:candidates.slice(0,DENSITIES[density]);
 blocked.push(...rocks.map(p=>p.y*w+p.x));
 if(touch)for(let y=7;y<Math.min(11,h-1);y++)for(let x=1;x<6;x++)blocked.push(y*w+x);
 const initialBody=Array.from({length:8},(_,i)=>p.row*w+p.headX-i);
 const arena=createArena({width:w,height:h,blockedCells:blocked,initialBody,initialDirection:1,runwayCells:12});
 const portals=[[10,3],[18,8]].map(scale).map(p=>p.y*w+p.x);
 if(portals.some(c=>arena.blocked(c))||new Set(portals).size!==2)throw Error('DEV portal placement invalid');
 return {arena,rocks,portals,preset:id,density};
}
export function designSession(profile,{arenaPreset='B',density='MEDIUM',...options}={}){
 // Exact prior factory, RNG, first food and portal layout in the baseline.
 if(arenaPreset==='B'&&density==='MEDIUM'){
  const s=labSession(profile,options);s.design=Object.freeze({arenaPreset,density});return s;
 }
 const layout=designArena(arenaPreset,density,options.touch),s=labSession(profile,{...options,arena:layout.arena});
 s.rocks=layout.rocks;s.portals=layout.portals;s.repairFood();
 s.design=Object.freeze({arenaPreset,density});return s;
}
