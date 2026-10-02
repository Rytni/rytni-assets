// Isolated read-only raster proof. No simulation, input, timers, world or host imports.
export const ART_ROOT = '/grib/mushroom-snake-retro-v2/';
export const names = ['up','right','down','left'];
export const hash = n => { let x=(n+1)*2654435761; x=Math.imul(x^(x>>>16),2246822519); return (x^(x>>>13))>>>0; };
export async function loadKit() {
 const inventory=await (await fetch(ART_ROOT+'inventory.json')).json(), images=new Map();
 await Promise.all(inventory.assets.filter(a=>a.id!=='frame-ornament').map(async a=>{const img=new Image();img.src=ART_ROOT+a.file;await img.decode();images.set(a.id,img);}));
 return {inventory,images,bytes:inventory.assets.filter(a=>images.has(a.id)).reduce((n,a)=>n+a.width*a.height*4,0)};
}
export function direction(from,to) { const dx=to.x-from.x,dy=to.y-from.y;if(Math.abs(dx)+Math.abs(dy)!==1)throw Error('Non-neighbor proof cell');return dx>0?1:dx<0?3:dy>0?2:0; }
export function selectTiles(cells) {
 return cells.map((cell,i)=>{
  let key,rotation=0;
  if(i===0)key='snake-head-'+names[direction(cells[1],cell)];
  else if(i===cells.length-1)key='snake-tail-'+names[direction(cells[i-1],cell)];
  else {
   const a=direction(cell,cells[i-1]),b=direction(cell,cells[i+1]);
   if((a+2)%4===b){
    if(i===cells.length-2){key=b%2?'snake-taper-horizontal':'snake-taper-vertical';if(b===0||b===3)rotation=2;}
    else {key=b%2?'snake-body-horizontal':'snake-body-vertical';const h=hash(cell.id);if(h%100<12)key+='-v'+(1+(h%2));}
   }else{
    const n=names.findIndex((_,d)=>(a===d&&b===(d+1)%4)||(b===d&&a===(d+1)%4));
    const corner=['up-right','right-down','down-left','left-up'][n];
    key=(i===cells.length-2?'snake-taper-corner-':'snake-corner-')+corner;
    if(i===cells.length-2&&a!==n)key+='-reverse';
   }
  }
  return {...cell,key,rotation};
 });
}
export function fixture(length=22,shape='S',heading=1) {
 let points=[];
 const push=(x,y)=>points.push({x,y,id:points.length+1701});
 if(shape==='straight')for(let i=0;i<length;i++)push(length-i,0);
 else if(shape==='corner'){for(let i=0;i<Math.ceil(length/2);i++)push(-i,0);for(let j=1;points.length<length;j++)push(-Math.ceil(length/2)+1,j);}
 else if(shape==='U'){const span=Math.ceil((length-1)/2);for(let i=0;i<span;i++)push(-i,0);push(-span+1,1);for(let j=1;points.length<length;j++)push(-span+1+j,1);}
 else if(length<=30){const path=[[12,0],[11,0],[10,0],[9,0],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[7,5],[6,5],[5,5],[4,5],[3,5],[2,5],[1,5],[0,5],[0,6],[0,7],[0,8],[0,9]];for(const [x,y]of path.slice(0,length))push(x,y);while(points.length<length)push(0,points.at(-1).y+1);}
 else {
  // Connected parallel lanes separated by a full empty cell. Never a body lattice.
  const span=length<=100?30:64;
  for(let row=0;points.length<length;row++){for(let i=0;i<span&&points.length<length;i++)push(row%2?i:span-i-1,row*2);if(points.length<length){push(points.at(-1).x,row*2+1);}}
 }
 const rotations=(heading+3)%4;for(const p of points)for(let k=0;k<rotations;k++){const x=p.x;p.x=-p.y;p.y=x;}
 const minX=Math.min(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y));for(const p of points){p.x+=7-minX;p.y+=3-minY;}
 return points;
}
export function drawTile(ctx,kit,key,x,y,size,rotation=0) {
 const img=kit.images.get(key);if(!img)throw Error('Missing kit sprite '+key);
 if(rotation){ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(rotation*Math.PI/2);ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();}
 else ctx.drawImage(img,x,y,size,size);
}
export function drawSnake(ctx,kit,tiles,cell,ox=0,oy=0) {
 // Source overhang is two units outside each cell; all parts share one transform.
 const over=cell/16,size=cell*36/32;
 for(let i=tiles.length-1;i>=0;i--){const t=tiles[i];drawTile(ctx,kit,t.key,ox+t.x*cell-over,oy+t.y*cell-over,size,t.rotation);}
}
export function drawFrame(ctx,kit,x,y,w,h,corner=48,ornaments=true) {
 const images=kit.images,scale=corner/64,rail=32*scale;
 ctx.imageSmoothingEnabled=false;
 // Repeat axis-only rail pieces; never magnify one end pixel into a wide stripe.
 for(let dx=corner;dx<w-corner;dx+=128*scale){const sw=Math.min(128,(w-corner-dx)/scale);ctx.drawImage(images.get('frame-edge-horizontal'),0,0,sw,32,x+dx,y,sw*scale,rail);ctx.save();ctx.translate(x+dx,y+h);ctx.scale(1,-1);ctx.drawImage(images.get('frame-edge-horizontal'),0,0,sw,32,0,0,sw*scale,rail);ctx.restore();}
 for(let dy=corner;dy<h-corner;dy+=128*scale){const sh=Math.min(128,(h-corner-dy)/scale);ctx.drawImage(images.get('frame-edge-vertical'),0,0,32,sh,x,y+dy,rail,sh*scale);ctx.save();ctx.translate(x+w,y+dy);ctx.scale(-1,1);ctx.drawImage(images.get('frame-edge-vertical'),0,0,32,sh,0,0,rail,sh*scale);ctx.restore();}
 for(const [name,cx,cy]of [['top-left',x,y],['top-right',x+w-corner,y],['bottom-right',x+w-corner,y+h-corner],['bottom-left',x,y+h-corner]]){
  ctx.drawImage(images.get('frame-corner-'+name),cx,cy,corner,corner);
  // Ornaments are authored inside each generated fixed corner, not added as a panel.
 }
}
function hudPanel(ctx,kit,x,y,w,h,label,value,icon) {
 const img=kit.images.get('hud-panel'),s=8;
 ctx.fillStyle=ctx.createPattern(kit.images.get('hud-inner-fill'),'repeat');ctx.fillRect(x+s,y+s,w-2*s,h-2*s);
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){if(row===1&&col===1)continue;const sx=[0,8,24][col],sy=[0,8,24][row],sw=col===1?16:8,sh=row===1?16:8,dx=x+[0,8,w-8][col],dy=y+[0,8,h-8][row],dw=col===1?w-16:8,dh=row===1?h-16:8;ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);}
 if(icon)ctx.drawImage(kit.images.get(icon),x+10,y+(h-22)/2,22,22);
 ctx.fillStyle='#e6d7ac';ctx.textBaseline='middle';ctx.font=`${h<55?10:13}px monospace`;ctx.fillText(label,x+(icon?38:12),y+h*.3);
 ctx.fillStyle='#fff1c7';ctx.font=`bold ${h<55?18:25}px monospace`;ctx.fillText(value,x+(icon?38:12),y+h*.69);
}
export function sceneLayout(width,height,tiles,mobile=false) {
 const margin=mobile?6:18,header=mobile?48:88,frame=mobile?48:96;
 const f={x:margin,y:header+margin,w:width-margin*2,h:height-header-margin*2},inset=frame*30/64;
 const content={x:f.x+inset,y:f.y+inset,w:f.w-inset*2,h:f.h-inset*2};
 const requiredCols=Math.max(26,...tiles.map(t=>t.x+4)),requiredRows=Math.max(13,...tiles.map(t=>t.y+3)),cell=Math.min(content.w/requiredCols,content.h/requiredRows);
 const cols=Math.ceil(content.w/cell),rows=Math.ceil(content.h/cell);
 const ox=content.x,oy=content.y;
 return {f,content,cell,ox,oy,cols,rows,frame,header,dpad:mobile?{x:content.x+8,y:content.y+content.h-124,w:116,h:116}:null};
}
export function noSpawn(point,layout,padding=8) {
 const r=layout.dpad;if(!r)return false;
 const x=layout.ox+(point.x+.5)*layout.cell,y=layout.oy+(point.y+.5)*layout.cell;
 // Covers the complete 44px hit areas, with a sprite half-extent guard.
 return x>=r.x-padding-layout.cell&&x<=r.x+r.w+padding+layout.cell&&y>=r.y-padding-layout.cell&&y<=r.y+r.h+padding+layout.cell;
}
export function groundLayer(kit,ctx) {
 if(kit.groundCache)return kit.groundCache;
 const start=performance.now(),pattern=ctx.createPattern(kit.images.get('arena-floor-atlas'),'repeat');
 // Immutable 8×8 production macro. No per-cell lookups, bitmap copies or extra canvas.
 kit.groundCache={pattern,bytes:0,prepareMs:performance.now()-start};return kit.groundCache;
}
export function paintScene(ctx,kit,width,height,tiles,options={}) {
 const mobile=options.mobile??width<1000,layout=sceneLayout(width,height,tiles,mobile),{f,content,cell,ox,oy,cols,rows}=layout;
 ctx.imageSmoothingEnabled=false;ctx.fillStyle='#031a14';ctx.fillRect(0,0,width,height);
 const titleWidth=mobile?175:280,hudHeight=mobile?42:70,gap=mobile?5:10,available=width-titleWidth-2*(mobile?8:18),small=mobile?42:70;
 ctx.fillStyle='#f6d899';ctx.textBaseline='middle';ctx.font=`bold ${mobile?19:32}px Georgia`;ctx.fillText('MUSHROOM',mobile?10:28,mobile?17:31);ctx.font=`bold ${mobile?12:20}px monospace`;ctx.fillText('— SNAKE —',mobile?32:55,mobile?35:61);
 const w=(available-small*2-gap*6)/4,x0=titleWidth;
 for(const [j,label,value,icon]of [[0,'СЧЁТ','012400',null],[1,'ДЛИНА',String(tiles.length),'icon-length'],[2,'КОМБО','×3','icon-combo'],[3,'ЭФФЕКТ','5.2s','icon-effect']])hudPanel(ctx,kit,x0+j*(w+gap),4,w,hudHeight,label,value,mobile?null:icon);
 for(const [n,key]of [[0,'icon-pause'],[1,'icon-fullscreen']]){const x=width-(small+gap)*(2-n);hudPanel(ctx,kit,x,4,small,hudHeight,'','',null);ctx.drawImage(kit.images.get(key),x+(small-24)/2,4+(hudHeight-24)/2,24,24);}
 ctx.fillStyle='#063b35';ctx.fillRect(content.x-1,content.y-1,content.w+2,content.h+2);
 ctx.save();ctx.beginPath();ctx.rect(content.x,content.y,content.w,content.h);ctx.clip();
 const floor=groundLayer(kit,ctx);ctx.save();ctx.translate(ox,oy);ctx.scale(cell/32,cell/32);ctx.fillStyle=floor.pattern;ctx.fillRect(0,0,content.w*32/cell,content.h*32/cell);ctx.restore();
 const objects=[{key:'food-magical-seed',x:tiles[0].x+1,y:tiles[0].y},{key:'pickup-positive',x:6,y:2},{key:'pickup-negative',x:20,y:9},{key:'portal',x:cols-4,y:6},{key:'obstacle-stone',x:cols-7,y:rows-3}];
 const occupied=new Set(tiles.map(t=>t.x+','+t.y));
 for(const o of objects){if(noSpawn(o,layout)||occupied.has(o.x+','+o.y))continue;const size=cell*({portal:1.8,'pickup-positive':1.4,'pickup-negative':1.3,'food-magical-seed':1,'obstacle-stone':.95}[o.key]);ctx.drawImage(kit.images.get(o.key),ox+(o.x+.5)*cell-size/2,oy+(o.y+.5)*cell-size/2,size,size);}
 drawSnake(ctx,kit,tiles,cell,ox,oy);ctx.restore();drawFrame(ctx,kit,f.x,f.y,f.w,f.h,layout.frame);
 if(layout.dpad){const r=layout.dpad;for(const [key,x,y]of [['up',36,0],['left',0,36],['right',72,36],['down',36,72]])ctx.drawImage(kit.images.get(`dpad-${key}-${options.pressed===key?'pressed':'normal'}`),r.x+x+5,r.y+y+5,34,34);}
 return layout;
}

