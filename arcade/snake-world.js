/* Seed + coordinates are the sole terrain inputs: eviction cannot change collision. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./snake-rules.js'):root.MushroomSnakeRules);if(typeof module==='object'&&module.exports)module.exports=api;else root.MushroomSnakeWorld=api;})(typeof globalThis==='object'?globalThis:this,R=>{
 'use strict';
 const {BIOMES,DIFFICULTY,hash}=R,CHUNK=16,key=(x,y)=>x+','+y;
 class World{
  constructor(seed){this.seed=seed>>>0;this.chunks=new Map();this.generated=0;}
  // Warped bands blend over 40 cells; topology is continuous across chunk boundaries.
  biomeAt(x,y){const d=Math.max(0,Math.hypot(x,y)+10*Math.sin(x*.033)+8*Math.sin(y*.047)),span=DIFFICULTY.biomeSpan,index=Math.floor(d/span)%BIOMES.length,next=(index+1)%BIOMES.length,phase=d%span,mix=Math.max(0,(phase-span+DIFFICULTY.transition)/DIFFICULTY.transition);return{index,next,mix,biome:BIOMES[index]};}
  biomeIndex(x,y){const b=this.biomeAt(x,y);return hash(x,y,this.seed^0x6193)/4294967296<b.mix?b.next:b.index;}
  groveAt(x,y){const gx=Math.floor(x/64),gy=Math.floor(y/64),n=hash(gx,gy,this.seed^0x428c);if(Math.hypot(x,y)<70||(n&7)>1)return false;const cx=gx*64+12+((n>>>5)%40),cy=gy*64+12+((n>>>13)%40);return Math.hypot(x-cx,y-cy)<9;}
  terrainDifficulty(x,y){const distance=Math.hypot(x,y);return Math.min(1,distance/(distance+DIFFICULTY.terrainDistance)+BIOMES[this.biomeIndex(x,y)].difficulty+(this.groveAt(x,y)?.28:0));}
  anchor(x,y){const n=hash(x,y,this.seed);if(n/4294967296>.14)return false;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){if(!dx&&!dy)continue;const other=hash(x+dx,y+dy,this.seed);if(other<n||(other===n&&(dy<0||dy===0&&dx<0)))return false;}return true;}
  rawBlocked(x,y){
   if(x>=-12&&x<=6&&Math.abs(y)<=2)return false;
   // Distinct anchors are >=4 cells apart in Chebyshev distance. Every island
   // fits in 2x2, leaving >=2 free cells between islands: no walls/rings/mazes.
   for(let ay=y-1;ay<=y;ay++)for(let ax=x-1;ax<=x;ax++){
    if(!this.anchor(ax,ay))continue;
    const dx=x-ax,dy=y-ay;if(!dx&&!dy)return true;
    const d=this.terrainDifficulty(ax,ay),n=hash(ax,ay,this.seed^0x719f)/4294967296;
    if(n<d&&(dx===0||dy===0||n<d*.45))return true;
   }return false;
  }
  blocked(x,y){const cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK),c=this.chunks.get(key(cx,cy));return c?!!c.cells[(y-cy*CHUNK)*CHUNK+x-cx*CHUNK]:this.rawBlocked(x,y);}
  chunk(cx,cy){const k=key(cx,cy);let c=this.chunks.get(k);if(c)return c;c={x:cx,y:cy,cells:new Uint8Array(CHUNK*CHUNK)};for(let y=0;y<CHUNK;y++)for(let x=0;x<CHUNK;x++)c.cells[y*CHUNK+x]=this.rawBlocked(cx*CHUNK+x,cy*CHUNK+y)?1:0;this.chunks.set(k,c);this.generated++;return c;}
  stream(x,y){const cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)this.chunk(cx+dx,cy+dy);for(const[k,c]of this.chunks)if(Math.abs(c.x-cx)>2||Math.abs(c.y-cy)>2)this.chunks.delete(k);}
 }
 return{World};
});
