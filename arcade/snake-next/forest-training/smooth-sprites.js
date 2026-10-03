import {pieces,DIRS,OPPOSITE,CELL} from '../retro-v5/geometry.mjs';
import {variant} from '../retro-v5/material.mjs';

const dir=(a,b)=>DIRS.findIndex(([x,y])=>b.x-a.x===x&&b.y-a.y===y);
const lookup=new Map();
/** Authored quarter-bend UVs. Each pixel belongs to exactly one canonical tile.
 * Endpoint art is sampled along this same tube, never lerped between cells. */
function mapping(a,b){
  const key=a+':'+b;if(lookup.has(key))return lookup.get(key);
  const out=new Float32Array(CELL*CELL*2),corner=OPPOSITE(a)!==b;
  const cx=(a===1||b===1)?CELL:0,cy=(a===2||b===2)?CELL:0;
  const p=[a===1?CELL:a===3?0:34,a===2?CELL:a===0?0:34];
  const q=[b===1?CELL:b===3?0:34,b===2?CELL:b===0?0:34];
  const angle=Math.atan2(p[1]-cy,p[0]-cx);let delta=Math.atan2(q[1]-cy,q[0]-cx)-angle;
  if(delta>Math.PI)delta-=Math.PI*2;if(delta<-Math.PI)delta+=Math.PI*2;
  for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){
    const n=(y*CELL+x)*2;
    if(!corner){const [dx,dy]=DIRS[b];out[n]=34+(x+.5-34)*dx+(y+.5-34)*dy;out[n+1]=-(x+.5-34)*dy+(y+.5-34)*dx;}
    else {let t=Math.atan2(y+.5-cy,x+.5-cx)-angle;if(t>Math.PI)t-=Math.PI*2;if(t<-Math.PI)t+=Math.PI*2;out[n]=Math.max(0,Math.min(1,t/delta))*CELL;out[n+1]=(Math.hypot(x+.5-cx,y+.5-cy)-34)*(delta<0?1:-1);}
  }
  lookup.set(key,out);return out;
}
export class SmoothSprites {
  constructor(art){
    this.art=art;this.sources=new Map();
    this.tile=document.createElement('canvas');this.tile.width=this.tile.height=CELL;
    this.context=this.tile.getContext('2d');this.pixels=this.context.createImageData(CELL,CELL);
    // Decode/readback and UV construction happen while loading, never on the
    // first active fixed-clock frame (which must not cause catch-up recovery).
    for(const key of art.images.keys())if(/^(head|neck|straight|corner|terminal)-/.test(key))this.source(key);
    for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(a!==b)mapping(a,b);
  }
  source(key){
    if(!this.sources.has(key)){const c=document.createElement('canvas');c.width=c.height=CELL;const ctx=c.getContext('2d');ctx.drawImage(this.art.images.get(key),0,0);this.sources.set(key,ctx.getImageData(0,0,CELL,CELL).data);}
    return this.sources.get(key);
  }
  draw(ctx,frame,cell,ox,oy,view={x:0,y:0},clip=null){
    const {route,start,end,moves}=frame,head=this.source('head-0-v0');
    // Head/tail are endpoint material ranges on ONE path. Fixed authored bends
    // stay on the canonical corners; no moving corner stamps or diagonal joins.
    for(let i=0;i<route.length;i++){
      if(i-.5>end+.5)continue;
      const p=route[i],left=Math.round(ox+(p.x-view.x)*cell),top=Math.round(oy+(p.y-view.y)*cell),right=Math.round(ox+(p.x-view.x+1)*cell),bottom=Math.round(oy+(p.y-view.y+1)*cell);
      if(clip&&(right<clip.x||left>clip.x+clip.w||bottom<clip.y||top>clip.y+clip.h))continue;
      const a=i?dir(p,route[i-1]):OPPOSITE(dir(p,route[i+1])),b=i<route.length-1?dir(p,route[i+1]):OPPOSITE(a);
      const corner=OPPOSITE(a)!==b,kind=corner?'corner':i===1?'neck':'straight',piece=pieces.find(s=>s.kind===kind&&s.ports.includes(a)&&s.ports.includes(b));
      const key=piece.name+'-v'+(kind==='neck'?0:variant(moves-i)),base=this.source(key);
      if(i-.5>=start+.5&&i+.5<=end-.5){ctx.drawImage(this.art.images.get(key),left,top,right-left,bottom-top);continue;}
      const uv=mapping(a,b),pixels=this.pixels.data,tail=this.source('terminal-0-v'+variant(moves-i));
      for(let n=0;n<CELL*CELL;n++){
        const d=i-.5+uv[n*2]/CELL,v=uv[n*2+1];let src=base,index=n*4;
        if(d<start)index=-1;
        else if(d>end-.5){src=tail;const x=Math.floor((d-end+.5)*CELL),y=Math.floor(34+v);index=x<0||x>=CELL||y<0||y>=CELL?-1:(y*CELL+x)*4;}
        // The face remains rigid, centered on the exact cardinal path sample.
        // Only its connecting skin shares the authored bend. This avoids an
        // eye/nose taking the bend UV's diagonal arc shortcut or duplicating it.
        if(i<2){
          const px=(p.x+(n%CELL+.5)/CELL-frame.head.x-.5)*CELL,py=(p.y+(Math.floor(n/CELL)+.5)/CELL-frame.head.y-.5)*CELL;
          const x=Math.floor(34+px*frame.head.dx+py*frame.head.dy),y=Math.floor(34-px*frame.head.dy+py*frame.head.dx),h=x>=0&&x<CELL&&y>=0&&y<CELL?(y*CELL+x)*4:-1;
          if(h>=0&&head[h+3]){src=head;index=h;}
        }
        const k=n*4;for(let c=0;c<4;c++)pixels[k+c]=index<0?0:src[index+c];
      }
      this.context.putImageData(this.pixels,0,0);ctx.drawImage(this.tile,left,top,right-left,bottom-top);
    }
  }
  release(){this.sources.clear();}
}
