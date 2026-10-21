import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFlySimulation} from './fly-simulation.js';
import {TunnelSession} from '../../arcade/snake-next/gate-one/session.js';
import {verifyClaim,verifyFly,verifySnake} from './verifier-core.js';

function fly(seed,hold=false){const g=createFlySimulation(seed),events=hold?[[0,2,1]]:[];while(g.model.running&&g.model.replayTick<36000)g.step(hold);assert.equal(g.model.running,false);const s=g.summary();return {proof:{version:'fly-proof-v1',ticks:s.ticks,events},claimed:{score:s.score,spores:s.spores,gates:s.gates,jumps:s.jumps}};}
function snake(seed){const s=new TunnelSession({seed,progression:{model:'fit-world-v2',freeTrigger:15,startStage:0,maxWorldStage:2}});let active=0;while(s.status!=='result'&&s.tick<36000){if(s.status==='playing')active++;s.advance([]);}assert.equal(s.status,'result');return {proof:{version:'snake-proof-v1',ticks:s.tick,commands:[]},claimed:{score:s.score,active_ticks:active,final_hash:s.hash()}};}
for(const seed of [1,76193,2147483646]){
 for(const hold of [false,true])test(`Fly canonical replay ${seed} holding=${hold}`,()=>{const f=fly(seed,hold);assert.equal(verifyClaim('fly',seed,f.proof,f.claimed).score,f.claimed.score);});
 test(`Snake canonical replay ${seed}`,()=>{const f=snake(seed);assert.equal(verifyClaim('snake',seed,f.proof,f.claimed).score,f.claimed.score);});
}
test('forged plausible score is rejected in both games',()=>{for(const [game,f] of [['fly',fly(5)],['snake',snake(5)]])assert.throws(()=>verifyClaim(game,5,f.proof,{...f.claimed,score:f.claimed.score+100}),/invalid_replay/);});
test('unfinished and overlong replays cannot award results',()=>{for(const [fn,f] of [[verifyFly,fly(5)],[verifySnake,snake(5)]])for(const delta of [-1,1])assert.throws(()=>fn(5,{...f.proof,ticks:f.proof.ticks+delta}),/invalid_replay/);});
test('malformed and unbounded proof is rejected',()=>{for(const proof of [null,{}, {version:'fly-proof-v1',ticks:NaN,events:[]},{version:'fly-proof-v1',ticks:2592001,events:[]},{version:'fly-proof-v1',ticks:1,events:[[0,2,2]]},{version:'fly-proof-v1',ticks:1,events:Array.from({length:33},()=>[0,1])}])assert.throws(()=>verifyFly(1,proof),/invalid_replay/);});
test('client cannot supply physics or seed in proof',()=>{const f=fly(7);for(const k of ['seed','gravity','score'])assert.throws(()=>verifyFly(7,{...f.proof,[k]:0}),/invalid_replay/);});
test('empty legacy audit is not a replay',()=>assert.throws(()=>verifySnake(1,{}),/invalid_replay/));
test('Fly longer replay includes real gates, spores and a bonus',()=>{
 const g=createFlySimulation(76193);
 for(let i=0;i<18000&&g.model.running;i++){
  const p=g.model.player,gate=g.model.objects.filter(o=>o.kind==='gate'&&o.part==='top'&&o.x+o.w>p.x-5).sort((a,b)=>a.x-b.x)[0];
  if(p.y>(gate?.gapCenter||260)&&p.vy>0)g.boost();g.step();
 }
 const s=g.summary();assert.ok(s.gates>=10&&s.spores>0&&s.bonus_pickups>0);
 assert.deepEqual(verifyFly(76193,{version:'fly-proof-v1',ticks:s.ticks,events:g.model.replayEvents}),{...s,duration_ms:Math.round(s.ticks*1000/60)});
});
test('Snake accepted turn log reproduces canonical terminal hash and all counters',()=>{
 const seed=57,s=new TunnelSession({seed,progression:{model:'fit-world-v2',freeTrigger:15,startStage:0,maxWorldStage:2}});let active=0,sequence=0;
 while(s.status!=='result'&&s.tick<36000){const commands=s.status==='playing'&&s.tick%37===0?[{tick:1,sequence:++sequence,direction:Math.floor(s.tick/37)%4,repeat:false}]:[];if(s.status==='playing')active++;s.advance(commands);}
 const proof={version:'snake-proof-v1',ticks:s.tick,commands:s.replay.map(e=>[e.at,e.command.sequence,e.command.direction,e.command.repeat?1:0])};
 assert.ok(proof.commands.length>0);assert.equal(verifyClaim('snake',seed,proof,{score:s.score,active_ticks:active,final_hash:s.hash()}).audit.final_hash,s.hash());
 assert.throws(()=>verifyClaim('snake',seed+1,proof,{score:s.score,active_ticks:active,final_hash:s.hash()}),/invalid_replay/);
});
