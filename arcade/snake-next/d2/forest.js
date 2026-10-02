import {visualHash} from './material.js';
import {atlasSprite,OBJECT_SLOTS} from './resources.js';

export class D2Forest {
  constructor(resources,seed){this.resources=resources;this.seed=seed;this.cache=new Map();this.decor=[];this.obstacles=[];this.objects=[];}
  prepare(arena,visuals){
    this.dispose();this.arena=arena;this.objects=visuals.objects.map(p=>({...p}));
    this.obstacles=visuals.obstacles.filter(p=>arena.blocked(p.y*arena.width+p.x)).map(p=>({...p}));
    this.decor=[];
    // Cluster recipes sampled in world space. Clear central traversal rather than uniform scatter.
    for(let y=3;y<arena.height-3;y+=5)for(let x=3;x<arena.width-3;x+=5){
      const h=visualHash(this.seed,x+y*arena.width);if(h%4!==0)continue;
      const cx=x+(h%250)/100,cy=y+((h>>>8)%220)/100;
      if(cx>26&&cx<55&&cy>23&&cy<37)continue;
      for(let j=0;j<2+h%3;j++){const q=visualHash(h,j);const dx=cx+(q%220-110)/100,dy=cy+((q>>>8)%200-100)/100;this.decor.push({kind:'decor',x:dx,y:dy,size:1+(q>>>16)%100/100,variant:q%3});}
    }
    return this;
  }
  cacheChunk(x,y,create){
    const key=`${x},${y}`;if(this.cache.has(key))return this.cache.get(key);
    while(this.cache.size>=48){const old=this.cache.keys().next().value,canvas=this.cache.get(old);this.resources.release(`ground:${old}`);canvas.width=canvas.height=0;this.cache.delete(old);}
    const canvas=create();this.cache.set(key,canvas);this.resources.track(`ground:${key}`,canvas.width,canvas.height,'ground');return canvas;
  }
  compose(x,y){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#334631';ctx.fillRect(0,0,192,192);const tile=this.resources.get('ground');if(tile){ctx.globalAlpha=.58;ctx.drawImage(tile,0,0,192,192);ctx.globalAlpha=1;}
    // Large overlapping patches centered in global coordinates cross chunk edges identically.
    for(let gy=y-1;gy<=y+1;gy++)for(let gx=x-1;gx<=x+1;gx++){const h=visualHash(this.seed,gx+gy*1009),px=(gx-x)*192+(h%192),py=(gy-y)*192+((h>>>8)%192);ctx.fillStyle=h%2?'rgba(95,80,48,.12)':'rgba(20,55,40,.17)';ctx.beginPath();ctx.ellipse(px,py,90+h%50,55+(h>>>8)%40,h%314/100,0,Math.PI*2);ctx.fill();}
    return canvas;
  }
  draw(ctx,bounds,clock,food=-1){
    const {x0,y0,x1,y1}=bounds,atlas=this.resources.get('objects');
    for(let cy=Math.floor(y0/8);cy<=Math.floor(y1/8);cy++)for(let cx=Math.floor(x0/8);cx<=Math.floor(x1/8);cx++){
      const tile=this.cacheChunk(cx,cy,()=>this.compose(cx,cy));ctx.drawImage(tile,cx*8-.012,cy*8-.012,8.024,8.024);
    }
    if(!atlas)return;
    for(const p of this.decor)if(p.x>x0-2&&p.x<x1+2&&p.y>y0-2&&p.y<y1+2){ctx.globalAlpha=.40;atlasSprite(ctx,atlas,7,4,2,p.x,p.y,p.size);}
    ctx.globalAlpha=1;
    for(const p of this.obstacles)if(p.x>x0-2&&p.x<x1+2&&p.y>y0-2&&p.y<y1+2)atlasSprite(ctx,atlas,OBJECT_SLOTS[p.kind],4,2,p.x+.5,p.y+.5,1.45);
    for(const p of this.objects)if(p.x>x0-3&&p.x<x1+3&&p.y>y0-3&&p.y<y1+3){const size=p.kind==='portal'?3.5:1.15;atlasSprite(ctx,atlas,OBJECT_SLOTS[p.kind],4,2,p.x,p.y,size,p.kind==='portal'?3:size);}
    if(food>=0)atlasSprite(ctx,atlas,0,4,2,food%this.arena.width+.5,Math.floor(food/this.arena.width)+.5,1.15);
    // Six authored leaf-shaped ambient specks, capped independent of Snake length.
    ctx.fillStyle='rgba(217,199,133,.28)';for(let i=0;i<6;i++){const h=visualHash(this.seed,i),x=(h%9000)/100+(Math.sin(clock*.25+i)*.15),y=((h>>>12)%5800)/100; if(x>x0&&x<x1&&y>y0&&y<y1){ctx.beginPath();ctx.ellipse(x,y,.045,.02,i,0,Math.PI*2);ctx.fill();}}
  }
  dispose(){for(const [key,canvas] of this.cache){this.resources.release(`ground:${key}`);canvas.width=canvas.height=0;}this.cache.clear();}
}
