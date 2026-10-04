import {CELL,CAP,TAPER,fieldAt,radiusAt,material,overlays} from '../smooth-v4-proof/ribbon.js';
import {tubePath} from '../forest-training/tube-path.js';
import {RibbonRaster} from '../forest-training/ribbon-raster.js';
import {variant} from '../retro-v5/material.mjs';

/** Unchanged V4 tube primitives, clipped to separate history spans. Global d
 * is retained for cap/taper and material. A portal is NOT a geometric join. */
export function tunnelSweep(frame){
 const h=frame.head,hx=(h.x+.5)*CELL,hy=(h.y+.5)*CELL,parts=[];
 parts.push({kind:'line',a:{x:hx+h.dx*CAP,y:hy+h.dy*CAP},b:{x:hx,y:hy},d0:frame.start-CAP/CELL,d1:frame.start});
 for(const span of frame.spans){
  const start=Math.max(frame.start,span.offset),limit=Math.min(frame.end+.5,span.end);
  if(limit-start<1e-8||span.route.length<2)continue;
  for(const p of tubePath({route:span.route,start:start-span.offset,end:limit-span.offset-.5}))parts.push({...p,d0:p.d0+span.offset,d1:p.d1+span.offset});
 }
 return {parts,hx,hy,frame,limit:frame.end+.5};
}
export function primitiveBounds(p){return p.kind==='line'?{x0:Math.min(p.a.x,p.b.x),x1:Math.max(p.a.x,p.b.x),y0:Math.min(p.a.y,p.b.y),y1:Math.max(p.a.y,p.b.y)}:{x0:p.cx-p.r,x1:p.cx+p.r,y0:p.cy-p.r,y1:p.cy+p.r};}

/** Only discontinuous frames use this raster adapter. Its radius/field/fill
 * are the original locked V4 functions/tables; ordinary frames delegate. */
