import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {ARENAS,designArena,designSession} from './arena.js';
import {labSession} from './session.js';
import {PRESETS} from './config.js';
import {arenaMeasurements} from './measure.js';
import {validateArena} from '../world/arena.js';
import {validateFood} from '../simulation/food.js';

test('all 18 DEV topology combinations are connected, clear for spawn/runway and have two unblocked portals',()=>{
 for(const touch of [false,true])for(const id of Object.keys(ARENAS))for(const density of ['LOW','MEDIUM','HIGH']){
  const f=designArena(id,density,touch),s=designSession(PRESETS.B,{touch,arenaPreset:id,density});
  assert.equal(validateArena(f.arena).connectedCells,f.arena.freeCount);assert.equal(f.rocks.length,{LOW:1,MEDIUM:3,HIGH:6}[density]);
  assert.equal(s.arena.width,ARENAS[id].width);assert.equal(s.arena.height,ARENAS[id].height);assert.equal(s.portals.length,2);
  assert.ok(s.portals.every(c=>!s.arena.blocked(c)));assert.ok(validateFood(s.state,s.arena,s.state.food));assert.ok(!s.forbidden(s.state.food));
  assert.ok(arenaMeasurements(s).minimumStaticExits>=2);
 }
});
test('B/MEDIUM remains exact baseline at every tick; telemetry and measurement reads cannot mutate hash',()=>{
 for(const touch of [false,true]){
  const a=labSession(PRESETS.B,{touch}),b=designSession(PRESETS.B,{touch});
  for(let i=0;i<300;i++){a.advance();b.advance();assert.equal(a.hash(),b.hash());const before=b.hash();arenaMeasurements(b);b.telemetry.summary(b);b.telemetry.pacingSummary(b);b.telemetry.designText(b);assert.equal(b.hash(),before);}
 }
});
test('current capacity and length feasibility are documented separately for desktop/mobile',()=>{
 const a=arenaMeasurements(designSession(PRESETS.B)),b=arenaMeasurements(designSession(PRESETS.B,{touch:true}));
 assert.deepEqual([a.columns,a.rows,a.interiorCells,a.traversableCells,a.stoneCount],[28,12,260,257,3]);
 assert.equal(b.traversableCells,237);assert.equal(b.padBlocked,20);assert.equal(a.lengths[3].feasible,true);assert.equal(b.lengths[3].feasible,false);
 assert.equal(a.minimumStoneWallCorridor,1);assert.equal(a.minimumStaticExits,2);
});
test('food trip telemetry includes first trip, preferred replacement distance and pickup/minute',()=>{
 const s=designSession(PRESETS.B);while(!s.foods)s.advance();const t=s.telemetry,r=t.summary(s);
 assert.equal(t.foodSpawns[0].distance,4);assert.equal(t.foodTrips.length,1);assert.equal(t.foodTrips[0].cellsTravelled,4);
 assert.ok(t.foodSpawns.at(-1).distance>=5&&t.foodSpawns.at(-1).distance<=12);assert.ok(r.pickupRatePerMinute>0);assert.equal(r.foodFailures,0);
});
test('human-approved Smooth V4, core, Forest visuals, scoring/effects/portal FSM remain unchanged',()=>{
 for(const file of ['forest-training/session.js','forest-training/runtime.js','forest-training/renderer.js','forest-training/motion.js','forest-training/ribbon-sprites.js','forest-training/ribbon-raster.js','smooth-v4-proof/ribbon.js','forest-training/style.css','tuning-lab/config.js','simulation/step.js']){
  const path='arcade/snake-next/'+file;assert.equal(readFileSync(path,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show','fa8c3d1:'+path],{encoding:'utf8'}).replace(/\r\n/g,'\n'));
 }
});
test('copied/archived design results identify logical arena, density and device without mutating state',()=>{
 const s=designSession(PRESETS.B,{arenaPreset:'C',density:'HIGH',touch:true}),hash=s.hash();
 assert.deepEqual(s.telemetry.summary(s).design,{arenaPreset:'C',density:'HIGH'});
 assert.match(s.telemetry.designText(s),/DEV arena C 34×14; stones HIGH; touch true/);assert.equal(s.hash(),hash);
});
test('modelled horizon snapshots contain no later combo breaks or future quiet intervals',()=>{
 const data=JSON.parse(readFileSync(new URL('../../../docs/qa/forest-design-review/measurements.json',import.meta.url),'utf8'));
 assert.equal(data.current.length,12);
 for(const run of data.current)for(const c of run.checkpoints){
  assert.ok(c.duration<=c.requestedSeconds);assert.ok(c.comboBreaks.every(b=>b.time<=c.duration));
  assert.ok(c.quietIntervals.every(q=>q.to<=c.duration));assert.ok(c.mushroomStalls.every(q=>q.to<=c.duration));
 }
});
