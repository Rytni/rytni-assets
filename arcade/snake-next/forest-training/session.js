import {createRules,createArena,createState,step,stateHash} from '../entry.js';
import {bodyCells,bodyCell,occupied} from '../simulation/body.js';
import {reachableFoodCells,validateFood} from '../simulation/food.js';
import {randomIndex,hashText} from '../simulation/prng.js';
import {neighbour} from '../simulation/rules.js';

export const EFFECTS=Object.freeze({
  focus:{positive:true,duration:600,label:'ФОКУС'},
  harvest:{positive:true,duration:720,label:'УРОЖАЙ'},
  rush:{positive:false,duration:420,label:'СПЕШКА'}
});
export function baseCadence(tick,foods) {
  if(tick<900)return 15;
  const progression=Math.min(Math.max((tick-900)/1800,foods/7),1+(tick-900)/300);
  return Math.max(6,15-Math.floor(progression));
}
export function forestArena(touch=false) {
  const width=28,height=12,blocked=[];
  for(let x=0;x<width;x++)blocked.push(x,(height-1)*width+x);
  for(let y=1;y<height-1;y++)blocked.push(y*width,y*width+width-1);
  const rocks=[{x:5,y:2},{x:23,y:3},{x:14,y:9}];
  blocked.push(...rocks.map(p=>p.y*width+p.x));
  // A visible control plinth, not an invisible obstacle; never moves with camera.
  if(touch)for(let y=7;y<11;y++)for(let x=1;x<6;x++)blocked.push(y*width+x);
  const body=Array.from({length:8},(_,i)=>5*width+11-i);
  return {arena:createArena({width,height,blockedCells:blocked,initialBody:body,initialDirection:1,runwayCells:12}),rocks};
}

/** Pure deterministic Training orchestration. Core step/grid/queue remain untouched.
 * All durations are active fixed ticks; replay must use Session.hash, not core hash alone. */
