import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fixtures,routePieces,pieces,CELL} from './geometry.mjs';
import {variant} from './material.mjs';
const require=createRequire(import.meta.url),{png,decode}=require('./raster.cjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),out=path.join(root,'docs/qa/retro-v5-3'),art=path.join(root,'grib/mushroom-snake-retro-v5');
fs.mkdirSync(out,{recursive:true});
const cache=new Map(),images=[];
const baseline=process.argv.includes('--baseline'),prefix=baseline?'v52-':'';
const load=id=>{if(!cache.has(id))cache.set(id,decode(baseline?execFileSync('git',['show','e17dffae848f0ab7c97c21bd3fae28f21e2624a3:grib/mushroom-snake-retro-v5/'+id+'.png'],{cwd:root}):fs.readFileSync(path.join(art,id+'.png'))));return cache.get(id)};
function save(id,label,w,h,data){fs.writeFileSync(path.join(out,id+'.png'),png(w,h,data));images.push({id,label,file:id+'.png',width:w,height:h,native:true});}
function scene(id,label,placements) {
  const minX=Math.min(...placements.map(p=>p.point[0])),maxX=Math.max(...placements.map(p=>p.point[0])),minY=Math.min(...placements.map(p=>p.point[1])),maxY=Math.max(...placements.map(p=>p.point[1]));
  const w=(maxX-minX+1)*68+48,h=(maxY-minY+1)*68+48,data=Buffer.alloc(w*h*4);
  for(const [i,p] of placements.entries()) {
    const v=p.piece.kind==='head'||p.piece.kind==='neck'?0:variant(i-200),r=load(p.piece.name+'-v'+v);
    const ox=(p.point[0]-minX)*68+24,oy=(p.point[1]-minY)*68+24;
    for(let y=0;y<68;y++)for(let x=0;x<68;x++)if(r.data[(y*68+x)*4+3])r.data.copy(data,((y+oy)*w+x+ox)*4,(y*68+x)*4,(y*68+x+1)*4);
  }
  save(prefix+id,label,w,h,data);
}
for(const id of ['straight-8','straight-30','tight-U','S','head-neck','taper-tail']) {
  const f=fixtures.find(f=>f.id===id);let placements=routePieces(f.route);
  if(id==='head-neck')placements=placements.slice(-3);
  if(id==='taper-tail')placements=[{point:[0,0],piece:pieces.find(p=>p.name==='straight-0')},{point:[1,0],piece:pieces.find(p=>p.name==='straight-0')},{point:[2,0],piece:pieces.find(p=>p.name==='terminal-0')}];
  scene(id,f.label+' — cell68 / body36 native',placements);
}
scene('four-corners','Four corners — same material, world-space lighting',pieces.filter(p=>p.kind==='corner').map((piece,i)=>({piece,point:[i*2,0]})));
scene('body-crop','Body native-scale crop / four cells with wrapping authored accents',[
 {point:[0,0],piece:pieces.find(p=>p.name==='straight-0')},
 {point:[1,0],piece:pieces.find(p=>p.name==='straight-0')},
 {point:[2,0],piece:pieces.find(p=>p.name==='straight-0')},
 {point:[3,0],piece:pieces.find(p=>p.name==='straight-0')}
]);
scene('corner-crop','Corner native crop / straight → corner → straight',[
 {point:[0,1],piece:pieces.find(p=>p.name==='straight-0')},
 {point:[1,1],piece:pieces.find(p=>p.name==='corner-0')},
 {point:[1,0],piece:pieces.find(p=>p.name==='straight-1')}
]);
fs.writeFileSync(path.join(out,prefix+'native-gallery.json'),JSON.stringify(images,null,2)+'\n');
console.log('Native review PNGs: '+images.length);
