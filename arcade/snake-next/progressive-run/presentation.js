import {geometry} from '../forest-training/renderer.js';
import {drawFrame} from '../retro-v3/renderer.js';
import {drawSnake} from '../retro-v5/renderer.js';
import {pixelText} from '../retro-v5/pixel-text.js';
import {boardVariant} from '../forest-training/board.js';
import {drawObject,foodKey,foodBob,drawFoodFeedback} from '../forest-training/objects.js';
import {bodyCells} from '../simulation/body.js';
import {Camera} from './camera.js';
import {DEFINITIONS} from './director.js';
import {LookAheadCamera,StableCamera} from '../gate-one/camera.js';
import {drawEnvironment,drawPortalActivity} from '../gate-one/environment.js';

const COLORS={anchor:'#e8cf73',spores:'#eaa2d5',guard:'#72bce6',portalPrize:'#b9a0f3',weak:'#c87192',decay:'#f59d56',brambles:'#aabe65',mist:'#adbcd0'};
const PIXELS={anchor:['..####..','.##..##.','##..#.##','#...#..#','#...##.#','##....##','.##..##.','..####..'],spores:['...##...','.######.','########','..####..','########','.######.','...##...','...##...'],guard:['.######.','########','##....##','##.##.##','.######.','..####..','...##...','........'],portalPrize:['..####..','.##..##.','##.##.##','#..##..#','#......#','##.##.##','.##..##.','..####..'],weak:['#......#','.##..##.','..####..','...##...','..####..','.##..##.','#......#','........'],decay:['########','.######.','..####..','...##...','..####..','.######.','########','........'],brambles:['#..##..#','.#.##.#.','..####..','########','..####..','.#.##.#.','#..##..#','........'],mist:['..####..','.######.','########','########','.######.','........','##..##..','..##..##']};
export function iconURL(kind){const pixels=PIXELS[kind]||PIXELS.anchor,color=COLORS[kind]||'#e9d6a2';return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 8 8" shape-rendering="crispEdges">${pixels.flatMap((row,y)=>[...row].map((v,x)=>v==='#'?`<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`:'')).join('')}</svg>`);}
function symbol(ctx,kind,x,y,size){const pixels=PIXELS[kind],unit=Math.max(1,Math.floor(size/8));if(!pixels)return;for(const shadow of [true,false]){ctx.fillStyle=shadow?'#10251e':COLORS[kind];pixels.forEach((row,j)=>[...row].forEach((p,i)=>{if(p==='#')ctx.fillRect(Math.round(x)+(i-4)*unit+(shadow?1:0),Math.round(y)+(j-4)*unit+(shadow?1:0),unit,unit);}));}}

/** World/camera presentation only. Snake silhouette/material stays the locked
 * RibbonSprites adapter; no geometry implementation is duplicated here. */
export class ProgressPresentation {
 constructor(art){this.art=art;this.tiles=new Map();this.cameraMode='stable';this.reset();}
 reset(){this.camera=new Camera();this.session=null;this.lastView=null;}
 board(biome){if(this.tiles.has(biome))return this.tiles.get(biome);const tiles=this.art.board.map(im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);if(biome!=='forest'){const data=ctx.getImageData(0,0,c.width,c.height);for(let i=0;i<data.data.length;i+=4){const [r,g,b]=data.data.slice(i,i+3);if(biome==='caves'){data.data[i]=Math.round(g*.43);data.data[i+1]=Math.round(g*.65);data.data[i+2]=Math.round(g*.9);}else{data.data[i]=Math.round(g*.47);data.data[i+1]=Math.round(g*.77);data.data[i+2]=Math.round(b*.6);}}ctx.putImageData(data,0,0);}return c;});this.tiles.set(biome,tiles);return tiles;}
 render(renderer,s,options,debug=false){
  if(this.session!==s.state.seed+':'+s.startsKey){this.reset();this.session=s.state.seed+':'+s.startsKey;}
  const frame=options.motion||{head:{x:bodyCells(s.state)[0]%s.arena.width,y:Math.floor(bodyCells(s.state)[0]/s.arena.width),dx:[0,1,0,-1][s.state.direction],dy:[-1,0,1,0][s.state.direction]},alpha:1};
  const CameraType=this.cameraMode==='old'?LookAheadCamera:StableCamera;
  if(s.portalEdges&&!(this.camera instanceof CameraType)){
   const old=this.camera,next=new CameraType();
   // A/B switching retains the current viewport; no artificial initial rebase.
   if(this.lastView){next.x=old.x;next.y=old.y;next.initialized=true;next.time=old.time??s.tick;next.head=old.head;
    const edge=s.portalEdges.at(-1);next.portalEdge=edge&&(frame.start??0)<=s.moves-edge.move+1e-9?edge.move+':'+edge.tick:null;}
   this.camera=next;
  }
  const view=this.camera.update(frame,s,options.touch),l=geometry(renderer.w,renderer.h,28,12,options.fullscreen,options.compact),{field,arena,cell}=l;
  this.lastView=view;const ctx=renderer.canvas.getContext('2d');ctx.setTransform(renderer.dpr,0,0,renderer.dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#021512';ctx.fillRect(0,0,l.w,l.h);
  const at=c=>({x:field.x+(c%s.arena.width-view.x+.5)*cell,y:field.y+(Math.floor(c/s.arena.width)-view.y+.5)*cell});
  ctx.save();ctx.beginPath();ctx.rect(arena.x,arena.y,arena.w,arena.h);ctx.clip();
  const tr=s.transitions.at(-1),blend=tr?Math.min(1,(s.tick-tr.tick)/120):1,oldTiles=this.board(tr?.from||s.stage.biome),tiles=this.board(s.stage.biome);
  for(let y=Math.floor(view.y)+1;y<=Math.ceil(view.y)+10;y++)for(let x=Math.floor(view.x)+1;x<=Math.ceil(view.x)+26;x++){
   const left=field.x+(x-view.x)*cell,top=field.y+(y-view.y)*cell,index=boardVariant(x,y);
   if(x<1||y<1||x>=s.world.width-1||y>=s.world.height-1){ctx.fillStyle='#021512';ctx.fillRect(left,top,cell+1,cell+1);continue;}
   const px=Math.round(left),py=Math.round(top),pw=Math.round(left+cell)-px,ph=Math.round(top+cell)-py;
   ctx.drawImage(oldTiles[index],px,py,pw,ph);if(blend>0){ctx.globalAlpha=blend;ctx.drawImage(tiles[index],px,py,pw,ph);ctx.globalAlpha=1;}
  }
  if(s.portalEdges)drawEnvironment(ctx,s,view,l,frame,document.querySelector('#world-awareness')?.checked);
  for(const o of s.world.obstacles){const p=at(o.cell);drawObject(ctx,this.art,'stone',p.x,p.y,cell);if(o.kind==='crystal'){ctx.fillStyle='#a4c9ec';ctx.fillRect(p.x-2,p.y-cell*.25,4,cell*.4);}else if(o.kind==='root'||o.kind==='stump'){ctx.fillStyle=o.kind==='root'?'#567c35':'#755c30';ctx.fillRect(p.x-cell*.15,p.y-cell*.25,cell*.3,cell*.4);}}
  for(const w of s.director.warnings){const p=at(w.cell);ctx.strokeStyle='#d3b070';ctx.lineWidth=2;ctx.strokeRect(p.x-cell*.3,p.y-cell*.3,cell*.6,cell*.6);symbol(ctx,'brambles',p.x,p.y,cell*.25);}
  for(const o of s.world.hazards){const p=at(o.cell);symbol(ctx,'brambles',p.x,p.y,cell*.65);}
  for(const c of s.portals)if(s.portalEdges?.some(e=>!e.complete)||['entering','teleport','exit-grace'].includes(s.portal.phase)||s.portal.phase==='armed'&&s.portalAvailable()){const p=at(c);drawObject(ctx,this.art,'portal',p.x,p.y,cell);}
  if(s.state.food>=0){const p=at(s.state.food);drawObject(ctx,this.art,foodKey(s.effects,s.tick),p.x,p.y+foodBob(s.tick,cell),cell);}
  for(const p of s.pickups){const xy=at(p.cell);if(PIXELS[p.kind])symbol(ctx,p.kind,xy.x,xy.y,cell*.65);else{drawObject(ctx,this.art,DEFINITIONS[p.kind].positive?'positive':'negative',xy.x,xy.y,cell);if(p.kind==='harvest')pixelText(ctx,'×2',xy.x,xy.y+cell*.2,1,'#fff0bd','center');}}
  for(const p of s.spores){const xy=at(p.cell);ctx.fillStyle='#eacd7d';ctx.fillRect(xy.x-2,xy.y-2,4,4);ctx.fillStyle='#fff4c8';ctx.fillRect(xy.x,xy.y,2,2);}
  if(s.portal.phase==='entering')ctx.globalAlpha=Math.max(.18,1-s.portal.elapsed/14);if(s.portal.phase==='teleport')ctx.globalAlpha=0;if(s.portal.phase==='exit-grace')ctx.globalAlpha=Math.min(1,.5+s.portal.elapsed/16);
  if(options.status==='dying')ctx.globalAlpha=Math.max(.55,1-s.deathTicks/60);
  if(options.motion)renderer.smoothSprites.draw(ctx,options.motion,cell,field.x,field.y,view,field);
  else drawSnake(ctx,this.art,bodyCells(s.state).map(c=>({x:c%s.arena.width-view.x,y:Math.floor(c/s.arena.width)-view.y})),cell,field.x,field.y,s.moves,field);
  ctx.globalAlpha=1;
  if(s.portalEdges)drawPortalActivity(ctx,s,at,cell,frame);
  for(const fx of s.feedback){if(s.portalEdges&&['portal','expansion'].includes(fx.kind))continue;const age=(s.tick-fx.tick)/60,p=at(fx.cell);if(fx.kind==='seed')drawFoodFeedback(ctx,this.art,fx,age,p,cell);else if(age<.35){ctx.strokeStyle=COLORS[fx.effect]||'#e8d38c';ctx.lineWidth=2;ctx.strokeRect(p.x-cell*(.2+age),p.y-cell*(.2+age),cell*(.4+age*2),cell*(.4+age*2));}}
  if(s.effects.some(e=>e.kind==='mist')){ctx.fillStyle='#bbcbbd';ctx.globalAlpha=.12;ctx.fillRect(arena.x,arena.y,arena.w,cell*.6);ctx.fillRect(arena.x,arena.y+arena.h-cell*.6,arena.w,cell*.6);ctx.globalAlpha=1;}
  if(debug){ctx.strokeStyle='#e7be75';ctx.lineWidth=1;ctx.strokeRect(field.x+(view.safe.left+.5)*cell,field.y+(view.safe.top+.5)*cell,(view.safe.right-view.safe.left)*cell,(view.safe.bottom-view.safe.top)*cell);}
  const banner=s.announcements.at(-1);if(banner){const x=arena.x+arena.w/2,y=arena.y+cell*.4,scale=Math.max(1,Math.floor(cell/28));ctx.fillStyle='#06221de8';ctx.fillRect(x-Math.min(arena.w*.45,250),y-10*scale,Math.min(arena.w*.9,500),20*scale);pixelText(ctx,banner.text,Math.round(x),Math.round(y-4*scale),scale,'#ead290','center');}
  ctx.restore();drawFrame(ctx,this.art,l.frame.x,l.frame.y,l.frame.w,l.frame.h,l.scale);renderer.last=l;return l;
 }
 effects(root,s,compact){const key=s.effects.map(e=>e.kind).join(',');if(root.dataset.progressEffects!==key||!root.children.length){root.dataset.progressEffects=key;root.innerHTML=s.effects.map(e=>{const d=DEFINITIONS[e.kind],url=PIXELS[e.kind]?iconURL(e.kind):'/grib/mushroom-snake-retro-v5/'+(d.positive?'positive':'negative')+'.png';return `<div class="effect ${d.positive?'':'negative'}" data-effect="${e.kind}" aria-label="${d.label}"><img alt="" src="${url}"><span>${d.label}</span><b></b><progress max="1" value="1"></progress></div>`;}).join('')+Array.from({length:Math.max(0,3-s.effects.length)},()=>'<div class="effect-vacant"></div>').join('');}
  for(const e of s.effects){const card=root.querySelector(`[data-effect="${e.kind}"]`),d=DEFINITIONS[e.kind],remaining=Math.max(0,e.ends-s.tick);card.querySelector('b').textContent=d.charge?'1◆':compact?Math.ceil(remaining/60)+'С':(remaining/60).toFixed(1);card.querySelector('progress').value=remaining/d.duration;}
 }
 release(){this.tiles.clear();this.reset();}
}
