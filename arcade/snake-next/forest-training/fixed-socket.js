import {CELL,BODY} from '../retro-v5/geometry.mjs';
import {tubePath as approvedPath,tubeSample as approvedSample} from './tube-path.js';

// Isolated DEV candidate. The authoritative route, head and tail are unchanged.
// Approved head columns 0..5 expose rows 16..51: x=2 is a 32px socket,
// leaving exactly two opaque native columns of hidden underlap.
export const SOCKET=Object.freeze({offset:32,underlap:2,radius:BODY/2});

export function pointAt(p,d){
 const t=Math.max(0,Math.min(1,(d-p.d0)/(p.d1-p.d0)));
 if(p.kind==='line'){
  const dx=p.b.x-p.a.x,dy=p.b.y-p.a.y,l=Math.hypot(dx,dy);
  return {x:p.a.x+dx*t,y:p.a.y+dy*t,dx:dx/l,dy:dy/l};
 }
 const a=p.angle+p.delta*t,s=Math.sign(p.delta);
 return {x:p.cx+p.r*Math.cos(a),y:p.cy+p.r*Math.sin(a),dx:-Math.sin(a)*s,dy:Math.cos(a)*s};
}

/** Rejected isolated experiment, not the accepted V2 renderer. Replace,
 * never overlay: analytic circular elbows use bounded distance sampling.
 * Join-plane ownership excludes the old proximal tube. The socket is fixed
 * width, but the temporal silhouette and one oblique section still FAIL. */
function compactBridge(a,forward,b,tangent,r){
 const tau=2*Math.PI,wrap=x=>(x%tau+tau)%tau,candidates=[];
 for(const s of [-1,1])for(const t of [-1,1]){
  const ca={x:a.x-forward.y*r*s,y:a.y+forward.x*r*s};
  const cb={x:b.x-tangent.y*r*t,y:b.y+tangent.x*r*t};
  const vx=cb.x-ca.x,vy=cb.y-ca.y,l=Math.hypot(vx,vy),rhs=(t-s)*r/l;
  if(Math.abs(rhs)>1)continue;
  const phi=Math.atan2(vy,vx),asin=Math.asin(rhs);
  for(const theta of [phi-asin,phi-Math.PI+asin]){
   const nx=-Math.sin(theta),ny=Math.cos(theta);
   const p={x:ca.x-s*r*nx,y:ca.y-s*r*ny},q={x:cb.x-t*r*nx,y:cb.y-t*r*ny};
   const line=(q.x-p.x)*Math.cos(theta)+(q.y-p.y)*Math.sin(theta);
   if(line<-1e-8)continue;
   const aa=Math.atan2(a.y-ca.y,a.x-ca.x),pa=Math.atan2(p.y-ca.y,p.x-ca.x);
   const qa=Math.atan2(q.y-cb.y,q.x-cb.x),ba=Math.atan2(b.y-cb.y,b.x-cb.x);
   const da=s*wrap((pa-aa)*s),db=t*wrap((ba-qa)*t);
   if(Math.abs(da)>Math.PI+1e-8||Math.abs(db)>Math.PI+1e-8)continue;
   const parts=[];
   if(Math.abs(da)>1e-8)parts.push({kind:'arc',cx:ca.x,cy:ca.y,r,angle:aa,delta:da,length:Math.abs(da)*r});
   if(line>1e-8)parts.push({kind:'line',a:p,b:q,length:line});
   if(Math.abs(db)>1e-8)parts.push({kind:'arc',cx:cb.x,cy:cb.y,r,angle:qa,delta:db,length:Math.abs(db)*r});
   candidates.push({parts,length:parts.reduce((sum,p)=>sum+p.length,0)});
  }
 }
 return candidates.sort((a,b)=>a.length-b.length)[0]?.parts;
}

