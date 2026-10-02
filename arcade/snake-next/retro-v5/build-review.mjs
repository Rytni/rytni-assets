import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {fixtures,routePieces,pieces,CELL} from './geometry.mjs';
import {variant} from './material.mjs';
const require=createRequire(import.meta.url),{png,decode}=require('./raster.cjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),out=path.join(root,'docs/qa/retro-v5-2'),art=path.join(root,'grib/mushroom-snake-retro-v5');
fs.mkdirSync(out,{recursive:true});
const cache=new Map(),images=[];
const load=id=>{if(!cache.has(id))cache.set(id,decode(fs.readFileSync(path.join(art,id+'.png'))));return cache.get(id)};
function save(id,label,w,h,data){fs.writeFileSync(path.join(out,id+'.png'),png(w,h,data));images.push({id,label,file:id+'.png',width:w,height:h,native:true});}
function scene(id,label,placements) {
  const minX=Math.min(...placements.map(p=>p.point[0])),maxX=Math.max(...placements.map(p=>p.point[0])),minY=Math.min(...placements.map(p=>p.point[1])),maxY=Math.max(...placements.map(p=>p.point[1]));
  const w=(maxX-minX+1)*68+48,h=(maxY-minY+1)*68+48,data=Buffer.alloc(w*h*4);
  for(const [i,p] of placements.entries()) {
    const v=p.piece.kind==='head'||p.piece.kind==='neck'?0:variant(i-200),r=load(p.piece.name+'-v'+v);
    const ox=(p.point[0]-minX)*68+24,oy=(p.point[1]-minY)*68+24;
    for(let y=0;y<68;y++)for(let x=0;x<68;x++)if(r.data[(y*68+x)*4+3])r.data.copy(data,((y+oy)*w+x+ox)*4,(y*68+x)*4,(y*68+x+1)*4);
  }
  save(id,label,w,h,data);
}
for(const id of ['straight-8','straight-30','tight-U','S','head-neck','taper-tail']) {
  const f=fixtures.find(f=>f.id===id);let placements=routePieces(f.route);
  if(id==='head-neck')placements=placements.slice(-3);
  if(id==='taper-tail')placements=[{point:[0,0],piece:pieces.find(p=>p.name==='straight-0')},{point:[1,0],piece:pieces.find(p=>p.name==='straight-0')},{point:[2,0],piece:pieces.find(p=>p.name==='terminal-0')}];
  scene(id,f.label+' — cell68 / body36 native',placements);
}
scene('four-corners','Four corners — same material, world-space lighting',pieces.filter(p=>p.kind==='corner').map((piece,i)=>({piece,point:[i*2,0]})));
const objs=['seed','positive','negative','stone','portal'],w=objs.length*136,h=160,data=Buffer.alloc(w*h*4);
for(const [i,id]of objs.entries()) {
  const im=load(id),size=id==='portal'?84:60,height=Math.round(size*im.h/im.w),ox=i*136+Math.round((136-size)/2),oy=Math.round((h-height)/2);
  for(let y=0;y<height;y++)for(let x=0;x<size;x++){const at=(Math.floor(y*im.h/height)*im.w+Math.floor(x*im.w/size))*4;if(im.data[at+3])im.data.copy(data,((oy+y)*w+ox+x)*4,at,at+4);}
}
save('object-grammar','FOOD / POSITIVE / NEGATIVE / COLLISION / PORTAL',w,h,data);
const fw=192,fh=48*4,fx=Buffer.alloc(fw*fh*4);
for(const[i,id]of ['seed','positive','negative','portal'].entries())load('vfx-'+id).data.copy(fx,i*48*fw*4);
save('vfx-contact','VFX contact sheet: seed / positive / negative / portal; 4 frames each',fw,fh,fx);
fs.writeFileSync(path.join(out,'native-gallery.json'),JSON.stringify(images,null,2)+'\n');
console.log('Native review PNGs: '+images.length);
