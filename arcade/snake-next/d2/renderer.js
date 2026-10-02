import {D2Geometry} from './geometry.js';
import {D2Material} from './material.js';
import {D2Forest} from './forest.js';
import {Camera} from '../presentation/camera.js';
import {atlasSprite} from './resources.js';

// Bounds of physical head art within its independently generated 2x2 atlas.
const HEAD_BOUNDS=[[.287,.043,.484,.938],[.029,.316,.899,.537],[.287,.048,.493,.867],[.019,.234,.904,.536]];
export class D2Renderer {
  constructor(canvas,capacity,resources,{fixture}={}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.resources=resources;this.body=new D2Geometry(capacity);this.material=new D2Material(73,capacity);this.camera=new Camera();this.forest=new D2Forest(resources,73);
    if(fixture)this.forest.prepare(fixture.arena,fixture.visuals);
    this.view={lod:'auto',grayscale:false,debug:false};this.width=this.height=1;this.dpr=1;this.resizes=0;this.faults=0;this.time=0;this.accents=[];this.bounds={x0:0,y0:0,x1:0,y1:0};this.headVariants=[];this.diagnostic='';
  }
  setView(view){Object.assign(this.view,view);}
  resize(width,height,dpr){
    this.width=Math.max(1,width);this.height=Math.max(1,height);this.dpr=Math.min(2,Math.max(1,dpr));const w=Math.round(this.width*this.dpr),h=Math.round(this.height*this.dpr);
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.resizes++;}this.resources.track('d2-stage',w,h);
  }
  // One outline: body contour plus rounded head union. No per-cell discs or tail underlay.
  silhouette(){
    const g=this.body,p=new Path2D();this.traceContour(p);
    const h=g.head;p.moveTo(h.x+.34,h.y);p.ellipse(h.x,h.y,.34,.34,0,0,Math.PI*2);return p;
  }
  traceContour(p){
    const g=this.body,a=g.polygon,n=g.count,total=n*2-1;
    const offset=i=>i<n?i*4:(total-1-i)*4+2;
    for(let i=0;i<total;i++){
      const c=offset(i),prev=offset((i+total-1)%total),next=offset((i+1)%total),x=a[c],y=a[c+1],ax=a[prev]-x,ay=a[prev+1]-y,bx=a[next]-x,by=a[next+1]-y,al=Math.hypot(ax,ay),bl=Math.hypot(bx,by);
      const amount=i===n-1?0:Math.min(.23,al*.4,bl*.4),sx=x+(al?ax/al*amount:0),sy=y+(al?ay/al*amount:0),ex=x+(bl?bx/bl*amount:0),ey=y+(bl?by/bl*amount:0);
      if(i===0)p.moveTo(sx,sy);else p.lineTo(sx,sy);p.quadraticCurveTo(x,y,ex,ey);
    }p.closePath();
  }
  centerline(){const g=this.body,p=new Path2D();p.moveTo(g.head.x,g.head.y);for(let i=0;i<g.count;i++){g.point(g.distances[i],g.probe);p.lineTo(g.probe.x,g.probe.y);}return p;}
  prepareHeads(){
    if(this.headVariants.length)return;const image=this.resources.get('heads'),cell=image.width/2;
    for(let i=0;i<4;i++){
      const [bx,by,bw,bh]=HEAD_BOUNDS[i],c=document.createElement('canvas');c.width=i%2?256:144;c.height=i%2?144:256;const ctx=c.getContext('2d');
      ctx.drawImage(image,(i%2+bx)*cell,(Math.floor(i/2)+by)*cell,bw*cell,bh*cell,0,0,c.width,c.height);
      // Fade neck-only physical base into the common cream surface, prepared once.
      ctx.globalCompositeOperation='destination-in';const grad=ctx.createLinearGradient(i===1?0:i===3?c.width:0,i===2?0:i===0?c.height:0,i===1?c.width:i===3?0:0,i===2?c.height:i===0?0:0);grad.addColorStop(0,'transparent');grad.addColorStop(.22,'#fff');grad.addColorStop(1,'#fff');ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);this.headVariants.push(c);this.resources.track(`head:${i}`,c.width,c.height,'variants');
    }
  }
  draw({snapshots,arena,food,alpha,dt=1/60,resetCamera=false}){
    const ctx=this.ctx,g=this.body.build(snapshots,arena.width,alpha);this.material.capture(snapshots);this.camera.update(g.head,arena.width,arena.height,this.width,this.height,dt,resetCamera);this.time+=dt;
    const scale=this.camera.scale,tx=this.width/2-this.camera.x*scale,ty=this.height/2-this.camera.y*scale,b=this.bounds;b.x0=-tx/scale;b.y0=-ty/scale;b.x1=(this.width-tx)/scale;b.y1=(this.height-ty)/scale;
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.width,this.height);ctx.translate(tx,ty);ctx.scale(scale,scale);this.forest.draw(ctx,b,this.time,food);this.prepareHeads();
    const mask=this.silhouette(),line=this.centerline();ctx.save();ctx.translate(.045,.07);ctx.fillStyle='rgba(14,24,16,.24)';ctx.fill(mask);ctx.restore();
    ctx.fillStyle='#d9c597';ctx.fill(mask);ctx.save();ctx.clip(mask);ctx.lineJoin='round';ctx.lineCap='round';
    // Shared fixed-NW relief on a continuous surface, not a segment stamp.
    ctx.save();ctx.translate(.06,.07);ctx.strokeStyle='#b8a477';ctx.lineWidth=.65;ctx.stroke(line);ctx.restore();
    ctx.save();ctx.translate(-.045,-.05);for(let i=0;i<8;i++){ctx.strokeStyle=`rgb(${219+i*3},${201+i*3},${157+i*4})`;ctx.lineWidth=.61-i*.045;ctx.stroke(line);}ctx.restore();
    const lod=this.view.lod==='auto'?(scale<23?'small':'large'):this.view.lod;this.lod=lod;this.material.visibleAccents(g,b,lod,this.accents);
    for(const v of this.accents){const r=g.radiusAt(v.distance),size=Math.min(v.size,r*1.75),slot=v.kind==='mushroom'?5:v.kind==='flower'?4:v.variant;
      ctx.save();ctx.translate(v.x-v.dy*v.side,v.y+v.dx*v.side);ctx.rotate(Math.atan2(v.dy,v.dx)+(v.id*.73));ctx.globalAlpha=v.kind==='moss'?.67:.9;atlasSprite(ctx,this.resources.get('accents'),slot,3,2,0,0,size,size);ctx.restore();
      if(lod==='large'){ctx.save();ctx.translate(v.x,v.y);ctx.rotate(Math.atan2(v.dy,v.dx));ctx.strokeStyle='rgba(133,111,75,.19)';ctx.lineWidth=.013;ctx.beginPath();ctx.moveTo(-.23,-.16);ctx.quadraticCurveTo(-.13,0,-.25,.14);ctx.moveTo(.07,-.22);ctx.quadraticCurveTo(.17,-.07,.05,.06);ctx.stroke();ctx.restore();}
    }
    const heading=g.head.dx>0?1:g.head.dx<0?3:g.head.dy>0?2:0,h=g.head,img=this.headVariants[heading],long=1.12,wide=.69;
    ctx.drawImage(img,h.x-h.dx*.20-(heading%2?long:wide)/2,h.y-h.dy*.20-(heading%2?wide:long)/2,heading%2?long:wide,heading%2?wide:long);
    ctx.restore();
    if(this.view.debug){ctx.strokeStyle='rgba(246,153,86,.5)';ctx.lineWidth=1/scale;for(let i=0;i<snapshots.length;i++){const cell=snapshots.current[i];ctx.strokeRect(cell%arena.width,Math.floor(cell/arena.width),1,1);}ctx.strokeStyle='#f8edbc';ctx.stroke(mask);}
    this.diagnostic=`D.2 · ${lod} LOD · ${snapshots.length} cells · ${this.forest.cache.size}/48 ground · ${(this.inventory().totalBytes/1048576).toFixed(1)} MiB tracked`;
  }
  inventory(){return this.resources.inventory();}
  dispose(){this.forest.dispose();for(let i=0;i<this.headVariants.length;i++){this.headVariants[i].width=this.headVariants[i].height=0;this.resources.release(`head:${i}`);}this.headVariants.length=0;this.resources.release('d2-stage');this.canvas.width=this.canvas.height=0;}
}
