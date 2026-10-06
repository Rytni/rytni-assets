import {makeSweep,CELL} from '../smooth-v4-proof/ribbon.js';
import {tunnelSweep} from '../gate-one/ribbon.js';

// Read-only V4 primitive adapter. d is cells BEHIND the shared visual head.
// Build once for a group of anchors; no clock, route-index ownership or history.
export function visualPath(frame){
 if(!frame.route||frame.start===undefined)return ()=>null;
 const sweep=frame.spans?tunnelSweep(frame):makeSweep(frame);
 return d=>{
  const distance=frame.start+d;
  if(d<0||distance>frame.end)return null;
  const p=sweep.parts.find(p=>distance>=p.d0-1e-9&&distance<=p.d1+1e-9&&p.d1>p.d0);
  if(!p)return null;
  const t=Math.max(0,Math.min(1,(distance-p.d0)/(p.d1-p.d0)));
  let x,y,dx,dy;
  if(p.kind==='line'){
   x=p.a.x+(p.b.x-p.a.x)*t;y=p.a.y+(p.b.y-p.a.y)*t;
   const length=Math.hypot(p.b.x-p.a.x,p.b.y-p.a.y);
   dx=(p.a.x-p.b.x)/length;dy=(p.a.y-p.b.y)/length;
  }else{
   const a=p.angle+p.delta*t,sign=Math.sign(p.delta);
   x=p.cx+Math.cos(a)*p.r;y=p.cy+Math.sin(a)*p.r;
   dx=Math.sin(a)*sign;dy=-Math.cos(a)*sign;
  }
  // A slot disappears into the tunnel, then emerges on the other span. Never
  // sweep an ember through the world-distance gap. Exact cut prefers exit side.
  const cuts=frame.spans?.slice(0,-1).map(s=>s.end)||[];
  const visibility=cuts.reduce((a,cut)=>Math.min(a,Math.abs(distance-cut)/.12),1);
  return {x:x/CELL-.5,y:y/CELL-.5,dx,dy,d:distance,visibility};
 };
}
export function sampleVisualPath(frame,d){return visualPath(frame)(d);}
