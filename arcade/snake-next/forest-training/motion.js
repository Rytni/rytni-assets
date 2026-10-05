import {BodySnapshots} from '../presentation/path.js';
import {bodyCell} from '../simulation/body.js';
import {movementAlpha} from '../simulation/timing.js';

/** Read-only presentation history. No prediction, input consumption or sim writes. */
export class SnakeMotion {
  constructor(session){this.reset(session);}
  reset(session){
    this.snapshots=new BodySnapshots(session.arena.cells);this.snapshots.reset(session.state);
    this.state=session.state;this.frozen=null;this.floor=0;this.alpha=1;this.revision=0;
    const w=session.arena.width,n=this.snapshots.length,c=this.snapshots.current[n-1],b=this.snapshots.current[n-2],dx=c%w-b%w,dy=Math.floor(c/w)-Math.floor(b/w);
    this.retired=[{x:c%w+dx,y:Math.floor(c/w)+dy},{x:c%w+dx*2,y:Math.floor(c/w)+dy*2}];
  }
  capture(session){
    if(session.state!==this.state){this.reset(session);return;} // atomic portal transfer
    const moved=bodyCell(session.state,0)!==this.snapshots.current[0];
    if(moved&&session.state.length===this.snapshots.length){const c=this.snapshots.current[this.snapshots.length-1],w=session.arena.width;this.retired=[{x:c%w,y:Math.floor(c/w)},...this.retired].slice(0,2);}
    this.snapshots.capture(session.state);
    if(moved){this.floor=0;this.alpha=0;this.revision++;}
    if(session.state.status!=='playing')this.floor=1;
  }
  sample(session,fraction=0){
    if(this.frozen!==null)return this.frozen;
    if(!this.snapshots.moved)return this.alpha=1;
    const entering=['entering','teleport'].includes(session.portal.phase);
    if(session.state.movement&&!entering)return this.alpha=Math.max(this.floor,this.alpha,movementAlpha(session.state,fraction));
    const phase=entering?session.portal.elapsed:session.state.movePhase;
    const cadence=entering?Math.min(12,session.state.cadence):session.state.cadence;
    return this.alpha=Math.max(this.floor,this.alpha,Math.min(1,Math.max(0,(phase+fraction)/cadence)));
  }
  freeze(session,fraction){this.frozen=this.sample(session,fraction);return this.frozen;}
  resume(){if(this.frozen!==null)this.floor=this.frozen;this.frozen=null;}
  frame(session,fraction=0){
    const a=this.sample(session,fraction),s=this.snapshots,w=session.arena.width,route=[];
    for(let i=0;i<s.length;i++)route.push({x:s.current[i]%w,y:Math.floor(s.current[i]/w)});
    // Retain the two last *retired canonical cells* as terminal bend context.
    // They are not simulated occupancy. Without the second cell, a taper that
    // crosses a turn loses its outgoing tangent at the next bracket boundary.
    route.push(...this.retired);
    const start=s.moved?1-a:0,span=s.moved?s.previousLength-1+(s.length-s.previousLength)*a:s.length-1;
    const point=d=>{const i=Math.min(route.length-2,Math.max(0,Math.floor(d))),t=d-i,p=route[i],q=route[i+1];return {x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,dx:p.x-q.x,dy:p.y-q.y};};
    return {route,start,end:start+span,alpha:a,head:point(start),tail:point(start+span),moves:session.moves,revision:this.revision};
  }
}
