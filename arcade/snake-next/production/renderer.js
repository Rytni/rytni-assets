import {DevRenderer} from '../presentation/renderer.js';
import {prepareCharacter} from './assets.js';

/** Art is a read-only skin on the accepted continuous geometry. */
export class ProductionRenderer extends DevRenderer {
  constructor(canvas,capacity,assets){
    super(canvas,capacity);this.assets=assets;this.art=prepareCharacter(assets);this.neutral=true;this.pointScratch={x:0,y:0,dx:0,dy:0};
    this.pattern=this.ctx.createPattern(this.art.skin,'repeat');this.pattern.setTransform(new DOMMatrix().scale(3/48));
  }
  contour(){
    const {polygon:p,count:n,head:h}=this.body,path=new Path2D();
    path.moveTo(p[0],p[1]);for(let i=1;i<n;i++)path.lineTo(p[i*4],p[i*4+1]);
    for(let i=n-1;i>=0;i--)path.lineTo(p[i*4+2],p[i*4+3]);path.closePath();
    const angle=Math.atan2(h.dy,h.dx);path.moveTo(h.x+Math.cos(angle)*.46,h.y+Math.sin(angle)*.46);
    path.ellipse(h.x,h.y,.46,.40,angle,0,Math.PI*2);return path;
  }
  character(ctx,x0,y0,x1,y1){
    const path=this.contour(),b=this.body,h=b.head;
    ctx.save();ctx.translate(0,.13);ctx.fillStyle=this.shadowQA?'#00000068':'#07150f85';ctx.fill(path);ctx.restore();
    ctx.fillStyle='#eadcba';ctx.fill(path);ctx.strokeStyle='#5b5934';ctx.lineWidth=.05;ctx.lineJoin='round';ctx.stroke(path);
    ctx.save();ctx.clip(path);ctx.fillStyle=this.pattern;ctx.fill(path);
    // Decorations are attached by distance from the canonical terminal endpoint.
    // The SAME taper controls their scale and the SAME contour clips them.
    for(let back=.9;back<b.span-.9;back+=2.6){
      const d=b.end-back,p=b.point(d,this.pointScratch);if(p.x<x0-1||p.x>x1+1||p.y<y0-1||p.y>y1+1)continue;
      const taper=Math.min(1,back/Math.min(3,b.span*.55)),size=.56*taper;
      ctx.drawImage(this.art.moss,p.x-size/2,p.y-size/2,size,size*this.art.moss.height/this.art.moss.width);
    }
    ctx.restore();
    const index=h.dx>0?0:h.dy>0?1:h.dx<0?2:3,img=this.art.heads[index],w=index%2?.96:1.20,hh=index%2?1.20:.96;
    ctx.drawImage(img,h.x-w/2,h.y-hh/2,w,hh);
  }
  draw({snapshots,arena,food,alpha,dt=1/60,resetCamera=false}){
    const ctx=this.ctx;ctx.reset();ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.save();
    try{
      this.body.build(snapshots,arena.width,alpha);this.camera.update(this.body.head,arena.width,arena.height,this.width,this.height,dt,resetCamera);
      ctx.scale(this.dpr,this.dpr);ctx.fillStyle=this.neutral?'#283336':'#14281a';ctx.fillRect(0,0,this.width,this.height);
      if(this.injectFault){this.injectFault=false;ctx.beginPath();ctx.rect(0,0,15,15);ctx.clip();throw Error('Injected presentation fault');}
      const c=this.camera,s=c.scale;ctx.translate(this.width/2-c.x*s,this.height/2-c.y*s);ctx.scale(s,s);ctx.imageSmoothingEnabled=false;
      const x0=Math.max(0,Math.floor(c.x-this.width/s/2)),x1=Math.min(arena.width,Math.ceil(c.x+this.width/s/2)),y0=Math.max(0,Math.floor(c.y-this.height/s/2)),y1=Math.min(arena.height,Math.ceil(c.y+this.height/s/2));
      if(!this.neutral&&this.forest)this.forest.draw(ctx,arena,x0,y0,x1,y1,food,performance.now());
      this.character(ctx,x0,y0,x1,y1);return true;
    }catch(error){this.faults++;this.diagnostic=error.message;ctx.reset();ctx.fillStyle='#283336';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);return false;}
    finally{ctx.restore();}
  }
}
