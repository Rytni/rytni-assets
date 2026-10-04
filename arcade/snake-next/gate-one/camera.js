const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

/** Presentation-only directional look-ahead. Canonical time, not RAF count.
 * Hard visibility rails override easing so quick turns cannot outrun view. */
export class LookAheadCamera {
 constructor(){this.x=0;this.y=0;this.time=null;this.head=null;}
 update(frame,s){
  const h=frame.head,maxX=Math.max(0,s.world.width-28),maxY=Math.max(0,s.world.height-12);
  const dx=h.dx||0,dy=h.dy||0,tx=clamp(h.x-13.5+dx*4.5,0,maxX),ty=clamp(h.y-5.5+dy*2.5,0,maxY);
  const time=s.tick+Math.max(0,Math.min(1,frame.alpha*s.state.cadence-s.state.movePhase));
  const jump=this.head&&Math.hypot(h.x-this.head.x,h.y-this.head.y)>3;
  if(this.time===null||jump){this.x=tx;this.y=ty;}
  else{const dt=Math.max(0,time-this.time),a=1-Math.exp(-dt/7.2);this.x+=(tx-this.x)*a;this.y+=(ty-this.y)*a;}
  this.x=clamp(this.x,Math.max(0,h.x-20),Math.min(maxX,Math.max(0,h.x-7)));
  this.y=clamp(this.y,Math.max(0,h.y-8),Math.min(maxY,Math.max(0,h.y-3)));
  // Short vertical viewport still guarantees five forward cells when possible.
  if(dy>0)this.y=Math.max(this.y,Math.min(maxY,h.y-5));
  if(dy<0)this.y=Math.min(this.y,Math.max(0,h.y-5));
  this.x=clamp(this.x,0,maxX);this.y=clamp(this.y,0,maxY);
  this.time=time;this.head={x:h.x,y:h.y};
  return {x:this.x,y:this.y,cols:28,rows:12,safe:{left:7,right:20,top:3,bottom:8},lookAhead:{dx,dy},wallDistance:{left:h.x-1,right:s.world.width-2-h.x,top:h.y-1,bottom:s.world.height-2-h.y}};
 }
}
