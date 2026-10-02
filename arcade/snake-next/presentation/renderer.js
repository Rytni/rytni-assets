import {ContinuousBody} from './path.js';
import {Camera} from './camera.js';

/** DEV shapes only. Receives snapshots/data, never simulation or gameplay callbacks. */
export class DevRenderer {
  constructor(canvas,capacity){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.body=new ContinuousBody(capacity);this.camera=new Camera();this.width=1;this.height=1;this.dpr=1;this.resizes=0;this.faults=0;this.injectFault=false;this.shadowQA=false;this.diagnostic='';}
  resize(width,height,dpr){
    this.width=Math.max(1,width);this.height=Math.max(1,height);this.dpr=Math.min(2,Math.max(1,dpr));
    const w=Math.round(this.width*this.dpr),h=Math.round(this.height*this.dpr);
    if(w!==this.canvas.width||h!==this.canvas.height){this.canvas.width=w;this.canvas.height=h;this.resizes++;}
  }
  silhouette(ctx,offset=0){
    const {polygon:p,count:n,head}=this.body;
    ctx.beginPath();ctx.moveTo(p[0],p[1]+offset);for(let i=1;i<n;i++)ctx.lineTo(p[i*4],p[i*4+1]+offset);
    for(let i=n-1;i>=0;i--)ctx.lineTo(p[i*4+2],p[i*4+3]+offset);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.ellipse(head.x,head.y+offset,.46,.40,Math.atan2(head.dy,head.dx),0,Math.PI*2);ctx.fill();
  }
  draw({snapshots,arena,food,alpha,dt=1/60,resetCamera=false}){
    const ctx=this.ctx;
    // reset() also resets the clip/save stack; backing dimensions are not touched.
    ctx.reset();ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.save();
    try {
      this.body.build(snapshots,arena.width,alpha);
      this.camera.update(this.body.head,arena.width,arena.height,this.width,this.height,dt,resetCamera);
      ctx.scale(this.dpr,this.dpr);ctx.fillStyle='#152420';ctx.fillRect(0,0,this.width,this.height);
      if(this.injectFault){this.injectFault=false;ctx.beginPath();ctx.rect(0,0,15,15);ctx.clip();throw Error('DEV injected renderer fault');}
      const c=this.camera,s=c.scale;
      ctx.translate(this.width/2-c.x*s,this.height/2-c.y*s);ctx.scale(s,s);
      const x0=Math.max(0,Math.floor(c.x-this.width/s/2)),x1=Math.min(arena.width,Math.ceil(c.x+this.width/s/2)),y0=Math.max(0,Math.floor(c.y-this.height/s/2)),y1=Math.min(arena.height,Math.ceil(c.y+this.height/s/2));
      ctx.lineWidth=.035;ctx.strokeStyle='#233c32';ctx.beginPath();
      for(let x=x0;x<=x1;x++){ctx.moveTo(x,y0);ctx.lineTo(x,y1);}for(let y=y0;y<=y1;y++){ctx.moveTo(x0,y);ctx.lineTo(x1,y);}ctx.stroke();
      ctx.fillStyle='#68736c';for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(arena.blocked(y*arena.width+x))ctx.fillRect(x+.08,y+.08,.84,.84);
      if(food>=0){ctx.fillStyle='#ff8252';ctx.beginPath();ctx.arc(food%arena.width+.5,Math.floor(food/arena.width)+.5,.31,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0a0';ctx.fillRect(food%arena.width+.43,Math.floor(food/arena.width)+.38,.14,.14);}
      ctx.fillStyle=this.shadowQA?'#cd48d080':'#00000048';this.silhouette(ctx,.13);
      ctx.fillStyle='#d8e6ae';this.silhouette(ctx);
      const h=this.body.head;ctx.fillStyle='#8abb73';ctx.beginPath();ctx.ellipse(h.x,h.y,.44,.38,Math.atan2(h.dy,h.dx),0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#102519';for(const side of [-1,1]){ctx.beginPath();ctx.arc(h.x+h.dx*.16-h.dy*.19*side,h.y+h.dy*.16+h.dx*.19*side,.065,0,Math.PI*2);ctx.fill();}
      // Off-camera food guidance is presentation-only; does not despawn/change food.
      if(food>=0&&(food%arena.width<x0||food%arena.width>=x1||Math.floor(food/arena.width)<y0||Math.floor(food/arena.width)>=y1)){
        ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.fillStyle='#ffbd95';ctx.font='14px sans-serif';ctx.fillText(`FOOD → (${food%arena.width}, ${Math.floor(food/arena.width)})`,12,this.height-12);
      }
      return true;
    }catch(error){
      this.faults++;this.diagnostic=error.message;ctx.reset();ctx.fillStyle='#26312b';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.fillStyle='#ffd896';ctx.font=`${16*this.dpr}px sans-serif`;ctx.fillText('DEV renderer recovered; next frame will repaint',12*this.dpr,28*this.dpr);return false;
    }finally{ctx.restore();}
  }
}
