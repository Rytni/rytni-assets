const assert=require('node:assert/strict');
const {Engine,World,BIOMES,mod,CAPACITY}=require('./snake-core.js');
const quiet=e=>{e.items.forEach(i=>{i.active=false;i.cool=1e9;});return e;};
const step=e=>{const s=e.steps;while(e.alive&&e.steps===s)e.tick();};
const e=quiet(new Engine(42));
assert.equal(e.request(3),false);assert.equal(e.request(0),true);assert.equal(e.request(2),false);assert.equal(e.request(3),true);assert.equal(e.request(2),false);
step(e);assert.deepEqual([e.x,e.y],[0,-1]);step(e);assert.deepEqual([e.x,e.y],[-1,-1]);
for(let a=0;a<=1;a+=.1){e.interpolate(a);assert.equal(e.ry[0],-1);}
const f=quiet(new Engine(7));Object.assign(f.items[0],{active:true,cool:0,x:1,y:0});step(f);assert.equal(f.length,9);assert.equal(f.occupied.size,9);assert.equal(f.points,100);
Object.assign(f.items[0],{active:true,cool:0,x:2,y:0});step(f);assert.equal(f.combo,2);assert.equal(f.points,220);assert.equal(f.occupied.size,f.length);
const magnet=quiet(new Engine(8));magnet.magnet=420;Object.assign(magnet.items[0],{active:true,cool:0,x:0,y:1});for(let i=0;i<8;i++)magnet.tick();step(magnet);assert.equal(magnet.foodCount,1);assert.equal(magnet.length,9);assert.equal(magnet.occupied.size,9);
const drunk=quiet(new Engine(9));drunk.drunk=240;drunk.request(0);assert.equal(drunk.queue[0].ready,6);for(let i=0;i<6;i++)drunk.tick();step(drunk);assert.equal(drunk.direction,0);
const self=quiet(new Engine(1));self.request(0);step(self);self.request(3);step(self);self.request(2);step(self);assert.equal(self.alive,false);assert.equal(self.reason,'Собственный хвост');
const world=new World(23);let obstacles=0;for(let y=-200;y<200;y++)for(let x=-200;x<200;x++){if(world.blocked(x,y))obstacles++;if(mod(x,4)<2||mod(y,4)<2)assert.equal(world.blocked(x,y),false);}assert(obstacles>0);
assert.equal(BIOMES.length,10);assert.equal(world.biomeAt(0,0).biome.id,'forest');assert.equal(world.biomeAt(160,0).biome.id,'cave');assert.equal(world.biomeAt(640,0).biome.id,'winter');assert(world.biomeAt(150,0).mix>0&&world.biomeAt(150,0).mix<1);
const collision=quiet(new Engine(23));let hit;for(let x=26;x<200&&!hit;x+=4)for(let y=26;y<200&&!hit;y+=4)if(collision.world.blocked(x,y))hit={x,y};assert(hit);collision.x=hit.x-1;collision.y=hit.y;collision.move();assert.equal(collision.alive,false);assert.equal(collision.reason,'Лесное препятствие');assert.deepEqual([collision.x,collision.y],[hit.x-1,hit.y]);
// Each unblocked 2x2 island cell directly touches a permanent connected street.
for(let x=-5000;x<=5000;x+=17){world.stream(x,0);assert.equal(world.chunks.size,25);}assert(world.generated>1000);
function replay(fps){const r=quiet(new Engine(19));let acc=0;for(let frame=0;frame<fps*20;frame++){acc+=60/fps;while(acc>=1-1e-9){if(r.ticks===120)r.request(0);if(r.ticks===240)r.request(3);if(r.ticks===360)r.request(2);r.tick();acc-=1;}r.interpolate();}return r.digest();}
assert.equal(replay(30),replay(60));assert.equal(replay(60),replay(144));
const stress=[];for(const length of [100,250,500,1200]){const s=quiet(new Engine(55));s.reset(55,length);quiet(s);const times=[];for(let i=0;i<600;i++){const start=performance.now();s.tick();s.interpolate();times.push(performance.now()-start);}assert(s.alive);assert.equal(s.occupied.size,length);assert.equal(s.world.chunks.size,25);times.sort((a,b)=>a-b);stress.push({length,p95Ms:times[570]});}
console.log(JSON.stringify({cardinal:true,reversal:true,interpolation:true,growth:true,magnet:true,drunk:true,selfCollision:true,connectedWorld:true,biomes:true,fpsDeterminism:true,stress},null,2));
