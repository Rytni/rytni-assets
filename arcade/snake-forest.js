/* Green Forest presentation. World units remain simulation cells. */
(function(root){
 'use strict';
 const {select,at,placement}=root.MushroomSnakeSegments;
 const SCALE={rows:12,columns:30,head:1.35,body:1.04,food:.9,obstacle:1};
 const geometry=new URLSearchParams(location.search).has('snake_geometry');
 const BASE='https://rytni.github.io/rytni-assets/grib/mushroom-snake-v2/';
 const {hash,CHUNK}=root.MushroomSnakeCore;
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
    [this.ground,this.decor,this.objects]=await Promise.all([picture('forest-ground-v1'),picture('forest-decor-v1'),picture('forest-objects-v1')]);
    this.decorFrames=frames(this.decor,4,1);
    this.objectFrames=frames(this.objects,3,2);
   })();try{return await this.ready;}catch(e){this.ready=null;throw e;}
  },
  object(c,index,x,y,size){
   const f=this.objectFrames[index],k=size/Math.max(f.w,f.h);
   c.drawImage(this.objects,f.x,f.y,f.w,f.h,x-f.w*k/2,y-f.h*k/2,f.w*k,f.h*k);
  },
  groundChunk(s,cx,cy){
   const id='forest:'+s.engine.world.seed+':'+cx+','+cy;if(s.chunks.has(id))return s.chunks.get(id);
   const canvas=document.createElement('canvas');canvas.width=canvas.height=CHUNK*32;
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
   for(let y=0;y<CHUNK;y+=4)for(let x=0;x<CHUNK;x+=4){
    c.drawImage(this.ground,x*32,y*32,128,128);
   }
   c.fillStyle='#102d2680';c.fillRect(0,0,canvas.width,canvas.height);
   for(let y=0;y<CHUNK;y++)for(let x=0;x<CHUNK;x++){
    const wx=cx*CHUNK+x,wy=cy*CHUNK+y,n=hash(wx,wy,s.engine.world.seed);
    // Low contrast soil/leaf variation, with no tile-sized solid rectangles.
    if(n%11===0){c.fillStyle='#66482a18';c.beginPath();c.ellipse(x*32+16,y*32+16,25,17,n%6,0,Math.PI*2);c.fill();}
    if(n%19===0&&!s.engine.world.blocked(wx,wy)){
     const type=n%4,f=this.decorFrames[type],size=type===3?17:24,k=size/Math.max(f.w,f.h);
     c.globalAlpha=type===3?.7:.8;c.drawImage(this.decor,f.x,f.y,f.w,f.h,x*32+(32-f.w*k)/2,y*32+(32-f.h*k)/2,f.w*k,f.h*k);c.globalAlpha=1;
    }
   }
   s.chunks.set(id,canvas);return canvas;
  },
  sprite(c,part){
   let cell=part.cell,flip=false;
   // Atlas elbow 9 points left/down: mirror it for the right/down port pair.
   if(cell===9)flip=true;else if(cell===10)cell=9;
   const f=this.frames[cell];if(flip)c.scale(-1,1);
   if(part.kind==='corner'){
    // Elbows extend into the two neighbouring cells. Register by the port
    // intersection, not the bounding-box centre (which shifts an L off-path).
    const [ax,ay]=cell===8?[.24,.76]:cell===9?[.73,.28]:[.75,.75];
    const k=2/(f.w*Math.max(ax,1-ax)+f.h*Math.max(ay,1-ay));
    c.drawImage(this.atlas,f.x,f.y,f.w,f.h,-f.w*ax*k,-f.h*ay*k,f.w*k,f.h*k);
   }else{
    const size=part.kind==='head'?SCALE.head:part.kind==='tail'?1.4:1.55,k=size/Math.max(f.w,f.h);
    c.drawImage(this.atlas,f.x,f.y,f.w,f.h,-f.w*k/2,-f.h*k/2,f.w*k,f.h*k);
   }
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
    const visible=new Set();
    for(let cy=Math.floor(top/CHUNK);cy<=Math.floor(bottom/CHUNK);cy++)for(let cx=Math.floor(left/CHUNK);cx<=Math.floor(right/CHUNK);cx++){
     visible.add('forest:'+e.world.seed+':'+cx+','+cy);c.drawImage(this.groundChunk(s,cx,cy),cx*CHUNK,cy*CHUNK,CHUNK,CHUNK);
    }
    for(const key of s.chunks.keys())if(!visible.has(key))s.chunks.delete(key);
   }
   for(let y=Math.floor(top);y<bottom;y++)for(let x=Math.floor(left);x<right;x++){
    if(e.world.blocked(x,y)){
     if(!geometry&&this.objects)this.object(c,hash(x,y,e.world.seed)%5,x+.5,y+.5,SCALE.obstacle);
     else{c.fillStyle='#849180';c.fillRect(x+.03,y+.03,.94,.94);}
    }
   }
   for(const f of e.items)if(f.active&&f.kind==='food'){
    if(!geometry&&this.objects)this.object(c,5,f.x+.5,f.y+.5,SCALE.food);
    else{c.fillStyle='#ffcf64';c.beginPath();c.arc(f.x+.5,f.y+.5,SCALE.food/2,0,Math.PI*2);c.fill();}
   }
   const draw=(i,bodyOnly=false)=>{
    const p=bodyOnly?at(e,i):placement(e,i),x=p.x+.5,y=p.y+.5;if(x<left-2||x>right+2||y<top-2||y>bottom+2)return;
    const part=select(e,i,bodyOnly);c.save();c.translate(x,y);
    if(!geometry&&this.atlas){this.sprite(c,part);c.restore();return;}
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
   c.save();c.beginPath();
   let previous={x:e.rx[0]+.5,y:e.ry[0]+.5};
   for(let i=1;i<=e.length;i++){
    const p=i===e.length?{x:e.rx[e.length-1]+.5,y:e.ry[e.length-1]+.5}:(()=>{const a=at(e,i);return{x:a.x+.5,y:a.y+.5};})();
    const l=Math.min(p.x,previous.x)-.5,t=Math.min(p.y,previous.y)-.5;
    c.rect(l,t,Math.abs(p.x-previous.x)+1,Math.abs(p.y-previous.y)+1);previous=p;
   }
   c.clip();
   for(let i=e.length-1;i>0;i--)if(select(e,i,true).kind!=='corner')draw(i,true);
   for(let i=e.length-1;i>0;i--)if(select(e,i,true).kind==='corner')draw(i,true);
   c.restore();
   draw(e.length-1);draw(0);
  }
 };
 root.MushroomSnakeForest=Forest;
})(window);
