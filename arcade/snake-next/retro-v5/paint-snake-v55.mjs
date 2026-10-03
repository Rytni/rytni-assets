// V5.5 manually authored material. No reference image or renderer is used here.
// Pixel dimensions come exclusively from the locked masks, not the art reference.
import {createRequire} from 'node:module';
import {CELL,terminal} from './geometry.mjs';
import {palette} from './paint-snake-v54.mjs';
export {palette};
const {Raster}=createRequire(import.meta.url)('./raster.cjs'),P=palette;
const widths=Array.from({length:CELL},(_,x)=>terminal.filter((v,i)=>i%CELL===x&&v).length);
// Small hand-authored clusters: s,n,type. No random pixels, cell outlines or cadence.
// Each cluster has only 1–3px strokes; their scattered arrangement differs by variant.
const skin=[
 [[8,-7,0],[14,2,1],[22,-3,0],[28,7,2],[34,-9,1],[41,0,0],[49,6,1],[56,-5,2],[61,2,0],[19,10,1],[45,-13,2]],
 [[6,4,1],[12,-6,2],[20,1,0],[27,-9,0],[32,5,1],[40,-2,2],[46,8,0],[53,-7,1],[61,3,2],[24,10,1],[51,-13,0]],
 [[8,-2,2],[16,-8,0],[23,5,1],[30,-3,1],[38,8,0],[45,-7,2],[52,1,0],[60,7,1],[11,10,2],[36,-13,0],[56,-11,1]],
 [[5,-6,1],[13,5,0],[21,-1,2],[29,-8,1],[35,4,0],[43,9,2],[51,-4,1],[59,2,0],[17,10,1],[46,-12,0],[62,-9,2]],
 [[7,1,0],[15,-9,1],[22,7,2],[31,-4,0],[39,2,1],[47,-8,0],[54,6,2],[62,-1,1],[11,10,0],[36,10,1],[57,-13,2]],
 [[7,-7,2],[14,1,0],[21,8,1],[30,-3,2],[38,5,0],[46,-8,1],[53,0,2],[61,7,0],[17,10,1],[42,-13,0]],
 [[8,6,0],[16,-5,1],[23,0,2],[31,9,0],[39,-7,2],[47,3,1],[55,-2,0],[61,8,2],[11,-12,0],[43,10,1]],
 [[6,-3,1],[14,7,2],[22,-9,0],[30,2,1],[38,8,2],[46,-5,0],[54,1,1],[61,-8,2],[18,10,0],[41,-13,1]]
];
const gaps=[[[13,2],[37,3],[58,1]],[[8,1],[26,3],[49,2]],[[18,2],[43,1],[60,3]],[[11,3],[32,1],[55,2]],[[21,1],[40,3],[62,2]],[[12,2],[35,1],[57,3]],[[16,3],[44,2],[59,1]],[[9,1],[28,2],[51,3]]];
const motifs={
 leaf:['........Dggg..','.....DggmLLgD.','...DggmLLLLgD.','..DgmmLLvLmgD.','.DgmmLLvLmgD..','DgmmLLvLmgD...','DgmmLvLmgD....','.DgmvgDD......','..DDD.........'],
 pair:['...Dgg........','..DgLLgD......','.DgmLLvgD.....','..DgmLvgD.Dgg.','...DgvgD.DgLgD','....DD.DgmLvgD','......DgmLvgD.','.......DgvgD..','........DD....'],
 strip:['..DggD....Dg..','.DgmLgD.DgmLg.','DgmLLmgDgmLmgD','DgmmLLgmLLmgD.','.DgmmLmmLmgD..','..DDgmLmgDD...','....DgmgD.....','.....DDD......'],
 wrap:['..Dgg....Dg...','.DgmLgDDgmLg..','DgmLLgmmLLmgD.','DgmLLLmmLmgD..','.DgmmLLLmgD...','..DgmmLLmgD...','...DgmLmgD....','....DgmvgD....','.....DgvgD....','......DD......']
};
export function paintSnake(piece,variant){
 const r=new Raster(CELL),mask=piece.mask,turn=Number(piece.name.at(-1));
 const inside=(x,y)=>{
  if(x>=0&&y>=0&&x<CELL&&y<CELL)return !!mask[y*CELL+x];
  if(x<0&&y>=0&&y<CELL&&piece.ports.includes(3))return !!mask[y*CELL];
  if(x>=CELL&&y>=0&&y<CELL&&piece.ports.includes(1))return !!mask[y*CELL+CELL-1];
  if(y<0&&x>=0&&x<CELL&&piece.ports.includes(0))return !!mask[x];
  if(y>=CELL&&x>=0&&x<CELL&&piece.ports.includes(2))return !!mask[(CELL-1)*CELL+x];
  return false;
 };
 const distance=(x,y,dx,dy)=>{for(let d=1;d<=13;d++)if(!inside(x+dx*d,y+dy*d))return d;return 14};
 const coords=(x,y)=>{
  let u=x,v=y;for(let i=0;i<(4-turn)%4;i++)[u,v]=[67-v,u];
  return piece.kind==='corner'?[34*(Math.PI/2-Math.atan2(v+.5,u+.5)),Math.hypot(u+.5,v+.5)-34]:[u+.5,v+.5-34];
 };
 const stamp=(name,s,n,a,b)=>motifs[name][Math.floor(n-b)]?.[Math.floor(s-a)];
 const foliage=(s,n)=>{
  if(piece.kind==='neck')return stamp('wrap',s,n,58,-17)||stamp(variant%2?'leaf':'pair',s,n,18,-7);
  if(piece.kind==='head')return stamp('wrap',s,n,-10,-17)||stamp('pair',s,n,15,-9);
  if(variant<5)return undefined;
  const bend=piece.kind==='corner',tail=piece.kind==='terminal';
  const family=variant===5?(turn%2?'pair':'leaf'):variant===6?'strip':'wrap';
  return stamp(family,s,n,tail?14:bend?19:variant===5?28:21,bend?-5:-17);
 };
 for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++)if(mask[y*CELL+x]){
  const upper=Math.min(distance(x,y,0,-1),distance(x,y,-1,0)),lower=Math.min(distance(x,y,0,1),distance(x,y,1,0));
  const [s,n]=coords(x,y),tail=piece.kind==='terminal',w=tail?widths[Math.min(67,Math.floor(s))]:36;
  // Tail shading scales within the existing terminal cross-section; it does not
  // turn the narrow end into solid dark metal or carry a bright blade-like ridge.
  const contact=tail&&w<18?1:2,shade=tail?Math.max(1,Math.round(w/9)):4,under=tail?Math.max(2,Math.round(w*2/9)):8,warm=tail?Math.max(2,Math.round(w*11/36)):11;
  let color=lower<=contact?(tail&&w<12?P.warm:P.contact):lower<=shade?P.shade:lower<=under?P.underside:lower<=warm?P.warm:
    upper<=(tail?Math.max(1,Math.min(3,Math.floor(w/10))):3)?P.light:upper<=6?P.lit:P.cream;
  if(tail&&w<=4)color=lower===1?P.warm:P.cream;
  // Small incomplete organic plate hints, never a scale lattice or tile seam.
  // Along the bend these use the same material coordinates and pixel frequency.
  if(!tail||w>10)for(const [a,b,type]of skin[variant]){
   const dx=Math.floor(s-a),dy=Math.floor(n-b);
   if(type===0){if(dy===0&&dx>=0&&dx<3)color=P.ivory;if(dy===1&&dx===2)color=P.warm;}
   if(type===1){if(dy===0&&dx>=0&&dx<2)color=P.warm;if(dy===-1&&dx===0)color=P.ivory;}
   if(type===2){if(dy===0&&dx>=0&&dx<3)color=P.warm;if(dy===1&&dx===1)color=P.underside;if(dy===-1&&dx===2)color=P.lit;}
  }
  if(upper>=2&&upper<=4)for(const [a,width]of gaps[variant])if(s>=a&&s<a+width)color=upper===2?P.lit:P.ivory;
  if(lower>=8&&lower<=11)for(const [a,width]of gaps[(variant+3)%8])if(s>=a&&s<a+width&&Math.floor(s-a)%2===0)color=lower===9?P.underside:P.warm;
  const plant=foliage(s,n);
  // Contact belongs to the body, not a closed dark icon border. The upper rim
  // occludes occasional leaf pixels, making the plant wrap behind the silhouette.
  if(plant&&plant!=='.'&&upper>1){
   color=plant==='D'?(lower<9?P.mossDark:upper<6?P.mossMid:P.moss):plant==='g'?P.moss:plant==='m'?P.mossMid:plant==='L'?P.mossLight:P.vein;
  }else if(!plant||plant==='.'){
   const above=foliage(s,n-1);
   if(above&&above!=='.'&&lower>4&&upper>3)color=P.underside;
  }
  r.dot(x,y,color);
 }
 if(piece.kind==='head'){
  const put=(x,y,c)=>{for(let i=0;i<turn;i++)[x,y]=[67-y,x];if(mask[y*CELL+x])r.dot(x,y,c)};
  const rect=(x,y,w,h,c)=>{for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)put(x+dx,y+dy,c)};
  // Stepped oval eyes and soft lower reflection: no rectangular facial plaques.
  const eye=['..eee...','.ePPPe..','ePwwPPe.','ePwwPPe.','ePPPPPe.','.ePPme..','..emme..','...ee...'];
  const eyeInk={e:P.eye,P:P.pupil,w:P.light,m:P.moss};
  for(const ey of [20,40])for(let dy=0;dy<eye.length;dy++)for(let dx=0;dx<8;dx++)if(eyeInk[eye[dy][dx]])put(44+dx,ey+dy,eyeInk[eye[dy][dx]]);
  put(57,34,P.contact);put(58,35,P.contact);put(59,34,P.contact);put(58,36,P.warm);
  rect(23,14,6,1,P.capDark);rect(21,15,10,2,P.capDark);rect(20,17,13,1,P.capDark);
  rect(19,18,15,4,P.cap);rect(18,22,17,2,P.capDark);
  rect(22,16,8,2,P.capLight);rect(21,18,9,1,P.capLight);
  rect(21,18,3,3,P.light);rect(29,20,3,2,P.light);rect(27,16,2,2,P.light);
  rect(25,24,4,4,P.lit);rect(28,25,2,3,P.underside);rect(25,28,5,1,P.shade);
 }
 return r;
}
