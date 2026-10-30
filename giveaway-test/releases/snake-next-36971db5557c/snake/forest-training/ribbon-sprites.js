import {CELL,BODY,makeSweep} from '../smooth-v4-proof/ribbon.js';
import {RibbonRaster} from './ribbon-raster.js';

/** View translation only. Distances, alpha and history are the V2 frame. */
export function ribbonFrame(frame,view={x:0,y:0}){
 return {...frame,route:frame.route.map(p=>({x:p.x-view.x,y:p.y-view.y})),head:{...frame.head,x:frame.head.x-view.x,y:frame.head.y-view.y}};
}

/** Integer-cell crop only, using the existing sweep's conservative bounds. */
export function ribbonBounds(frame,cols,rows){
 const bounds=makeSweep(frame).parts.map(p=>p.kind==='line'?{x0:Math.min(p.a.x,p.b.x),x1:Math.max(p.a.x,p.b.x),y0:Math.min(p.a.y,p.b.y),y1:Math.max(p.a.y,p.b.y)}:{x0:p.cx-p.r,x1:p.cx+p.r,y0:p.cy-p.r,y1:p.cy+p.r});
 const x=Math.max(0,Math.floor((Math.min(...bounds.map(b=>b.x0))-BODY/2)/CELL)),y=Math.max(0,Math.floor((Math.min(...bounds.map(b=>b.y0))-BODY/2)/CELL));
 const right=Math.min(cols,Math.ceil((Math.max(...bounds.map(b=>b.x1))+BODY/2)/CELL)),bottom=Math.min(rows,Math.ceil((Math.max(...bounds.map(b=>b.y1))+BODY/2)/CELL));
 return {x,y,cols:Math.max(0,right-x),rows:Math.max(0,bottom-y)};
}

/** DEV adapter for the validated V4 mask/material renderer. No game state. */
export class RibbonSprites {
 constructor(art){
  this.canvas=document.createElement('canvas');this.context=this.canvas.getContext('2d');
  const source=document.createElement('canvas');source.width=source.height=CELL;const ctx=source.getContext('2d');
  this.sources=Array.from({length:8},(_,i)=>{ctx.clearRect(0,0,CELL,CELL);ctx.drawImage(art.images.get('straight-0-v'+i),0,0);return ctx.getImageData(0,0,CELL,CELL).data;});
  this.raster=new RibbonRaster(this.sources);
  this.key=null;
 }
 draw(ctx,frame,cell,ox,oy,view={x:0,y:0,cols:28,rows:12}){
  const visible=ribbonFrame(frame,view),box=ribbonBounds(visible,view.cols,view.rows);
  this.bounds=box;
  if(!box.cols||!box.rows)return;
  const mapped=ribbonFrame(visible,box),w=box.cols*CELL,h=box.rows*CELL,key=JSON.stringify([w,h,mapped]);
  if(key!==this.key){
   const result=this.raster.render(mapped,w,h);
   if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
   this.context.putImageData(new ImageData(result.data,w,h),0,0);this.key=key;
  }
  // The host owns arena clipping, portal dissolve and DPR. Only one V4 mask
  // is drawn: no V5.6 head, neck socket, atlas or legacy terminal.
  ctx.imageSmoothingEnabled=false;ctx.drawImage(this.canvas,ox+box.x*cell,oy+box.y*cell,box.cols*cell,box.rows*cell);
 }
 release(){this.key=null;this.raster.release();this.sources.length=0;this.canvas.width=this.canvas.height=1;}
}
