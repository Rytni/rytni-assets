// Original manually authored raster material; approved V5.1 masks are immutable.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {CELL,pieces,rotate} from './geometry.mjs';
const require=createRequire(import.meta.url),{Raster,png,decode}=require('./raster.cjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const out=path.join(root,'grib/mushroom-snake-retro-v5');
fs.mkdirSync(out,{recursive:true});
const assets=[],rasters=new Map();
function save(id,r,provenance='Original manually authored raster') {
  const bytes=png(r.w,r.h,r.data);fs.writeFileSync(path.join(out,id+'.png'),bytes);
  rasters.set(id,r);assets.push({id,file:id+'.png',width:r.w,height:r.h,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),provenance});
}
const P={base:'eee6d2',light:'fff7e4',mid:'f5eedb',shadow:'d5c6a8',deep:'baa98a',moss:'31523a',leaf:'56734a',red:'b44135'};
function material(piece,variant) {
  const r=new Raster(CELL),mask=piece.mask;
  const inside=(x,y)=>{
    if(x>=0&&y>=0&&x<CELL&&y<CELL)return !!mask[y*CELL+x];
    if(x<0&&y>=0&&y<CELL&&piece.ports.includes(3))return !!mask[y*CELL];
    if(x>=CELL&&y>=0&&y<CELL&&piece.ports.includes(1))return !!mask[y*CELL+CELL-1];
    if(y<0&&x>=0&&x<CELL&&piece.ports.includes(0))return !!mask[x];
    if(y>=CELL&&x>=0&&x<CELL&&piece.ports.includes(2))return !!mask[(CELL-1)*CELL+x];
    return false;
  };
  const distance=(x,y,dx,dy)=>{for(let d=1;d<=4;d++)if(!inside(x+dx*d,y+dy*d))return d;return 5};
  for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++)if(mask[y*CELL+x]) {
    const upper=Math.min(distance(x,y,0,-1),distance(x,y,-1,0));
    const lower=Math.min(distance(x,y,0,1),distance(x,y,1,0));
    const c=lower<=1?P.deep:lower<=3?P.shadow:upper<=2?P.light:upper<=4?P.mid:P.base;
    r.dot(x,y,c);
  }
  const put=(x,y,c)=>{if(x>=0&&y>=0&&x<CELL&&y<CELL&&mask[y*CELL+x])r.dot(x,y,c)};
  // Quiet authored clusters, never random procedural noise and never at sockets.
  const patterns=[[[24,28,3,1],[42,36,2,1]],[[29,37,2,1]],[[38,27,3,1]],[[21,35,2,1],[44,29,2,1]],[]];
  for(const [x,y,w,h] of patterns[variant%5])for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)put(x+dx,y+dy,'f2ead7');
  if(variant===5)for(const [x,y,c] of [[28,29,P.moss],[29,29,P.moss],[30,30,P.leaf],[28,30,P.leaf],[27,31,P.moss],[29,31,P.moss]])put(x,y,c);
  if(variant===6)for(const [x,y,c] of [[37,34,P.moss],[38,33,P.leaf],[39,32,P.leaf],[39,33,P.leaf],[40,32,P.moss]])put(x,y,c);
  if(variant===7) {
    for(let x=31;x<=35;x++)put(x,29,P.red);
    for(let x=32;x<=34;x++)put(x,28,P.red);
    put(33,28,'ffe6c4');put(33,30,P.shadow);put(33,31,P.shadow);
  }
  if(piece.kind==='head') {
    const turn=Number(piece.name.at(-1));
    const feature=(x,y,c)=>{for(let i=0;i<turn;i++)[x,y]=[67-y,x];put(x,y,c)};
    for(const ey of [24,40])for(let y=ey;y<ey+4;y++)for(let x=46;x<50;x++)feature(x,y,'17362c');
    feature(47,24,'fffae9');feature(47,40,'fffae9');
    for(let x=57;x<60;x++)feature(x,34,'675641');
    for(let x=22;x<=30;x++)feature(x,22,P.red);
    for(let x=23;x<=29;x++)feature(x,21,P.red);
    for(let x=24;x<=28;x++)feature(x,20,P.red);
    feature(25,20,'fff0d8');feature(28,21,'f1aa79');feature(26,23,P.shadow);feature(26,24,P.shadow);
    for(const [x,y] of [[20,25],[21,26],[20,27],[22,25]])feature(x,y,P.moss);
  }
  return r;
}
for(const piece of pieces) {
  const variants=piece.kind==='head'?1:8;
  for(let v=0;v<variants;v++)save(piece.name+'-v'+v,material(piece,v));
}
for(let v=0;v<10;v++) {
  const r=new Raster(CELL);r.rect(0,0,68,68,'062e2a');r.rect(1,1,66,66,'0b4940');
  r.rect(2,2,64,64,['093d34','0a3e35','083b33','093c35','093e36','0a3c34','083c34','0a3d35','093c34','093d34'][v]);
  r.rect(2,65,64,1,'07362f');r.rect(65,2,1,64,'07362f');
  // Deliberately low-contrast authored material shapes, not per-pixel noise.
  const marks=[[[17,23,10,2],[42,48,6,1]],[[31,18,9,1]],[[20,42,12,1]],[[40,27,7,2]],[[27,33,5,1]],[[13,50,8,1]],[[44,41,9,1]],[[28,21,7,1]],[[18,37,6,2]],[[36,44,8,2]]][v];
  for(const [x,y,w,h] of marks)r.rect(x,y,w,h,v>=8?'0e4438':'0c4138');
  save('floor-'+v,r);
}
for(const state of ['normal','pressed']) {
  const r=new Raster(44);r.poly([[5,0],[38,0],[43,5],[43,38],[38,43],[5,43],[0,38],[0,5]],'5f4a27');
  r.poly([[5,2],[38,2],[41,5],[41,38],[38,41],[5,41],[2,38],[2,5]],state==='normal'?'b29a58':'e2c887');
  r.poly([[7,5],[36,5],[39,8],[39,35],[36,38],[7,38],[5,36],[5,8]],state==='normal'?'103d35':'1d5c4a');
  r.rect(9,7,26,1,state==='normal'?'246253':'468471');r.rect(9,36,26,2,'09291f');
  save('dpad-'+state,r);
}
for(const [id,palette] of [['seed',['fff3c7','efbd58','c68d2b']],['positive',['defdf2','68d7d3','338dad']],['negative',['f4b3fa','c154cc','683676']],['portal',['caf5fc','66dbe7','7d69c4']]]) {
  const r=new Raster(48*4,48);
  for(let f=0;f<4;f++) {
    const origin=f*48,spread=3+f*4;
    if(f<3)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]) {
      const x=origin+24+dx*spread,y=24+dy*spread,b=f===3?1:2;
      r.rect(x,y,b,b,palette[(dx+dy+4)%3]);if(f<2)r.rect(x+1,y-1,1,1,palette[0]);
    }
    if(f===0){r.rect(origin+23,19,2,10,palette[0]);r.rect(origin+19,23,10,2,palette[0]);}
    if(f===3){r.rect(origin+13,12,1,1,palette[1]);r.rect(origin+33,35,1,1,palette[2]);}
  }
  save('vfx-'+id,r);
}
const frozen=['logo','hud','seed','positive','negative','portal','stone','frame-top','frame-bottom','frame-left','frame-right','frame-top-left','frame-top-right','frame-bottom-left','frame-bottom-right','frame-joint-left','frame-joint-right'];
for(const id of frozen) {
  const file=id+'.png',source=path.join(root,'grib/mushroom-snake-retro-v3',file),bytes=fs.readFileSync(source),r=decode(bytes);
  fs.copyFileSync(source,path.join(out,file));
  assets.push({id,file,width:r.w,height:r.h,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),provenance:'Unchanged existing Retro V3 cabinet/object raster; no concept extraction'});
}
let mismatch=0;
for(const piece of pieces)for(const asset of assets.filter(a=>a.id.startsWith(piece.name+'-v'))) {
  const decoded=decode(fs.readFileSync(path.join(out,asset.file)));
  for(let i=0;i<CELL*CELL;i++)if(decoded.data[i*4+3]!==piece.mask[i]*255)mismatch++;
}
if(mismatch)throw Error('Artwork changed locked alpha masks: '+mismatch);
const geometryHash=crypto.createHash('sha256').update(fs.readFileSync(new URL('./geometry.mjs',import.meta.url))).digest('hex');
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify({version:'retro-v5.2-review',imageGenOperations:0,cell:68,body:36,head:42,terminal:68,geometryHash,maskMismatch:mismatch,assets},null,2)+'\n');
console.log(JSON.stringify({assets:assets.length,geometryHash,maskMismatch:mismatch,imageGenOperations:0}));
