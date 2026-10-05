import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {TunnelSession} from '../gate-one/session.js';
import {TunnelMotion,snappedTunnelFrame} from '../gate-one/motion.js';
import {createState,createArena,createRules,step,stateHash} from '../entry.js';
import {bodyCell,bodyCells,mark} from '../simulation/body.js';
import {WORLDS,capacity,pressureRate,effectiveRate,MOVE_UNIT,movementDue,TIMING_VERSION} from './capacity-model.js';
import {fitWorldLayout} from './fit-world.js';
import {geometry} from '../forest-training/renderer.js';
import {paintLOD} from './readable-objects.js';
import {installTopology} from '../progressive-run/world.js';
const cell=(x,y)=>112*y+x;
const session=(startStage=0)=>new TunnelSession({seed:17,progression:{model:'fit-world-v2',freeTrigger:15,startStage,density:0}});
function syntheticOccupancy(s,n){s.state.length=n;s.state.headIndex=0;let i=0;for(let y=1;y<s.world.height-1&&i<n;y++)for(let x=1;x<s.world.width-1&&i<n;x++)s.state.body[i++]=cell(x,y);}
test('capacity excludes walls/permanent solids/duplicate cells, ignores every temporary entity',()=>{
 const s=session(),before=capacity(s);assert.equal(before.traversableCapacity,280);assert.equal(before.snakeOccupied,8);
 s.world.obstacles=[{cell:cell(14,9)},{cell:cell(14,9)},{cell:0}];assert.equal(capacity(s).traversableCapacity,279);
 s.world.hazards=[{cell:cell(13,9)}];s.pickups=[{cell:cell(15,9)}];s.portals=[cell(17,9)];s.director.warnings=[{cell:cell(18,9)}];assert.equal(capacity(s).traversableCapacity,279);
 s.state.body[1]=s.state.body[0];assert.equal(capacity(s).snakeOccupied,7);
});
test('15% trigger is exact integer comparison, capped at four stages; no mushroom trigger',()=>{
 const s=session();syntheticOccupancy(s,237);assert.equal(capacity(s).shouldExpand,false);syntheticOccupancy(s,238);assert.equal(capacity(s).shouldExpand,true);assert.equal(capacity(s).predictedExpansionLength,238);
 const live=session();live.foods=200;live.advance();assert.equal(live.stage.index,0);
 for(let i=1;i<=3;i++){live.forceExpansion();live.advance();assert.equal(live.stage.index,i);assert.deepEqual([live.world.width,live.world.height],WORLDS[i]);}
 live.forceExpansion();live.advance();assert.equal(live.stage.index,3);assert.equal(live.capacityExpansions.length,3);
});
test('real capacity expansion records actual/predicted length, preserves canonical body and queued turn',()=>{
 const s=session();const route=[];for(let y=1;y<=10;y++)for(let x=1;x<=28;x++)route.push(cell(y%2?x:29-x,y));
 // Reverse to a legal serpentine head; expansion occurs without a cell step.
 s.state=createState({seed:17,arena:s.arena,rules:s.rules,body:route.slice(0,238).reverse(),direction:1});
 s.state.movement={version:TIMING_VERSION,progress:0,rate:pressureRate(s)};
 s.state.turns[0]=2;s.state.turnCount=1;const body=bodyCells(s.state),old=pressureRate(s);s.advance();
 assert.equal(s.stage.index,1);assert.deepEqual(bodyCells(s.state),body);assert.equal(s.state.turnCount,1);assert.equal(s.capacityExpansions[0].actualLength,238);assert.equal(s.capacityExpansions[0].predictedExpansionLength,238);assert.equal(s.capacityExpansions[0].devForced,false);assert.equal(pressureRate(s),old);s.advance();assert.equal(s.stage.index,1);
});
test('pressure curve is continuous, length driven, fixed point and effect duration unchanged',()=>{
 for(let i=0;i<4;i++){const s=session(i),lo=[4.2,5.3,7,7.9][i],hi=[5.3,7,7.9,8][i];assert.equal(pressureRate(s)/1e6,lo);const r=pressureRate(s);s.tick+=60000;assert.equal(pressureRate(s),r);syntheticOccupancy(s,capacity(s).predictedExpansionLength);assert.equal(pressureRate(s)/1e6,hi);s.effects=[{kind:'focus',ends:s.tick+60}];assert.equal(effectiveRate(s),Math.round(pressureRate(s)/1.22));s.effects.push({kind:'rush',ends:s.tick+60});assert.equal(effectiveRate(s),Math.round(Math.round(pressureRate(s)/1.22)/.8));}
});
test('fixed-point carry measures fractional speeds, hashes accumulator, legal timing intervals differ by one tick',t=>{
 const arena=createArena({width:30,height:12,initialBody:[161,160,159,158,157,156,155,154],initialDirection:1,runwayCells:0}),rules=createRules({width:30,height:12,runwayCells:4,minFreeCells:1,obstacleBlocks:0,ticksPerCell:14});
 for(const speed of [4.2,4.75,5.3,6.15,7,7.45,7.9,8]){
  const s=createState({seed:17,arena,rules});s.movement={version:TIMING_VERSION,progress:0,rate:Math.round(speed*1e6)};s.food=-1;let moves=0,last=0,sequence=0;const intervals=[];
  for(let t=1;t<=3600;t++){const h=bodyCell(s,0),x=h%30,y=Math.floor(h/30);let d=s.direction;if(d===1&&x===27)d=2;if(d===2&&y===10)d=3;if(d===3&&x===1)d=0;if(d===0&&y===1)d=1;const before=h;
   step(s,arena,rules,d!==s.direction&&s.turnCount===0?[{tick:s.tick+1,sequence:sequence++,direction:d,session:s.session}]:[]);
   assert.equal(s.status,'playing');if(bodyCell(s,0)!==before){moves++;intervals.push(t-last);last=t;}
   assert.ok(Number.isSafeInteger(s.movement.progress)&&s.movement.progress>=0&&s.movement.progress<MOVE_UNIT);
  }
  assert.ok(Math.abs(moves/60-speed)<=1/60);assert.ok(Math.max(...intervals)-Math.min(...intervals)<=1);
  const before=stateHash(s);s.movement.progress++;assert.notEqual(stateHash(s),before);
  t.diagnostic(JSON.stringify({target:speed,seconds:60,moves,measured:moves/60,intervalTicks:[Math.min(...intervals),Math.max(...intervals)]}));
 }
});
test('new replay repeats across render modes/FPS; pause/resume freezes, restart clears integer state',t=>{
 const sessions=[session(),session(),session()],motion=sessions.map(s=>new TunnelMotion(s)),base=geometry(1800,800,28,12,false,false);let sequence=0;
 for(let t=0;t<1200;t++){
  const s=sessions[0],h=bodyCell(s.state,0),x=h%112,y=Math.floor(h/112);let d=s.state.direction;if(d===1&&x===27)d=2;if(d===2&&y===10)d=3;if(d===3&&x===2)d=0;if(d===0&&y===5)d=1;
  const commands=d!==s.state.direction&&s.state.turnCount===0?[{direction:d,sequence:sequence++}]:[];
  sessions.forEach((s,i)=>{s.advance(commands);motion[i].capture(s);const hash=s.hash();if(i<2)for(const f of i===0?[0,.5,.95]:[.1,.8])fitWorldLayout(base,s,motion[i].frame(s,f));else snappedTunnelFrame(s,motion[i]);assert.equal(s.hash(),hash);assert.equal(s.status,'playing');});
  assert.equal(sessions[0].hash(),sessions[1].hash());assert.equal(sessions[0].hash(),sessions[2].hash());
 }
 const s=sessions[0],m=motion[0],alpha=m.freeze(s,.3),hash=s.hash();assert.equal(m.frame(s,.9).alpha,alpha);m.resume();assert.equal(m.frame(s,.3).alpha,alpha);assert.equal(s.hash(),hash);assert.equal(session().state.movement.progress,0);
 t.diagnostic(JSON.stringify({seed:17,ticks:1200,hashes:sessions.map(s=>s.hash()),timing:TIMING_VERSION}));
});
test('natural-stage predicted expansion lengths use permanent density only',t=>{
 const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',freeTrigger:15,density:2}}),rows=[];
 for(let i=0;i<4;i++){rows.push({world:[s.world.width,s.world.height],...capacity(s)});s.forceExpansion();s.advance();}
 assert.deepEqual(rows.map(r=>r.predictedExpansionLength),[238,450,727,1074]);t.diagnostic(JSON.stringify({predictedNaturalStages:rows}));
});
test('fractional Guard absorbs obstacle without moving and retains queued turn',()=>{
 const s=session();s.effects=[{kind:'guard',ends:9999}];s.world.obstacles=[{cell:cell(12,5)}];installTopology(s);s.state.movement.progress=MOVE_UNIT-s.state.movement.rate;
 const head=bodyCell(s.state,0);s.advance();assert.equal(s.status,'playing');assert.equal(bodyCell(s.state,0),head);assert.equal(s.state.movement.progress,0);assert.equal(s.effects.length,0);assert.ok(s.events.some(e=>e.kind==='guard-used'));
});
test('world fit fills one dimension, centers and preserves square cells at all four worlds',()=>{
 for(const [w,h,compact]of [[1882,900,false],[827,390,true]])for(const [width,height]of WORLDS){const s=session();s.world={...s.world,width,height};const base=geometry(w,h,28,12,compact,compact),l=fitWorldLayout(base,s,{head:{x:10,y:5},alpha:0}).layout,g=l.playableGrid,a=l.cabinetAperture;assert.ok(g.x>=a.x&&g.y>=a.y&&g.x+g.w<=a.x+a.w&&g.y+g.h<=a.y+a.h);assert.ok(Math.abs(l.field.w/width-l.field.h/height)<1e-6);assert.ok(Math.abs(l.field.x+l.field.w/2-l.arena.x-l.arena.w/2)<1e-6);}
});
for(const length of [8,30,250])test('new scheduler preserves growth, portal split history and tail traversal at length '+length,()=>{
 const s=session(3),route=[];for(let y=4;y<20;y++)for(let n=0;n<26;n++)route.push(cell(y%2===0?28-n:3+n,y));
 s.state=createState({seed:17,arena:s.arena,rules:s.rules,body:route.slice(0,length),direction:1,food:cell(35,20)});s.state.movement={version:TIMING_VERSION,progress:0,rate:effectiveRate(s)};
 s.portals=[cell(29,4),cell(45,4)];s.portal.phase='armed';s.director.windowEnd=99999;s.preparePortals();s.director.next={positive:99999,negative:99999,portal:99999};s.state.growth=1;const m=new TunnelMotion(s);
 let sequence=0;while(s.moves<length+3&&s.status==='playing'){
  const h=bodyCell(s.state,0),x=h%112,y=Math.floor(h/112);let d=s.state.direction;
  if(s.moves>0){if(d===1&&x===58)d=2;else if(d===2&&y%2)d=3;else if(d===3&&x===40)d=2;else if(d===2&&y%2===0)d=1;}
  s.advance(d!==s.state.direction&&s.state.turnCount===0?[{direction:d,sequence:sequence++}]:[]);m.capture(s);
  const hash=s.hash(),frame=m.frame(s,.5);assert.equal(s.hash(),hash);assert.equal(new Set(bodyCells(s.state)).size,s.state.length);for(const span of frame.spans||[])for(let i=1;i<span.route.length;i++){const a=span.route[i-1],b=span.route[i];assert.equal(Math.abs(a.x-b.x)+Math.abs(a.y-b.y),1);}
 }
 s.advance();m.capture(s); // portal completion is reported on the following tick
 assert.equal(s.status,'playing');assert.equal(s.portal.transfers,1);assert.equal(s.portalCompleted,1);assert.ok(s.state.length>=length+1);
});
test('LOD masks are authored, bounded and semantically different',()=>{
 const signatures=[];for(const kind of ['food','harvest','focus','spores','guard','portalPrize','rush','weak','brambles','mist','portal']){const pixels=new Map();let color;paintLOD({set fillStyle(c){color=c;},fillRect(x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=16&&y+h<=16);for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)pixels.set(py*16+px,color);}},kind);assert.ok(pixels.size>40);assert.ok(new Set(pixels.values()).size<=3);signatures.push(JSON.stringify([...pixels]));}assert.equal(new Set(signatures).size,11);
});
test('collision/queue/body and V4 spatial geometry remain locked; only tick gate/alpha source changed',()=>{
 const old=p=>execFileSync('git',['show','2e82822:arcade/snake-next/'+p],{encoding:'utf8'}).replace(/\r\n/g,'\n'),now=p=>readFileSync('arcade/snake-next/'+p,'utf8').replace(/\r\n/g,'\n');
 for(const p of ['simulation/body.js','input/turns.js','gate-one/session.js','gate-one/motion.js','gate-one/ribbon.js','progressive-run/world.js','progressive-run/food.js','progressive-run/director.js','smooth-v4-proof/ribbon.js','forest-training/ribbon-raster.js','forest-training/ribbon-sprites.js','forest-training/runtime.js','forest-training/session.js','forest-training/style.css','effect-playground/style.css'])assert.equal(now(p),old(p),p);
 assert.equal(now('simulation/step.js').split('  const turning=')[1],old('simulation/step.js').split('  const turning=')[1]);
 assert.equal(now('forest-training/motion.js').split('  frame(session')[1],old('forest-training/motion.js').split('  frame(session')[1]);
 const p='progressive-run/session.js';assert.equal(now(p).split(' collect(kind,cell)')[1].split(' forceExpansion()')[0],old(p).split(' collect(kind,cell)')[1].split(' forceExpansion()')[0]);assert.equal(now(p).split('  const mushroom=')[1].split('  this.progress=this.foods')[0],old(p).split('  const mushroom=')[1].split('  this.progress=this.foods')[0]);
});
