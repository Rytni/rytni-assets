// Stable world-coordinate selection: two quiet bases, subtle light/dark,
// 1% patina and 1% wear. No time, camera, resize or RNG session dependency.
import {hash} from '../retro-v5/material.mjs';
let promise;
export function loadBoard(){return promise ||= (async()=>{
 const names=[...Array.from({length:6},(_,i)=>'tile-'+i),'module','pause','fullscreen','dpad-normal','dpad-pressed'];
 const images=await Promise.all(names.map(async name=>{const image=new Image();image.src=`/grib/mushroom-snake-${name==='module'?'forest-cabinet-v2':'forest-final-v3'}/${name}.png`;await image.decode();return image;}));
 return images.slice(0,6);
})();}
export function boardVariant(x,y){const n=hash(x+4096*y),p=n%100;return p===0?4:p===1?5:p<18?2:p<34?3:(n>>>12)%2;}
