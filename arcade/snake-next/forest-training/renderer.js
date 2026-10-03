import {drawSnake} from '../retro-v5/renderer.js';
import {drawFrame} from '../retro-v3/renderer.js';
import {boardVariant} from './board.js';
import {pixelText} from '../retro-v5/pixel-text.js';
import {bodyCells} from '../simulation/body.js';
import {EFFECTS} from './session.js';
import {drawObject,foodKey,foodBob,drawFoodFeedback} from './objects.js';

export function cabinetSize(w,mobile=false,cols=28,rows=12){
  const scale=mobile?.42:Math.min(1.35,w/1800*1.35),header=mobile?52:Math.max(96,Math.round(w*.068));
  const cell=(w-114*scale)/(cols-2);
  return {scale,header,cell,w,h:header+cell*(rows-2)+94*scale};
}
export function geometry(w,h,cols=28,rows=12,fullscreen=false,mobile=h<=500) {
  const natural=cabinetSize(w,mobile,cols,rows),fit=Math.min(1,h/natural.h);
  const scale=natural.scale*fit,header=natural.header*fit,cell=natural.cell*fit;
  // The blocked outer row/column lives underneath the cabinet, not a second
  // stone frame. Canonical positions/collision are unchanged (26 x 10 interior).
  const cw=(cols-2)*cell+114*scale,ch=header+(rows-2)*cell+94*scale;
  const x=(w-cw)/2,y=fullscreen||mobile?(h-ch)/2:0;
  const arena={x:x+57*scale,y:y+header+28*scale,w:(cols-2)*cell,h:(rows-2)*cell};
  const field={x:arena.x-cell,y:arena.y-cell,w:cols*cell,h:rows*cell};
  const frame={x,y:y+header-38*scale,w:cw,h:ch-header+38*scale};
  const deadSpace={above:Math.max(0,arena.y-(frame.y+66*scale)),below:Math.max(0,frame.y+frame.h-66*scale-arena.y-arena.h)};
  return {w,h,mobile,header,scale,cell,cols,rows,field,arena,frame,cabinet:{x,y,w:cw,h:ch},hud:{x,y,w:cw,h:header},deadSpace,unusedInside:deadSpace.above+deadSpace.below};
}

