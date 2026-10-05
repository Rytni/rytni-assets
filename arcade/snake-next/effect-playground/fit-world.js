// DEV presentation only. No simulation, head-follow, RNG or wall ownership.
const clamp=n=>Math.max(0,Math.min(1,n));
const ASPECT=2.5;
const cabinetMetrics=(w,mobile)=>({scale:mobile?.42:Math.min(1.35,w/1800*1.35),header:mobile?52:Math.max(96,Math.round(w*.068)),gutter:mobile?4:8});
// Native rail dimensions match drawFrame(): side inner edges at 57, top
// inner edge at frame.y+66, bottom at frame.bottom-66. No cell-count inset.
export function fitCabinetSize(w,mobile=false){
 const {scale,header,gutter}=cabinetMetrics(w,mobile);
 return {w,h:header+94*scale+2*gutter+(w-114*scale-2*gutter)/ASPECT};
}
export function cabinetPlayfield(base,fullscreen=false){
 const {w,h,mobile}=base,{scale,header,gutter}=cabinetMetrics(w,mobile);
 const usableW=w-114*scale-2*gutter,usableH=h-header-94*scale-2*gutter;
 const pw=Math.max(1,Math.min(usableW,usableH*ASPECT)),ph=pw/ASPECT;
 const cw=pw+114*scale+2*gutter,ch=ph+header+94*scale+2*gutter;
 const x=(w-cw)/2,y=fullscreen||mobile?(h-ch)/2:0;
 const frame={x,y:y+header-38*scale,w:cw,h:ch-header+38*scale};
 const playfieldRect={x:frame.x+57*scale+gutter,y:frame.y+66*scale+gutter,w:pw,h:ph};
 return {...base,scale,header,arena:playfieldRect,playfieldRect,controlsArena:base.arena,gutter,frame,cabinet:{x,y,w:cw,h:ch},hud:{x,y,w:cw,h:header}};
}
export function playfieldUtilization(l){
 // The locked wall starts at the playable-cell edge, extends 54/68 cell
 // outward, and leaves 14/68 cell unused at each logical world edge.
 // Conservative mid-edge envelope (corner tangential ink can extend farther).
 // Browser QA additionally raster-measures the complete environmental wall.
 const inset=l.cell*14/68,visibleW=l.field.w-2*inset,visibleH=l.field.h-2*inset;
 return {width:visibleW/l.playfieldRect.w,height:visibleH/l.playfieldRect.h,
  logicalWidth:l.field.w/l.playfieldRect.w,logicalHeight:l.field.h/l.playfieldRect.h,
  visibleWorldBorderWidth:visibleW,visibleWorldBorderHeight:visibleH,borderInset:inset,
  availableWidth:l.playfieldRect.w,availableHeight:l.playfieldRect.h};
}
export function activeTime(frame,s){return s.tick+clamp(s.state.movement?((frame.alpha||0)*60_000_000-s.state.movement.progress)/s.state.movement.rate:(frame.alpha||0)*s.state.cadence-s.state.movePhase);}
export function fitWorldLayout(base,s,frame,fullscreen=false){
 const cabinet=cabinetPlayfield(base,fullscreen),arena=cabinet.playfieldRect,opening=s.openings?.at(-1),time=activeTime(frame,s),p=opening?clamp((time-opening.tick)/(opening.duration||60)):1,e=p*p*(3-2*p);
 const from=opening?.from||s.world,to=s.world;
 const fit=w=>Math.min(arena.w/w.width,arena.h/w.height);
 const cell=fit(from)+(fit(to)-fit(from))*e;
 // Interpolate world center as well as scale: expansion adds east/south cells;
 // the old world origin must not jump atomically before the zoom begins.
 const cols=from.width+(to.width-from.width)*e,rows=from.height+(to.height-from.height)*e;
 const field={x:arena.x+(arena.w-cols*cell)/2,y:arena.y+(arena.h-rows*cell)/2,w:to.width*cell,h:to.height*cell};
 const h=frame.head,view={x:0,y:0,cols:to.width,rows:to.height,mode:'fit',wallDistance:{left:h.x-1,right:to.width-2-h.x,top:h.y-1,bottom:to.height-2-h.y}};
 return {layout:{...cabinet,cell,cols:to.width,rows:to.height,field,fitProgress:p},view};
}

export function readability(cell,compact=false){return {cell,body:cell*36/68,food:cell*.70,pickupBox:cell*(compact?.94:.68)};}
