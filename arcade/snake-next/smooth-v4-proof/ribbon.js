// Standalone visual proof. No simulation, input, game state or sprite ownership.
import {tubePath} from '../forest-training/tube-path.js';
import {variant} from '../retro-v5/material.mjs';
export const CELL=68,BODY=36,CAP=24,TAPER=.9*CELL;
// Approved V5.6 palette only; no Node-only offline painter is imported.
const palette={light:'fff9e3',lit:'faedce',cream:'f1dfba',ivory:'f6e6c7',warm:'e0c49a',underside:'c1a078',shade:'a28160',contact:'765a43',mossDark:'25452d',moss:'456a36',mossMid:'638844',mossLight:'8ea458',vein:'aabb72',capDark:'8e302b',cap:'d43f31',capLight:'f67b50',eye:'143b2a',pupil:'10271e'};
const rgb=c=>c.match(/../g).map(s=>parseInt(s,16));
const P=Object.fromEntries(Object.entries(palette).map(([k,v])=>[k,rgb(v)]));
const green=new Set(['mossDark','moss','mossMid','mossLight','vein'].map(k=>palette[k]));

export function samplePrimitive(p,x,y){
 if(p.kind==='line'){
  const dx=p.b.x-p.a.x,dy=p.b.y-p.a.y,l=Math.hypot(dx,dy),t=((x-p.a.x)*dx+(y-p.a.y)*dy)/(l*l);
  if(t<0||t>1)return null;
  return {d:p.d0+(p.d1-p.d0)*t,v:((x-p.a.x)*-dy+(y-p.a.y)*dx)/l};
 }
 let a=Math.atan2(y-p.cy,x-p.cx)-p.angle;
 if(a>Math.PI)a-=2*Math.PI;if(a<-Math.PI)a+=2*Math.PI;
 const t=a/p.delta;if(t<0||t>1)return null;
 return {d:p.d0+(p.d1-p.d0)*t,v:(Math.hypot(x-p.cx,y-p.cy)-p.r)*(p.delta<0?1:-1)};
}
export function makeSweep(frame){
 const body=tubePath(frame),h=frame.head,hx=(h.x+.5)*CELL,hy=(h.y+.5)*CELL;
 // The same centerline has a leading negative-distance domain. Its width
 // profile closes the silhouette; this is not an independently drawn head.
 const lead={kind:'line',a:{x:hx+h.dx*CAP,y:hy+h.dy*CAP},b:{x:hx,y:hy},d0:frame.start-CAP/CELL,d1:frame.start};
 return {parts:[lead,...body],hx,hy,frame,limit:frame.end+.5};
}
export function radiusAt(sweep,d){
 const rear=(d-sweep.frame.start)*CELL,remaining=(sweep.limit-d)*CELL;
 if(rear<0)return 18*Math.sqrt(Math.max(0,1-(rear/CAP)**2));
 if(remaining<TAPER){const t=Math.max(0,Math.min(1,remaining/TAPER));return 18*Math.sin(t*Math.PI/2);}
 return 18;
}
export function fieldAt(sweep,x,y){
 let best=null;
 for(const p of sweep.parts){const q=samplePrimitive(p,x,y);if(!q)continue;
  const radius=radiusAt(sweep,q.d);if(Math.abs(q.v)>=radius||radius<=0)continue;
  if(!best||Math.abs(q.v)/radius<Math.abs(best.v)/best.radius)best={...q,radius};
 }
 return best;
}
function material(q,sweep,sources){
 const s=Math.max(0,(q.d-sweep.frame.start)*CELL),v=-q.v,edge=q.radius-Math.abs(v),low=q.radius-v,high=q.radius+v;
 let color=low<2?P.contact:low<4?P.shade:low<8?P.underside:low<11?P.warm:high<3?P.light:high<6?P.lit:P.cream;
 // One continuous body-space sample field. Variant identities are a sparse
 // non-periodic material lookup, NEVER per-cell masks or geometry owners.
 const id=Math.floor(s/CELL),u=Math.floor(s)%CELL,row=Math.max(0,Math.min(67,Math.floor(34+v)));
 const k=(row*CELL+u)*4,source=sources[variant(id)],c=Array.from(source.slice(k,k+3)),hex=c.map(n=>n.toString(16).padStart(2,'0')).join('');
 if(edge>4&&Math.abs(v)<14&&(hex===palette.ivory||hex===palette.warm||hex===palette.underside||hex===palette.lit))color=c;
 if(green.has(hex)&&s>22)color=c;
 if(q.radius<7)color=low<2?P.warm:P.cream; // flesh, not a dark blade
 return color;
}
// Four exact cardinal overlay maps. All decorations are clipped to the mask.
// Their alpha NEVER adds silhouette pixels. No head sprite is sampled.
const overlay=[];
function mark(x,y,color){overlay.push({x,y,color:P[color]});}
for(const side of [-1,1]){
 for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(!((x===0||x===4)&&(y===0||y===4)))mark(6+x,side*10+y-2,'pupil');
 mark(7,side*10-1,'light');mark(9,side*10+1,'eye');
}
mark(18,-1,'pupil');mark(19,0,'pupil');mark(18,1,'pupil');
const cap=['....rrr......','..rrrrrrr....','.rrrrrrrrrr..','rrrrrrrrrrrr.','rrrrrrrrrrrrr','rrrrrrrrrrrrr','..ddddddddd..'];
for(let y=0;y<cap.length;y++)for(let x=0;x<cap[y].length;x++)if(cap[y][x]!=='.')mark(x-12,y-13,cap[y][x]==='d'?'capDark':'cap');
for(const [x,y]of [[-8,-11],[-3,-10],[-6,-8]])mark(x,y,'light');
for(const [x,y,c]of [[-7,-6,'warm'],[-6,-6,'light'],[-7,-5,'warm'],[-6,-5,'light'],[-10,-4,'mossDark'],[-9,-4,'moss'],[-8,-3,'mossMid'],[-9,-3,'mossLight'],[-11,-2,'moss'],[-10,-2,'mossMid']])mark(x,y,c);
export const overlays=Array.from({length:4},(_,turn)=>overlay.map(p=>{let {x,y}=p;for(let i=0;i<turn;i++)[x,y]=[-y,x];return {...p,x,y};}));

