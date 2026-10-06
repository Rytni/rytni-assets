import {bodyCell} from '../simulation/body.js';

/** Reusable presentation snapshots. No simulation state is retained or written. */
export class BodySnapshots {
  constructor(capacity){this.previous=new Uint32Array(capacity);this.current=new Uint32Array(capacity);this.previousLength=0;this.length=0;this.moved=false;}
  reset(state){this.length=this.previousLength=state.length;this.previousFood=this.food=state.food;for(let i=0;i<state.length;i++)this.previous[i]=this.current[i]=bodyCell(state,i);this.moved=false;}
  capture(state){
    if(bodyCell(state,0)===this.current[0])return;
    const swap=this.previous;this.previous=this.current;this.current=swap;this.previousLength=this.length;this.length=state.length;
    this.previousFood=this.food;this.food=state.food;
    for(let i=0;i<state.length;i++)this.current[i]=bodyCell(state,i);
    this.moved=true;
  }
}

/** One distance parameterization, piecewise cardinal: never lerp across a corner. */
export class ContinuousBody {
  constructor(capacity){this.x=new Float32Array(capacity+2);this.y=new Float32Array(capacity+2);this.polygon=new Float32Array((capacity+20)*4);this.count=0;this.head={x:0,y:0,dx:1,dy:0};this.tail={x:0,y:0};}
  point(distance,out){
    const at=Math.min(this.routeCount-2,Math.max(0,Math.floor(distance))),t=distance-at;
    out.x=this.x[at]+(this.x[at+1]-this.x[at])*t;out.y=this.y[at]+(this.y[at+1]-this.y[at])*t;
    out.dx=this.x[at]-this.x[at+1];out.dy=this.y[at]-this.y[at+1];return out;
  }
  build(snapshots,width,alpha){
    alpha=Math.max(0,Math.min(1,alpha));
    const {current,previous,length,previousLength,moved}=snapshots;
    this.routeCount=length;
    for(let i=0;i<length;i++){this.x[i]=current[i]%width+.5;this.y[i]=Math.floor(current[i]/width)+.5;}
    if(moved&&length===previousLength){this.x[length]=previous[previousLength-1]%width+.5;this.y[length]=Math.floor(previous[previousLength-1]/width)+.5;this.routeCount++;}
    this.start=moved?1-alpha:0;
    this.span=moved?previousLength-1+(length-previousLength)*alpha:length-1;
    this.end=this.start+this.span;
    this.point(this.start,this.head);this.point(this.end,this.tail);
    // Body starts inside the back edge of the shared head silhouette.
    const first=this.start+Math.min(.35,this.span*.1),points=this.points||(this.points={x:0,y:0,dx:0,dy:0});
    let n=0;
    const add=distance=>{
      this.point(distance,points);
      let dx=points.dx,dy=points.dy,denom=1;
      if(distance>this.start&&distance<this.end&&Number.isInteger(distance)){
        const i=distance,ax=this.x[i-1]-this.x[i],ay=this.y[i-1]-this.y[i],bx=this.x[i]-this.x[i+1],by=this.y[i]-this.y[i+1];
        dx=ax+bx;dy=ay+by;const norm=Math.hypot(dx,dy);dx/=norm;dy/=norm;denom=Math.max(Math.SQRT1_2,dx*bx+dy*by);
      }
      const taper=Math.min(1,(this.end-distance)/Math.min(3,this.span*.55)),radius=.34*Math.max(0,taper)/denom;
      this.polygon[n*4]=points.x-dy*radius;this.polygon[n*4+1]=points.y+dx*radius;
      this.polygon[n*4+2]=points.x+dy*radius;this.polygon[n*4+3]=points.y-dx*radius;n++;
    };
    add(first);for(let d=Math.floor(first)+1;d<this.end;d++)add(d);add(this.end);
    this.count=n;return this;
  }
}
