/* Green Forest presentation. World units remain simulation cells. */
(function(root){
 'use strict';
 const {snapshot}=root.MushroomSnakeSegments;
 const SCALE={rows:12,columns:30,head:1.35,body:1.04,food:.9,obstacle:1};
 const geometry=new URLSearchParams(location.search).has('snake_geometry');
 const BASE='https://rytni.github.io/rytni-assets/grib/mushroom-snake-v2/';
 const {hash,CHUNK,EFFECTS,BIOMES,DX,DY}=root.MushroomSnakeCore;
 const clusterStrength=(x,y,seed,spacing=8)=>{
  const gx=Math.floor(x/spacing),gy=Math.floor(y/spacing);let strength=0;
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
   const px=gx+ox,py=gy+oy,n=hash(px,py,seed^0x62f35a71);if((n&7)>3)continue;
   const cx=px*spacing+1+((n>>>5)%Math.max(1,spacing-2)),cy=py*spacing+1+((n>>>12)%Math.max(1,spacing-2));
   const radius=2.3+((n>>>20)&7)*.23,distance=Math.hypot(x-cx,y-cy);
   strength=Math.max(strength,1-distance/radius);
  }
  return Math.max(0,strength);
 };
 const transitionNoise=(x,y,scale,seed)=>{
  const gx=Math.floor(x/scale),gy=Math.floor(y/scale),fx=x/scale-gx,fy=y/scale-gy;
  const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),sample=(dx,dy)=>hash(gx+dx,gy+dy,seed)/2147483648-1;
  const a=sample(0,0)*(1-sx)+sample(1,0)*sx,b=sample(0,1)*(1-sx)+sample(1,1)*sx;
  return a*(1-sy)+b*sy;
 };
 async function picture(name){const image=new Image();image.crossOrigin='anonymous';image.src=BASE+name+'.png';await image.decode();return image;}
 function frames(image,cols,rows){
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
  const data=c.getImageData(0,0,image.width,image.height).data;if(data[3]!==0)throw Error('Forest sprite sheet requires transparency');
  const result=[];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const x0=Math.floor(col*image.width/cols),x1=Math.floor((col+1)*image.width/cols),y0=Math.floor(row*image.height/rows),y1=Math.floor((row+1)*image.height/rows);
   let x=x1,y=y1,r=-1,b=-1;
   for(let py=y0;py<y1;py++)for(let px=x0;px<x1;px++)if(data[(py*image.width+px)*4+3]>24){x=Math.min(x,px);y=Math.min(y,py);r=Math.max(r,px);b=Math.max(b,py);}
   if(r<x)throw Error('Empty Forest sprite');result.push({x,y,w:r-x+1,h:b-y+1});
  }return result;
 }
 const Forest={SCALE,geometry,
  async load(){
   if(this.ready)return this.ready;
   this.ready=(async()=>{
    const image=new Image();image.crossOrigin='anonymous';
    image.src='https://rytni.github.io/rytni-assets/grib/mushroom-snake-v2/forest-snake-atlas-v1.png';await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
    const pixels=c.getImageData(0,0,image.width,image.height).data;
    if(pixels[3]!==0)throw Error('Snake atlas requires real transparency');
    // Boundaries belong to this newly generated atlas, never to concept sheets.
    const xs=[0,320,632,943,1254],ys=[0,320,616,870,1254];this.frames=[];
    for(let row=0;row<4;row++)for(let col=0;col<4;col++){
     let l=xs[col+1],r=-1,t=ys[row+1],b=-1;
     for(let y=ys[row];y<ys[row+1];y++)for(let x=xs[col];x<xs[col+1];x++)if(pixels[(y*image.width+x)*4+3]>24){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
     if(r<l)throw Error('Missing Snake atlas frame');this.frames.push({x:l,y:t,w:r-l+1,h:b-t+1});
    }
    this.atlas=image;
    [this.ground,this.decor,this.objects,this.food]=await Promise.all([picture('forest-ground-v1'),picture('forest-decor-v1'),picture('forest-objects-v1'),picture('forest-food-spore-v1')]);
    this.decorFrames=frames(this.decor,4,1);
    this.objectFrames=frames(this.objects,3,2);
    this.foodFrame=frames(this.food,1,1)[0];
    this.biomeArt=await Promise.all(BIOMES.map(async b=>{if(!b.atlas)return null;const [groundImage,atlasImage]=await Promise.all([picture(b.ground),picture(b.atlas)]),ground=document.createElement('canvas'),atlas=document.createElement('canvas');ground.width=ground.height=416;atlas.width=384;atlas.height=256;for(const [target,image]of [[ground,groundImage],[atlas,atlasImage]]){const c=target.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,0,0,target.width,target.height);}if(b.id==='swamp'){const c=ground.getContext('2d');c.fillStyle='#10231b2b';c.fillRect(0,0,416,416);}return{ground,atlas,frames:frames(atlas,3,2),pattern:ground.getContext('2d').createPattern(ground,'repeat')};}));
   })();try{return await this.ready;}catch(e){this.ready=null;throw e;}
  },
  contactShadow(c,x,y,size,wide=1,alpha=.28){
   c.fillStyle=alpha>.3?'rgba(4,13,9,.32)':alpha<.27?'rgba(4,13,9,.25)':'rgba(4,13,9,.28)';c.beginPath();c.ellipse(x,y+size*.25,size*.38*wide,size*.13,0,0,Math.PI*2);c.fill();
  },
  object(c,index,x,y,size,variant=0){
   const f=this.objectFrames[index],k=size/Math.max(f.w,f.h);
   this.contactShadow(c,x,y,size,index===4?1.25:index===2?1.12:1,index===3?.32:.26);
   c.save();c.translate(x,y);if(variant&1)c.scale(-1,1);
   c.drawImage(this.objects,f.x,f.y,f.w,f.h,-f.w*k/2,-f.h*k/2,f.w*k,f.h*k);c.restore();
  },
  foodSprite(c,x,y,size,ticks){
   const f=this.foodFrame,k=size/Math.max(f.w,f.h),bob=Math.sin(ticks*.075)*.055;
   this.contactShadow(c,x,y,size,.82,.25);this.pickupBase(c,x,y,'#ffe2a0',ticks,false);
   c.drawImage(this.food,f.x,f.y,f.w,f.h,x-f.w*k/2,y+bob-f.h*k/2,f.w*k,f.h*k);
   this.spark(c,x-.43,y-.4+bob,'#fff3bd',.055,.65);this.pixel(c,x+.42,y-.23+bob,'#ffe299',.075,.72);
  },
  biomeSprite(c,biome,index,x,y,size,variant=0,alpha=1){
   const art=this.biomeArt[biome],f=art.frames[index],k=size/Math.max(f.w,f.h);c.save();c.globalAlpha=alpha;c.translate(x,y);if(variant&1)c.scale(-1,1);c.drawImage(art.atlas,f.x,f.y,f.w,f.h,-f.w*k/2,-f.h*k/2,f.w*k,f.h*k);c.restore();
  },
  caveGlow(c,x,y){
   c.fillStyle='#3a91a213';c.fillRect(Math.round(x)-17,Math.round(y)-15,34,28);
   c.fillStyle='#62c6d319';c.fillRect(Math.round(x)-11,Math.round(y)-10,22,18);
  },
  groundPatches(c,cx,cy,seed){
   const spacing=10,left=cx*CHUNK,top=cy*CHUNK;
   const gx0=Math.floor((left-6)/spacing),gx1=Math.floor((left+CHUNK+6)/spacing),gy0=Math.floor((top-6)/spacing),gy1=Math.floor((top+CHUNK+6)/spacing);
   for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){
    const n=hash(gx,gy,seed^0x9e3779b9);if((n&3)>1)continue;
    const wx=gx*spacing+2+((n>>>5)%6),wy=gy*spacing+2+((n>>>11)%6),px=(wx-left)*32,py=(wy-top)*32;
    const rx=(2.2+((n>>>17)&7)*.3)*32,ry=(1.35+((n>>>22)&7)*.22)*32,angle=((n>>>27)&7)*Math.PI/8;
    const type=(n>>>27)%5;
    c.fillStyle=type===0?'#173a291e':type===1?'#78945416':type===2?'#8d603118':type===3?'#09251f20':'#4e673814';c.beginPath();c.ellipse(px,py,rx,ry,angle,0,Math.PI*2);c.fill();
    c.fillStyle=type===2?'#b1844b0d':type===3?'#071a1812':'#c0b56a09';c.beginPath();c.ellipse(px+((n&15)-7)*2,py+(((n>>>4)&15)-7)*2,rx*.62,ry*.56,angle+.35,0,Math.PI*2);c.fill();
    if(type===4)for(let i=0;i<4;i++){const q=hash(gx*7+i,gy*11-i,seed^0x3873a5d1);c.fillStyle=i&1?'#8d72bd3d':'#d9c27238';c.fillRect(px+((q&31)-15)*3,py+(((q>>>6)&31)-15)*2,2,2);}
   }
  },
  cavePatches(c,cx,cy,seed){
   const macro=23,macroLeft=cx*CHUNK,macroTop=cy*CHUNK;
   for(let gy=Math.floor((macroTop-11)/macro);gy<=Math.floor((macroTop+CHUNK+11)/macro);gy++)for(let gx=Math.floor((macroLeft-11)/macro);gx<=Math.floor((macroLeft+CHUNK+11)/macro);gx++){
    const n=hash(gx,gy,seed^0x51ad9c43);if((n&3)===3)continue;
    const x=(gx*macro+5+((n>>>5)%13)-macroLeft)*32,y=(gy*macro+5+((n>>>11)%13)-macroTop)*32;
    const rx=(5+((n>>>18)&7)*.48)*32,ry=(3.3+((n>>>22)&7)*.44)*32,angle=((n>>>27)&7)*Math.PI/8;
    c.fillStyle=['#07172227','#41606a17','#0a1d2a20','#5b768012'][n>>>16&3];c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fill();
    c.fillStyle=(n&16)?'#61868a0e':'#081b2416';c.beginPath();c.ellipse(x+rx*.32,y-ry*.18,rx*.52,ry*.61,angle+.35,0,Math.PI*2);c.fill();
   }
   const spacing=7,left=cx*CHUNK,top=cy*CHUNK;
   for(let gy=Math.floor((top-6)/spacing);gy<=Math.floor((top+CHUNK+6)/spacing);gy++)for(let gx=Math.floor((left-6)/spacing);gx<=Math.floor((left+CHUNK+6)/spacing);gx++){
    const n=hash(gx,gy,seed^0x4679c31b);if((n&3)===3)continue;
    const x=(gx*spacing+2+((n>>>5)%4)-left)*32,y=(gy*spacing+2+((n>>>11)%4)-top)*32;
    const rx=(1.5+((n>>>18)&7)*.27)*32,ry=(1.05+((n>>>22)&7)*.2)*32,angle=((n>>>27)&7)*Math.PI/8,type=n>>>16&3;
    c.fillStyle=['#09172267','#1b2b3a54','#0e1c2b70','#3a526040'][type];c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fill();
    c.fillStyle=type===3?'#5a7d7d21':'#0b1d2c28';c.beginPath();c.ellipse(x+((n&15)-8)*2,y+(((n>>>4)&15)-8)*2,rx*.57,ry*.48,angle+.3,0,Math.PI*2);c.fill();
    if((n&7)>2)continue;
    c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.strokeStyle='#0b182045';c.lineWidth=2;c.beginPath();c.moveTo(-20,-8);c.lineTo(-7,-2);c.lineTo(5,-7);c.lineTo(18,0);c.stroke();
    c.fillStyle='#78a8a075';c.fillRect(-8,-3,5,2);c.fillRect(9,-7,4,2);c.restore();
   }
  },
  smallCompositions(d,world,cx,cy,seed){
   const spacing=7,left=cx*CHUNK,top=cy*CHUNK;
   for(let gy=Math.floor((top-2)/spacing);gy<=Math.floor((top+CHUNK+2)/spacing);gy++)for(let gx=Math.floor((left-2)/spacing);gx<=Math.floor((left+CHUNK+2)/spacing);gx++){
    const n=hash(gx,gy,seed^0xa84f49c3);if((n&3)===3)continue;
    const wx=gx*spacing+2+((n>>>5)%4),wy=gy*spacing+2+((n>>>11)%4),biome=world.biomeAt(wx,wy);
    if(biome.mix>.15||biome.index===2||world.blocked(wx,wy))continue;
    const px=(wx-left)*32+16,py=(wy-top)*32+16,count=biome.index===0?3+(n>>>17&3):2+(n>>>17&1);
    for(let i=0;i<count;i++){
     const q=hash(gx*11+i,gy*13-i,seed^0x16cc8d51),x=px+((q&31)-15)*1.55,y=py+(((q>>>7)&31)-15)*1.2;
     if(biome.index===0){
      const type=(q>>>18)%7;if(type<4)this.decorItem(d,type,x,y,8+((q>>>23)&7),q);
      else this.decorItem(d,type===4?4:5,x,y,1,q);
      if((q&15)===0){d.fillStyle='#b3ba6f66';d.fillRect(Math.round(x+4),Math.round(y-5),2,2);}
     }else{
      d.fillStyle=(q&1)?'#6796a65c':'#a5d0d366';d.fillRect(Math.round(x),Math.round(y),2+(q&3),2);
      if((q&7)===0){d.fillStyle='#80c9d647';d.fillRect(Math.round(x+3),Math.round(y-4),2,4);}
     }
    }
   }
  },
  decorItem(c,type,x,y,size,n){
   if(type<4){
    const f=this.decorFrames[type],k=size/Math.max(f.w,f.h);c.save();c.translate(x,y);if(n&1)c.scale(-1,1);
    c.globalAlpha=type===3?.72:.86;c.drawImage(this.decor,f.x,f.y,f.w,f.h,-f.w*k/2,-f.h*k/2,f.w*k,f.h*k);c.restore();return;
   }
   if(type>5){
    const f=this.objectFrames[type===6?4:0],small=8+((n>>>18)&7),k=small/Math.max(f.w,f.h);c.save();c.translate(x,y);if(n&1)c.scale(-1,1);
    c.globalAlpha=.74;c.drawImage(this.objects,f.x,f.y,f.w,f.h,-f.w*k/2,-f.h*k/2,f.w*k,f.h*k);c.restore();return;
   }
   c.save();c.translate(Math.round(x),Math.round(y));
   if(type===4){
    c.fillStyle='#2d5a35';c.fillRect(-1,-8,2,8);c.fillRect(-5,-5,2,5);c.fillRect(4,-7,2,7);c.fillStyle='#789753';c.fillRect(1,-5,2,5);c.fillStyle='#4b733d';c.fillRect(-3,-4,2,4);
   }else{
    c.fillStyle='#91633d';c.fillRect(-7,-2,6,3);c.fillStyle='#b7834e';c.fillRect(1,2,5,3);c.fillStyle='#76513a';c.fillRect(5,-5,4,2);
   }
   c.restore();
  },
  obstacleDecor(c,index,x,y,n){
   const side=n&1?-1:1,other=-side;
   if(index===0){this.decorItem(c,2,x+side*10,y+8,11,n);this.decorItem(c,4,x+other*9,y+10,1,n>>>1);}
   else if(index===1){this.decorItem(c,1,x+side*10,y+8,10,n);this.decorItem(c,2,x+other*9,y+9,10,n>>>2);}
   else if(index===2){this.decorItem(c,0,x+side*10,y+9,9,n);this.decorItem(c,5,x+other*8,y+10,1,n>>>3);}
   else if(index===3){this.decorItem(c,1,x+side*11,y+9,8,n);this.decorItem(c,0,x+other*10,y+10,8,n>>>4);}
   else{this.decorItem(c,2,x+side*9,y+8,10,n);this.decorItem(c,4,x+other*10,y+10,1,n>>>5);}
  },
  groundChunk(s,cx,cy){
   const id='forest-presentation:'+s.engine.world.seed+':'+cx+','+cy;if(s.chunks.has(id))return s.chunks.get(id);
   const world=s.engine.world,indices=new Uint8Array(CHUNK*CHUNK),mixes=new Float32Array(CHUNK*CHUNK);let pure=-1;
   for(let y=0;y<CHUNK;y++)for(let x=0;x<CHUNK;x++){const b=world.biomeAt(cx*CHUNK+x+.5,cy*CHUNK+y+.5),i=y*CHUNK+x;indices[i]=b.index;mixes[i]=b.mix;if(i===0)pure=b.index;if(b.mix>0||b.index!==pure)pure=-2;}
   const floor=document.createElement('canvas'),decor=document.createElement('canvas');floor.width=floor.height=decor.width=decor.height=CHUNK*32;
   const c=floor.getContext('2d');c.imageSmoothingEnabled=false;
   if(pure>0){c.save();c.translate(-cx*CHUNK*32,-cy*CHUNK*32);c.fillStyle=this.biomeArt[pure].pattern;c.fillRect(cx*CHUNK*32,cy*CHUNK*32,floor.width,floor.height);c.restore();if(pure===1)this.cavePatches(c,cx,cy,world.seed);}
   else{
   for(let y=0;y<CHUNK;y+=4)for(let x=0;x<CHUNK;x+=4){
    const n=hash(cx*CHUNK+x,cy*CHUNK+y,s.engine.world.seed^0xa511e9b3);c.save();c.translate(x*32+64,y*32+64);c.rotate(((n>>>3)&3)*Math.PI/2);c.scale(n&1?-1:1,n&2?-1:1);c.drawImage(this.ground,-64,-64,128,128);c.restore();
   }
   c.fillStyle='#102d2674';c.fillRect(0,0,floor.width,floor.height);this.groundPatches(c,cx,cy,s.engine.world.seed);
   }
   if(pure<0){
    const forest=document.createElement('canvas'),next=document.createElement('canvas'),mask=document.createElement('canvas');
    forest.width=forest.height=next.width=next.height=CHUNK*32;mask.width=mask.height=CHUNK*4;
    forest.getContext('2d').drawImage(floor,0,0);
    const nc=next.getContext('2d');nc.imageSmoothingEnabled=false;
    for(let y=0;y<CHUNK;y++)for(let x=0;x<CHUNK;x++){
     const wx=cx*CHUNK+x,wy=cy*CHUNK+y,index=indices[y*CHUNK+x],following=(index+1)%BIOMES.length;
     for(const [layer,target] of [[index,c],[following,nc]]){
      if(!layer){if(target===nc)target.drawImage(forest,x*32,y*32,32,32,x*32,y*32,32,32);continue;}
      const ground=this.biomeArt[layer].ground,span=13,tx=((wx%span)+span)%span,ty=((wy%span)+span)%span;
      target.drawImage(ground,tx*32,ty*32,32,32,x*32,y*32,32,32);
     }
    }
    const mc=mask.getContext('2d'),pixels=mc.createImageData(mask.width,mask.height),seed=world.seed;
    for(let py=0;py<mask.height;py++)for(let px=0;px<mask.width;px++){
     const wx=cx*CHUNK+(px+.5)/4,wy=cy*CHUNK+(py+.5)/4,b=world.biomeAt(wx,wy),edge=Math.min(1,b.mix*10,(1-b.mix)*10);
     const variation=(transitionNoise(wx,wy,6,seed^0x319a71)*.3+transitionNoise(wx,wy,17,seed^0x7c13b5)*.14)*edge;
     const t=Math.max(0,Math.min(1,(b.mix+variation-.26)/.48)),alpha=t*t*(3-2*t),i=(py*mask.width+px)*4;
     pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=Math.round(alpha*255);
    }
    mc.putImageData(pixels,0,0);nc.globalCompositeOperation='destination-in';nc.imageSmoothingEnabled=true;nc.drawImage(mask,0,0,next.width,next.height);nc.globalCompositeOperation='source-over';c.drawImage(next,0,0);
   }
   const d=decor.getContext('2d'),ambient=[];d.imageSmoothingEnabled=false;
   for(let y=0;y<CHUNK;y++)for(let x=0;x<CHUNK;x++){
    const wx=cx*CHUNK+x,wy=cy*CHUNK+y,n=hash(wx,wy,s.engine.world.seed),index=indices[y*CHUNK+x],next=(index+1)%BIOMES.length,mix=mixes[y*CHUNK+x],biome=pure>=0?pure:world.biomeIndex(wx,wy);
    if((n&15)===0){c.fillStyle=(n&16)?'#b1844b22':'#d5b76618';c.fillRect(x*32+((n>>>8)%27),y*32+((n>>>13)%27),2+(n&1),2);}
    if(s.engine.world.blocked(wx,wy)){if(!biome)this.obstacleDecor(d,n%5,x*32+16,y*32+16,n);else{if(biome===1)this.caveGlow(d,x*32+9,y*32+23);this.biomeSprite(d,biome,3+n%3,x*32+9,y*32+23,12,n,biome===2?.52:.72);}continue;}
    const field=clusterStrength(wx+.5,wy+.5,s.engine.world.seed),chance=.038+field*.68;
    if(pure<0&&mix>.08&&mix<.92&&field>.22&&((n>>>17)&15)===0){
     const palette=index===0?['#86a76a55','#6b9da252']:index===1?['#6a9ba852','#758d6555']:['#9ba27650','#ae915c50'];
     for(let i=0;i<3;i++){c.fillStyle=palette[i&1];c.fillRect(x*32+5+((n>>>(i*5))&15),y*32+5+((n>>>(i*4+8))&15),2+(i&1),2);}
    }
    if(((n>>>8)&65535)/65535<chance){
     const type=(n>>>24)&7,size=type<4?(type===3?16+((n>>>19)&3):20+((n>>>18)&7)):1;
     const ox=((n>>>4)&15)-7.5,oy=((n>>>12)&15)-7.5;if(!biome)this.decorItem(d,type,x*32+16+ox,y*32+16+oy,size,n);else{if(biome===1&&(n&3)===0)this.caveGlow(d,x*32+16+ox,y*32+16+oy);this.biomeSprite(d,biome,3+n%3,x*32+16+ox,y*32+16+oy,15+((n>>>18)&7),n,biome===2?.5:.7);}
     if((n&63)===0)ambient.push(wx+.5+ox/32,wy+.5+oy/32,(n>>>16)/65535*Math.PI*2,biome);
    }
   }
   this.smallCompositions(d,world,cx,cy,world.seed);
   const entry=Object.freeze({id,floor,decor,ambient:Object.freeze(ambient)});s.chunks.set(id,entry);return entry;
  },
  prewarm(s,all=false){
   if(geometry||!this.ground||!s.view)return;
   const v=s.view,e=s.engine,scale=v.scale,sx=v.w*(s.mobile()?.58:.52),sy=v.h*.55,x=e.rx[0]+.5,y=e.ry[0]+.5;
   const stamp=this.prewarmStamp||(this.prewarmStamp={}),cellX=Math.floor(x),cellY=Math.floor(y);
   if(!all&&!stamp.pending&&stamp.x===cellX&&stamp.y===cellY&&stamp.dir===e.direction&&stamp.w===v.w&&stamp.h===v.h&&stamp.seed===e.world.seed)return;
   const left=Math.floor((x-sx/scale)/CHUNK),right=Math.floor((x+(v.w-sx)/scale)/CHUNK),top=Math.floor((y-sy/scale)/CHUNK),bottom=Math.floor((y+(v.h-sy)/scale)/CHUNK);
   const dx=root.MushroomSnakeCore.DX[e.direction],dy=root.MushroomSnakeCore.DY[e.direction];
   const cx0=dx<0||dy?left-1:left,cx1=dx>0||dy?right+1:right,cy0=dy<0||dx?top-1:top,cy1=dy>0||dx?bottom+1:bottom;
   const keep=this.prewarmKeys||(this.prewarmKeys=new Set());keep.clear();let built=0,pending=false;
   const forwardX=dx<0?left-1:dx>0?right+1:left,forwardY=dy<0?top-1:dy>0?bottom+1:top;
   if(dx)for(let cy=top-1;cy<=bottom+1;cy++){
    const id='forest-presentation:'+e.world.seed+':'+forwardX+','+cy;
    if(!s.chunks.has(id)){if(all||!built){this.groundChunk(s,forwardX,cy);built++;}else pending=true;}
   }else for(let cx=left-1;cx<=right+1;cx++){
    const id='forest-presentation:'+e.world.seed+':'+cx+','+forwardY;
    if(!s.chunks.has(id)){if(all||!built){this.groundChunk(s,cx,forwardY);built++;}else pending=true;}
   }
   for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){
    const id='forest-presentation:'+e.world.seed+':'+cx+','+cy;keep.add(id);
    if(!s.chunks.has(id)){if(all||!built){this.groundChunk(s,cx,cy);built++;}else pending=true;}
   }
   stamp.x=cellX;stamp.y=cellY;stamp.dir=e.direction;stamp.w=v.w;stamp.h=v.h;stamp.seed=e.world.seed;stamp.pending=pending;
  },
  prime(s){
   if(geometry||!this.ground||!s.view)return;
   const v=s.view,e=s.engine,scale=v.scale,sx=v.w*(s.mobile()?.58:.52),sy=v.h*.55,x=e.rx[0]+.5,y=e.ry[0]+.5;
   for(let cy=Math.floor((y-sy/scale)/CHUNK);cy<=Math.floor((y+(v.h-sy)/scale)/CHUNK);cy++)for(let cx=Math.floor((x-sx/scale)/CHUNK);cx<=Math.floor((x+(v.w-sx)/scale)/CHUNK);cx++)this.groundChunk(s,cx,cy);
   this.prewarm(s,true);
  },
  sprite(c,part,size=0){
   let cell=part.cell,flip=false;
   // Atlas elbow 9 points left/down: mirror it for the right/down port pair.
   if(cell===9)flip=true;else if(cell===10)cell=9;
   const f=this.frames[cell];
   if(part.kind==='corner'){
    // Elbows extend into the two neighbouring cells. Register by the port
    // intersection, not the bounding-box centre (which shifts an L off-path).
    const [ax,ay]=cell===8?[.24,.76]:cell===9?[.73,.28]:[.75,.75];
    const profile=size||1,k=profile*2/(f.w*Math.max(ax,1-ax)+f.h*Math.max(ay,1-ay));if(flip)c.scale(-1,1);
    c.drawImage(this.atlas,f.x,f.y,f.w,f.h,-f.w*ax*k,-f.h*ay*k,f.w*k,f.h*k);
   }else{
    const extent=size||(part.kind==='head'?SCALE.head:part.kind==='tail'?1.18:1.5),k=extent/Math.max(f.w,f.h);
    c.drawImage(this.atlas,f.x,f.y,f.w,f.h,-f.w*k/2,-f.h*k/2,f.w*k,f.h*k);
   }
  },
  segmentSize(index,length,part){
   if(part.kind==='head')return SCALE.head;if(part.kind==='tail')return 1.18;
   const tail=length-1-index;
   if(part.kind==='corner')return tail===1?.9:tail===2?.95:tail===3?.98:1;
   let size=part.cell>=6?1.52:1.48;if(index===1)size=Math.min(size,1.4);else if(index===2)size=Math.min(size,1.46);
   if(tail===1)size=Math.min(size,1.29);else if(tail===2)size=Math.min(size,1.37);else if(tail===3)size=Math.min(size,1.44);
   return size;
  },
  pixel(c,x,y,color,size=.075,alpha=1){
   c.save();c.globalAlpha*=alpha;c.fillStyle=color;c.fillRect(Math.round(x*32)/32,Math.round(y*32)/32,size,size);c.restore();
  },
  spark(c,x,y,color,size=.075,alpha=1){
   c.save();c.globalAlpha*=alpha;c.fillStyle=color;c.fillRect(x-size/2,y-size*1.7,size,size*3.4);c.fillRect(x-size*1.7,y-size/2,size*3.4,size);c.restore();
  },
  pickupBase(c,x,y,color,ticks,warning){
   const pulse=warning?.25+.1*Math.sin(ticks*.17):.24+.06*Math.sin(ticks*.08);
   c.save();c.globalAlpha*=pulse;c.fillStyle=color;c.fillRect(x-.51,y+.32,1.02,.13);c.fillRect(x-.34,y+.23,.68,.09);c.restore();
   if(warning){this.pixel(c,x-.5,y-.4,'#e95cbb',.105,.75);this.pixel(c,x+.44,y-.4,'#e95cbb',.105,.75);}
   else{this.spark(c,x-.48,y-.31,color,.055,.6);this.pixel(c,x+.46,y-.24,color,.075,.66);}
  },
  pickupSprite(c,image,x,y,ticks,warning){
   const size=1.08,k=size/Math.max(image.width,image.height),bob=Math.sin(ticks*.065)*.065,color=warning?'#dc5baf':'#a5e36c';
   this.contactShadow(c,x,y,size,.87,.22);this.pickupBase(c,x,y,color,ticks,warning);
   c.drawImage(image,x-image.width*k/2,y+bob-image.height*k/2,image.width*k,image.height*k);
   if(warning){this.pixel(c,x-.43,y-.53+bob,'#ff819f',.08,.7);this.pixel(c,x+.4,y-.49+bob,'#9e65d9',.08,.7);}
   else{this.spark(c,x-.42,y-.49+bob,'#e8f4a3',.075,.72);this.pixel(c,x+.43,y-.4+bob,'#b5ed7a',.08,.68);}
  },
  portal(c,image,x,y,index){
   if(!image)return;const size=1.36,k=size/Math.max(image.width,image.height),cx=x+.5,cy=y+.5;
   c.save();c.translate(cx,cy);if(index)c.scale(-1,1);c.drawImage(image,-image.width*k/2,-image.height*k/2,image.width*k,image.height*k);c.restore();
  },
  effectAura(c,e){
   const x=e.rx[0]+.5,y=e.ry[0]+.5,limit=Math.min(e.length,96),step=Math.max(3,Math.ceil(limit/10)),phase=e.ticks*.065;
   if(e.comboFlash>0){const a=Math.min(1,e.comboFlash/30);this.spark(c,x-.55,y-.6,'#ffe49b',.12,a);this.spark(c,x+.5,y-.4,'#fff3c5',.08,a*.8);}
   if(e.magnet>0){for(let i=2;i<limit;i+=step){const px=e.rx[i]+.5,py=e.ry[i]+.76;this.pixel(c,px-.16,py,'#7ddf79',.075,.72);this.pixel(c,px+.08,py-.06,'#b2e98b',.06,.56);c.save();c.globalAlpha*=.36;c.fillStyle='#6ec56c';c.fillRect(px-.12,py-.02,.22,.035);c.restore();}if(e.magnetPull>0){const fx=e.magnetPullX+.5,fy=e.magnetPullY+.5;for(let i=1;i<4;i++){const p=i/4;this.pixel(c,fx+(x-fx)*p,fy+(y-fy)*p,'#a4e989',.07,.68);}}}
   if(e.golden>0){this.spark(c,x-.52,y-.5,'#ffe292',.11,.88);this.spark(c,x+.48,y-.7,'#fff1bb',.07,.72);for(let i=4;i<limit;i+=step*2)this.spark(c,e.rx[i]+.5,e.ry[i]+.04,'#ffd569',.07,.58);}
   if(e.ghost>0||e.ghostGrace){const a=e.ghost>0&&e.ghost<=60?.83:.55;for(let i=2;i<limit;i+=step){const px=e.rx[i]+.5,py=e.ry[i]+.1;this.pixel(c,px-.42,py,'#92e4e8',.075,a);this.pixel(c,px-.34,py-.13,'#b9eff1',.055,a*.7);}this.pixel(c,x+.43,y-.39,'#a8e8f5',.085,a);}
   if(e.timeEffect>0){const dx=-DX[e.direction],dy=-DY[e.direction];for(let i=0;i<3;i++){const px=x+dx*(.35+i*.22)+Math.sin(phase+i)*.08,py=y+dy*(.35+i*.22)-.34;this.pixel(c,px,py,'#aa9be9',.08-i*.012,.7-i*.13);this.pixel(c,px+dx*.13,py+dy*.13,'#87bbf0',.045,.38);}}
   if(e.drunk>0){this.pixel(c,x-.5+Math.sin(phase)*.1,y-.65,'#d678bd',.09,.65);this.pixel(c,x+.48,y-.45,'#a777d5',.065,.5);}
   if(e.hiccupPulse>0){const p=1-e.hiccupPulse/22,a=e.hiccupPulse/22;for(let i=0;i<3;i++)this.pixel(c,x+.37+p*(.15+i*.1),y-.3-p*(.14+i*.08),'#d8e8cb',.12-i*.025,a*(.7-i*.12));}
   if(e.slime>0)for(let i=3;i<Math.min(e.length,18);i+=3){const px=e.rx[i]+.5,py=e.ry[i]+.79;this.pixel(c,px-.11,py,'#7fc66a',.11,.55);this.pixel(c,px+.1,py+.04,'#a6d977',.065,.46);}
   if(e.fairy>0&&e.portalFlash>0){const a=e.portalFlash/30;for(let side=0;side<2;side++){const tx=(side?e.portalToX:e.portalFromX)+.5,ty=(side?e.portalToY:e.portalFromY)+.5;for(let i=0;i<5;i++){const angle=i*1.26+phase*.3,d=.2+(1-a)*(.4+i*.08);this.pixel(c,tx+Math.cos(angle)*d,ty+Math.sin(angle)*d,'#c3a1f1',.09-i*.008,a*(.8-i*.09));}}}
  },
  fit(w,h){return Math.max(h/SCALE.rows,w/SCALE.columns);},
  fullInvalidate(s,reason){s.invalidateReason=reason;},
  paint(s){
   const v=s.view,e=s.engine,c=s.ctx;if(!v)return;
   const frame=snapshot(e,Math.min(1,e.phase+(s.state==='play'?(s.acc||0)*e.speed:0)));
   const biome=e.world.biomeIndex(e.x,e.y);
   if(s.renderBiome!==biome){this.fullInvalidate(s,'biome');s.renderBiome=biome;}
   if(e.portalFlash>0&&s.renderPortalTick!==e.moveTicks){this.fullInvalidate(s,'teleport');s.renderPortalTick=e.moveTicks;}
   if(s.invalidateReason){if(c.reset)c.reset();else s.canvas.width=s.canvas.width;s.lastInvalidation=s.invalidateReason;s.invalidateReason=null;}
   c.save();try{
   // Clear and recompose the whole backing store; chunks only cache sources.
   c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.beginPath();c.clearRect(0,0,s.canvas.width,s.canvas.height);
   const scale=v.scale,sx=v.w*(s.mobile()?.58:.52),sy=v.h*.55;
   s.camera={x:frame.x[0]+.5,y:frame.y[0]+.5};
   const left=s.camera.x-sx/scale,top=s.camera.y-sy/scale,right=left+v.w/scale,bottom=top+v.h/scale;
   c.setTransform(v.dpr,0,0,v.dpr,0,0);c.imageSmoothingEnabled=false;c.fillStyle='#142b25';c.fillRect(0,0,v.w,v.h);
   c.translate(sx-s.camera.x*scale,sy-s.camera.y*scale);c.scale(scale,scale);
   c.fillStyle='#233e32';c.fillRect(left,top,v.w/scale,v.h/scale);
   if(!geometry&&this.ground){
    const visible=this.visibleKeys||(this.visibleKeys=new Set());visible.clear();
    for(let cy=Math.floor(top/CHUNK);cy<=Math.floor(bottom/CHUNK);cy++)for(let cx=Math.floor(left/CHUNK);cx<=Math.floor(right/CHUNK);cx++){
     const entry=this.groundChunk(s,cx,cy);visible.add(entry.id);c.drawImage(entry.floor,cx*CHUNK,cy*CHUNK,CHUNK,CHUNK);
    }
    for(const key of s.chunks.keys())if(!visible.has(key)&&!this.prewarmKeys?.has(key))s.chunks.delete(key);
    // Chunk decor is spatially stable: never mask it around moving actors.
    const pulse=e.ticks*.025;
    for(let cy=Math.floor(top/CHUNK);cy<=Math.floor(bottom/CHUNK);cy++)for(let cx=Math.floor(left/CHUNK);cx<=Math.floor(right/CHUNK);cx++){
     const entry=this.groundChunk(s,cx,cy);c.drawImage(entry.decor,cx*CHUNK,cy*CHUNK,CHUNK,CHUNK);
     for(let i=0;i<entry.ambient.length;i+=4){
      const x=entry.ambient[i],y=entry.ambient[i+1]+Math.sin(pulse+entry.ambient[i+2])*.07,a=.38+Math.sin(pulse*1.3+entry.ambient[i+2])*.18;
      c.globalAlpha=a;c.fillStyle=BIOMES[entry.ambient[i+3]].palette[1];c.fillRect(x-.02,y-.02,.04,.04);c.globalAlpha=a*.45;c.fillRect(x-.05,y-.05,.1,.1);
     }
    }
    c.globalAlpha=1;
   }
   for(let y=Math.floor(top);y<bottom;y++)for(let x=Math.floor(left);x<right;x++){
    if(e.world.blocked(x,y)){
     const n=hash(x,y,e.world.seed),biome=e.world.biomeIndex(x,y);if(!geometry&&biome&&this.biomeArt?.[biome])this.biomeSprite(c,biome,n%3,x+.5,y+.5,SCALE.obstacle,n);
     else if(!geometry&&this.objects)this.object(c,n%5,x+.5,y+.5,SCALE.obstacle*(.9+((n>>>9)&7)*.012),n);
     else{c.fillStyle='#849180';c.fillRect(x+.03,y+.03,.94,.94);}
    }
   }
   for(const f of e.items)if(f.active&&f.kind==='food'&&f.x>=left-2&&f.x<=right+2&&f.y>=top-2&&f.y<=bottom+2){
    const fx=(Number.isFinite(f.px)?f.px:f.x)+.5,fy=(Number.isFinite(f.py)?f.py:f.y)+.5;if(!geometry&&this.food)this.foodSprite(c,fx,fy,SCALE.food,e.ticks);
    else{c.fillStyle='#ffcf64';c.beginPath();c.arc(fx,fy,SCALE.food/2,0,Math.PI*2);c.fill();}
    if(f.eventFood)this.spark(c,fx-.4,fy-.44,'#f4d8a0',.07,.7);
   }
   for(const f of e.items)if(f.active&&f.kind!=='food'){const effect=EFFECTS[f.kind],image=effect&&s.assets[effect.asset],fx=(Number.isFinite(f.px)?f.px:f.x)+.5,fy=(Number.isFinite(f.py)?f.py:f.y)+.5;if(!geometry&&image)this.pickupSprite(c,image,fx,fy,e.ticks,effect.bad);else{c.fillStyle=effect?.bad?'#ef5775':'#b8f173';c.fillRect(fx-.35,fy-.35,.7,.7);}}
   if(e.fairy>0&&e.portals)for(let i=0;i<e.portals.length;i++){const portal=e.portals[i],image=s.assets[i?'portal-fairy-exit-v1':'portal-fairy-entry-v1'];this.portal(c,image,portal.x,portal.y,i);}
   const draw=i=>{
    const x=frame.x[i]+.5,y=frame.y[i]+.5;if(x<left-2||x>right+2||y<top-2||y>bottom+2)return;
    const part=frame.parts[i];c.save();try{
    // The neck begins behind the rear seam of this frame's head pose.
    if(i===1&&frame.links[1]){const hx=frame.x[0]+.5,hy=frame.y[0]+.5,d=frame.parts[0].direction;c.beginPath();if(d===1)c.rect(hx-1000,hy-1000,999.55,2000);else if(d===3)c.rect(hx+.45,hy-1000,1000,2000);else if(d===2)c.rect(hx-1000,hy-1000,2000,999.55);else c.rect(hx-1000,hy+.45,2000,1000);c.clip();}
    if(e.ghost>0||e.ghostGrace)c.globalAlpha=.62;c.translate(x,y);
    if(!geometry&&this.atlas){this.sprite(c,part,this.segmentSize(i,e.length,part));return;}
    // Dev geometry only. No generated art is accepted implicitly by this preview.
    c.fillStyle=i===0?'#ffbd72':part.kind==='corner'?'#89c9ae':'#c9d69a';
    if(part.kind==='head'){c.beginPath();c.arc(0,0,SCALE.head/2,0,Math.PI*2);c.fill();}
    else if(part.kind==='tail'){c.rotate((part.direction-1)*Math.PI/2);c.beginPath();c.moveTo(-.5,-.38);c.quadraticCurveTo(.3,-.3,.58,0);c.quadraticCurveTo(.3,.3,-.5,.38);c.closePath();c.fill();}
    else if(part.kind==='corner'){
     c.strokeStyle=c.fillStyle;c.lineWidth=.78;c.lineJoin='round';c.lineCap='butt';
     c.beginPath();c.moveTo((frame.x[i-1]-frame.x[i])*.52,(frame.y[i-1]-frame.y[i])*.52);c.quadraticCurveTo(0,0,(frame.x[i+1]-frame.x[i])*.52,(frame.y[i+1]-frame.y[i])*.52);c.stroke();
    }else{c.rotate(part.direction%2===0?Math.PI/2:0);c.fillRect(-.52,-.39,1.04,.78);}
    }finally{c.restore();}
   };
   // Shadow uses the same adjusted terminal pose, never a historical path.
   c.save();c.translate(0,.08);c.strokeStyle='#06120b50';c.lineWidth=.36;c.lineJoin='round';c.lineCap='round';c.beginPath();
   let shadowOpen=false;
   for(let i=0;i<e.length;i++){
    const x=frame.x[i]+.5,y=frame.y[i]+.5,inside=x>left-1&&x<right+1&&y>top-1&&y<bottom+1;
    if(inside){if(shadowOpen&&frame.links[i])c.lineTo(x,y);else{c.moveTo(x,y);shadowOpen=true;}}else shadowOpen=false;
   }
   c.stroke();c.restore();
   c.save();try{c.beginPath();
   for(let i=0;i<e.length;i++){
    const x=frame.x[i]+.5,y=frame.y[i]+.5;
    c.rect(x-.53,y-.53,1.06,1.06);
    if(frame.links[i]){
     const px=frame.x[i-1]+.5,py=frame.y[i-1]+.5;
     c.rect(Math.min(x,px)-.53,Math.min(y,py)-.53,Math.abs(x-px)+1.06,Math.abs(y-py)+1.06);
    }
   }
   c.clip();
   // The terminal cell is exclusively the pointed tail sprite. Painting its
   // bodyOnly fallback first creates a second full-width silhouette underneath.
   for(let i=e.length-2;i>0;i--)if(frame.parts[i].kind!=='corner')draw(i);
   for(let i=e.length-2;i>0;i--)if(frame.parts[i].kind==='corner')draw(i);
   }finally{c.restore();}
   draw(e.length-1);draw(0);this.effectAura(c,e);
   }finally{c.restore();}
  }
 };
 root.MushroomSnakeForest=Forest;
})(window);
