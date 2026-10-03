// Original pixel assets; no TARGET images, sampling, extraction or external art.
const fs=require('node:fs'),path=require('node:path');
const {Raster,png}=require('../retro-v5/raster.cjs');
const out=path.resolve(__dirname,'../../../grib/mushroom-snake-forest-cabinet-v2');fs.mkdirSync(out,{recursive:true});
const save=(name,r)=>fs.writeFileSync(path.join(out,name+'.png'),png(r.w,r.h,r.data));
const variants=[['083c34','0f4a3e','0b4238'],['073a32','104c40','0a4036'],['06392f','0d483a','094035'],['093e35','114c40','0c443a'],['06372f','0d4439','083c33'],['0a4037','124f42','0c453b'],['083c34','0f493b','0b4136'],['073b34','0e493d','0a4239']];
for(let i=0;i<8;i++){
 const r=new Raster(68),[base,lit,center]=variants[i];r.rect(0,0,68,68,'03251f');
 r.rect(1,1,66,66,'0d4035');r.rect(2,2,64,64,base);
 r.rect(2,2,64,2,'1b5848');r.rect(2,4,2,60,'144b3e');r.rect(4,4,60,58,center);
 r.poly([[4,4],[64,4],[64,9],[48,9],[48,11],[27,11],[27,13],[4,13]],lit);
 r.poly([[4,13],[27,13],[27,11],[48,11],[48,9],[64,9],[64,24],[59,24],[59,26],[23,26],[23,24],[4,24]],base);
 r.poly([[4,47],[21,47],[21,49],[43,49],[43,47],[64,47],[64,62],[4,62]],base);
 r.rect(4,62,60,2,'062f27');r.rect(64,4,2,60,'062d25');r.rect(1,66,66,1,'031e19');
 // Authored low-contrast material clusters (no procedural grain/noise).
 const x=[12,39,26,17,42,31,13,44][i],y=[31,38,41,35,30,36,39,32][i];
 r.rect(x,y,5,1,lit);r.rect(x+3,y-1,2,1,lit);r.rect(x+16>57?x-12:x+16,y+9,4,1,base);
 if(i===6){r.rect(14,16,3,2,'235540');r.rect(17,14,2,3,'1b4d3b');r.dot(21,17,'245943');}
 if(i===7){r.rect(44,47,7,1,'1c5646');r.rect(46,46,3,1,'205b4b');r.rect(51,48,2,1,'164d3e');}
 save('tile-'+i,r);
}
// Chunky 32px nine-slice corners, 14px wood, inner brass bevel, deep inset.
const r=new Raster(256,128);r.rect(3,0,250,128,'180f09');r.rect(0,3,256,122,'180f09');
r.rect(3,3,250,122,'806030');r.rect(5,5,246,118,'ddac4d');r.rect(7,7,242,114,'3e2314');
r.rect(9,9,238,110,'985024');r.rect(10,10,236,3,'c67b35');r.rect(10,13,236,3,'ae6229');
r.rect(10,112,236,5,'532613');r.rect(10,117,236,2,'ac662a');r.rect(10,16,5,96,'82421e');r.rect(241,16,5,96,'522b17');
r.rect(17,17,222,94,'2b1e12');r.rect(18,18,220,92,'c28e36');r.rect(20,20,216,88,'4f3c20');r.rect(22,22,212,84,'04130f');
r.rect(24,24,208,80,'061e19');r.rect(24,24,208,3,'020d0a');r.rect(24,27,3,77,'04130f');
r.rect(28,29,204,73,'07211b');r.rect(28,29,204,5,'041813');r.rect(28,99,204,3,'0a2a20');
r.poly([[34,41],[96,35],[173,42],[226,38],[226,62],[184,70],[91,67],[34,76]],'08221b');
for(const [x,y,w] of [[35,11,38],[90,13,31],[160,11,50],[39,115,53],[129,116,60]]){r.rect(x,y,w,1,'713619');r.rect(x+3,y+1,w-8,1,'ba6c2c');}
for(const [x,y] of [[5,5],[225,5],[5,97],[225,97]]){
 r.rect(x,y,26,26,'281b0c');r.rect(x+1,y+1,24,24,'f0bd54');r.rect(x+3,y+3,20,20,'9b6123');
 r.rect(x+4,y+4,18,3,'ffe3a2');r.rect(x+4,y+7,3,15,'e7b550');r.rect(x+7,y+19,15,3,'603a17');r.rect(x+19,y+7,3,12,'794718');
 r.rect(x+8,y+8,10,10,'6b451c');r.rect(x+10,y+10,6,6,'f2c368');r.rect(x+10,y+10,6,2,'fff0b0');r.rect(x+14,y+12,2,4,'b17b2d');
}
save('module',r);
for(const name of ['pause','fullscreen']){
 const icon=new Raster(32),ink='fff1c4',shadow='293123';
 const rect=(x,y,w,h)=>{icon.rect(x+1,y+1,w,h,shadow);icon.rect(x,y,w,h,ink);};
 if(name==='pause'){rect(7,5,6,22);rect(19,5,6,22);}
 else{for(const [x,y,sx,sy] of [[4,4,1,1],[28,4,-1,1],[4,28,1,-1],[28,28,-1,-1]]){rect(sx===1?x:x-9,sy===1?y:y-3,9,3);rect(sx===1?x:x-3,sy===1?y:y-9,3,9);}}
 save(name,icon);
}
