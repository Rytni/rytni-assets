import {geometry} from '/arcade/snake-next/forest-training/renderer.js';
import {fitWorldLayout} from '/arcade/snake-next/effect-playground/fit-world.js';
import {PICKUP_RULE} from '/arcade/snake-next/effect-playground/asset-contract.js';
import {WORLDS} from '/arcade/snake-next/effect-playground/capacity-model.js';
const names=['harvest','focus','spores','guard','portal-plus','rush','corruption','roots','mist'];
const root='/grib/mushroom-snake-effects-v1/assets/';
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(src));im.src=src;});
function ink(im){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const a=x.getImageData(0,0,c.width,c.height).data;let l=c.width,t=c.height,r=-1,b=-1;for(let y=0;y<c.height;y++)for(let p=0;p<c.width;p++)if(a[(y*c.width+p)*4+3]){l=Math.min(l,p);r=Math.max(r,p);t=Math.min(t,y);b=Math.max(b,y);}return {x:l,y:t,w:r-l+1,h:b-t+1};}
const [width,height]=WORLDS[0];
function cell(w,h){return fitWorldLayout(geometry(w,h,width,height,false,h<500),{world:{width,height},tick:0,state:{cadence:14,movePhase:0}},{head:{x:15,y:5},alpha:0}).layout.cell;}
const cells={desktop:cell(1920,1080),mobile:cell(844,390)};
function presentation(field,lod,mobile){const b=ink(field),c=cells[mobile?'mobile':'desktop'];const natural=c*(mobile?PICKUP_RULE.mobileScale:PICKUP_RULE.desktopScale)*Math.max(b.w,b.h)/64;const low=natural<PICKUP_RULE.lodBelow,im=low?lod:field,bounds=ink(im),footprint=Math.max(mobile?PICKUP_RULE.mobileMin:PICKUP_RULE.desktopMin,natural),s=footprint/Math.max(bounds.w,bounds.h);return {im,b:bounds,w:bounds.w*s,h:bounds.h*s,footprint,low};}
function runtime(p){const c=document.createElement('canvas');c.width=p.b.w;c.height=p.b.h;c.style.width=p.w+'px';c.style.height=p.h+'px';c.getContext('2d').drawImage(p.im,p.b.x,p.b.y,p.b.w,p.b.h,0,0,p.b.w,p.b.h);return c;}
function sample(label,child,size=''){const col=document.createElement('div');const text=document.createElement('div');text.className='label';text.textContent=label;const box=document.createElement('div');box.className='sample '+size;box.append(child);col.append(text,box);return col;}
function preview(im,n){const v=im.cloneNode();v.width=v.height=n;return v;}
function idle(name,big=false){const el=document.createElement('div');el.className='idle'+(big?' big':'');el.style.backgroundImage=`url('${root}effects/${name}-idle.png')`;return el;}
const metrics=[];
try{
for(const name of names){
 const [f,l,h,sheet]=await Promise.all(['field','lod','hud','idle'].map(s=>load(root+'effects/'+name+'-'+s+'.png')));
 const row=document.createElement('section');row.className='row';row.dataset.effect=name;const title=document.createElement('strong');title.textContent=name;row.append(title);
 row.append(sample('FIELD · 64×64',preview(f,64)),sample('FIELD · ×4',preview(f,256),'large'),sample('LOD · 24×24',preview(l,24)),sample('LOD · ×4',preview(l,96)),sample('HUD · 32×32',preview(h,32)),sample('HUD · ×4',preview(h,128),'medium'),sample('IDLE · 64 px',idle(name)),sample('IDLE · ×4',idle(name,true),'large'));
 const d=presentation(f,l,false),m=presentation(f,l,true);row.append(sample(`Desktop · ${d.footprint.toFixed(1)} px`,runtime(d)),sample(`Mobile · ${m.footprint.toFixed(1)} px`,runtime(m)));
 const floor=sample('Actual Forest floor',runtime(d));floor.lastChild.classList.add('floor');floor.lastChild.style.setProperty('--cell',cells.desktop+'px');row.append(floor);document.querySelector('#rows').append(row);
 const b=ink(f);metrics.push({name,field:b,desktop:{w:d.w,h:d.h,footprint:d.footprint,lod:d.low},mobile:{w:m.w,h:m.h,footprint:m.footprint,lod:m.low}});
 const tr=document.createElement('tr');for(const v of [name,`${b.w}×${b.h}`,`${d.w.toFixed(2)}×${d.h.toFixed(2)}`,`${m.w.toFixed(2)}×${m.h.toFixed(2)}`,m.low?'24 px LOD':'64 px FIELD']){const td=document.createElement('td');td.textContent=v;tr.append(td);}document.querySelector('#metrics tbody').append(tr);
}
for(const name of ['golden','corrupted']){const article=document.createElement('article');const title=document.createElement('h3');title.textContent=name+' food';article.append(title);for(const [role,n] of [['field',48],['lod',24]]){const im=await load(root+'food/'+name+'-'+role+'.png');article.append(sample(`${role} native · ${n}×${n}`,preview(im,n)),sample(`${role} ×4`,preview(im,n*4)));}document.querySelector('#food').append(article);}
window.reviewMetrics={world:{width,height},cells,objects:metrics};window.reviewReady=true;document.querySelector('#status').textContent='40 PNGs loaded · awaiting human review';
document.querySelector('#scale').append(` Cell: desktop ${cells.desktop.toFixed(2)} px; mobile ${cells.mobile.toFixed(2)} px.`);
}catch(error){document.querySelector('#status').textContent=error.message;throw error;}
document.querySelector('#pause').onclick=()=>{document.body.classList.toggle('paused');document.querySelector('#pause').textContent=document.body.classList.contains('paused')?'Resume idle previews':'Pause idle previews';};
