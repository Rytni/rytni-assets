import {CELL,BODY} from '../retro-v5/geometry.mjs';

// QA-only experiment. NOT an approved renderer: tight-U socket envelope
// still widens to 42px. Normal Training imports tube-path.js, not this file.

// Approved head-0-v0: center (34,34), rear x=0, opaque rows 16..51.
// x=2 gives two native pixels of hidden, full-BODY-width underlap.
export const HEAD_SOCKET = Object.freeze({offset:32,lead:6,anchor:2.5});

/** A clipped canonical polyline, then straight strips and quarter turns.
 * Distances stay in canonical cell units, including on a rounded bend.
 * A new leading cell is excluded at alpha zero: no future bend can change
 * the completed preceding bracket. Endpoint radii use the available path. */
export function tubePath(frame){
 const {route,start,end}=frame,limit=end+.5,points=[];
 const sample=d=>{const i=Math.min(route.length-2,Math.floor(d)),t=d-i,p=route[i],q=route[i+1];return {x:(p.x+.5+(q.x-p.x)*t)*CELL,y:(p.y+.5+(q.y-p.y)*t)*CELL,d};};
 points.push(sample(start));
 for(let i=Math.floor(start)+1;i<limit;i++)points.push(sample(i));
 points.push(sample(limit));
 const joins=points.map((p,i)=>{
  if(!i||i===points.length-1)return {entry:p,exit:p};
  const a=points[i-1],b=points[i+1],ax=Math.sign(a.x-p.x),ay=Math.sign(a.y-p.y),bx=Math.sign(b.x-p.x),by=Math.sign(b.y-p.y);
  if(ax===-bx&&ay===-by)return {entry:p,exit:p};
  const r=Math.min(CELL/2,Math.hypot(a.x-p.x,a.y-p.y),Math.hypot(b.x-p.x,b.y-p.y));
  const entry={x:p.x+ax*r,y:p.y+ay*r,d:p.d-r/CELL},exit={x:p.x+bx*r,y:p.y+by*r,d:p.d+r/CELL};
  const cx=p.x+(ax+bx)*r,cy=p.y+(ay+by)*r,angle=Math.atan2(entry.y-cy,entry.x-cx);let delta=Math.atan2(exit.y-cy,exit.x-cx)-angle;
  if(delta>Math.PI)delta-=2*Math.PI;if(delta<-Math.PI)delta+=2*Math.PI;
  return {entry,exit,arc:{kind:'arc',cx,cy,r,angle,delta,d0:entry.d,d1:exit.d}};
 });
 const primitives=[];
 for(let i=0;i<points.length-1;i++){
  const a=joins[i].exit,b=joins[i+1].entry;
  if(Math.hypot(a.x-b.x,a.y-b.y)>.00001)primitives.push({kind:'line',a,b,d0:a.d,d1:b.d});
  if(joins[i+1].arc)primitives.push(joins[i+1].arc);
 }
 return headNeck(primitives,frame);
}

function pathPoint(path,d){
 const p=path.find(p=>d<=p.d1+1e-10)||path.at(-1),t=Math.max(0,Math.min(1,(d-p.d0)/(p.d1-p.d0)));
 if(p.kind==='line')return {x:p.a.x+(p.b.x-p.a.x)*t,y:p.a.y+(p.b.y-p.a.y)*t,dx:(p.b.x-p.a.x)/(p.d1-p.d0),dy:(p.b.y-p.a.y)/(p.d1-p.d0)};
 const a=p.angle+p.delta*t,speed=p.r*p.delta/(p.d1-p.d0);
 return {x:p.cx+p.r*Math.cos(a),y:p.cy+p.r*Math.sin(a),dx:-Math.sin(a)*speed,dy:Math.cos(a)*speed};
}

/** Only repair bends reaching the rigid head's rear socket. A Hermite
 * displacement of the existing path is zero at its stable body anchor,
 * including its derivative. When the lead lies on an uncurved section the
 * correction is identically zero: accepted straight raster is untouched. */