export function fixedPath(frame){
 const path=approvedPath(frame),{head,start}=frame;
 if(!head)return path;
 const rear={x:-head.dx,y:-head.dy},hx=(head.x+.5)*CELL,hy=(head.y+.5)*CELL;
 const socket={x:hx+rear.x*32,y:hy+rear.y*32,d:start+32/CELL};
 // Preserve accepted straights exactly, including straight bracket endpoints.
 const first=path[0];
 if(first.kind==='line'&&first.d1>=start+32/CELL)return path;
 // Use a straight body anchor beyond the active first turn. Its endpoint
 // and tangent are taken from V2, not guessed from the queued direction.
 const target=start+(32+.8*CELL)/CELL;
 // Reserve a full-width bend envelope before the stable anchor. Choosing
 // an anchor by canonical distance alone can put it inside the active U.
 let stable,joinD,join;
 for(const p of path){
  if(p.kind!=='line'||p.d1<target)continue;
  for(let d=Math.max(target,p.d0)+4/CELL;d<=p.d1+1e-9;d+=4/CELL){
   const q=pointAt(p,d);
   if(Math.hypot(q.x-socket.x,q.y-socket.y)<80)continue;
   stable=p;joinD=d;join=q;break;
  }
  if(stable)break;
 }
 if(!stable)return path;
 const lead={x:hx+rear.x*42,y:hy+rear.y*42};
 const bridge=compactBridge(lead,rear,join,{x:join.dx,y:join.dy},20);
 if(!bridge)return path;
 const parts=[{kind:'line',a:socket,b:lead,length:10},...bridge];
 const total=parts.reduce((sum,p)=>sum+p.length,0);let length=0;
 for(const p of parts){p.d0=socket.d+(joinD-socket.d)*length/total;length+=p.length;p.d1=socket.d+(joinD-socket.d)*length/total;}
 const nodes=parts.flatMap(p=>Array.from({length:p.kind==='arc'?17:2},(_,i)=>({...pointAt(p,p.d0+(p.d1-p.d0)*i/(p.kind==='arc'?16:1)),d:p.d0+(p.d1-p.d0)*i/(p.kind==='arc'?16:1)})));
 const clip={hx,hy,dx:head.dx,dy:head.dy,jx:join.x,jy:join.y,tx:join.dx,ty:join.dy};
 const neck={kind:'fixed-neck',nodes,parts,d0:socket.d,d1:joinD,clip,
  minX:Math.min(...nodes.map(p=>p.x)),maxX:Math.max(...nodes.map(p=>p.x)),
  minY:Math.min(...nodes.map(p=>p.y)),maxY:Math.max(...nodes.map(p=>p.y))};
 const rest=[];
 for(const p of path){
  if(p.d1<=joinD)continue;
  if(p.d0>=joinD){rest.push({...p,clip:{...clip,noPlane:true}});continue;}
  const at=pointAt(p,joinD),t=(joinD-p.d0)/(p.d1-p.d0);
  rest.push(p.kind==='line'?{...p,a:{x:at.x,y:at.y,d:joinD},d0:joinD,clip}:
   {...p,angle:p.angle+p.delta*t,delta:p.delta*(1-t),d0:joinD,clip});
 }
 return [neck,...rest];
}

export function fixedSample(p,x,y,out={d:0,v:0}){
 const c=p.clip;
 if(c){
  const rear=-(x-c.hx)*c.dx-(y-c.hy)*c.dy;
  const side=-(x-c.hx)*c.dy+(y-c.hy)*c.dx;
  // Exclusive socket envelope. It applies to neck AND retained body, so a
  // neighbouring tight-U branch cannot union extra pixels into the socket.
  if(rear>=32&&rear<38&&Math.abs(side)>=BODY/2&&Math.abs(side)<30)return null;
  const plane=(x-c.jx)*c.tx+(y-c.jy)*c.ty;
  if(!c.noPlane&&(p.kind==='fixed-neck' ? plane>=0 : plane<0))return null;
 }
 if(p.kind!=='fixed-neck')return approvedSample(p,x,y,out);
 let d=NaN,v=Infinity;const sample={d:0,v:0};
 for(const part of p.parts){const q=approvedSample(part,x,y,sample);if(q&&Math.abs(q.v)<Math.abs(v)){d=q.d;v=q.v;}}
 if(Number.isNaN(d))return null;out.d=d;out.v=v;return out;
}

export function localPrimitive(p,x,y,ref){
 const shift=q=>({...q,x:q.x-x,y:q.y-y,d:q.d-ref});
 const clip=p.clip?{...p.clip,hx:p.clip.hx-x,hy:p.clip.hy-y,jx:p.clip.jx-x,jy:p.clip.jy-y}:undefined;
 if(p.kind==='fixed-neck')return {...p,nodes:p.nodes.map(shift),parts:p.parts.map(q=>localPrimitive(q,x,y,ref)),d0:p.d0-ref,d1:p.d1-ref,clip};
 return p.kind==='line'?{...p,a:shift(p.a),b:shift(p.b),d0:p.d0-ref,d1:p.d1-ref,clip}:
  {...p,cx:p.cx-x,cy:p.cy-y,d0:p.d0-ref,d1:p.d1-ref,clip};
}
