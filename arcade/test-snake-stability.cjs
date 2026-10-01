const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Core=require('./snake-core.js'),Segments=require('./snake-segments.js');
const {Engine,DX,DY,mod,CAPACITY,key}=Core;
const quiet=e=>{for(const item of e.items){item.active=false;item.cool=Infinity;}return e;};
// Follow reachable real terrain, with the real occupied body. Portal entry
// cells are targets; the exit is not approximated by a long cardinal edge.
function route(e,target){
 const q=[{x:e.x,y:e.y,d:-1}],seen=new Set([key(e.x,e.y)]);
 for(let i=0;i<q.length;i++){
  const p=q[i];if(i&&p.x===target.x&&p.y===target.y)return p.d;
  for(const d of [1,2,3,0]){if(!i&&d===(e.direction+2)%4)continue;const x=p.x+DX[d],y=p.y+DY[d],k=key(x,y);if(Math.abs(x-e.x)>24||Math.abs(y-e.y)>24||seen.has(k)||e.world.blocked(x,y)||e.occupied.has(k))continue;seen.add(k);q.push({x,y,d:i?p.d:d});}
 }
 return null;
}
const portal=quiet(new Engine(1,{forestSlice:true}));portal.fairy=100000;portal.portals=[{x:2,y:0},{x:-10,y:-2}];
let teleports=0,target=portal.portals[0];
for(let steps=0;steps<1600&&teleports<20;steps++){
 // Leave the exit along a free side, then approach that same gate again.
 if(portal.portalState==='exit-grace')target={x:portal.x+DX[portal.direction]*10,y:portal.y+DY[portal.direction]*10};
 if(portal.x===target.x&&portal.y===target.y)target=portal.portals.find(p=>Math.abs(p.x-portal.x)+Math.abs(p.y-portal.y)<20);
 let d=route(portal,target);assert.notEqual(d,null,'portal route exists');portal.direction=d;portal.ticks+=12;portal.move();assert(portal.alive,portal.reason);
 if(portal.portalState==='exit-grace'&&portal.portalFlash===30){teleports++;portal.portalFlash=29;}
 const before=portal.digest();for(const alpha of [0,.25,.5,.75,1]){const f=Segments.snapshot(portal,alpha);assert(f.parts.slice(0,f.length).every(p=>p.cell>=0&&p.cell<16));for(let i=1;i<f.length;i++)if(!f.links[i])assert.notEqual(f.parts[i].kind,'corner');}assert.equal(portal.digest(),before);
}
assert.equal(teleports,20);
// Main food owns one slot and one countdown, regardless of difficulty/events.
for(const seed of [1,7,19,127]){
 const e=new Engine(seed);e.difficulty=.95;e.items[3].cool=0;
 for(let tick=0;tick<600;tick++){
  if(tick%30===0)e.qaMainFood(e.x-50,e.y+50);
  e.updateMainFood();assert(e.items.slice(1,3).every(f=>!f.active));
  if(e.items[0].active){assert(e.free(e.items[0].x,e.items[0].y,e.items[0]));if(tick%30===12)assert(e.items[0].x>e.x);}
 }
 e.collect(e.items[0]);for(let t=0;t<12;t++)e.updateMainFood();assert(e.items[0].active);
 const rng=e.seed;assert.equal(e.qaMainFood(3,1),true);assert.equal(e.seed,rng,'QA hook does not change production RNG');
 assert(e.startWorldEvent('bloom'));assert(e.items.slice(4).some(f=>f.active));assert(e.items[0].active,'events cannot consume the main slot');
 e.activate('magnet');e.activate('golden');e.activate('slime');assert.equal(e.activate('fairy'),false);assert.equal(e.activate('drunk'),false);
}
// Renderer balance and full-frame clearing, including a deliberate sprite
// exception: no dynamic clip may survive into the following visual frame.
let depth=0,clears=0,resets=0;
const ctx=new Proxy({save(){depth++;},restore(){assert(depth>0);depth--;},clearRect(){clears++;},reset(){depth=0;resets++;}}, {get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const sandbox={MushroomSnakeCore:Core,MushroomSnakeSegments:Segments,location:{search:''},URLSearchParams};sandbox.globalThis=sandbox;sandbox.window=sandbox;
vm.runInNewContext(fs.readFileSync(require.resolve('./snake-forest.js'),'utf8'),sandbox);
const forest=sandbox.MushroomSnakeForest,e=quiet(new Engine(1)),s={engine:e,ctx,canvas:{width:900,height:500},view:{w:900,h:500,dpr:1,scale:40},state:'play',acc:0,mobile:()=>false,assets:{},chunks:new Map()};
for(let i=0;i<20;i++){forest.paint(s);assert.equal(depth,0);}
assert.equal(clears,20);forest.fullInvalidate(s,'restart');forest.paint(s);assert.equal(s.lastInvalidation,'restart');assert(resets>=2);
forest.atlas={};forest.sprite=()=>{throw Error('deliberate draw failure');};assert.throws(()=>forest.paint(s),/deliberate draw failure/);assert.equal(depth,0,'exception must unwind all canvas scopes');forest.atlas=null;forest.paint(s);assert.equal(depth,0);
console.log(JSON.stringify({portalTransitions:teleports,portalTopology:true,renderInvariant:true,oneMainFood:true,eventIsolation:true,legalStack:true,fullClear:true,balancedCanvasState:true}));
