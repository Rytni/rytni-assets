/* Mushroom Snake v2: deterministic cardinal simulation; no DOM or render dependencies. */
(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./snake-rules.js'):root.MushroomSnakeRules,node?require('./snake-world.js'):root.MushroomSnakeWorld);if(typeof module==='object'&&module.exports)module.exports=api;else root.MushroomSnakeCore=api;})(typeof globalThis==='object'?globalThis:this,(Rules,WorldModule)=>{
  'use strict';
  const CAPACITY=8192,CHUNK=16,DX=[0,1,0,-1],DY=[-1,0,1,0];
  const {BIOMES,DIFFICULTY,SCORING,EVENTS,hash,difficulty}=Rules;
  const {World}=WorldModule;
  const key=(x,y)=>x+','+y,mod=(n,d)=>((n%d)+d)%d;
  const EFFECTS=Object.freeze({
    magnet:{name:'МИЦЕЛИЙ',duration:360,cooldown:1200,bad:false,asset:'pickup-magnet-v1'},
    golden:{name:'ЗОЛОТОЙ УРОЖАЙ',duration:600,cooldown:1500,bad:false,asset:'pickup-golden-v1'},
    ghost:{name:'ПРИЗРАЧНАЯ ШЛЯПКА',duration:360,cooldown:1500,bad:false,asset:'pickup-ghost-v1'},
    fairy:{name:'ВОЛШЕБНОЕ КОЛЬЦО',duration:600,cooldown:1800,bad:false,asset:'pickup-fairy-v1'},
    time:{name:'ГРИБ ВРЕМЕНИ',duration:300,cooldown:1500,bad:false,asset:'pickup-time-v1'},
    drunk:{name:'ПЬЯНЫЙ ГРИБ',duration:240,cooldown:1500,bad:true,asset:'pickup-drunk-v1'},
    hiccup:{name:'ИКОТА',duration:360,cooldown:1500,bad:true,asset:'pickup-hiccup-v1'},
    slime:{name:'ЛИПКАЯ СЛИЗЬ',duration:300,cooldown:1500,bad:true,asset:'pickup-slime-v1'}
  });
  const SPECIAL_KINDS=Object.freeze(Object.keys(EFFECTS));
  const MAX_POSITIVE_ACTIVE=2,MAX_NEGATIVE_ACTIVE=1;
  class Engine{
    constructor(seed=1,{forestSlice=false}={}){this.forestSlice=forestSlice;this.bx=new Int32Array(CAPACITY);this.by=new Int32Array(CAPACITY);this.rx=new Float32Array(CAPACITY);this.ry=new Float32Array(CAPACITY);this.items=Array.from({length:4+EVENTS.slots},(_,i)=>({x:0,y:0,px:0,py:0,kind:i===3?'magnet':'food',active:false,cool:0,eventFood:i>=4,reward:1}));this.queue=[];this.occupied=new Set();this.events=[];this.searchX=new Int32Array(2401);this.searchY=new Int32Array(2401);this.seen=new Uint8Array(2401);this.reset(seed);}
    random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
    reset(seed=1,length=8){this.seed=seed>>>0;this.world=new World(seed,this.forestSlice);this.length=Math.max(2,Math.min(CAPACITY-2,length));this.head=0;this.x=0;this.y=0;this.direction=1;this.previousDirection=1;this.ticks=0;this.steps=0;this.phase=0;this.lastPeriod=8;this.moveTicks=0;this.points=0;this.difficulty=0;this.worldEvent=null;this.nextEvent=EVENTS.first;this.eventSerial=0;this.comboFlash=0;this.growth=0;this.foodCount=0;this.combo=0;this.maxCombo=0;this.comboUntil=0;this.bonuses=0;this.alive=true;this.reason='';this.queue.length=0;this.events.length=0;this.occupied.clear();this.clearEffects();for(let i=0;i<=this.length;i++){const j=mod(-i,CAPACITY);this.bx[j]=-i;this.by[j]=0;if(i<this.length)this.occupied.add(key(-i,0));}for(let i=0;i<this.items.length;i++){const item=this.items[i];item.active=false;item.kind=i===3?'magnet':'food';item.cool=i<3?0:i===3?720:Infinity;item.reward=1;item.px=item.py=0;}this.world.stream(0,0);this.place(this.items[0]);this.interpolate(1);}
    scoreNow(){return Math.floor(this.points+this.steps/SCORING.distancePerPoint+this.time/SCORING.survivalPerPoint);}
    get time(){return this.ticks/60;}
    get speed(){const base=DIFFICULTY.speedStart+(DIFFICULTY.speedCap-DIFFICULTY.speedStart)*this.difficulty;return base*(this.timeEffect>0?.72:1)*(this.slime>0?.78:1);}
    request(direction){if(!Number.isInteger(direction)||direction<0||direction>3||this.queue.length>=2)return false;if(this.drunk>0){if(direction===1)direction=3;else if(direction===3)direction=1;}const last=this.queue.length?this.queue[this.queue.length-1].direction:this.direction;if(direction===last||direction===(last+2)%4)return false;this.queue.push({direction,ready:this.ticks});return true;}
    free(x,y,item=null){return !this.world.blocked(x,y)&&!this.occupied.has(key(x,y))&&!this.items.some(o=>o!==item&&o.active&&o.x===x&&o.y===y);}
    place(item,avoid=null){
      // Bounded cardinal BFS: pickups spawn only on an actually reachable local route.
      const radius=24,size=49;this.seen.fill(0);let read=0,write=1,candidates=0,chosenX=0,chosenY=0;this.searchX[0]=this.x;this.searchY[0]=this.y;this.seen[radius*size+radius]=1;
      const special=item.kind!=='food',min=special?7:2,max=special?13:5;
      while(read<write){const x=this.searchX[read],y=this.searchY[read++],distance=Math.abs(x-this.x)+Math.abs(y-this.y),dx=x-this.x,dy=y-this.y,directAhead=special&&((this.direction===0&&dx===0&&dy<0&&dy>=-5)||(this.direction===1&&dy===0&&dx>0&&dx<=5)||(this.direction===2&&dx===0&&dy>0&&dy<=5)||(this.direction===3&&dy===0&&dx<0&&dx>=-5)),avoided=avoid&&avoid.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<6);let exits=0;if(special)for(let d=0;d<4;d++)if(!this.world.blocked(x+DX[d],y+DY[d])&&!this.occupied.has(key(x+DX[d],y+DY[d])))exits++;if(distance>=min&&distance<=max&&!directAhead&&!avoided&&(!special||exits>=2)&&this.free(x,y,item)){candidates++;if(this.random()<1/candidates){chosenX=x;chosenY=y;}}for(let d=0;d<4;d++){const nx=x+DX[d],ny=y+DY[d],lx=nx-this.x+radius,ly=ny-this.y+radius;if(lx<0||ly<0||lx>=size||ly>=size)continue;const j=ly*size+lx;if(this.seen[j]||this.world.blocked(nx,ny)||this.occupied.has(key(nx,ny)))continue;this.seen[j]=1;this.searchX[write]=nx;this.searchY[write++]=ny;}}
      if(!candidates){item.active=false;item.cool=60;return false;}item.x=item.px=chosenX;item.y=item.py=chosenY;item.active=true;return true;
    }
    effectValue(kind){return this[kind==='time'?'timeEffect':kind]||0;}
    activeEffectCount(bad){let count=0;for(const kind of SPECIAL_KINDS)if(EFFECTS[kind].bad===bad&&this.effectValue(kind)>0)count++;return count;}
    canActivate(kind){const effect=EFFECTS[kind];if(!effect)return false;if(this.effectValue(kind)>0)return true;return this.activeEffectCount(effect.bad)<(effect.bad?MAX_NEGATIVE_ACTIVE:MAX_POSITIVE_ACTIVE);}
    canSpawn(kind){const effect=EFFECTS[kind];return Boolean(effect)&&this.activeEffectCount(effect.bad)<(effect.bad?MAX_NEGATIVE_ACTIVE:MAX_POSITIVE_ACTIVE);}
    chooseSpecialKind(){const weights=BIOMES[this.world.biomeIndex(this.x,this.y)].spawn;let total=0;for(const kind of SPECIAL_KINDS)if(this.canSpawn(kind))total+=weights[kind]*(EFFECTS[kind].bad?.35+this.difficulty*1.1:1-this.difficulty*.25);let roll=this.random()*total;for(const kind of SPECIAL_KINDS)if(this.canSpawn(kind)){roll-=weights[kind]*(EFFECTS[kind].bad?.35+this.difficulty*1.1:1-this.difficulty*.25);if(roll<0)return kind;}return '';}
    clearEffects(){for(const kind of SPECIAL_KINDS)this[kind==='time'?'timeEffect':kind]=0;this.ghostGrace=0;this.ghostWarned=false;this.portals=null;this.portalLock=0;this.portalFlash=0;this.portalFromX=this.portalFromY=this.portalToX=this.portalToY=0;this.magnetPull=0;this.magnetPullX=this.magnetPullY=0;this.hiccupNext=0;this.hiccupWarned=false;this.hiccupPulse=0;this.hiccupVariant=0;}
    activate(kind,force=false){const effect=EFFECTS[kind];if(!effect||(!force&&!this.canActivate(kind)))return false;const field=kind==='time'?'timeEffect':kind,wasActive=this[field]>0;this[field]=effect.duration;if(kind==='ghost'){this.ghostGrace=0;this.ghostWarned=false;}if(kind==='fairy'&&(!wasActive||!this.portals))this.createPortals();if(kind==='hiccup'){this.hiccupNext=this.ticks+90;this.hiccupWarned=false;this.hiccupPulse=0;}this.events.push(kind);return true;}
    createPortals(){const a={kind:'fairy',active:false,cool:0,x:0,y:0,px:0,py:0},b={kind:'fairy',active:false,cool:0,x:0,y:0,px:0,py:0};if(!this.place(a)||!this.place(b,[a])){this.portals=null;return false;}this.portals=[{x:a.x,y:a.y},{x:b.x,y:b.y}];return true;}
    die(reason){this.alive=false;this.reason=reason;this.phase=1;this.events.push('death');}
    get comboMultiplier(){return Math.min(SCORING.multiplierCap,1+Math.max(0,this.combo-1)*SCORING.multiplierStep);}
    get comboWindow(){return Math.round(60*(SCORING.windowStart+(SCORING.windowEnd-SCORING.windowStart)*this.difficulty));}
    collect(item){item.active=false;if(item.kind==='food'){this.foodCount++;if(this.length+this.growth<CAPACITY-2)this.growth++;const previousCombo=this.combo;this.combo=this.ticks<=this.comboUntil?Math.min(SCORING.comboCap,this.combo+1):1;this.maxCombo=Math.max(this.maxCombo,this.combo);this.comboUntil=this.ticks+this.comboWindow;const grove=this.worldEvent?.kind==='grove'&&this.world.groveAt(this.x,this.y)?EVENTS.groveReward:1;this.points+=Math.round(SCORING.food*this.comboMultiplier*(1+this.difficulty*SCORING.difficultyReward)*(this.golden>0?2:1)*(item.reward||1)*grove);item.cool=item.eventFood?Infinity:12;if(this.combo>previousCombo&&SCORING.milestones.includes(this.combo))this.comboFlash=90;this.events.push(this.combo>1?'combo':'pickup');}else{const kind=item.kind;if(this.activate(kind)){this.bonuses++;item.cool=Math.round(EFFECTS[kind].cooldown*(EFFECTS[kind].bad?1:1+this.difficulty*.25));}else item.cool=60;}}
    startWorldEvent(kind){
      if(this.worldEvent)return false;
      if(kind==='grove'&&!this.world.groveAt(this.x,this.y))return false;
      if(!['grove','bloom','trail'].includes(kind))return false;
      this.worldEvent={kind,until:this.ticks+EVENTS.duration};this.eventSerial++;
      if(kind!=='grove'){
        let previous=null,direction=this.direction;
        for(let i=4;i<this.items.length;i++){
          const f=this.items[i];f.reward=kind==='bloom'?EVENTS.bloomReward:EVENTS.trailReward;f.cool=Infinity;
          if(kind==='bloom'||!previous){if(!this.place(f))break;}
          else{let found=false;for(const turn of [0,1,3]){const d=(direction+turn)%4,x=previous.x+DX[d],y=previous.y+DY[d];if(this.free(x,y,f)){f.x=f.px=x;f.y=f.py=y;f.active=true;direction=d;found=true;break;}}if(!found)break;}
          previous=f;
        }
      }
      return true;
    }
    updateWorldEvent(){
      if(this.worldEvent&&this.ticks>=this.worldEvent.until){this.worldEvent=null;for(let i=4;i<this.items.length;i++)this.items[i].active=false;this.nextEvent=this.ticks+EVENTS.cooldown+Math.floor(this.random()*EVENTS.jitter);}
      if(!this.worldEvent&&this.ticks>=this.nextEvent){const grove=this.world.groveAt(this.x,this.y);if(this.eventSerial%3===1&&!grove&&this.ticks<this.nextEvent+EVENTS.groveWait)return;this.startWorldEvent(grove?'grove':this.eventSerial%3===2?'trail':'bloom');}
    }
    move(){
      this.previousDirection=this.direction;if(this.queue.length&&this.queue[0].ready<=this.ticks)this.direction=this.queue.shift().direction;
      let nx=this.x+DX[this.direction],ny=this.y+DY[this.direction];if(this.fairy>0&&this.portals&&this.ticks>=this.portalLock){const a=this.portals[0],b=this.portals[1],target=nx===a.x&&ny===a.y?b:nx===b.x&&ny===b.y?a:null;if(target&&!this.world.blocked(target.x,target.y)&&!this.occupied.has(key(target.x,target.y))){this.portalFromX=nx;this.portalFromY=ny;this.portalToX=target.x;this.portalToY=target.y;nx=target.x;ny=target.y;this.portalLock=this.ticks+12;this.portalFlash=30;this.events.push('fairy');}}const nextKey=key(nx,ny),tail=mod(this.head-this.length+1,CAPACITY);
      // Vacating tail is legal only when this move does not collect food/grow.
      const grows=this.length<CAPACITY-2&&(this.growth>0||this.items.some(f=>f.active&&f.kind==='food'&&f.x===nx&&f.y===ny));
      if(this.world.blocked(nx,ny)&&this.ghost<=0&&!this.ghostGrace){this.die('Лесное препятствие');return;}
      if(this.occupied.has(nextKey)&&(grows||nx!==this.bx[tail]||ny!==this.by[tail])){this.die('Собственный хвост');return;}
      if(!grows)this.occupied.delete(key(this.bx[tail],this.by[tail]));this.head=(this.head+1)%CAPACITY;this.x=nx;this.y=ny;this.bx[this.head]=nx;this.by[this.head]=ny;this.occupied.add(nextKey);this.steps++;this.lastPeriod=this.ticks-this.moveTicks;this.moveTicks=this.ticks;
      for(const item of this.items)if(item.active&&item.x===nx&&item.y===ny)this.collect(item);if(this.ghost<=0&&this.ghostGrace&&!this.world.blocked(nx,ny))this.ghostGrace=0;
      if(grows){this.length++;this.growth=Math.max(0,this.growth-1);}
      if(this.steps%8===0)this.world.stream(nx,ny);
    }
    tick(){if(!this.alive)return;this.ticks++;const target=difficulty(this.scoreNow(),this.length,this.steps,this.time);this.difficulty+=Math.max(-DIFFICULTY.slewPerTick,Math.min(DIFFICULTY.slewPerTick,target-this.difficulty));if(this.comboFlash>0)this.comboFlash--;if(this.ticks%60===0)this.updateWorldEvent();for(const kind of SPECIAL_KINDS){const field=kind==='time'?'timeEffect':kind;if(this[field]>0){this[field]--;if(kind==='ghost'&&this[field]===60&&!this.ghostWarned){this.ghostWarned=true;this.events.push('ghost-warning');}if(kind==='ghost'&&this[field]===0&&this.world.blocked(this.x,this.y))this.ghostGrace=1;if(kind==='fairy'&&this[field]===0)this.portals=null;}}if(this.portalFlash>0)this.portalFlash--;if(this.magnetPull>0)this.magnetPull--;if(this.hiccupPulse>0)this.hiccupPulse--;if(this.hiccup>0&&this.hiccupNext){if(!this.hiccupWarned&&this.ticks>=this.hiccupNext-18){this.hiccupWarned=true;this.hiccupPulse=18;this.events.push('hiccup-warning');}if(this.ticks>=this.hiccupNext){this.hiccupVariant=this.hiccupVariant%3+1;this.events.push('hiccup-'+this.hiccupVariant);this.hiccupNext=this.ticks+120;this.hiccupWarned=false;this.hiccupPulse=22;this.move();if(!this.alive)return;}}if(this.ticks>this.comboUntil)this.combo=0;
      const foods=this.difficulty<.3?1:this.difficulty<.6?2:3;
      for(let i=0;i<this.items.length;i++){const f=this.items[i];if(i<3&&i>=foods||i>=4&&!f.active)continue;if(f.cool>0)f.cool--;if(!f.active&&f.cool===0){if(i===3){const kind=this.chooseSpecialKind();if(kind){f.kind=kind;this.place(f);}else f.cool=30;}else this.place(f);}else if(i<4&&f.active&&this.ticks%60===0&&Math.abs(f.x-this.x)+Math.abs(f.y-this.y)>18)this.place(f);
        if(f.active&&f.kind==='food'&&this.magnet>0&&this.ticks%8===0&&Math.abs(f.x-this.x)+Math.abs(f.y-this.y)<=6){if(f.x===this.x&&f.y===this.y)this.collect(f);else{this.magnetPull=8;this.magnetPullX=f.x;this.magnetPullY=f.y;const dx=Math.sign(this.x-f.x),dy=Math.sign(this.y-f.y);let nx=f.x,ny=f.y;if(dx&&(!dy||this.ticks%16===0))nx+=dx;else ny+=dy;if(nx===this.x&&ny===this.y)this.collect(f);else if(this.free(nx,ny,f)){f.x=nx;f.y=ny;}}}if(f.active){f.px+=(f.x-f.px)*.22;f.py+=(f.y-f.py)*.22;}}
      this.phase+=this.speed/60;if(this.phase>=1){this.phase-=1;this.move();}
    }
    interpolate(alpha=this.phase){const a=Math.max(0,Math.min(1,alpha));for(let i=0;i<this.length;i++){const current=mod(this.head-i,CAPACITY),previous=mod(current-1,CAPACITY);this.rx[i]=this.bx[previous]+(this.bx[current]-this.bx[previous])*a;this.ry[i]=this.by[previous]+(this.by[current]-this.by[previous])*a;}}
    digest(){return [this.x,this.y,this.direction,this.steps,this.length,this.scoreNow(),this.alive,this.world.chunks.size].join('|');}
  }
  return {Engine,World,DX,DY,CHUNK,CAPACITY,BIOMES,EFFECTS,SPECIAL_KINDS,MAX_POSITIVE_ACTIVE,MAX_NEGATIVE_ACTIVE,hash,key,mod};
});
