import test from 'node:test';
import assert from 'node:assert/strict';
import {D2Geometry} from '../d2/geometry.js';
import {D2Material} from '../d2/material.js';
import {createD2Fixture} from '../d2/fixtures.js';
import {BodySnapshots,ContinuousBody} from '../presentation/path.js';
import {createState} from '../simulation/state.js';
import {step} from '../simulation/step.js';
import {stateHash} from '../simulation/hash.js';

const phases=[0,.125,.25,.5,.75,.875,1],lengths=[8,30,100,250,500,1200];
function setup(options){const f=createD2Fixture(options),state=createState({seed:73,...f,stateOptions:undefined,...f.stateOptions});const snaps=new BodySnapshots(f.arena.cells);snaps.reset(state);return {f,state,snaps};}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
test('sharedPhaseAllAnatomy: all lengths/directions use canonical endpoints without state writes',()=>{
  for(const length of lengths)for(let direction=0;direction<4;direction++){
    const {f,state,snaps}=setup({length,direction}),g=new D2Geometry(f.arena.cells),ref=new ContinuousBody(f.arena.cells);
    for(let i=0;i<f.rules.ticksPerCell;i++)step(state,f.arena,f.rules,[]);snaps.capture(state);const hash=stateHash(state);
    for(const alpha of phases){g.build(snaps,f.arena.width,alpha);ref.build(snaps,f.arena.width,alpha);close(g.head.x,ref.head.x);close(g.head.y,ref.head.y);close(g.tail.x,ref.tail.x);close(g.tail.y,ref.tail.y);for(let i=0;i<g.count*4;i++)assert.ok(Number.isFinite(g.polygon[i]));}
    assert.equal(stateHash(state),hash);
  }
});
test('turnCorridorContainment: straight,90,U,S/parallel shapes stay in occupied corridor',()=>{
  for(const shape of ['straight','90','U','S','parallel']){
    const {f,state,snaps}=setup({shape,length:30});const g=new D2Geometry(f.arena.cells);
    for(const alpha of phases){g.build(snaps,f.arena.width,alpha);for(let i=0;i<g.count*4;i+=2)assert.ok(g.inCorridor(g.polygon[i],g.polygon[i+1]),`${shape} contour escaped`);}
    assert.equal(state.length,30);
  }
});
test('growthKeepsTerminalContinuous: real food growth keeps previous terminal at all phases',()=>{
  const {f,state,snaps}=setup({shape:'straight',length:8,speed:20});const old=snaps.current[7];
  state.food=snaps.current[0]+1;
  for(let i=0;i<f.rules.ticksPerCell;i++)step(state,f.arena,f.rules,[]);
  snaps.capture(state);assert.equal(state.length,9);
  const g=new D2Geometry(f.arena.cells);for(const a of phases){g.build(snaps,f.arena.width,a);close(g.tail.x,old%96+.5);close(g.tail.y,Math.floor(old/96)+.5);}
});
test('materialAnchorSurvivesGrowthResize: same anchor travels with body, capture idempotent',()=>{
  const {f,state,snaps}=setup({shape:'straight',length:30,speed:20}),m=new D2Material(73,f.arena.cells),g=new D2Geometry(f.arena.cells),out=[];
  m.capture(snaps);g.build(snaps,96,1);m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);const before=out.map(v=>({...v}));
  for(let i=0;i<f.rules.ticksPerCell;i++)step(state,f.arena,f.rules,[]);snaps.capture(state);m.capture(snaps);m.capture(snaps);assert.equal(m.travel,1);
  g.build(snaps,96,1);m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);
  for(const old of before){const current=out.find(v=>v.id===old.id);if(current){close(current.x,old.x);close(current.y,old.y);}}
  const ids=out.map(v=>v.id);m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);assert.deepEqual(out.map(v=>v.id),ids);
});
test('mushroomCaps: no periodic per-cell stamps, short and sliding 50-cell caps',()=>{
  for(const length of lengths){const {f,snaps}=setup({length}),g=new D2Geometry(f.arena.cells).build(snaps,96,1),m=new D2Material(73,f.arena.cells),out=[];m.capture(snaps);m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);const fungi=out.filter(v=>v.kind==='mushroom');if(length===8)assert.ok(fungi.length<=1);if(length<=60)assert.ok(fungi.length<=2);for(const a of fungi)assert.ok(fungi.filter(b=>b.distance>=a.distance&&b.distance<a.distance+50).length<=2);}
});
test('parallelLaneClearance: core straight width remains .68 and taper goes to a single tip',()=>{
  const {f,snaps}=setup({shape:'parallel',length:30}),g=new D2Geometry(f.arena.cells).build(snaps,96,1);
  close(g.radiusAt(g.start+2),.34);assert.equal(g.radiusAt(g.end),0);close(g.taperLength,3);assert.ok(1-2*g.radiusAt(g.start+2)>=.32-1e-6);
});
test('lodPreservesGeometry: smaller detail does not alter canonical contour',()=>{
  const {f,snaps}=setup({length:250}),g=new D2Geometry(f.arena.cells).build(snaps,96,.5),before=Array.from(g.polygon.subarray(0,g.count*4)),m=new D2Material(73,f.arena.cells),out=[];m.capture(snaps);
  m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'small',out);assert.ok(out.every(v=>v.kind!=='flower'&&v.kind!=='scale'));m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);assert.deepEqual(Array.from(g.polygon.subarray(0,g.count*4)),before);
});
test('material categories remain stable when visible window clips other accents',()=>{
  const {f,snaps}=setup({length:250}),g=new D2Geometry(f.arena.cells).build(snaps,96,1),m=new D2Material(73,f.arena.cells),out=[];m.capture(snaps);
  m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);const before=out.map(v=>({...v}));
  m.visibleAccents(g,{x0:30,y0:12,x1:85,y1:15},'large',out);for(const v of out){const old=before.find(x=>x.id===v.id);if(old)assert.equal(v.kind,old.kind);}
});
