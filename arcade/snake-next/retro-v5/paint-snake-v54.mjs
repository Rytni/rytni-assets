// V5.4: independently authored pixel clusters inside the LOCKED V5.1 masks.
// No reference image is opened, sampled, cropped or projected here.
import {createRequire} from 'node:module';
import {CELL} from './geometry.mjs';
const {Raster}=createRequire(import.meta.url)('./raster.cjs');
export const palette={
  light:'fff9e3',lit:'faedce',cream:'f1dfba',ivory:'f6e6c7',warm:'e0c49a',
  underside:'c1a078',shade:'a28160',contact:'765a43',
  mossDark:'25452d',moss:'456a36',mossMid:'638844',mossLight:'8ea458',vein:'aabb72',
  capDark:'8e302b',cap:'d43f31',capLight:'f67b50',eye:'143b2a',pupil:'10271e'
};
const P=palette;
// All motifs are authored, finite pixel maps, not random pixel noise.
// D=contact green, g=moss, m=mid, L=lit, v=leaf vein. Transparent dots preserve ivory.
const motifs={
  leaf:[
    '........Dggg..','.....DggmLLgD.','...DggmLLLLgD.','..DgmmLLvLmgD.',
    '.DgmmLLvLmgD..','DgmmLLvLmgD...','DgmmLvLmgD....','.DgmvgDD......','..DDD.........'
  ],
  pair:[
    '...Dgg........','..DgLLgD......','.DgmLLvgD.....','..DgmLvgD.Dgg.',
    '...DgvgD.DgLgD','....DD.DgmLvgD','......DgmLvgD.','.......DgvgD..','........DD....'
  ],
  strip:[
    '..DggD....Dg..','.DgmLgD.DgmLg.','DgmLLmgDgmLmgD','DgmmLLgmLLmgD.',
    '.DgmmLmmLmgD..','..DDgmLmgDD...','....DgmgD.....','.....DDD......'
  ],
  wrap:[
    '..Dgg....Dg...','.DgmLgDDgmLg..','DgmLLgmmLLmgD.','DgmLLLmmLmgD..',
    '.DgmmLLLmgD...','..DgmmLLmgD...','...DgmLmgD....','....DgmvgD....',
    '.....DgvgD....','......DD......'
  ]
};
const ink={D:P.mossDark,g:P.moss,m:P.mossMid,L:P.mossLight,v:P.vein};
// Deliberate highlight gaps and warm material clusters, all away from sockets.
const strokes=[
  [[15,-15,7,2,'lit'],[22,-14,3,2,'lit'],[38,-8,8,2,'ivory'],[42,-6,4,1,'ivory'],[26,8,6,2,'warm']],
  [[31,-16,9,2,'lit'],[34,-14,5,1,'lit'],[20,-7,6,2,'ivory'],[22,-5,3,1,'ivory'],[44,9,5,2,'warm']],
  [[18,-16,5,2,'lit'],[24,-15,4,1,'lit'],[35,-6,9,2,'ivory'],[38,-4,4,1,'ivory'],[18,8,5,2,'warm']],
  [[39,-15,7,2,'lit'],[43,-13,3,1,'lit'],[17,-8,8,2,'ivory'],[20,-6,4,1,'ivory'],[33,9,6,2,'warm']],
  [[25,-16,8,2,'lit'],[28,-14,3,1,'lit'],[40,-7,6,2,'ivory'],[43,-5,3,1,'ivory'],[21,10,7,1,'warm']],
  [[36,-15,8,2,'lit'],[40,-13,3,1,'lit'],[18,3,5,1,'ivory'],[19,4,3,1,'ivory']],
  [[17,-16,6,2,'lit'],[21,-14,3,1,'lit'],[40,-6,7,2,'ivory'],[43,-4,3,1,'ivory']],
  [[40,-16,5,2,'lit'],[43,-14,3,1,'lit'],[19,7,7,2,'warm'],[22,6,3,1,'warm']]
];
// Small scallops on the beige/cream junction: irregular clusters, not a tile border.
const ridges=[[[18,5,2],[37,8,1]],[[25,8,2],[46,4,1]],[[16,7,1],[38,6,2]],[[27,6,2],[44,5,1]],[[21,5,1],[35,8,2]],[[41,7,2]],[[19,8,2]],[[27,6,2],[45,4,1]]];
export function paintSnake(piece,variant) {
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
  const coordinates=(x,y)=>{
    let u=x,v=y;for(let i=0;i<(4-turn)%4;i++)[u,v]=[67-v,u];
    return piece.kind==='corner'?[34*(Math.PI/2-Math.atan2(v+.5,u+.5)),Math.hypot(u+.5,v+.5)-34]:[u+.5,v+.5-34];
  };
  const stamp=(name,s,n,a,b)=>ink[motifs[name][Math.floor(n-b)]?.[Math.floor(s-a)]];
  for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++)if(mask[y*CELL+x]) {
    const upper=Math.min(distance(x,y,0,-1),distance(x,y,-1,0));
    const lower=Math.min(distance(x,y,0,1),distance(x,y,1,0));
    const [s,n]=coordinates(x,y);
    let extra=0;
    for(const [a,w,h]of ridges[variant])if(s>=a&&s<a+w)extra=h;
    // No smooth gradient: explicit 1/2px contact edge and flat pixel-value bands.
    // Sockets are virtual continuations, so shading never draws tile end caps.
    let color=lower<=2?P.contact:lower<=4?P.shade:lower<=8?P.underside:lower<=11+extra?P.warm:
      upper<=3?P.light:upper<=6?P.lit:P.cream;
    for(const [a,b,w,h,c] of strokes[variant])if(s>=a&&s<a+w&&n>=b&&n<b+h)color=P[c];
    let green;
    if(piece.kind==='neck'){
      // Head/neck share a wrapping island across their legal joint. This is art,
      // not a different neck silhouette. Other authored neck variants remain available.
      green=stamp('wrap',s,n,58,-14)||stamp(variant%2?'leaf':'pair',s,n,18,-6);
    }else if(piece.kind==='head'){
      green=stamp('wrap',s,n,-10,-14)||stamp('pair',s,n,15,-7);
    }else if(variant>=5){
      const corner=piece.kind==='corner',terminal=piece.kind==='terminal';
      const family=variant===5?(turn%2?'pair':'leaf'):variant===6?'strip':'wrap';
      // At an inner-radius corner, a top-edge stamp would compress in physical
      // pixels. Place it across the bend's broad material, not inside the hole.
      green=stamp(family,s,n,terminal?14:corner?19:variant===5?28:21,corner?-5:variant===5?-8:-15);
    }
    if(green)color=green;
    r.dot(x,y,color);
  }
  if(piece.kind==='head') {
    const put=(x,y,c)=>{for(let i=0;i<turn;i++)[x,y]=[67-y,x];if(mask[y*CELL+x])r.dot(x,y,c)};
    const rect=(x,y,w,h,c)=>{for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)put(x+dx,y+dy,c)};
    // Strong expression painted in the original 42px head; NOT an enlarged mascot.
    for(const ey of [19,40]){
      rect(43,ey,9,9,P.shade);rect(44,ey,7,8,P.eye);rect(47,ey+1,4,6,P.pupil);
      rect(45,ey+1,3,3,P.light);rect(45,ey+5,2,2,P.moss);
    }
    rect(55,33,6,3,P.contact);rect(57,32,2,1,P.contact);rect(56,36,4,1,P.warm);
    // One broad, readable red cap: 17x10px, plus a short pale stem.
    rect(23,14,6,1,P.capDark);rect(21,15,10,2,P.capDark);rect(20,17,13,1,P.capDark);
    rect(19,18,15,4,P.cap);rect(18,22,17,2,P.capDark);
    rect(22,16,8,2,P.capLight);rect(21,18,9,1,P.capLight);rect(21,19,3,2,P.light);
    rect(29,20,3,2,P.light);rect(25,22,3,1,P.capLight);
    rect(25,24,4,4,P.lit);rect(28,25,2,3,P.underside);rect(25,28,5,1,P.shade);
  }
  return r;
}
