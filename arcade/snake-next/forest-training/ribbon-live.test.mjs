import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {ribbonFrame,ribbonBounds} from './ribbon-sprites.js';
import {RibbonRaster} from './ribbon-raster.js';
import {SnakeMotion} from './motion.js';
import {CELL,makeSweep,fieldAt,raster} from '../smooth-v4-proof/ribbon.js';
import {frameAt} from '../smooth-v4-proof/fixtures.js';
import {labSession} from '../tuning-lab/session.js';
import {PRESETS} from '../tuning-lab/config.js';
import {loopFixture,cycle,directionBetween} from '../tests/fixtures.js';
import {createState} from '../entry.js';
import {bodyCell} from '../simulation/body.js';

test('V4 geometry/material and V2 motion stay unchanged; only a read-only material export is added',()=>{
 for(const [ref,path] of [['f4c4985','smooth-v4-proof/ribbon.js'],['86379ba','forest-training/motion.js'],['86379ba','forest-training/smooth-sprites.js'],['86379ba','forest-training/tube-path.js']]){
  const file='arcade/snake-next/'+path;
  const source=readFileSync(file,'utf8').replace(/\r\n/g,'\n').replace(/\/\/ Read-only integration hooks\.[\s\S]*?export \{material\};\n?$/,'');
  assert.equal(source,execFileSync('git',['show',ref+':'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n'));
 }
});
test('adapter changes only view origin, retaining canonical distances, alpha and head direction',()=>{
 const s=labSession(PRESETS.B),m=new SnakeMotion(s),f=m.frame(s),before=JSON.stringify(f),mapped=ribbonFrame(f,{x:3,y:2});
 assert.equal(JSON.stringify(f),before);
 assert.equal(mapped.start,f.start);assert.equal(mapped.end,f.end);assert.equal(mapped.alpha,f.alpha);
 assert.deepEqual(mapped.head,{...f.head,x:f.head.x-3,y:f.head.y-2});
 for(let i=0;i<f.route.length;i++)assert.deepEqual(mapped.route[i],{x:f.route[i].x-3,y:f.route[i].y-2});
 const a=makeSweep(f),b=makeSweep(mapped);
 for(let y=0;y<68;y+=3)for(let x=0;x<68;x+=3){const q=fieldAt(a,a.hx+x-34,a.hy+y-34),r=fieldAt(b,b.hx+x-34,b.hy+y-34);assert.deepEqual(r,q);}
});
test('bounded live raster is byte-identical to the original V4 raster, including cropped viewport',()=>{
 const {decode}=createRequire(import.meta.url)('../retro-v5/raster.cjs'),sources=Array.from({length:8},(_,i)=>decode(readFileSync(new URL('../../../grib/mushroom-snake-retro-v5/straight-0-v'+i+'.png',import.meta.url))).data);
 const live=new RibbonRaster(sources);
 for(const name of ['straight','up','down','U','S','alternating','growth','length30'])for(const alpha of [0,2/11,.5,1]){
  const f=frameAt(name,alpha),w=18*CELL,h=10*CELL,full=raster(f,w,h,sources),box=ribbonBounds(f,18,10),part=live.render(ribbonFrame(f,box),box.cols*CELL,box.rows*CELL);
  for(let y=0;y<h;y++){
   const expected=new Uint8ClampedArray(w*4);
   if(y>=box.y*CELL&&y<(box.y+box.rows)*CELL)expected.set(part.data.subarray((y-box.y*CELL)*part.w*4,(y-box.y*CELL+1)*part.w*4),box.x*CELL*4);
   assert.deepEqual(expected,full.data.subarray(y*w*4,(y+1)*w*4),name+' alpha '+alpha+' row '+y);
  }
 }
});
test('V4/V2/GRID reads preserve B replay and collision hashes at lengths 8/30/250, including growth and rapid turns',()=>{
 for(const length of [8,30,250]){
  const f=loopFixture(length),path=cycle(14,20,7,2,96),offset=40;
  const sessions=Array.from({length:3},()=>{
   const s=labSession(PRESETS.B,{arena:f.arena,rules:f.rules});s.state=createState({seed:123,arena:f.arena,rules:f.rules,body:Array.from({length},(_,i)=>path[(offset-i+path.length)%path.length]),direction:directionBetween(path[offset],path[(offset+1)%path.length],96),food:path[(offset+1)%path.length]});return s;
  });
  const motions=sessions.map(s=>new SnakeMotion(s));
  for(let tick=0;tick<300;tick++){
   const s=sessions[0],head=bodyCell(s.state,0),i=path.indexOf(head),direction=directionBetween(head,path[(i+1)%path.length],96);
   const commands=s.state.movePhase>=s.cadence()-1?[{tick:1,sequence:tick+1,direction}]:[];
   sessions.forEach((s,i)=>{s.advance(commands);motions[i].capture(s);const hash=s.hash();const frame=motions[i].frame(s,.4);if(i===0)makeSweep(ribbonFrame(frame));else if(i===1)makeSweep(frame);assert.equal(s.hash(),hash);});
   assert.equal(new Set(sessions.map(s=>s.hash())).size,1);
   assert.equal(new Set(sessions.map(s=>JSON.stringify(s.replay))).size,1);
  }
  assert.ok(sessions[0].foods>=1);assert.equal(sessions[0].status,'playing');
 }
});
test('live field/material cache stays pixel-identical across committed history shifts and growth',()=>{
 const {decode}=createRequire(import.meta.url)('../retro-v5/raster.cjs'),sources=Array.from({length:8},(_,i)=>decode(readFileSync(new URL('../../../grib/mushroom-snake-retro-v5/straight-0-v'+i+'.png',import.meta.url))).data),live=new RibbonRaster(sources);
 const f=loopFixture(30),path=cycle(14,20,7,2,96),offset=40,s=labSession(PRESETS.B,{arena:f.arena,rules:f.rules});
 s.state=createState({seed:123,arena:f.arena,rules:f.rules,body:Array.from({length:30},(_,i)=>path[(offset-i+path.length)%path.length]),direction:directionBetween(path[offset],path[(offset+1)%path.length],96),food:path[(offset+1)%path.length]});const m=new SnakeMotion(s);
 for(let tick=0;tick<220;tick++){
  const head=bodyCell(s.state,0),i=path.indexOf(head),direction=directionBetween(head,path[(i+1)%path.length],96);
  s.advance(s.state.movePhase>=s.cadence()-1?[{tick:1,sequence:tick+1,direction}]:[]);m.capture(s);
  if(tick%14!==8)continue;
  const frame=m.frame(s,.3),box=ribbonBounds(frame,28,12),mapped=ribbonFrame(frame,box),expected=raster(mapped,box.cols*CELL,box.rows*CELL,sources),actual=live.render(mapped,expected.w,expected.h);
  assert.deepEqual(actual.mask,expected.mask);assert.deepEqual(actual.data,expected.data);
 }
 assert.ok(s.foods>=1);
});
