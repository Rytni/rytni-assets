import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ProgressiveSession} from './session.js';
import {foodField,foodLegal,selectFood} from './food.js';
import {createState,createArena} from '../entry.js';
import {bodyCell} from '../simulation/body.js';
import {hazardSafe,installTopology} from './world.js';
import {choose} from './food-planner.mjs';
const fixture=JSON.parse(readFileSync(new URL('../../../docs/qa/food-reliability/seed17-before.json',import.meta.url),'utf8'));

test('exact censored topology is temporary, not full; legal tail movement recovers safely',()=>{
 const s=new ProgressiveSession({seed:17});s.world.width=80;s.world.height=40;s.world.obstacles=fixture.obstacles;installTopology(s);
 s.state=createState({seed:17,rules:s.rules,arena:s.arena,body:fixture.body,direction:fixture.direction});s.foods=132;s.placedFoods=131;
 const original=s.state.body;s.collect('anchor',0);s.combo=4;
 assert.equal(s.state.reason,'no-legal-food');assert.equal(foodField(s).vacant,2809);assert.equal(foodField(s).legal.length,0);
 s.repairFood();assert.equal(s.state.status,'playing');assert.equal(s.state.food,-1);assert.equal(s.foodSpawn.last.outcome,'temporarily unreachable');assert.equal(s.effects[0].kind,'anchor');
 for(let t=1;t<=600&&s.state.food<0&&s.status==='playing';t++)s.advance(s.state.movePhase>=s.cadence()-1?[{sequence:t,direction:choose(s),tick:1}]:[]);
 assert.equal(s.state.body,original);assert.equal(s.status,'playing');assert.ok(s.state.food>=0);assert.ok(foodLegal(s,s.state.food));assert.ok(foodField(s).seen[s.state.food]);assert.equal(s.foods,132);
});

test('preferred, wider, any and exhaustive tiers; forbidden masks and generator errors',()=>{
 const s=new ProgressiveSession({progression:{startStage:2}}),head=bodyCell(s.state,0),w=s.arena.width;
 const original=s.forbidden.bind(s);
 assert.equal(selectFood(s).tier,1);
 s.forbidden=c=>original(c)||Math.abs(c%w-head%w)+Math.abs(Math.floor(c/w)-Math.floor(head/w))!==1;
 assert.equal(selectFood(s).tier,2);
 s.forbidden=c=>original(c)||Math.abs(c%w-head%w)+Math.abs(Math.floor(c/w)-Math.floor(head/w))<25;
 assert.equal(selectFood(s).tier,3);
 s.forbidden=original;const reference=foodField(s);
 const recovered=selectFood(s,()=>0);assert.equal(recovered.tier,4);assert.equal(recovered.cell,reference.legal[0]);assert.equal(recovered.recoveredSearch,true);
 assert.equal(selectFood(s,()=>{throw Error('injected primary failure');}).tier,4);
 assert.equal(selectFood(s,()=>s.arena.cells+1).tier,4);
 const arena=s.arena;s.arena={...arena,blocked:()=>{throw Error('injected reference failure');}};
 assert.equal(selectFood(s).outcome,'generator_error');s.arena=arena;
 s.forbidden=()=>true;assert.equal(selectFood(s).outcome,'temporarily unreachable');
});

test('a genuine full board is distinguished from isolated free terrain',()=>{
 const s=new ProgressiveSession();
 // A fully occupied 2×2 logical interior is a classifier fixture, not a
 // natural-run claim. Retain the real ring/occupancy data via createState.
 s.world.width=4;s.world.height=4;s.world.obstacles=[];
 const body=[113,114,226,225];
 s.arena=createArena({width:112,height:56,blockedCells:Array.from({length:6272},(_,c)=>c).filter(c=>!body.includes(c)),initialBody:body,initialDirection:0});
 s.state=createState({seed:1,rules:s.rules,arena:s.arena,body,direction:0});
 assert.equal(selectFood(s).outcome,'board_full');assert.equal(foodField(s).vacant,0);
 s.repairFood();assert.equal(s.state.reason,'board_full');
});

test('all expansions preserve an existing legal reachable food and effects',()=>{
 const s=new ProgressiveSession();s.state.movePhase=-100;s.collect('anchor',0);
 for(let i=0;i<4;i++){
  const food=s.state.food,body=s.state.body;assert.ok(foodField(s).seen[food]);s.forceExpansion();s.advance();
  assert.equal(s.state.food,food);assert.equal(s.state.body,body);assert.ok(foodLegal(s,food));assert.ok(foodField(s).seen[food]);assert.equal(s.effects[0].kind,'anchor');
 }
 assert.equal(s.stage.index,4);
});

test('hazards cannot remove food routes; reject during transient isolation; 50 seeded warning cycles',()=>{
 const outcomes={activated:0,rejected:0};
 for(let seed=1;seed<=50;seed++){
  const s=new ProgressiveSession({seed,progression:{startStage:3}});s.collect('brambles',0);assert.ok(s.director.warnings.length<=2);
  const oldFood=s.state.food;s.tick=120;s.director.step(s);
  assert.equal(s.state.food,oldFood);assert.ok(foodLegal(s,oldFood));assert.ok(foodField(s).seen[oldFood]);outcomes.activated+=s.world.hazards.length;
  s.tick=480;s.director.step(s);assert.equal(s.world.hazards.length,0);
 }
 assert.ok(outcomes.activated>0);
 const s=new ProgressiveSession({progression:{startStage:3}}),field=foodField(s),cell=field.legal.find(c=>hazardSafe(s,c));assert.ok(cell>=0);
 const original=s.arena;s.arena={...original,blocked:c=>c===s.state.food||original.blocked(c)};
 assert.equal(hazardSafe(s,cell),false);
});

test('a warned hazard at the sole food-route articulation is rejected at activation',()=>{
 const s=new ProgressiveSession({progression:{startStage:2}}),row=10,body=Array.from({length:8},(_,i)=>row*112+11-i),cut=row*112+20,food=row*112+28;
 const free=new Set([...Array.from({length:27},(_,i)=>row*112+4+i),cut-112,cut+112]);
 s.arena=createArena({width:112,height:56,blockedCells:Array.from({length:6272},(_,c)=>c).filter(c=>!free.has(c)),initialBody:body,initialDirection:1});
 s.state=createState({seed:1,rules:s.rules,arena:s.arena,body,direction:1,food});
 assert.ok(foodField(s).seen[food]);assert.equal(foodField(s,cut).seen[food],0);
 assert.equal(hazardSafe(s,cut),false);
 s.director.warnings=[{cell:cut,starts:120,ends:480}];s.tick=120;s.director.step(s);
 assert.equal(s.world.hazards.length,0);assert.equal(s.state.food,food);assert.ok(foodField(s).seen[food]);
});
