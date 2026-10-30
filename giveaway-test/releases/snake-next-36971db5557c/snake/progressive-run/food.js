import {bodyCells,bodyCell,occupied} from '../simulation/body.js';
import {neighbour} from '../simulation/rules.js';
import {reachableFoodCells} from '../simulation/food.js';
import {randomIndex} from '../simulation/prng.js';

export const FOOD_POLICY='reachable-fallback-v1';
export function activeCell(s,c){const w=s.arena.width,x=c%w,y=Math.floor(c/w);return Number.isInteger(c)&&c>=0&&x>0&&y>0&&x<s.world.width-1&&y<s.world.height-1;}
export function foodLegal(s,c){return activeCell(s,c)&&!s.arena.blocked(c)&&!occupied(s.state,c)&&!s.forbidden(c);}

// Independent, exhaustive reference field. No shared scratch, RNG, camera or
// random retry budget. Tail traversal and first-step reversal match the core.
export function foodField(s,extraBlocked=-1){
 const body=new Set(bodyCells(s.state)),head=bodyCell(s.state,0),tail=bodyCell(s.state,s.state.length-1),seen=new Uint8Array(s.arena.cells),queue=[head];seen[head]=1;
 for(let at=0;at<queue.length;at++)for(let d=0;d<4;d++){
  if(at===0&&d===(s.state.direction+2)%4)continue;
  const n=neighbour(queue[at],d,s.arena.width,s.arena.height);
  if(!activeCell(s,n)||seen[n]||n===extraBlocked||s.arena.blocked(n)||(body.has(n)&&!(n===tail&&s.state.growth===0)))continue;
  seen[n]=1;queue.push(n);
 }
 const legal=[];let vacant=0;
 for(let c=0;c<s.arena.cells;c++)if(activeCell(s,c)&&c!==extraBlocked&&!s.arena.blocked(c)&&!body.has(c)){
  vacant++;if(seen[c]&&!s.forbidden(c))legal.push(c);
 }
 return {seen,legal,vacant};
}

export function selectFood(s,search=reachableFoodCells){
 try{
  let candidates=[],searchError=null;
  try{const count=search(s.state,s.arena);if(!Number.isInteger(count)||count<0||count>s.arena.cells)throw Error('Invalid candidate count');candidates=Array.from(s.state.scratch.candidates.subarray(0,count)).filter(c=>foodLegal(s,c));}catch(error){searchError=error.message;}
  const field=foodField(s),legal=new Set(field.legal),head=bodyCell(s.state,0),w=s.arena.width;
  // A primary-search defect must not kill a run when the independent field
  // proves safe placement. Recover deterministically through tier4 instead.
  if(candidates.some(c=>!legal.has(c))){searchError='Candidate field disagreement';candidates=[];}
  const distance=c=>Math.abs(c%w-head%w)+Math.abs(Math.floor(c/w)-Math.floor(head/w));
  const pools=[candidates.filter(c=>distance(c)>=s.pacing.foodMin&&distance(c)<=s.pacing.foodMax),candidates.filter(c=>distance(c)>=1&&distance(c)<=24),candidates];
  for(let i=0;i<pools.length;i++)if(pools[i].length){
   const cell=pools[i][randomIndex(s,pools[i].length)];
   return {outcome:'spawned',cell,tier:i+1,reachable:field.legal.length,vacant:field.vacant};
  }
  if(field.legal.length)return {outcome:'spawned',cell:field.legal[0],tier:4,reachable:field.legal.length,vacant:field.vacant,recoveredSearch:true,...(searchError?{searchError}:{})};
  return {outcome:field.vacant===0?'board_full':'temporarily unreachable',cell:-1,tier:0,reachable:0,vacant:field.vacant};
 }catch(error){return {outcome:'generator_error',cell:-1,tier:0,error:error.message};}
}
