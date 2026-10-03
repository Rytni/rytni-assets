// Original authored pixel sprites, independent of TARGET/reference pixels.
const fs=require('node:fs'),path=require('node:path');
const {Raster,png}=require('../retro-v5/raster.cjs');
const out=path.resolve(__dirname,'../../../grib/mushroom-snake-forest-food');fs.mkdirSync(out,{recursive:true});
const save=(name,r)=>fs.writeFileSync(path.join(out,name+'.png'),png(r.w,r.h,r.data));
for(const golden of [false,true]){
 const r=new Raster(48,43),p=golden?['503522','a26922','d29c37','f5c85a','ffe4a0']:['4a2726','962c31','ca3938','ed6650','fff6df'];
 // Compact stem; warm ivory material shared with the locked Snake palette.
 r.poly([[17,20],[32,20],[30,31],[30,36],[35,39],[35,43],[12,43],[12,39],[17,36]],'493e30');
 r.poly([[19,21],[30,21],[28,32],[29,38],[33,40],[33,42],[14,42],[14,40],[19,37]],'c9b58a');
 r.poly([[20,22],[27,22],[25,33],[26,39],[19,39],[21,33]],'f0e2b7');r.rect(20,23,3,11,'fff0c9');r.rect(16,40,15,1,'e1ce9f');
 // Stepped mushroom cap, not a fruit or buff silhouette. Native density 1–3px.
 r.poly([[17,0],[31,0],[31,2],[37,2],[37,5],[41,5],[41,8],[44,8],[44,11],[46,11],[46,14],[48,14],[48,22],[44,22],[44,24],[4,24],[4,22],[0,22],[0,14],[2,14],[2,11],[4,11],[4,8],[7,8],[7,5],[11,5],[11,2],[17,2]],p[0]);
 r.poly([[17,2],[30,2],[30,4],[36,4],[36,7],[40,7],[40,10],[43,10],[43,13],[45,13],[45,16],[46,16],[46,20],[42,20],[42,22],[6,22],[6,20],[2,20],[2,16],[3,16],[3,13],[6,13],[6,10],[9,10],[9,7],[13,7],[13,4],[17,4]],p[2]);
 r.poly([[17,3],[30,3],[30,5],[35,5],[35,7],[30,7],[30,9],[17,9],[17,11],[9,11],[9,9],[12,9],[12,6],[17,6]],p[3]);
 r.rect(5,19,38,2,p[1]);r.rect(9,21,30,1,p[1]);r.rect(9,18,11,1,p[3]);
 // Recognizable small light spots, not a glossy bloom.
 for(const [x,y,w,h] of [[20,5,4,3],[31,10,4,3],[11,13,3,3],[24,16,3,2],[39,16,2,2]]){r.rect(x,y,w,h,p[4]);r.dot(x+w-1,y+h-1,'dfca9c');}
 save(golden?'food-gold':'food-red',r);
}
// Four tiny pixel-pop frames, six authored spores; no ring or following trail.
const pop=new Raster(192,48),spores=[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]];
for(let frame=0;frame<4;frame++){
 const radius=[4,8,13,18][frame],ink=['fff0c9','f1d597','d2b87b','9a955f'][frame];
 for(let i=0;i<6;i++){const [sx,sy]=spores[i],x=frame*48+24+sx*(radius+(i%2)),y=24+sy*radius-(i%3);pop.rect(x,y,frame===3?1:2,frame===3?1:2,ink);}
 if(frame===0){pop.rect(22,21,4,2,'e45c45');pop.rect(23,23,2,3,'eedbb0');}
}
save('food-pop',pop);
