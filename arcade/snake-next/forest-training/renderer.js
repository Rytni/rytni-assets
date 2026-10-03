import {floorVariant,drawSnake} from '../retro-v5/renderer.js';
import {drawFrame} from '../retro-v3/renderer.js';
import {pixelText} from '../retro-v5/pixel-text.js';
import {bodyCells} from '../simulation/body.js';
import {EFFECTS} from './session.js';

export function geometry(w,h,cols=28,rows=12) {
  const mobile=h<=500,header=mobile?56:100,scale=mobile?.32:Math.min(.85,w/1800),margin=Math.round(57*scale);
  const available={x:margin,y:header+Math.round(68*scale),w:w-2*margin,h:h-header-Math.round(136*scale)};
  const cell=Math.min(available.w/cols,available.h/rows),fw=cols*cell,fh=rows*cell;
  return {w,h,mobile,header,scale,cell,cols,rows,field:{x:Math.round((w-fw)/2),y:Math.round(available.y+(available.h-fh)/2),w:fw,h:fh}};
}
function sprite(ctx,art,key,x,y,size){const im=art.images.get(key);ctx.drawImage(im,Math.round(x-size/2),Math.round(y-size/2),Math.round(size),Math.round(size));}

/** Cached tile layer + immutable approved sprites. No new contour/interpolation system. */
export class ForestRenderer {
  constructor(canvas,art){this.canvas=canvas;this.art=art;this.cache=null;this.metrics=[];this.lastHash='';}
  resize(w,h,dpr){this.w=w;this.h=h;this.dpr=Math.min(2,dpr);this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);this.cache=null;}
  render(session,{preview,status,pressed,touch}={}){
    const start=performance.now(),s=session||preview,view=s.view||{x:0,y:0,cols:s.arena.width,rows:s.arena.height},l=geometry(this.w,this.h,view.cols,view.rows),{field,cell}=l;
    const ctx=this.canvas.getContext('2d');ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#021512';ctx.fillRect(0,0,this.w,this.h);
    const cacheKey=JSON.stringify(view);if(cacheKey!==this.cacheKey){this.cache=null;this.cacheKey=cacheKey;}
    if(!this.cache){
      this.cache=document.createElement('canvas');this.cache.width=this.canvas.width;this.cache.height=this.canvas.height;
      const c=this.cache.getContext('2d');c.setTransform(this.dpr,0,0,this.dpr,0,0);c.imageSmoothingEnabled=false;
      for(let y=0;y<l.rows;y++)for(let x=0;x<l.cols;x++){
        const left=Math.round(field.x+x*cell),top=Math.round(field.y+y*cell);
        c.drawImage(this.art.images.get('floor-'+floorVariant(x+view.x,y+view.y)),left,top,Math.round(field.x+(x+1)*cell)-left,Math.round(field.y+(y+1)*cell)-top);
      }
    }
    ctx.drawImage(this.cache,0,0,this.w,this.h);
    const at=c=>({x:field.x+(c%s.arena.width-view.x+.5)*cell,y:field.y+(Math.floor(c/s.arena.width)-view.y+.5)*cell});
    ctx.save();ctx.beginPath();ctx.rect(field.x,field.y,field.w,field.h);ctx.clip();
    // Visible perimeter cells share the established collision rock language.
    for(let y=0;y<l.rows;y++)for(let x=0;x<l.cols;x++)if(s.arena.blocked((y+view.y)*s.arena.width+x+view.x)){
      if(touch&&x>=1&&x<6&&y>=7&&y<11)continue;
      const p=at((y+view.y)*s.arena.width+x+view.x);sprite(ctx,this.art,'stone',p.x,p.y,cell*.83);
    }
    if(touch){ctx.fillStyle='#092720';ctx.fillRect(field.x+cell,field.y+7*cell,5*cell,4*cell);}
    const seconds=s.tick/60;
    for(const c of s.portals){const p=at(c);ctx.globalAlpha=s.portal.phase==='inactive'?.4:1;sprite(ctx,this.art,'portal',p.x,p.y,cell*1.1);ctx.globalAlpha=1;}
    if(s.state.food>=0){const p=at(s.state.food);sprite(ctx,this.art,'seed',p.x,p.y+Math.round(Math.sin(seconds*3)*cell*.025),cell*.64);}
    for(const o of s.pickups){const p=at(o.cell),key=EFFECTS[o.kind].positive?'positive':'negative';sprite(ctx,this.art,key,p.x,p.y,cell*.85);
      // The two positive mechanics retain the positive silhouette, with a legible identity badge.
      if(o.kind==='harvest')pixelText(ctx,'×2',Math.round(p.x),Math.round(p.y+cell*.2),1,'#fff0bd','center');
    }
    const cells=bodyCells(s.state).map(c=>({x:c%s.arena.width-view.x,y:Math.floor(c/s.arena.width)-view.y}));
    if(s.portal.phase==='entering')ctx.globalAlpha=Math.max(.18,1-s.portal.elapsed/14);
    if(s.portal.phase==='exit-grace')ctx.globalAlpha=Math.min(1,.5+s.portal.elapsed/16);
    if(status==='dying')ctx.globalAlpha=Math.max(.55,1-s.deathTicks/60);
    drawSnake(ctx,this.art,cells,cell,field.x,field.y,s.moves,field);ctx.globalAlpha=1;
    for(const fx of s.feedback){const age=(s.tick-fx.tick)/60,p=at(fx.cell),im=this.art.images.get('vfx-'+fx.kind);
      if(im&&age<.18){const frame=Math.min(3,Math.floor(age/.045));ctx.drawImage(im,frame*48,0,48,48,Math.round(p.x-cell*.45),Math.round(p.y-cell*.45),Math.round(cell*.9),Math.round(cell*.9));}
      if(fx.amount&&age>.08)pixelText(ctx,'+'+fx.amount,Math.round(p.x),Math.round(p.y-cell*(.6+age*.5)),Math.max(1,Math.floor(cell/25)),'#f3df9e','center');
      if(fx.label)pixelText(ctx,fx.label,Math.round(p.x),Math.round(p.y-cell*(.6+age*.5)),Math.max(1,Math.floor(cell/30)),'#dbc7e9','center');
    }
    ctx.restore();drawFrame(ctx,this.art,0,l.header,this.w,this.h-l.header,l.scale);
    this.last=l;
    if(this.recordPerf){this.metrics.push(performance.now()-start);if(this.metrics.length>2400)this.metrics.shift();}
    return l;
  }
  release(){this.cache=null;this.metrics=[];}
  memory(){return {canvasBytes:this.canvas.width*this.canvas.height*4,cachedGroundBytes:this.cache?this.cache.width*this.cache.height*4:0};}
}
