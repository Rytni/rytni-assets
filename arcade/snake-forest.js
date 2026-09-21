/* Green Forest presentation. World units remain simulation cells. */
(function(root){
 'use strict';
 const {select,at,placement}=root.MushroomSnakeSegments;
 const SCALE={rows:12,columns:30,head:1.35,body:1.04,food:.9,obstacle:1};
 const geometry=new URLSearchParams(location.search).has('snake_geometry');
 const BASE='https://rytni.github.io/rytni-assets/grib/mushroom-snake-v2/';
 const {hash,CHUNK,EFFECTS}=root.MushroomSnakeCore;
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
  foodSprite(c,x,y,size){
   const f=this.foodFrame,k=size/Math.max(f.w,f.h);this.contactShadow(c,x,y,size,.82,.25);
   c.drawImage(this.food,f.x,f.y,f.w,f.h,x-f.w*k/2,y-f.h*k/2,f.w*k,f.h*k);
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
   const floor=document.createElement('canvas'),decor=document.createElement('canvas');floor.width=floor.height=decor.width=decor.height=CHUNK*32;
   const c=floor.getContext('2d');c.imageSmoothingEnabled=false;
   for(let y=0;y<CHUNK;y+=4)for(let x=0;x<CHUNK;x+=4){
    const n=hash(cx*CHUNK+x,cy*CHUNK+y,s.engine.world.seed^0xa511e9b3);c.save();c.translate(x*32+64,y*32+64);c.rotate(((n>>>3)&3)*Math.PI/2);c.scale(n&1?-1:1,n&2?-1:1);c.drawImage(this.ground,-64,-64,128,128);c.restore();
   }
   c.fillStyle='#102d2674';c.fillRect(0,0,floor.width,floor.height);this.groundPatches(c,cx,cy,s.engine.world.seed);
   const d=decor.getContext('2d'),ambient=[];d.imageSmoothingEnabled=false;
   for(let y=0;y<CHUNK;y++)for(let x=0;x<CHUNK;x++){
    const wx=cx*CHUNK+x,wy=cy*CHUNK+y,n=hash(wx,wy,s.engine.world.seed);
    if((n&15)===0){c.fillStyle=(n&16)?'#b1844b22':'#d5b76618';c.fillRect(x*32+((n>>>8)%27),y*32+((n>>>13)%27),2+(n&1),2);}
    if(s.engine.world.blocked(wx,wy)){this.obstacleDecor(d,n%5,x*32+16,y*32+16,n);continue;}
    const field=clusterStrength(wx+.5,wy+.5,s.engine.world.seed),chance=.038+field*.68;
    if(((n>>>8)&65535)/65535<chance){
     const type=(n>>>24)&7,size=type<4?(type===3?16+((n>>>19)&3):20+((n>>>18)&7)):1;
     const ox=((n>>>4)&15)-7.5,oy=((n>>>12)&15)-7.5;this.decorItem(d,type,x*32+16+ox,y*32+16+oy,size,n);
     if((n&63)===0)ambient.push(wx+.5+ox/32,wy+.5+oy/32,(n>>>16)/65535*Math.PI*2);
    }
   }
   const entry={id,floor,decor,ambient};s.chunks.set(id,entry);return entry;
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
  vfx(c,image,x,y,size,alpha=1,angle=0,mirror=false){
   if(!image)return;const k=size/Math.max(image.width,image.height);c.save();c.translate(x,y);c.rotate(angle);if(mirror)c.scale(-1,1);c.globalAlpha*=alpha;c.drawImage(image,-image.width*k/2,-image.height*k/2,image.width*k,image.height*k);c.restore();
  },
  pickupSprite(c,image,particle,x,y,ticks){
   const size=1.08,k=size/Math.max(image.width,image.height),phase=(ticks>>3)&7;c.save();c.translate(x,y);c.drawImage(image,-image.width*k/2,-image.height*k/2,image.width*k,image.height*k);c.restore();
   this.vfx(c,particle,x-.42+phase*.012,y-.43,.24,.74,-.35);this.vfx(c,particle,x+.43-phase*.01,y+.18,.18,.5,.48,true);
  },
  portal(c,image,particle,x,y,ticks,index){
   const cx=x+.5,cy=y+.5;if(image)this.vfx(c,image,cx,cy,1.36,1,0,index===1);const phase=((ticks>>2)+index*3)&7;
   this.vfx(c,particle,cx-.46+phase*.018,cy-.46,.22,.65,-.42,index===1);this.vfx(c,particle,cx+.43-phase*.014,cy+.3,.17,.48,.62,index===0);
  },
  effectAura(c,e,assets){
   const x=e.rx[0]+.5,y=e.ry[0]+.5,limit=Math.min(e.length,96),step=Math.max(2,Math.ceil(limit/12)),phase=e.ticks*.045;
   if(e.magnet>0){const art=assets['vfx-magnet-v1'];for(let i=1;i<limit;i+=step)this.vfx(c,art,e.rx[i]+.5,e.ry[i]+.08,.66,.68+(i%3)*.08,phase+i*.7,i%2>0);if(e.magnetPull>0){const fx=e.magnetPullX+.5,fy=e.magnetPullY+.5;for(let i=1;i<6;i++){const p=i/6,side=((i+e.ticks)&1)?.1:-.1;this.vfx(c,art,fx+(x-fx)*p+side,fy+(y-fy)*p-side,.36+i*.025,.56+i*.07,phase+i*.3,i%2>0);}}}
   if(e.golden>0){const art=assets['vfx-golden-v1'],offset=(e.ticks>>3)%step;for(let i=offset;i<limit;i+=step)this.vfx(c,art,e.rx[i]+.5,e.ry[i]+.08,.64,.74+(i%3)*.07,phase*.55+i*.42,i%2>0);}
   if(e.ghost>0||e.ghostGrace){const art=assets['vfx-ghost-v1'],warning=e.ghost>0&&e.ghost<=60&&((e.ticks>>2)&1);for(let i=1;i<limit;i+=step)this.vfx(c,art,e.rx[i]+.5,e.ry[i]+.14,.52,warning?.96:.68,-phase+i*.58,i%2>0);for(let i=1;i<Math.min(e.length,5);i++){const j=(e.head-i+e.bx.length)%e.bx.length;this.vfx(c,art,e.bx[j]+.5,e.by[j]+.5,.68-i*.06,.34-i*.035,-phase-i*.35,i%2>0);}}
   if(e.timeEffect>0){const art=assets['vfx-time-v1'];for(let i=0;i<3;i++)this.vfx(c,art,x+Math.cos(phase+i*2.1)*(.68+i*.1),y+Math.sin(phase+i*2.1)*(.58+i*.08),.62-i*.055,.76-i*.1,phase+i*.8,i%2>0);const dir=e.direction===0?'up':e.direction===1?'right':e.direction===2?'down':'left',head=assets['snake-head-'+dir];for(let i=1;i<Math.min(e.length,4);i++){const j=(e.head-i+e.bx.length)%e.bx.length;this.vfx(c,head,e.bx[j]+.5,e.by[j]+.5,.8-i*.08,.18-i*.035);}}
   if(e.drunk>0){const art=assets['vfx-drunk-v1'],sway=Math.sin(phase*1.7)*.16;this.vfx(c,art,x-.54+sway,y-.66,.62,.92,phase);this.vfx(c,art,x+.58+sway,y-.38,.43,.64,-phase*.8,true);}
   if(e.hiccupPulse>0){const art=assets['vfx-hiccup-v1'],p=1-e.hiccupPulse/22;this.vfx(c,art,x+.42+p*.34,y-.35-p*.36,.58+p*.3,.42+e.hiccupPulse/28,-.22);}
   if(e.slime>0){const art=assets['vfx-slime-v1'];for(let i=2;i<Math.min(e.length,14);i+=2){const j=(e.head-i+e.bx.length)%e.bx.length;this.vfx(c,art,e.bx[j]+.5,e.by[j]+.78,.72-(i%4)*.035,.74-i*.016,(i&2)?.2:-.18,i%4===0);}}
   if(e.fairy>0&&e.portalFlash>0){const art=assets['vfx-fairy-v1'],alpha=e.portalFlash/30;for(let side=0;side<2;side++){const tx=(side?e.portalToX:e.portalFromX)+.5,ty=(side?e.portalToY:e.portalFromY)+.5;for(let i=0;i<3;i++){const a=phase+i*2.1+side,d=.25+(30-e.portalFlash)/30*(.5+i*.12);this.vfx(c,art,tx+Math.cos(a)*d,ty+Math.sin(a)*d,.38-i*.035,alpha*(.86-i*.12),a,side===1);}}}
  },
  fit(w,h){return Math.max(h/SCALE.rows,w/SCALE.columns);},
  paint(s){
   const v=s.view,e=s.engine,c=s.ctx;if(!v)return;
   e.interpolate(Math.min(1,e.phase+(s.state==='play'?(s.acc||0)*e.speed:0)));
   const scale=v.scale,sx=v.w*(s.mobile()?.58:.52),sy=v.h*.55;
   s.camera={x:e.rx[0]+.5,y:e.ry[0]+.5};
   const left=s.camera.x-sx/scale,top=s.camera.y-sy/scale,right=left+v.w/scale,bottom=top+v.h/scale;
   c.setTransform(v.dpr,0,0,v.dpr,0,0);c.imageSmoothingEnabled=false;c.fillStyle='#142b25';c.fillRect(0,0,v.w,v.h);
   c.translate(sx-s.camera.x*scale,sy-s.camera.y*scale);c.scale(scale,scale);
   c.fillStyle='#233e32';c.fillRect(left,top,v.w/scale,v.h/scale);
   if(!geometry&&this.ground){
    const visible=this.visibleKeys||(this.visibleKeys=new Set());visible.clear();
    for(let cy=Math.floor(top/CHUNK);cy<=Math.floor(bottom/CHUNK);cy++)for(let cx=Math.floor(left/CHUNK);cx<=Math.floor(right/CHUNK);cx++){
     const entry=this.groundChunk(s,cx,cy);visible.add(entry.id);c.drawImage(entry.floor,cx*CHUNK,cy*CHUNK,CHUNK,CHUNK);
    }
    for(const key of s.chunks.keys())if(!visible.has(key))s.chunks.delete(key);
    // Cached decor remains non-colliding and is clipped away from the immediate
    // reading zone. Structural obstacles are painted afterwards and stay visible.
    c.save();c.beginPath();c.rect(left-1,top-1,right-left+2,bottom-top+2);c.arc(e.rx[0]+.5,e.ry[0]+.5,3.15,0,Math.PI*2);
    for(const item of e.items)if(item.active&&item.kind==='food')c.arc(item.x+.5,item.y+.5,1.35,0,Math.PI*2);c.clip('evenodd');
    const pulse=e.ticks*.025;
    for(let cy=Math.floor(top/CHUNK);cy<=Math.floor(bottom/CHUNK);cy++)for(let cx=Math.floor(left/CHUNK);cx<=Math.floor(right/CHUNK);cx++){
     const entry=this.groundChunk(s,cx,cy);c.drawImage(entry.decor,cx*CHUNK,cy*CHUNK,CHUNK,CHUNK);
     for(let i=0;i<entry.ambient.length;i+=3){
      const x=entry.ambient[i],y=entry.ambient[i+1]+Math.sin(pulse+entry.ambient[i+2])*.07,a=.38+Math.sin(pulse*1.3+entry.ambient[i+2])*.18;
      c.globalAlpha=a;c.fillStyle='#e6ffb6';c.fillRect(x-.02,y-.02,.04,.04);c.globalAlpha=a*.45;c.fillStyle='#79dca6';c.fillRect(x-.05,y-.05,.1,.1);
     }
    }
    c.globalAlpha=1;c.restore();
   }
   for(let y=Math.floor(top);y<bottom;y++)for(let x=Math.floor(left);x<right;x++){
    if(e.world.blocked(x,y)){
     const n=hash(x,y,e.world.seed);if(!geometry&&this.objects)this.object(c,n%5,x+.5,y+.5,SCALE.obstacle*(.9+((n>>>9)&7)*.012),n);
     else{c.fillStyle='#849180';c.fillRect(x+.03,y+.03,.94,.94);}
    }
   }
   for(const f of e.items)if(f.active&&f.kind==='food'){
    const fx=(Number.isFinite(f.px)?f.px:f.x)+.5,fy=(Number.isFinite(f.py)?f.py:f.y)+.5;if(!geometry&&this.food)this.foodSprite(c,fx,fy,SCALE.food);
    else{c.fillStyle='#ffcf64';c.beginPath();c.arc(fx,fy,SCALE.food/2,0,Math.PI*2);c.fill();}
   }
   for(const f of e.items)if(f.active&&f.kind!=='food'){const effect=EFFECTS[f.kind],image=effect&&s.assets[effect.asset],particle=s.assets['vfx-'+f.kind+'-v1'],fx=(Number.isFinite(f.px)?f.px:f.x)+.5,fy=(Number.isFinite(f.py)?f.py:f.y)+.5;if(!geometry&&image)this.pickupSprite(c,image,particle,fx,fy,e.ticks);else{c.fillStyle=effect?.bad?'#ef5775':'#b8f173';c.fillRect(fx-.35,fy-.35,.7,.7);}}
   if(e.fairy>0&&e.portals)for(let i=0;i<e.portals.length;i++){const portal=e.portals[i],image=s.assets[i?'portal-fairy-exit-v1':'portal-fairy-entry-v1'];this.portal(c,image,s.assets['vfx-fairy-v1'],portal.x,portal.y,e.ticks,i);}
   const draw=(i,bodyOnly=false)=>{
    const p=bodyOnly?at(e,i):placement(e,i),x=p.x+.5,y=p.y+.5;if(x<left-2||x>right+2||y<top-2||y>bottom+2)return;
    const part=select(e,i,bodyOnly);c.save();if(e.ghost>0||e.ghostGrace)c.globalAlpha=.62;c.translate(x,y);
    if(!geometry&&this.atlas){this.sprite(c,part,this.segmentSize(i,e.length,part));c.restore();return;}
    // Dev geometry only. No generated art is accepted implicitly by this preview.
    c.fillStyle=i===0?'#ffbd72':part.kind==='corner'?'#89c9ae':'#c9d69a';
    if(part.kind==='head'){c.beginPath();c.arc(0,0,SCALE.head/2,0,Math.PI*2);c.fill();}
    else if(part.kind==='tail'){c.rotate((part.direction-1)*Math.PI/2);c.beginPath();c.moveTo(-.5,-.38);c.quadraticCurveTo(.3,-.3,.58,0);c.quadraticCurveTo(.3,.3,-.5,.38);c.closePath();c.fill();}
    else if(part.kind==='corner'){
     const current=at(e,i),before=at(e,i-1),after=at(e,i+1);
     c.strokeStyle=c.fillStyle;c.lineWidth=.78;c.lineJoin='round';c.lineCap='butt';
     c.beginPath();c.moveTo((before.x-current.x)*.52,(before.y-current.y)*.52);c.quadraticCurveTo(0,0,(after.x-current.x)*.52,(after.y-current.y)*.52);c.stroke();
    }else{c.rotate(part.direction%2===0?Math.PI/2:0);c.fillRect(-.52,-.39,1.04,.78);}
    c.restore();
   };
   // Only the endpoints move along the path. Interior junctions remain on their
   // cardinal cells; translating elbows cuts the corner during interpolation.
   // Clip sprite coverage to the live path, without drawing any strip beneath it.
   c.save();c.translate(0,.12);c.strokeStyle='#06120bb8';c.lineWidth=.6;c.lineJoin='round';c.lineCap='round';c.beginPath();
   const cap=e.bx.length;let shadowOpen=false;
   for(let i=0;i<e.length;i++){
    const j=(e.head-i+cap)%cap,x=(i?e.bx[j]:e.rx[0])+.5,y=(i?e.by[j]:e.ry[0])+.5,inside=x>left-1&&x<right+1&&y>top-1&&y<bottom+1;
    if(inside){if(shadowOpen)c.lineTo(x,y);else{c.moveTo(x,y);shadowOpen=true;}}else shadowOpen=false;
   }
   c.stroke();c.restore();
   c.save();c.beginPath();
   let previous={x:e.rx[0]+.5,y:e.ry[0]+.5};
   for(let i=1;i<=e.length;i++){
    const p=i===e.length?{x:e.rx[e.length-1]+.5,y:e.ry[e.length-1]+.5}:(()=>{const a=at(e,i);return{x:a.x+.5,y:a.y+.5};})();
    const l=Math.min(p.x,previous.x)-.5,t=Math.min(p.y,previous.y)-.5;
    c.rect(l,t,Math.abs(p.x-previous.x)+1,Math.abs(p.y-previous.y)+1);previous=p;
   }
   c.clip();
   // The terminal cell is exclusively the pointed tail sprite. Painting its
   // bodyOnly fallback first creates a second full-width silhouette underneath.
   for(let i=e.length-2;i>0;i--)if(select(e,i,true).kind!=='corner')draw(i,true);
   for(let i=e.length-2;i>0;i--)if(select(e,i,true).kind==='corner')draw(i,true);
   c.restore();
   draw(e.length-1);draw(0);this.effectAura(c,e,s.assets);
  }
 };
 root.MushroomSnakeForest=Forest;
})(window);
