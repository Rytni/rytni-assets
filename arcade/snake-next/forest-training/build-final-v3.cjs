// Original surface/UI finish only. No reference pixels or locked art modified.
const fs=require('node:fs'),path=require('node:path');
const {Raster,png,decode}=require('../retro-v5/raster.cjs');
const out=path.resolve(__dirname,'../../../grib/mushroom-snake-forest-final-v3');fs.mkdirSync(out,{recursive:true});
const save=(name,r)=>fs.writeFileSync(path.join(out,name+'.png'),png(r.w,r.h,r.data));
const mix=(a,b,k)=>[0,2,4].map(i=>Math.round(parseInt(b.slice(i,i+2),16)+(parseInt(a.slice(i,i+2),16)-parseInt(b.slice(i,i+2),16))*k).toString(16).padStart(2,'0')).join('');
const centers=['0b4238','0b4238','093e35','0d463b','0b4238','0b4238'];
const patches=[
 [[10,16],[24,16],[24,18],[39,18],[39,29],[31,29],[31,31],[10,31]],
 [[30,34],[52,34],[52,37],[59,37],[59,49],[44,49],[44,47],[30,47]],
 [[12,40],[30,40],[30,38],[39,38],[39,52],[25,52],[25,54],[12,54]],
 [[34,12],[51,12],[51,15],[58,15],[58,28],[47,28],[47,30],[34,30]],
 [[18,25],[30,25],[30,28],[47,28],[47,41],[36,41],[36,43],[18,43]],
 [[9,39],[22,39],[22,36],[35,36],[35,46],[28,46],[28,49],[9,49]]
];
for(let i=0;i<6;i++){
 const r=new Raster(68),center=centers[i];
 // Identical outer seam construction; only the interior material is repainted.
 r.rect(0,0,68,68,'03251f');r.rect(1,1,66,66,'0d4035');r.rect(2,2,64,64,center);
 // 70% of V2 edge-to-center RGB delta = 30% less internal bevel contrast.
 r.rect(2,2,64,2,mix('1b5848',center,.7));r.rect(2,4,2,60,mix('144b3e',center,.7));
 r.rect(4,4,60,58,center);r.rect(4,62,60,2,mix('062f27',center,.7));r.rect(64,4,2,60,mix('062d25',center,.7));r.rect(1,66,66,1,'031e19');
 // Large, quiet authored material patches, not grain or repeated horizontal bands.
 r.poly(patches[i],mix('134c40',center,.28));
 const [x,y]=[[43,44],[15,23],[45,24],[17,44],[46,17],[43,22]][i];
 r.rect(x,y,6,1,mix('155344',center,.35));r.rect(x+4,y-1,2,1,mix('155344',center,.25));
 if(i===4){r.rect(15,18,3,2,'164b3b');r.rect(18,16,2,3,'124737');r.dot(22,19,'184e3d');}
 if(i===5){r.rect(44,48,7,1,'144d40');r.rect(46,47,3,1,'185143');}
 save('tile-'+i,r);
}
for(const name of ['pause','fullscreen']){
 const icon=new Raster(32),rect=(x,y,w,h)=>{icon.rect(x+1,y+1,w,h,'293123');icon.rect(x,y,w,h,'fff1c4');};
 if(name==='pause'){rect(6,5,7,22);rect(19,5,7,22);}
 else for(const [x,y,sx,sy] of [[4,4,1,1],[28,4,-1,1],[4,28,1,-1],[28,28,-1,-1]]){rect(sx===1?x:x-9,sy===1?y:y-4,9,4);rect(sx===1?x:x-4,sy===1?y:y-9,4,9);}
 save(name,icon);
}
for(const state of ['normal','pressed']){
 const source=decode(fs.readFileSync(path.resolve(__dirname,`../../../grib/mushroom-snake-retro-v5/dpad-${state}.png`))),r=new Raster(source.w,source.h);source.data.copy(r.data);
 const palette=state==='normal'?{'5f4a27':'75512a','b29a58':'d0ac60','103d35':'0b352c','246253':'32735b','09291f':'041f19'}:{'5f4a27':'8c6130','e2c887':'f4d991','1d5c4a':'235f48','468471':'5b9470','09291f':'08281e'};
 for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++){const k=(y*r.w+x)*4;if(!r.data[k+3])continue;const c=r.data.subarray(k,k+3).toString('hex');if(palette[c])r.dot(x,y,palette[c]);}
 // Small inset highlights/shadows, never changing alpha or the 44px footprint.
 r.rect(9,7,26,1,state==='normal'?'28604c':'103b2b');r.rect(7,9,1,26,state==='normal'?'1e5140':'123e2e');
 r.rect(9,36,26,1,state==='normal'?'06271f':'4a8061');r.rect(36,9,1,26,state==='normal'?'082a22':'396e52');
 save('dpad-'+state,r);
}