export class TunnelRibbon {
 constructor(v4){this.v4=v4;this.canvas=document.createElement('canvas');this.context=this.canvas.getContext('2d');this.raster=new RibbonRaster(v4.sources);this.key=null;}
 draw(ctx,frame,cell,ox,oy,view){
  if(!frame.spans)return this.v4.draw(ctx,frame,cell,ox,oy,view);
  // Integer WORLD-art crop: camera movement is only a draw translation, never
  // a cache-invalidating geometry change. Field bins stay world-pixel aligned.
  const sweep=tunnelSweep(frame),bounds=sweep.parts.map(primitiveBounds);
  const x=Math.max(Math.floor(view.x),Math.floor((Math.min(...bounds.map(b=>b.x0))-18)/CELL)),y=Math.max(Math.floor(view.y),Math.floor((Math.min(...bounds.map(b=>b.y0))-18)/CELL));
  const right=Math.min(Math.ceil(view.x+view.cols),Math.ceil((Math.max(...bounds.map(b=>b.x1))+18)/CELL)),bottom=Math.min(Math.ceil(view.y+view.rows),Math.ceil((Math.max(...bounds.map(b=>b.y1))+18)/CELL));
  if(right<=x||bottom<=y)return;
  const w=(right-x)*CELL,h=(bottom-y)*CELL,key=JSON.stringify([frame,w,h,x,y]);
  if(key!==this.key){
   const result=this.render(sweep,w,h,x*CELL,y*CELL);
   this.canvas.width=w;this.canvas.height=h;this.context.putImageData(new ImageData(result.data,w,h),0,0);this.key=key;
  }
  ctx.imageSmoothingEnabled=false;ctx.drawImage(this.canvas,ox+(x-view.x)*cell,oy+(y-view.y)*cell,(right-x)*cell,(bottom-y)*cell);
 }
 render(sweep,w,h,ox=0,oy=0){
  if(!this.data||this.data.length!==w*h*4){this.data=new Uint8ClampedArray(w*h*4);this.mask=new Uint8Array(w*h);}
  const data=this.data,mask=this.mask,bins=new Map(),frame=sweep.frame,ids=[];data.fill(0);mask.fill(0);
  for(const p of sweep.parts){const b=primitiveBounds(p);
   for(let by=Math.floor((b.y0-oy-18)/CELL);by<=Math.floor((b.y1-oy+18)/CELL);by++)for(let bx=Math.floor((b.x0-ox-18)/CELL);bx<=Math.floor((b.x1-ox+18)/CELL);bx++){
    if(bx<0||by<0||bx*CELL>=w||by*CELL>=h)continue;
    const key=bx+','+by;if(!bins.has(key))bins.set(key,{bx,by,parts:[]});bins.get(key).parts.push(p);
   }
  }
  for(const {bx,by,parts} of bins.values()){
   const local={...sweep,parts};
   // Same bounded constant-radius cache as the locked live V4 raster. Portal
   // cuts, cap and taper remain exact field evaluations; bins own no geometry.
   const interior=parts.every(p=>p.d0>=frame.start&&p.d1<=sweep.limit-TAPER/CELL),ref=Math.floor(Math.min(...parts.map(p=>p.d0))),wx=ox+bx*CELL,wy=oy+by*CELL;
   const relative=interior?parts.map(p=>p.kind==='line'?{kind:p.kind,a:{x:p.a.x-wx,y:p.a.y-wy},b:{x:p.b.x-wx,y:p.b.y-wy},d0:p.d0-ref,d1:p.d1-ref}:{...p,cx:p.cx-wx,cy:p.cy-wy,d0:p.d0-ref,d1:p.d1-ref}):null;
   const key=interior?JSON.stringify(relative):null;let uv=key?this.raster.fields.get(key):null;
   if(key&&!uv){
    uv=new Float64Array(CELL*CELL*2);uv.fill(NaN);
    for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){const q=fieldAt(local,wx+x+.5,wy+y+.5);if(q){const n=(y*CELL+x)*2;uv[n]=q.d-ref;uv[n+1]=q.v;}}
    if(this.raster.fields.size>=128)this.raster.fields.delete(this.raster.fields.keys().next().value);this.raster.fields.set(key,uv);
   }
   for(let y=by*CELL;y<Math.min(h,(by+1)*CELL);y++)for(let x=bx*CELL;x<Math.min(w,(bx+1)*CELL);x++){
    const index=((y-by*CELL)*CELL+x-bx*CELL)*2,q=uv?(Number.isNaN(uv[index])?null:{d:uv[index]+ref,v:uv[index+1]}):fieldAt(local,x+ox+.5,y+oy+.5);if(!q)continue;
    const d=Math.fround(q.d),v=Math.fround(q.v),radius=radiusAt(sweep,d),s=Math.max(0,(d-frame.start)*CELL),n=y*w+x,k=n*4;mask[n]=1;
    if(radius===18&&s>23){
     const id=Math.floor(s/CELL),u=Math.floor(s)%CELL,z=v+18,i=Math.floor(z)*2+(Number.isInteger(z)?0:1);ids[id]??=variant(id);
     const table=this.raster.tables[ids[id]],t=(i*CELL+u)*4;data[k]=table[t];data[k+1]=table[t+1];data[k+2]=table[t+2];data[k+3]=255;
    }else data.set([...material({d,v,radius},sweep,this.v4.sources),255],k);
   }
  }
  const {dx,dy}=frame.head,dir=dx===1?0:dy===1?1:dx===-1?2:3;
  for(const p of overlays[dir]){const x=Math.floor(sweep.hx+p.x-ox),y=Math.floor(sweep.hy+p.y-oy),n=y*w+x;if(x>=0&&y>=0&&x<w&&y<h&&mask[n])data.set([...p.color,255],n*4);}
  return {data,mask,sweep,w,h};
 }
 release(){this.raster.release();this.canvas.width=this.canvas.height=1;this.data=this.mask=null;this.key=null;}
}
