// Load changed modules from the immutable checkpoint. All other locked
// dependencies remain byte-identical; no checkout reset/worktree is needed.
import {writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {choose} from './food-planner.mjs';
import {bodyCells,occupied} from '../simulation/body.js';
import {neighbour} from '../simulation/rules.js';
import {reachableFoodCells} from '../simulation/food.js';
function baseline(file,overrides={}){
 const source=execFileSync('git',['show','c2ab616:arcade/snake-next/progressive-run/'+file],{encoding:'utf8'}).replace(/from '(\.[^']+)'/g,(_,p)=>`from '${overrides[p]||new URL(p,new URL(file,import.meta.url)).href}'`);
 return 'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
}
const world=baseline('world.js'),director=baseline('director.js',{'./world.js':world});
const {ProgressiveSession}=await import(baseline('session.js',{'./world.js':world,'./director.js':director}));
const s=new ProgressiveSession({seed:17});let atRepair=null;
const repair=s.repairFood.bind(s);s.repairFood=()=>{const count=reachableFoodCells(s.state,s.arena);atRepair={count,status:s.state.status,reason:s.state.reason,events:structuredClone(s.state.events)};return repair();};
for(let tick=1;tick<=54000&&s.status==='playing'&&s.foods<260;tick++)s.advance(!['entering','teleport'].includes(s.portal.phase)&&s.state.movePhase>=s.cadence()-1?[{sequence:tick,direction:choose(s),tick:1}]:[]);
const body=bodyCells(s.state),head=body[0];let vacant=0,forbidden=0;
for(let c=0;c<s.arena.cells;c++)if(!s.arena.blocked(c)&&!occupied(s.state,c)){vacant++;if(s.forbidden(c))forbidden++;}
const result={checkpoint:'c2ab616',seed:17,tick:s.tick,foods:s.foods,length:s.state.length,hash:s.hash(),reason:s.state.reason,world:[s.world.width,s.world.height],vacant,forbidden,atRepair,head:[head%112,Math.floor(head/112)],tail:[body.at(-1)%112,Math.floor(body.at(-1)/112)],direction:s.state.direction,growth:s.state.growth,body,obstacles:s.world.obstacles,hazards:s.world.hazards,neighbours:[0,1,2,3].map(d=>{const c=neighbour(head,d,112,56);return {direction:d,cell:c,bodyIndex:body.indexOf(c)};})};
if(result.hash!=='f4322411'||result.tick!==17340||atRepair.count!==0)throw Error('Baseline witness mismatch; reproduce from c2ab616, not fixed sources');
const dir=new URL('../../../docs/qa/food-reliability/',import.meta.url);mkdirSync(dir,{recursive:true});writeFileSync(new URL('seed17-before.json',dir),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,body:undefined,obstacles:undefined}));
