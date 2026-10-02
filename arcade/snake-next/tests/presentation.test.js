import test from 'node:test';
import assert from 'node:assert/strict';
import {ContinuousBody,BodySnapshots} from '../presentation/path.js';
import {geometrySnapshots} from './browser-qa.js';
import {createTrainingRules,movementCadence} from '../simulation/difficulty.js';
import {generateArena} from '../world/arena.js';
import {createState} from '../simulation/state.js';
import {step} from '../simulation/step.js';
import {bodyCell} from '../simulation/body.js';
import {stateHash} from '../simulation/hash.js';
import {FixedClock} from '../simulation/clock.js';
import {loopFixture,directionBetween} from './fixtures.js';

test('Shared cardinal centerline: orientations, U/S, growth and all phases',()=>{
  for(const name of ['horizontal','vertical','turn-right','turn-down','turn-left','turn-up','u','s'])for(const grow of [false,true]){
    const snapshots=geometrySnapshots(name,8,grow),geometry=new ContinuousBody(6144);let lastHead,lastTail;
    for(const alpha of [0,.25,.5,.75,.999999,1]){
      geometry.build(snapshots,96,alpha);
      assert.equal(geometry.span,snapshots.previousLength-1+(snapshots.length-snapshots.previousLength)*alpha);
      assert(Math.abs(geometry.head.dx)+Math.abs(geometry.head.dy)===1,'head tangent cardinal');
      for(let i=0;i<geometry.count*4;i++)assert(Number.isFinite(geometry.polygon[i]));
      const last=(geometry.count-1)*4;assert(Math.abs(geometry.polygon[last]-geometry.tail.x)<1e-5);assert(Math.abs(geometry.polygon[last+2]-geometry.tail.x)<1e-5);
      if(lastHead){assert(Math.hypot(geometry.head.x-lastHead.x,geometry.head.y-lastHead.y)<=.250001);assert(Math.hypot(geometry.tail.x-lastTail.x,geometry.tail.y-lastTail.y)<=.250001);if(grow)assert.deepEqual(geometry.tail,lastTail);}
      lastHead={...geometry.head};lastTail={...geometry.tail};
      // At every fractional point one coordinate remains on a cell-center axis.
      assert(Math.abs(geometry.head.x%1-.5)<1e-6||Math.abs(geometry.head.y%1-.5)<1e-6);
    }
  }
});
test('No popping across consecutive moves/growth, lengths 8/100/250/500/1200',()=>{
  for(const length of [8,100,250,500,1200]){
    const f=loopFixture(length,1),snapshots=new BodySnapshots(f.arena.cells),geometry=new ContinuousBody(f.arena.cells);snapshots.reset(f.state);
    for(let i=0;i<120;i++){
      geometry.build(snapshots,96,1);const head={...geometry.head},tail={...geometry.tail};
      step(f.state,f.arena,f.rules,f.commands(f.state.tick+1));snapshots.capture(f.state);geometry.build(snapshots,96,0);
      assert.deepEqual(geometry.head.x,head.x);assert.deepEqual(geometry.head.y,head.y);assert.equal(geometry.tail.x,tail.x);assert.equal(geometry.tail.y,tail.y);
      geometry.build(snapshots,96,.5);assert.equal(geometry.count,length+1);
    }
  }
});
test('Training runway food, no passive score, ten calm seconds and deterministic quantized curve',()=>{
  const rules=createTrainingRules();assert.equal(movementCadence({tick:599,score:999999},rules),15);
  for(const [tick,score,cadence] of [[600,0,15],[2700,0,10],[600,1000,10],[7200,0,8],[14400,0,6]])assert.equal(movementCadence({tick,score},rules),cadence);
  for(let seed=0;seed<20;seed++){
    const arena=generateArena(seed,rules),s=createState({seed,rules,arena});assert.equal(s.food,bodyCell(s,0)+5);
    const snap=new BodySnapshots(arena.cells);snap.reset(s);const before=stateHash(s);new ContinuousBody(arena.cells).build(snap,rules.width,.7);assert.equal(stateHash(s),before);
    for(let t=0;t<75;t++)step(s,arena,rules);assert.equal(s.score,100);assert.equal(s.length,9);assert(s.food>=0);
  }
});
test('Training cadence and queue remain FPS-independent; pause changes no state',()=>{
  const outputs=[];
  for(const fps of [30,60,90,120,144]){
    const rules=createTrainingRules({obstacleBlocks:0}),arena=generateArena(7,rules),s=createState({seed:7,rules,arena});
    let commands=[];const clock=new FixedClock({onTick:()=>step(s,arena,rules,commands)});clock.resume(0);
    for(let i=1;i<=fps*3;i++)clock.advance(i*1000/fps);
    const hash=stateHash(s);clock.pause();clock.advance(90000);assert.equal(stateHash(s),hash);outputs.push(hash);
  }
  assert.equal(new Set(outputs).size,1);
});
test('Actual authoritative growth: terminal stays fixed and food uses the same presentation interval',()=>{
  for(const turned of [false,true]){
    const rules=createTrainingRules({obstacleBlocks:0}),arena=generateArena(7,rules),head=arena.initialBody[0];
    const food=turned?head+rules.width:head+1,s=createState({seed:7,rules,arena,food}),snapshots=new BodySnapshots(arena.cells),geometry=new ContinuousBody(arena.cells);
    snapshots.reset(s);const oldTail=s.body[s.length-1];
    for(let i=0;i<15;i++)step(s,arena,rules,i===0&&turned?[{tick:1,sequence:1,direction:2}]:[]);
    snapshots.capture(s);assert.equal(s.length,9);assert.equal(snapshots.previousFood,food);assert.notEqual(snapshots.food,food);
    for(const alpha of [0,.25,.5,.75,1]){geometry.build(snapshots,rules.width,alpha);assert.equal(geometry.tail.x,oldTail%rules.width+.5);assert.equal(geometry.tail.y,Math.floor(oldTail/rules.width)+.5);}
  }
});
test('Entire 250s difficulty curve: 30/60/90/120/144 FPS and CPU-delay hashes match each tick',()=>{
  const baseline=[],target=15000;
  for(const fps of [30,60,90,120,144])for(const delayed of [false,true]){
    const f=loopFixture(8),rules=createTrainingRules(),state=createState({seed:123,rules,arena:f.arena,food:97}),directions=new Uint8Array(f.arena.cells);
    for(let i=0;i<f.path.length;i++)directions[f.path[i]]=directionBetween(f.path[i],f.path[(i+1)%f.path.length],rules.width);
    const hashes=[],clock=new FixedClock({onTick:()=>{
      if(state.tick>=target){clock.pause();return;}
      const direction=directions[bodyCell(state,0)],tick=state.tick+1;
      step(state,f.arena,rules,state.movePhase===state.cadence-1&&direction!==state.direction?[{tick,sequence:tick,direction}]:[]);
      hashes.push(stateHash(state));
    }});clock.resume(0);let now=0,frame=0;
    while(state.tick<target){now+=1000/fps+(delayed&&++frame%7===0?28:0);clock.advance(now);assert.notEqual(clock.status,'recovery');}
    assert.equal(state.cadence,6);assert.equal(state.status,'playing');if(!baseline.length)baseline.push(...hashes);else assert.deepEqual(hashes,baseline);
  }
});
