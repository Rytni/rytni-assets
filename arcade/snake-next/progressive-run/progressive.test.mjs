import test from 'node:test';
import {withoutTimingAdditions} from '../tests/timing-lock.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {ProgressiveSession} from './session.js';
import {config,stageAt,eventPressure,speedTarget,cadence,STAGES,STRIDE} from './config.js';
import {PRESETS,profileCadence} from '../tuning-lab/config.js';
import {bodyCells,bodyCell} from '../simulation/body.js';
import {createState} from '../entry.js';
import {validateFood} from '../simulation/food.js';
import {installTopology,hazardSafe} from './world.js';
import {Camera} from './camera.js';
import {SnakeMotion} from '../forest-training/motion.js';
import {DEFINITIONS} from './director.js';

test('progress is mushrooms only; staged worlds/caps/multipliers/pressure are bounded',()=>{
 const c=config();assert.deepEqual(STAGES.map(s=>s.at),[0,12,30,65,110]);
 for(let p=0;p<10000;p+=7){const stage=stageAt(p);assert.ok(stage.world[0]<=112&&stage.world[1]<=56);assert.ok(stage.multiplier<=2);assert.ok(eventPressure(p,c)<=1);assert.ok(60/cadence(90000,p,c)<=9);}
 for(let tick=0;tick<=3600;tick++)assert.equal(cadence(tick,0,c),profileCadence(PRESETS.B,tick));
 const s=new ProgressiveSession();s.state.movePhase=-20000;for(let i=0;i<1000;i++)s.advance();assert.equal(s.foods,0);assert.equal(s.progress,0);assert.equal(s.score,0);assert.equal(s.stage.index,0);
 assert.throws(()=>config({speedCaps:[6,5,7,8,9]}));
 const custom=config({thresholds:[0,2,4,6,8],endlessInterval:20});assert.equal(stageAt(4,custom).chapter,'Caves');assert.equal(stageAt(28,custom).index,5);assert.throws(()=>config({thresholds:[0,2,2,4,5]}));
});
test('expansion while moving preserves arrays, entities, queued turns, material moves and food',()=>{
 const s=new ProgressiveSession();s.combo=3;s.lastFood=0;s.collect('anchor',bodyCell(s.state,0));s.state.turns[0]=0;s.state.turnCount=1;
 const original={state:s.state,body:s.state.body,occupancy:s.state.occupancy,head:bodyCell(s.state,0),food:s.state.food,length:s.state.length,moves:s.moves,effects:structuredClone(s.effects),portals:s.portals.slice()};
 const motion=new SnakeMotion(s);s.forceExpansion();s.advance();motion.capture(s);
 assert.equal(s.state,original.state);assert.equal(s.state.body,original.body);assert.equal(s.state.occupancy,original.occupancy);assert.equal(bodyCell(s.state,0),original.head);assert.equal(s.state.food,original.food);
 assert.equal(s.state.turnCount,1);assert.equal(s.state.length,original.length);assert.equal(s.moves,original.moves);assert.equal(s.combo,3);assert.deepEqual(s.effects,original.effects);assert.deepEqual(s.portals,original.portals);
 assert.deepEqual([s.world.width,s.world.height],[36,18]);assert.ok(validateFood(s.state,s.arena,s.state.food));assert.equal(motion.state,original.state);
});
test('same inputs/config replay identically on desktop/mobile; camera/FPS reads do not affect hash',()=>{
 const a=new ProgressiveSession({touch:false}),b=new ProgressiveSession({touch:true}),ca=new Camera(),cb=new Camera(),ma=new SnakeMotion(a),mb=new SnakeMotion(b);
 for(let i=1;i<=2000;i++){
  if(i===80){a.forceExpansion();b.forceExpansion();}const commands=i===110?[{sequence:1,direction:0,tick:1}]:[];a.advance(commands);b.advance(commands);ma.capture(a);mb.capture(b);
  const hash=a.hash();ca.update(ma.frame(a,.1),a);ca.update(ma.frame(a,.8),a);cb.update(mb.frame(b,.3),b,true);a.telemetry.summary(a);assert.equal(a.hash(),hash);assert.equal(a.hash(),b.hash());
 }
});
test('2 positive + 1 negative slots, refresh, anchor, corruption and decay semantics',()=>{
 const s=new ProgressiveSession();assert.ok(s.collect('anchor',0));assert.ok(s.collect('guard',0));assert.ok(!s.collect('spores',0));assert.ok(s.collect('decay',0));assert.ok(!s.collect('mist',0));
 s.tick=100;s.collect('guard',0);assert.equal(s.effects.find(e=>e.kind==='guard').ends,2200);
 const anchored=new ProgressiveSession();anchored.state.movePhase=-20000;anchored.combo=4;anchored.lastFood=0;anchored.collect('anchor',0);for(let i=0;i<900;i++)anchored.advance();assert.equal(anchored.combo,4);assert.equal(anchored.progress,0);
 const decayed=new ProgressiveSession();decayed.state.movePhase=-20000;decayed.combo=4;decayed.lastFood=0;decayed.collect('decay',0);for(let i=0;i<421;i++)decayed.advance();assert.equal(decayed.combo,0);
 function award(stage,weak=false){const q=new ProgressiveSession({progression:{startStage:stage}});if(weak)q.collect('weak',0);while(!q.foods)q.advance();return q.score;}
 assert.equal(award(0),100);assert.equal(award(2),149);assert.equal(award(2,true),89);
});
test('candidate switch disables all new pickup kinds, including Swamp pressure weighting',()=>{
 const s=new ProgressiveSession({progression:{startStage:3,candidates:false,pressure:1}});
 assert.ok(s.director.candidates(s,true).every(k=>['focus','harvest'].includes(k)));assert.deepEqual(s.director.candidates(s,false),['rush']);
 const q=new ProgressiveSession({progression:{startStage:3,pressure:1}});assert.ok(q.director.candidates(q,true).filter(k=>k==='portalPrize').length>=2);
});
test('guard absorbs one environmental impact, never a self collision',()=>{
 const s=new ProgressiveSession(),head=bodyCell(s.state,0);s.world.obstacles.push({cell:head+1,kind:'stone'});installTopology(s);s.collect('guard',head);s.state.movePhase=s.cadence()-1;s.advance();
 assert.equal(s.status,'playing');assert.equal(bodyCell(s.state,0),head);assert.ok(!s.effects.some(e=>e.kind==='guard'));assert.ok(s.events.some(e=>e.kind==='guard-used'));assert.ok(s.arena.blocked(head+1));
 const q=new ProgressiveSession(),xy=[[5,5],[5,6],[6,6],[7,6],[7,5],[7,4],[6,4],[5,4]];q.state=createState({seed:9,rules:q.rules,arena:q.arena,body:xy.map(([x,y])=>y*STRIDE+x),direction:0,food:5*STRIDE+15});q.state.growth=1;q.state.movePhase=q.cadence()-1;q.collect('guard',0);q.advance();assert.equal(q.state.reason,'self');assert.equal(q.status,'dying');
});
test('warned hazards revalidate, preserve reachability, expire and clean up on death',()=>{
 const s=new ProgressiveSession({progression:{startStage:3}});s.director.warn(s);assert.ok(s.director.warnings.length>0&&s.director.warnings.length<=2);
 const warnings=s.director.warnings.slice();s.tick=120;s.director.step(s);assert.ok(s.world.hazards.length>0&&s.world.hazards.length<=2);assert.ok(validateFood(s.state,s.arena,s.state.food));
 for(const h of s.world.hazards)assert.ok(s.arena.blocked(h.cell));s.tick=480;s.director.step(s);assert.equal(s.world.hazards.length,0);assert.ok(warnings.every(w=>!s.arena.blocked(w.cell)));
 assert.ok(!hazardSafe(s,s.state.food));assert.ok(!hazardSafe(s,bodyCell(s.state,0)));
 s.tick=1200;s.director.warn(s);s.tick=1320;s.director.step(s);assert.ok(s.world.hazards.length);s.world.obstacles.push({cell:bodyCell(s.state,0)+1,kind:'stone'});installTopology(s);s.state.movePhase=s.cadence()-1;s.advance();assert.equal(s.status,'dying');assert.equal(s.world.hazards.length,0);assert.equal(s.director.warnings.length,0);
});
test('spores keep one standard food; portal prize only rewards a successful transfer, camera snaps',()=>{
 const s=new ProgressiveSession({progression:{startStage:2}});s.collect('spores',0);const food=s.state.food;while(!s.foods)s.advance();assert.ok(s.spores.length>=2&&s.spores.length<=3);assert.notEqual(s.state.food,food);assert.ok(validateFood(s.state,s.arena,s.state.food));
 const q=new ProgressiveSession({progression:{startStage:2}}),motion=new SnakeMotion(q),camera=new Camera();camera.update(motion.frame(q,0),q);q.portals=[bodyCell(q.state,0)+1,15*STRIDE+35];q.portal.phase='armed';q.director.windowEnd=10000;q.collect('portalPrize',0);
 for(let i=0;i<70&&!q.portal.transfers;i++){q.advance();motion.capture(q);}assert.equal(q.portal.transfers,1);assert.ok(q.events.some(e=>e.kind==='portal-reward'));assert.ok(!q.effects.some(e=>e.kind==='portalPrize'));assert.equal(q.score,360);assert.equal(q.combo,2);
 const view=camera.update(motion.frame(q,0),q);assert.ok(view.x>0&&view.y>0);assert.equal(camera.transfer,1);
});
test('dead-zone camera does not drift in center and handles portal atomically',()=>{
 const s=new ProgressiveSession({progression:{startStage:3}}),c=new Camera(),f={head:{x:13,y:5},alpha:.5};assert.equal(c.update(f,s).x,0);
 s.tick++;assert.equal(c.update({head:{x:15,y:6},alpha:.6},s).x,0);s.tick++;const v=c.update({head:{x:30,y:20},alpha:.8},s);assert.equal(v.x,10);assert.equal(v.y,12);
 s.portal.transfers++;const snap=c.update({head:{x:55,y:28},alpha:0},s);assert.equal(snap.x,36);assert.equal(snap.y,20);
});
test('approved Smooth V4, core, B config, cabinet/HUD and Forest remain byte-identical',()=>{
 for(const file of ['forest-training/session.js','forest-training/runtime.js','forest-training/renderer.js','forest-training/motion.js','forest-training/ribbon-sprites.js','forest-training/ribbon-raster.js','smooth-v4-proof/ribbon.js','forest-training/style.css','forest-training/hud-type.js','tuning-lab/config.js','simulation/step.js']){
  const path='arcade/snake-next/'+file;assert.equal(withoutTimingAdditions(file,readFileSync(path,'utf8')),execFileSync('git',['show','fa8c3d1:'+path],{encoding:'utf8'}).replace(/\r\n/g,'\n'));
 }
});
