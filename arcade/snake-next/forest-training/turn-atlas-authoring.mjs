import {CELL,BODY} from '../retro-v5/geometry.mjs';
import {tubePath,tubeSample} from './tube-path.js';

// One native-pixel Right -> Up mask master, mirrored/rotated by the caller.
// No head pixels or artistic material are stored in the transition atlas.
export const TURN_ATLAS=Object.freeze({phases:16,width:136,height:136,x:-102,y:-34,socket:32,underlap:2,body:BODY});
// Authored raster edit per progress frame: socket entrance, visible endpoint,
// clipping half-width. These are native pixels, not Bezier control points.
const SOCKET_ROWS=Object.freeze([
 null,[32,36,18],[32,36,18],[32,36,18],[32,36,18],
 [32,36,18],[32,36,18],[32,36,18],[32,36,18],
 [32,36,18],[32,36,18],[32,36,18],[32,36,18],
 [32,36,18],[32,36,18],[32,36,18],
]);

export function makeTurnAtlas(){
 const frames=[];
 for(let phase=0;phase<16;phase++){
  const alpha=phase/15,start=1-alpha,route=[{x:0,y:-1},...Array.from({length:5},(_,i)=>({x:-i,y:0}))];
  const frame={route,start,end:start+3},path=tubePath(frame),hx=34,hy=34-alpha*CELL;
  const pixels=new Uint8Array(136*136),uv=new Float32Array(136*136*2);uv.fill(NaN);
  for(let y=0;y<136;y++)for(let x=0;x<136;x++){
   const lx=x-102+.5,ly=y-34+.5,n=y*136+x;
   let d=NaN,v=Infinity;const out={d:0,v:0};
   for(const p of path){const q=tubeSample(p,hx+lx,hy+ly,out);if(q&&Math.abs(q.v)<Math.abs(v)){d=q.d-start;v=q.v;}}
   if(!Number.isNaN(d)){pixels[n]=1;uv[n*2]=d;uv[n*2+1]=v;}
   const edit=SOCKET_ROWS[phase];
   if(edit&&ly>=edit[0]&&ly<edit[1]&&Math.abs(lx)<26){
    if(Math.abs(lx)<edit[2]){pixels[n]=1;uv[n*2]=ly/CELL;uv[n*2+1]=-lx;}
   }
  }
  frames.push({pixels,uv});
 }
 return frames;
}
