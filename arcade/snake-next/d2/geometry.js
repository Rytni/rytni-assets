import {ContinuousBody} from '../presentation/path.js';

/** D2 presentation only. The cardinal route/phase/endpoints remain canonical. */
export class D2Geometry extends ContinuousBody {
  constructor(capacity){super(capacity);this.corridor=new Uint8Array(capacity);this.distances=new Float32Array(capacity+20);this.probe={x:0,y:0,dx:0,dy:0};}
  radiusAt(distance){const t=Math.min(1,Math.max(0,(this.end-distance)/this.taperLength));return .34*t*(2-t);}
  inCorridor(x,y){const cell=Math.floor(y)*this.width+Math.floor(x);return cell>=0&&cell<this.corridor.length&&!!this.corridor[cell];}
  build(snapshots,width,alpha){
    super.build(snapshots,width,alpha);this.width=width;this.alpha=Math.max(0,Math.min(1,alpha));this.taperLength=Math.min(3,this.span*.4);
    this.corridor.fill(0);for(let i=0;i<snapshots.length;i++)this.corridor[snapshots.current[i]]=1;
    if(snapshots.moved)for(let i=0;i<snapshots.previousLength;i++)this.corridor[snapshots.previous[i]]=1;
    const first=this.start+Math.min(.25,this.span*.06);let n=0;
    const add=d=>{
      this.point(d,this.probe);let {x,y,dx,dy}=this.probe,denom=1;
      if(Number.isInteger(d)&&d>this.start&&d<this.end){const i=d,ax=this.x[i-1]-x,ay=this.y[i-1]-y,bx=x-this.x[i+1],by=y-this.y[i+1];dx=ax+bx;dy=ay+by;const norm=Math.hypot(dx,dy);dx/=norm;dy/=norm;denom=Math.max(Math.SQRT1_2,dx*bx+dy*by);}
      const r=this.radiusAt(d)/denom;this.polygon[n*4]=x-dy*r;this.polygon[n*4+1]=y+dx*r;this.polygon[n*4+2]=x+dy*r;this.polygon[n*4+3]=y-dx*r;this.distances[n]=d;n++;
    };
    add(first);for(let d=Math.floor(first)+1;d<this.end;d++)add(d);add(this.end);this.count=n;return this;
  }
}
