import {pieces,DIRS,OPPOSITE} from './geometry.mjs';
import {hash,variant} from './material.mjs';
import {pixelText} from './pixel-text.js';
import {drawFrame,nineSlice} from '../retro-v3/renderer.js';
export const ROOT='../../grib/mushroom-snake-retro-v5/';
let promise;
export function loadArt() {
  return promise ||= (async()=>{
    const inventory=await (await fetch(ROOT+'inventory.json')).json(),images=new Map();
    await Promise.all(inventory.assets.map(async a=>{const image=new Image();image.src=ROOT+a.file;await image.decode();images.set(a.id,image)}));
    return {images,inventory,bytes:inventory.assets.reduce((n,a)=>n+a.width*a.height*4,0)};
  })();
}
export function layout(w,h) {
  const mobile=h<=500,scale=mobile?.34:Math.min(.9,w/1600),header=mobile?50:Math.max(72,Math.round(h*.105));
  const margin=Math.round(57*scale),bottom=Math.round(48*scale);
  const field={x:margin,y:header+Math.round(28*scale),w:w-margin*2,h:h-header-Math.round(28*scale)-bottom};
  const cell=field.w/26;
  return {w,h,mobile,scale,header,field,cell,cols:26,rows:Math.floor(field.h/cell)};
}
function direction(a,b){const d=DIRS.findIndex(([x,y])=>b.x-a.x===x&&b.y-a.y===y);if(d<0)throw Error('Non-canonical render path');return d;}
export function selectPieces(cells,moves=0) {
  return cells.map((c,i)=>{
    let piece;
    if(i===0)piece=pieces.find(p=>p.kind==='head'&&p.ports[0]===direction(c,cells[1]));
    else if(i===cells.length-1)piece=pieces.find(p=>p.kind==='terminal'&&p.ports[0]===direction(c,cells[i-1]));
    else {
      const a=direction(c,cells[i-1]),b=direction(c,cells[i+1]);
      const kind=OPPOSITE(a)===b?(i===1?'neck':'straight'):'corner';
      piece=pieces.find(p=>p.kind===kind&&p.ports.includes(a)&&p.ports.includes(b));
    }
    if(!piece)throw Error('Missing canonical anatomy');
    return {...c,key:piece.name+'-v'+(piece.kind==='head'||piece.kind==='neck'?0:variant(moves-i)),materialId:moves-i};
  });
}
export function floorVariant(x,y){const n=hash(x+4096*y),p=n%1000;return p===0?8:p===1?9:Math.floor(n/1000)%8;}
const rectFor=(x,y,cell,ox,oy)=>{const left=Math.round(ox+x*cell),top=Math.round(oy+y*cell);return [left,top,Math.round(ox+(x+1)*cell)-left,Math.round(oy+(y+1)*cell)-top];};
export function drawSnake(ctx,art,cells,cell,ox,oy,moves=0,clip=null) {
  const selection=selectPieces(cells,moves);
  for(const t of selection) {
    const r=rectFor(t.x,t.y,cell,ox,oy);
    if(clip&&(r[0]+r[2]<clip.x||r[0]>clip.x+clip.w||r[1]+r[3]<clip.y||r[1]>clip.y+clip.h))continue;
    ctx.drawImage(art.images.get(t.key),...r);
  }
}
function drawObject(ctx,art,key,x,y,size){const im=art.images.get(key),h=size*im.height/im.width;ctx.drawImage(im,Math.round(x-size/2),Math.round(y-h/2),Math.round(size),Math.round(h));}
function text(ctx,t,x,y,s=2,color='#fff0cf',align='center'){pixelText(ctx,String(t),Math.round(x),Math.round(y),s,color,align);}
function hud(ctx,art,l,data) {
  const shares=[.22,.17,.13,.12,.20,.08,.08],keys=['logo','СЧЁТ','ДЛИНА','КОМБО','ЭФФЕКТ','pause','full'],hits=[];
  ctx.drawImage(art.images.get('frame-top'),0,8,l.w,12);
  let x=0;
  for(let i=0;i<shares.length;i++) {
    const w=Math.round(l.w*shares[i]),y=l.mobile?2:5,h=l.header-y;
    if(i===0){const logo=art.images.get('logo');drawObject(ctx,art,'logo',x+w/2,y+h/2,Math.min(w*.93,h*.92*logo.width/logo.height));}
    else {
      nineSlice(ctx,art.images.get('hud'),x,y,w,h,l.mobile?11:20);
      if(i<5) {
        const labelScale=l.mobile?1:2;
        text(ctx,keys[i],x+w/2,y+Math.round(h*.18),labelScale,'#c7bc90');
        const values=['',String(data.score??0).padStart(6,'0'),data.length??8,'×1',data.effect?data.effect.remaining.toFixed(1)+'s':'—'];
        const scale=l.mobile?2:Math.max(2,Math.min(4,Math.floor(w/(String(values[i]).length*6+8))));
        text(ctx,values[i],x+w/2,y+Math.round(h*.5),scale);
        if(i===4&&data.effect)drawObject(ctx,art,data.effect.kind,x+w*.17,y+h*.65,l.mobile?18:26);
      } else {
        const px=x+w/2,py=y+h/2;
        if(i===5){ctx.fillStyle='#fff2cc';ctx.fillRect(px-8,py-10,5,20);ctx.fillRect(px+3,py-10,5,20);}
        else {ctx.fillStyle='#fff2cc';for(const dx of [-1,1])for(const dy of [-1,1]){ctx.fillRect(px+dx*10-(dx>0?3:0),py+dy*10-(dy>0?3:0),3,dy>0?-7:7);ctx.fillRect(px+dx*10-(dx>0?7:0),py+dy*10-(dy>0?3:0),7,3);}}
        hits.push({id:keys[i],x,y,w,h});
      }
    }
    x+=w;
  }
  return hits;
}
export function drawPad(ctx,art,l,pressed) {
  const size=44,gap=3,left=l.field.x+10,top=l.h-3*size-2*gap-22,hits=[];
  for(const [id,col,row,dir] of [['up',1,0,0],['left',0,1,3],['right',2,1,1],['down',1,2,2]]) {
    const x=left+col*(size+gap),y=top+row*(size+gap);
    ctx.drawImage(art.images.get('dpad-'+(pressed===id?'pressed':'normal')),x,y,size,size);
    ctx.save();ctx.translate(x+22,y+22);ctx.rotate(dir*Math.PI/2);ctx.fillStyle=pressed===id?'#fff7df':'#d8deb4';
    // Crisp authored stepped arrow; no vector smoothing.
    for(let r=0;r<7;r++)ctx.fillRect(-r, -8+r, r*2+1,1);
    ctx.fillRect(-3,-1,7,9);ctx.restore();hits.push({id,dir,x,y,w:44,h:44});
  }return hits;
}
export function paint(ctx,art,w,h,scene) {
  const l=layout(w,h),{field,cell}=l;
  ctx.imageSmoothingEnabled=false;ctx.fillStyle='#021512';ctx.fillRect(0,0,w,h);
  const camera=scene.camera||{x:0,y:0},ox=field.x-camera.x*cell,oy=field.y-camera.y*cell;
  const at=(x,y)=>[ox+(x+.5)*cell,oy+(y+.5)*cell];
  ctx.save();ctx.beginPath();ctx.rect(field.x,field.y,field.w,field.h);ctx.clip();
  for(let y=camera.y;y<camera.y+Math.ceil(field.h/cell);y++)for(let x=camera.x;x<camera.x+26;x++)
    ctx.drawImage(art.images.get('floor-'+floorVariant(x,y)),...rectFor(x,y,cell,ox,oy));
  for(const p of scene.obstacles||[]) {const [x,y]=at(p.x,p.y);if(x>=field.x-cell&&x<=field.x+field.w+cell&&y>=field.y-cell&&y<=field.y+field.h+cell)drawObject(ctx,art,'stone',x,y,cell*.87);}
  for(const o of scene.objects||[]) {
    const [x,y]=at(o.x,o.y);
    if(x<field.x-cell||x>field.x+field.w+cell||y<field.y-cell||y>field.y+field.h+cell)continue;
    if(o.kind==='portal') {
      drawObject(ctx,art,'portal',x,y,cell*1.22);
      for(let i=0;i<4;i++){const a=scene.time*1.1+i*Math.PI/2,r=cell*.43;ctx.fillStyle=i%2?'#7061ca':'#57cddc';ctx.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r),2,2);}
    } else drawObject(ctx,art,o.kind,x,y,cell*(o.kind==='seed'?.60:.91)*(1+Math.sin(scene.time*3)*.012));
  }
  drawSnake(ctx,art,scene.cells,cell,ox,oy,scene.moves,field);
  for(const fx of scene.vfx||[]) {
    const age=scene.time-fx.start;if(age<0||age>.55)continue;
    const frame=Math.min(3,Math.floor(age/.045)),[x,y]=at(fx.x,fx.y),im=art.images.get('vfx-'+fx.kind);
    if(age<.18)ctx.drawImage(im,frame*48,0,48,48,x-cell*.45,y-cell*.45,cell*.9,cell*.9);
    if(fx.kind==='seed'&&age>.08)text(ctx,'+100',x,y-cell*(.6+age*.5),Math.max(1,Math.floor(cell/25)),'#f5cc75');
  }
  ctx.restore();
  const hits=hud(ctx,art,l,{score:scene.score,length:scene.cells.length,effect:scene.effect});
  drawFrame(ctx,art,0,l.header,w,h-l.header,l.scale);
  if(l.mobile)hits.push(...drawPad(ctx,art,l,scene.pressed));
  if(scene.status!=='playing'&&scene.status!=='static') {
    const pw=Math.min(440,w*.7),ph=150,px=(w-pw)/2,py=field.y+(field.h-ph)/2;
    nineSlice(ctx,art.images.get('hud'),px,py,pw,ph,25);
    text(ctx,scene.status==='dead'?'РЕЗУЛЬТАТ':'ПАУЗА',w/2,py+24,3);
    text(ctx,scene.status==='dead'?'ENTER: ЗАНОВО':'ПРОБЕЛ: ДАЛЬШЕ',w/2,py+76,2);
    text(ctx,'R: ЗАНОВО',w/2,py+112,2,'#c5b995');
    hits.push({id:scene.status==='dead'?'restart':'resume',x:px,y:py,w:pw,h:ph});
  }
  return {...l,hits};
}
