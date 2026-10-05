import test from 'node:test';
import assert from 'node:assert/strict';
import {VFX_FLOORS,vfxSize,focusPositions,rushPositions,mistVariation,feedbackLanes} from './vfx-presentation.js';
import {vfxStressSession} from './vfx-stress.js';
import {TunnelSession} from '../gate-one/session.js';
test('conservative CSS floors independent of DPR; anchors remain read-only',()=>{
 for(const C of [9,12,16,22,34,68])for(const k of Object.keys(VFX_FLOORS))assert.ok(vfxSize(k,C)>=VFX_FLOORS[k]);
 for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])for(const C of [12,16,22,68])for(let t=0;t<120;t++){
  const h={x:100,y:100,dx,dy},p=focusPositions(h,C,t);assert.equal(p.length,3);assert.deepEqual(h,{x:100,y:100,dx,dy});
  assert.ok(p.every(p=>Math.abs((p.y-100)*dx-(p.x-100)*dy)>=14-1e-8));
  assert.deepEqual(p,focusPositions(h,C,t));
 }
});
test('Rush tailward six sparse points, perpendicular offsets, no portal chord',()=>{
 const route=Array.from({length:10},(_,i)=>({x:20-i,y:5})),p=rushPositions(route,16);assert.equal(p.length,6);
 assert.ok(p.every(p=>Math.abs(p.offsetY)>=12&&p.offsetX===0));assert.ok(p.every((q,i)=>!i||q.opacity<p[i-1].opacity));
 assert.ok(p[0].opacity>p.at(-1).opacity);assert.deepEqual(route,Array.from({length:10},(_,i)=>({x:20-i,y:5})));
 const broken=route.map(p=>({...p}));broken[2]={x:80,y:50};assert.ok(!rushPositions(broken,16).some(p=>p.x===80));
});
test('Mist unchanged-sheet variation: three scales, mirror, four phases, bounded alpha',()=>{
 const all=[];for(let side=0;side<4;side++)for(let layer=0;layer<2;layer++)for(let i=0;i<8;i++){
  const v=mistVariation(side,layer,i);all.push(v);assert.deepEqual(v,mistVariation(side,layer,i));assert.ok(v.opacity>=.8&&v.opacity<=1.1);assert.ok(Math.abs(v.offset)<=.24);
 }assert.equal(new Set(all.map(v=>v.scale)).size,3);assert.equal(new Set(all.map(v=>v.phase)).size,4);assert.equal(new Set(all.map(v=>v.mirror)).size,2);
});
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
test('feedback lanes: <=3, clipped, nonoverlap, no head glyph, corrupt one label',()=>{
 for(const C of [12,16,22,52])for(const [hx,hy]of [[20,20],[180,100],[350,200]]){
  const s={feedback:[{kind:'seed',cell:1,tick:96,amount:60,corrupt:true,maxReached:true},{kind:'seed',cell:1,tick:97,spore:true,amount:25},{kind:'seed',cell:1,tick:98,spore:true,amount:25}]},arena={x:0,y:0,w:380,h:220},head={x:hx,y:hy},at=()=>head,before=JSON.stringify(s);
  const p=feedbackLanes(s,100.4,at,C,arena,head);assert.ok(p.length<=3);assert.deepEqual(p,feedbackLanes(s,100.4,at,C,arena,head));assert.equal(JSON.stringify(s),before);
  for(let i=0;i<p.length;i++){const b=p[i].box;assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=380&&b.y+b.h<=220);for(let j=0;j<i;j++)assert.ok(!overlap(b,p[j].box));assert.ok(!overlap(b,{x:hx-17,y:hy-17,w:34,h:34}));}
  assert.ok(!p.some(p=>p.text==='−40%'));assert.ok(p.some(p=>p.text==='+50'));
 }
});
test('DEV stress is a facade; no canonical hash/events/effects/topology writes',()=>{
 const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}}),hash=s.hash(),snapshot=JSON.stringify({feedback:s.feedback,effects:s.effects,warnings:s.director.warnings,spores:s.spores});
 assert.equal(vfxStressSession(s,null),s);
 for(let tick=0;tick<200;tick++){s.tick=tick;const h=s.hash(),f=vfxStressSession(s,0);assert.notEqual(f,s);assert.equal(s.hash(),h);assert.deepEqual(f.effects.map(e=>e.kind),['focus','guard','rush']);assert.deepEqual(f.feedback,vfxStressSession(s,0).feedback);}
 s.tick=0;assert.equal(s.hash(),hash);assert.equal(JSON.stringify({feedback:s.feedback,effects:s.effects,warnings:s.director.warnings,spores:s.spores}),snapshot);
});
