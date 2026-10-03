// V5.6 micro polish. V5.5 remains the exact source of body/neck/corner material.
// Only head internal pixels and terminal edge shading are changed. No ImageGen.
import {paintSnake as paintV55,palette} from './paint-snake-v55.mjs';
import {CELL} from './geometry.mjs';
export {palette};
const P=palette,plants=new Set([P.mossDark,P.moss,P.mossMid,P.mossLight,P.vein]);
export function paintSnake(piece,variant){
 const r=paintV55(piece,variant);
 if(piece.kind!=='head'&&piece.kind!=='terminal')return r;
 const turn=Number(piece.name.at(-1)),mask=piece.mask;
 const point=(x,y)=>{for(let i=0;i<turn;i++)[x,y]=[67-y,x];return [x,y]};
 const put=(u,v,color)=>{const [x,y]=point(u,v);if(mask[y*CELL+x])r.dot(x,y,color)};
 if(piece.kind==='head'){
  // Same stepped oval footprint. Fewer glint pixels and a darker outer iris
  // keep a coherent expression after the existing 68→31px mobile reduction.
  const eye=['..eee...','.ePPPe..','ePwPPPe.','ePwwPPe.','ePPPPPe.','.ePPee..','..eeee..','...ee...'];
  const ink={e:P.pupil,P:P.pupil,w:P.light};
  for(const ey of [20,40])for(let dy=0;dy<8;dy++)for(let dx=0;dx<8;dx++)if(ink[eye[dy][dx]])put(44+dx,ey+dy,ink[eye[dy][dx]]);
  // A restrained lower iris reflection, not a framed square.
  put(48,26,P.eye);put(48,46,P.eye);
  // Clear the prior small mouth marks within their existing material region.
  for(const [x,y]of [[57,34],[58,35],[59,34],[58,36]])put(x,y,P.underside);
  put(58,34,P.pupil);put(59,35,P.pupil);put(60,34,P.pupil);
  // Preserve the existing cap footprint, but make red dominate. Only three
  // bright source pixels remain; chosen within the cap, not a larger mushroom.
  const rows=[[23,6],[21,10],[21,10],[20,13],[19,15],[19,15],[19,15],[19,15],[18,17],[18,17]];
  for(const [dy,[x,w]]of rows.entries())for(let dx=0;dx<w;dx++)put(x+dx,14+dy,dy===0||dy===9?P.capDark:P.cap);
  for(const [x,y]of [[23,18],[29,20],[27,16]])put(x,y,P.light);
  put(22,16,P.capLight);put(26,15,P.capLight);
  return r;
 }
 const inside=(x,y)=>x>=0&&y>=0&&x<CELL&&y<CELL&&mask[y*CELL+x];
 const upperDistance=(x,y)=>{
  const north=piece.ports.includes(0),west=piece.ports.includes(3);
  const ray=(dx,dy)=>{for(let d=1;d<=3;d++){const nx=x+d*dx,ny=y+d*dy;if((ny<0&&north)||(nx<0&&west))continue;if(!inside(nx,ny))return d;}return 4};
  return Math.min(ray(0,-1),ray(-1,0));
 };
 for(let v=0;v<CELL;v++)for(let u=8;u<CELL;u++){
  const [x,y]=point(u,v),at=(y*CELL+x)*4;if(!mask[y*CELL+x])continue;
  const color=r.data.subarray(at,at+3).toString('hex');if(plants.has(color))continue;
  // No contour edits, no new texture. Remove blade-like rim contrast toward
  // the terminal end while retaining the same warm ivory flesh values.
  let next=color;
  if(color===P.contact)next=u>=28?P.underside:P.shade;
  else if(color===P.shade&&u>=28)next=P.underside;
  else if(color===P.underside&&u>=48)next=P.warm;
  else if(color===P.warm&&u>=56)next=P.cream;
  else if(color===P.light&&u>=16&&upperDistance(x,y)<=2)next=P.lit;
  if(next!==color)r.dot(x,y,next);
 }
 return r;
}
