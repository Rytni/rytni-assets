// Isolated review-only geometry. No game imports or runtime integration.
export const CELL = 68;
export const BODY = 36;
export const HEAD = 42;
export const TIP_LENGTH = 12;
export const DIRS = [[0,-1],[1,0],[0,1],[-1,0]]; // N E S W
export const OPPOSITE = d => (d + 2) % 4;
const make = predicate => Uint8Array.from({length:CELL*CELL},(_,i)=>+predicate(i%CELL,Math.floor(i/CELL)));
export const straight = make((x,y)=>y>=16 && y<52);
export const neck = straight.slice();
export const corner = make((x,y)=>{
  const r = Math.hypot(x+.5,y+.5);
  return r>=16 && r<52;
});
export const head = make((x,y)=>{
  let half;
  if(x<16) half=18+Math.floor(x/6);
  else if(x<=42) half=21;
  else if(x<64) half=Math.floor(21*Math.sqrt(1-((x-42)/22)**2));
  else return false;
  return y>=34-half && y<34+half;
});
export const terminal = make((x,y)=>{
  const t=Math.max(0,(x-8)/59);
  const half=Math.max(1,Math.round(18*(1-t**1.5)));
  return y>=34-half && y<34+half;
});
export function rotate(mask,turns=1) {
  let result=mask;
  for(let r=0;r<turns;r++) {
    const next=new Uint8Array(CELL*CELL);
    for(let y=0;y<CELL;y++) for(let x=0;x<CELL;x++)
      next[x*CELL+CELL-1-y]=result[y*CELL+x];
    result=next;
  }
  return result;
}
export const pieces=[];
for(let r=0;r<4;r++) {
  pieces.push({name:'straight-'+r,kind:'straight',mask:rotate(straight,r),ports:[(3+r)%4,(1+r)%4]});
  pieces.push({name:'neck-'+r,kind:'neck',mask:rotate(neck,r),ports:[(3+r)%4,(1+r)%4]});
  pieces.push({name:'head-'+r,kind:'head',mask:rotate(head,r),ports:[(3+r)%4]});
  pieces.push({name:'corner-'+r,kind:'corner',mask:rotate(corner,r),ports:[(3+r)%4,r]});
  pieces.push({name:'terminal-'+r,kind:'terminal',mask:rotate(terminal,r),ports:[(3+r)%4]});
}
export function edge(mask,size,d) {
  return Uint8Array.from({length:size},(_,i)=>{
    const x=d===1?size-1:d===3?0:i;
    const y=d===0?0:d===2?size-1:i;
    return mask[y*size+x];
  });
}
export function scaleNearest(mask,dpr) {
  const size=CELL*dpr;
  return Uint8Array.from({length:size*size},(_,i)=>{
    const x=Math.min(67,Math.floor((i%size+.5)/dpr));
    const y=Math.min(67,Math.floor((Math.floor(i/size)+.5)/dpr));
    return mask[y*CELL+x];
  });
}
export function direction(a,b) {
  const d=DIRS.findIndex(([x,y])=>b[0]-a[0]===x && b[1]-a[1]===y);
  if(d<0) throw Error('Route must use cardinal adjacent cells');
  return d;
}
export function routePieces(route) {
  const unique=new Set(route.map(p=>p.join(',')));
  if(unique.size!==route.length) throw Error('Route revisits a cell');
  return route.map((p,i)=>{
    if(i===0) {
      const port=direction(p,route[1]);
      return {point:p,piece:pieces.find(s=>s.kind==='terminal' && s.ports[0]===port)};
    }
    if(i===route.length-1) {
      const port=direction(p,route[i-1]);
      return {point:p,piece:pieces.find(s=>s.kind==='head' && s.ports[0]===port)};
    }
    const ports=[direction(p,route[i-1]),direction(p,route[i+1])];
    const straightRoute=OPPOSITE(ports[0])===ports[1];
    const kind=straightRoute?(i===route.length-2?'neck':'straight'):'corner';
    return {point:p,piece:pieces.find(s=>s.kind===kind && ports.every(d=>s.ports.includes(d)))};
  });
}
export function expand(waypoints) {
  const route=[waypoints[0]];
  for(let i=1;i<waypoints.length;i++) {
    const [tx,ty]=waypoints[i]; let [x,y]=route.at(-1);
    if(x!==tx && y!==ty) throw Error('Non-cardinal waypoint');
    while(x!==tx || y!==ty) {x+=Math.sign(tx-x);y+=Math.sign(ty-y);route.push([x,y]);}
  }
  return route;
}
export const fixtures=[
  {id:'straight-8',label:'Straight length 8',route:expand([[0,0],[7,0]])},
  {id:'straight-30',label:'Straight length 30 — horizontal scroll, no shrink',route:expand([[0,0],[29,0]])},
  {id:'head-neck',label:'Head → neck → body / native 100%',route:expand([[0,0],[4,0]])},
  {id:'taper-tail',label:'Body → taper → tail / terminal = 68 px',route:expand([[0,0],[4,0]])},
  {id:'tight-U',label:'Tight U / neighboring lanes',route:expand([[0,0],[3,0],[3,1],[0,1]])},
  {id:'S',label:'S pattern',route:expand([[0,0],[3,0],[3,2],[6,2],[6,4],[9,4]])},
  {id:'mixed-route',label:'Mixed route / 10 turns',route:expand([[0,0],[3,0],[3,2],[1,2],[1,4],[5,4],[5,6],[3,6],[3,8],[7,8],[7,10],[9,10]])}
];
