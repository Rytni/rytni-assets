import test from 'node:test';
import assert from 'node:assert/strict';
import {tubePath,tubeSample} from './tube-path.js';
import {expand,CELL} from '../retro-v5/geometry.mjs';

test('no future corner or route-index ownership at movement bracket boundary',()=>{
 for(const points of [[[9,2],[2,2]],[[7,2],[7,3],[2,3]],[[9,2],[6,2],[6,4],[3,4]]]){
  const route=expand(points).map(([x,y])=>({x,y})),t=route.at(-1),p=route.at(-2),retired={x:2*t.x-p.x,y:2*t.y-p.y};
  const before={route:[...route,retired,{x:2*retired.x-t.x,y:2*retired.y-t.y}],start:0,end:route.length-1};
  for(const turn of [false,true]){
   const a=route[0],b=route[1],lead=turn?{x:a.x+(a.y-b.y),y:a.y-(a.x-b.x)}:{x:2*a.x-b.x,y:2*a.y-b.y};
   const after={route:[lead,...before.route],start:1,end:route.length};
   const normalize=(path,start)=>path.map(p=>({...p,d0:p.d0-start,d1:p.d1-start,...(p.kind==='line'?{a:{...p.a,d:p.a.d-start},b:{...p.b,d:p.b.d-start}}:{})}));
   assert.deepEqual(normalize(tubePath(before),0),normalize(tubePath(after),1));
  }
 }
});
test('strip and quarter-turn share distance coordinates; clipped endpoints are continuous',()=>{
 const route=expand([[7,1],[4,1],[4,3],[1,3]]).map(([x,y])=>({x,y}));
 for(const alpha of [0,.05,.1,.2,.5,.8,.9,.95,1]){
  const path=tubePath({route,start:1-alpha,end:route.length-2-alpha});
  for(let i=1;i<path.length;i++)assert.ok(Math.abs(path[i].d0-path[i-1].d1)<1e-12);
  for(const p of path){
   const q=p.kind==='line'?{x:(p.a.x+p.b.x)/2,y:(p.a.y+p.b.y)/2}:{x:p.cx+p.r*Math.cos(p.angle+p.delta/2),y:p.cy+p.r*Math.sin(p.angle+p.delta/2)};
   const uv=tubeSample(p,q.x,q.y);assert.ok(uv);assert.ok(Math.abs(uv.v)<1e-10);assert.ok(Math.abs(uv.d-(p.d0+p.d1)/2)<1e-10);
  }
 }
 assert.equal(CELL,68);
});
test('head-facing material normal stays coherent with the rigid face in all directions',()=>{
 for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
  const route=Array.from({length:5},(_,i)=>({x:-dx*i,y:-dy*i})),p=tubePath({route,start:0,end:3})[0];
  for(const offset of [-12,-5,5,12]){
   const x=CELL/2-dx*CELL*.75-dy*offset,y=CELL/2-dy*CELL*.75+dx*offset,q=tubeSample(p,x,y);
   assert.ok(q);assert.ok(Math.abs(-q.v-offset)<1e-10);
  }
 }
});
