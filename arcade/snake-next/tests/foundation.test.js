import test from 'node:test';
import assert from 'node:assert/strict';
import {nextUint,seedWord,randomIndex} from '../simulation/prng.js';
import {createRules,Direction as D,neighbour} from '../simulation/rules.js';
import {createArena,generateArena,validateArena} from '../world/arena.js';
import {createState} from '../simulation/state.js';
import {step} from '../simulation/step.js';
import {bodyCell,bodyCells,occupied} from '../simulation/body.js';
import {validateFood} from '../simulation/food.js';
import {stateHash} from '../simulation/hash.js';
import {FixedClock,startMainThreadClock} from '../simulation/clock.js';
import {enqueueTurn,keyboardCommand} from '../input/turns.js';
import {replay} from './replay.js';
import {loopFixture,straightFixture,cycle,directionBetween} from './fixtures.js';

const smallRules=()=>createRules({width:8,height:8,initialLength:2,runwayCells:1,minFreeCells:1,obstacleBlocks:0,ticksPerCell:1});
function custom(body,food=54,blockedCells=[]) {
  const rules=smallRules(),arena=createArena({width:8,height:8,initialBody:body,blockedCells});
  return {rules,arena,state:createState({seed:1,rules,arena,food})};
}
function tick(f,direction,extra=[]) {const n=f.state.tick+1;step(f.state,f.arena,f.rules,direction===undefined?extra:[{tick:n,sequence:n*10,direction},...extra]);}
function assertBody(state,arena) {
  const cells=bodyCells(state);assert.equal(new Set(cells).size,state.length);
  let count=0;for(let i=0;i<arena.cells;i++)if(occupied(state,i))count++;
  assert.equal(count,state.length);for(const c of cells){assert(!arena.blocked(c));assert(occupied(state,c));}
  for(let i=1;i<cells.length;i++)assert.equal(Math.abs(cells[i]%arena.width-cells[i-1]%arena.width)+Math.abs(Math.floor(cells[i]/arena.width)-Math.floor(cells[i-1]/arena.width)),1);
}

