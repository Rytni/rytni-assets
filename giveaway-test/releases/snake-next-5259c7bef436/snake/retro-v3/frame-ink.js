// Measured production strip padding, in native source pixels. These are
// almost-opaque near-black rows/columns, NOT transparent canvas bounds.
export const FRAME_VISIBLE_TRIM=Object.freeze({topBottom:2,bottomTop:0,leftRight:2,rightLeft:2});
export const WORLD_VISIBLE_OUTER_NATIVE=49; // -54..-49 is dark backing only.
export const TOP_STRIP_END_NATIVE=32; // Existing leaf/shadow endcaps, fixed scale.
const trimmed=new WeakMap();
// Joint ornaments have a near-opaque dark matte at their inward canvas edge.
// Strip that edge-connected matte only, retaining every interior shadow and
// all wood/gold pixels. This is source-padding trim, not an added wall overlap.
export function jointVisibleImage(image,side){
 let result=trimmed.get(image);if(result)return result;
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
 const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height),d=pixels.data;
 const seen=new Uint8Array(c.width*c.height),queue=[];
 const visit=(x,y)=>{if(x<0||y<0||x>=c.width||y>=c.height)return;const p=y*c.width+x;if(seen[p])return;seen[p]=1;const i=p*4,a=d[i+3]/255;
  if(d[i+3]>=128&&Math.max(d[i]*a+2*(1-a),d[i+1]*a+21*(1-a),d[i+2]*a+18*(1-a))>=40)return;
  d[i+3]=0;queue.push([x,y]);};
 for(let y=0;y<c.height;y++)visit(side==='left'?c.width-1:0,y);
 // Flood only inward-edge-connected matte. A tiny gold island must not hide
 // a corridor of canvas black behind it; enclosed artistic shadows remain.
 for(let n=0;n<queue.length;n++){const [x,y]=queue[n];visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1);}
 ctx.putImageData(pixels,0,0);trimmed.set(image,c);return c;
}
