import {DX,DY} from '../simulation/rules.js';

export const BORDER_COLORS={forest:['#18251b','#4a4930','#6d8450','#b6c685'],caves:['#15202d','#42566b','#7396aa','#b6d6dc'],swamp:['#101f23','#315a45','#688356','#a2b87c']};
const clamp=n=>Math.max(0,Math.min(1,n));
export function openingPhase(age,duration=60){const p=clamp(age/duration);return {p,crack:clamp(p/.18),retract:clamp((p-.20)/.46),travel:clamp((p-.24)/.70)};}
export function territoryReveal(x,y,opening,travel){
 const {from,to}=opening,east=x>=from.width-1,south=y>=from.height-1;
 if(!east&&!south)return {new:false,reveal:1,wave:0};
 const d=Math.max(east?(x-from.width+1)/Math.max(1,to.width-from.width):0,south?(y-from.height+1)/Math.max(1,to.height-from.height):0);
 return {new:true,reveal:clamp((travel-d+.08)/.16),wave:Math.max(0,1-Math.abs(travel-d)/.12)};
}

/** Solid environmental wall in native tangent/normal coordinates. Most of it
 * occupies the blocked cell; an 18 px fringe with sparse 24 px moss tips reaches
 * into the playable edge, leaving at least 44 px of the edge cell unobscured. */
function wallCell(ctx,x,y,cell,biome,index,side,{crack=0,retract=0,near=0,time=0}={}){
 const c=BORDER_COLORS[biome],u=cell/68,vertical=side==='left'||side==='right',sign=side==='left'||side==='top'?1:-1;
 ctx.save();ctx.translate(x,y);ctx.scale(u,u);
 const rect=(t,n,w,h,color)=>{
  if(retract>=1)return;ctx.fillStyle=color;
  // Root/rock fragments withdraw and shrink, not just become transparent.
  n=n*(1-retract)-54*retract;h*=1-retract;
  if(vertical)ctx.fillRect(sign>0?n:-n-h,t,h,w);else ctx.fillRect(t,sign>0?n:-n-h,w,h);
 };
 rect(0,-54,68,68,c[0]);rect(0,-49,68,58,c[1]);
 if(biome==='forest'){
  for(const [t,n,w,h]of [[5,-43,19,29],[32,-51,24,24],[52,-29,16,23]]){
   rect(t-2,n-2,w+4,h+4,'#232c23');rect(t,n,w,h,'#687057');rect(t+2,n,w-4,3,'#959b73');rect(t+w-4,n+4,4,h-4,'#414d38');
  }
  rect(0,-10,68,19,'#302d20');rect(0,-7,68,10,'#746346');rect(0,-7,68,2,'#a0905d');
  for(let i=0;i<4;i++){const t=i*17;rect(t,-18+(i+index)%2*6,12,8,'#4e482e');rect(t+5,-13,5,17,'#8b7851');}
 }else if(biome==='caves'){
  for(const [t,n,w,h]of [[3,-43,17,35],[25,-50,15,39],[45,-35,20,28]]){rect(t,n,w,h,c[2]);rect(t+2,n,3,h-5,c[3]);rect(t+w-4,n+5,4,h-5,c[1]);}
  rect(0,-8,68,16,'#526e7d');rect(0,-7,68,3,'#90b0b9');
 }else{
  rect(0,-48,68,25,'#123b36');rect(0,-35,68,2,'#4a7164');
  for(let i=0;i<5;i++){const t=(i*13+index*7)%62;rect(t,-32+i%3*4,5,34,c[2]);rect(t-3,-22+i%3*4,11,4,c[1]);}
  rect(0,-9,68,17,'#35553c');rect(0,-6,68,3,'#7f945b');
 }
 rect(0,5,68,7,c[2]);
 for(let i=0;i<5;i++){const t=(i*15+index*9)%64;rect(t,7,7,5,i%2?c[1]:c[3]);rect(t+2,10,4,3,c[2]);}
 if(biome==='forest'){
  // Visible root knots and worn stones also occupy the cabinet-facing fringe,
  // so a boundary at the viewport edge is still environmental, not just trim.
  const t=7+(index*13)%24;
  rect(t,-3,13,14,'#343c2a');rect(t+2,-3,9,11,'#848568');rect(t+3,-3,7,2,'#b3ac7e');rect(t+4,8,7,3,'#4c5940');
  rect(t+23,0,15,7,'#453c28');rect(t+25,0,10,3,'#9b8555');rect(t+30,3,5,6,'#776340');
 }
 rect(0,12,68,2,c[0]);
 if(biome==='forest'){
  // Contrast against the emerald floor, rather than resembling cabinet trim.
  // Continuous dark root lip and irregular moss clumps remain readable even
  // when the blocked-cell portion is outside the cabinet's viewport clip.
  const t=7+(index*13)%24;
  rect(0,9,68,9,'#172b1c');
  rect(t+1,10,11,9,'#555d41');rect(t+3,10,7,2,'#999875');
  rect(t+25,9,4,13,'#796440');rect(t+25,9,2,12,'#ad9157');
  for(let i=0;i<4;i++){
   const t=(i*17+index*5)%62,n=12+(i+index)%3;
   rect(t,n,10,7,'#365337');rect(t+2,n,6,3,'#83974f');
   rect(t+4,n+5,4,5,'#526d38');
  }
 }
 if(near>0){ctx.globalAlpha=.15+near*(.16+.04*Math.sin(time/45));rect(0,6,68,4,c[3]);ctx.globalAlpha=1;}
 if(crack>0&&retract<1){
  const t=24+(index*7)%15,lit=crack>.4?c[3]:c[2];
  for(let i=0;i<6;i++){const n=-49+i*10;rect(t+(i%2?-4:0),n,3,11,c[0]);if(crack>.2)rect(t+(i%2?-3:1),n,2,9,lit);}
 }
 ctx.restore();
}
function borderCells(width,height,sideCorners=false){const cells=[];for(let x=0;x<width;x++)cells.push([x,0,'top'],[x,height-1,'bottom']);for(let y=sideCorners?0:1;y<height-(sideCorners?0:1);y++)cells.push([0,y,'left'],[width-1,y,'right']);return cells;}

