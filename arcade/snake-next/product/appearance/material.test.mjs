import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {RibbonRaster} from '../../forest-training/ribbon-raster.js';
import {TunnelRibbon,tunnelSweep} from '../../gate-one/ribbon.js';
import {raster,CELL} from '../../smooth-v4-proof/ribbon.js';
import {frameAt} from '../../smooth-v4-proof/fixtures.js';
import {EffectMaterial,EFFECT_KINDS} from './material.js';
import {TunnelSession} from '../../gate-one/session.js';

const {decode}=createRequire(import.meta.url)('../../retro-v5/raster.cjs');
const paths=Array.from({length:8},(_,i)=>new URL('../../../../grib/mushroom-snake-retro-v5/straight-0-v'+i+'.png',import.meta.url));
const sources=paths.map(path=>decode(readFileSync(path)).data);
const hashes=()=>paths.map(path=>createHash('sha256').update(readFileSync(path)).digest('hex'));
const session=(kinds,tick=90)=>({tick,state:{seed:18},startsKey:1,effects:kinds.map(kind=>({kind,started:30,ends:600}))});
const paint=(kinds,frame=frameAt('S',.5,14))=>{const m=new EffectMaterial();m.setSession(session(kinds));const live=new RibbonRaster(sources);live.painter=m.painter;return live.render(frame,18*CELL,10*CELL);};

test('absent material preserves every default V4 byte',()=>{
 const frame=frameAt('S',.5,14),expected=raster(frame,18*CELL,10*CELL,sources),actual=new RibbonRaster(sources).render(frame,expected.w,expected.h);
 assert.deepEqual(actual.data,expected.data);
 const none=paint([],frame);assert.deepEqual(none.data,expected.data);
});
test('nine skins and mixed effects preserve alpha and the original PNGs',()=>{
 const before=hashes(),frame=frameAt('S',.5,14),base=paint([],frame),pictures=[];
 for(const kinds of [...EFFECT_KINDS.map(k=>[k]),['harvest','focus'],['harvest','guard'],['focus','portalPrize'],['spores','guard'],['harvest','rush'],['harvest','weak'],['guard','brambles'],['focus','mist'],['harvest','guard','weak'],['spores','portalPrize','rush'],['focus','harvest','mist'],['guard','portalPrize','brambles']]){
  const actual=paint(kinds,frame);assert.deepEqual(actual.mask,base.mask);
  for(let k=3;k<base.data.length;k+=4)assert.equal(actual.data[k],base.data[k]);
  assert.notDeepEqual(actual.data,base.data,kinds.join('+'));
  pictures.push(createHash('sha256').update(actual.data).digest('hex'));
 }
 assert.equal(new Set(pictures).size,pictures.length);assert.deepEqual(hashes(),before);
});
test('head material changes approved decorative pixels while eyes and alpha stay exact',()=>{
 const m=new EffectMaterial();m.setSession(session(['weak']));
 for(const color of [[16,39,30],[20,59,42],[255,249,227]]){const a=new Uint8ClampedArray([...color,255]);m.painter.overlay(a,0,color);assert.deepEqual([...a],[...color,255]);}
 const cap=[212,63,49],a=new Uint8ClampedArray([...cap,255]);m.painter.overlay(a,0,cap);assert(a[2]>a[0]*.75);assert.equal(a[3],255);assert.notDeepEqual([...a],[...cap,255]);
});
test('canonical ticks freeze paused appearance and session reads change no hash input',()=>{
 const s=session(['harvest','spores','rush']),before=JSON.stringify(s),m=new EffectMaterial();m.setSession(s);const key=m.key,table=m.table.slice();
 for(let i=0;i<8;i++)m.setSession(s,{quality:i%2?'mobile':'desktop'});
 assert.deepEqual(m.table,table);assert.equal(m.key,key);assert.equal(JSON.stringify(s),before);
});
test('history rebasing retains each pattern at the same head-relative body distance',()=>{
 const m=new EffectMaterial();m.setSession(session(['spores','guard','brambles']));
 for(let n=0;n<200;n++){
  const a=new Uint8ClampedArray([241,223,186,255]),b=a.slice(),d=n/17;
  m.painter(a,0,d+1.25,2,18,1.25);m.painter(b,0,d+2.25,2,18,2.25);assert.deepEqual(b,a);
 }
});
test('material sampling does not write the canonical TunnelSession hash or replay',()=>{
 const s=new TunnelSession({seed:127,progression:{model:'fit-world-v2',density:0}});s.collect('harvest',-1);s.collect('guard',-1);s.collect('weak',-1);
 const before=s.hash(),replay=JSON.stringify(s.replay),m=new EffectMaterial();m.setSession(s);m.setSession(s);
 assert.equal(s.hash(),before);assert.equal(JSON.stringify(s.replay),replay);
});
test('250ms onset and expiry restore the original material without a snap',()=>{
 const s=session(['harvest'],30),m=new EffectMaterial(),live=new RibbonRaster(sources),f=frameAt('straight',.5,8);
 m.setSession(s);assert.equal(m.strengths.harvest,0);s.tick=38;m.setSession(s);assert(m.strengths.harvest>0&&m.strengths.harvest<1);
 s.tick=45;m.setSession(s);assert.equal(m.strengths.harvest,1);
 s.effects=[];s.tick=46;m.setSession(s);assert.equal(m.strengths.harvest,1);
 s.tick=54;m.setSession(s);assert(m.strengths.harvest>0&&m.strengths.harvest<1);
 s.tick=61;m.setSession(s);assert.equal(m.strengths.harvest,0);live.painter=m.painter;
 assert.deepEqual(live.render(f,18*CELL,10*CELL).data,raster(f,18*CELL,10*CELL,sources).data);
});
test('positive order is irrelevant, Guard wins overlapping pattern pixels, and negative palette remains legible',()=>{
 assert.deepEqual(paint(['guard','spores','weak']).data,paint(['spores','guard','weak']).data);
 const g=paint(['guard']).data,mix=paint(['guard','spores']).data,weak=paint(['guard','spores','weak']).data;
 assert.notDeepEqual(g,mix);assert.notDeepEqual(mix,weak);
});
test('portal discontinuities receive the same material without bridging alpha or changing spans',()=>{
 const frame=frameAt('S',.5,14);frame.spans=[{offset:0,end:6,route:frame.route.slice(0,8)},{offset:8,end:30,route:frame.route.slice(8)}];
 const before=JSON.stringify(frame),sweep=tunnelSweep(frame),base={raster:new RibbonRaster(sources),v4:{sources}},active={raster:new RibbonRaster(sources),v4:{sources}},m=new EffectMaterial();m.setSession(session(['guard','portalPrize','mist']));active.raster.painter=m.painter;
 const a=TunnelRibbon.prototype.render.call(base,sweep,18*CELL,10*CELL),b=TunnelRibbon.prototype.render.call(active,sweep,18*CELL,10*CELL);
 assert.deepEqual(b.mask,a.mask);assert.notDeepEqual(b.data,a.data);assert.equal(JSON.stringify(frame),before);
});
