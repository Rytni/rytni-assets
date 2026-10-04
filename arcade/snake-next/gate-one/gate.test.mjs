import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createState} from '../entry.js';
import {bodyCells,bodyCell,occupied} from '../simulation/body.js';
import {TunnelSession,EXIT_RUNWAY} from './session.js';
import {TunnelMotion,snappedTunnelFrame} from './motion.js';
import {tunnelSweep,TunnelRibbon} from './ribbon.js';
import {radiusAt,raster} from '../smooth-v4-proof/ribbon.js';
import {pose,measureSection,regionAt,parallelClearance} from '../smooth-v4-proof/validation/local-validator.mjs';
import {frameAt} from '../smooth-v4-proof/fixtures.js';
import {RibbonRaster} from '../forest-training/ribbon-raster.js';
import {LookAheadCamera} from './camera.js';
import {installTopology,hazardSafe,topology} from '../progressive-run/world.js';
import {foodLegal} from '../progressive-run/food.js';
import {DX,DY} from '../simulation/rules.js';
import {portalExitCue} from './audio.js';
const W=112,cell=(x,y)=>y*W+x;

export function fixture(length=8){
 const s=new TunnelSession({seed:17,progression:{startStage:4,density:0}}),route=[];
 // A long, unique, legal initial body behind a right-facing head.
 for(let row=0;row<12;row++)for(let n=0;n<30;n++)route.push(cell(row%2?1+n:30-n,12+row));
 const body=route.slice(0,length);
 s.state=createState({seed:17,rules:s.rules,arena:s.arena,body,direction:1,food:cell(65,8)});s.state.cadence=s.cadence();
 s.portals=[cell(31,12),cell(53,12)];s.portal.phase='armed';s.director.windowEnd=100000;s.preparePortals();
 s.director.next={positive:100000,negative:100000,portal:100000};return s;
}
function move(s,d){if(d!==undefined)s.state.turns[0]=d,s.state.turnCount=1;s.state.movePhase=s.cadence()-1;s.advance();return bodyCell(s.state,0);}
function assertRing(s){const body=bodyCells(s.state);assert.equal(new Set(body).size,s.state.length);for(let c=0;c<s.arena.cells;c++)assert.equal(occupied(s.state,c),body.includes(c),'occupancy '+c);}

for(const length of [8,30,250])test('progressive tunnel, half body, length '+length,()=>{
 const s=fixture(length),old=bodyCells(s.state),state=s.state,body=s.state.body,mask=s.state.occupancy,m=new TunnelMotion(s);
 move(s);m.capture(s);assert.equal(bodyCell(s.state,0),s.portals[1]);assert.equal(s.portal.transfers,1);assert.equal(s.state,state);assert.equal(s.state.body,body);assert.equal(s.state.occupancy,mask);
 assert.deepEqual(bodyCells(s.state).slice(1),old.slice(0,-1));assert.equal(s.state.length,length);assertRing(s);
 let head=bodyCell(s.state,0),d=1,completed=false;
 // Exit lays a second long path without entering the pre-portal snake.
 for(let i=0;i<length+2;i++){
  const x=head%W,y=Math.floor(head/W);if(d===1&&x===75)d=2;else if(d===2&&y%2===1)d=3;else if(d===3&&x===45)d=2;else if(d===2&&y%2===0)d=1;
  head=move(s,d);m.capture(s);assert.equal(s.status,'playing');assert.equal(s.state.length,length);
  if(i===Math.floor(length/2)-1){assert.ok(s.portalEdges.length);assert.ok(bodyCells(s.state).some(c=>c%W<32));assert.ok(bodyCells(s.state).some(c=>c%W>=45));assertRing(s);installTopology(s);assert.ok(foodLegal(s,s.state.food));}
  if(s.events.some(e=>e.kind==='portal-exit'))completed=true;
 }
 assert.ok(completed);assert.equal(s.portalCompleted,1);assertRing(s);
});