test('Independent PRNG known vectors, zero seed, range and no zero cycle',()=>{
  const rng={rng:seedWord(1)};
  assert.deepEqual(Array.from({length:5},()=>nextUint(rng)),[270369,67634689,2647435461,307599695,2398689233]);
  const second={rng:42};assert.deepEqual(Array.from({length:5},()=>nextUint(second)),[11355432,2836018348,476557059,3648046016,3759983556]);
  assert.equal(seedWord(0),0x6d2b79f5);assert.throws(()=>seedWord(-1));
  for(let i=0;i<10000;i++){assert(nextUint(rng)>0);assert(randomIndex(rng,17)<17);}
});
test('Arena deterministic seeds, immutable topology, independent decor/theme',()=>{
  const rules=createRules();
  for(let seed=0;seed<100;seed++){
    const a=generateArena(seed,rules),b=generateArena(seed,rules);
    assert.equal(a.topologyHash,b.topologyHash);assert.deepEqual(a.collisionCopy(),b.collisionCopy());
    assert.equal(validateArena(a).connectedCells,a.freeCount);assert(a.freeCount>=1201);
    const copy=a.collisionCopy();copy.fill(1);assert(!a.blocked(a.initialBody[0]));
    const decorated=createArena({...a.exportTopology(),decor:[{cell:2,type:'leaf'}],theme:'cave'});
    assert.equal(a.topologyHash,decorated.topologyHash);
  }
  const other=generateArena(2,createRules({width:80,height:48,minFreeCells:1201}));assert.equal(other.width,80);
});
test('Arena rejects blocked runway, sealed regions, inadequate area and discontinuous body',()=>{
  const r=createRules(),a=generateArena(1,r),raw=a.exportTopology();
  assert.throws(()=>createArena({...raw,blockedCells:[...raw.blockedCells,raw.initialBody[0]+1]}),/runway/);
  const wall=Array.from({length:8},(_,y)=>y*8+4);
  assert.throws(()=>createArena({width:8,height:8,blockedCells:wall,initialBody:[26,25]}),/disconnected/);
  assert.throws(()=>createArena({width:8,height:8,initialBody:[26,25],minFreeCells:65}),/free area/);
  assert.throws(()=>createArena({width:8,height:8,initialBody:[26,24]}),/continuous/);
  assert.throws(()=>createArena({width:8,height:8,blockedCells:[19,28,35],initialBody:[26,25],runwayCells:1}),/trap/);
});
test('RIGHT → DOWN → LEFT accepts two future turns, one per boundary',()=>{
  const f=straightFixture();const s=f.state;
  step(s,f.arena,f.rules,[{tick:1,sequence:1,direction:D.DOWN},{tick:1,sequence:2,direction:D.LEFT}]);
  assert.equal(s.turnCount,2);step(s,f.arena,f.rules);step(s,f.arena,f.rules);assert.equal(s.direction,D.DOWN);assert.equal(s.turnCount,1);
  for(let i=0;i<3;i++)step(s,f.arena,f.rules);assert.equal(s.direction,D.LEFT);assert.equal(s.turnCount,0);assertBody(s,f.arena);
});
test('Reversal, DOWN→UP, repeat/down spam, four commands/interval and keyboard mapping',()=>{
  const f=straightFixture(),s=f.state;s.tick=1;
  assert(!enqueueTurn(s,{tick:1,sequence:1,direction:D.LEFT}));
  assert(enqueueTurn(s,{tick:1,sequence:2,direction:D.DOWN}));
  assert(!enqueueTurn(s,{tick:1,sequence:3,direction:D.UP}));
  assert(!enqueueTurn(s,{tick:1,sequence:4,direction:D.DOWN}));
  assert(!enqueueTurn(s,{tick:1,sequence:5,direction:D.LEFT,repeat:true}));
  assert(enqueueTurn(s,{tick:1,sequence:6,direction:D.LEFT}));
  assert(!enqueueTurn(s,{tick:1,sequence:7,direction:D.UP}));assert.equal(s.turnCount,2);
  assert(!enqueueTurn(s,{tick:1,sequence:6,direction:D.UP}));
  assert.deepEqual(keyboardCommand('KeyW',{tick:2,sequence:9}),{tick:2,sequence:9,direction:D.UP,repeat:false});
  assert.equal(keyboardCommand('KeyZ',{tick:2,sequence:9}),null);
  const g=straightFixture();step(g.state,g.arena,g.rules,[{tick:1,sequence:1,direction:D.DOWN},{tick:1,sequence:2,direction:D.LEFT},{tick:1,sequence:3,direction:D.UP},{tick:1,sequence:4,direction:D.RIGHT}]);assert.equal(g.state.turnCount,2);
});
test('Straight, U and S path; one canonical cardinal body',()=>{
  for(const path of [[D.RIGHT,D.RIGHT,D.RIGHT],[D.DOWN,D.DOWN,D.DOWN,D.LEFT,D.LEFT,D.LEFT,D.LEFT,D.UP,D.UP],[D.DOWN,D.DOWN,D.RIGHT,D.RIGHT,D.UP,D.UP,D.RIGHT,D.RIGHT,D.DOWN,D.DOWN]]){
    const r=createRules({ticksPerCell:1}),a=generateArena(1,r),s=createState({seed:1,rules:r,arena:a,food:a.initialBody[0]+2});
    for(const d of path){const t=s.tick+1;step(s,a,r,[{tick:t,sequence:t,direction:d}]);assert.equal(s.status,'playing');assertBody(s,a);}
  }
});
test('Food consumed and replaced atomically, +100/+1, reachable and non-overlapping',()=>{
  const r=createRules({ticksPerCell:1}),a=generateArena(1,r),head=a.initialBody[0],s=createState({seed:1,rules:r,arena:a,food:head+1});
  step(s,a,r);assert.equal(s.length,9);assert.equal(s.score,100);assert.equal(bodyCell(s,0),head+1);
  assert.notEqual(s.food,head+1);assert(validateFood(s,a,s.food));assert(!occupied(s,s.food));assert(!a.blocked(s.food));
  assert.deepEqual(s.events.map(e=>e.type),['food-consumed','food-spawned']);assertBody(s,a);
  const f=s.food;for(let i=0;i<3;i++)step(s,a,r);assert.equal(s.food,f);assert.equal(s.score,100);
  assert.throws(()=>createState({seed:1,rules:r,arena:a,food:head}),/Unsafe/);
});
test('Self and obstacle collision have deterministic terminal result and no partial move',()=>{
  const self=custom([27,26,18,19,20]);const before=bodyCells(self.state);tick(self,D.UP);
  assert.equal(self.state.reason,'self');assert.equal(self.state.status,'dead');assert.deepEqual(bodyCells(self.state),before);
  const obstacle=custom([27,26],54,[28]);tick(obstacle);assert.equal(obstacle.state.reason,'obstacle');assert.equal(obstacle.state.status,'dead');assert.equal(obstacle.state.score,0);
  const hash=stateHash(obstacle.state);tick(obstacle);assert.equal(stateHash(obstacle.state),hash);
});
test('Current tail cell entry legal only when that tail actually vacates',()=>{
  const f=custom([27,26,18,19]);tick(f,D.UP);assert.equal(f.state.status,'playing');assert.equal(bodyCell(f.state,0),19);assertBody(f.state,f.arena);
  const g=custom([27,26,18,19]);g.state.growth=1;tick(g,D.UP);assert.equal(g.state.status,'dead');assert.equal(g.state.reason,'self');
});
test('Near-full arena consumes the only legal food then explicit full-arena terminal',()=>{
  const rules=smallRules(),path=cycle(8,8),body=Array.from({length:63},(_,i)=>path[(64-i)%64]);
  const arena=createArena({width:8,height:8,initialBody:body}),s=createState({seed:1,rules,arena});
  assert.equal(s.food,path[1]);step(s,arena,rules);assert.equal(s.length,64);assert.equal(s.food,-1);assert.equal(s.reason,'arena-filled');assert.equal(s.status,'full');assert.equal(s.score,100);assertBody(s,arena);
  const full=createState({seed:1,rules,arena,body:bodyCells(s),direction:s.direction});assert.equal(full.status,'full');
});
test('No reachable legal food is explicit terminal, not a silent missing pickup',()=>{
  const rules=smallRules(),arena=createArena({width:8,height:8,blockedCells:[19,28,35],initialBody:[27,26]});
  const state=createState({seed:1,rules,arena});assert.equal(state.status,'full');assert.equal(state.reason,'no-legal-food');assert.equal(state.food,-1);assert(state.length<arena.freeCount);
});
test('Replay/events/hash identical; structured clone is Worker-compatible data',()=>{
  const f=loopFixture(100),inputs=[];for(let t=1;t<=3000;t++)inputs.push(...f.commands(t));
  const config={seed:123,rules:f.rules,arena:f.arena,inputs,ticks:3000,stateOptions:{food:f.path[1]}};
  const a=replay(config),b=replay(config);assert.equal(a.hash,b.hash);assert.deepEqual(a.events,b.events);
  assert(a.events.some(e=>e.type==='food-consumed'));
  assert.equal(stateHash(structuredClone(a.state)),a.hash);
  assert.equal(createArena(structuredClone(f.arena.exportTopology())).topologyHash,f.arena.topologyHash);
  assert.throws(()=>replay({...config,inputs:[{tick:2,sequence:2,direction:0},{tick:1,sequence:1,direction:1}]}),/ordered/);
});
test('30/60/90/120/144 FPS + artificial CPU×4 delay: identical hashes at every sim tick',()=>{
  const target=3600,baseline=[];
  for(const fps of [30,60,90,120,144])for(const delay of [false,true]){
    const f=loopFixture(250),hashes=[];f.state=createState({...f.options,food:f.path[1]});
    const clock=new FixedClock({onTick:()=>{step(f.state,f.arena,f.rules,f.commands(f.state.tick+1));hashes.push(stateHash(f.state));if(f.state.tick===target)clock.pause();}});
    let now=0,frame=0;clock.advance(now);
    while(f.state.tick<target){now+=1000/fps+(delay&&++frame%7===0?28:0);clock.advance(now);assert.notEqual(clock.status,'recovery');}
    if(!baseline.length)baseline.push(...hashes);else assert.deepEqual(hashes,baseline,`${fps}FPS, delay=${delay}`);
  }
});
test('No catch-up spiral; explicit recovery freezes simulation until resume; timer cleanup',()=>{
  let ticks=0;const c=new FixedClock({onTick:()=>ticks++});c.advance(0);assert.equal(c.advance(5000),0);assert.equal(c.status,'recovery');assert.equal(ticks,0);c.advance(6000);assert.equal(ticks,0);c.resume(7000);assert.equal(c.advance(7017),1);assert.equal(ticks,1);
  let callback,cancelled=false;const stop=startMainThreadClock(c,{now:()=>8000,schedule:fn=>(callback=fn,7),cancel:id=>{assert.equal(id,7);cancelled=true;}});stop();callback();assert(cancelled);assert.equal(ticks,1);
});
test('8/100/250/500/1200 long sessions, occupancy and cardinal continuity',()=>{
  for(const length of [8,100,250,500,1200]){
    const f=loopFixture(length,1);
    for(let t=1;t<=25000;t++){step(f.state,f.arena,f.rules,f.commands(t));assert.equal(f.state.status,'playing');if(t%1000===0)assertBody(f.state,f.arena);}
    assert.equal(f.state.length,length);assert.equal(f.state.score,0);assert.equal(f.state.food,97);
  }
});
test('Reachability/growth across repeated real food pickups; replay event stream agrees',()=>{
  for(let seed=0;seed<8;seed++){
    const rules=createRules({ticksPerCell:1}),arena=generateArena(seed,rules),state=createState({seed,rules,arena}),inputs=[];
    for(let pickup=0;pickup<20;pickup++){
      assert(validateFood(state,arena,state.food));
      const start=bodyCell(state,0),tail=bodyCell(state,state.length-1),target=state.food;
      const previous=new Int32Array(arena.cells).fill(-1),queue=[start];previous[start]=start;
      for(let at=0;at<queue.length&&previous[target]===-1;at++)for(let d=0;d<4;d++){
        if(queue[at]===start&&d===(state.direction+2)%4)continue;
        const n=neighbour(queue[at],d,arena.width,arena.height);
        if(n<0||arena.blocked(n)||previous[n]!==-1||occupied(state,n)&&n!==tail)continue;
        previous[n]=queue[at];queue.push(n);
      }
      assert.notEqual(previous[target],-1);
      const path=[];for(let c=target;c!==start;c=previous[c])path.push(c);path.reverse();
      for(const cell of path){const tick=state.tick+1,command={tick,sequence:tick,direction:directionBetween(bodyCell(state,0),cell,arena.width)};inputs.push(command);step(state,arena,rules,[command]);assert.equal(state.status,'playing');}
      assert.equal(state.score,(pickup+1)*100);assert.equal(state.length,8+pickup+1);assertBody(state,arena);
    }
    const result=replay({seed,rules,arena,inputs,ticks:state.tick});assert.equal(result.hash,stateHash(state));
    assert.equal(result.events.filter(e=>e.type==='food-consumed').length,20);
  }
});
