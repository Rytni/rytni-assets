import {readFileSync,writeFileSync} from 'node:fs';
import {ProgressiveSession} from './session.js';
import {choose} from './food-planner.mjs';
import {foodField,foodLegal} from './food.js';
const s=new ProgressiveSession({seed:17}),episodes=[];
for(let tick=1;tick<=54000&&s.status==='playing'&&s.foods<260;tick++){
 s.advance(!['entering','teleport'].includes(s.portal.phase)&&s.state.movePhase>=s.cadence()-1?[{sequence:tick,direction:choose(s),tick:1}]:[]);
 if(s.foodSpawn.pendingSince!==null&&episodes.at(-1)?.started!==s.foodSpawn.pendingSince)episodes.push({started:s.foodSpawn.pendingSince,foods:s.foods,head:s.state.body[s.state.headIndex]});
 if(s.foodSpawn.pendingSince===null&&episodes.at(-1)&&!episodes.at(-1).ended)Object.assign(episodes.at(-1),{ended:s.tick,food:s.state.food,tier:s.foodSpawn.last.tier,legal:foodLegal(s,s.state.food),reachable:!!foodField(s).seen[s.state.food]});
}
const dir=new URL('../../../docs/qa/food-reliability/',import.meta.url),stress=JSON.parse(readFileSync(new URL('stress.json',dir),'utf8')).runs.find(r=>r.seed===17);
const result={seed:17,tick:s.tick,foods:s.foods,length:s.state.length,status:s.status,reason:s.state.reason,episodes,spawn:s.foodSpawn,hash:s.hash(),matchesStressHash:s.hash()===stress.hash};
if(!result.matchesStressHash||episodes[0]?.started!==17340||episodes[0]?.ended!==17348||!episodes.every(e=>e.legal&&e.reachable)||s.status!=='playing')throw Error('Seed17 recovery mismatch '+JSON.stringify(result));
writeFileSync(new URL('seed17-after.json',dir),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
