import {pixelText} from '../retro-v5/pixel-text.js';

// Presentation only. Logical ownership, collision and simulation coordinates do not change.
const definition=(visualScale)=>Object.freeze({visualScale,anchor:Object.freeze([.5,.5]),offset:Object.freeze([0,0])});
export const OBJECTS=Object.freeze({
 'food-red':definition(.70),'food-gold':definition(.70),
 positive:definition(.96),negative:definition(.86),stone:definition(.94),portal:definition(1)
});
let promise;
export function loadObjects(){return promise ||= (async()=>{
 const images=new Map();await Promise.all(['food-red','food-gold','food-pop'].map(async key=>{const image=new Image();image.src=`/grib/mushroom-snake-forest-food/${key}.png`;await image.decode();images.set(key,image);}));
 return {images,bytes:[...images.values()].reduce((n,im)=>n+im.width*im.height*4,0)};
})();}
export function objectImage(art,key){return art.objects?.images.get(key)||art.images.get(key);}
export function objectRect(image,key,x,y,cell){
 const {visualScale,anchor,offset}=OBJECTS[key],scale=cell*visualScale/Math.max(image.width,image.height),w=image.width*scale,h=image.height*scale;
 // Quantize position only. Independent destination width/height rounding would
 // reintroduce unequal X/Y scales on small/mobile sprites.
 return {x:Math.round(x+offset[0]*cell-w*anchor[0]),y:Math.round(y+offset[1]*cell-h*anchor[1]),w,h,scale,visualScale};
}
export function drawObject(ctx,art,key,x,y,cell){const im=objectImage(art,key),r=objectRect(im,key,x,y,cell);ctx.drawImage(im,r.x,r.y,r.w,r.h);return r;}
export function foodKey(effects,tick){return effects.some(e=>e.kind==='harvest'&&e.ends>tick)?'food-gold':'food-red';}
export function foodBob(tick,cell){return Math.round(Math.sin(tick/60*.9)*Math.min(2,cell*.04));}
export const FOOD_POP_SECONDS=.30;
export function drawFoodFeedback(ctx,art,fx,age,p,cell){
 if(age<0||age>=FOOD_POP_SECONDS)return;
 const im=objectImage(art,'food-pop');
 if(im&&age<.18){const frame=Math.min(3,Math.floor(age/.045)),size=cell*.72;ctx.drawImage(im,frame*48,0,48,48,Math.round(p.x-size/2),Math.round(p.y-size/2),size,size);}
 if(fx.amount&&age>.04)pixelText(ctx,'+'+fx.amount,Math.round(p.x),Math.round(p.y-cell*(.55+age*.5)),Math.max(1,Math.floor(cell/25)),'#f3df9e','center');
}