test('shared alpha splits the portal instead of sampling/rendering a world bridge',()=>{
 const s=fixture(30),m=new TunnelMotion(s);move(s);m.capture(s);
 for(const a of [0,.1,.5,.95,1]){m.alpha=m.floor=0;s.state.movePhase=a*s.state.cadence;const f=m.frame(s),sweep=tunnelSweep(f);
  assert.ok(f.head.x<=31||f.head.x>=53);assert.equal(f.head.y,12);
  for(const p of sweep.parts){if(p.kind==='line')assert.ok(Math.hypot(p.a.x-p.b.x,p.a.y-p.b.y)<=68.001,'world bridge');assert.ok(p.d1>=p.d0);}
 }
 move(s);m.capture(s);s.state.movePhase=s.state.cadence*.5;const f=m.frame(s);assert.equal(f.spans.length,2);
 assert.equal(f.head.x,53.5);const sweep=tunnelSweep(f);
 for(const p of sweep.parts)if(p.d0>=f.start+1&&p.d1<=sweep.limit-.9){const d=(p.d0+p.d1)/2;assert.equal(radiusAt(sweep,d),18);}
 const h=s.hash();snappedTunnelFrame(s,m);m.frame(s,.2);m.frame(s,.8);assert.equal(s.hash(),h);
});

test('split adapter reuses exact V4 raster/material; corrected local BODY gate passes',()=>{
 const {decode}=createRequire(import.meta.url)('../retro-v5/raster.cjs'),sources=Array.from({length:8},(_,i)=>decode(readFileSync(new URL('../../../grib/mushroom-snake-retro-v5/straight-0-v'+i+'.png',import.meta.url))).data),live=new RibbonRaster(sources),adapter={v4:{sources},raster:live};
 for(const name of ['straight','U','S']){
  const f=frameAt(name,.5),sweep=tunnelSweep({...f,spans:[{offset:0,end:f.route.length-1,route:f.route}]}),w=18*68,h=10*68;
  const actual=TunnelRibbon.prototype.render.call(adapter,sweep,w,h),expected=raster(f,w,h,sources);assert.deepEqual(actual.mask,expected.mask,name);assert.deepEqual(actual.data,expected.data,name);
 }
 for(const length of [30,250]){const s=fixture(length),m=new TunnelMotion(s);move(s);m.capture(s);move(s);m.capture(s);
 for(const alpha of [.1,.5,.95]){
  s.state.movePhase=alpha*s.state.cadence;m.floor=m.alpha=0;const f=m.frame(s),sweep=tunnelSweep(f);
  for(const p of sweep.parts)for(const t of [.25,.5,.75]){
   const sample=pose(p,t);if(regionAt(sweep,sample.d)!=='BODY'||f.cuts.some(e=>Math.abs(e.index-sample.d)<.2))continue;
   const measure=measureSection(sweep,sample);assert.ok(measure.localThickness>=35&&measure.localThickness<=38,JSON.stringify(measure));assert.equal(measure.missing,0);
  }
  assert.ok(parallelClearance(sweep).every(p=>!p.overlap));
 }
 }
 live.release();
});

test('all cardinal entry/exit directions retain orthogonal history sampling',()=>{
 for(let incoming=0;incoming<4;incoming++)for(let outgoing=0;outgoing<4;outgoing++){
  const s=fixture(8),head=cell(25,10),delta=DX[incoming]+DY[incoming]*W,body=Array.from({length:8},(_,i)=>head-i*delta);
  s.state=createState({seed:17,rules:s.rules,arena:s.arena,body,direction:incoming,food:cell(65,8)});s.state.cadence=s.cadence();s.portals=[head+delta,cell(50,20)];s.portalFacing=[(incoming+2)%4,outgoing];s.portalReady=true;
  const m=new TunnelMotion(s);move(s);m.capture(s);assert.equal(s.state.direction,outgoing);
  for(const alpha of [0,.5,.95,1]){
   s.state.movePhase=alpha*s.state.cadence;m.alpha=m.floor=0;const f=m.frame(s);assert.equal(Math.abs(f.head.dx)+Math.abs(f.head.dy),1);for(const p of tunnelSweep(f).parts)if(p.kind==='line')assert.ok(p.a.x===p.b.x||p.a.y===p.b.y);
  }
 }
});

