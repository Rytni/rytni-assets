import {sprite} from './assets.js';

/** Presentation-only coordinate hash; never touches simulation PRNG or collision. */
export function visualHash(x,y,salt=0){let n=Math.imul(x+113,374761393)^Math.imul(y+719,668265263)^salt;n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;}
const TEXELS=32;
export class Forest {
  constructor(assets){
    this.assets=assets;this.cache=[];this.bakes=0;this.bakeMs=0;
    this.ground=sprite(assets.get('ground'),256);this.fern=sprite(assets.get('fern'),48);this.food=sprite(assets.get('seed'),28);
    this.obstacles=['rock','stump','root','bush','log'].map(key=>sprite(assets.get(key),40));
    this.mushrooms=sprite(assets.get('moss'),24);this.ambient=true;
  }
  prepare(arena){
    const cached=this.cache.find(item=>item.arena===arena);if(cached)return cached;
    const start=performance.now(),canvas=document.createElement('canvas');canvas.width=arena.width*TEXELS;canvas.height=arena.height*TEXELS;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle=ctx.createPattern(this.ground,'repeat');ctx.fillRect(0,0,canvas.width,canvas.height);
    const salt=arena.topologyHash,variants=[0,1,2,3].map(i=>{const p=ctx.createPattern(this.ground,'repeat');p.setTransform(new DOMMatrix().translate(i*59,i*113).rotate(i*90));return p;});
    // Irregular overlapping tonal patches, NOT cell/grid-shaped ground overlays.
    for(let i=0;i<130;i++){
      const h=visualHash(i,71,salt),x=h%canvas.width,y=(h>>>12)%canvas.height,rx=45+(h>>>21)%155,ry=25+(h>>>23)%82;
      ctx.beginPath();
      for(let j=0;j<12;j++){const a=j*Math.PI/6,r=.72+(visualHash(i,j,salt)%28)/100;const px=Math.round(x+Math.cos(a)*rx*r),py=Math.round(y+Math.sin(a)*ry*r);j?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();
      ctx.fillStyle=variants[h%4];ctx.globalAlpha=.72;ctx.fill();ctx.globalAlpha=1;
      ctx.fillStyle=['#30482938','#172e2538','#66513724','#7c853328'][h%4];ctx.fill();
    }
    let decor=0;
    // Authored-looking arrangements: a few small satellites around deterministic
    // cluster centers, open areas between. Placement is immutable for the arena.
    for(let cy=2;cy<arena.height-2;cy++)for(let cx=2;cx<arena.width-2;cx++){
      const h=visualHash(cx,cy,salt);if(h%109>2||arena.blocked(cy*arena.width+cx))continue;
      const count=2+(h>>>12)%4;
      for(let j=0;j<count;j++){
        const v=visualHash(cx+j*13,cy-j*7,salt),ox=((v%100)/100-.5)*3,oy=(((v>>>8)%100)/100-.5)*2;
        const x=(cx+.5+ox)*TEXELS,y=(cy+.5+oy)*TEXELS,cell=Math.floor(y/TEXELS)*arena.width+Math.floor(x/TEXELS);if(arena.blocked(cell))continue;
        const size=26+(v>>>20)%22;ctx.globalAlpha=.60;ctx.drawImage(this.fern,x-size/2,y-size/2,size,size*this.fern.height/this.fern.width);ctx.globalAlpha=1;decor++;
        if(j===0&&h%5===0){ctx.globalAlpha=.43;ctx.drawImage(this.mushrooms,x+12,y+8,10,10);ctx.globalAlpha=1;}
        // Ground-hugging leaves, flowers, small roots and grass are pixel details,
        // not raised masses; deliberately below obstacle/food contrast.
        for(let k=0;k<3;k++){const a=visualHash(v,k,salt),lx=x+(a%32)-16,ly=y+((a>>>8)%24)-12;ctx.fillStyle=['#87925166','#97826066','#73875766'][k];ctx.fillRect(lx,ly,3,1);ctx.fillRect(lx+1,ly-1,1,3);}
      }
    }
    const floor=canvas,objects=document.createElement('canvas');objects.width=canvas.width;objects.height=canvas.height;
    const solid=objects.getContext('2d');solid.imageSmoothingEnabled=false;let obstacles=0;
    for(let cell=0;cell<arena.cells;cell++)if(arena.blocked(cell)){
      const x=cell%arena.width,y=Math.floor(cell/arena.width),h=visualHash(x,y,salt),edge=x===0||y===0||x===arena.width-1||y===arena.height-1,img=this.obstacles[edge?0:h%5];
      // Grounded contact shadow, not a cell-shaped backing tile.
      solid.fillStyle='#07180eb0';solid.beginPath();solid.ellipse(x*TEXELS+16,y*TEXELS+23,14,8,0,0,Math.PI*2);solid.fill();
      solid.drawImage(img,x*TEXELS+1,y*TEXELS+1,30,30);obstacles++;
    }
    const fireflies=[];for(let i=0;i<24;i++){const h=visualHash(i,911,salt);fireflies.push({x:1+h%(arena.width-2),y:1+(h>>>12)%(arena.height-2),phase:h%100});}
    const item={arena,floor,objects,decor,obstacles,fireflies};this.cache.push(item);if(this.cache.length>2)this.cache.shift();
    this.bakes++;this.bakeMs=performance.now()-start;return item;
  }
  draw(ctx,arena,x0,y0,x1,y1,food,now){
    const item=this.prepare(arena),w=x1-x0,h=y1-y0;
    ctx.drawImage(item.floor,x0*TEXELS,y0*TEXELS,w*TEXELS,h*TEXELS,x0,y0,w,h);
    if(this.ambient)for(const f of item.fireflies)if(f.x>=x0&&f.x<x1&&f.y>=y0&&f.y<y1){ctx.globalAlpha=.12+Math.max(0,Math.sin(now/1700+f.phase))*.3;ctx.fillStyle='#cbd982';ctx.fillRect(f.x,f.y,.045,.045);ctx.globalAlpha=1;}
    ctx.drawImage(item.objects,x0*TEXELS,y0*TEXELS,w*TEXELS,h*TEXELS,x0,y0,w,h);
    if(food>=0){
      const x=food%arena.width+.5,y=Math.floor(food/arena.width)+.5,pulse=1+Math.sin(now/700)*.035,size=.63*pulse;
      ctx.fillStyle='#e6b64a25';ctx.beginPath();ctx.ellipse(x,y,.44,.39,0,0,Math.PI*2);ctx.fill();
      ctx.drawImage(this.food,x-size/2,y-size/2,size,size);
    }
  }
}
