import test from 'node:test';
import assert from 'node:assert/strict';
import {compositeSeams} from './visible-seam-qa.js';
import {drawFrame} from '../retro-v3/renderer.js';
import {FRAME_VISIBLE_TRIM,WORLD_VISIBLE_OUTER_NATIVE,jointVisibleImage} from '../retro-v3/frame-ink.js';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const image=(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});
function fill(im,x,y,w,h,rgb){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)im.data.set(rgb,(yy*im.width+xx)*4);}
function fixture(dpr=1,gap=0){const a={x:20,y:20,w:60,h:40},wood=image(100*dpr,80*dpr),wall=image(100*dpr,80*dpr),final=image(100*dpr,80*dpr);fill(final,0,0,final.width,final.height,[2,21,18,255]);
 for(const im of [wood,final]){fill(im,0,0,im.width,(20-gap)*dpr,[130,60,10,255]);fill(im,0,60*dpr,im.width,20*dpr,[130,60,10,255]);fill(im,0,20*dpr,20*dpr,40*dpr,[130,60,10,255]);fill(im,80*dpr,20*dpr,20*dpr,40*dpr,[130,60,10,255]);}
 for(const im of [wall,final])fill(im,20*dpr,20*dpr,60*dpr,40*dpr,[74,73,48,255]);return {a,wood,wall,final};}
test('final RGB gate detects padding despite fully opaque box edges',()=>{const f=fixture(1,6);for(const im of [f.wood,f.final])fill(im,20,14,60,6,[3,1,0,252]);const q=compositeSeams(f.final,f.wood,f.wall,f.a);assert.equal(q.visualGapTop,6);assert.equal(q.pass,false);});
test('occluding canvas matte is not counted as visible world ink',()=>{const f=fixture();fill(f.wood,20,20,60,5,[2,1,0,252]);fill(f.final,20,20,60,5,[3,1,0,255]);const q=compositeSeams(f.final,f.wood,f.wall,f.a);assert.equal(q.visualGapTop,5);assert.equal(q.pass,false);});
test('missing wood/world/final material rejects; scanning includes off-center faults',()=>{const f=fixture();assert.equal(compositeSeams(f.final,f.wood,image(100,80),f.a).pass,false);fill(f.final,25,20,1,5,[2,21,18,255]);const q=compositeSeams(f.final,f.wood,f.wall,f.a);assert.equal(q.visualGapTop,5);assert.equal(q.pass,false);});
test('raster gaps are normalized at DPR 1/1.5/2 and 2px tolerance is bounded',()=>{for(const d of [1,1.5,2]){const f=fixture(d,2);const q=compositeSeams(f.final,f.wood,f.wall,f.a,d);assert.equal(q.visualGapTop,2);assert.equal(q.pass,true);const b=fixture(d,4);assert.equal(compositeSeams(b.final,b.wood,b.wall,b.a,d).pass,false);}});
test('source trim preserves normal scale, old non-FIT drawing and all frame geometry except source ink trim',async()=>{
 assert.deepEqual(FRAME_VISIBLE_TRIM,{topBottom:2,bottomTop:0,leftRight:2,rightLeft:2});assert.equal(WORLD_VISIBLE_OUTER_NATIVE,49);
 const src=execFileSync('git',['show','2372446:arcade/snake-next/retro-v3/renderer.js'],{encoding:'utf8'}).replace("import {pixelText,textWidth} from './pixel-text.js';",'const pixelText=()=>{},textWidth=()=>{};'),old=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
 const names=['top','bottom','left','right','joint-left','joint-right','top-left','top-right','bottom-left','bottom-right'],images=new Map(names.map(n=>['frame-'+n,{id:n,width:512,height:28}]));images.get('frame-left').height=70;images.get('frame-right').height=70;
 const capture=(draw)=>{const calls=[];draw({drawImage:(...args)=>{const [im,...a]=args;calls.push(a.length===8?[im.id,...a.slice(4)]:[im.id,...a]);}},{images},0,100,1800,800,1.35);return calls;};assert.deepEqual(capture(drawFrame),capture(old.drawFrame));
 const path='arcade/snake-next/retro-v3/renderer.js',now=readFileSync(path,'utf8').replace(/\r\n/g,'\n'),base=execFileSync('git',['show','2372446:'+path],{encoding:'utf8'}).replace(/\r\n/g,'\n');
 const omit=s=>s.replace(/import .*frame-ink.*\n/,'').replace(/export function drawFrame[\s\S]*?(?=export function layout)/,'');assert.equal(omit(now),omit(base));
});
test('ornament trim removes edge-connected matte but preserves enclosed shadows and color bytes',()=>{
 const original=globalThis.document,pixels=image(6,6);fill(pixels,0,0,6,6,[150,90,30,255]);fill(pixels,5,0,1,6,[3,1,0,252]);fill(pixels,4,1,1,2,[10,2,0,252]);fill(pixels,2,3,1,1,[3,1,0,252]);let output;
 globalThis.document={createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:pixels.data.slice()}),putImageData:p=>{output=p;}})})};
 try{jointVisibleImage({width:6,height:6},'left');assert.equal(output.data[(1*6+4)*4+3],0);assert.equal(output.data[(3*6+2)*4+3],252);assert.deepEqual([...output.data.slice(0,4)],[150,90,30,255]);}finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});