test('growth preserves portal history/phase, food and terrain validation on split ring',()=>{
 const s=fixture(30),m=new TunnelMotion(s);s.state.growth=1;move(s);m.capture(s);assert.equal(s.state.length,31);
 const edge=s.portalEdges[0];s.state.food=cell(54,12);s.placedFoods=s.foods;move(s);m.capture(s);assert.equal(s.state.length,32);assert.equal(s.foods,1);assert.equal(s.portalEdges[0],edge);
 assert.equal(s.portalEdges[0].move,1);installTopology(s);assert.ok(foodLegal(s,s.state.food));assertRing(s);
 assert.throws(()=>topology(s.world,bodyCells(s.state),s.state.direction),/Unmarked/);
 assert.equal(hazardSafe(s,s.portals[0]),false);
});

test('fixed facing with 3 legal cells, queue maps relative turns, illegal reversals stay rejected',()=>{
 const s=fixture();s.portalFacing=[3,2];s.state.turns[0]=1;s.state.turns[1]=0;s.state.turnCount=2;move(s);
 assert.equal(s.state.direction,2);assert.equal(s.state.turnCount,1);assert.equal(s.state.turns[0],1);
 const q=fixture();q.portalFacing=[3,2];move(q);q.state.movePhase=q.cadence()-1;q.advance([{tick:1,sequence:1,direction:0}]);assert.equal(q.state.direction,2);assert.equal(bodyCell(q.state,0),q.portals[1]+W);
 const p=fixture();p.preparePortals();assert.ok(p.portalReady);for(let i=0;i<2;i++){const d=p.portalFacing[i];for(let n=1;n<=EXIT_RUNWAY;n++){const c=p.portals[i]+(DX[d]+DY[d]*W)*n;assert.ok(!p.arena.blocked(c)&&!occupied(p.state,c));}}
});

test('exit occupancy and terrain use normal collision; post-crossing pre/post-body self collision',()=>{
 const s=fixture(30);s.portals[1]=bodyCell(s.state,10);s.portalFacing=[3,1];s.portalReady=true;move(s);assert.equal(s.state.reason,'self');assert.equal(s.status,'dying');assert.equal(s.portal.transfers,0);
 const q=fixture();q.world.obstacles.push({cell:q.portals[1],kind:'stone'});installTopology(q);move(q);assert.equal(q.state.reason,'obstacle');assert.equal(q.portal.transfers,0);
 const p=fixture(30);move(p); // Jump into pre-portal body from a second opportunity.
 p.portals=[bodyCell(p.state,0)+1,bodyCell(p.state,10)];p.portal.phase='armed';p.portalFacing=[3,1];p.portalReady=true;move(p);assert.equal(p.state.reason,'self');
 const t=fixture(30);move(t);move(t,1);move(t,2);move(t,3);move(t,0);assert.equal(t.state.reason,'self');
});

test('repeated portals compose by path distance without segment loss',()=>{
 const s=fixture(30),m=new TunnelMotion(s);move(s);m.capture(s);move(s);m.capture(s);
 // Second canonical opportunity while the first body still spans A/B.
 s.portals=[bodyCell(s.state,0)+1,cell(65,20)];s.portal.phase='armed';s.portalFacing=[3,1];s.portalReady=true;move(s);m.capture(s);
 assert.equal(s.portal.transfers,2);assert.equal(s.portalEdges.length,2);assertRing(s);installTopology(s);
 for(const a of [0,.25,.5,.75,1]){s.state.movePhase=a*s.state.cadence;m.alpha=m.floor=0;const f=m.frame(s),sweep=tunnelSweep(f);assert.equal(f.spans.length,3);for(const p of sweep.parts)if(p.kind==='line')assert.ok(Math.hypot(p.a.x-p.b.x,p.a.y-p.b.y)<=68.001);}
});

test('pause/resume is exact, death freezes split history; restart removes it',()=>{
 const s=fixture(30),m=new TunnelMotion(s);move(s);m.capture(s);s.state.movePhase=s.cadence()*.4;
 m.freeze(s,.2);const before=m.frame(s),h=s.hash();s.cancelPortal();assert.equal(s.hash(),h);assert.deepEqual(m.frame(s,.9),before);
 m.resume();assert.deepEqual(m.frame(s,0),before);move(s,2);m.capture(s);
 s.world.obstacles.push({cell:bodyCell(s.state,0)+W,kind:'stone'});installTopology(s);move(s);m.capture(s);assert.equal(s.status,'dying');assert.ok(m.frame(s).spans);
 for(let i=0;i<28;i++)s.advance();assert.equal(s.status,'result');assert.equal(s.world.hazards.length,0);assert.equal(s.director.warnings.length,0);
 const fresh=new TunnelSession();m.reset(fresh);assert.equal(fresh.portalEdges.length,0);assert.equal(fresh.state.length,8);assert.ok(!m.frame(fresh).spans);
});

