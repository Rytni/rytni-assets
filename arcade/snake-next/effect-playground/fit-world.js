// DEV presentation only. No simulation, head-follow, RNG or wall ownership.
const clamp=n=>Math.max(0,Math.min(1,n));
export function activeTime(frame,s){return s.tick+clamp(s.state.movement?((frame.alpha||0)*60_000_000-s.state.movement.progress)/s.state.movement.rate:(frame.alpha||0)*s.state.cadence-s.state.movePhase);}
export function fitWorldLayout(base,s,frame){
 const {arena}=base,opening=s.openings?.at(-1),time=activeTime(frame,s),p=opening?clamp((time-opening.tick)/(opening.duration||60)):1,e=p*p*(3-2*p);
 const from=opening?.from||s.world,to=s.world,pad=4;
 const fit=w=>Math.min((arena.w-pad*2)/w.width,(arena.h-pad*2)/w.height);
 const cell=fit(from)+(fit(to)-fit(from))*e;
 // Interpolate world center as well as scale: expansion adds east/south cells;
 // the old world origin must not jump atomically before the zoom begins.
 const cols=from.width+(to.width-from.width)*e,rows=from.height+(to.height-from.height)*e;
 const field={x:arena.x+(arena.w-cols*cell)/2,y:arena.y+(arena.h-rows*cell)/2,w:to.width*cell,h:to.height*cell};
 const h=frame.head,view={x:0,y:0,cols:to.width,rows:to.height,mode:'fit',wallDistance:{left:h.x-1,right:to.width-2-h.x,top:h.y-1,bottom:to.height-2-h.y}};
 return {layout:{...base,cell,cols:to.width,rows:to.height,field,fitProgress:p},view};
}

export function readability(cell,compact=false){return {cell,body:cell*36/68,food:cell*.70,pickupBox:cell*(compact?.94:.68)};}
