export function expand(points){const result=[{x:points[0][0],y:points[0][1]}];for(let j=1;j<points.length;j++){let {x,y}=result.at(-1);const [tx,ty]=points[j];if(x!==tx&&y!==ty)throw Error('Non-canonical fixture');while(x!==tx||y!==ty){x+=Math.sign(tx-x);y+=Math.sign(ty-y);result.push({x,y});}}return result;}
const routes={
 straight:[[15,4],[1,4]],
 up:[[13,2],[13,4],[8,4],[8,6],[2,6]],
 down:[[13,6],[13,4],[8,4],[8,2],[2,2]],
 U:[[13,2],[13,4],[12,4],[12,3],[8,3],[8,6],[2,6]],
 S:[[13,2],[13,4],[11,4],[11,6],[8,6],[8,3],[2,3]],
 alternating:[[13,2],[13,4],[12,4],[12,5],[11,5],[11,6],[10,6],[10,5],[9,5],[9,4],[2,4]],
 growth:[[13,2],[13,4],[8,4],[8,6],[2,6]],
 length30:[[15,2],[15,3],[3,3],[3,6],[15,6],[15,8],[3,8]],
};
export const names=Object.keys(routes);
export function frameAt(name,alpha,length){
 const route=expand(routes[name]),first=route[0],second=route[1];
 // Historical centers only. No per-segment independent interpolation.
 const phase=name==='straight'?alpha:alpha;
 const start=name==='straight'?3-phase:2-phase;
 const count=length??(name==='length30'?30:8),span=count-1+(name==='growth'?Math.max(0,Math.min(1,alpha)):0);
 const i=Math.floor(start),t=start-i,a=route[i],b=route[i+1];
 while(route.length<Math.ceil(start+span)+4){const c=route.at(-1),p=route.at(-2);route.push({x:c.x+(c.x-p.x),y:c.y+(c.y-p.y)});}
 return {route,start,end:start+span,alpha,head:{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,dx:a.x-b.x,dy:a.y-b.y},moves:100+alpha,length:count};
}
