// Product-only FIT WORLD policy. The canonical outer row/column is blocked;
// place that existing band UNDER wood, never render it as another wall.
import {cabinetPlayfield,activeTime} from '../effect-playground/fit-world.js';
const clamp=n=>Math.max(0,Math.min(1,n));
// Minimax fixed aperture aspect for the approved legal interiors 28×10 and
// 48×18. Limits unavoidable square-cell remainder to ~2.4% at either end.
const APERTURE_ASPECT=Math.sqrt((28/10)*(48/18));
export function productWorldLayout(base,s,frame,fullscreen=false){
 const original=cabinetPlayfield(base,fullscreen),{scale,header}=original;
 // Fit the fixed wood aperture to the legal-cell aspect range.
 // Native rail normal sizes and measured visible trim are unchanged. Later
 // worlds use this SAME frame; their small aspect remainder is unavoidable
 // with square cells and is centered, not reserved for a second wall.
 const innerW=Math.max(1,Math.min(base.w-110*scale,(base.h-header-92*scale)*APERTURE_ASPECT)),innerH=innerW/APERTURE_ASPECT;
 const cw=innerW+110*scale,ch=header+92*scale+innerH,x=(base.w-cw)/2,y=fullscreen||base.mobile?(base.h-ch)/2:0;
 const wood={x,y:y+header-38*scale,w:cw,h:ch-header+38*scale};
 const arena={x:x+55*scale,y:wood.y+64*scale,w:innerW,h:innerH};
 const cabinet={...original,cabinetAperture:arena,arena,playfieldRect:arena,frame:wood,cabinet:{x,y,w:cw,h:ch},hud:{x,y,w:cw,h:header}};
 const opening=s.openings?.at(-1),p=opening?clamp((activeTime(frame,s)-opening.tick)/(opening.duration||60)):1,e=p*p*(3-2*p);
 const from=opening?.from||s.world,to=s.world;
 const fit=w=>Math.min(arena.w/(w.width-2),arena.h/(w.height-2));
 const cell=fit(from)+(fit(to)-fit(from))*e;
 const cols=from.width+(to.width-from.width)*e,rows=from.height+(to.height-from.height)*e;
 const field={x:arena.x+(arena.w-(cols-2)*cell)/2-cell,y:arena.y+(arena.h-(rows-2)*cell)/2-cell,w:to.width*cell,h:to.height*cell};
 const playableGrid={x:field.x+cell,y:field.y+cell,w:(to.width-2)*cell,h:(to.height-2)*cell};
 const h=frame.head,view={x:0,y:0,cols:to.width,rows:to.height,mode:'fit',wallDistance:{left:h.x-1,right:to.width-2-h.x,top:h.y-1,bottom:to.height-2-h.y}};
 return {layout:{...cabinet,cell,cols:to.width,rows:to.height,field,playableGrid,fitProgress:p,perimeter:false},view};
}
