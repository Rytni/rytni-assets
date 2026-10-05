// Read-only presentation helpers. No game state, RNG, scheduler or clock owner.
export function focusPositions(head,cell,tick){
 const dx=head.dx,dy=head.dy;
 return [[-.15,-.65],[-.75,.60],[-1.15,-.50]].map(([along,side],i)=>{
  const a=along+Math.sin(tick/(51+i*7)+i*1.9)*.07,b=side+Math.sin(tick/(67+i*9)+i)*.06;
  const lateral=Math.sign(b)*Math.max(Math.abs(b)*cell,14);
  return {x:head.x+dx*a*cell-dy*lateral,y:head.y+dy*a*cell+dx*lateral};
 });
}
// CSS pixels, in the renderer's existing CSS coordinate system (not backing DPR).
export const VFX_FLOORS=Object.freeze({focus:17,spore:18,sporeTrail:8,sporeBurst:32,guardPlate:20,guardCharged:25,guardBreak:40,rush:17,portal:30,portalTrail:14,corrupt:11,rootWarning:28,rootSprout:24});
const SCALES=Object.freeze({focus:.45,spore:.40,sporeTrail:.18,sporeBurst:1.05,guardPlate:.43,guardCharged:.48,guardBreak:1.1,rush:.43,portal:1.05,portalTrail:.30,corrupt:.22,rootWarning:.90,rootSprout:.85});
export function vfxSize(kind,cell){return Math.max(VFX_FLOORS[kind],cell*SCALES[kind]);}
export function rushPositions(route,cell){
 const positions=[];
 for(let i=2;i<Math.min(8,route?.length||0);i++){
  const p=route[i],a=route[i-1],b=route[i+1]||p;
  // Reject discontinuities; no trail chord across portal endpoints.
  if(Math.abs(p.x-a.x)+Math.abs(p.y-a.y)>1.01)continue;
  const next=Math.abs(p.x-b.x)+Math.abs(p.y-b.y)<=1.01?b:p;
  const dx=a.x-next.x,dy=a.y-next.y,n=Math.hypot(dx,dy)||1,side=i%2?1:-1,offset=Math.max(cell*.39,12);
  positions.push({x:p.x,y:p.y,offsetX:-dy/n*side*offset,offsetY:dx/n*side*offset,kind:i%2?'thorn':'ember',opacity:.92-(i-2)*.10,phase:i*7});
 }return positions;
}
export function mistVariation(side,layer,index){
 const n=index+side*11+layer*7;
 return {scale:[3.1,3.5,3.9][n%3],mirror:n%2===1,phase:n%4,offset:([-2,1,-1,2,0][n%5])*.12,opacity:[.84,1.02,.92,1.06,.88][n%5]};
}
const overlaps=(a,b)=>a.x<b.x+b.w+2&&a.x+a.w+2>b.x&&a.y<b.y+b.h+2&&a.y+a.h+2>b.y;
export function feedbackLanes(s,t,at,cell,arena,head){
 const recent=s.feedback.filter(f=>['seed','portal-reward'].includes(f.kind)&&t-f.tick>=0&&t-f.tick<20.4);
 const food=recent.findLast(f=>!f.spore),spore=recent.findLast(f=>f.spore),last=s.feedback.findLast(f=>f.kind==='seed'&&!f.spore),requests=[];
 if(food)requests.push({f:food,text:'+'+food.amount+(food.corrupt?' −40%':''),color:food.corrupt?'#c998d4':food.harvest||food.kind==='portal-reward'?'#ffdf72':'#f7efb5'});
 if(spore)requests.push({f:spore,text:'+'+recent.filter(f=>f.spore&&Math.abs(f.tick-spore.tick)<=6).reduce((n,f)=>n+f.amount,0),color:'#b9f5df'});
 if(last?.maxReached&&t-last.tick>=0&&t-last.tick<60)requests.push({text:'MAX COMBO',color:'#f4df8e',upper:true});
 const headBox={x:head.x-Math.max(17,cell*.45),y:head.y-Math.max(17,cell*.45),w:Math.max(34,cell*.9),h:Math.max(34,cell*.9)},placed=[];
 // Upper announcement owns its lane first; score pops never cover it or head.
 for(const r of requests.sort((a,b)=>Number(!!b.upper)-Number(!!a.upper))){
  const size=Math.max(1,Math.min(2,Math.floor(cell/28))),w=r.text.length*6*size,h=8*size,p=r.f?at(r.f.cell):{x:arena.x+arena.w/2,y:arena.y},age=r.f?(t-r.f.tick)/60:0;
  if(w>arena.w-8||h>arena.h-8)continue;
  const offsets=r.upper?[[0,6],[w/2+8,6],[-w/2-8,6]]:[[0,-cell*(.65+age)],[cell*.65,-cell*(.65+age)],[-cell*.65,-cell*(.65+age)],[0,-cell*(1.15+age)],[cell*1.2,-cell*(1.2+age)],[-cell*1.2,-cell*(1.2+age)]];
  // Edge-clamped object lanes can collide. Search a small deterministic upper
  // stack only as a last resort; never paint the glyph over the head.
  if(!r.upper)for(let row=0;row<3;row++)for(const center of [p.x,arena.x+w/2+6,arena.x+arena.w-w/2-6])offsets.push([center-p.x,arena.y+6+row*(h+4)-p.y]);
  for(const [ox,oy]of offsets){
   const box={x:Math.round(Math.max(arena.x+4,Math.min(arena.x+arena.w-w-4,p.x+ox-w/2))),y:Math.round(Math.max(arena.y+4,Math.min(arena.y+arena.h-h-4,p.y+oy))),w,h};
   if(overlaps(box,headBox)||placed.some(q=>overlaps(box,q.box)))continue;
   placed.push({text:r.text,color:r.color,size,x:box.x+w/2,y:box.y,box});break;
  }
 }return placed;
}
export function foodSquash(age){return age>=0&&age<5?1-.23*Math.sin(age/5*Math.PI):1;}
export function rootWarningPhase(tick,starts){
 const age=tick-(starts-72);
 return {crackStart:starts-72,sproutStart:starts-36,sprout:age>=36};
}
