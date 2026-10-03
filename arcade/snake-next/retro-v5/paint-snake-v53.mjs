// Original pixel painting. Generated sheet/TARGET are visual references only.
// No reference bitmap is opened, sampled, traced or copied by this module.
import {createRequire} from 'node:module';
import {CELL} from './geometry.mjs';
const require=createRequire(import.meta.url),{Raster}=require('./raster.cjs');
export const palette={center:'efdfc0',light:'fff6df',lit:'f8ebce',lightMid:'f3e3c4',transition:'e9d4ae',shade:'c9b18a',shadow:'ae9570',edge:'8d785a',mossDark:'2b4934',moss:'456644',mossLight:'74915b',leaf:'94a66a',cap:'c84939',capLight:'eb7550',capDark:'873e32'};
const P=palette;
const breaks=[
 [[18,-7,6,1,P.lightMid],[21,-6,3,1,P.lightMid],[37,4,5,1,P.transition],[38,5,3,1,P.transition]],
 [[24,-4,8,1,P.lightMid],[26,-3,4,1,P.lightMid],[42,8,3,1,P.transition]],
 [[34,-9,7,1,P.lightMid],[37,-8,3,1,P.lightMid],[23,6,4,1,P.transition]],
 [[17,3,5,1,P.transition],[21,4,3,1,P.transition],[40,-8,6,1,P.lightMid]],
 [[29,-6,6,1,P.lightMid],[30,-5,3,1,P.lightMid],[42,4,4,1,P.transition]]
];
const moss=['....gg....','..ggmgg...','.gmmLmg...','ggmLLmmg..','.gmmLmg...','..gmmmg...','...ggg....'];
const leaf=['......g..','....gLg..','..gmLLg..','.gmLLgg..','gmLmg....','.ggg.....'];
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
  const distance=(x,y,dx,dy)=>{for(let d=1;d<=9;d++)if(!inside(x+dx*d,y+dy*d))return d;return 10};
  const pathCoordinates=(x,y)=>{
    let u=x,v=y;for(let i=0;i<(4-turn)%4;i++)[u,v]=[67-v,u];
    if(piece.kind==='corner')return [34*(Math.PI/2-Math.atan2(v+.5,u+.5)),Math.hypot(u+.5,v+.5)-34];
    return [u+.5,v+.5-34];
  };
  const clusterColor=char=>({g:P.mossDark,m:P.moss,L:P.mossLight,l:P.leaf}[char]);
  for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++)if(mask[y*CELL+x]) {
    const upper=Math.min(distance(x,y,0,-1),distance(x,y,-1,0));
    const lower=Math.min(distance(x,y,0,1),distance(x,y,1,0));
    // Discrete paint bands, not smooth gradients. Virtual sockets avoid end caps.
    let color=lower<=1?P.edge:lower<=3?P.shadow:lower<=6?P.shade:lower<=8?P.transition:
      upper<=2?P.light:upper<=4?P.lit:upper<=7?P.lightMid:P.center;
    const [s,n]=pathCoordinates(x,y);
    for(const [a,b,w,h,c] of breaks[variant%5])if(s>=a&&s<a+w&&n>=b&&n<b+h)color=c;
    // Authored wrapping islands use the SAME path-coordinate/pixel scale on bends.
    if(variant===5||variant===6) {
      const pattern=variant===5?moss:leaf;
      const px=Math.floor(s-(variant===5?24:34)),py=Math.floor(n+10);
      const char=pattern[py]?.[px];
      if(clusterColor(char))color=clusterColor(char);
    }
    if(variant===7) {
      const a=Math.floor(s),b=Math.floor(n);
      if(a>=29&&a<=35&&b>=-8&&b<=-6)color=b===-6?P.capDark:P.cap;
      if(a>=31&&a<=33&&b===-9)color=P.capLight;
      if(a===31&&b===-8)color=P.light;
      if(a>=31&&a<=32&&b>=-5&&b<=-3)color=P.lit;
    }
    r.dot(x,y,color);
  }
  if(piece.kind==='head') {
    const feature=(x,y,c)=>{for(let i=0;i<turn;i++)[x,y]=[67-y,x];if(mask[y*CELL+x])r.dot(x,y,c)};
    const rect=(x,y,w,h,c)=>{for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)feature(x+dx,y+dy,c)};
    // Larger internal eyes/cap survive the existing ~30px mobile cell.
    for(const ey of [21,40]) {
      rect(44,ey,7,7,'294538');rect(46,ey+1,4,5,'142b23');
      rect(45,ey+1,2,2,'fff9e9');feature(50,ey+5,P.shadow);
    }
    rect(56,34,4,2,'6b5740');feature(59,33,'6b5740');feature(57,36,P.lit);
    rect(25,16,5,1,P.capDark);rect(23,17,9,1,P.capDark);
    rect(22,18,11,3,P.cap);rect(21,21,13,1,P.capDark);
    rect(24,18,5,1,P.capLight);rect(25,17,3,1,P.capLight);
    rect(25,18,2,2,P.light);rect(30,20,2,1,P.light);
    rect(26,22,3,4,P.lit);feature(28,24,P.shadow);rect(26,26,3,1,P.shadow);
    for(const [x,y,c] of [[19,24,P.mossDark],[20,23,P.moss],[20,24,P.mossLight],[21,24,P.moss],[19,25,P.moss],[20,25,P.moss],[21,25,P.mossDark],[18,26,P.mossDark],[19,26,P.mossLight],[20,26,P.moss],[21,26,P.moss],[20,27,P.mossDark]])feature(x,y,c);
  }
  return r;
}
