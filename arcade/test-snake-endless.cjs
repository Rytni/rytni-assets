const assert=require('node:assert/strict');
const {Engine,World,DX,DY,BIOMES,key}=require('./snake-core.js');
const {difficulty,DIFFICULTY,SCORING,EVENTS}=require('./snake-rules.js');
// Black-box connectivity: every free cell in these independent regions belongs
// to one component, including both sides of chunk and biome boundaries.
let regions=0,blocked=0;
for(const seed of [1,41,917])for(const offset of [0,160,350,4000,-5000]){
 const w=new World(seed),size=96,cells=new Uint8Array(size*size),queue=new Int32Array(size*size);let free=0;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const hit=w.blocked(offset+x,offset+y);cells[y*size+x]=hit?1:0;if(hit)blocked++;else free++;}
 // The perimeter is an external open route; isolated cropped island corners are
 // still connected through it. Seed every free border cell before flood fill.
 let read=0,write=0;for(let y=0;y<size;y++)for(let x=0;x<size;x++)if((!x||!y||x===size-1||y===size-1)&&!cells[y*size+x]){cells[y*size+x]=2;queue[write++]=y*size+x;}
 while(read<write){const p=queue[read++],x=p%size,y=Math.floor(p/size);for(let d=0;d<4;d++){const nx=x+DX[d],ny=y+DY[d],j=ny*size+nx;if(nx>=0&&ny>=0&&nx<size&&ny<size&&!cells[j]){cells[j]=2;queue[write++]=j;}}}
 assert.equal(write,free,'no isolated free-space pockets');const saved=[...w.chunk(Math.floor(offset/16),0).cells];for(let x=100;x<500;x+=16)w.stream(x,100);assert.deepEqual([...w.chunk(Math.floor(offset/16),0).cells],saved);regions++;
}
assert.equal(BIOMES.length,3);for(const [x,id]of [[0,'forest'],[210,'cave'],[420,'swamp']])assert.equal(new World(1).biomeAt(x,0).biome.id,id);
const d=[difficulty(0,8,0,0),difficulty(5000,80,1000,120),difficulty(50000,250,5000,600),difficulty(1e7,1200,40000,3600)];for(let i=1;i<d.length;i++)assert(d[i]>d[i-1]&&d[i]<1);
const score=new Engine(1);for(let i=0;i<25;i++)score.collect(score.items[0]);assert.equal(score.combo,20);assert(score.comboMultiplier<=SCORING.multiplierCap);assert(score.comboFlash>0);score.ticks=score.comboUntil+1;score.collect(score.items[0]);assert.equal(score.combo,1);score.golden=1;const before=score.points;score.combo=0;score.collect(score.items[0]);assert.equal(score.points-before,200);
for(const name of ['bloom','trail','grove']){const e=new Engine(71);if(name==='grove'){let found=false;for(let x=80;x<1000&&!found;x++)for(let y=0;y<64;y++)if(e.world.groveAt(x,y)&&!e.world.blocked(x,y)){e.x=x;e.y=y;found=true;break;}assert(found);}assert(e.startWorldEvent(name));assert(!e.startWorldEvent('bloom'));const active=e.items.slice(4).filter(f=>f.active);if(name!=='grove')assert(active.length>=3);for(const f of active){assert(!e.world.blocked(f.x,f.y)&&!e.occupied.has(key(f.x,f.y)));assert(f.reward>1);}if(name==='trail')for(let i=1;i<active.length;i++)assert.equal(Math.abs(active[i].x-active[i-1].x)+Math.abs(active[i].y-active[i-1].y),1);e.ticks=e.worldEvent.until;e.updateWorldEvent();assert(!e.worldEvent);assert(e.items.slice(4).every(f=>!f.active));}
// Deterministic navigation harness: BFS plans short forward routes through REAL
// terrain and the real occupied body (no ghost/no collision overrides).
function route(e){const radius=20,size=41,queue=[{x:e.x,y:e.y,first:-1}],seen=new Set([key(e.x,e.y)]);let best=null;
 for(let i=0;i<queue.length;i++){const p=queue[i];if(p.x>=e.x+12)return p.first;if(p.x>e.x&&(!best||p.x>best.x))best=p;for(const d of [1,0,2,3]){if(i===0&&d===(e.direction+2)%4)continue;const x=p.x+DX[d],y=p.y+DY[d],k=key(x,y);if(Math.abs(x-e.x)>radius||Math.abs(y-e.y)>radius||seen.has(k)||e.world.blocked(x,y)||e.occupied.has(k)||e.items.some(f=>f.active&&f.kind!=='food'&&f.x===x&&f.y===y))continue;seen.add(k);queue.push({x,y,first:i===0?d:p.first});}}
 return best?.first;
}
const capped=new Engine(1);for(let i=0;i<20;i++)capped.collect(capped.items[0]);capped.comboFlash=0;capped.collect(capped.items[0]);assert.equal(capped.comboFlash,0,'milestone does not flash on every capped pickup');
const runs=[];
for(const length of [8,28,100,250,500,1200]){
 const e=new Engine(47);e.reset(47,length);let changes=0,biomes=new Set(),lastStep=-1,lastSpeed=e.speed,maxChunks=0;
 const ticks=length===8?216000:18000;
 for(let t=0;t<ticks;t++){
  if(e.steps!==lastStep){lastStep=e.steps;const dir=route(e);assert.notEqual(dir,undefined,'forward route exists for length '+length);if(dir!==e.direction)e.request(dir);changes++;}
  e.tick();assert(e.alive,'navigation survives '+length+' '+e.reason);assert(Math.abs(e.speed-lastSpeed)<.001||e.slime||e.timeEffect,'smooth base speed');lastSpeed=e.speed;
  if(t%60===0){for(const f of e.items)if(f.active){assert(!e.world.blocked(f.x,f.y),'pickup obstacle');assert(!e.occupied.has(key(f.x,f.y)),'pickup body');}biomes.add(e.world.biomeAt(e.x,e.y).biome.id);maxChunks=Math.max(maxChunks,e.world.chunks.size);assert(maxChunks<=25);e.events.length=0;}
 }
 assert.equal(e.occupied.size,e.length);assert(e.speed<=DIFFICULTY.speedCap);runs.push({length,ticks,steps:e.steps,biomes:[...biomes],difficulty:e.difficulty,score:e.scoreNow(),chunks:maxChunks,generated:e.world.generated});
}
console.log(JSON.stringify({regions,blocked,difficultyStages:d,scoring:true,events:true,spawnSafety:true,runs},null,2));