// Exhaustive connector test uses actual decoded raster alpha, not an artificial stroke.
export function pixelQA(kit) {
 const sprites=kit.inventory.assets.filter(a=>a.group==='snake').flatMap(a=>[{...a,rotation:0},...(['snake-taper-horizontal','snake-taper-vertical'].includes(a.id)?[{...a,rotation:2,ports:a.ports.map(p=>(p+2)%4)}]:[])]),results=[],offsets=[[0,-1],[1,0],[0,1],[-1,0]];
 for(const dpr of [1,1.5,2])for(const cell of [12,19.25,32])for(const phase of [0,.375])for(const a of sprites)for(let p=0;p<a.ports.length;p++){
  const port=a.ports[p],opposite=(port+2)%4;
  for(const b of sprites){const q=b.ports.indexOf(opposite);if(q<0||a.radii[p]!==b.radii[q])continue;
   const c=document.createElement('canvas');c.width=Math.ceil(cell*5*dpr);c.height=c.width;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
   const base=cell*2+phase,[dx,dy]=offsets[port];ctx.setTransform(dpr,0,0,dpr,0,0);const over=cell/16,size=cell*36/32;
   drawTile(ctx,kit,a.id,base-over,base-over,size,a.rotation);drawTile(ctx,kit,b.id,base+dx*cell-over,base+dy*cell-over,size,b.rotation);
   const pixels=ctx.getImageData(0,0,c.width,c.height).data,radius=a.radii[p]*cell/32;
   // Entire interior cross-section through both overhangs, excluding only edge rounding.
   let samples=0,gaps=0;const sx=base+cell/2+dx*cell/2,sy=base+cell/2+dy*cell/2;
   for(let v=-radius+cell/32;v<radius-cell/32;v+=1/dpr)for(let u=-cell/32;u<=cell/32;u+=1/dpr){const x=Math.floor((sx+(dx?u:v))*dpr),y=Math.floor((sy+(dy?u:v))*dpr);samples++;if(pixels[(y*c.width+x)*4+3]<255)gaps++;}
   results.push({dpr,cell,phase,a:a.id,aRotation:a.rotation,b:b.id,bRotation:b.rotation,port,samples,gaps});
  }
 }
 return {pairs:results.length,samples:results.reduce((n,r)=>n+r.samples,0),gaps:results.reduce((n,r)=>n+r.gaps,0),failed:results.filter(r=>r.gaps)};
}
