export function visualHash(seed,index){let h=(seed^Math.imul(index,0x9e3779b1))>>>0;h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;return h>>>0;}
/** Persistent material domain: p = completed travel + fractional move - distance from head. */
export class D2Material {
  constructor(seed,capacity){this.seed=seed;this.capacity=capacity;this.point={x:0,y:0,dx:0,dy:0};this.pool=Array.from({length:96},()=>({}));this.reset();}
  reset(){this.travel=0;this.lastHead=-1;}
  capture(snapshots){const head=snapshots.current[0];if(this.lastHead!==-1&&head!==this.lastHead)this.travel++;this.lastHead=head;}
  mushroomAt(k,h,p){
    if(h%17!==0)return false;
    for(let j=k-11;j<=k+11;j++){if(j===k)continue;const other=visualHash(this.seed,j);if(other%17===0&&other<h&&Math.abs(j*3+(other%210)/100-p)<31)return false;}
    return true;
  }
  visibleAccents(g,bounds,lod,out){
    const origin=this.travel-(g.alpha<1&&g.start>0?1-g.alpha:0),a=Math.floor((origin-g.span)/3)-1,b=Math.ceil(origin/3)+1;
    let n=0;const limit=lod==='small'?48:96;
    for(let k=a;k<=b&&n<limit;k++){
      const h=visualHash(this.seed,k),p=k*3+(h%210)/100,d=g.start+origin-p;
      if(d<g.start+.9||d>g.end-.7)continue;
      g.point(d,this.point);const {x,y,dx,dy}=this.point;if(x<bounds.x0-.3||x>bounds.x1+.3||y<bounds.y0-.3||y>bounds.y1+.3)continue;
      let kind='moss';
      // Global material-space thinning, independent of visible window or body length.
      if(this.mushroomAt(k,h,p))kind='mushroom';
      else if(lod==='large'&&h%7===0)kind='flower';
      const record=this.pool[n];record.id=k;record.kind=kind;record.x=x;record.y=y;record.dx=dx;record.dy=dy;record.distance=d;record.size=.35+(h>>>16)%45/100;record.side=((h>>>12)%140-70)/1000;record.variant=h%3;out[n++]=record;
    }
    out.length=n;return out;
  }
}
