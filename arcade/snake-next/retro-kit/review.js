import {loadKit,fixture,selectTiles,paintScene,drawSnake,drawFrame,pixelQA,hash,sceneLayout} from './renderer.js';
const kit=await loadKit(),canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d');
const params=new URLSearchParams(location.search);if(params.has('proof'))document.body.classList.add('proof');
let options={length:Number(params.get('length')||22),shape:params.get('shape')||'S',direction:Number(params.get('direction')||1)},layout,tiles;
function paint(){
 tiles=selectTiles(fixture(options.length,options.shape,options.direction));
 const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 layout=paintScene(ctx,kit,r.width,r.height,tiles,{mobile:r.width<1000,pressed:options.pressed});
 if(!layout.dpad)document.querySelectorAll('.hit').forEach(b=>b.remove());
 else for(const [key,x,y]of [['up',36,0],['left',0,36],['right',72,36],['down',36,72]]){
  let b=document.querySelector(`[data-direction="${key}"]`);
  if(!b){b=document.createElement('button');b.className='hit';b.dataset.direction=key;b.setAttribute('aria-label',key);
   b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);options.pressed=key;paint();});
   const release=()=>{options.pressed=null;paint();};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);
   document.querySelector('#stage').append(b);
  }
  b.style.left=layout.dpad.x+x+'px';b.style.top=layout.dpad.y+y+'px';
 }
}
for(const id of ['length','shape','direction'])document.querySelector('#'+id).addEventListener('change',e=>{options[id]=id==='shape'?e.target.value:Number(e.target.value);paint();});
document.querySelector('#gray').onclick=()=>canvas.classList.toggle('gray');
document.querySelector('#fullscreen').onclick=()=>document.querySelector('#stage').requestFullscreen();
document.querySelector('#seams').onclick=()=>document.querySelector('#status').textContent=JSON.stringify(pixelQA(kit),null,2);
new ResizeObserver(paint).observe(canvas);
if(!params.has('proof')){
function card(parent,title,w,h,fn,checker=false){const el=document.createElement('article');el.className='card';const label=document.createElement('div');label.textContent=title;el.append(label);const c=document.createElement('canvas');c.width=w;c.height=h;if(checker)c.className='check';el.append(c);document.querySelector('#'+parent).append(el);const cx=c.getContext('2d');cx.imageSmoothingEnabled=false;fn(cx);return c;}
for(const heading of [0,1,2,3])card('anatomy','Head '+['UP','RIGHT','DOWN','LEFT'][heading],320,110,c=>{const p=selectTiles(fixture(4,'straight',heading)),minX=Math.min(...p.map(t=>t.x)),minY=Math.min(...p.map(t=>t.y));drawSnake(c,kit,p,24,35-minX*24,18-minY*24);});
for(const [shape,length]of [['straight',8],['corner',8],['U',8],['S',22],['parallel',100]])card('anatomy',shape+' · length '+length,440,240,c=>{const p=selectTiles(fixture(length,shape)),minX=Math.min(...p.map(t=>t.x)),minY=Math.min(...p.map(t=>t.y)),maxX=Math.max(...p.map(t=>t.x)),maxY=Math.max(...p.map(t=>t.y)),s=Math.min(26,400/(maxX-minX+2),210/(maxY-minY+2));drawSnake(c,kit,p,s,20-minX*s,14-minY*s);});
card('anatomy','All corner/taper assets · identical ports',640,160,c=>{kit.inventory.assets.filter(a=>a.id.includes('corner-')&&a.group==='snake').forEach((a,i)=>c.drawImage(kit.images.get(a.id),20+(i%6)*100,8+Math.floor(i/6)*76,60,60));});
for(const gray of [false,true])card('objects',gray?'Grayscale: silhouette ≠ color':'Native scale + 2× inspection',640,170,c=>{if(gray)c.filter='grayscale(1)';['food-magical-seed','pickup-positive','pickup-negative','portal','obstacle-stone'].forEach((id,i)=>{c.drawImage(kit.images.get(id),20+i*126,20,32,32);c.drawImage(kit.images.get(id),12+i*126,75,64,64);});});
for(const [title,w,h,size]of [['Landscape',640,340,96],['Compact landscape',480,220,64],['Mobile landscape',844,390,48]])card('frames',title,w,h,c=>{const inset=29*size/64;c.fillStyle='#063b35';c.fillRect(inset,inset,w-2*inset,h-2*inset);drawFrame(c,kit,0,0,w,h,size);},true);
const control=document.querySelector('#controls').getContext('2d');control.imageSmoothingEnabled=false;for(const [j,state]of [[0,'normal'],[1,'pressed']])['up','right','down','left'].forEach((d,i)=>control.drawImage(kit.images.get(`dpad-${d}-${state}`),20+i*64+j*280,34,40,40));
const effects=document.querySelector('#effects').getContext('2d');effects.imageSmoothingEnabled=false;effects.drawImage(kit.images.get('vfx-atlas'),0,0,1024,512);
}else document.querySelector('.details').remove();
paint();document.querySelector('#status').textContent=`Ready: ${kit.inventory.assets.length} sprites / ${(kit.bytes/1048576).toFixed(3)} MiB decoded. Click Pixel QA for exhaustive connector checks.`;
window.kitQA={kit,fixture,selectTiles,hash,pixelQA:()=>pixelQA(kit),set(o){options={...options,...o};paint();return this.summary();},paint,summary(){return {options,segments:tiles.length,layout,decodedBytes:kit.bytes,canvasBytes:[...document.querySelectorAll('canvas')].reduce((n,c)=>n+c.width*c.height*4,0),groundCacheBytes:kit.groundCache?.bytes||0,loadedImages:kit.images.size,interpolation:false};},async benchmark(length=1200,samples=180){
 const t=selectTiles(fixture(length,'parallel')),r=canvas.getBoundingClientRect(),v=[];paintScene(ctx,kit,r.width,r.height,t);const groundPrepareMs=kit.groundCache.prepareMs;
 for(let i=0;i<samples+30;i++){await new Promise(requestAnimationFrame);const start=performance.now();paintScene(ctx,kit,r.width,r.height,t);if(i>=30)v.push(performance.now()-start);}
 v.sort((a,b)=>a-b);paint();return {length,samples,p50:v[Math.floor(samples*.5)],p95:v[Math.floor(samples*.95)],max:v.at(-1),groundPrepareMs};
},async profile(){
 const t=selectTiles(fixture(1200,'parallel')),r=canvas.getBoundingClientRect(),l=sceneLayout(r.width,r.height,t,false),results={};
 const stages={ground(){for(let y=0;y<l.rows;y++)for(let x=0;x<l.cols;x++){const h=hash(y*8191+x);ctx.drawImage(kit.images.get('arena-floor-'+(h%100<18?1+h%3:0)),l.ox+x*l.cell,l.oy+y*l.cell,l.cell,l.cell);}},snake(){drawSnake(ctx,kit,t,l.cell,l.ox,l.oy);},frame(){drawFrame(ctx,kit,l.f.x,l.f.y,l.f.w,l.f.h,l.frame);}};
 for(const [name,fn]of Object.entries(stages)){const v=[];for(let i=0;i<90;i++){await new Promise(requestAnimationFrame);ctx.clearRect(0,0,r.width,r.height);const start=performance.now();fn();if(i>=30)v.push(performance.now()-start);}v.sort((a,b)=>a-b);results[name]={p50:v[30],p95:v[57],max:v.at(-1)};}
 paint();return {groundCalls:l.rows*l.cols,snakeCalls:t.length,results};
}};
