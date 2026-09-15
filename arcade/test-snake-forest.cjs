const assert=require('node:assert/strict');
const {Engine,World,CAPACITY,hash}=require('./snake-core.js');
const {select,placement}=require('./snake-segments.js');
const world=new World(127,true),repeat=new World(127,true);
let obstacleCount=0;
for(let y=-90;y<90;y++)for(let x=-90;x<90;x++){
 const blocked=world.blocked(x,y);assert.equal(blocked,repeat.blocked(x,y));
 if(!blocked)continue;obstacleCount++;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(dx||dy)assert.equal(world.blocked(x+dx,y+dy),false,'two-cell forest clearance');
}
assert(obstacleCount>300&&obstacleCount<1800);
const obstacleTypes=new Map();
for(let y=20;y<60;y++)for(let x=20;x<60;x++)if(world.blocked(x,y))obstacleTypes.set(hash(x,y,127)%5,{x,y});
assert.equal(obstacleTypes.size,5,'every forest obstacle family must be reachable');
for(const {x,y} of obstacleTypes.values())for(const [direction,dx,dy]of [[0,0,-1],[1,1,0],[2,0,1],[3,-1,0]]){
 const hit=new Engine(127,{forestSlice:true});hit.x=x-dx;hit.y=y-dy;hit.direction=direction;
 hit.move();assert.equal(hit.alive,false,'entering an occupied forest cell must collide');
 assert.equal(hit.x,x-dx);assert.equal(hit.y,y-dy,'collision must not advance into the obstacle');
}
for(let x=-500;x<500;x+=31){world.stream(x,17);assert.equal(world.chunks.size,25);}
const e=new Engine(127,{forestSlice:true});
for(let i=0;i<22000;i++){
 // Keep the test in the safe spawn corridor while exercising timed item spawning.
 if(e.x>=5){e.reset(127);e.ticks=i;}
 e.tick();assert.equal(e.items.filter(x=>x.active&&x.kind!=='food').length,0);
 assert(e.items.filter(x=>x.active).length<=1);
}
const vectors=[[0,-1],[1,0],[0,1],[-1,0]];
const topology=new Engine(1);topology.length=3;topology.head=0;
for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(a!==b){
 topology.bx[CAPACITY-1]=0;topology.by[CAPACITY-1]=0;
 topology.bx[0]=vectors[a][0];topology.by[0]=vectors[a][1];
 topology.bx[CAPACITY-2]=vectors[b][0];topology.by[CAPACITY-2]=vectors[b][1];
 const result=select(topology,1);assert.equal(result.kind,(a+2)%4===b?'body':'corner');
 assert(result.cell>=4&&result.cell<12);assert.equal(select(topology,2).direction,b);
}
for(let a=0;a<4;a++){topology.direction=a;assert.equal(select(topology,0).cell,a);}
// Regression: translating an elbow with its interpolated segment opens a gap
// between it and the perpendicular straight sprite at half a movement step.
assert.equal(typeof placement,'function','renderer must anchor interior elbows to the path');
topology.bx[0]=1;topology.by[0]=0;
topology.bx[CAPACITY-1]=0;topology.by[CAPACITY-1]=0;
topology.bx[CAPACITY-2]=0;topology.by[CAPACITY-2]=1;
topology.bx[CAPACITY-3]=0;topology.by[CAPACITY-3]=2;
for(const alpha of [0,.25,.5,.75,1]){
 topology.interpolate(alpha);
 assert.deepEqual(placement(topology,1),{x:0,y:0},'corner cannot drift off its cardinal junction');
 assert.deepEqual(placement(topology,0),{x:alpha,y:0},'head retains smooth interpolation');
 assert.deepEqual(placement(topology,2),{x:0,y:2-alpha},'tail retains smooth interpolation');
}
function replay(fps){const s=new Engine(44,{forestSlice:true});let acc=0;for(let f=0;f<fps*12;f++){acc+=60/fps;while(acc>=1-1e-9){if(s.ticks===12)s.request(0);if(s.ticks===24)s.request(3);s.tick();acc-=1;}s.interpolate();}return s.digest();}
assert.equal(replay(30),replay(60));assert.equal(replay(60),replay(144));
console.log(JSON.stringify({forestDeterminism:true,obstacleCount,obstacleFamilies:obstacleTypes.size,collisionDirections:4,clearance:true,boundedChunks:true,foodOnly:true,allCardinalSprites:true,fpsDeterminism:true}));
