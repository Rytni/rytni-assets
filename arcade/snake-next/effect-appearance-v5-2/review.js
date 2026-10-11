import {AccentRibbon} from './material.js';
import {RibbonSprites} from '../forest-training/ribbon-sprites.js';
import {TunnelRibbon} from '../gate-one/ribbon.js';
import {CELL,makeSweep,radiusAt,samplePrimitive} from '../smooth-v4-proof/ribbon.js';
import {frameAt,expand} from '../smooth-v4-proof/fixtures.js';
import {boardVariant,loadBoard} from '../forest-training/board.js';
import {geometry} from '../forest-training/renderer.js';
import {fitWorldLayout} from '../effect-playground/fit-world.js';

const $=id=>document.getElementById(id),STATES=[['BASE',[]],['HARVEST',['harvest']],['FOCUS',['focus']],['SPORES',['spores']],['GUARD',['guard']],['PORTAL+',['portalPrize']],['RUSH',['rush']],['CORRUPTION',['weak']],['ROOTS',['brambles']],['MIST',['mist']],['FOCUS + GUARD',['focus','guard']],['HARVEST + RUSH',['harvest','rush']],['GUARD + CORRUPTION',['guard','weak']]],FIXTURES={desktop30:[1920,1080,30,12],mobile30:[844,390,30,12],mobile50:[844,390,50,20]};
const descriptions={harvest:'Ivory + выбранная золотая кромка и редкие поверхностные glints.',focus:'Ivory + тонкая холодная кромка; спокойная интенсивность.',spores:'Тело BASE. Только 2–3 мягкие моты/магнитная реакция при взаимодействии.',guard:'Тело BASE. Полупрозрачная короткая оболочка следует полю головы/шеи, не круг и не плавающая иконка.',portalPrize:'Ivory + редкие travelling violet/cyan акценты.',rush:'Ivory + янтарная dorsal lane и подчинённый непрерывный след текущего V4-пути.',weak:'Ivory + локальные приглушённые трещины, без общей пурпурной заливки.',brambles:'Тело BASE. Корни остаются мировым hazard; новый skin не нужен.',mist:'Тело BASE. Туман только в мире; halo/cutout не добавляется.'};
let kinds=[],tick=20,playing=false,interactionAt=-1000;
for(const [label,ks]of STATES){const b=document.createElement('button');b.textContent=label;b.dataset.kinds=ks.join(',');b.addEventListener('click',()=>set({kinds:ks,tick:0}));$('states').append(b);}
const images=new Map();await Promise.all(Array.from({length:8},async(_,i)=>{const im=new Image();im.src='/grib/mushroom-snake-retro-v5/straight-0-v'+i+'.png';await im.decode();images.set('straight-0-v'+i,im);}));
const load=async name=>{const im=new Image();im.src='/grib/mushroom-snake-effects-v1/assets/vfx/'+name+'.png';await im.decode();return im;};
const art={images,board:await loadBoard()},baseV4=new RibbonSprites(art),activeV4=new AccentRibbon(art),base=new TunnelRibbon(baseV4),active=new TunnelRibbon(activeV4),spore=await load('spore-idle'),glint=await load('harvest-sparkle');
const shell=document.createElement('canvas'),shellCtx=shell.getContext('2d'),wake=document.createElement('canvas'),wakeCtx=wake.getContext('2d');
const loop=expand([[25,3],[4,3],[4,8],[25,8],[25,3]]),period=loop.length-1,route=[...loop.slice(0,-1),...loop.slice(0,-1),...loop];
function movingFrame(){const start=period+10-tick/10%period,i=Math.floor(start),a=route[i],b=route[i+1],t=start-i;return {route,start,end:start+7,alpha:t,head:{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,dx:a.x-b.x,dy:a.y-b.y},moves:tick/10,length:8};}
// Cosmetic Guard shell is sampled from the UNCHANGED leading field. Native
// alpha is a separate short VFX layer, never collision/primary ribbon alpha.
function guardShell(ctx,frame,cell,strength){
 if(!strength)return;const sweep=makeSweep(frame),cx=sweep.hx,cy=sweep.hy,ox=Math.floor(cx-90),oy=Math.floor(cy-90),size=180;
 shell.width=shell.height=size;const im=shellCtx.createImageData(size,size),age=tick-interactionAt,breakPhase=age>=0&&age<30?age/30:0,expand=breakPhase*5;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let q=null;for(const p of sweep.parts){const a=samplePrimitive(p,x+ox+.5,y+oy+.5);if(!a||a.d>frame.start+.6||a.d<frame.start-24/CELL)continue;if(!q||Math.abs(a.v)<Math.abs(q.v))q=a;}if(!q)continue;
  const r=radiusAt(sweep,q.d),edge=Math.abs(q.v)-r,fade=Math.max(0,Math.min(1,(frame.start+.6-q.d)/.25));if(edge<0||edge>5+expand)continue;
  const rim=edge>3+expand,crack=breakPhase&&((Math.floor(q.d*57+q.v*1.2)%17+17)%17<2),n=(y*size+x)*4;
  const c=rim?[221,202,137]:[74,180,163];im.data[n]=c[0];im.data[n+1]=c[1];im.data[n+2]=c[2];im.data[n+3]=crack?0:Math.round((rim?125:48)*strength*fade*(1-breakPhase)*(.88+.12*Math.sin(tick/27)));
 }
 shellCtx.putImageData(im,0,0);ctx.drawImage(shell,ox/CELL*cell,oy/CELL*cell,size/CELL*cell,size/CELL*cell);
}
function draw(){
 const [w,h,width,height]=FIXTURES[$('fixture').value],mobile=h<500,frame=$('pose').value==='moving'?movingFrame():frameAt($('pose').value,.5,8),dx=(width-30)/2,dy=(height-12)/2;
 frame.route=frame.route.map(p=>({x:p.x+dx,y:p.y+dy}));frame.head={...frame.head,x:frame.head.x+dx,y:frame.head.y+dy};
 const session={tick,state:{seed:18},world:{width,height},effects:kinds.map(kind=>({kind,started:0,ends:1e8}))};activeV4.setSession(session);
 const cell=fitWorldLayout(geometry(w,h,28,12,true,mobile),session,frame,true).layout.cell,cw=Math.round(width*cell),ch=Math.round(height*cell),view={x:0,y:0,cols:width,rows:height};
 let activeCtx;
 for(const [id,ribbon]of [['base',base],['active',active]]){
  const canvas=$(id);canvas.width=cw;canvas.height=ch;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)ctx.drawImage(art.board[boardVariant(x,y)],Math.round(x*cell),Math.round(y*cell),Math.round((x+1)*cell)-Math.round(x*cell),Math.round((y+1)*cell)-Math.round(y*cell));
  if(id==='active'&&kinds.includes('rush')){wake.width=cw;wake.height=ch;wakeCtx.clearRect(0,0,cw,ch);base.draw(wakeCtx,frame,cell,0,0,view);wakeCtx.globalCompositeOperation='source-in';wakeCtx.fillStyle='#c69b56';wakeCtx.fillRect(0,0,cw,ch);wakeCtx.globalCompositeOperation='source-over';ctx.save();ctx.globalAlpha=.08*activeV4.material.strengths.rush;ctx.drawImage(wake,-frame.head.dx*cell*.06,-frame.head.dy*cell*.06);ctx.restore();}
  ribbon.draw(ctx,frame,cell,0,0,view);
  if(id==='active'){guardShell(ctx,frame,cell,activeV4.material.strengths.guard);activeCtx=ctx;}
 }
 const age=tick-interactionAt;if(age>=0&&age<30&&kinds.some(k=>['spores','harvest','portalPrize'].includes(k))){const sprite=kinds.includes('spores')?spore:glint;for(let j=0;j<3;j++){const progress=age/30,angle=j*2.09,dist=(1-progress)*cell*.5,x=(frame.head.x+.5)*cell+Math.cos(angle)*dist,y=(frame.head.y+.5)*cell+Math.sin(angle)*dist;activeCtx.save();activeCtx.globalAlpha=Math.sin(progress*Math.PI)*.4;activeCtx.drawImage(sprite,Math.floor(tick/6)%4*32,0,32,32,x-5,y-5,10,10);activeCtx.restore();}}
 $('active-title').textContent='ACTIVE · '+(kinds.join(' + ')||'BASE');$('description').textContent=kinds.map(k=>descriptions[k]).join(' ');$('metrics').textContent=`${w}×${h} · ${width}×${height} · BODY ${(cell*36/68).toFixed(2)} CSS px · tick ${tick} · ${playing?'LIVE':'PAUSE'} · face/cap/moss unchanged`;
 for(const b of $('states').children)b.setAttribute('aria-pressed',String(b.dataset.kinds===kinds.join(',')));
 window.effectAppearanceV52.metrics={fixture:$('fixture').value,pose:$('pose').value,tick,kinds,cell,body:cell*36/68,paused:!playing,frame};
}
function set({fixture,pose,kinds:ks,tick:age,paused=true}={}){if(fixture)$('fixture').value=fixture;if(pose)$('pose').value=pose;if(ks){kinds=ks;activeV4.material.tracks.clear();activeV4.material.key='';}if(age!==undefined)tick=age;playing=!paused;draw();return window.effectAppearanceV52.metrics;}
window.effectAppearanceV52={ready:true,set,draw,baseV4,activeV4,get frame(){return this.metrics.frame;},get state(){return {tick,kinds};}};
for(const id of ['fixture','pose'])$(id).addEventListener('change',draw);
$('play').addEventListener('click',()=>{playing=!playing;$('play').textContent=playing?'Пауза':'Запустить';});$('interaction').addEventListener('click',()=>{interactionAt=tick;playing=true;$('play').textContent='Пауза';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)playing=false;});
// Only the standalone proof owns this timer. Simulation/runtime untouched.
setInterval(()=>{if(playing){tick++;draw();}},1000/60);draw();
