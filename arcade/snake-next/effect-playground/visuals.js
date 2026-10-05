import {effectText as pixelText} from './text.js';
import {drawObject,objectImage} from '../forest-training/objects.js';
import {drawPickup,drawFallbackPickup,spriteURL,LABELS} from './art.js';
import {DEFINITIONS} from '../progressive-run/director.js';
import {drawVfx} from './vfx-art.js';
import {drawReadable} from './readable-objects.js';
import {effectAssets,drawAuthoredVfx,drawAuthoredFood} from './asset-bank.js';
import {focusPositions,foodSquash,rootWarningPhase,vfxSize,rushPositions,mistVariation,feedbackLanes} from './vfx-presentation.js';
export const DETAILS={harvest:'ГРИБЫ ×2 · 16 С',focus:'СПОКОЙНЕЕ · КОМБО ЗАМОРОЖЕНО · 15 С',spores:'СОБИРАЙ СВЕТЯЩИЕСЯ СПОРЫ',guard:'ЩИТ · 1 ЗАРЯД',portalPrize:'НАЙДИ ПОРТАЛ · БОНУС',rush:'СКОРОСТЬ ↑ · 10 С',weak:'ОЧКИ −40% · 12 С',brambles:'КОРНИ · СЛЕДИ ЗА ТРЕЩИНАМИ',mist:'ОБЗОР СУЖЕН · 10 С'};
const has=(s,k)=>s.effects.some(e=>e.kind===k),clamp=n=>Math.max(0,Math.min(1,n));
const corruptCache=new WeakMap();
let cloud;
function fogCloud(){if(cloud)return cloud;cloud=document.createElement('canvas');cloud.width=40;cloud.height=24;const ctx=cloud.getContext('2d');
 for(let y=0;y<24;y+=2)for(let x=0;x<40;x+=2){const d=Math.min(((x-13)/14)**2+((y-12)/10)**2,((x-26)/12)**2+((y-10)/8)**2);if(d>1||d>.72&&(x/2+y/2)%3===0)continue;ctx.globalAlpha=(1-d*.65)*.85;ctx.fillStyle=d<.4?'#adb9b0':'#8fa7a6';ctx.fillRect(x,y,2,2);}return cloud;}
