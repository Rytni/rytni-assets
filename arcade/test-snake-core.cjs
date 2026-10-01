const assert=require('node:assert/strict');
const {Engine,World,BIOMES,EFFECTS,SPECIAL_KINDS,MAX_POSITIVE_ACTIVE,MAX_NEGATIVE_ACTIVE,mod,CAPACITY}=require('./snake-core.js');
const quiet=e=>{e.items.forEach(i=>{i.active=false;i.cool=1e9;});return e;};
const step=e=>{const s=e.steps;while(e.alive&&e.steps===s)e.tick();};
const e=quiet(new Engine(42));
assert.equal(e.request(3),false);assert.equal(e.request(0),true);assert.equal(e.request(2),false);assert.equal(e.request(3),true);assert.equal(e.request(2),false);
step(e);assert.deepEqual([e.x,e.y],[0,-1]);step(e);assert.deepEqual([e.x,e.y],[-1,-1]);
for(let a=0;a<=1;a+=.1){e.interpolate(a);assert.equal(e.ry[0],-1);}
const f=quiet(new Engine(7));Object.assign(f.items[0],{active:true,cool:0,x:1,y:0});step(f);assert.equal(f.length,9);assert.equal(f.occupied.size,9);assert.equal(f.points,100);
Object.assign(f.items[0],{active:true,cool:0,x:2,y:0});step(f);assert.equal(f.combo,2);assert.equal(f.points,220);assert.equal(f.occupied.size,f.length);
const magnet=quiet(new Engine(8));magnet.magnet=420;Object.assign(magnet.items[0],{active:true,cool:0,x:0,y:1});for(let i=0;i<8;i++)magnet.tick();step(magnet);assert.equal(magnet.foodCount,1);assert.equal(magnet.length,9);assert.equal(magnet.occupied.size,9);
const drunk=quiet(new Engine(9));drunk.direction=0;drunk.drunk=240;assert.equal(drunk.request(1),true);assert.equal(drunk.queue[0].direction,3);assert.equal(drunk.queue[0].ready,0);step(drunk);assert.equal(drunk.direction,3);
const golden=quiet(new Engine(10));golden.golden=600;Object.assign(golden.items[0],{active:true,cool:0,x:1,y:0,px:1,py:0});step(golden);assert.equal(golden.points,200);
const slow=quiet(new Engine(11));const baseSpeed=slow.speed;slow.activate('time');assert(slow.speed<baseSpeed*.75);slow.timeEffect=0;slow.activate('slime');assert(slow.speed<baseSpeed*.8);
assert.equal(baseSpeed,5.5);slow.slime=0;slow.difficulty=.5;assert(slow.speed>7&&slow.speed<8);slow.difficulty=1;assert.equal(slow.speed,12);
const persistent=quiet(new Engine(14,{forestSlice:true}));persistent.world.blocked=()=>false;persistent.qaMainFood(-50,50);for(let i=0;i<12;i++)persistent.tick();assert(persistent.items[0].active,'missed food respawns after a bounded interval');assert.notDeepEqual([persistent.items[0].x,persistent.items[0].y],[-50,50]);assert(persistent.items[0].x>persistent.x,'replacement is ahead');assert(persistent.items.slice(1,3).every(f=>!f.active),'reserved slots never burst');
const ghost=quiet(new Engine(23));let ghostHit;for(let x=26;x<200&&!ghostHit;x+=4)for(let y=26;y<200&&!ghostHit;y+=4)if(ghost.world.blocked(x,y))ghostHit={x,y};assert(ghostHit);ghost.x=ghostHit.x-1;ghost.y=ghostHit.y;ghost.direction=1;ghost.activate('ghost');ghost.ghost=1;ghost.move();assert.equal(ghost.alive,true);ghost.tick();assert.equal(ghost.ghostGrace,1);
const fairy=quiet(new Engine(12,{forestSlice:true}));fairy.activate('fairy');assert.equal(fairy.portals.length,2);assert(Math.abs(fairy.portals[0].x-fairy.portals[1].x)+Math.abs(fairy.portals[0].y-fairy.portals[1].y)>=6);for(const p of fairy.portals)assert.equal(fairy.world.blocked(p.x,p.y),false);
for(let round=0;round<5;round++){
 const portal=quiet(new Engine(1,{forestSlice:true}));portal.items.forEach(i=>{i.active=false;i.cool=Infinity});portal.fairy=600;portal.portals=[{x:2,y:0},{x:6,y:0}];
 const move=d=>{portal.ticks+=8;portal.direction=d;portal.move();assert(portal.alive);};
 move(1);move(1);assert.deepEqual([portal.x,portal.y,portal.portalState],[6,0,'exit-grace']);portal.interpolate(.1);assert.equal(portal.rx[0],6,'teleport must not interpolate the camera across distant cells');
 for(let x=7;x<=10;x++)move(1);move(2);for(let x=9;x>=6;x--)move(3);move(0);
 assert.deepEqual([portal.x,portal.y,portal.portalState],[2,0,'exit-grace'],'reverse portal traversal must work after fully leaving the exit');
}
const hiccup=quiet(new Engine(13,{forestSlice:true})),normal=quiet(new Engine(13,{forestSlice:true}));hiccup.world.blocked=normal.world.blocked=()=>false;hiccup.activate('hiccup');for(let i=0;i<90;i++){hiccup.tick();normal.tick();}assert(hiccup.events.includes('hiccup-warning'));assert(hiccup.events.includes('hiccup-1'));assert(hiccup.steps>normal.steps);
assert.deepEqual(SPECIAL_KINDS,Object.keys(EFFECTS));for(const name of SPECIAL_KINDS){const active=quiet(new Engine(100+SPECIAL_KINDS.indexOf(name),{forestSlice:true}));assert.equal(active.activate(name),true);assert.equal(active[name==='time'?'timeEffect':name],EFFECTS[name].duration);active.clearEffects();assert.equal(active[name==='time'?'timeEffect':name],0);}
const stack=quiet(new Engine(81,{forestSlice:true}));assert.equal(MAX_POSITIVE_ACTIVE,2);assert.equal(MAX_NEGATIVE_ACTIVE,1);assert.equal(stack.activate('magnet'),true);assert.equal(stack.activate('golden'),true);assert.equal(stack.activate('drunk'),true);assert.equal(stack.activate('fairy'),false);assert.equal(stack.activate('hiccup'),false);assert.equal(stack.activeEffectCount(false),2);assert.equal(stack.activeEffectCount(true),1);stack.magnet=7;assert.equal(stack.activate('magnet'),true);assert.equal(stack.magnet,EFFECTS.magnet.duration);assert.equal(stack.canSpawn('magnet'),false);assert.equal(stack.canSpawn('slime'),false);assert.equal(stack.chooseSpecialKind(),'');assert.equal(stack.activate('fairy',true),true);assert.equal(stack.activeEffectCount(false),3);stack.fairy=1;stack.tick();assert.equal(stack.fairy,0);assert.equal(stack.portals,null);
const self=quiet(new Engine(1));self.request(0);step(self);self.request(3);step(self);self.request(2);step(self);assert.equal(self.alive,false);assert.equal(self.reason,'Собственный хвост');
const world=new World(23);let obstacles=0;for(let y=-200;y<200;y++)for(let x=-200;x<200;x++){if(world.blocked(x,y))obstacles++;}assert(obstacles>0);
assert.equal(BIOMES.length,3);assert.equal(world.biomeAt(0,0).biome.id,'forest');assert.equal(world.biomeAt(210,0).biome.id,'cave');assert.equal(world.biomeAt(420,0).biome.id,'swamp');assert(world.biomeAt(150,0).mix>0&&world.biomeAt(150,0).mix<1);
const collision=quiet(new Engine(23));let hit;for(let x=26;x<200&&!hit;x+=4)for(let y=26;y<200&&!hit;y+=4)if(collision.world.blocked(x,y))hit={x,y};assert(hit);collision.x=hit.x-1;collision.y=hit.y;collision.move();assert.equal(collision.alive,false);assert.equal(collision.reason,'Лесное препятствие');assert.deepEqual([collision.x,collision.y],[hit.x-1,hit.y]);
// Streaming remains bounded while travelling through many regenerated regions.
for(let x=-5000;x<=5000;x+=17){world.stream(x,0);assert.equal(world.chunks.size,25);}assert(world.generated>1000);
function replay(fps){const r=quiet(new Engine(19));let acc=0;for(let frame=0;frame<fps*20;frame++){acc+=60/fps;while(acc>=1-1e-9){if(r.ticks===120)r.request(0);if(r.ticks===240)r.request(3);if(r.ticks===360)r.request(2);r.tick();acc-=1;}r.interpolate();}return r.digest();}
assert.equal(replay(30),replay(60));assert.equal(replay(60),replay(144));
const stress=[];for(const length of [100,250,500,1200]){const s=quiet(new Engine(55));s.reset(55,length);quiet(s);s.world.blocked=()=>false; // isolate ring-buffer stress from terrain navigation
const times=[];for(let i=0;i<600;i++){const start=performance.now();s.tick();s.interpolate();times.push(performance.now()-start);}assert(s.alive);assert.equal(s.occupied.size,length);assert.equal(s.world.chunks.size,25);times.sort((a,b)=>a-b);stress.push({length,p95Ms:times[570]});}
console.log(JSON.stringify({cardinal:true,reversal:true,interpolation:true,growth:true,magnet:true,golden:true,ghost:true,fairy:true,time:true,drunk:true,hiccup:true,slime:true,selfCollision:true,connectedWorld:true,biomes:true,fpsDeterminism:true,stress},null,2));
