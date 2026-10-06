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
import {drawEffectsWorld,effectSlots,drawRoots,drawMist,drawUnderSnake,nearMistSafety} from '../effect-playground/visuals.js';
import {drawWithFoodReaction} from '../effect-playground/food-reaction.js';
import {fitWorldLayout} from '../effect-playground/fit-world.js';
import {drawReadable} from '../effect-playground/readable-objects.js';
import {objectImage} from '../forest-training/objects.js';

const COLORS={anchor:'#e8cf73',spores:'#eaa2d5',guard:'#72bce6',portalPrize:'#b9a0f3',weak:'#c87192',decay:'#f59d56',brambles:'#aabe65',mist:'#adbcd0'};
const PIXELS={anchor:['..####..','.##..##.','##..#.##','#...#..#','#...##.#','##....##','.##..##.','..####..'],spores:['...##...','.######.','########','..####..','########','.######.','...##...','...##...'],guard:['.######.','########','##....##','##.##.##','.######.','..####..','...##...','........'],portalPrize:['..####..','.##..##.','##.##.##','#..##..#','#......#','##.##.##','.##..##.','..####..'],weak:['#......#','.##..##.','..####..','...##...','..####..','.##..##.','#......#','........'],decay:['########','.######.','..####..','...##...','..####..','.######.','########','........'],brambles:['#..##..#','.#.##.#.','..####..','########','..####..','.#.##.#.','#..##..#','........'],mist:['..####..','.######.','########','########','.######.','........','##..##..','..##..##']};
export function iconURL(kind){const pixels=PIXELS[kind]||PIXELS.anchor,color=COLORS[kind]||'#e9d6a2';return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 8 8" shape-rendering="crispEdges">${pixels.flatMap((row,y)=>[...row].map((v,x)=>v==='#'?`<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`:'')).join('')}</svg>`);}
function symbol(ctx,kind,x,y,size){const pixels=PIXELS[kind],unit=Math.max(1,Math.floor(size/8));if(!pixels)return;for(const shadow of [true,false]){ctx.fillStyle=shadow?'#10251e':COLORS[kind];pixels.forEach((row,j)=>[...row].forEach((p,i)=>{if(p==='#')ctx.fillRect(Math.round(x)+(i-4)*unit+(shadow?1:0),Math.round(y)+(j-4)*unit+(shadow?1:0),unit,unit);}));}}

/** World/camera presentation only. Snake silhouette/material stays the locked
 * RibbonSprites adapter; no geometry implementation is duplicated here. */
export class ProgressPresentation {
 constructor(art){this.art=art;this.tiles=new Map();this.cameraMode='fit';this.reset();}
 reset(){this.camera=new Camera();this.session=null;this.lastView=null;this.impactMotion=null;}
 board(biome){if(this.tiles.has(biome))return this.tiles.get(biome);const tiles=this.art.board.map(im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);if(biome!=='forest'){const data=ctx.getImageData(0,0,c.width,c.height);for(let i=0;i<data.data.length;i+=4){const [r,g,b]=data.data.slice(i,i+3);if(biome==='caves'){data.data[i]=Math.round(g*.43);data.data[i+1]=Math.round(g*.65);data.data[i+2]=Math.round(g*.9);}else{data.data[i]=Math.round(g*.47);data.data[i+1]=Math.round(g*.77);data.data[i+2]=Math.round(b*.6);}}ctx.putImageData(data,0,0);}return c;});this.tiles.set(biome,tiles);return tiles;}
 render(renderer,s,options,debug=false){
  if(this.session!==s.state.seed+':'+s.startsKey){this.reset();this.session=s.state.seed+':'+s.startsKey;}
  const frame=options.motion||{head:{x:bodyCells(s.state)[0]%s.arena.width,y:Math.floor(bodyCells(s.state)[0]/s.arena.width),dx:[0,1,0,-1][s.state.direction],dy:[-1,0,1,0][s.state.direction]},alpha:1};
  const CameraType=this.cameraMode==='old'?LookAheadCamera:StableCamera;
  if(this.cameraMode!=='fit'&&s.portalEdges&&!(this.camera instanceof CameraType)){
   const old=this.camera,next=new CameraType();
   // A/B switching retains the current viewport; no artificial initial rebase.
   if(this.lastView){next.x=old.x;next.y=old.y;next.initialized=true;next.time=old.time??s.tick;next.head=old.head;
    const edge=s.portalEdges.at(-1);next.portalEdge=edge&&(frame.start??0)<=s.moves-edge.move+1e-9?edge.move+':'+edge.tick:null;}
   this.camera=next;
  }
  const base=geometry(renderer.w,renderer.h,28,12,options.fullscreen,options.compact),fit=this.cameraMode==='fit'?fitWorldLayout(base,s,frame,options.fullscreen):null;
  const view=fit?fit.view:this.camera.update(frame,s,options.touch),l=fit?fit.layout:base,{field,arena,cell}=l;
  this.lastView=view;const ctx=renderer.canvas.getContext('2d');ctx.setTransform(renderer.dpr,0,0,renderer.dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#021512';ctx.fillRect(0,0,l.w,l.h);
  const at=c=>({x:field.x+(c%s.arena.width-view.x+.5)*cell,y:field.y+(Math.floor(c/s.arena.width)-view.y+.5)*cell});
  ctx.save();ctx.beginPath();ctx.rect(arena.x,arena.y,arena.w,arena.h);ctx.clip();
  const tr=s.transitions.at(-1),blend=tr?Math.min(1,(s.tick-tr.tick)/120):1,oldTiles=this.board(tr?.from||s.stage.biome),tiles=this.board(s.stage.biome);
  // Existing tile underpaint continues behind the relocated outer wall. The
  // blocked-cell band stays non-playable; no black transparent-padding seam.
  const inset=fit?0:1;
  for(let y=Math.floor(view.y)+inset;y<Math.ceil(view.y)+view.rows-inset;y++)for(let x=Math.floor(view.x)+inset;x<Math.ceil(view.x)+view.cols-inset;x++){
   const left=field.x+(x-view.x)*cell,top=field.y+(y-view.y)*cell,index=boardVariant(x,y);
   if(x<inset||y<inset||x>=s.world.width-inset||y>=s.world.height-inset){ctx.fillStyle='#021512';ctx.fillRect(left,top,cell+1,cell+1);continue;}
   const px=Math.round(left),py=Math.round(top),pw=Math.round(left+cell)-px,ph=Math.round(top+cell)-py;
   ctx.drawImage(oldTiles[index],px,py,pw,ph);if(blend>0){ctx.globalAlpha=blend;ctx.drawImage(tiles[index],px,py,pw,ph);ctx.globalAlpha=1;}
  }
  if(s.portalEdges)drawEnvironment(ctx,s,view,l,frame,document.querySelector('#world-awareness')?.checked);
  // Clean approved stone fallback until complete biome silhouettes are approved.
  for(const o of s.world.obstacles){const p=at(o.cell);drawObject(ctx,this.art,'stone',p.x,p.y,cell);}
  const visualFrame={...(options.effectMotion||frame),viewX:view.x,viewY:view.y},layers={...l,compact:options.compact,environmentLayers:true,skinAppearance:this.appearanceMode==='skin',eco:this.quality==='eco'};
  drawRoots(ctx,s,at,cell);drawMist(ctx,s,visualFrame,cell,layers);
  if(s.effects.some(e=>e.kind==='mist')){
   for(const o of s.world.obstacles)if(nearMistSafety(frame,o.cell,s.arena.width)){const p=at(o.cell);drawObject(ctx,this.art,'stone',p.x,p.y,cell);}
   drawRoots(ctx,s,at,cell,c=>nearMistSafety(frame,c,s.arena.width));
  }
  if(s.portal.phase==='entering')ctx.globalAlpha=Math.max(.18,1-s.portal.elapsed/14);if(s.portal.phase==='teleport')ctx.globalAlpha=0;if(s.portal.phase==='exit-grace')ctx.globalAlpha=Math.min(1,.5+s.portal.elapsed/16);
  if(options.status==='dying')ctx.globalAlpha=Math.max(.55,1-s.deathTicks/60);
  drawUnderSnake(ctx,s,visualFrame,cell,layers);
  const impact=s.feedback.findLast(f=>f.kind==='guard-used'),hold=impact&&s.tick-impact.tick<5;
  if(!hold||!this.impactMotion)this.impactMotion=options.motion;
  if(options.motion)drawWithFoodReaction(ctx,s,frame,cell,field,view,drawCtx=>renderer.smoothSprites.draw(drawCtx,hold?this.impactMotion:options.motion,cell,field.x,field.y,view,field));
  else drawSnake(ctx,this.art,bodyCells(s.state).map(c=>({x:c%s.arena.width-view.x,y:Math.floor(c/s.arena.width)-view.y})),cell,field.x,field.y,s.moves,field);
  ctx.globalAlpha=1;
  for(const c of s.portals)if(s.portalEdges?.some(e=>!e.complete)||['entering','teleport','exit-grace'].includes(s.portal.phase)||s.portal.phase==='armed'&&s.portalAvailable()){const p=at(c);drawReadable(ctx,objectImage(this.art,'portal'),'portal',p.x,p.y,cell,options.compact,1);}
  if(s.portalEdges)drawPortalActivity(ctx,s,at,cell,frame);
  drawEffectsWorld(ctx,s,visualFrame,at,cell,this.art,layers);
  if(debug&&view.safe){ctx.strokeStyle='#e7be75';ctx.lineWidth=1;ctx.strokeRect(field.x+(view.safe.left+.5)*cell,field.y+(view.safe.top+.5)*cell,(view.safe.right-view.safe.left)*cell,(view.safe.bottom-view.safe.top)*cell);}
  const banner=s.announcements.at(-1);if(banner){const x=arena.x+arena.w/2,y=arena.y+cell*.4,scale=Math.max(1,Math.floor(cell/28));ctx.fillStyle='#06221de8';ctx.fillRect(x-Math.min(arena.w*.45,250),y-10*scale,Math.min(arena.w*.9,500),20*scale);pixelText(ctx,banner.text,Math.round(x),Math.round(y-4*scale),scale,'#ead290','center');}
  ctx.restore();drawFrame(ctx,this.art,l.frame.x,l.frame.y,l.frame.w,l.frame.h,l.scale,!!fit);renderer.last=l;return l;
 }
 effects(root,s,compact){effectSlots(root,s,compact);}
 release(){this.tiles.clear();this.reset();}
}
