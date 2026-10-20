import {SnakeMotion} from '../forest-training/motion.js';
import {DX,DY} from '../simulation/rules.js';
import {bodyCells} from '../simulation/body.js';

const coordinate=(c,w)=>({x:c%w,y:Math.floor(c/w)});

/** Split canonical history at ZERO-distance portal edges. No new interpolation
 * clock: all spans, head and terminal use the accepted V2/V4 shared alpha. */
export function splitFrame(frame,session){
 const cuts=(session.portalEdges||[]).map(e=>({...e,index:session.moves-e.move})).filter(e=>e.index>=0&&e.index<frame.route.length-1).sort((a,b)=>a.index-b.index);
 if(!cuts.length)return frame;
 const spans=[];let offset=0,route=frame.route.slice();
 for(const e of cuts){
  const local=e.index-offset;
  spans.push({offset,route:route.slice(0,local+1),end:e.index});
  route=[coordinate(e.entry,session.arena.width),...route.slice(local+1)];offset=e.index;
 }
 spans.push({offset,route,end:frame.route.length-1});
 const point=d=>{
  // At the zero-distance edge choose the exit/newer side. On approach sample
  // the virtual entry cell, never an A→B chord or a diagonal shortcut.
  const span=spans.find(s=>d>=s.offset&&d<=s.end&&s.route.length>1)||spans.at(-1),q=d-span.offset;
  const i=Math.min(span.route.length-2,Math.max(0,Math.floor(q))),t=q-i,p=span.route[i],b=span.route[i+1];
  const edge=cuts.find(e=>Math.abs(e.index-d)<1e-9);
  if(edge){const p=coordinate(edge.exit,session.arena.width);return {...p,dx:DX[edge.outgoing],dy:DY[edge.outgoing]};}
  return {x:p.x+(b.x-p.x)*t,y:p.y+(b.y-p.y)*t,dx:p.x-b.x,dy:p.y-b.y};
 };
 return {...frame,spans,cuts,head:point(frame.start),tail:point(frame.end)};
}

export class TunnelMotion extends SnakeMotion {
 frame(session,fraction=0){return splitFrame(super.frame(session,fraction),session);}
}

export function snappedTunnelFrame(session,motion){
 const route=bodyCells(session.state).map(c=>coordinate(c,session.arena.width));route.push(...motion.retired);
 const d=session.state.direction,head={...route[0],dx:DX[d],dy:DY[d]};
 return splitFrame({route,start:0,end:session.state.length-1,alpha:1,head,tail:route[session.state.length-1],moves:session.moves,revision:motion.revision},session);
}
