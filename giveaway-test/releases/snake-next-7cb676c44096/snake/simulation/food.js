import {neighbour} from './rules.js';
import {occupied,bodyCell} from './body.js';
import {randomIndex} from './prng.js';

// Scratch is simulation-owned, bounded and excluded from authoritative hashes.
export function reachableFoodCells(state,arena) {
  const {seen,queue,candidates}=state.scratch;seen.fill(0);
  const head=bodyCell(state,0),tail=bodyCell(state,state.length-1);let end=1,count=0;
  queue[0]=head;seen[head]=1;
  for(let at=0;at<end;at++){
    const c=queue[at];
    if(c!==head&&!occupied(state,c))candidates[count++]=c;
    for(let d=0;d<4;d++){
      // A route cannot begin with an instantaneous reversal through the neck.
      if(at===0&&d===(state.direction+2)%4)continue;
      const n=neighbour(c,d,arena.width,arena.height);
      if(n<0||seen[n]||arena.blocked(n)||(occupied(state,n)&&!(n===tail&&state.growth===0)))continue;
      seen[n]=1;queue[end++]=n;
    }
  }
  return count;
}
export function chooseFood(state,arena) {
  const count=reachableFoodCells(state,arena);
  return count?state.scratch.candidates[randomIndex(state,count)]:-1;
}
export function validateFood(state,arena,food) {
  const count=reachableFoodCells(state,arena);
  for(let i=0;i<count;i++)if(state.scratch.candidates[i]===food)return true;
  return false;
}
