// Read-only presentation helpers. No game state, RNG, scheduler or clock owner.
export function focusPositions(head,cell,tick){
 const dx=head.dx,dy=head.dy;
 return [[-.25,-.48],[-.80,.40],[-1.20,-.28]].map(([along,side],i)=>{
  const a=along+Math.sin(tick/(51+i*7)+i*1.9)*.07,b=side+Math.sin(tick/(67+i*9)+i)*.06;
  return {x:head.x+(dx*a-dy*b)*cell,y:head.y+(dy*a+dx*b)*cell};
 });
}
export function foodSquash(age){return age>=0&&age<5?1-.23*Math.sin(age/5*Math.PI):1;}
export function rootWarningPhase(tick,starts){
 const age=tick-(starts-72);
 return {crackStart:starts-72,sproutStart:starts-36,sprout:age>=36};
}