export function foodSprite(art,s){
 if(!has(s,'weak'))return objectImage(art,has(s,'harvest')?'food-gold':'food-red');
 const im=objectImage(art,'food-red');if(!corruptCache.has(im)){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4)if(d.data[i]>d.data[i+1]*1.25){d.data[i]=Math.round(d.data[i]*.43);d.data[i+1]=Math.round(d.data[i+1]*.45);d.data[i+2]=Math.min(180,Math.round(d.data[i]*1.6+40));}x.putImageData(d,0,0);corruptCache.set(im,c);}return corruptCache.get(im);
}
function sparkle(ctx,x,y,size,c){ctx.fillStyle=c;ctx.fillRect(x-size/2,y-size*1.5,size,size*3);ctx.fillRect(x-size*1.5,y-size/2,size*3,size);}
function drawFood(ctx,art,s,x,y,cell,tick,compact){
 const variant=has(s,'weak')?'corrupted':has(s,'harvest')?'golden':null;
 if(variant&&drawAuthoredFood(ctx,variant,x,y,cell,tick,compact))return;
 drawReadable(ctx,foodSprite(art,s),variant==='corrupted'?'food-corrupt':variant==='golden'?'food-gold':'food',x,y,cell,compact,.70);
}
export function drawMote(ctx,x,y,cell,tick,id=0,attractAge=-1){
 const size=vfxSize('spore',cell),b=Math.sin(tick/37+id)*Math.min(2,cell*.035);
 // Attraction's first bright core is an authored frame, not a filter/glow.
 if(attractAge>=0&&attractAge<6){if(drawAuthoredVfx(ctx,'spore-idle',x,y+b,size,0,1,0,0))return;}
 drawVfx(ctx,'mote',x,y+b,size,tick);
}
function frontVfx(ctx,kind,x,y,size,tick,dx,dy,mirror=false){
 ctx.save();ctx.translate(x,y);ctx.transform(-dy,dx,-dx,-dy,0,0);if(mirror)ctx.scale(-1,1);
 drawVfx(ctx,kind,0,0,size,tick);ctx.restore();
}
export function drawRoots(ctx,s,at,cell,predicate=()=>true){
 for(const w of s.world.hazards)if(predicate(w.cell)){const p=at(w.cell);drawVfx(ctx,'roots',p.x,p.y,cell*.96,s.tick);}
}
export function drawUnderSnake(ctx,s,frame,cell,l){
 if(has(s,'rush'))for(const p of rushPositions(frame,cell))drawVfx(ctx,p.kind,l.field.x+(p.x-frame.viewX+.5)*cell+p.offsetX,l.field.y+(p.y-frame.viewY+.5)*cell+p.offsetY,vfxSize('rush',cell),s.tick+frame.alpha+p.phase,p.opacity);
}
export function nearMistSafety(frame,c,stride){return Math.hypot(c%stride-frame.head.x,Math.floor(c/stride)-frame.head.y)<=5;}
export function mistDensity(distance){const a=clamp((distance-3)/3);return .45+.55*a*a*(3-2*a);}
export function drawMist(ctx,s,frame,cell,l){
 if(!has(s,'mist'))return;
 const {arena}=l,t=s.tick+frame.alpha,h={x:l.field.x+(frame.head.x-frame.viewX+.5)*cell,y:l.field.y+(frame.head.y-frame.viewY+.5)*cell};
 // Environment layer only. Nonzero continuous puff opacity, never a head hole.
 ctx.save();ctx.beginPath();ctx.rect(arena.x,arena.y,arena.w,arena.h);ctx.clip();
 for(let side=0;side<4;side++)for(let layer=0;layer<2;layer++)for(let i=0;i<(side<2?8:4);i++){
  const v=mistVariation(side,layer,i),p=(t/(240+layer*45)+i*.137+side*.19+layer*.4)%1,travel=p*cell*3.6,size=cell*v.scale,count=side<2?8:4;
  const x=side<2?arena.x+(i+.5)/count*arena.w+(layer?cell*.35:0):side===2?arena.x+travel:arena.x+arena.w-travel;
  const y=(side>=2?arena.y+(i+.5)/count*arena.h:side===0?arena.y+travel:arena.y+arena.h-travel)+v.offset*cell;
  ctx.globalAlpha=Math.sin(p*Math.PI)*(.42+layer*.12)*mistDensity(Math.hypot(x-h.x,y-h.y)/cell)*v.opacity;
  ctx.save();ctx.translate(x,y);if(v.mirror)ctx.scale(-1,1);
  if(!drawAuthoredVfx(ctx,'mist-puff',0,0,size,t,1,0,v.phase))ctx.drawImage(fogCloud(),Math.round(-size/2),Math.round(-size*.3),size,size*.6);ctx.restore();
 }ctx.restore();
}
export function drawEffectsWorld(ctx,s,frame,at,cell,art,l){
 const {arena}=l,t=s.tick+frame.alpha,q=cell/68,h={x:l.field.x+(frame.head.x-frame.viewX+.5)*cell,y:l.field.y+(frame.head.y-frame.viewY+.5)*cell};
 // Standalone asset review compatibility; live gameplay explicitly owns layers.
 if(!l.environmentLayers){drawRoots(ctx,s,at,cell);drawMist(ctx,s,frame,cell,l);drawUnderSnake(ctx,s,frame,cell,l);}
 if(s.state.food>=0){const p=at(s.state.food);
  drawFood(ctx,art,s,p.x,p.y+Math.sin(t/67)*2*q,cell,s.tick,l.compact);
  if(has(s,'harvest'))drawVfx(ctx,'crown',p.x,p.y-cell*.29,Math.max(12,cell*.3),t,.9);
  if(has(s,'harvest')||has(s,'weak'))for(let i=0;i<3;i++){const a=t/70+i*2.1,weak=has(s,'weak'),r=weak?Math.max(10,cell*.35):cell*.32;drawVfx(ctx,weak?'mold':'glint',p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,weak?vfxSize('corrupt',cell):Math.max(7,cell*.16),t+i*8,weak?.85:.65);}
 }
 for(const p of s.pickups)if(DEFINITIONS[p.kind]){const xy=at(p.cell);drawPickup(ctx,p.kind,xy.x,xy.y,cell,s.tick,l.compact);}
 for(const p of s.spores){const xy=at(p.cell),a=p.magnetTick===undefined?0:clamp((t-p.magnetTick)/18),e=a*a*(3-2*a),bend=Math.sin(a*Math.PI)*cell*.18;
  const x=xy.x+(h.x-xy.x)*e+bend,y=xy.y+(h.y-xy.y)*e-bend;
  if(a>0)for(let j=1;j<=3;j++){const back=Math.max(0,a-j*.12),be=back*back*(3-2*back),bb=Math.sin(back*Math.PI)*cell*.18,tx=xy.x+(h.x-xy.x)*be+bb,ty=xy.y+(h.y-xy.y)*be-bb,size=vfxSize('sporeTrail',cell);if(!drawAuthoredVfx(ctx,'spore-trail',tx,ty,size,t+j*4,.6-j*.10,p.magnetTick))drawVfx(ctx,'glint',tx,ty,size,t+j*4,.6-j*.10);}
  drawMote(ctx,x,y,cell,t,p.cell,p.magnetTick===undefined?-1:t-p.magnetTick);
 }
 for(const w of s.director.warnings){const p=at(w.cell),phase=rootWarningPhase(s.tick,w.starts);drawVfx(ctx,'cracks',p.x,p.y,vfxSize('rootWarning',cell),s.tick,1,phase.crackStart);if(phase.sprout)drawVfx(ctx,'tips',p.x,p.y,vfxSize('rootSprout',cell),s.tick,w.phase==='pending'?.86+.14*Math.sin((s.tick-w.starts)/8):1,phase.sproutStart);}
 for(const w of s.director.retracts||[]){const p=at(w.cell),age=s.tick-w.starts,size=w.phase==='cancel-decay'?vfxSize('rootSprout',cell):cell*.96;
  // Retain the developed sprout during the first decay frames, not an empty
  // frame at cancellation. Same fixed cell; canonical start drives both sheets.
  if(w.phase==='cancel-decay'&&age<6)drawVfx(ctx,'tips',p.x,p.y,size,s.tick,1-age/6,w.starts-36);
  if(!drawAuthoredVfx(ctx,'roots-decay',p.x,p.y,size,s.tick,1,w.starts))drawVfx(ctx,'decay',p.x,p.y,size,s.tick,1-age/18,w.starts);
 }
 for(const k of ['focus','guard'])if(has(s,k)){
  const dx=frame.head.dx,dy=frame.head.dy;
  if(k==='focus')focusPositions({...h,dx,dy},cell,t).forEach((p,i)=>drawVfx(ctx,'wisp',p.x,p.y,vfxSize('focus',cell),s.tick+i*10,.95));
  if(k==='guard'){
   const charged=vfxSize('guardCharged',cell),front=Math.max(cell*.18,5);
   if(effectAssets.image('vfx.guard-charged'))frontVfx(ctx,'guard-charged',h.x+dx*front,h.y+dy*front,charged,s.tick,dx,dy);
   else drawFallbackPickup(ctx,'guard',h.x-dx*cell*.38,h.y-dy*cell*.38,charged,t,false);
   const sideOffset=Math.max(cell*.29,9),back=cell*.10;
   for(const side of [-1,1])frontVfx(ctx,'plate',h.x-dy*side*sideOffset-dx*back,h.y+dx*side*sideOffset-dy*back,vfxSize('guardPlate',cell),s.tick,dx,dy,side===1);
  }
 }
 const reward=s.feedback.findLast(f=>f.kind==='portal-reward'),trail=s.portalEdges?.some(e=>e.move===s.portalRewardMove&&!e.complete);
 if(has(s,'portalPrize')&&s.portalAvailable()||trail||reward&&s.tick-reward.tick<120)for(const c of s.portals){const p=at(c);if(!drawAuthoredVfx(ctx,'portal-charged-ring',p.x,p.y,vfxSize('portal',cell),s.tick))drawVfx(ctx,'rune',p.x,p.y,cell*.55,t);}
 if(trail||reward&&s.tick-reward.tick<120)for(const span of frame.spans||[{route:frame.route}])for(let i=1;i<Math.min(6,span.route?.length||0);i++){const p=span.route[i],xy=at(p.y*s.arena.width+p.x),size=vfxSize('portalTrail',cell);if(!drawAuthoredVfx(ctx,'portal-body-trail',xy.x,xy.y,size,t+i*6,.8-i*.07))drawVfx(ctx,'rune',xy.x,xy.y,size,t+i*6,.8-i*.07);}
 for(const f of s.feedback){const a=(t-f.tick)/60;if(a<0||a>.34)continue;const p=at(f.cell);
  if(['seed','portal-reward'].includes(f.kind)){
   const burst=f.strong&&f.harvest?'harvest-third-burst':f.harvest?'harvest-sparkle':f.kind==='seed'?'spore-burst':null;
   const authored=burst&&s.tick-f.tick<18&&drawAuthoredVfx(ctx,burst,p.x,p.y,f.spore?vfxSize('sporeBurst',cell):Math.max(24,cell*(.75+Math.min(8,f.combo||1)*.025)),s.tick,1,f.tick);
   const count=f.strong?12:Math.min(10,4+(f.combo||1));
   if(f.kind==='seed'&&!f.spore&&s.tick-f.tick<5){ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,foodSquash(t-f.tick));if(!((f.corrupt||f.harvest)&&drawAuthoredFood(ctx,f.corrupt?'corrupted':'golden',0,0,cell,s.tick,l.compact)))drawReadable(ctx,objectImage(art,'food-red'),'food',0,0,cell,l.compact,.70);ctx.restore();}
   // Once an authored burst is present, only tiny secondary clusters remain.
   if(!authored&&s.tick-f.tick<18)for(let i=0;i<count;i++){const theta=i*Math.PI*2/count,r=cell*(.14+a*1.4);drawVfx(ctx,f.corrupt?'mold':'glint',p.x+Math.cos(theta)*r,p.y+Math.sin(theta)*r,Math.max(5,cell*(f.strong?.16:.10)),s.tick+i*5,(1-a/.34)*.8);}
   if(f.corrupt&&a<.25)drawVfx(ctx,'mold',h.x-frame.head.dx*cell*.2,h.y-cell*.35,Math.max(14,cell*.35),s.tick,.8-a*2);
  }else if(['root-decay','guard-used'].includes(f.kind)){if(!drawAuthoredVfx(ctx,f.kind==='guard-used'?'guard-break':'roots-decay',p.x,p.y,f.kind==='guard-used'?vfxSize('guardBreak',cell):cell*.96,t,1-a/.34,f.tick))for(let i=0;i<4;i++){const theta=i*Math.PI/2;drawVfx(ctx,f.kind==='guard-used'?'cracked':'decay',p.x+Math.cos(theta)*cell*a*2,p.y+Math.sin(theta)*cell*a*2,Math.max(14,cell*.4),t+i*3,1-a/.34,f.tick);}}
  else if(f.effect==='weak'&&a<.3)for(let i=0;i<3;i++)drawVfx(ctx,'mold',h.x+Math.sin(i*2.1)*cell*a*2,h.y+Math.cos(i*2.1)*cell*a*2,Math.max(14,cell*.35),t+i*7,1-a/.3);
 }
 // No effect pickup notice or explanatory prose in the steering area.
 for(const f of feedbackLanes(s,t,at,cell,arena,h))pixelText(ctx,f.text,f.x,f.y,f.size,f.color,'center');
}
export function effectSlots(root,s,compact=false){
 const positives=s.effects.filter(e=>DEFINITIONS[e.kind].positive),negative=s.effects.find(e=>!DEFINITIONS[e.kind].positive),slots=[positives[0],positives[1],negative],key=slots.map(e=>e?.kind||'_').join(',')+':assets'+effectAssets.version;
 if(root.dataset.progressEffects!==key||!root.children.length){root.dataset.progressEffects=key;root.innerHTML=slots.map((e,i)=>e?`<div class="effect ${i===2?'negative':'positive'}" data-effect="${e.kind}" aria-label="${LABELS[e.kind]}"><img alt="" src="${spriteURL(e.kind)}"><span>${LABELS[e.kind]}</span><b></b><i>${e.kind==='harvest'?'×2':''}</i></div>`:`<div class="effect-vacant ${i===2?'negative':'positive'}" aria-label="${i===2?'Дебафф':'Бонус'}: пусто"></div>`).join('');}
 for(const e of s.effects){const card=root.querySelector(`[data-effect="${e.kind}"]`),d=DEFINITIONS[e.kind];if(!card)continue;const remaining=Math.max(0,e.ends-s.tick);card.querySelector('b').textContent=d.charge?'1 ◆':Math.ceil(remaining/60)+'С';card.setAttribute('aria-label',`${LABELS[e.kind]} · ${card.querySelector('b').textContent}`);
  const age=s.tick-(e.started??-100),p=age>=0&&age<27?age/27:1,glow=p<1?Math.sin(p*Math.PI):0;
  card.dataset.pickupGlow=glow;card.style.boxShadow=e.kind==='focus'?`inset 0 0 ${7+Math.round(Math.sin(s.tick/15)*2)}px #49aca6`:glow?`inset 0 0 ${Math.round(3+glow*7)}px ${d.positive?'#d9e2a0':'#d18aab'}`:'';card.querySelector('img').style.transform=glow?`scale(${1+glow*.15})`:'';
 }
 const game=root.closest('#game'),combo=game?.querySelector('#combo')?.parentElement;if(combo){combo.style.boxShadow=has(s,'focus')?`inset 0 0 ${10+Math.round(Math.sin(s.tick/15)*2)}px #49aca6`:s.feedback.some(f=>f.kind==='seed'&&s.tick-f.tick<18)?'inset 0 0 12px #ac8c3c':'';}
}
export function drawEffectLabels(hud){
 const canvas=hud.querySelector('.hud-type');if(!canvas)return;const ctx=canvas.getContext('2d'),r=hud.getBoundingClientRect(),win=hud.ownerDocument.defaultView;
 for(const card of hud.querySelectorAll('.effect')){const box=card.getBoundingClientRect();ctx.save();ctx.beginPath();ctx.rect(box.x-r.x+2,box.y-r.y+2,box.width-4,box.height-4);ctx.clip();
  for(const n of card.querySelectorAll('span,b,i')){const b=n.getBoundingClientRect(),style=win.getComputedStyle(n),size=Math.max(1,Math.floor(parseFloat(style.fontSize)/7));ctx.clearRect(b.x-r.x,b.y-r.y,b.width,b.height);pixelText(ctx,n.textContent,Math.round(b.x-r.x+b.width/2),Math.round(b.y-r.y+(b.height-7*size)/2),size,n.matches('b')?'#fff0ba':'#e5d7ab','center');}
  if(Number(card.dataset.pickupGlow)>0){const icon=card.querySelector('img').getBoundingClientRect();drawVfx(ctx,'glint',icon.right-r.x-2,icon.y-r.y+3,10,0,Number(card.dataset.pickupGlow));}ctx.restore();
 }
}
