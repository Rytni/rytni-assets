// Isolated Retro V3 manufacture. Reads ONLY its new independent art masters.
// Targets are never opened here. Raster masks enforce verified canonical ports.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Raster,png,decode,crop,resize,bounds}=require('./raster.cjs');
const root=path.resolve(__dirname,'../../../grib/mushroom-snake-retro-v3');
const inventory=[];
const source=name=>decode(fs.readFileSync(path.join(root,'sources',name+'.png')));
function save(id,r,meta={}){
 if(meta.group==='snake'){
  // Opaque matching end caps, including rounding guard. Never a second underlying body.
  for(let p=0;p<meta.ports.length;p++){const d=meta.ports[p],radius=meta.radii[p]*2+2;
   for(let cross=36-radius;cross<36+radius;cross++)for(let u=0;u<8;u++){
    const [x,y]=[[cross,u],[71-u,cross],[cross,71-u],[u,cross]][d];
    const c=cross===36+radius-1?[188,155,104,255]:cross===36-radius?[255,247,214,255]:[249,235,195,255];r.dot(x,y,c);
   }
  }
 }
 fs.writeFileSync(path.join(root,id+'.png'),png(r.w,r.h,r.data));inventory.push({id,file:id+'.png',width:r.w,height:r.h,...meta});
 if(meta.group==='snake'){const shadow=new Raster(r.w,r.h);for(let i=0;i<r.data.length;i+=4)shadow.data.set([0,13,11,r.data[i+3]],i);save('shadow-'+id,shadow,{group:'shadow'});}
}
function fit(name,w,h){const s=source(name),b=bounds(s);return resize(crop(s,...b),w,h);}
function blit(dst,src,x,y){for(let yy=0;yy<src.h;yy++)for(let xx=0;xx<src.w;xx++){const i=(yy*src.w+xx)*4;if(src.data[i+3]>128)dst.dot(xx+x,yy+y,[...src.data.subarray(i,i+3),255]);}}
const material=resize(source('material'),256,256);
function surface(mask,variant=0){
 const r=new Raster(mask.w,mask.h),solid=(x,y)=>mask.data[(Math.max(0,Math.min(mask.h-1,y))*mask.w+Math.max(0,Math.min(mask.w-1,x)))*4+3]>128;
 for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)if(solid(x,y)){
  const mx=(x+variant*37)%256,my=(y+variant*23)%256,i=(my*256+mx)*4;
  let c=Array.from(material.data.subarray(i,i+3)).map((v,j)=>Math.round(v*.45+[250,236,196][j]*.55));
  // Broad shared material with a restrained contact bevel, never a per-cell outline.
  const top=!solid(x,y-1)||!solid(x,y-2),bottom=!solid(x,y+1)||!solid(x,y+2),side=!solid(x-1,y)||!solid(x+1,y);
  if(bottom)c=[188,155,104];else if(top)c=[255,247,214];else if(side)c=[221,191,140];
  r.dot(x,y,[...c,255]);
 }
 return r;
}
function maskPoly(points){const r=new Raster(72);r.poly(points.map(p=>p.map(v=>v*2)),'ffffff');return r;}
function leaves(r,vertical=false){
 const patches=[[[18,13],[22,10],[27,11],[25,15],[21,17]],[[13,18],[18,17],[20,20],[17,23],[13,22]]];
 for(const p of patches)r.poly(p.map(([x,y])=>[x*2,y*2]),'244f35');
 r.rect(42,24,4,2,'64824b');r.rect(28,40,4,2,'3b6542');return r;
}
const straight=maskPoly([[0,4],[36,4],[36,32],[0,32]]),corner=maskPoly([[4,0],[32,0],[32,4],[36,4],[36,32],[12,32],[4,24]]);
const taper=maskPoly([[0,4],[8,4],[36,8],[36,28],[8,32],[0,32]]);
const tail=maskPoly([[0,8],[8,8],[18,12],[26,17],[26,19],[18,24],[8,28],[0,28]]);
const names=['up','right','down','left'];
for(let d=0;d<4;d++){
 const n=(d+3)%4;
 save('snake-tail-'+names[d],surface(tail.rotate(n)),{group:'snake',ports:[(d+2)%4],radii:[9],logicalSize:36});
 const c=corner.rotate(d),a=d,b=(d+1)%4;
 save('snake-corner-'+names[a]+'-'+names[b],surface(c),{group:'snake',ports:[a,b],radii:[13,13],logicalSize:36});
 for(const reverse of [false,true]){
  // Narrow the outgoing connector only, preserving its predecessor's full port.
  const m=new Raster(72);m.data.set(c.data);const outgoing=reverse?a:b;
  for(let y=0;y<72;y++)for(let x=0;x<72;x++){
   const along=[36-y,x-36,y-36,36-x][outgoing],cross=[x-36,y-36,x-36,y-36][outgoing];
   if(along>0&&Math.abs(cross)<=28&&Math.abs(cross)>28-Math.min(8,along*8/36))m.data[(y*72+x)*4+3]=0;
  }
  save('snake-taper-corner-'+names[a]+'-'+names[b]+(reverse?'-reverse':''),surface(m),{group:'snake',ports:[a,b],radii:reverse?[9,13]:[13,9],logicalSize:36});
 }
}
for(const [axis,n,ports]of [['horizontal',0,[3,1]],['vertical',1,[0,2]]]){
 for(let v=0;v<4;v++)save('snake-body-'+axis+(v?'-v'+v:''),v===3?leaves(surface(straight.rotate(n),v)):surface(straight.rotate(n),v),{group:'snake',ports,radii:[13,13],logicalSize:36});
 save('snake-taper-'+axis,surface(taper.rotate(n)),{group:'snake',ports,radii:[13,9],logicalSize:36});
}
// New generated head. Use only this independently drawn production master.
const hs=source('head'),h=new Raster(72);
blit(h,surface(maskPoly([[0,4],[18,4],[25,10],[25,26],[18,32],[0,32]])),0,0);
// Face/rear mushroom are framed locally; no target pixels and no extra body below tail.
blit(h,resize(crop(hs,650,440,525,455),86,72),-14,0);
for(let d=0;d<4;d++)save('snake-head-'+names[d],h.rotate((d+3)%4),{group:'snake',ports:[(d+2)%4],radii:[13],logicalSize:36});
save('logo',fit('logo',480,151),{group:'shell'});
const fm=resize(source('frame'),768,512),cut=128;
for(const [name,x,y]of [['top-left',0,0],['top-right',640,0],['bottom-left',0,384],['bottom-right',640,384]])save('frame-'+name,crop(fm,x,y,cut,cut),{group:'shell',fixedCorner:true});
save('frame-top',crop(fm,128,38,512,28),{group:'shell',axis:'x'});
save('frame-bottom',crop(fm,128,446,512,28),{group:'shell',axis:'x'});
save('frame-left',crop(fm,25,140,32,70),{group:'shell',axis:'y'});
save('frame-right',crop(fm,711,140,32,70),{group:'shell',axis:'y'});
save('frame-joint-left',crop(fm,18,215,46,64),{group:'shell',fixedCorner:true});
save('frame-joint-right',crop(fm,704,215,46,64),{group:'shell',fixedCorner:true});
const hud=source('hud');save('hud',resize(crop(hud,0,274,1536,460),512,154),{group:'shell',slice:64});
for(const [name,w,h]of [['seed',44,64],['positive',88,54],['negative',72,72],['portal',128,128],['stone',64,64]])save(name,fit(name,w,h),{group:'object'});
// Quiet emerald ground: four-cell macro atlas; no extra retained ground canvas.
const floor=new Raster(256);let state=621;
for(let y=0;y<256;y++)for(let x=0;x<256;x++){
 state=(Math.imul(state,1664525)+1013904223)>>>0;
 const patch=Math.sin(x*.019+y*.013)*2+Math.cos(y*.028-x*.011)*2,noise=(state>>>29)-3;
 floor.dot(x,y,[3+Math.max(0,patch),41+patch+noise,36+patch+noise,255]);
 if(x%64===0||y%64===0)floor.dot(x,y,[21,77,65,255]);
 if(x%64===1||y%64===1)floor.dot(x,y,[2,29,26,255]);
}
save('floor',floor,{group:'ground',macroCells:4});
// Independent production VFX sheets, manufactured into bounded six-frame atlases.
// Frames share a fixed slot/pivot; no per-frame trim, radial-dot template or runtime blur.
for(const type of ['food','positive','negative','portal-enter','portal-exit']){
 const atlas=new Raster(96*6,96),src=source(type.startsWith('portal')?'vfx-portal':'vfx-'+type),sw=src.w/3,sh=src.h/2;
 for(let f=0;f<6;f++){
  const index=type==='portal-exit'?5-f:f,r=resize(crop(src,(index%3)*sw,Math.floor(index/3)*sh,sw,sh),96,96);
  for(let y=0;y<96;y++)for(let x=0;x<96;x++)atlas.dot(f*96+x,y,Array.from(r.data.subarray((y*96+x)*4,(y*96+x)*4+4)));
 }
 save('vfx-'+type,atlas,{group:'vfx',frames:6,frameWidth:96,frameHeight:96,durationMs:type.startsWith('portal')?420:360,method:'independent ImageGen animation master; fixed slot manufacture'});
}
const provenance=fs.readdirSync(path.join(root,'sources')).filter(n=>n.endsWith('.png')).map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'sources',file))).digest('hex'),method:'built-in ImageGen; independent generation; targets style-only'}));
fs.writeFileSync(path.join(root,'inventory.json'),JSON.stringify({version:3,cell:32,snakeSource:72,logicalSize:36,overhang:2,bodyDiameter:28,connectorDiameter:26,roundingGuard:1,tailBaseDiameter:20,assets:inventory,provenance},null,2)+'\n');
console.log(JSON.stringify({assets:inventory.length,decodedBytes:inventory.reduce((n,a)=>n+a.width*a.height*4,0)}));
