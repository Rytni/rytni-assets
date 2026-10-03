// Stable world-coordinate selection: four common surfaces, subtle light/dark,
// 1% patina and 1% wear. No time, camera, resize or RNG session dependency.
import {hash} from '../retro-v5/material.mjs';
let promise;
export function loadBoard(){return promise ||= (async()=>{
 const names=[...Array.from({length:8},(_,i)=>'tile-'+i),'module','pause','fullscreen'];
 const images=await Promise.all(names.map(async name=>{const image=new Image();image.src=`/grib/mushroom-snake-forest-cabinet-v2/${name}.png`;await image.decode();return image;}));
 return images.slice(0,8);
})();}
export function boardVariant(x,y){const n=hash(x+4096*y),p=n%100;return p===0?6:p===1?7:p<9?4:p<17?5:(n>>>12)%4;}
