import {raster} from './ribbon.js';
import {frameAt,names} from './fixtures.js';
import {loadBoard,boardVariant} from '../forest-training/board.js';
import {SmoothSprites} from '../forest-training/smooth-sprites.js';
const canvas=document.querySelector('#proof'),ctx=canvas.getContext('2d'),select=document.querySelector('#shape'),slider=document.querySelector('#alpha'),state=document.querySelector('#state');
for(const n of names){const o=document.createElement('option');o.value=n;o.textContent=n;select.append(o);}select.value='up';
async function image(url){const i=new Image();i.src=url;await i.decode();return i;}
const keys=['head-0-v0','terminal-0-v0',...Array.from({length:8},(_,i)=>'straight-0-v'+i)];
const images=new Map(await Promise.all(keys.map(async k=>[k,await image('/grib/mushroom-snake-retro-v5/'+k+'.png')])));
const sources=Array.from({length:8},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=68;const x=c.getContext('2d');x.drawImage(images.get('straight-0-v'+i),0,0);return x.getImageData(0,0,68,68).data;});
const board=await loadBoard(),floor=document.createElement('canvas');floor.width=canvas.width;floor.height=canvas.height;
const fctx=floor.getContext('2d');fctx.imageSmoothingEnabled=false;
for(let y=0;y<10;y++)for(let x=0;x<18;x++)fctx.drawImage(board[boardVariant(x,y)],x*68,y*68);
const ink=document.createElement('canvas');ink.width=canvas.width;ink.height=canvas.height;const ictx=ink.getContext('2d');
let last=null,elapsed=0,started=0,playing=false,raf=0;
function render(name=select.value,alpha=Number(slider.value)){
 const frame=frameAt(name,alpha),r=raster(frame,canvas.width,canvas.height,sources);last={frame,r,name,alpha};
 ictx.putImageData(new ImageData(r.data,r.w,r.h),0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(floor,0,0);ctx.drawImage(ink,0,0);
 state.textContent=`${name} · path progress ${alpha.toFixed(3)} · cell 68`;return last;
}
function loop(t){if(!playing)return;elapsed=t-started;const p=Math.min(1,elapsed/6000);render(select.value,-1+3*p);if(p<1)raf=requestAnimationFrame(loop);else{playing=false;state.textContent+=' · STOP';}}
function start(){cancelAnimationFrame(raf);elapsed=0;started=performance.now();playing=true;raf=requestAnimationFrame(loop);}
document.querySelector('#play').onclick=start;
document.querySelector('#pause').onclick=()=>{if(playing){playing=false;cancelAnimationFrame(raf);}else if(elapsed<6000){started=performance.now()-elapsed;playing=true;raf=requestAnimationFrame(loop);}};
slider.oninput=()=>{playing=false;cancelAnimationFrame(raf);render();};select.onchange=()=>{playing=false;cancelAnimationFrame(raf);elapsed=0;render();};
window.addEventListener('pagehide',()=>{playing=false;cancelAnimationFrame(raf);},{once:true});
function cropCurrent(w=272,h=204){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const p=last.frame.head;x.drawImage(canvas,Math.floor((p.x+.5)*68-w*.6),Math.floor((p.y+.5)*68-h*.5),w,h,0,0,w,h);return c;}
async function captures(){
 playing=false;cancelAnimationFrame(raf);const result={};
 render('straight',.55);result['straight.png']=cropCurrent(408,204).toDataURL();
 for(const [name,file]of [['up','turn.png'],['U','U.png'],['S','S.png']]){
  const c=document.createElement('canvas');c.width=12*272;c.height=228;const x=c.getContext('2d');x.font='12px monospace';x.fillStyle='#10251f';x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<12;i++){render(name,i/11);x.drawImage(cropCurrent(),i*272,24);x.fillStyle='#f5e9cc';x.fillText('α '+(i/11).toFixed(3),i*272+8,16);}result[file]=c.toDataURL();
 }
 render('up',6/11);const frame=last.frame,h=frame.head,before=new SmoothSprites({images}),c=document.createElement('canvas');c.width=1224;c.height=228;const x=c.getContext('2d');x.fillStyle='#10251f';x.fillRect(0,0,1224,228);x.font='14px monospace';
 const sx=Math.floor((h.x+.5)*68-244),sy=Math.floor((h.y+.5)*68-102);
 ctx.drawImage(floor,0,0);before.draw(ctx,frame,68,0,0);x.drawImage(canvas,sx,sy,408,204,0,24,408,204);
 const v3=await image('/docs/qa/smooth-v3/body-composite.png');x.drawImage(v3,408,24);
 render('up',6/11);x.drawImage(canvas,sx,sy,408,204,816,24,408,204);
 for(const [i,label]of ['Smooth V2 (actual)','V3 concept (not gameplay)','Unified Ribbon V4'].entries()){x.fillStyle='#f5e9cc';x.fillText(label,i*408+10,17);}result['comparison.png']=c.toDataURL();before.release();return result;
}
window.ribbonProof={render,captures,raster,frameAt,sources,get last(){return last;},get playing(){return playing;}};
render();
