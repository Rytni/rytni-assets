// Original, manually authored 68px board tiles. No reference image inputs.
const fs=require('node:fs'),path=require('node:path');
const {Raster,png}=require('../retro-v5/raster.cjs');
const out=path.resolve(__dirname,'../../../grib/mushroom-snake-forest-board-v1');
fs.mkdirSync(out,{recursive:true});
const bases=['073a33','083b34','073932','083a34','073730','093d36','073a33','083b34'];
const patches=[[[8,15],[20,12],[27,17],[23,24],[11,26]],[[33,7],[48,8],[53,15],[43,21],[32,17]],[[7,43],[20,38],[31,44],[24,56],[10,55]],[[38,38],[55,34],[60,47],[49,55],[36,49]]];
for(let i=0;i<8;i++){
 const r=new Raster(68);r.rect(0,0,68,68,bases[i]);
 // The seam/bevel belongs to the tile, never a runtime grid overlay.
 r.rect(0,0,68,1,'082c27');r.rect(0,1,68,1,'164c42');r.rect(0,2,1,66,'16483e');
 r.rect(67,2,1,66,'052e29');r.rect(1,67,66,1,'052e29');r.rect(2,3,1,63,'0c4037');
 r.poly(patches[i%4],i%2?'093e35':'093c34');
 r.poly(patches[(i+2)%4],i%2?'07392f':'07372f');
 // A few authored wear clusters, with distinct placements rather than noise.
 const marks=[[18,34],[47,29],[34,53],[15,15],[52,47],[27,28],[13,48],[42,17]][i];
 r.rect(marks[0],marks[1],5,1,'0d4339');r.rect(marks[0]+4,marks[1]-1,2,1,'0c4036');
 if(i===6){r.rect(18,18,3,2,'144638');r.rect(20,16,2,2,'124235');r.dot(24,19,'144638');}
 if(i===7){r.rect(44,43,4,1,'14483e');r.rect(42,44,3,1,'124438');r.dot(47,42,'174b40');}
 fs.writeFileSync(path.join(out,`tile-${i}.png`),png(68,68,r.data));
}
