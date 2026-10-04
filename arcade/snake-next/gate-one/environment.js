import {DX,DY} from '../simulation/rules.js';

export const BORDER_COLORS={forest:['#13271c','#345232','#698147','#a8a066'],caves:['#15202d','#334452','#618496','#a0c8d4'],swamp:['#101f23','#23493d','#466d52','#829d69']};

/** Native pixel ornaments on the OUTER logical wall cells, not arena clutter. */
function borderTile(ctx,x,y,cell,biome,index,amount=1){
 const colors=BORDER_COLORS[biome],u=cell/68;
 ctx.save();ctx.translate(x,y);ctx.scale(u,u);ctx.globalAlpha*=amount;
 ctx.fillStyle=colors[0];ctx.fillRect(0,0,68,68);
 ctx.fillStyle=colors[1];ctx.fillRect(3,7,62,54);ctx.fillRect(0,22,68,24);
 ctx.fillStyle=colors[2];
 if(biome==='caves'){
  for(const [a,b,w,h]of [[7,13,16,28],[29,6,14,34],[48,22,14,23]]){ctx.fillRect(a,b,w,h);ctx.fillStyle=colors[3];ctx.fillRect(a+2,b,3,h-7);ctx.fillStyle=colors[2];}
 }else if(biome==='swamp'){
  ctx.fillRect(0,50,68,3);ctx.fillRect(10,42,23,2);ctx.fillRect(43,57,18,2);
  for(let i=0;i<5;i++){const a=(i*13+index*7)%62;ctx.fillRect(a,14+i%3*6,3,32);ctx.fillRect(a-3,20+i%3*6,9,3);}
 }else{
  ctx.fillRect(0,27,68,9);ctx.fillRect(8,10,8,48);ctx.fillRect(32,18,7,45);ctx.fillRect(53,7,7,48);
  ctx.fillStyle=colors[3];ctx.fillRect(0,27,68,2);ctx.fillRect(9,12,2,21);ctx.fillRect(33,20,2,18);
  ctx.fillStyle=colors[1];for(let i=0;i<4;i++)ctx.fillRect((i*17+index*11)%59,8+(i%2)*36,9,6);
 }
 ctx.fillStyle=colors[0];ctx.fillRect(0,64,68,4);ctx.restore();
}
function borderCells(width,height){const cells=[];for(let x=0;x<width;x++)cells.push([x,0],[x,height-1]);for(let y=1;y<height-1;y++)cells.push([0,y],[width-1,y]);return cells;}

export function drawEnvironment(ctx,s,view,l,frame,indicator=false){
 const {field,arena,cell}=l,xy=(x,y)=>[field.x+(x-view.x)*cell,field.y+(y-view.y)*cell];
 const opening=s.openings?.at(-1),age=opening?Math.max(0,s.tick-opening.tick+(frame.alpha||0)):60,p=opening?Math.min(1,age/opening.duration):1;
 // The logical expansion is atomic. Its presentation is a one-second boundary
 // opening/wave; no modal, movement freeze, or hidden temporary collision mask.
 const width=s.world.width,height=s.world.height,biome=s.world.biome;
 for(const [x,y]of borderCells(width,height)){
  if(x<view.x||y<view.y||x>view.x+27||y>view.y+11)continue;
  const [a,b]=xy(x,y),inset=cell*.25;
  // The cabinet covers the blocked outer row. An inward root/crystal/water
  // fringe makes that SAME logical boundary visible without another frame.
  borderTile(ctx,a+(x===0?inset:x===width-1?-inset:0),b+(y===0?inset:y===height-1?-inset:0),cell,biome,x+y);
 }
 if(opening&&p<1){
  // Reveal newly active floor behind the outward wave. The floor is dimmed,
  // never collision-blocked, and gameplay entities are drawn on top afterwards.
  for(let y=Math.floor(view.y)+1;y<=Math.ceil(view.y)+10;y++)for(let x=Math.floor(view.x)+1;x<=Math.ceil(view.x)+26;x++){
   if(x<opening.from.width-1&&y<opening.from.height-1||x<1||y<1||x>=width-1||y>=height-1)continue;
   const distance=Math.max((x-opening.from.width+2)/Math.max(1,width-opening.from.width),(y-opening.from.height+2)/Math.max(1,height-opening.from.height)),reveal=Math.max(0,Math.min(1,(p-distance*.55)*3));
   const [a,b]=xy(x,y);ctx.fillStyle='#021512';ctx.globalAlpha=(1-reveal)*.65;ctx.fillRect(a,b,cell+1,cell+1);
  }
  ctx.globalAlpha=1;
  // Old east/south root/rock walls retract outward in staggered pixel chunks.
  for(const [x,y]of borderCells(opening.from.width,opening.from.height)){
   if(!(x===opening.from.width-1||y===opening.from.height-1)||x===0||y===0)continue;
   const local=Math.max(0,Math.min(1,p*1.35-((x+y)%5)*.06));
   if(local>=1)continue;
   const [a,b]=xy(x,y),scale=1-local;
   ctx.save();ctx.beginPath();ctx.rect(a,b,cell,cell);ctx.clip();
   // Receding fragments, not an apparently solid wall over newly legal floor.
   const shift=x===opening.from.width-1?cell*local:0,fall=y===opening.from.height-1?cell*local:0;
   borderTile(ctx,a+shift,b+fall,cell,opening.from.biome,x+y,scale*.7);ctx.restore();
  }
  const waveX=opening.from.width-1+(width-opening.from.width)*p,waveY=opening.from.height-1+(height-opening.from.height)*p;
  ctx.fillStyle=BORDER_COLORS[biome][3];ctx.globalAlpha=.28*(1-p);
  const [wx,wy]=xy(waveX,waveY);ctx.fillRect(wx,arena.y,Math.max(2,cell*.07),arena.h);ctx.fillRect(arena.x,wy,arena.w,Math.max(2,cell*.07));ctx.globalAlpha=1;
 }
 const walls=view.wallDistance;
 if(walls){
  ctx.fillStyle=BORDER_COLORS[biome][3];
  for(const [side,d]of Object.entries(walls))if(d<9){
   const offscreen=side==='left'?view.x>0:side==='right'?view.x+28<width:side==='top'?view.y>0:view.y+12<height;
   if(!offscreen)continue;
   for(let i=0;i<3;i++){
    const thick=Math.max(2,cell*.07),length=cell*.2,a=side==='left'?arena.x:side==='right'?arena.x+arena.w-thick:arena.x+arena.w*.5+(i-1)*cell*.3,b=side==='top'?arena.y:side==='bottom'?arena.y+arena.h-thick:arena.y+arena.h*.5+(i-1)*cell*.3;
    ctx.fillRect(a,b,side==='left'||side==='right'?thick:length,side==='left'||side==='right'?length:thick);
   }
  }
 }
 if(indicator){
  const w=Math.min(92,arena.w*.12),h=w*height/width,x=arena.x+arena.w-w-5,y=arena.y+5;
  ctx.fillStyle='#071e1ce8';ctx.fillRect(x-3,y-3,w+6,h+6);ctx.strokeStyle='#7d9973';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
  ctx.strokeStyle='#bdc49a';ctx.strokeRect(x+view.x/width*w,y+view.y/height*h,28/width*w,12/height*h);
  ctx.fillStyle='#f7e6bb';ctx.fillRect(x+frame.head.x/width*w-1.5,y+frame.head.y/height*h-1.5,3,3);
 }
}

