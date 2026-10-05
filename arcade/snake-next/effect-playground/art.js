// Original, manually authored native pixel art. 28×28 logical paint cells at
// 2 native pixels each; no reference pixels, arbitrary rotation or X/Y stretch.
export const KINDS=['harvest','focus','spores','guard','portalPrize','rush','weak','brambles','mist'];
export const LABELS={harvest:'УРОЖАЙ',focus:'ФОКУС',spores:'СПОРЫ',guard:'ЩИТ',portalPrize:'ПОРТАЛ+',rush:'СПЕШКА',weak:'ПОРЧА',brambles:'КОРНИ',mist:'ТУМАН'};
export const POSITIVE=new Set(KINDS.slice(0,5));
const cache=new Map();
function inside(x,y,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
export function paintSprite(ctx,kind,silhouette=false){
 const cells=new Map(),put=(x,y,c)=>{if(x>=0&&y>=0&&x<28&&y<28)cells.set(y*28+x,c);},rect=(x,y,w,h,c)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)put(i,j,c);};
 const poly=(p,c)=>{for(let y=0;y<28;y++)for(let x=0;x<28;x++)if(inside(x+.5,y+.5,p))put(x,y,c);};
 const ellipse=(x,y,rx,ry,c,hole=0)=>{for(let j=0;j<28;j++)for(let i=0;i<28;i++){const d=((i+.5-x)/rx)**2+((j+.5-y)/ry)**2;if(d<=1&&d>=hole)put(i,j,c);}};
 const ivory='#fff0bd',gold='#e0ae43',light='#fff6cf',green='#62894a',dark='#172926';
 if(kind==='harvest'){
  poly([[10,16],[17,16],[19,24],[9,24]],ivory);rect(11,17,2,6,'#ba904b');
  poly([[3,16],[4,12],[8,8],[19,8],[23,12],[25,16],[23,19],[5,19]],gold);
  rect(7,10,13,3,'#f4cf60');rect(5,16,18,2,'#a56324');rect(8,12,2,2,light);rect(18,14,3,2,light);
  poly([[8,7],[7,3],[11,5],[14,2],[17,5],[21,3],[20,7]],gold);rect(10,6,9,2,light);
  rect(5,22,5,2,green);rect(20,21,3,2,green);
 }else if(kind==='focus'){
  poly([[2,14],[7,7],[14,4],[22,8],[26,14],[21,21],[14,24],[6,20]],'#40b7c0');
  ellipse(14,14,9,7,light);ellipse(14,14,5,6,'#208dba');ellipse(14,14,3,5,dark);rect(14,10,2,2,'#e5ffff');
  rect(8,5,5,2,'#bdfbdf');rect(5,21,5,2,'#9bdc9a');
 }else if(kind==='spores'){
  for(const [x,y]of [[14,7],[7,12],[20,12],[9,20],[19,20]]){ellipse(x,y,5,5,'#7fd7c5');ellipse(x,y,3,3,'#d5f8bf');}
  ellipse(14,14,5,5,'#ad75c1');ellipse(14,14,3,3,'#fff1b7');rect(13,22,2,4,green);
  for(const [x,y]of [[3,4],[23,3],[25,22]]){rect(x,y,2,2,'#e7ffff');}
 }else if(kind==='guard'){
  poly([[5,5],[14,3],[23,5],[22,17],[18,22],[14,26],[9,22],[6,17]],gold);
  poly([[8,7],[14,6],[20,7],[19,17],[14,22],[9,17]],'#315f54');
  rect(12,9,4,9,ivory);rect(10,12,8,3,ivory);rect(6,5,6,3,green);rect(19,8,4,5,green);rect(8,18,3,3,'#9cba65');
 }else if(kind==='portalPrize'){
  ellipse(14,14,9,10,'#65c9c5',.48);ellipse(14,14,7,8,'#eedc82',.64);
  poly([[12,9],[17,9],[15,13],[19,13],[11,21],[13,15],[9,15]],'#e4fcce');
  poly([[4,7],[2,3],[7,5]],gold);poly([[22,7],[26,3],[24,9]],gold);rect(11,2,6,2,'#eaf9c1');
 }else if(kind==='rush'){
  poly([[19,2],[9,12],[14,12],[7,25],[23,12],[17,12]],'#dd6241');
  poly([[4,8],[9,10],[7,14],[2,16]],'#96303b');poly([[23,20],[26,17],[27,24],[19,26]],'#96303b');
  poly([[17,5],[12,11],[17,11],[11,20],[20,13],[15,13]],'#ffcc78');
 }else if(kind==='weak'){
  poly([[11,17],[16,17],[18,24],[10,25]],'#8d7991');
  poly([[2,17],[5,11],[10,7],[19,5],[23,10],[25,16],[20,20],[6,19]],'#69486f');
  poly([[4,14],[8,10],[12,9],[10,13],[14,13],[12,17],[8,18],[5,17]],'#aa768b');
  poly([[17,6],[14,11],[18,13],[13,19],[16,15],[12,12]],'#1d152b');rect(6,13,2,2,'#c3a1b8');rect(21,12,2,2,'#bf94aa');
  poly([[2,5],[6,7],[3,10]],'#ad5268');poly([[22,22],[27,22],[25,26]],'#ad5268');
 }else if(kind==='brambles'){
  for(const p of [[[3,6],[10,9],[20,5],[25,2],[24,12],[18,10],[10,16],[3,15]],[[7,2],[10,10],[18,19],[26,21],[24,26],[15,22],[8,14],[2,25],[3,18]],[[21,11],[23,18],[16,24],[10,26],[8,22],[17,18],[15,13]]])poly(p,'#604d3a');
  poly([[5,10],[13,11],[21,9],[20,13],[12,14],[6,19]],'#a17a51');
  for(const [x,y]of [[5,6],[14,4],[22,15],[8,19]])poly([[x,y],[x+3,y-3],[x+2,y+3]],'#a96565');
  ellipse(14,15,4,4,'#241e2b');rect(12,14,2,2,'#bb587c');
 }else{
  for(const [x,y,rx,ry]of [[7,13,4,5],[12,9,5,6],[19,12,6,5],[17,18,7,5],[7,20,3,4]])ellipse(x,y,rx,ry,'#6b657e');
  poly([[3,18],[5,24],[2,26],[9,25],[10,21],[17,23],[24,21],[27,16],[20,19],[12,16]],'#3e344f');
  ellipse(14,13,7,4,'#9e99af');rect(10,12,2,3,'#2b233c');rect(18,11,2,3,'#2b233c');rect(11,14,1,1,'#ebe6d5');rect(19,13,1,1,'#ebe6d5');
 }
 // Category edges are structural: smooth bright rim versus irregular dark
 // silhouette with hostile rose thorns. Internal grayscale values stay distinct.
 const rim=POSITIVE.has(kind)?'#d8e9a0':'#b7627d',original=[...cells];
 for(const [k]of original){const x=k%28,y=Math.floor(k/28);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(!cells.has((y+dy)*28+x+dx)&&x+dx>=0&&x+dx<28&&y+dy>=0&&y+dy<28)ctx.fillStyle=silhouette?'#f0eed9':rim,ctx.fillRect((x+dx)*2,(y+dy)*2,2,2);}
 for(const [k,c]of original){ctx.fillStyle=silhouette?'#f0eed9':c;ctx.fillRect(k%28*2,Math.floor(k/28)*2,2,2);}
}
export function sprite(kind){if(!cache.has(kind)){const c=document.createElement('canvas');c.width=c.height=56;paintSprite(c.getContext('2d'),kind);cache.set(kind,c);}return cache.get(kind);}
export function spriteURL(kind){return sprite(kind).toDataURL();}
export function drawPickup(ctx,kind,x,y,cell,tick,compact=false){
 const positive=POSITIVE.has(kind),size=cell*(compact?.94:.68),t=tick/60;
 const bob=positive?Math.sin(t*1.7)*Math.min(2,cell*.05):Math.sin(t*13)*cell*.012;
 ctx.drawImage(sprite(kind),Math.round(x-size/2),Math.round(y-size/2+bob),size,size);
 ctx.fillStyle=positive?'#d7f7b7':'#ab6381';
 for(let i=0;i<3;i++){const p=(t*.35+i/3)%1,a=i*2.1,r=cell*(positive?.27+p*.16:.48-p*.19),q=Math.max(1,cell*.025);ctx.globalAlpha=(1-p)*.65;ctx.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r-p*(positive?cell*.12:0)),q,q);}ctx.globalAlpha=1;
}