export function drawEnvironment(ctx,s,view,l,frame,indicator=false){
 const {field,arena,cell}=l,xy=(x,y)=>[field.x+(x-view.x)*cell,field.y+(y-view.y)*cell];
 const opening=s.openings?.at(-1),age=opening?Math.max(0,s.tick-opening.tick+(frame.alpha||0)):60,phase=openingPhase(age,opening?.duration),{p}=phase;
 // The logical expansion is atomic. Its presentation is a one-second boundary
 // opening/wave; no modal, movement freeze, or hidden temporary collision mask.
 const width=s.world.width,height=s.world.height,biome=s.world.biome;
 const edge=(x,y,side)=>xy(x+(side==='left'?1:0),y+(side==='top'?1:0));
 for(const [x,y,side]of borderCells(width,height,!!l.wallOffsets)){
  if(x+1<view.x||y+1<view.y||x>view.x+view.cols||y>view.y+view.rows)continue;
  const pos=edge(x,y,side),offset=l.wallOffsets?.[side]||0;
  // FIT-only presentation placement. Painter/source geometry is unchanged;
  // old opening walls still use their canonical historical position below.
  pos[side==='left'||side==='right'?0:1]+=offset;
  const [a,b]=pos,distance=view.wallDistance?.[side]??99;
  const along=side==='left'||side==='right'?Math.abs(y-frame.head.y):Math.abs(x-frame.head.x);
  const near=distance<=6&&along<3?clamp((7-distance)/3):0;
  wallCell(ctx,a,b,cell,biome,x+y,side,{near,time:s.tick+frame.alpha});
  // A few slow, tiny moss spores at the nearby physical wall, not warning UI.
  if(near>.2&&(x+y)%3===0){const t=(s.tick%90)/90,q=cell/68;ctx.fillStyle=BORDER_COLORS[biome][3];ctx.globalAlpha=near*(1-t)*.45;
   ctx.fillRect(a+(side==='right'?-1:side==='left'?1:0)*(14+t*5)*q+(side==='top'||side==='bottom'?cell*.4:0),b+(side==='bottom'?-1:side==='top'?1:0)*(14+t*5)*q+(side==='left'||side==='right'?cell*.4:0),2*q,2*q);ctx.globalAlpha=1;}
 }
 if(opening&&p<1){
  // Reveal newly active floor behind the outward wave. The floor is dimmed,
  // never collision-blocked, and gameplay entities are drawn on top afterwards.
  for(let y=Math.floor(view.y)+1;y<Math.ceil(view.y)+view.rows-1;y++)for(let x=Math.floor(view.x)+1;x<Math.ceil(view.x)+view.cols-1;x++){
   if(x<1||y<1||x>=width-1||y>=height-1)continue;
   const reveal=territoryReveal(x,y,opening,phase.travel);if(!reveal.new)continue;
   const [a,b]=xy(x,y),u=cell/68;ctx.fillStyle='#021512';ctx.globalAlpha=(1-reveal.reveal)*.78;ctx.fillRect(a,b,cell+1,cell+1);
   if(reveal.wave>0&&phase.travel>0){
    ctx.fillStyle=BORDER_COLORS[biome][3];ctx.globalAlpha=reveal.wave*.15;ctx.fillRect(a+u*3,b+u*3,cell-u*6,cell-u*6);
    // Short tile-edge shimmer and sparse body-free spores follow the reveal.
    ctx.globalAlpha=reveal.wave*.6;ctx.fillRect(a+u*5,b+u*3,u*22,u*2);ctx.fillRect(a+u*3,b+u*5,u*2,u*13);
    if((x*7+y*11)%4===0){ctx.fillRect(a+cell*.42,b+cell*(.6-p*.25),2*u,2*u);ctx.fillRect(a+cell*.65,b+cell*(.8-p*.3),2*u,2*u);}
   }
  }
  ctx.globalAlpha=1;
  // The actual old wall holds, fractures, then withdraws in staggered chunks.
  for(const [x,y,side]of borderCells(opening.from.width,opening.from.height)){
   if(!(side==='right'&&width>opening.from.width||side==='bottom'&&height>opening.from.height)||x===0||y===0)continue;
   if(x+1<view.x||y+1<view.y||x>view.x+view.cols||y>view.y+view.rows)continue;
   const local=clamp((p-.20-((x+y)%4)*.06)/.46),[a,b]=edge(x,y,side);
   wallCell(ctx,a,b,cell,opening.from.biome,x+y,side,{crack:phase.crack,retract:local});
   if(p>.13&&p<.76&&(x+y)%3===0){
    const t=clamp((p-.13)/.63),u=cell/68,dx=side==='right'?1:0,dy=side==='bottom'?1:0;
    ctx.fillStyle=BORDER_COLORS[opening.from.biome][2];ctx.globalAlpha=(1-t)*.8;
    for(let i=0;i<3;i++)ctx.fillRect(a+dx*cell*t*.85+(dy?cell*(.2+i*.2):0),b+dy*cell*t*.85+(dx?cell*(.2+i*.2):0)+t*t*cell*.2,(3+i%2)*u,3*u);ctx.globalAlpha=1;
   }
  }
 }
 const walls=view.wallDistance;
 if(walls){
  ctx.fillStyle=BORDER_COLORS[biome][3];
  for(const [side,d]of Object.entries(walls))if(d<9){
   const offscreen=side==='left'?view.x>0:side==='right'?view.x+view.cols<width:side==='top'?view.y>0:view.y+view.rows<height;
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
  ctx.strokeStyle='#bdc49a';ctx.strokeRect(x+view.x/width*w,y+view.y/height*h,view.cols/width*w,view.rows/height*h);
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