export function raster(frame,w,h,sources){
 const sweep=makeSweep(frame),data=new Uint8ClampedArray(w*h*4),mask=new Uint8Array(w*h);
 const fields=new Float32Array(w*h*2);fields.fill(NaN);
 // Spatial bins accelerate a SINGLE field evaluation, not separate surfaces.
 const bins=new Map();
 for(const p of sweep.parts){const a=p.kind==='line'?{x0:Math.min(p.a.x,p.b.x),x1:Math.max(p.a.x,p.b.x),y0:Math.min(p.a.y,p.b.y),y1:Math.max(p.a.y,p.b.y)}:{x0:p.cx-p.r,x1:p.cx+p.r,y0:p.cy-p.r,y1:p.cy+p.r};
  for(let by=Math.floor((a.y0-18)/68);by<=Math.floor((a.y1+18)/68);by++)for(let bx=Math.floor((a.x0-18)/68);bx<=Math.floor((a.x1+18)/68);bx++){const key=bx+','+by;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(p);}
 }
 for(const [key,parts]of bins){const [bx,by]=key.split(',').map(Number),local={...sweep,parts};
  for(let y=Math.max(0,by*68);y<Math.min(h,(by+1)*68);y++)for(let x=Math.max(0,bx*68);x<Math.min(w,(bx+1)*68);x++){
   const q=fieldAt(local,x+.5,y+.5);if(!q)continue;
   const n=y*w+x;mask[n]=1;fields[n*2]=q.d;fields[n*2+1]=q.v;
  }
 }
 // Geometry is complete BEFORE material. Exactly one RGBA owner per pixel.
 for(let n=0;n<mask.length;n++)if(mask[n]){const d=fields[n*2],v=fields[n*2+1],c=material({d,v,radius:radiusAt(sweep,d)},sweep,sources);data.set([...c,255],n*4);}
 const {dx,dy}=frame.head,dir=dx===1?0:dy===1?1:dx===-1?2:3;
 for(const p of overlays[dir]){const x=Math.floor(sweep.hx+p.x),y=Math.floor(sweep.hy+p.y),n=y*w+x;if(x>=0&&y>=0&&x<w&&y<h&&mask[n])data.set([...p.color,255],n*4);}
 return {data,mask,fields,sweep,w,h};
}
// Read-only integration hooks. Geometry, palette, overlays and proof raster
// remain unchanged; the live adapter can reuse these without duplicating art.
export {material};
