import {ProgressiveSession} from '../progressive-run/session.js';
import {bodyCell,mark,occupied} from '../simulation/body.js';
import {neighbour} from '../simulation/rules.js';
import {hashText} from '../simulation/prng.js';

export const PORTAL_POLICY='progressive-tunnel-gate-1';
export const EXIT_RUNWAY=3;

/** Portal orchestration only. The core grid step still shifts/grows the ring
 * exactly once. An edge replaces ONLY its newly committed head cell. */
export class TunnelSession extends ProgressiveSession {
 constructor(options={}){
  super(options);this.portalEdges=[];this.portalCompleted=0;this.portalWindow=-1;
  this.portalFacing=[];this.portalReady=false;this.openings=[];
 }
 preparePortals(){
  this.portalWindow=this.director.windowEnd;
  this.portalFacing=this.portals.map((cell,i)=>{
   // Fixed for the whole opportunity, not recomputed by the renderer.
   const preferred=i===0?3:1;
   for(const d of [preferred,(preferred+1)%4,(preferred+3)%4,(preferred+2)%4]){
    let c=cell,legal=!this.arena.blocked(c)&&!occupied(this.state,c);
    for(let n=0;n<EXIT_RUNWAY;n++){
     c=neighbour(c,d,this.arena.width,this.arena.height);
     if(this.arena.blocked(c)||occupied(this.state,c)||this.pickups.some(p=>p.cell===c)||this.world.hazards.some(p=>p.cell===c))legal=false;
    }
    if(legal)return d;
   }
   return -1;
  });
  this.portalReady=this.portalFacing.every(d=>d>=0);
 }
 portalAvailable(){return super.portalAvailable()&&this.portalReady;}
 portalTick(){
  const p=this.portal;p.elapsed++;
  if(this.tick<this.director.windowEnd&&this.portalWindow!==this.director.windowEnd)this.preparePortals();
  if(p.phase==='inactive'&&this.tick>=Math.round(this.pacing.portalFirst*60)){p.phase='armed';p.elapsed=0;}
  else if(p.phase==='cooldown'&&p.elapsed>=Math.round(this.pacing.portalCooldown*60)&&!this.portals.includes(bodyCell(this.state,0))){p.phase='armed';p.elapsed=0;}
  for(const edge of this.portalEdges)if(!edge.complete&&this.moves-edge.move>=this.state.length+1){
   edge.complete=true;this.portalCompleted++;this.emit('portal-exit',edge.exit,{edge:edge.move,tailLast:true});
  }
  // Keep two retired cells plus the half-cell terminal context in history.
  this.portalEdges=this.portalEdges.filter(e=>this.moves-e.move<=this.state.length+3);
 }
 cancelPortal(){/* Pause freezes the canonical tunnel, it does not cancel it. */}
 transfer(){throw Error('Whole-body portal transfer is disabled in Gate 1');}
 emit(kind,cell,data={}){
  super.emit(kind,cell,data);
  if(kind!=='portal-enter'||!this.portalEdges)return;
  const p=this.portal,outgoing=this.portalFacing[this.portals.indexOf(p.exit)],incoming=this.state.direction;
  // A normal core move already retired its tail. Exit uses that exact same
  // occupancy, including growth. No terrain/self immunity, no body translation.
  const reason=this.arena.blocked(p.exit)?'obstacle':occupied(this.state,p.exit)?'self':!Number.isInteger(outgoing)||outgoing<0?'portal-exit-unavailable':null;
  p.phase='cooldown';p.elapsed=0;
  if(reason){this.state.status='dead';this.state.reason=reason;p.rejected++;this.emit('portal-rejected',p.exit,{reason});return;}
  mark(this.state,cell,false);this.state.body[this.state.headIndex]=p.exit;mark(this.state,p.exit,true);
  // Retain relative queued-turn intent through the portal's orientation map.
  const delta=(outgoing-incoming+4)%4;
  for(let i=0;i<this.state.turnCount;i++)this.state.turns[i]=(this.state.turns[i]+delta)%4;
  this.state.direction=outgoing;p.transfers++;
  this.portalEdges.push({move:this.moves,entry:cell,exit:p.exit,incoming,outgoing,complete:false,tick:this.tick});
  this.emit('portal-head-exit',p.exit,{incoming,outgoing});this.repairFood();
 }
 advance(commands=[]){
  const old={width:this.world.width,height:this.world.height,biome:this.world.biome};
  super.advance(commands);
  if(old.width!==this.world.width||old.height!==this.world.height){
   this.openings.push({tick:this.tick,from:old,to:{width:this.world.width,height:this.world.height,biome:this.world.biome},duration:60});
   if(this.openings.length>4)this.openings.shift();
   this.announcements.push({tick:this.tick,text:'МИР РАСШИРЕН'});
  }
 }
 hash(){return hashText(JSON.stringify({base:super.hash(),policy:PORTAL_POLICY,edges:this.portalEdges,completed:this.portalCompleted,window:this.portalWindow,facing:this.portalFacing,ready:this.portalReady})).toString(16).padStart(8,'0');}
 progressionSummary(){return {...super.progressionSummary(),portalPolicy:PORTAL_POLICY,portalFacing:this.portalFacing,completed:this.portalCompleted,tunnelEdges:this.portalEdges};}
}
