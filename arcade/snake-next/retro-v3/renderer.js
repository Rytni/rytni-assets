// Isolated visual proof. No simulation, host, gameplay input or integration imports.
import {pixelText,textWidth} from './pixel-text.js';
export const ART_ROOT='/grib/mushroom-snake-retro-v3/';
export const names=['up','right','down','left'];
export const hash=n=>{let x=Math.imul(n+1,2654435761);x=Math.imul(x^(x>>>16),2246822519);return(x^(x>>>13))>>>0;};
let kitPromise;
export function loadKit(){return kitPromise ||= (async()=>{
 const inventory=await(await fetch(ART_ROOT+'inventory.json')).json(),images=new Map();
 await Promise.all(inventory.assets.map(async a=>{const img=new Image();img.src=ART_ROOT+a.file;await img.decode();images.set(a.id,img);}));
 return {inventory,images,bytes:inventory.assets.reduce((n,a)=>n+a.width*a.height*4,0),patterns:new WeakMap()};
})();}
export function direction(from,to){const dx=to.x-from.x,dy=to.y-from.y;if(Math.abs(dx)+Math.abs(dy)!==1)throw Error('Non-neighbor proof cell');return dx>0?1:dx<0?3:dy>0?2:0;}
export function selectTiles(cells){return cells.map((cell,i)=>{
 let key,rotation=0;
 if(i===0)key='snake-head-'+names[direction(cells[1],cell)];
 else if(i===cells.length-1)key='snake-tail-'+names[direction(cells[i-1],cell)];
 else{
  const a=direction(cell,cells[i-1]),b=direction(cell,cells[i+1]);
  if((a+2)%4===b){
   if(i===cells.length-2){key=b%2?'snake-taper-horizontal':'snake-taper-vertical';if(b===0||b===3)rotation=2;}
   else{const v=hash(cell.id)%4;key='snake-body-'+(b%2?'horizontal':'vertical')+(v?'-v'+v:'');}
  }else{
   const n=names.findIndex((_,d)=>(a===d&&b===(d+1)%4)||(b===d&&a===(d+1)%4));
   key=(i===cells.length-2?'snake-taper-corner-':'snake-corner-')+names[n]+'-'+names[(n+1)%4];
   if(i===cells.length-2&&a!==n)key+='-reverse';
  }
 }
 return {...cell,key,rotation};
});}
export function drawTile(ctx,kit,key,x,y,size,rotation=0){const img=kit.images.get(key);if(!img)throw Error('Missing '+key);if(rotation){ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(rotation*Math.PI/2);ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();}else ctx.drawImage(img,x,y,size,size);}
export function drawSnake(ctx,kit,cells,cell,ox,oy){
 const tiles=selectTiles(cells),size=cell*36/32,over=cell/16;
 // The sole silhouette casts its own coherent contact offset. No segment-circle shadows.
 ctx.save();ctx.globalAlpha=.38;ctx.filter='none';
 for(const t of tiles)drawTile(ctx,kit,'shadow-'+t.key,ox+t.x*cell-over,oy+t.y*cell-over+cell*.065,size,t.rotation);
 ctx.restore();for(const t of tiles.slice(1))drawTile(ctx,kit,t.key,ox+t.x*cell-over,oy+t.y*cell-over,size,t.rotation);
 const h=tiles[0];drawTile(ctx,kit,h.key,ox+h.x*cell-over,oy+h.y*cell-over,size,h.rotation);
}
export function targetFixture(mobile=false){
 const points=[],push=(x,y)=>points.push({x,y,id:1900+points.length});
 const top=mobile?2:3,bottom=mobile?6:8,end=mobile?8:10,elbow=15,tailX=mobile?7:6;
 for(let x=20;x>=elbow;x--)push(x,top);for(let y=top+1;y<=bottom;y++)push(elbow,y);
 for(let x=elbow-1;x>=tailX;x--)push(x,bottom);for(let y=bottom+1;y<=end;y++)push(tailX,y);
 return points;
}
export function fixture(length=8,shape='straight',heading=1){
 const p=[],push=(x,y)=>p.push({x,y,id:1700+p.length});
 if(shape==='straight')for(let i=0;i<length;i++)push(-i,0);
 else if(shape==='U'){const n=Math.ceil((length-1)/2);for(let i=0;i<n;i++)push(-i,0);push(-n+1,1);for(let i=1;p.length<length;i++)push(-n+1+i,1);}
 else if(shape==='90'){const n=Math.ceil(length/2);for(let i=0;i<n;i++)push(-i,0);for(let y=1;p.length<length;y++)push(-n+1,y);}
 else{const span=shape==='S'?5:24;for(let row=0;p.length<length;row++){for(let i=0;i<span&&p.length<length;i++)push(row%2?i:span-i-1,row*2);if(p.length<length)push(p.at(-1).x,row*2+1);}}
 for(const point of p)for(let n=0;n<(heading+3)%4;n++){const x=point.x;point.x=-point.y;point.y=x;}
 const mx=Math.min(...p.map(c=>c.x)),my=Math.min(...p.map(c=>c.y));return p.map(c=>({...c,x:c.x-mx,y:c.y-my}));
}
export function nineSlice(ctx,img,x,y,w,h,corner=22,slice=64){
 const sw=img.width,sh=img.height;
 const srcX=[0,slice,sw-slice],srcY=[0,slice,sh-slice],srcW=[slice,sw-2*slice,slice],srcH=[slice,sh-2*slice,slice];
 const dx=[x,x+corner,x+w-corner],dy=[y,y+corner,y+h-corner],dw=[corner,w-2*corner,corner],dh=[corner,h-2*corner,corner];
 for(let yy=0;yy<3;yy++)for(let xx=0;xx<3;xx++)ctx.drawImage(img,srcX[xx],srcY[yy],srcW[xx],srcH[yy],dx[xx],dy[yy],dw[xx],dh[yy]);
}
export function drawFrame(ctx,kit,x,y,w,h,s){
 const c=128*s,im=kit.images;
 ctx.drawImage(im.get('frame-top'),x+c,y+38*s,w-2*c,28*s);
 ctx.drawImage(im.get('frame-bottom'),x+c,y+h-66*s,w-2*c,28*s);
 ctx.drawImage(im.get('frame-left'),x+25*s,y+c,32*s,h-2*c);
 ctx.drawImage(im.get('frame-right'),x+w-57*s,y+c,32*s,h-2*c);
 ctx.drawImage(im.get('frame-joint-left'),x+18*s,y+h/2-32*s,46*s,64*s);
 ctx.drawImage(im.get('frame-joint-right'),x+w-64*s,y+h/2-32*s,46*s,64*s);
 for(const [key,px,py]of [['top-left',x,y],['top-right',x+w-c,y],['bottom-left',x,y+h-c],['bottom-right',x+w-c,y+h-c]])ctx.drawImage(im.get('frame-'+key),px,py,c,c);
}
export function layout(w,h){
 const mobile=h<500,s=mobile?.42:Math.min(1.25,w/1500),header=mobile?52:Math.round(h*.118),fy=header-38*s;
 const field={x:57*s,y:header+28*s,w:w-114*s,h:h-header-94*s};
 return {w,h,mobile,s,header,fy,field,cell:field.w/26};
}
function imageAt(ctx,kit,key,x,y,w,h=w){ctx.drawImage(kit.images.get(key),x,y,w,h);}
function object(ctx,kit,key,x,y,cell,factor){const img=kit.images.get(key),w=cell*factor,h=w*img.height/img.width;ctx.drawImage(img,x-w/2,y-h/2,w,h);}
function effect(ctx,kit,key,x,y,size,frame){const im=kit.images.get('vfx-'+key);ctx.drawImage(im,(frame%6)*96,0,96,96,x-size/2,y-size/2,size,size);}
export function drawHUD(ctx,kit,l){
 const {w,header,mobile,s}=l,parts=[.23,.17,.13,.13,.18,.08,.08],im=kit.images;
 // Shared rail links the modules into a single cabinet, with no detached flat cards.
 ctx.drawImage(im.get('frame-top'),0,header*.09,w,header*.18);
 let x=0;
 for(let i=0;i<parts.length;i++){
  const pw=w*parts[i],y=mobile?3:6,ph=header-y;
  if(i===0){const iw=pw*.94,ih=iw*151/480;imageAt(ctx,kit,'logo',x+(pw-iw)/2,y+(ph-ih)/2,iw,ih);}
  else{
   nineSlice(ctx,im.get('hud'),x,y,pw,ph,Math.min(mobile?12:30,ph*.28));
   const cx=x+pw/2,labelY=y+ph*.19,numY=y+ph*.49;
   if(i<4){const labels=['','СЧЁТ','ДЛИНА','КОМБО'],vals=['','012400',mobile?'20':'22','×3'];
    const labelScale=Math.max(1,Math.floor(Math.min(ph*.034,pw/(labels[i].length*7)))),numberScale=Math.max(2,Math.floor(Math.min(ph*.053,(pw*.8)/(vals[i].length*6))));
    pixelText(ctx,labels[i],cx,labelY,labelScale,undefined,'center');pixelText(ctx,vals[i],cx,numY,numberScale,undefined,'center');
   }else if(i===4){object(ctx,kit,'positive',x+pw*.28,y+ph*.54,ph,.60);const text='5.2s',z=Math.max(2,Math.floor(Math.min(ph*.045,pw*.48/23)));pixelText(ctx,text,x+pw*.76,y+ph*.43,z,undefined,'center');}
   else{ctx.fillStyle='#fff4d0';const a=ph*.27,b=ph*.13,px=x+pw/2,py=y+ph/2;if(i===5){ctx.fillRect(px-a*.64,py-a/2,b,a);ctx.fillRect(px+a*.19,py-a/2,b,a);}else{const d=a*.64,t=Math.max(2,a*.15);for(const dx of [-1,1])for(const dy of [-1,1]){ctx.fillRect(px+dx*d-(dx>0?t:0),py+dy*d-(dy>0?t:0),t,dy>0?-d*.55:d*.55);ctx.fillRect(px+dx*d-(dx>0?d*.55:0),py+dy*d-(dy>0?t:0),d*.55,t);}}}
  }
  x+=pw;
 }
}
export function drawDpad(ctx,kit,l,pressed=''){
 const size=44,gap=4,x=l.field.x+16,y=l.h-3*size-2*gap-28,rects=[];
 const positions=[['up',1,0],['left',0,1],['right',2,1],['down',1,2]];
 for(const [name,col,row]of positions){const px=x+col*(size+gap),py=y+row*(size+gap);nineSlice(ctx,kit.images.get('hud'),px,py,size,size,10);
  ctx.fillStyle=pressed===name?'#fff':'#fff0bf';ctx.save();ctx.translate(px+size/2,py+size/2);ctx.rotate(names.indexOf(name)*Math.PI/2);ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(9,7);ctx.lineTo(-9,7);ctx.closePath();ctx.fill();ctx.restore();rects.push({name,x:px,y:py,w:size,h:size});}
 return rects;
}
export function paintScene(ctx,kit,w,h,time=0,options={}){
 const start=performance.now(),l=layout(w,h),{field,cell}=l;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#020e0d';ctx.fillRect(0,0,w,h);
 const groundStart=performance.now();ctx.save();ctx.beginPath();ctx.rect(field.x,field.y,field.w,field.h);ctx.clip();
 let pattern=kit.patterns.get(ctx);if(!pattern){pattern=ctx.createPattern(kit.images.get('floor'),'repeat');kit.patterns.set(ctx,pattern);}
 pattern.setTransform(new DOMMatrix().translate(field.x,field.y).scale(cell/64));ctx.fillStyle=pattern;ctx.fillRect(field.x,field.y,field.w,field.h);ctx.restore();const groundMs=performance.now()-groundStart;
 const at=(x,y)=>[field.x+(x+.5)*cell,field.y+(y+.5)*cell];const mobile=l.mobile,top=mobile?2:3;
 object(ctx,kit,'positive',...at(6,top),cell,1.42);
 object(ctx,kit,'stone',...at(mobile?13:4,mobile?8:7),cell,.96);
 object(ctx,kit,'negative',...at(18,mobile?7.2:8.6),cell,1.42);
 const [px,py]=at(23.2,mobile?5.7:5.1),phase=Math.floor(time/90)%6;
 ctx.save();ctx.translate(px,py);ctx.rotate(Math.sin(time/300)*.025);object(ctx,kit,'portal',0,0,cell,mobile?2.7:2.5);ctx.restore();
 // Rim animation is bounded and authored: rotating discrete clusters around a dark aperture.
 for(let i=0;i<8;i++){const a=i*Math.PI/4+phase*.11,r=cell*(.95+(i%3)*.06);ctx.fillStyle=i%2?'#6855c8':'#45d6df';const b=cell*.055;ctx.fillRect(px+Math.cos(a)*r-b,py+Math.sin(a)*r-b,b*2,b*2);}
 const snakeStart=performance.now();drawSnake(ctx,kit,options.cells||targetFixture(mobile),cell,field.x,field.y);const snakeMs=performance.now()-snakeStart;
 const [fx,fy]=at(21.55,top);object(ctx,kit,'seed',fx,fy,cell,.65);effect(ctx,kit,'food',fx,fy,cell*1.8,phase);pixelText(ctx,'+100',fx,fy-cell*.95,Math.max(1,Math.floor(cell/16)),'#ffce63','center');
 drawHUD(ctx,kit,l);drawFrame(ctx,kit,0,l.fy,w,h-l.fy,l.s);
 const dpad=mobile?drawDpad(ctx,kit,l,options.pressed):[];
 return {...l,dpad,totalMs:performance.now()-start,groundMs,snakeMs};
}
export function pixelQA(kit){
 const sprites=kit.inventory.assets.filter(a=>a.group==='snake').flatMap(a=>[{...a,rotation:0},...(/^snake-taper-(horizontal|vertical)$/.test(a.id)?[{...a,rotation:2,ports:a.ports.map(p=>(p+2)%4)}]:[])]),offsets=[[0,-1],[1,0],[0,1],[-1,0]],failed=[];let pairs=0,samples=0,gaps=0;
 for(const dpr of [1,1.5,2])for(const cell of [12,19.25,32])for(const phase of [0,.375])for(const a of sprites)for(let p=0;p<a.ports.length;p++)for(const b of sprites){const port=a.ports[p],q=b.ports.indexOf((port+2)%4);if(q<0||a.radii[p]!==b.radii[q])continue;
  const c=document.createElement('canvas');c.width=c.height=Math.ceil(cell*5*dpr);const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.setTransform(dpr,0,0,dpr,0,0);const base=cell*2+phase,[dx,dy]=offsets[port],over=cell/16,size=cell*36/32;
  drawTile(ctx,kit,a.id,base-over,base-over,size,a.rotation);drawTile(ctx,kit,b.id,base+dx*cell-over,base+dy*cell-over,size,b.rotation);const pixels=ctx.getImageData(0,0,c.width,c.height).data,radius=a.radii[p]*cell/32,sx=base+cell/2+dx*cell/2,sy=base+cell/2+dy*cell/2;let n=0;
  for(let v=-radius+cell/32;v<radius-cell/32;v+=1/dpr)for(let u=-cell/32;u<=cell/32;u+=1/dpr){const x=Math.floor((sx+(dx?u:v))*dpr),y=Math.floor((sy+(dy?u:v))*dpr);samples++;if(pixels[(y*c.width+x)*4+3]<255){gaps++;n++;}}
  if(n)failed.push({a:a.id,b:b.id,port,dpr,cell,phase,gaps:n});pairs++;
 }
 return {pairs,samples,gaps,failed};
}
export function paintSheet(ctx,kit,w,h,type,time=0){
 ctx.fillStyle='#061d1a';ctx.fillRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
 const label=(t,x,y)=>{ctx.font='16px monospace';ctx.fillStyle='#ded8b6';ctx.fillText(t,x,y);};
 if(type==='anatomy'){
  const examples=[['RIGHT',8,'straight',1],['DOWN',8,'straight',2],['LEFT',8,'straight',3],['UP',8,'straight',0],['90°',10,'90',1],['TIGHT U',11,'U',1],['S',18,'S',1],['SHORT TAPER / TAIL',8,'straight',1]];
  examples.forEach(([text,n,shape,heading],i)=>{const x=(i%4)*w/4+28,y=Math.floor(i/4)*h/2+60,cells=fixture(n,shape,heading),cw=Math.max(...cells.map(c=>c.x))+1,ch=Math.max(...cells.map(c=>c.y))+1,cell=Math.min(46,(w/4-55)/cw,(h/2-100)/ch);label(text,x,y-22);drawSnake(ctx,kit,cells,cell,x,y);});
 }else if(type==='objects'){
  const items=[['seed','FOOD / pointed seed'],['positive','POSITIVE / winged shield'],['negative','NEGATIVE / spikes'],['portal','PORTAL / dark aperture'],['stone','COLLISION / solid block']];
  items.forEach(([key,title],i)=>{const x=w*(i+.5)/5,y=h*.42;object(ctx,kit,key,x,y,100,key==='portal'?1.6:1.1);label(title,x-110,h*.72);object(ctx,kit,key,x,h*.83,32,key==='portal'?2.2:1.2);});
 }else if(type==='vfx'){
  ['food','positive','negative','portal-enter','portal-exit'].forEach((key,row)=>{label(key.toUpperCase(),20,40+row*125);for(let f=0;f<6;f++)effect(ctx,kit,key,240+f*175,55+row*125,100,f);});
  label('BRIEF STATE CUES',20,670);
  for(let i=0;i<6;i++){
   const x=210+i*175,y=654,positive=i<3,active=i%3===1;drawSnake(ctx,kit,fixture(3),23,x,y);
   if(active){ctx.fillStyle=positive?'#6ce9df':'#cf5ab8';for(let n=0;n<3;n++)ctx.fillRect(x+30+n*8,y+9+(n%2)*3,5,2);}
   label((positive?'POSITIVE':'NEGATIVE')+' '+[0,120,300][i%3]+'ms',x-10,710);
  }
 }else if(type==='hud'){
  drawHUD(ctx,kit,layout(w,h));drawFrame(ctx,kit,0,155,w,h-155,.9);label('Fixed corner proportions — axis-only rails — live pixel text',175,270);
  imageAt(ctx,kit,'frame-top-left',160,310,180,180);imageAt(ctx,kit,'frame-bottom-left',420,310,180,180);nineSlice(ctx,kit.images.get('hud'),700,340,400,130,30);
 }
}
