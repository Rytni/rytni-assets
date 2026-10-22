import {ASSET_CONTRACT,PICKUP_RULE,FOOD_RULE,VFX_ALIASES} from './asset-contract.js';
import {APPROVED_ASSETS} from './asset-approvals.js';

export function assetFrame(spec,tick=0,startTick=0,phase=0){
 const n=Math.floor(Math.max(0,tick-startTick)/spec.ticks)+Math.floor(phase);
 return spec.loop?n%spec.frames:Math.min(spec.frames-1,n);
}
function decodeImage(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Asset failed: '+url));im.src=url;});}
// One cache per immutable contract. Loading cannot advance or mutate a session.
export class AssetBank{
 constructor(contract=ASSET_CONTRACT,approved=APPROVED_ASSETS,load=decodeImage){this.contract=contract;this.approved=approved;this.load=load;this.cache=new Map();this.ready=new Map();this.errors=new Map();this.version=0;}
 preload(){return Promise.all(Object.keys(this.approved).filter(k=>this.approved[k]===true).map(k=>this.request(k)));}
 request(key){
  if(!this.contract[key]||this.approved[key]!==true)return Promise.resolve(null);
  if(!this.cache.has(key))this.cache.set(key,Promise.resolve().then(()=>this.load(this.contract[key].url)).then(im=>{
   const spec=this.contract[key];if((im.naturalWidth||im.width)!==spec.sheetWidth||(im.naturalHeight||im.height)!==spec.sheetHeight)throw Error('Invalid sheet dimensions: '+key);
   this.ready.set(key,im);this.version++;return im;
  }).catch(e=>{this.errors.set(key,e.message);return null;}));
  return this.cache.get(key);
 }
 image(key){return this.ready.get(key)||null;}
 url(key){return this.image(key)?this.contract[key].url:null;}
 draw(ctx,key,x,y,size,tick=0,{startTick=0,phase=0,opacity=1}={}){
  const im=this.image(key);if(!im)return false;
  const spec=this.contract[key],b=spec.content,scale=size/Math.max(b.w,b.h),frame=assetFrame(spec,tick,startTick,phase),anchor=spec.anchor;
  ctx.save();ctx.globalAlpha*=opacity;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(im,frame*spec.frameWidth+b.x,b.y,b.w,b.h,Math.round(x+(b.x-anchor.x)*scale),Math.round(y+(b.y-anchor.y)*scale),b.w*scale,b.h*scale);ctx.restore();return true;
 }
 drawField(ctx,kind,x,y,cell,tick=0,compact=false,rule=PICKUP_RULE){
  const box=cell*(compact?rule.mobileScale:rule.desktopScale),base=this.contract[kind+'.field@1x'];if(!base)return false;
  const footprint=box*Math.max(base.content.w,base.content.h)/Math.max(base.frameWidth,base.frameHeight),lod=footprint<rule.lodBelow;
  const key=lod&&this.image(kind+'.field-lod')?kind+'.field-lod':this.image(kind+'.idle')?kind+'.idle':kind+'.field@1x';
  return this.draw(ctx,key,x,y,Math.max(compact?rule.mobileMin:rule.desktopMin,footprint),tick);
 }
}
export const effectAssets=new AssetBank();
export function drawAuthoredVfx(ctx,kind,x,y,size,tick=0,opacity=1,startTick=0,phase=0){
 return effectAssets.draw(ctx,'vfx.'+(VFX_ALIASES[kind]||kind),x,y,size,tick,{opacity,startTick,phase});
}
export function drawAuthoredFood(ctx,kind,x,y,cell,tick,compact){return effectAssets.drawField(ctx,'food-'+kind,x,y,cell,tick,compact,FOOD_RULE);}
