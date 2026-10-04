// OFFLINE sprite authoring/review ONLY. No game entry imports this file.
// One pose chart defines the complete RIGHT -> UP head + neck character.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {tubePath,tubeSample} from '../forest-training/tube-path.js';
const {Raster,png,decode,resize,crop,bounds}=createRequire(import.meta.url)('../retro-v5/raster.cjs');
const art=new URL('../../../grib/mushroom-snake-retro-v5/',import.meta.url);
const out=new URL('../../../docs/qa/smooth-v3/',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const head=decode(fs.readFileSync(new URL('head-0-v0.png',art)));
const body=decode(fs.readFileSync(new URL('straight-0-v0.png',art)));
// Deliberately authored discrete poses. Cardinal endpoint artwork is exact.
// The first poses keep incoming alignment; the middle poses pivot together
// with the existing quarter-turn surface, not an extra connector/neck patch.
const ANGLES=[0,0,-6,-15,-27,-39,-51,-63,-75,-84,-90,-90];
const W=160,H=160,PIVOT={x:96,y:48},JOIN=1.65,frames=[],metadata=[];
function copyPixel(dst,x,y,source,u,v){
 if(u<0||v<0||u>=source.w||v>=source.h)return false;
 const k=(v*source.w+u)*4;if(!source.data[k+3])return false;
 dst.dot(x,y,Array.from(source.data.subarray(k,k+4)));return true;
}
function blit(dst,src,ox,oy){for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++)copyPixel(dst,x+ox,y+oy,src,x,y);}
function components(r){
 const visited=new Uint8Array(r.w*r.h);let count=0;
 for(let i=0;i<visited.length;i++)if(r.data[i*4+3]&&!visited[i]){
  count++;const queue=[i];visited[i]=1;
  for(let j=0;j<queue.length;j++){const n=queue[j],x=n%r.w,y=Math.floor(n/r.w);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=b*r.w+a;if(a>=0&&b>=0&&a<r.w&&b<r.h&&!visited[k]&&r.data[k*4+3]){visited[k]=1;queue.push(k);}}}
 }
 return count;
}
for(let phase=0;phase<12;phase++){
 const alpha=phase/11,start=1-alpha,angle=ANGLES[phase]*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const frame={route:[{x:0,y:-1},...Array.from({length:8},(_,i)=>({x:-i,y:0}))],start,end:start+7};
 const path=tubePath(frame),r=new Raster(W,H),hx=34,hy=34-alpha*68;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const px=x+.5-PIVOT.x,py=y+.5-PIVOT.y,wx=hx+px,wy=hy+py;
  let q=null;
  for(const part of path){const v=tubeSample(part,wx,wy);if(v&&v.d<=JOIN&&(!q||Math.abs(v.v)<Math.abs(q.v)))q=v;}
  if(q){const d=Math.max(0,(q.d-start)*68),u=Math.floor(d)%68,v=Math.floor(34-q.v);copyPixel(r,x,y,body,u,v);}
  // Offline inverse pixel mapping; there is no Canvas rotation, filtering,
  // interpolation of RGBA, or runtime dependency on these angle values.
  const u=Math.floor(34+px*c+py*s),v=Math.floor(34-px*s+py*c);
  copyPixel(r,x,y,head,u,v);
 }
 const join={x:PIVOT.x-(JOIN-1)*68,y:PIVOT.y+alpha*68};
 let connector=0;const ix=Math.ceil(join.x);
 for(let y=0;y<H;y++)if(r.data[(y*W+ix)*4+3])connector++;
 if(connector!==36||components(r)!==1)throw Error(`Invalid front pose ${phase}`);
 const file=`front-${String(phase).padStart(2,'0')}.png`;
 fs.writeFileSync(new URL(file,out),png(W,H,r.data));frames.push(r);
 metadata.push({phase,alpha,angleDegrees:ANGLES[phase],file,pivot:PIVOT,join,connector,components:components(r)});
}
function strip(checker){
 const r=new Raster(W*12,H);
 if(checker)for(let y=0;y<H;y++)for(let x=0;x<r.w;x++)r.dot(x,y,(Math.floor(x/8)+Math.floor(y/8))%2?'777d78':'a8ada7');
 for(let i=0;i<12;i++)blit(r,frames[i],i*W,0);return r;
}
const transparent=strip(false),checker=strip(true);
fs.writeFileSync(new URL('turn-native.png',out),png(transparent.w,transparent.h,transparent.data));
fs.writeFileSync(new URL('turn-checker.png',out),png(checker.w,checker.h,checker.data));
// A close-up of the middle pose, not a giant 7680px-wide zoom gallery.
const detail=new Raster(W,H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++)detail.dot(x,y,(Math.floor(x/8)+Math.floor(y/8))%2?'777d78':'a8ada7');
blit(detail,frames[6],0,0);
const [bx,by,bw,bh]=bounds(frames[6]),closeup=crop(detail,bx,by,bw,bh);
const large=resize(closeup,bw*4,bh*4);
fs.writeFileSync(new URL('turn-4x.png',out),png(large.w,large.h,large.data));
// One simulated composition, not gameplay integration. The regular body
// owns only x < rear seam; the front module owns x >= seam. No alpha union.
const composite=new Raster(408,204),phase=6,module=frames[phase],join=metadata[phase].join,ox=220,oy=0;
composite.rect(0,0,408,204,'072a23');
for(let y=0;y<204;y++)for(let x=0;x<408;x++)if(x+.5<ox+join.x){const v=Math.floor(34+y+.5-join.y),u=Math.floor((JOIN-(1-phase/11))*68+ox+join.x-x-.5)%68;copyPixel(composite,x,y,body,u,v);}
blit(composite,module,ox,oy);
fs.writeFileSync(new URL('body-composite.png',out),png(composite.w,composite.h,composite.data));
fs.writeFileSync(new URL('poses.json',out),JSON.stringify({reviewOnly:true,cell:68,body:36,headTransverseWidth:42,canvas:{width:W,height:H},rearJoinDistance:JOIN,frames:metadata},null,2)+'\n');
console.log(JSON.stringify(metadata.map(({phase,angleDegrees,connector,components})=>({phase,angleDegrees,connector,components}))));
