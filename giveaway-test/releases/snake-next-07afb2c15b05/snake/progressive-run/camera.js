const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
/** Read-only dead-zone camera; presentation memory is excluded from replay. */
export class Camera {
 constructor(){this.x=0;this.y=0;this.tick=null;this.transfer=-1;}
 update(frame,s,mobile=false){
  const maxX=Math.max(0,s.world.width-28),maxY=Math.max(0,s.world.height-12),hx=frame.head.x,hy=frame.head.y;
  const left=mobile?8:7,right=mobile?19:20,top=mobile?4:3,bottom=mobile?7:8;
  const teleport=this.transfer!==s.portal.transfers;
  if(this.tick===null||teleport){this.x=clamp(hx-13.5,0,maxX);this.y=clamp(hy-5.5,0,maxY);}
  else if(this.tick!==s.tick||this.alpha!==frame.alpha){
   if(hx-this.x<left)this.x=clamp(hx-left,0,maxX);else if(hx-this.x>right)this.x=clamp(hx-right,0,maxX);
   if(hy-this.y<top)this.y=clamp(hy-top,0,maxY);else if(hy-this.y>bottom)this.y=clamp(hy-bottom,0,maxY);
  }
  this.tick=s.tick;this.alpha=frame.alpha;this.transfer=s.portal.transfers;return {x:this.x,y:this.y,cols:28,rows:12,safe:{left,right,top,bottom}};
 }
}