/** One paired A/B ring language. Traversing bodies keep both apertures alive
 * beyond the entry window. Pulses use canonical progress, not private timers. */
export function drawPortalActivity(ctx,s,at,cell,frame){
 const live=(s.portalEdges||[]).some(e=>!e.complete),visible=live||s.portal.phase==='armed'&&s.portalAvailable();if(!visible)return;
 const u=cell/68,phase=(s.tick+frame.alpha)/60;
 for(const [i,c]of s.portals.entries()){
  const p=at(c),d=s.portalFacing[i]??(i?1:3),dx=DX[d],dy=DY[d];
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(u,u);
  ctx.strokeStyle=i?'#abebce':'#d8b5f5';ctx.lineWidth=2;
  for(let n=0;n<8;n++){
   const a=n*Math.PI/4+phase*1.8,r=26+Math.sin(phase*5+n)*2,x=Math.round(Math.cos(a)*r),y=Math.round(Math.sin(a)*r);
   ctx.fillStyle=n%2?'#f1dfa5':i?'#83d7b8':'#a87ccd';ctx.fillRect(x-1,y-1,3,3);
  }
  ctx.fillStyle='#e8d5a5';ctx.fillRect(dx*30-2,dy*30-2,4,4);ctx.fillRect(dx*34-1,dy*34-1,2,2);
  // Explicit tiny A/B pixel labels; the cabinet font is Cyrillic-only.
  const glyph=i?['##.','#.#','##.','#.#','##.']:['.#.','#.#','###','#.#','#.#'];
  ctx.fillStyle=i?'#abebce':'#d8b5f5';glyph.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='#')ctx.fillRect(x*2-3,y*2-38,2,2);}));
  if(live){const ripple=(phase*3)%1;ctx.strokeStyle=i?'#a7e3c4':'#c7a3e1';ctx.globalAlpha=(1-ripple)*.7;ctx.strokeRect(-18-ripple*8,-18-ripple*8,36+ripple*16,36+ripple*16);}
  for(const edge of s.portalEdges){
   const age=(s.tick-edge.tick+frame.alpha)/60;if(age<0||age>.3||c!==edge.entry&&c!==edge.exit)continue;
   ctx.globalAlpha=1-age/.3;
   for(let n=0;n<8;n++){const a=n*Math.PI/4,r=c===edge.entry?29*(1-age/.3):8+age*70;
    ctx.fillStyle=c===edge.entry?'#d7b2f4':'#d6efb6';ctx.fillRect(Math.round(Math.cos(a)*r)-1,Math.round(Math.sin(a)*r)-1,2,2);
   }
  }
  ctx.restore();
 }
}