export class Session {
  constructor({seed=56103,touch=false,arena,rules}={}) {
    const forest=arena?{arena,rocks:[]}:forestArena(touch);
    this.arena=forest.arena;this.rocks=forest.rocks;
    this.rules=rules||createRules({version:'forest-training-v1',width:this.arena.width,height:this.arena.height,
      ticksPerCell:15,runwayCells:12,minFreeCells:1,obstacleBlocks:0,firstFoodAhead:4});
    this.state=createState({seed,rules:this.rules,arena:this.arena});
    this.tick=0;this.moves=0;this.foods=0;this.score=0;this.combo=0;this.lastFood=-9999;
    this.effects=[];this.pickups=[];this.feedback=[];this.events=[];this.spawnTick=180;
    this.rng=(seed^0x5f0ae55)>>>0;this.touch=touch;this.portal={phase:'inactive',elapsed:0,transfers:0,rejected:0,entry:-1,exit:-1};
    this.portals=arena?[]:[3*this.arena.width+10,8*this.arena.width+18];
    this.replay=[];this.status='playing';this.deathTicks=0;this.sequence=0;this.transitCommands=[];
    this.repairFood();
  }
  emit(kind,cell,data={}) {this.events.push({kind,cell,tick:this.tick,...data});}
  forbidden(cell) {return this.portals.includes(cell)||this.pickups.some(p=>p.cell===cell);}
  freeCell() {
    const n=reachableFoodCells(this.state,this.arena),available=[];
    for(let i=0;i<n;i++){const c=this.state.scratch.candidates[i];if(!this.forbidden(c)&&c!==this.state.food)available.push(c);}
    return available.length?available[randomIndex(this,available.length)]:-1;
  }
  repairFood() {
    if(this.state.status!=='playing')return;
    if(this.state.food>=0&&!this.forbidden(this.state.food))return;
    const cell=this.freeCell();
    if(cell<0){this.state.food=-1;this.state.status='full';this.state.reason='no-legal-food';this.status='dying';return;}
    this.state.food=cell;
  }
  collect(kind,cell) {
    const definition=EFFECTS[kind];if(!definition)return false;
    const existing=this.effects.find(e=>e.kind===kind);
    if(existing)existing.ends=this.tick+definition.duration;
    else {
      const count=this.effects.filter(e=>EFFECTS[e.kind].positive===definition.positive).length;
      if(count>=(definition.positive?2:1))return false;
      this.effects.push({kind,ends:this.tick+definition.duration});
    }
    this.emit(definition.positive?'positive':'negative',cell,{effect:kind,refresh:!!existing});return true;
  }
  spawnPickup() {
    const choices=Object.keys(EFFECTS).filter(kind=>{
      const d=EFFECTS[kind];return !this.pickups.some(p=>p.kind===kind)
        &&this.effects.filter(e=>EFFECTS[e.kind].positive===d.positive).length<(d.positive?2:1);
    });
    if(this.pickups.length>=3||!choices.length)return;
    const cell=this.freeCell();if(cell<0)return;
    this.pickups.push({kind:choices[randomIndex(this,choices.length)],cell,ends:this.tick+1200});
  }
  cadence() {
    let n=baseCadence(this.tick,this.foods);
    if(this.effects.some(e=>e.kind==='focus'))n=Math.ceil(n*1.25);
    if(this.effects.some(e=>e.kind==='rush'))n=Math.max(5,Math.round(n*.8));
    return n;
  }
  transfer(destination) {
    const s=this.state,w=this.arena.width,head=bodyCell(s,0),dx=destination%w-head%w,dy=Math.floor(destination/w)-Math.floor(head/w);
    const body=bodyCells(s).map(c=>{const x=c%w+dx,y=Math.floor(c/w)+dy;return x<0||x>=w||y<0||y>=this.arena.height?-1:y*w+x;});
    if(body.some(c=>this.arena.blocked(c)))return false;
    let next;
    try{next=createState({seed:s.seed,session:s.session,rules:this.rules,arena:this.arena,body,direction:s.direction});}catch{return false;}
    for(const key of ['tick','growth','score','cadence','lastInputSequence','eventSequence','rng'])next[key]=s[key];
    next.movePhase=0;next.turnCount=s.turnCount;next.turns.set(s.turns);next.events=[];
    if(s.food>=0&&!this.forbidden(s.food)&&validateFood(next,this.arena,s.food))next.food=s.food;
    this.state=next;this.repairFood();return true;
  }
  cancelPortal() {
    if(['entering','teleport'].includes(this.portal.phase)){
      this.portal.phase='cooldown';this.portal.elapsed=0;this.portal.entry=-1;this.portal.exit=-1;
      this.state.movePhase=0;
      this.transitCommands=[];
    }
  }
  portalTick() {
    const p=this.portal;p.elapsed++;
    if(p.phase==='inactive'&&this.tick>=600){p.phase='armed';p.elapsed=0;}
    else if(p.phase==='entering'&&p.elapsed>=12){p.phase='teleport';p.elapsed=0;}
    else if(p.phase==='teleport'){
      const destination=neighbour(p.exit,this.state.direction,this.arena.width,this.arena.height);
      if(this.transfer(destination)){p.transfers++;p.phase='exit-grace';this.emit('portal-exit',destination);}
      else {p.rejected++;p.phase='cooldown';this.emit('portal-rejected',bodyCell(this.state,0));}
      p.elapsed=0;
    } else if(p.phase==='exit-grace'&&p.elapsed>=36){p.phase='cooldown';p.elapsed=0;}
    else if(p.phase==='cooldown'&&p.elapsed>=90&&!this.portals.includes(bodyCell(this.state,0))){p.phase='armed';p.elapsed=0;}
  }
  advance(commands=[]) {
    this.events=[];if(this.status==='result')return;
    this.tick++;
    if(this.status==='dying'){if(++this.deathTicks>=27){this.status='result';this.effects=[];this.pickups=[];this.feedback=[];this.portal.phase='inactive';this.emit('result',bodyCell(this.state,0));}return;}
    this.replay.push(...commands.map(command=>({at:this.tick,command:{...command}})));
    this.effects=this.effects.filter(e=>e.ends>this.tick);this.pickups=this.pickups.filter(p=>p.ends>this.tick);
    this.feedback=this.feedback.filter(f=>this.tick-f.tick<36);
    this.portalTick();
    if(['entering','teleport'].includes(this.portal.phase)){
      this.transitCommands.push(...commands);this.transitCommands=this.transitCommands.slice(-2);return;
    }
    const old=bodyCell(this.state,0);
    const normalized=[...this.transitCommands,...commands].map(c=>({...c,tick:this.state.tick+1}));this.transitCommands=[];
    this.state.cadence=this.cadence();
    step(this.state,this.arena,this.rules,normalized);this.state.cadence=this.cadence();
    const head=bodyCell(this.state,0);
    if(head!==old){
      this.moves++;
      if(this.state.events.some(e=>e.type==='food-consumed')){
        this.foods++;this.combo=this.tick-this.lastFood<=600?Math.min(8,this.combo+1):1;this.lastFood=this.tick;
        const amount=Math.round(100*(1+(15-baseCadence(this.tick,this.foods))*.08)*(1+(this.combo-1)*.15))*(this.effects.some(e=>e.kind==='harvest')?2:1);
        this.score+=amount;this.emit('seed',head,{amount,combo:this.combo});this.feedback.push({kind:'seed',cell:head,tick:this.tick,amount});this.repairFood();
      }
      for(const p of this.pickups.filter(p=>p.cell===head))this.collect(p.kind,head);
      this.pickups=this.pickups.filter(p=>p.cell!==head);
      if(this.portal.phase==='armed'&&this.portals.includes(head)){
        this.portal.phase='entering';this.portal.elapsed=0;this.portal.entry=head;this.portal.exit=this.portals.find(c=>c!==head);
        this.emit('portal-enter',head);
      }
    }
    if(this.tick>=this.spawnTick){this.spawnPickup();this.spawnTick=this.tick+480;}
    if(this.tick-this.lastFood>600)this.combo=0;
    if(this.state.status!=='playing'){this.status='dying';this.effects=[];this.pickups=[];this.portal.phase='inactive';this.emit('death',head,{reason:this.state.reason});}
  }
  hash() {
    return hashText(JSON.stringify({core:stateHash(this.state),tick:this.tick,moves:this.moves,score:this.score,foods:this.foods,
      combo:this.combo,lastFood:this.lastFood,rng:this.rng,effects:this.effects,pickups:this.pickups,portal:this.portal,
      spawnTick:this.spawnTick,status:this.status,deathTicks:this.deathTicks,transitCommands:this.transitCommands})).toString(16).padStart(8,'0');
  }
  summary(){return {hash:this.hash(),tick:this.tick,score:this.score,foods:this.foods,length:this.state.length,combo:this.combo,
    speed:60/this.cadence(),effects:this.effects.map(e=>({...e,remaining:(e.ends-this.tick)/60})),food:this.state.food,portal:{...this.portal},status:this.status};}
}