/** Cached tile layer + immutable approved sprites. No new contour/interpolation system. */
export class ForestRenderer {
  constructor(canvas,art){this.canvas=canvas;this.art=art;this.cache=null;this.metrics=[];this.lastHash='';}
  resize(w,h,dpr){this.w=w;this.h=h;this.dpr=Math.min(2,dpr);this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);this.cache=null;}
  render(session,{preview,status,pressed,touch,fullscreen,compact}={}){
    const start=performance.now(),s=session||preview,view=s.view||{x:0,y:0,cols:s.arena.width,rows:s.arena.height},l=geometry(this.w,this.h,view.cols,view.rows,fullscreen,compact),{field,arena,cell}=l;
    const ctx=this.canvas.getContext('2d');ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#021512';ctx.fillRect(0,0,this.w,this.h);
    const cacheKey=JSON.stringify([view,arena]);if(cacheKey!==this.cacheKey){this.cache=null;this.cacheKey=cacheKey;}
    if(!this.cache){
      this.cache=document.createElement('canvas');this.cache.width=this.canvas.width;this.cache.height=this.canvas.height;
      const c=this.cache.getContext('2d');c.setTransform(this.dpr,0,0,this.dpr,0,0);c.imageSmoothingEnabled=false;
      for(let y=1;y<l.rows-1;y++)for(let x=1;x<l.cols-1;x++){
        const left=Math.round(field.x+x*cell),top=Math.round(field.y+y*cell);
        c.drawImage(this.art.board[boardVariant(x+view.x,y+view.y)],left,top,Math.round(field.x+(x+1)*cell)-left,Math.round(field.y+(y+1)*cell)-top);
      }
    }
    ctx.drawImage(this.cache,0,0,this.w,this.h);
    const at=c=>({x:field.x+(c%s.arena.width-view.x+.5)*cell,y:field.y+(Math.floor(c/s.arena.width)-view.y+.5)*cell});
    ctx.save();ctx.beginPath();ctx.rect(arena.x,arena.y,arena.w,arena.h);ctx.clip();
    // Render interior obstacles only; the cabinet communicates boundary collision.
    for(let y=1;y<l.rows-1;y++)for(let x=1;x<l.cols-1;x++)if(s.arena.blocked((y+view.y)*s.arena.width+x+view.x)){
      if(touch&&x>=1&&x<6&&y>=7&&y<11)continue;
      const p=at((y+view.y)*s.arena.width+x+view.x);drawObject(ctx,this.art,'stone',p.x,p.y,cell);
    }
    if(touch){ctx.fillStyle='#092720';ctx.fillRect(field.x+cell,field.y+7*cell,5*cell,4*cell);}
    for(const c of s.portals){const p=at(c);ctx.globalAlpha=s.portal.phase==='inactive'?.4:1;drawObject(ctx,this.art,'portal',p.x,p.y,cell);ctx.globalAlpha=1;}
    if(s.state.food>=0){const p=at(s.state.food);drawObject(ctx,this.art,foodKey(s.effects,s.tick),p.x,p.y+foodBob(s.tick,cell),cell);}
    for(const o of s.pickups){const p=at(o.cell),key=EFFECTS[o.kind].positive?'positive':'negative';drawObject(ctx,this.art,key,p.x,p.y,cell);
      // The two positive mechanics retain the positive silhouette, with a legible identity badge.
      if(o.kind==='harvest')pixelText(ctx,'×2',Math.round(p.x),Math.round(p.y+cell*.2),1,'#fff0bd','center');
    }
    const cells=bodyCells(s.state).map(c=>({x:c%s.arena.width-view.x,y:Math.floor(c/s.arena.width)-view.y}));
    if(s.portal.phase==='entering')ctx.globalAlpha=Math.max(.18,1-s.portal.elapsed/14);
    if(s.portal.phase==='exit-grace')ctx.globalAlpha=Math.min(1,.5+s.portal.elapsed/16);
    if(status==='dying')ctx.globalAlpha=Math.max(.55,1-s.deathTicks/60);
    drawSnake(ctx,this.art,cells,cell,field.x,field.y,s.moves,field);ctx.globalAlpha=1;
    for(const fx of s.feedback){const age=(s.tick-fx.tick)/60,p=at(fx.cell),im=this.art.images.get('vfx-'+fx.kind);
      if(fx.kind==='seed'){drawFoodFeedback(ctx,this.art,fx,age,p,cell);continue;}
      if(im&&age<.18){const frame=Math.min(3,Math.floor(age/.045));ctx.drawImage(im,frame*48,0,48,48,Math.round(p.x-cell*.45),Math.round(p.y-cell*.45),Math.round(cell*.9),Math.round(cell*.9));}
      if(fx.amount&&age>.08)pixelText(ctx,'+'+fx.amount,Math.round(p.x),Math.round(p.y-cell*(.6+age*.5)),Math.max(1,Math.floor(cell/25)),'#f3df9e','center');
      if(fx.label)pixelText(ctx,fx.label,Math.round(p.x),Math.round(p.y-cell*(.6+age*.5)),Math.max(1,Math.floor(cell/30)),'#dbc7e9','center');
    }
    // Restrained contact inset, immediately at the wood edge (no second frame).
    ctx.fillStyle='#021b17';ctx.globalAlpha=.45;ctx.fillRect(arena.x,arena.y,arena.w,2);ctx.fillRect(arena.x,arena.y,2,arena.h);ctx.globalAlpha=1;
    ctx.restore();drawFrame(ctx,this.art,l.frame.x,l.frame.y,l.frame.w,l.frame.h,l.scale);
    this.last=l;
    if(this.recordPerf){this.metrics.push(performance.now()-start);if(this.metrics.length>2400)this.metrics.shift();}
    return l;
  }
  release(){this.cache=null;this.metrics=[];}
  memory(){return {canvasBytes:this.canvas.width*this.canvas.height*4,cachedGroundBytes:this.cache?this.cache.width*this.cache.height*4:0};}
}
