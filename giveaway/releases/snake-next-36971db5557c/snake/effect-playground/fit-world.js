// DEV presentation only. No simulation, head-follow, RNG or wall ownership.
import {FRAME_VISIBLE_TRIM,WORLD_VISIBLE_OUTER_NATIVE} from '../retro-v3/frame-ink.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const ASPECT=2.5;
// Retain 310faf0's OUTER cabinet size; this allowance is not an aperture inset.
const cabinetMetrics=(w,mobile)=>({scale:mobile?.42:Math.min(1.35,w/1800*1.35),header:mobile?52:Math.max(96,Math.round(w*.068)),cabinetAllowance:mobile?4:8});
export const WALL_OUTER_NATIVE=WORLD_VISIBLE_OUTER_NATIVE;
// Rail canvas inner edges are 57/66; measured visible source trim is applied
// below. No extra arbitrary gutter or logical cell-count inset.
export function fitCabinetSize(w,mobile=false){
 const {scale,header,cabinetAllowance:allowance}=cabinetMetrics(w,mobile);
 return {w,h:header+94*scale+2*allowance+(w-114*scale-2*allowance)/ASPECT};
}
export function cabinetPlayfield(base,fullscreen=false){
 const {w,h,mobile}=base,{scale,header,cabinetAllowance:allowance}=cabinetMetrics(w,mobile);
 const usableW=w-114*scale-2*allowance,usableH=h-header-94*scale-2*allowance;
 const pw=Math.max(1,Math.min(usableW,usableH*ASPECT)),ph=pw/ASPECT;
 const cw=pw+114*scale+2*allowance,ch=ph+header+94*scale+2*allowance;
 const x=(w-cw)/2,y=fullscreen||mobile?(h-ch)/2:0;
 const frame={x,y:y+header-38*scale,w:cw,h:ch-header+38*scale};
 const t=FRAME_VISIBLE_TRIM,left=57-t.leftRight,right=57-t.rightLeft,top=66-t.topBottom,bottom=66-t.bottomTop;
 const cabinetAperture={x:frame.x+left*scale,y:frame.y+top*scale,w:frame.w-(left+right)*scale,h:frame.h-(top+bottom)*scale};
 return {...base,scale,header,cabinetAperture,arena:cabinetAperture,playfieldRect:cabinetAperture,controlsArena:base.arena,gutter:0,frame,cabinet:{x,y,w:cw,h:ch},hud:{x,y,w:cw,h:header}};
}
export function activeTime(frame,s){return s.tick+clamp(s.state.movement?((frame.alpha||0)*60_000_000-s.state.movement.progress)/s.state.movement.rate:(frame.alpha||0)*s.state.cadence-s.state.movePhase);}
export function fitWorldLayout(base,s,frame,fullscreen=false){
 const cabinet=cabinetPlayfield(base,fullscreen),arena=cabinet.cabinetAperture,opening=s.openings?.at(-1),time=activeTime(frame,s),p=opening?clamp((time-opening.tick)/(opening.duration||60)):1,e=p*p*(3-2*p);
 const from=opening?.from||s.world,to=s.world;
 const wall=WALL_OUTER_NATIVE/68;
 // Legal interior cells plus visible wall ink, not logical blocked-cell padding.
 const fit=w=>Math.min(arena.w/(w.width-2+2*wall),arena.h/(w.height-2+2*wall));
 const cell=fit(from)+(fit(to)-fit(from))*e;
 // Interpolate world center as well as scale: expansion adds east/south cells;
 // the old world origin must not jump atomically before the zoom begins.
 const cols=from.width+(to.width-from.width)*e,rows=from.height+(to.height-from.height)*e;
 const field={x:arena.x+(arena.w-cols*cell)/2,y:arena.y+(arena.h-rows*cell)/2,w:to.width*cell,h:to.height*cell};
 const playableGrid={x:field.x+cell,y:field.y+cell,w:(to.width-2)*cell,h:(to.height-2)*cell};
 // Translate ONLY the outer walls along their normal, retaining native ink
 // width, motifs and tangent tiling. The non-limiting-axis remainder belongs
 // to the environmental border band, not to an empty corridor next to wood.
 const extraX=(arena.w-(cols-2+2*wall)*cell)/2,extraY=(arena.h-(rows-2+2*wall)*cell)/2;
 const wallOffsets={left:-extraX,right:extraX,top:-extraY,bottom:extraY};
 const h=frame.head,view={x:0,y:0,cols:to.width,rows:to.height,mode:'fit',wallDistance:{left:h.x-1,right:to.width-2-h.x,top:h.y-1,bottom:to.height-2-h.y}};
 return {layout:{...cabinet,cell,cols:to.width,rows:to.height,field,playableGrid,wallOffsets,fitProgress:p},view};
}

export function readability(cell,compact=false){return {cell,body:cell*36/68,food:cell*.70,pickupBox:cell*(compact?.94:.68)};}
