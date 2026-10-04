import test from 'node:test';
import assert from 'node:assert/strict';
import {BODY,CELL,DIRS,head as mask,expand} from '../retro-v5/geometry.mjs';
import {tubePath,tubeSample,HEAD_SOCKET} from './socket-prototype.js';

const frame=(route,alpha,length=8)=>{
 const start=1-alpha,i=Math.floor(start),a=route[i],b=route[i+1],t=start-i;
 return {route,start,end:start+length-1,alpha,head:{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,dx:a.x-b.x,dy:a.y-b.y}};
};
test('measured locked head socket is 36px, with 2px hidden underlap; no mask changes',()=>{
 assert.equal(CELL,68);assert.equal(BODY,36);assert.equal(HEAD_SOCKET.offset,32);
 for(let x=0;x<6;x++)assert.equal(mask.filter((v,i)=>v&&i%CELL===x).length,BODY);
 for(let y=16;y<52;y++)assert.equal(mask[y*CELL+2],1);
});
test('all eight turns expose a full 36px rear attachment over the entire interval',()=>{
 for(const [dx,dy]of DIRS)for(const [px,py]of DIRS){
  if(dx*px+dy*py!==0)continue;
  const route=[{x:dx,y:dy},...Array.from({length:252},(_,i)=>({x:-px*i,y:-py*i}))];
  for(const length of [8,30,250])for(let n=0;n<=100;n++){
   const f=frame(route,n/100,length),path=tubePath(f),h=f.head,cx=(h.x+.5)*CELL,cy=(h.y+.5)*CELL;
   for(const rear of [32.5,33.5,34.5,35.5,36.5,37.5])for(let v=-17.5;v<18;v++){
    const x=cx-h.dx*rear-h.dy*v,y=cy-h.dy*rear+h.dx*v;
    assert.ok(path.some(p=>tubeSample(p,x,y)),`missing socket: alpha ${n/100}, ${dx},${dy}, rear ${rear}, v ${v}`);
   }
   const lead=path.find(p=>p.kind==='neck');if(!lead)continue;
   const nodes=lead.nodes,a=nodes[0],b=nodes[1],z=nodes.at(-1),y=nodes.at(-2),l=Math.hypot(b.x-a.x,b.y-a.y);
   assert.equal(z.d,lead.d1,'floating-point residue must never wrap the final node to the range start');
   for(let i=1;i<nodes.length;i++)assert.ok(nodes[i].d>nodes[i-1].d,'material distance must be monotonic');
   assert.ok(((b.x-a.x)*-h.dx+(b.y-a.y)*-h.dy)/l>.99,'lead tangent must be rearward');
   assert.equal(lead.d1,f.start+HEAD_SOCKET.anchor);assert.ok(Math.hypot(z.x-y.x,z.y-y.y)>0);
   const rawAtAnchor=tubePath({...f,head:undefined}).map(p=>tubeSample(p,z.x,z.y)).filter(Boolean);
   assert.ok(rawAtAnchor.some(q=>Math.abs(q.d-z.d)<1e-10&&Math.abs(q.v)<1e-10),'anchor must touch the untouched tube centerline');
   // No source-material or geometric modification past the stable anchor.
   const raw=tubePath({...f,head:undefined}),normal=tubePath(f);
   for(let k=0;k<10;k++){
    const p=raw.at(-1),t=(k+.5)/10;if(p.kind!=='line')continue;
    const x=p.a.x+(p.b.x-p.a.x)*t,y=p.a.y+(p.b.y-p.a.y)*t;
    assert.deepEqual(normal.map(p=>tubeSample(p,x,y)).filter(Boolean),raw.map(p=>tubeSample(p,x,y)).filter(Boolean));
   }
  }
 }
});
test('accepted straight path is byte-identical with or without socket handling',()=>{
 for(const [dx,dy]of DIRS)for(let n=0;n<=100;n++){
  const route=Array.from({length:32},(_,i)=>({x:-dx*i,y:-dy*i})),f=frame(route,n/100,30);
  assert.deepEqual(tubePath(f),tubePath({...f,head:undefined}));
 }
});
test('U/S and two consecutive turns retain the same material coordinates at bracket boundaries',()=>{
 for(const points of [[[7,2],[7,3],[4,3],[4,2],[2,2]],[[7,2],[7,3],[4,3],[4,5],[1,5]]]){
  const route=expand(points).map(([x,y])=>({x,y}));
  const before=frame(route,1,8),a=route[0],b=route[1],next={x:a.x+a.y-b.y,y:a.y-(a.x-b.x)},after=frame([next,...route],0,8);
  const first=tubePath(before),second=tubePath(after);
  for(let y=0;y<600;y+=3)for(let x=0;x<600;x+=3){
   const uv=path=>path.map(p=>tubeSample(p,x+.5,y+.5)).filter(Boolean).sort((a,b)=>Math.abs(a.v)-Math.abs(b.v))[0],p=uv(first),q=uv(second);
   assert.equal(!!p,!!q);if(!p)continue;assert.ok(Math.abs((p.d-before.start)-(q.d-after.start))<1e-10);assert.ok(Math.abs(p.v-q.v)<1e-10);
  }
 }
});
