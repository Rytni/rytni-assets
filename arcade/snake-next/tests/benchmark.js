import {loopFixture} from './fixtures.js';
import {step} from '../simulation/step.js';
import {chooseFood} from '../simulation/food.js';
import {createState} from '../simulation/state.js';
export function summarize(samples) {
  samples.sort((a,b)=>a-b);return {p50:samples[Math.floor(samples.length*.5)],p95:samples[Math.floor(samples.length*.95)],max:samples.at(-1),samples:samples.length};
}
// Main-thread only. Measures step including input/collision/body, not renderer.
// ticksPerCell=1 is deliberate worst-case cadence: every sample moves the body.
export function benchmark(now=()=>performance.now(),count=15000) {
  const rows=[];
  for(const length of [8,100,250,500,1200]){
    const f=loopFixture(length,1),samples=[];
    for(let i=0;i<3000;i++)step(f.state,f.arena,f.rules,f.commands(f.state.tick+1));
    for(let i=0;i<count;i++){
      const commands=f.commands(f.state.tick+1),start=now();step(f.state,f.arena,f.rules,commands);samples.push(now()-start);
      if(f.state.status!=='playing'||f.state.length!==length)throw Error('Benchmark path invalid');
    }
    // Expensive work occurs on actual consumption only; measured separately.
    const foodSamples=[];for(let i=0;i<200;i++){const start=now();chooseFood(f.state,f.arena);foodSamples.push(now()-start);}
    const eatBase=createState({...f.options,food:f.path[1]}),eatSamples=[];
    for(let i=0;i<200;i++){
      const s=structuredClone(eatBase),commands=f.commands(1),start=now();
      step(s,f.arena,f.rules,commands);eatSamples.push(now()-start);
      if(s.score!==100||s.length!==length+1||s.food<0)throw Error('Consumption benchmark invalid');
    }
    rows.push({length,step:summarize(samples),foodSelection:summarize(foodSamples),consumptionTick:summarize(eatSamples)});
  }
  return rows;
}
