import test from 'node:test';
import assert from 'node:assert/strict';
import {D2Geometry} from '../d2/geometry.js';
import {D2Material} from '../d2/material.js';
import {createD2Fixture} from '../d2/fixtures.js';
import {BodySnapshots,ContinuousBody} from '../presentation/path.js';
import {createState} from '../simulation/state.js';
import {step} from '../simulation/step.js';
import {stateHash} from '../simulation/hash.js';
import {D2Resources} from '../d2/resources.js';
import {D2Forest} from '../d2/forest.js';
import {D2Renderer} from '../d2/renderer.js';
import {D2Review} from '../d2/review.js';
import {createTrainingRenderer,Training} from '../runtime/training.js';
import {DevRenderer} from '../presentation/renderer.js';

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
test('materialAnchorSurvivesGrowthResize: same anatomy anchor moves with the body through all phases',()=>{
  const {f,state,snaps}=setup({shape:'straight',length:30,speed:20}),m=new D2Material(73,f.arena.cells),g=new D2Geometry(f.arena.cells),out=[];
  m.capture(snaps);g.build(snaps,96,1);m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);const before=out.map(v=>({...v}));
  for(let i=0;i<f.rules.ticksPerCell;i++)step(state,f.arena,f.rules,[]);snaps.capture(state);m.capture(snaps);m.capture(snaps);assert.equal(m.travel,1);
  for(const alpha of phases){
    g.build(snaps,96,alpha);m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);
    for(const old of before){const current=out.find(v=>v.id===old.id);assert.ok(current,'Movement must retain material identity');close(current.x,old.x+alpha);close(current.y,old.y);close(current.distance-g.start,old.distance);assert.equal(current.kind,old.kind);}
  }
  state.food=snaps.current[0]+1;
  for(let i=0;i<f.rules.ticksPerCell;i++)step(state,f.arena,f.rules,[]);snaps.capture(state);m.capture(snaps);assert.equal(state.length,31);
  for(const alpha of phases){g.build(snaps,96,alpha);m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);for(const old of before){const current=out.find(v=>v.id===old.id);assert.ok(current,'Growth must not scramble old material');close(current.x,old.x+1+alpha);close(current.distance-g.start,old.distance);}}
  const ids=out.map(v=>v.id);m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);assert.deepEqual(out.map(v=>v.id),ids);
});
test('material follows the canonical turn path, independent of viewport and LOD',()=>{
  const {f,state,snaps}=setup({shape:'S',length:30,speed:20}),m=new D2Material(73,f.arena.cells),g=new D2Geometry(f.arena.cells),out=[],bounds={x0:0,y0:0,x1:96,y1:64};m.capture(snaps);g.build(snaps,96,1);m.visibleAccents(g,bounds,'large',out);const before=out.map(v=>({...v})),point={};
  for(let i=0;i<f.rules.ticksPerCell;i++)step(state,f.arena,f.rules,[]);snaps.capture(state);m.capture(snaps);
  for(const alpha of phases)for(const lod of ['small','large']){g.build(snaps,96,alpha);m.visibleAccents(g,bounds,lod,out);for(const old of before){const current=out.find(v=>v.id===old.id);assert.ok(current);g.point(g.start+old.distance,point);close(current.x,point.x);close(current.y,point.y);close(current.distance-g.start,old.distance);}const records=out.map(v=>({...v}));m.visibleAccents(g,{x0:35,y0:27,x1:45,y1:35},lod,out);for(const v of out){const expected=records.find(r=>r.id===v.id);close(v.x,expected.x);close(v.y,expected.y);}}
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
test('decodeDeduplicates: concurrent/repeated aliases share one decoded resource',async()=>{
  let calls=0;const r=new D2Resources({decode:async url=>{calls++;return {width:256,height:256,url};}}),manifest=[{id:'a',url:'art.png'},{id:'b',url:'art.png'}];await Promise.all([r.load(manifest),r.load(manifest)]);assert.equal(calls,1);assert.equal(r.get('a'),r.get('b'));assert.equal(r.inventory().images,262144);assert.equal(r.inventory().duplicates,0);
});
test('decodeFailureIsVisible: reject and expose failed URL, retry does not keep failed promise',async()=>{
  let fail=true;const r=new D2Resources({decode:async()=>{if(fail)throw Error('decode failed');return {width:16,height:16};}});await assert.rejects(r.load([{id:'a',url:'bad.png'}]),/bad.png/);assert.equal(r.get('a'),undefined);fail=false;await r.load([{id:'a',url:'bad.png'}]);assert.equal(r.inventory().images,1024);
});
test('memoryInventoryNoDoubleCount: owned raster categories counted once and release clears',async()=>{
  const r=new D2Resources({decode:async()=>({width:64,height:32,close(){}})});await r.load([{id:'a',url:'a.png'}]);r.track('stage',100,100,'backings');r.track('chunk',128,128,'ground');r.track('stage',100,100,'backings');assert.equal(r.inventory().totalBytes,8192+40000+65536);r.release('chunk');assert.equal(r.inventory().ground,0);r.dispose();assert.equal(r.inventory().totalBytes,0);
});
test('boundedForestCache and seededCompositionsStable: visual prep is bounded and reproducible',()=>{
  const {f}=setup({length:8}),r=new D2Resources(),a=new D2Forest(r,73),b=new D2Forest(r,73);a.prepare(f.arena,f.visuals);b.prepare(f.arena,f.visuals);assert.deepEqual(a.decor,b.decor);for(let i=0;i<70;i++)a.cacheChunk(i,0,()=>({width:128,height:128}));assert.ok(a.cache.size<=48);assert.ok(r.inventory().ground<=48*128*128*4);a.dispose();assert.equal(r.inventory().ground,0);
});
test('warm visible mobile ground does not evict and rebuild its own 32-chunk footprint',()=>{
  const f=new D2Forest(new D2Resources(),73);let creates=0;
  for(let frame=0;frame<2;frame++)for(let y=0;y<4;y++)for(let x=0;x<8;x++)f.cacheChunk(x,y,()=>{creates++;return {width:192,height:192};});
  assert.equal(creates,32);
});
test('colliderArtMatchesTopology and decorDoesNotMutateCollision: categories stay authoritative',()=>{
  const {f,state}=setup({length:30}),hash=stateHash(state),mask=f.arena.collisionCopy(),forest=new D2Forest(new D2Resources(),73);forest.prepare(f.arena,f.visuals);for(const p of forest.obstacles)assert.ok(f.arena.blocked(p.y*96+p.x));assert.deepEqual(f.arena.collisionCopy(),mask);assert.equal(stateHash(state),hash);assert.ok(forest.decor.every(p=>p.kind==='decor'));
});
function fakeRoot(){const node={disabled:false,hidden:false,textContent:'',getBoundingClientRect:()=>({width:800,height:450}),getContext:()=>({})};return {dataset:{},querySelector:()=>node,querySelectorAll:()=>[]};}
test('viewDoesNotWriteState: presentation toggles leave authoritative hash unchanged',()=>{
  const {f,state}=setup({length:250}),hash=stateHash(state),r=new D2Renderer(fakeRoot().querySelector(),f.arena.cells,new D2Resources());r.setView({lod:'small',grayscale:true,debug:true});r.setView({lod:'large',grayscale:false,debug:false});assert.equal(stateHash(state),hash);assert.equal(r.view.debug,false);
});
test('defaultRuntimeRendererUnchanged: factory injection is opt-in',()=>{
  const canvas=fakeRoot().querySelector();assert.ok(createTrainingRenderer(canvas,6144) instanceof DevRenderer);const sentinel={};assert.equal(createTrainingRenderer(canvas,6144,()=>sentinel),sentinel);
});
test('lifecycleOneOwner: repeated suspension cancels each owner once',()=>{
  const t=new Training(fakeRoot());let frames=0,timers=0;const old=globalThis.cancelAnimationFrame,oldTimer=globalThis.clearTimeout;globalThis.cancelAnimationFrame=()=>frames++;globalThis.clearTimeout=()=>timers++;
  try{t.raf=4;t.timer=7;t.stop();t.stop();assert.equal(frames,1);assert.equal(timers,1);assert.equal(t.summary().resources.raf,0);assert.equal(t.summary().resources.timers,0);}finally{globalThis.cancelAnimationFrame=old;globalThis.clearTimeout=oldTimer;}
});
test('loadBeforeCanvasReveal: decode gate wins over reopen race',async()=>{
  let finish;const r=new D2Resources({decode:()=>new Promise(resolve=>{finish=resolve;})});const review=new D2Review(fakeRoot(),{resources:r,manifest:[{id:'a',url:'one'}]});let activated=0;
  const a=review.prepare({},()=>activated++),b=review.prepare({},()=>activated++);assert.equal(review.ui,'loading');assert.equal(activated,0);finish({width:16,height:16});await Promise.all([a,b]);assert.equal(activated,1);
});
test('stopReleasesResources: scene ground/backings and final decoded owner released',()=>{
  const r=new D2Resources(),review=new D2Review(fakeRoot(),{resources:r});let disposed=0;review.renderer={dispose(){disposed++;r.release('stage');}};r.track('stage',800,450);review.stop();review.stop();assert.equal(disposed,1);assert.equal(r.inventory().backings,0);review.dispose();assert.equal(r.inventory().totalBytes,0);
});
test('organicContour: rounded vertices keep tip exact and control points inside corridor',()=>{
 const {f,snaps}=setup({shape:'S',length:30}),r=new D2Renderer(fakeRoot().querySelector(),f.arena.cells,new D2Resources());r.body.build(snaps,96,.5);const points=[];r.traceContour({moveTo:(x,y)=>points.push([x,y]),lineTo:(x,y)=>points.push([x,y]),quadraticCurveTo:(x,y,a,b)=>points.push([x,y],[a,b]),closePath(){}});assert.ok(points.length>8);for(const [x,y] of points)assert.ok(r.body.inCorridor(x,y));assert.ok(points.some(([x,y])=>Math.abs(x-r.body.tail.x)<1e-5&&Math.abs(y-r.body.tail.y)<1e-5));
});
test('contour includes both neck sides, no omitted terminal vertex',()=>{
 const {f,snaps}=setup({shape:'straight',length:8}),r=new D2Renderer(fakeRoot().querySelector(),f.arena.cells,new D2Resources());r.body.build(snaps,96,1);const vertices=[];r.traceContour({moveTo(){},lineTo(){},quadraticCurveTo:(x,y)=>vertices.push([x,y]),closePath(){}});assert.deepEqual(vertices.at(-1),[r.body.polygon[2],r.body.polygon[3]]);
});
test('long-body material budget retains head-side anchors, not only tail-side islands',()=>{
 const {f,snaps}=setup({shape:'parallel',length:1200}),g=new D2Geometry(f.arena.cells).build(snaps,96,1),m=new D2Material(73,f.arena.cells),out=[];m.capture(snaps);m.visibleAccents(g,{x0:0,y0:0,x1:96,y1:64},'large',out);assert.ok(out.some(v=>v.distance<20),'Head fragment lost all materials');
});
test('material capture consumes every simulation move even without render frames',()=>{
 const {f,state,snaps}=setup({shape:'straight',length:8,speed:20}),review=new D2Review(fakeRoot()),m=new D2Material(73,f.arena.cells);m.capture(snaps);review.state=state;review.arena=f.arena;review.rules=f.rules;review.snapshots=snaps;review.renderer={material:m};review.clock={pause(){}};
 for(let i=0;i<9;i++)review.tick();assert.equal(m.travel,3);
});
test('tight U fixture uses adjacent lanes with a one-cell bend',()=>{
 const f=createD2Fixture({shape:'U',length:30,direction:1});assert.equal(f.route[10]-f.route[9],96);assert.equal(f.route[11]-f.route[10],1);
});
test('timing fixture food stays outside automated cycle so measured length is exact',()=>{
 const f=createD2Fixture({shape:'parallel',length:1200,benchmark:true});assert.ok(!f.route.includes(f.stateOptions.food));assert.ok(!f.arena.blocked(f.stateOptions.food));
});
test('outline omits collinear commands, preserving every bend and taper vertex',()=>{
 const {f,snaps}=setup({shape:'parallel',length:1200}),r=new D2Renderer(fakeRoot().querySelector(),f.arena.cells,new D2Resources());r.body.build(snaps,96,.5);let commands=0;r.traceContour({moveTo(){},lineTo(){},quadraticCurveTo(){commands++;},closePath(){}});assert.ok(commands<150,`Redundant commands: ${commands}`);
});
