import test from 'node:test';
import assert from 'node:assert/strict';
import {master,activeTurn,atlasSample} from './turn-atlas.js';
import {makeTurnAtlas} from './turn-atlas-authoring.mjs';
import {tubePath,tubeSample} from './tube-path.js';
import {SnakeMotion} from './motion.js';
import {expand} from '../retro-v5/geometry.mjs';
import {contourWidths} from './turn-atlas-width-qa.mjs';

test('body-only atlas has no inscribed contour bulge above raster tolerance before head occlusion',()=>{
 const result=contourWidths();assert.equal(result.pass,true,JSON.stringify(result));
});

test('compiled native masks exactly match the one authored 16-phase master',()=>{
 const source=makeTurnAtlas();assert.equal(master.length,16);
 for(let n=0;n<16;n++)assert.deepEqual(master[n].pixels,source[n].pixels);
});

test('all 8 rotations/mirrors keep the exact rear 36px aperture and 2px underlap',()=>{
 for(const [dx,dy,px,py] of [[0,-1,1,0],[0,1,1,0],[0,-1,-1,0],[0,1,-1,0],[-1,0,0,-1],[1,0,0,-1],[-1,0,0,1],[1,0,0,1]]){
  const route=[{x:50+dx,y:50+dy},...Array.from({length:8},(_,i)=>({x:50-px*i,y:50-py*i}))];
  // Include states between phases, especially the former alpha .01 gap.
  for(const alpha of [.001,.01,...Array.from({length:15},(_,i)=>(i+1)/15)]){
   const start=1-alpha,f={route,start,end:start+7,alpha,head:{x:50+dx*alpha,y:50+dy*alpha,dx,dy}},path=tubePath(f),turn=activeTurn(f,path);
   assert.ok(turn);const h=f.head,hx=(h.x+.5)*68,hy=(h.y+.5)*68;
   for(const rear of [32.5,33.5,34.5,35.5])for(let v=-17.5;v<18;v++){
    const x=hx-dx*rear-dy*v,y=hy-dy*rear+dx*v;
    let current=null;for(const p of path){const q=tubeSample(p,x,y);if(q&&(!current||Math.abs(q.v)<Math.abs(current.v)))current=q;}
    const q=atlasSample(turn,x,y,current);
    assert.ok(q===undefined?current:q,`socket gap ${dx},${dy} alpha ${alpha} rear ${rear} cross ${v}`);
   }
  }
 }
});

test('straight and alpha-zero never activate the atlas; canonical material taps stay identical',()=>{
 for(const alpha of [0,.001,.25,.5,.99,1]){
  const start=1-alpha,route=Array.from({length:12},(_,i)=>({x:50-i,y:50}));
  const f={route,start,end:start+7,alpha,head:{x:49+alpha,y:50,dx:1,dy:0}};
  assert.equal(activeTurn(f,tubePath(f)),null);
 }
 const route=expand([[50,49],[50,50],[40,50]]).map(([x,y])=>({x,y}));
 for(let n=1;n<=15;n++){
  const alpha=n/15,start=1-alpha,f={route,start,end:start+7,alpha,head:{x:50,y:50-alpha,dx:0,dy:-1}},path=tubePath(f),turn=activeTurn(f,path);
  for(const p of path)for(const t of [.1,.5,.9]){
   let x,y;if(p.kind==='line'){x=p.a.x+(p.b.x-p.a.x)*t;y=p.a.y+(p.b.y-p.a.y)*t;}else{const a=p.angle+p.delta*t;x=p.cx+p.r*Math.cos(a);y=p.cy+p.r*Math.sin(a);}
   const current=tubeSample(p,x,y),q=atlasSample(turn,x,y,current);
   if(q){assert.equal(q.d,current.d);assert.equal(q.v,current.v);}
  }
 }
});

test('tight U / S, lengths 8/30/250, growth and mid-turn freeze do not reset the turn phase',()=>{
 for(const shape of [[[50,20],[50,21],[48,21],[48,20],[20,20]],[[50,20],[50,21],[48,21],[48,23],[20,23]]]){
  const points=expand(shape).map(([x,y])=>({x,y}));let y=points.at(-1).y;
  while(points.length<253){points.push({x:20,y:++y});for(let x=21;x<=47;x++)points.push({x,y});points.push({x:47,y:++y});for(let x=46;x>=20;x--)points.push({x,y});}
  for(const length of [8,30,250])for(const growth of [false,true]){
   const route=points.slice(0,length),old=growth?route.slice(1):points.slice(1,length+1);
   const state={body:Uint32Array.from(old,p=>p.y*96+p.x),headIndex:0,length:old.length,cadence:14,movePhase:0,status:'playing'},s={state,arena:{width:96,cells:9216},portal:{phase:'armed'},moves:100},m=new SnakeMotion(s);
   state.body=Uint32Array.from(route,p=>p.y*96+p.x);state.length=length;m.capture(s);
   for(const alpha of [.01,.2,.37,.7,.99]){
    state.movePhase=alpha*14;const f=m.frame(s),path=tubePath(f),turn=activeTurn(f,path),arcs=path.filter(p=>p.kind==='arc');
    assert.equal(turn.alpha,alpha);if(arcs[1])assert.ok(turn.cut<=arcs[1].d0,'atlas crosses second bend');
   }
   m.alpha=m.floor=0;state.movePhase=.37*14;m.freeze(s,0);const frozen=m.frame(s);
   state.movePhase=.8*14;assert.deepEqual(m.frame(s),frozen);
   state.movePhase=.37*14;m.resume();assert.deepEqual(m.frame(s),frozen);
  }
 }
});
