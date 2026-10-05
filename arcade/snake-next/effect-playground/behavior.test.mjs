import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {visualPath,sampleVisualPath} from './visual-path.js';
import {rushPositions} from './vfx-presentation.js';
import {makeSweep,CELL} from '../smooth-v4-proof/ribbon.js';
import {tunnelSweep} from '../gate-one/ribbon.js';
import {TunnelMotion} from '../gate-one/motion.js';
import {TunnelSession} from '../gate-one/session.js';
import {ROOT_LIFECYCLE} from '../progressive-run/director.js';
import {hazardSafe} from '../progressive-run/world.js';
import {seedRootReview} from './behavior-fixtures.js';
import {vfxReviewSession} from './vfx-stress.js';
import {drawMist,nearMistSafety,mistDensity} from './visuals.js';
import {ASSET_CONTRACT} from './asset-contract.js';
import {bodyCell} from '../simulation/body.js';
import {effectAssets} from './asset-bank.js';

const session=()=>new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}});
const route=[{x:12,y:5},{x:12,y:6},{x:11,y:6},{x:10,y:6},{x:10,y:7},{x:11,y:7},{x:12,y:7},{x:13,y:7},{x:14,y:7},{x:15,y:7}];
const frame=(route,start=0)=>({route,start,end:start+6,head:{x:route[0].x+(route[1].x-route[0].x)*start,y:route[0].y+(route[1].y-route[0].y)*start,dx:route[0].x-route[1].x,dy:route[0].y-route[1].y},alpha:1-start});
test('Rush exactly samples locked V4 line/arc primitives, all cardinal mirrors; immutable',()=>{
 for(let mirror=0;mirror<2;mirror++)for(let turn=0;turn<4;turn++)for(let a=0;a<=20;a++){
  const r=route.map(q=>{let x=q.x*(mirror?-1:1),y=q.y;for(let i=0;i<turn;i++)[x,y]=[-y,x];return {x,y};}),f=frame(r,a/20),before=JSON.stringify(f),sample=visualPath(f),sweep=makeSweep(f);
  for(const d of [.8,1.45,2.1,2.75,3.4,4.05]){
   const p=sample(d),part=sweep.parts.find(p=>p.d0<=f.start+d+1e-9&&p.d1>=f.start+d-1e-9&&p.d1>p.d0),t=(f.start+d-part.d0)/(part.d1-part.d0);
   const x=part.kind==='line'?part.a.x+(part.b.x-part.a.x)*t:part.cx+part.r*Math.cos(part.angle+part.delta*t);
   const y=part.kind==='line'?part.a.y+(part.b.y-part.a.y)*t:part.cy+part.r*Math.sin(part.angle+part.delta*t);
   assert.ok(Math.abs((p.x+.5)*CELL-x)<1e-6);assert.ok(Math.abs((p.y+.5)*CELL-y)<1e-6);assert.ok(Math.abs(Math.hypot(p.dx,p.dy)-1)<1e-9);
  }
  const ps=rushPositions(f,68);assert.deepEqual(ps.map(p=>p.slot),[0,1,2,3,4,5]);assert.equal(JSON.stringify(f),before);
 }
});
test('Rush bracket reindex has no cell jump through straight/S/U or a new head turn',()=>{
 let worst=0;
 for(const r of [route,Array.from({length:10},(_,i)=>({x:20-i,y:5}))])for(const delta of [{x:0,y:-1},{x:1,y:0}]){
  const old=frame(r,0),nextRoute=[{x:r[0].x+delta.x,y:r[0].y+delta.y},...r],next=frame(nextRoute,1-1e-6);
  for(let i=0;i<6;i++){
   const a=rushPositions(old,68)[i],b=rushPositions(next,68)[i],distance=Math.hypot(a.x-b.x,a.y-b.y)*68;worst=Math.max(worst,distance);assert.ok(distance<.001,distance);
   assert.ok(Math.hypot(a.offsetX-b.offsetX,a.offsetY-b.offsetY)<.001);
  }
 }assert.ok(worst<.001);
});
test('portal primitives are reused verbatim: fade at cut, no world chord',()=>{
 const f={...frame(route),spans:[{offset:0,end:2,route:[{x:80,y:40},{x:79,y:40},{x:78,y:40}]},{offset:2,end:9,route:[{x:3,y:5},{x:2,y:5},{x:1,y:5},{x:0,y:5},{x:-1,y:5},{x:-2,y:5},{x:-3,y:5},{x:-4,y:5}]}],head:{x:80,y:40,dx:1,dy:0}};
 assert.ok(tunnelSweep(f).parts.every(p=>p.kind!=='line'||Math.hypot(p.b.x-p.a.x,p.b.y-p.a.y)<68*8));
 for(let d=0;d<6;d+=.01){const p=sampleVisualPath(f,d);assert.ok(p.x>=78||p.x<=3);if(Math.abs(d-2)<1e-8)assert.ok(p.visibility<1e-6);}
});
function roots(){const s=session();s.pickups=[];s.director.next={positive:1e9,negative:1e9,portal:1e9};const cells=seedRootReview(s);assert.notEqual(cells.normal,undefined);assert.notEqual(cells.blocked,undefined);return {s,...cells};}
test('normal and blocked Roots have explicit non-solid pending -> retract lifecycle',()=>{
 const {s,normal,blocked}=roots();const trace=[];
 for(let tick=0;tick<=500;tick++){
  s.tick=tick;s.director.step(s);trace.push({tick,w:s.director.warnings.map(w=>({...w})),h:s.world.hazards.map(h=>({...h})),r:s.director.retracts.map(r=>({...r}))});
  assert.ok(!s.world.hazards.some(h=>h.cell===blocked));
 }
 assert.equal(trace[83].w.find(w=>w.cell===normal).phase,'warning');assert.equal(trace[84].w.find(w=>w.cell===normal).phase,'sprout');
 assert.equal(trace[120].h.find(h=>h.cell===normal).activatedAt,120);assert.equal(trace[120].h.find(h=>h.cell===normal).ends,480);
 assert.equal(trace[120].w.find(w=>w.cell===blocked).phase,'pending');assert.equal(trace[209].w.find(w=>w.cell===blocked).phase,'pending');
 assert.equal(trace[210].r.find(w=>w.cell===blocked).phase,'cancel-decay');assert.ok(trace[227].r.some(w=>w.cell===blocked));assert.ok(!trace[228].r.some(w=>w.cell===blocked));
 assert.equal(trace[480].r.find(w=>w.cell===normal).phase,'decay');assert.deepEqual(trace[500].r,[]);
});
test('delayed safe activation keeps its cell and full lifetime; snapshots/hash include deadlines',()=>{
 const {s,blocked}=roots();const originalFood=s.state.food;
 for(let tick=0;tick<=150;tick++){s.tick=tick;s.director.step(s);}
 assert.ok(s.director.warnings.some(w=>w.cell===blocked));const h=s.hash(),w=s.director.warnings.find(w=>w.cell===blocked);w.pendingDeadline++;assert.notEqual(s.hash(),h);w.pendingDeadline--;
 s.state.food=8*s.arena.width+25;assert.ok(hazardSafe(Object.assign(Object.create(s),{director:{warnings:[]}}),blocked));
 s.tick=151;s.director.step(s);const active=s.world.hazards.find(w=>w.cell===blocked);assert.equal(active.activatedAt,151);assert.equal(active.ends,511);assert.equal(active.cell,blocked);assert.notEqual(originalFood,s.state.food);
});
test('a safe telegraph becoming unsafe while sprouting remains visible, fixed and non-solid',()=>{
 const {s,normal}=roots(),food=s.state.food;
 for(let tick=0;tick<=100;tick++){s.tick=tick;s.director.step(s);}
 assert.equal(s.director.warnings.find(w=>w.cell===normal).phase,'sprout');
 s.state.food=normal+1;
 for(let tick=101;tick<=150;tick++){s.tick=tick;s.director.step(s);assert.ok(!s.world.hazards.some(w=>w.cell===normal));assert.ok(s.director.warnings.some(w=>w.cell===normal));}
 assert.equal(s.director.warnings.find(w=>w.cell===normal).phase,'pending');
 s.state.food=food;s.tick=151;s.director.step(s);assert.equal(s.world.hazards.find(w=>w.cell===normal).ends,511);
});
test('same seed/commands root replay; rendering modes read-only; pause/restart states',()=>{
 const runs=[roots().s,roots().s,roots().s],motions=runs.map(s=>new TunnelMotion(s));
 for(let tick=0;tick<210;tick++){
  for(let i=0;i<runs.length;i++){
   const s=runs[i];s.tick=tick;s.director.step(s);const before=s.hash();
   const f=motions[i].frame(s);rushPositions(f,22);vfxReviewSession(s,i%2?'mist':'rush');assert.equal(s.hash(),before);
  }assert.equal(runs[0].hash(),runs[1].hash());assert.equal(runs[1].hash(),runs[2].hash());
 }
 const s=runs[0],m=motions[0];m.freeze(s,.3);const f=m.frame(s);assert.deepEqual(rushPositions(f,22),rushPositions(m.frame(s,.9),22));
 const fresh=session();assert.deepEqual(fresh.director.warnings,[]);assert.deepEqual(fresh.director.retracts,[]);assert.deepEqual(fresh.world.hazards,[]);
 assert.equal(ROOT_LIFECYCLE.active,360);
});
test('native canonical tick replay/command hashes identical across V4/V2/snap presentation sampling',()=>{
 const runs=Array.from({length:3},()=>roots().s),motions=runs.map(s=>new TunnelMotion(s)),targets=[[24,5],[24,8],[4,8],[4,2],[24,2]],commands=[];
 let index=0,sequence=0;
 for(let tick=0;tick<540;tick++){
  const s=runs[0],c=bodyCell(s.state,0),x=c%s.arena.width,y=Math.floor(c/s.arena.width);
  if(x===targets[index][0]&&y===targets[index][1])index=(index+1)%targets.length;
  const [tx,ty]=targets[index],d=x===tx?(ty>y?2:0):(tx>x?1:3),cmd=!s.state.turnCount&&d!==s.state.direction?[{direction:d,sequence:++sequence,tick:s.state.tick+1,repeat:false}]:[];
  commands.push(cmd);
  for(let i=0;i<runs.length;i++){
   const r=runs[i];r.advance(cmd);motions[i].capture(r);const hash=r.hash();
   for(const fraction of i===0?[0,.5,1]:i===1?[0,1]:[1])rushPositions(motions[i].frame(r,fraction),22);
   assert.equal(r.hash(),hash);
  }
  assert.equal(runs[0].hash(),runs[1].hash());assert.equal(runs[1].hash(),runs[2].hash());
  assert.equal(runs[0].state.reason,runs[2].state.reason);
 }
 assert.equal(runs[0].status,'playing');assert.ok(commands.some(c=>c.length));
 const replay=roots().s;for(const c of commands)replay.advance(c);assert.equal(replay.hash(),runs[0].hash());
});
test('unsafe head, portal, mandatory food and blocked cells never become solid',()=>{
 for(const cellOf of [s=>bodyCell(s.state,0),s=>s.portals[0],s=>s.state.food,s=>0]){
  const s=session(),cell=cellOf(s);s.director.warnings=[{cell,starts:0,pendingDeadline:90}];
  for(let tick=0;tick<=90;tick++){s.tick=tick;s.director.step(s);assert.ok(!s.world.hazards.some(h=>h.cell===cell));}
  assert.ok(s.director.retracts.some(w=>w.cell===cell&&w.phase==='cancel-decay'));
 }
});
test('Mist uses rect clip only, nonzero smooth density; nearby safety objects and layers',()=>{
 const s=session();s.effects=[{kind:'mist',ends:1000}];const f={...frame(route),viewX:0,viewY:0},calls=[];
 const ctx=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});
 const old=effectAssets.ready;effectAssets.ready=new Map([['vfx.mist-puff',{}]]);
 try{drawMist(ctx,s,f,22,{field:{x:0,y:0},arena:{x:0,y:0,w:600,h:240}});}finally{effectAssets.ready=old;}
 assert.ok(calls.some(c=>c[0]==='rect'));assert.ok(!calls.some(c=>['arc','ellipse'].includes(c[0])));assert.deepEqual(calls.filter(c=>c[0]==='clip'),[['clip']]);
 for(let d=0;d<10;d+=.1)assert.ok(mistDensity(d)>=.45&&mistDensity(d)<=1);
 assert.equal(nearMistSafety(f,5*s.arena.width+17,s.arena.width),true);assert.equal(nearMistSafety(f,5*s.arena.width+18,s.arena.width),false);
 const src=readFileSync('arcade/snake-next/progressive-run/presentation.js','utf8');assert.ok(src.indexOf('drawMist(ctx')<src.indexOf('drawUnderSnake(ctx'));assert.ok(src.indexOf('drawUnderSnake(ctx')<src.indexOf('drawWithFoodReaction(ctx'));assert.ok(src.indexOf('drawWithFoodReaction(ctx')<src.indexOf('drawEffectsWorld(ctx'));
});
test('all 59 PNGs + unrelated Director/session source remain unchanged from base',()=>{
 for(const a of Object.values(ASSET_CONTRACT))assert.deepEqual(readFileSync('.'+a.url),execFileSync('git',['show','0d45ffb:'+a.url.slice(1)]),a.key);
 const read=p=>readFileSync(p,'utf8').replace(/\r\n/g,'\n'),old=p=>execFileSync('git',['show','0d45ffb:'+p],{encoding:'utf8'}).replace(/\r\n/g,'\n');
 const p='arcade/snake-next/progressive-run/session.js';assert.equal(read(p).replace('this.director.retracts=[];',''),old(p));
 const d='arcade/snake-next/progressive-run/director.js',now=read(d),before=old(d);
 assert.equal(now.split('export const DEFINITIONS=')[1].split('export const ROOT_LIFECYCLE')[0],before.split('export const DEFINITIONS=')[1].split('export class Director')[0]);
 assert.equal(now.split(' interval(s,kind)')[1].split(' warn(s)')[0],before.split(' interval(s,kind)')[1].split(' warn(s)')[0]);
 assert.equal(now.split(' sporeDrop(s)')[1].split(' step(s)')[0],before.split(' sporeDrop(s)')[1].split(' step(s)')[0]);
 assert.equal(now.split('  s.spores=s.spores.filter')[1].split(' snapshot()')[0],before.split('  s.spores=s.spores.filter')[1].split(' snapshot()')[0]);
});
