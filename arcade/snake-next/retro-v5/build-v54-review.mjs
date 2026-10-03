// Native review only: original sprite composites, never reference-image extraction.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {fixtures,routePieces,pieces,CELL} from './geometry.mjs';
import {variant} from './material.mjs';
const {png,decode,resize}=createRequire(import.meta.url)('./raster.cjs');
const root=fileURLToPath(new URL('../../../',import.meta.url)),out=new URL('../../../docs/qa/retro-v5-4/',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const baseline=process.argv.includes('--baseline'),prefix=baseline?'v53-':'',cache=new Map(),images=[];
const load=id=>{
  if(!cache.has(id))cache.set(id,decode(baseline?execFileSync('git',['show','ebc38bf7250ddcc57f6ef737642c8921c5b0834a:grib/mushroom-snake-retro-v5/'+id+'.png'],{cwd:root}):fs.readFileSync(new URL('../../../grib/mushroom-snake-retro-v5/'+id+'.png',import.meta.url))));
  return cache.get(id);
};
function scene(id,label,placements){
  const minX=Math.min(...placements.map(p=>p.point[0])),maxX=Math.max(...placements.map(p=>p.point[0])),minY=Math.min(...placements.map(p=>p.point[1])),maxY=Math.max(...placements.map(p=>p.point[1]));
  const w=(maxX-minX+1)*CELL+48,h=(maxY-minY+1)*CELL+48,data=Buffer.alloc(w*h*4);
  for(const [i,p]of placements.entries()){
    const v=p.variant??(p.piece.kind==='head'||p.piece.kind==='neck'?0:variant(i-200));
    const image=load(p.piece.name+'-v'+v),ox=(p.point[0]-minX)*CELL+24,oy=(p.point[1]-minY)*CELL+24;
    for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++)if(image.data[(y*CELL+x)*4+3])image.data.copy(data,((y+oy)*w+x+ox)*4,(y*CELL+x)*4,(y*CELL+x+1)*4);
  }
  const file=prefix+id+'.png';fs.writeFileSync(new URL(file,out),png(w,h,data));images.push({id,label,file,width:w,height:h,native:true});
  return {w,h,data};
}
for(const id of ['straight-8','straight-30','head-neck','tight-U','S']){
  let placements=routePieces(fixtures.find(f=>f.id===id).route);
  if(id==='head-neck')placements=placements.slice(-3);
  const image=scene(id,id+' / cell68, body36 / 100%',placements);
  if(id==='head-neck'&&!baseline){const big=resize(image,image.w*3,image.h*3);fs.writeFileSync(new URL('head-neck-300.png',out),png(big.w,big.h,big.data));}
}
const piece=name=>pieces.find(p=>p.name===name);
scene('body','Body / native runtime material selection',Array.from({length:8},(_,i)=>({point:[i,0],piece:piece('straight-0')})));
scene('taper-tail','Body → taper → tail / exact 68px terminal',Array.from({length:3},(_,i)=>({point:[i,0],piece:piece(i===2?'terminal-0':'straight-0'),variant:i===2?5:0})));
scene('four-corners','All four corners / same light and material',pieces.filter(p=>p.kind==='corner').map((piece,i)=>({point:[i*2,0],piece,variant:6})));
scene('corner-joint','Straight → corner → straight / wrapping island',[
  {point:[0,1],piece:piece('straight-0'),variant:0},{point:[1,1],piece:piece('corner-0'),variant:6},{point:[1,0],piece:piece('straight-1'),variant:0}
]);
scene('variants','Eight authored variants / proof catalog, NOT runtime accent density',Array.from({length:8},(_,i)=>({point:[i%4*2,Math.floor(i/4)*2],piece:piece('straight-0'),variant:i})));
fs.writeFileSync(new URL(prefix+'native-gallery.json',out),JSON.stringify(images,null,2)+'\n');
console.log(prefix+'native outputs: '+images.length);
