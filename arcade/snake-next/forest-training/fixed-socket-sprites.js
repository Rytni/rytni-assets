import {CELL} from '../retro-v5/geometry.mjs';
import {variant} from '../retro-v5/material.mjs';
import {fixedPath as tubePath,fixedSample as tubeSample,localPrimitive} from './fixed-socket.js';

/** Continuous strip rasterizer. Spatial bins are acceleration only: no bin
 * owns a neck/corner/terminal sprite or chooses a material by route index. */
export class FixedSocketSprites {
 constructor(art){
  this.art=art;this.sources=new Map();this.materials=[];this.uvCache=new Map();this.tile=document.createElement('canvas');this.tile.width=this.tile.height=CELL;
  this.context=this.tile.getContext('2d');this.pixels=this.context.createImageData(CELL,CELL);this.uvScratch=new Float64Array(CELL*CELL*2);
  this.frameCanvas=document.createElement('canvas');this.frameContext=this.frameCanvas.getContext('2d');this.framePixels=null;
  for(const key of ['head-0-v0',...Array.from({length:8},(_,i)=>'straight-0-v'+i),'terminal-0-v0'])this.source(key);
 }
 source(key){
  if(!this.sources.has(key)){const c=document.createElement('canvas');c.width=c.height=CELL;const x=c.getContext('2d');x.drawImage(this.art.images.get(key),0,0);this.sources.set(key,x.getImageData(0,0,CELL,CELL).data);}return this.sources.get(key);
 }
 draw(ctx,frame,cell,ox,oy,view={x:0,y:0},clip=null){
  // Inverse-sample only resolvable backing pixels. Approved sources and UVs
  // remain 68px-native; nearest-neighbour source reads preserve their art.
  const size=Math.min(CELL,Math.max(1,Math.round(cell*(ctx.getTransform?.().a||1)))),count=size*size;
  if(this.tile.width!==size||!this.pixelRows){this.tile.width=this.tile.height=size;this.pixels=this.context.createImageData(size,size);this.uvScratch=new Float64Array(count*2);this.pixelRows=Array.from({length:size},(_,y)=>this.pixels.data.subarray(y*size*4,(y+1)*size*4));}
  const {start,end}=frame,head=this.source('head-0-v0'),tail=this.source('terminal-0-v0'),primitives=tubePath(frame),bins=new Map();
  // Stable material identities are resolved once, not via variant() inside
  // the pixel loop (its local-minimum test allocates a temporary array).
  while(this.materials.length<=frame.route.length){const id=this.materials.length;this.materials.push(this.source('straight-0-v'+variant(id)));}
  function bin(x,y){const key=x+','+y;if(!bins.has(key))bins.set(key,{x,y,primitives:[]});return bins.get(key);}
  for(const p of primitives){
   const minX=p.kind==='fixed-neck'?p.minX:p.kind==='line'?Math.min(p.a.x,p.b.x):p.cx-p.r,maxX=p.kind==='fixed-neck'?p.maxX:p.kind==='line'?Math.max(p.a.x,p.b.x):p.cx+p.r;
   const minY=p.kind==='fixed-neck'?p.minY:p.kind==='line'?Math.min(p.a.y,p.b.y):p.cy-p.r,maxY=p.kind==='fixed-neck'?p.maxY:p.kind==='line'?Math.max(p.a.y,p.b.y):p.cy+p.r;
   for(let y=Math.floor((minY-18)/CELL);y<=Math.floor((maxY+18)/CELL);y++)for(let x=Math.floor((minX-18)/CELL);x<=Math.floor((maxX+18)/CELL);x++)bin(x,y).primitives.push(p);
  }
  const hx=(frame.head.x+.5)*CELL,hy=(frame.head.y+.5)*CELL;
  for(let y=Math.floor((hy-34)/CELL);y<=Math.floor((hy+34)/CELL);y++)for(let x=Math.floor((hx-34)/CELL);x<=Math.floor((hx+34)/CELL);x++)bin(x,y);
  const scale=ctx.getTransform?.().a||1,extent=[...bins.values()],box=clip||{x:0,y:0,w:ctx.canvas?.width/scale||Math.max(...extent.map(b=>Math.round(ox+(b.x-view.x+1)*cell))),h:ctx.canvas?.height/scale||Math.max(...extent.map(b=>Math.round(oy+(b.y-view.y+1)*cell)))};
  const fx=Math.floor(box.x*scale),fy=Math.floor(box.y*scale),fw=Math.max(1,Math.ceil((box.x+box.w)*scale)-fx),fh=Math.max(1,Math.ceil((box.y+box.h)*scale)-fy);
  if(this.frameCanvas.width!==fw||this.frameCanvas.height!==fh||!this.framePixels){this.frameCanvas.width=fw;this.frameCanvas.height=fh;this.framePixels=this.frameContext.createImageData(fw,fh);}
  const output=this.framePixels.data;output.fill(0);
  for(const b of bins.values()){
   const left=Math.round(ox+(b.x-view.x)*cell),top=Math.round(oy+(b.y-view.y)*cell),right=Math.round(ox+(b.x-view.x+1)*cell),bottom=Math.round(oy+(b.y-view.y+1)*cell);
   if(clip&&(right<clip.x||left>clip.x+clip.w||bottom<clip.y||top>clip.y+clip.h))continue;
   // Cache inverse geometry, not a rendered texture. Most straight/bend bins
   // are unchanged while their material phase travels each RAF. Bounded LRU
   // also covers endpoint geometry; no cache key contains a route index.
   const ref=b.primitives.length?Math.floor(Math.min(...b.primitives.map(p=>p.d0))):0;
   const local=b.primitives.map(p=>localPrimitive(p,b.x*CELL,b.y*CELL,ref));
   const key=size+':'+JSON.stringify(local,(_k,v)=>typeof v==='number'?Math.round(v*1e7)/1e7:v);
   const stable=local.every(p=>!p.clip&&[p.d0,p.d1].every(d=>Math.abs(d*2-Math.round(d*2))<1e-9));
   let uv=stable?this.uvCache.get(key):null;
   if(!uv){uv=stable?new Float64Array(count*2):this.uvScratch;uv.fill(NaN);const sample={d:0,v:0};for(let n=0;n<count;n++){let bestD=NaN,bestV=Infinity;for(const p of local){const q=tubeSample(p,(n%size+.5)*CELL/size,(Math.floor(n/size)+.5)*CELL/size,sample);if(q&&Math.abs(q.v)<Math.abs(bestV)){bestD=q.d;bestV=q.v;}}uv[n*2]=bestD;uv[n*2+1]=bestV;}if(stable){if(this.uvCache.size>=128)this.uvCache.delete(this.uvCache.keys().next().value);this.uvCache.set(key,uv);}}
   else {this.uvCache.delete(key);this.uvCache.set(key,uv);}
   const pixels=this.pixels.data;pixels.fill(0);
   const hasHead=Math.abs((b.x+.5)*CELL-hx)<CELL&&Math.abs((b.y+.5)*CELL-hy)<CELL;
   for(let n=0;n<count;n++){
    const x=b.x*CELL+(n%size+.5)*CELL/size,y=b.y*CELL+(Math.floor(n/size)+.5)*CELL/size;
    let source,index=-1;
    if(!Number.isNaN(uv[n*2])){
     const d=ref+uv[n*2],v=uv[n*2+1];
     // The polyline points head→tail; approved material faces toward the
     // head. Use its forward normal consistently, including the terminal.
     if(d>end-.5){source=tail;const u=Math.floor((d-end+.5)*CELL),row=Math.floor(34-v);if(u>=0&&u<CELL&&row>=0&&row<CELL)index=(row*CELL+u)*4;}
     else {const distance=Math.max(0,(d-start)*CELL),identity=Math.floor(distance/CELL),u=Math.floor(distance-identity*CELL),row=Math.floor(34-v);source=this.materials[identity];index=(row*CELL+u)*4;}
    }
    // Rigid approved head; the tube and face are one disjoint output raster.
    if(hasHead){const px=x-hx,py=y-hy,u=Math.floor(34+px*frame.head.dx+py*frame.head.dy),row=Math.floor(34-px*frame.head.dy+py*frame.head.dx),h=u>=0&&u<CELL&&row>=0&&row<CELL?(row*CELL+u)*4:-1;if(h>=0&&head[h+3]){source=head;index=h;}}
    const k=n*4;if(index>=0)for(let c=0;c<4;c++)pixels[k+c]=source[index+c];
   }
   // Compose bins in CPU memory. Uploading the same tiny canvas for every bin
   // serializes the GPU pipeline and made a 250-cell frame needlessly slow.
   const bx=Math.round(left*scale)-fx,by=Math.round(top*scale)-fy,bw=Math.round(right*scale)-fx-bx,bh=Math.round(bottom*scale)-fy-by;
   if(bw===size&&bh===size&&bx>=0&&bx+bw<=fw&&by>=0&&by+bh<=fh){for(let y=0;y<size;y++)output.set(this.pixelRows[y],((by+y)*fw+bx)*4);continue;}
   for(let y=Math.max(0,-by);y<bh&&by+y<fh;y++){const sy=Math.min(size-1,Math.floor((y+.5)*size/bh));for(let x=Math.max(0,-bx);x<bw&&bx+x<fw;x++){const sx=Math.min(size-1,Math.floor((x+.5)*size/bw)),s=(sy*size+sx)*4,d=((by+y)*fw+bx+x)*4;output[d]=pixels[s];output[d+1]=pixels[s+1];output[d+2]=pixels[s+2];output[d+3]=pixels[s+3];}}
  }
  this.frameContext.putImageData(this.framePixels,0,0);ctx.drawImage(this.frameCanvas,fx/scale,fy/scale,fw/scale,fh/scale);
 }
 release(){this.sources.clear();this.materials.length=0;this.uvCache.clear();this.framePixels=null;this.frameCanvas.width=this.frameCanvas.height=1;}
}