function headNeck(path,frame){
 if(!frame.head)return path;
 const {head,start}=frame,{offset,lead,anchor}=HEAD_SOCKET,from=start+(offset+lead)/CELL,to=Math.min(start+anchor,frame.end-.5);
 if(to<=from)return path;
 const base=pathPoint(path,from),rear={x:-head.dx,y:-head.dy},hx=(head.x+.5)*CELL,hy=(head.y+.5)*CELL;
 const delta={x:hx+rear.x*(offset+lead)-base.x,y:hy+rear.y*(offset+lead)-base.y};
 // Parameterize the correction by geometric arclength, not canonical d.
 // The original quarter-turn maps a cell distance onto pi/2 radians; its
 // derivative magnitude differs from a strip, but its tangent does not.
 const ranges=path.filter(p=>p.d1>from&&p.d0<to).map(p=>{
  const d0=Math.max(from,p.d0),d1=Math.min(to,p.d1),length=(p.kind==='line'?Math.hypot(p.b.x-p.a.x,p.b.y-p.a.y):p.r*Math.abs(p.delta))*(d1-d0)/(p.d1-p.d0);
  return {p,d0,d1,length};
 }),span=ranges.reduce((s,r)=>s+r.length,0),speed=Math.hypot(base.dx,base.dy);
 const tension=1+Math.min(1,Math.hypot(delta.x,delta.y)/BODY);
 const derivative={x:(rear.x*tension-base.dx/speed)*span,y:(rear.y*tension-base.dy/speed)*span};
 if(Math.hypot(delta.x,delta.y)<1e-8&&Math.hypot(derivative.x,derivative.y)<1e-8)return path;
 const a={x:hx+rear.x*offset,y:hy+rear.y*offset},b={x:hx+rear.x*(offset+lead),y:hy+rear.y*(offset+lead)};
 const nodes=[];
 for(let i=0;i<=48;i++){
  const t=i/48;let remaining=t*span,r=ranges.at(-1);
  for(let k=0;k<ranges.length;k++){r=ranges[k];if(remaining<=r.length||k===ranges.length-1)break;remaining-=r.length;}
  const d=i===48?to:r.d0+(r.d1-r.d0)*Math.min(1,remaining/r.length),p=pathPoint([r.p],d),h00=(1-t)*(1-t)*(1+2*t),h10=t*(1-t)*(1-t);
  nodes.push({x:p.x+h00*delta.x+h10*derivative.x,y:p.y+h00*delta.y+h10*derivative.y,d});
 }
 // The sampled curve's boundary planes must use the analytic endpoint
 // tangents, not a secant cutting across the final subdivision. Pin only
 // the first/last short boundary spans to those tangents; no mask overlap.
 const first=nodes[0],second=nodes[1],last=nodes.at(-1),penultimate=nodes.at(-2),firstLength=Math.hypot(second.x-first.x,second.y-first.y),lastLength=Math.hypot(last.x-penultimate.x,last.y-penultimate.y),end=pathPoint(path,to),endSpeed=Math.hypot(end.dx,end.dy);
 second.x=first.x+rear.x*firstLength;second.y=first.y+rear.y*firstLength;
 penultimate.x=last.x-end.dx/endSpeed*lastLength;penultimate.y=last.y-end.dy/endSpeed*lastLength;
 const neck={kind:'neck',nodes,d0:from,d1:to,minX:Math.min(...nodes.map(p=>p.x)),maxX:Math.max(...nodes.map(p=>p.x)),minY:Math.min(...nodes.map(p=>p.y)),maxY:Math.max(...nodes.map(p=>p.y))};
 const rest=[];
 for(const p of path){
  if(p.d1<=to)continue;
  if(p.d0>=to){rest.push(p);continue;}
  const point=pathPoint([p],to),t=(to-p.d0)/(p.d1-p.d0);
  rest.push(p.kind==='line'?{...p,a:{x:point.x,y:point.y,d:to},d0:to}:{...p,angle:p.angle+p.delta*t,delta:p.delta*(1-t),d0:to});
 }
 return [{kind:'line',a,b,d0:start+offset/CELL,d1:from},neck,...rest];
}
export function tubeSample(p,x,y,out={d:0,v:0}){
 if(p.kind==='neck'){
  let best=BODY*BODY/4,at=0,along=0;
  for(let i=1;i<p.nodes.length;i++){
   const a=p.nodes[i-1],b=p.nodes[i];
   const bx=Math.max(Math.min(a.x,b.x)-x,0,x-Math.max(a.x,b.x)),by=Math.max(Math.min(a.y,b.y)-y,0,y-Math.max(a.y,b.y));
   if(bx*bx+by*by>=best)continue;
   const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/l2));
   const qx=x-a.x-dx*t,qy=y-a.y-dy*t,dist=qx*qx+qy*qy;
   if(dist<best){best=dist;at=i;along=t;}
  }
  if(!at)return null;
  const a=p.nodes[at-1],b=p.nodes[at],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy),projection=((x-a.x)*dx+(y-a.y)*dy)/(l*l);
  if((at===1&&projection<0)||(at===p.nodes.length-1&&projection>1))return null;
  out.d=a.d+(b.d-a.d)*along;out.v=((x-a.x)*-dy+(y-a.y)*dx)/l;return out;
 }
 if(p.kind==='line'){
  const dx=p.b.x-p.a.x,dy=p.b.y-p.a.y,l=Math.hypot(dx,dy),t=((x-p.a.x)*dx+(y-p.a.y)*dy)/(l*l);
  if(t<0||t>1)return null;
  const v=((x-p.a.x)*-dy+(y-p.a.y)*dx)/l;
  if(Math.abs(v)>=BODY/2)return null;out.d=p.d0+(p.d1-p.d0)*t;out.v=v;return out;
 }
 let angle=Math.atan2(y-p.cy,x-p.cx)-p.angle;
 if(angle>Math.PI)angle-=2*Math.PI;if(angle<-Math.PI)angle+=2*Math.PI;
 const t=angle/p.delta;if(t<0||t>1)return null;
 const v=(Math.hypot(x-p.cx,y-p.cy)-p.r)*(p.delta<0?1:-1);
 if(Math.abs(v)>=BODY/2)return null;out.d=p.d0+(p.d1-p.d0)*t;out.v=v;return out;
}
