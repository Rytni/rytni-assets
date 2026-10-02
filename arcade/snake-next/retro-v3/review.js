import {loadKit,paintScene,paintSheet,pixelQA,fixture} from './renderer.js';
const query=new URLSearchParams(location.search),stage=document.querySelector('#stage'),canvas=document.querySelector('#proof'),ctx=canvas.getContext('2d'),hits=document.querySelector('#hits');
const sheet=query.get('sheet');document.body.classList.toggle('embedded',query.has('embedded'));document.body.classList.toggle('capture',query.has('capture'));document.body.classList.toggle('sheet',!!sheet);
let paused=false,pressed='',frame=0,time=0,last=null;
const kit=await loadKit();document.querySelector('#loading').hidden=true;
function hit(label,r,onClick){const b=document.createElement('button');b.className='hit';b.setAttribute('aria-label',label);Object.assign(b.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});b.addEventListener('click',onClick);hits.append(b);return b;}
function controls(l){hits.replaceChildren();if(sheet)return;
 hit('Pause visual animation',{x:l.w*.84,y:3,w:l.w*.08,h:l.header-3},()=>{paused=!paused;render();});
 hit('Fullscreen proof',{x:l.w*.92,y:3,w:l.w*.08,h:l.header-3},async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();});
 for(const r of l.dpad){const b=hit('Preview '+r.name+' touch button',r,()=>{});b.addEventListener('pointerdown',()=>{pressed=r.name;render();});for(const event of ['pointerup','pointercancel','pointerleave'])b.addEventListener(event,()=>{pressed='';render();});}
}
function render(){const box=stage.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),w=box.width,h=box.height;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 if(sheet)paintSheet(ctx,kit,w,h,sheet,time);else{last=paintScene(ctx,kit,w,h,time,{pressed});}
 return last;
}
function resize(){render();if(last)controls(last);}
new ResizeObserver(resize).observe(stage);resize();
function loop(t){if(!paused&&!query.has('capture'))time=t;if(!sheet||!query.has('capture'))render();frame=requestAnimationFrame(loop);}
if(!query.has('capture'))frame=requestAnimationFrame(loop);
window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
window.retroV3={ready:true,kit,render,freeze(t=180){paused=true;time=t;render();},pixelQA:()=>pixelQA(kit),metrics:()=>({rasterBytes:kit.bytes,backingBytes:canvas.width*canvas.height*4,dpr:Math.min(2,devicePixelRatio||1),layout:last,resources:performance.getEntriesByType('resource').filter(r=>r.name.includes('/mushroom-snake-retro-v3/')).length}),
 async benchmark(length=1200,samples=120){paused=true;const cells=fixture(length,'parallel'),values=[];for(let i=0;i<samples+20;i++){await new Promise(requestAnimationFrame);ctx.setTransform(1,0,0,1,0,0);const v=paintScene(ctx,kit,1366,768,180,{cells}).totalMs;if(i>=20)values.push(v);}values.sort((a,b)=>a-b);render();return {length,samples,p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],max:values.at(-1)};}
};