test('renderer/FPS/mobile reads cannot change replay hash',()=>{
 const runs=[fixture(30),fixture(30),fixture(30)],motions=runs.map(s=>new TunnelMotion(s)),cameras=runs.map(()=>new LookAheadCamera());
 for(let tick=0;tick<180;tick++)for(let i=0;i<runs.length;i++){
  const s=runs[i],m=motions[i];if(tick===0)s.state.movePhase=s.cadence()-1;
  const commands=tick===100?[{tick:1,sequence:1,direction:2}]:[];s.advance(commands);m.capture(s);
  const hash=s.hash();for(const fraction of i===0?[.1,.3,.8]:i===1?[.5]:[]){const f=m.frame(s,fraction);cameras[i].update(f,s);if(f.spans)tunnelSweep(f);}assert.equal(s.hash(),hash);
  if(i)assert.equal(s.hash(),runs[0].hash());
 }
});

test('directional camera exposes 5+ forward cells, early walls, freeze and portal snap',()=>{
 const s=fixture(),c=new LookAheadCamera(),frame={head:{x:40,y:20,dx:0,dy:1},alpha:1};let view=c.update(frame,s);assert.ok(view.y+11-frame.head.y>=5);
 for(let i=0;i<60;i++){s.tick++;view=c.update({...frame,head:{x:40,y:20,dx:0,dy:-1}},s);}assert.ok(20-view.y>=5);
 const frozen=c.update({...frame,head:{x:40,y:20,dx:0,dy:-1}},s);assert.deepEqual(c.update({...frame,head:{x:40,y:20,dx:0,dy:-1}},s),frozen);
 s.tick++;view=c.update({head:{x:75,y:35,dx:1,dy:0},alpha:1},s);assert.equal(view.x,s.world.width-28);assert.equal(view.wallDistance.right,3);
});

test('expansion keeps moving and opening lasts exactly one active second',()=>{
 const s=new TunnelSession();s.forceExpansion();s.advance();assert.equal(s.openings.length,1);assert.equal(s.openings[0].duration,60);assert.deepEqual(s.openings[0].from,{width:28,height:12,biome:'forest'});assert.ok(s.announcements.some(a=>a.text==='МИР РАСШИРЕН'));assert.equal(s.status,'playing');
});

test('spatial portal cue retains SFX bus, one source and ended/stop cleanup',()=>{
 const calls=[],source={onended:()=>calls.push('source-ended')},gain={disconnect:()=>calls.push('gain-disconnect'),connect:p=>calls.push(p)},pan={pan:{value:0},connect:p=>calls.push(p),disconnect:()=>calls.push('pan-disconnect')};
 const audio={play:name=>{assert.equal(name,'portal-exit');return source;},gains:new Map([[source,gain]]),context:{createStereoPanner:()=>pan},sfxBus:{id:'existing-sfx'}};
 assert.equal(portalExitCue(audio,cell(26,6),W,{x:0,cols:28}),source);assert.ok(pan.pan.value>0&&pan.pan.value<=.75);assert.ok(calls.includes(audio.sfxBus));source.onended();assert.deepEqual(calls.slice(-2),['pan-disconnect','source-ended']);
});

test('locked core, B, Smooth V4, food policy, cabinet and HUD byte identical',()=>{
 for(const file of ['simulation/step.js','simulation/body.js','input/turns.js','tuning-lab/config.js','progressive-run/config.js','progressive-run/food.js','forest-training/session.js','forest-training/runtime.js','forest-training/motion.js','forest-training/ribbon-sprites.js','forest-training/ribbon-raster.js','smooth-v4-proof/ribbon.js','forest-training/renderer.js','forest-training/style.css','forest-training/hud-type.js']){
  const path='arcade/snake-next/'+file;assert.equal(readFileSync(path,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show','5bd0c0c:'+path],{encoding:'utf8'}).replace(/\r\n/g,'\n'),file);
 }
});
