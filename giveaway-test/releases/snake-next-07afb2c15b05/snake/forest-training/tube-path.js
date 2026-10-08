import {CELL,BODY} from '../retro-v5/geometry.mjs';

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
 return primitives;
}
export function tubeSample(p,x,y,out={d:0,v:0}){
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
