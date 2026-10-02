import {Camera} from '../presentation/camera.js';
import {buildTiles,tileKey,direction} from './tiles.js';

/** Read-only, dedicated arcade tiles. One authoritative grid state, no partial interpolation. */
export class RetroRenderer {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.camera=new Camera();this.tiles=buildTiles();this.faults=0;this.resizes=0;this.time=0;this.diagnostic='';this.snakeCache=document.createElement('canvas');this.cacheHead=-1;
  this.grid=document.createElement('canvas');this.grid.width=this.grid.height=64;const c=this.grid.getContext('2d');c.fillStyle='#122e2b';c.fillRect(0,0,64,64);c.fillStyle='#16332e';c.fillRect(1,1,62,62);c.fillStyle='#1d3c34';c.fillRect(0,0,64,1);c.fillRect(0,0,1,64);c.fillStyle='#203b32';c.fillRect(17,37,2,2);this.pattern=this.ctx.createPattern(this.grid,'repeat');
 }
 resize(w,h,dpr=1){this.w=w;this.h=h;this.dpr=Math.min(2,dpr);const bw=Math.round(w*this.dpr),bh=Math.round(h*this.dpr);if(this.canvas.width!==bw||this.canvas.height!==bh){this.canvas.width=bw;this.canvas.height=bh;this.resizes++;}}
 draw({snapshots,arena,food,dt,resetCamera}){
  const ctx=this.ctx,cells=snapshots.current,n=snapshots.length;if(!n)return;const head=cells[0],next=cells[1],d=head-next;this.time+=dt;
  this.camera.update({x:head%arena.width+.5,y:Math.floor(head/arena.width)+.5,dx:d===1?1:d===-1?-1:0,dy:d===arena.width?1:d===-arena.width?-1:0},arena.width,arena.height,this.w,this.h,dt,resetCamera);
  const s=this.camera.scale,ox=this.w/2-this.camera.x*s,oy=this.h/2-this.camera.y*s;
  this.transform={s,ox,oy};ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.fillStyle='#0c2422';ctx.fillRect(0,0,this.w,this.h);
  ctx.save();ctx.translate(ox,oy);ctx.scale(s,s);ctx.imageSmoothingEnabled=true;this.pattern.setTransform(new DOMMatrix().scale(1/64));ctx.fillStyle=this.pattern;ctx.fillRect(-ox/s,-oy/s,this.w/s,this.h/s);
  const left=Math.max(0,Math.floor(-ox/s)),right=Math.min(arena.width,Math.ceil((this.w-ox)/s)),top=Math.max(0,Math.floor(-oy/s)),bottom=Math.min(arena.height,Math.ceil((this.h-oy)/s));
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
   if(arena.blocked(y*arena.width+x)){ctx.fillStyle='#091e1e';ctx.fillRect(x+.08,y+.13,.84,.79);ctx.fillStyle='#426053';ctx.fillRect(x+.1,y+.08,.8,.17);ctx.fillStyle='#2c4b43';ctx.fillRect(x+.1,y+.25,.8,.57);ctx.fillStyle='#587265';ctx.fillRect(x+.17,y+.15,.28,.045);}
   else if((x<3||y<3||x>arena.width-4||y>arena.height-4)&&(x*17+y*31)%9===0){ctx.fillStyle='#355544';ctx.fillRect(x+.24,y+.47,.08,.22);ctx.fillRect(x+.34,y+.34,.08,.36);ctx.fillRect(x+.48,y+.42,.08,.27);}
  }
  this.object(ctx,'food',food,arena.width);
  if(this.scene?.objects)for(const o of this.scene.objects)if(!o.used)this.object(ctx,o.kind,o.cell,arena.width);
  let start=0,end=n;const portal=this.scene?.portal;
  if(portal?.phase==='entering')start=Math.min(n,Math.floor(portal.progress*n));
  if(portal?.phase==='exiting')start=Math.max(0,n-Math.ceil(portal.progress*n));
  const death=this.scene?.death||0;if(death>.09)end=Math.max(0,n-Math.floor((death-.09)/.65*n));
  if(death>0&&death<.18)ctx.translate(Math.sin(death*160)*.08,Math.cos(death*110)*.06);
  if(!portal?.locked&&!death){this.cacheSnake(cells,n,arena.width);ctx.drawImage(this.snakeCache,this.cacheX,this.cacheY,this.cacheW,this.cacheH);}
  else for(let i=end-1;i>=start;i--){const at=portal?.phase==='entering'?i-start:i,cell=cells[at],x=cell%arena.width,y=Math.floor(cell/arena.width);if(x<left-1||x>right||y<top-1||y>bottom)continue;
   const facing=at<n-1?direction(cells[at],cells[at+1],arena.width):direction(cells[at-1],cells[at],arena.width);
   const key=i===start&&portal?.phase==='exiting'?`head${facing}`:i===n-1&&at>0?`tail${direction(cells[at],cells[at-1],arena.width)}`:tileKey(cells,at,n,arena.width),tile=this.tiles.get(key);
   ctx.drawImage(tile,x-.005,y-.005,1.01,1.01);
   if(i>1&&i<n-2&&i%37===17&&i<75){ctx.fillStyle='#e9d29f';ctx.fillRect(x+.47,y+.47,.06,.14);ctx.fillStyle='#c86a62';ctx.fillRect(x+.38,y+.38,.24,.1);ctx.fillStyle='#f3d8ac';ctx.fillRect(x+.42,y+.40,.04,.035);}
  }
  if(start<end&&portal?.phase!=='entering'&&((this.scene?.positive||0)>0||(this.scene?.negative||0)>0)){const cell=portal?.phase==='exiting'?cells[start]:head,facing=start<n-1?direction(cells[start],cells[start+1],arena.width):direction(cells[start-1],cells[start],arena.width);ctx.save();ctx.translate(cell%arena.width+.5,Math.floor(cell/arena.width)+.5);ctx.rotate((facing-1)*Math.PI/2);ctx.fillStyle=this.scene.negative>0?'#ed90aa':'#c8efd0';ctx.fillRect(-.34,-.20,.06,.40);ctx.restore();}
  if(death>0&&death<.16){ctx.globalAlpha=.8;ctx.fillStyle='#f9e3b7';ctx.fillRect(head%arena.width+.1,Math.floor(head/arena.width)+.1,.8,.8);ctx.globalAlpha=1;}
  if(portal?.locked)this.object(ctx,'portal',portal.phase==='entering'?portal.entry:portal.exit,arena.width);
  this.scene?.effects?.draw(ctx,s);ctx.restore();this.diagnostic=`${n} tiles · canonical grid`;
 }
 cacheSnake(cells,n,width){
  const pixels=this.h<500?32:48,halfW=this.w/this.camera.scale/2,halfH=this.h/this.camera.scale/2,viewLeft=this.camera.x-halfW,viewRight=this.camera.x+halfW,viewTop=this.camera.y-halfH,viewBottom=this.camera.y+halfH;
  if(this.cacheHead===cells[0]&&this.cacheLength===n&&this.cachePixels===pixels&&this.cacheViewportW===this.w&&this.cacheViewportH===this.h&&viewLeft>=this.regionLeft+1&&viewRight<=this.regionRight-1&&viewTop>=this.regionTop+1&&viewBottom<=this.regionBottom-1)return;
  this.cacheHead=cells[0];this.cacheLength=n;this.cachePixels=pixels;
  this.cacheViewportW=this.w;this.cacheViewportH=this.h;this.regionLeft=Math.floor(viewLeft)-4;this.regionRight=Math.ceil(viewRight)+4;this.regionTop=Math.floor(viewTop)-4;this.regionBottom=Math.ceil(viewBottom)+4;
  let minX=Infinity,minY=Infinity,maxX=0,maxY=0;for(let i=0;i<n;i++){const x=cells[i]%width,y=Math.floor(cells[i]/width);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  this.cacheX=Math.max(minX-1,this.regionLeft);this.cacheY=Math.max(minY-1,this.regionTop);this.cacheW=Math.min(maxX+2,this.regionRight)-this.cacheX;this.cacheH=Math.min(maxY+2,this.regionBottom)-this.cacheY;const bw=this.cacheW*pixels,bh=this.cacheH*pixels;
  if(this.snakeCache.width!==bw)this.snakeCache.width=bw;if(this.snakeCache.height!==bh)this.snakeCache.height=bh;
  const ctx=this.snakeCache.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,bw,bh);ctx.setTransform(pixels,0,0,pixels,-this.cacheX*pixels,-this.cacheY*pixels);
  for(let i=n-1;i>=0;i--){const x=cells[i]%width,y=Math.floor(cells[i]/width);if(x<this.cacheX-1||x>this.cacheX+this.cacheW||y<this.cacheY-1||y>this.cacheY+this.cacheH)continue;ctx.drawImage(this.tiles.get(tileKey(cells,i,n,width)),x-.005,y-.005,1.01,1.01);if(i>1&&i<n-2&&i%37===17&&i<75){ctx.fillStyle='#e9d29f';ctx.fillRect(x+.47,y+.47,.06,.14);ctx.fillStyle='#c86a62';ctx.fillRect(x+.38,y+.38,.24,.1);ctx.fillStyle='#f3d8ac';ctx.fillRect(x+.42,y+.40,.04,.035);}}
 }
 object(ctx,kind,cell,width){if(cell==null||cell<0)return;const x=cell%width+.5,y=Math.floor(cell/width)+.5;ctx.save();ctx.translate(x,y);
  if(kind==='food'){const k=1+Math.sin(this.time*4)*.045;ctx.scale(k,k);ctx.fillStyle='#a47f36';ctx.beginPath();ctx.moveTo(0,-.35);ctx.bezierCurveTo(.42,-.03,.22,.37,-.03,.31);ctx.bezierCurveTo(-.34,.24,-.29,-.05,0,-.35);ctx.fill();ctx.fillStyle='#f1cb72';ctx.beginPath();ctx.moveTo(0,-.31);ctx.bezierCurveTo(.29,-.02,.15,.27,-.04,.25);ctx.bezierCurveTo(-.24,.18,-.22,-.04,0,-.31);ctx.fill();ctx.strokeStyle='#fff0aa';ctx.lineWidth=.045;ctx.beginPath();ctx.moveTo(0,-.23);ctx.lineTo(-.04,.17);ctx.stroke();}
  else if(kind==='positive'){ctx.rotate(Math.sin(this.time*2)*.07);ctx.strokeStyle='#81d8b0';ctx.lineWidth=.09;ctx.beginPath();ctx.moveTo(0,-.34);ctx.lineTo(.31,0);ctx.lineTo(0,.34);ctx.lineTo(-.31,0);ctx.closePath();ctx.stroke();ctx.fillStyle='#d4f6d4';ctx.fillRect(-.065,-.065,.13,.13);}
  else if(kind==='negative'){ctx.fillStyle='#bb627e';ctx.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?.23:.38;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.fillStyle='#2c2438';ctx.fillRect(-.14,-.15,.28,.30);ctx.fillStyle='#f0a0ad';ctx.fillRect(-.03,-.10,.06,.12);ctx.fillRect(-.03,.065,.06,.045);}
  else {ctx.strokeStyle='#577b82';ctx.lineWidth=.16;ctx.beginPath();ctx.arc(0,0,.57,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#bad8c3';ctx.lineWidth=.07;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.arc(0,0,.57,a+.05,a+.45);ctx.stroke();}ctx.fillStyle='#071e27';ctx.beginPath();ctx.arc(0,0,.43,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#5eb6b5';ctx.lineWidth=.035;ctx.beginPath();ctx.arc(0,0,.33,this.time,this.time+Math.PI*1.3);ctx.stroke();ctx.fillStyle='#d1dcc0';ctx.fillRect(-.05,-.69,.1,.12);ctx.fillRect(-.05,.57,.1,.12);}
  ctx.restore();
 }
 inventory(){return {rasterBytes:(this.canvas.width*this.canvas.height+15*64*64+this.snakeCache.width*this.snakeCache.height)*4,snakeCacheBytes:this.snakeCache.width*this.snakeCache.height*4,atlases:0,decodedImages:0,duplicates:0};}
 dispose(){for(const c of this.tiles.values())c.width=c.height=0;this.tiles.clear();this.grid.width=this.grid.height=this.snakeCache.width=this.snakeCache.height=0;this.pattern=null;}
}
