import fs from 'node:fs';
import {createRequire} from 'node:module';
import {raster,makeSweep,fieldAt} from '../ribbon.js';
import {frameAt,expand} from '../fixtures.js';
import {boardVariant} from '../../forest-training/board.js';
import {measureSection,sampleFor,pose,candidates,parallelClearance,HEAD_TRANSITION,LOCAL_THRESHOLD} from './local-validator.mjs';
const {Raster,png,decode,crop,resize}=createRequire(import.meta.url)('../../retro-v5/raster.cjs');
const old=JSON.parse(fs.readFileSync(new URL('../../../../docs/qa/smooth-v4/geometry.json',import.meta.url)));
const out=new URL('../../../../docs/qa/smooth-v4-1-validator/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const art=new URL('../../../../grib/mushroom-snake-retro-v5/',import.meta.url);
const sources=Array.from({length:8},(_,i)=>decode(fs.readFileSync(new URL('straight-0-v'+i+'.png',art))).data);
const worst=old.failures.find(r=>r.name==='U'),section=worst.sections.find(s=>s.width===45),frame=frameAt('U',worst.alpha),render=raster(frame,1224,680,sources),sweep=render.sweep;
const sample=sampleFor(sweep,section),measure=measureSection(sweep,sample,{contains:(x,y)=>!!render.mask[Math.floor(y)*1224+Math.floor(x)]});
for(const p of measure.pixels)p.retainedD=render.fields[(Math.floor(p.y)*1224+Math.floor(p.x))*2];
const rows=[];
for(const row of old.rows){
 const s=makeSweep(frameAt(row.name,row.alpha));
 const sections=row.sections.map(section=>{const m=measureSection(s,sampleFor(s,section));return {d:section.d,region:m.region,local:m.localThickness,global:m.globalSpan,missing:m.missing,counts:m.counts};});
 rows.push({name:row.name,alpha:row.alpha,sections,clearance:parallelClearance(s)});
}
const body=rows.flatMap(r=>r.sections.filter(s=>s.region==='BODY'));
const all=rows.flatMap(r=>r.sections);
// The original short U's entire opposite leg is rounded: it has no pair of
// overlapping straight parallel legs. Add a validation-only canonical U with
// long parallel legs one CELL apart to measure the 68-36 clearance directly.
const laneRoute=expand([[13,2],[13,6],[12,6],[12,2],[7,2]]);
const laneFrame={route:laneRoute,start:0,end:12,alpha:1,head:{x:13,y:2,dx:0,dy:-1}};
const clearances=parallelClearance(makeSweep(laneFrame)).filter(p=>Math.abs(p.centerlineSeparation-68)<1e-8);
// Independent self-proximity check on all 12 U frames. Multiple parameter
// neighbourhoods >= one cell apart covering the SAME pixel imply overlap.
// This is separate from clipping width scans to one local d-band.
let nonlocalOverlapPixels=0;
for(let i=0;i<12;i++){
 const s=makeSweep(frameAt('U',i/11));
 for(let y=180;y<460;y++)for(let x=760;x<960;x++){
  const a=candidates(s,x+.5,y+.5);if(a.length<2)continue;
  if(a.some((p,j)=>a.slice(j+1).some(q=>Math.abs(p.d-q.d)>=1)))nonlocalOverlapPixels++;
 }
}
const failures=body.filter(s=>s.local<35||s.local>38||s.missing);
const metrics={frames:rows.length,localThresholdNative:LOCAL_THRESHOLD*68,headTransitionNative:HEAD_TRANSITION*68,alleged45:{point:{x:sample.x,y:sample.y},alpha:worst.alpha,bodyDistance:(sample.d-frame.start)*68,region:measure.region,localThickness:measure.localThickness,globalSilhouetteSpan:measure.globalSpan,counts:measure.counts},bodyLocalRange:[Math.min(...body.map(s=>s.local)),Math.max(...body.map(s=>s.local))],globalSpanRange:[Math.min(...all.map(s=>s.global)),Math.max(...all.map(s=>s.global))],parallelClearanceFixture:'validation-only long-leg canonical U; original short U has no overlapping straight legs',UParallelCenterSeparationRange:[Math.min(...clearances.map(s=>s.centerlineSeparation)),Math.max(...clearances.map(s=>s.centerlineSeparation))],minimumUParallelClearance:Math.min(...clearances.map(s=>s.minimumSurfaceClearance)),UParallelBranchOverlaps:clearances.filter(s=>s.overlap).length,UNonlocalOverlapPixels:nonlocalOverlapPixels,bodyWidthFailures:failures.length};
const base=new Raster(1224,680),tiles=Array.from({length:6},(_,i)=>decode(fs.readFileSync(new URL('../../../../grib/mushroom-snake-forest-final-v3/tile-'+i+'.png',import.meta.url))));
function blit(dst,src,ox=0,oy=0){for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++){const k=(y*src.w+x)*4;if(src.data[k+3])dst.dot(x+ox,y+oy,Array.from(src.data.subarray(k,k+4)));}}
for(let y=0;y<10;y++)for(let x=0;x<18;x++)blit(base,tiles[boardVariant(x,y)],x*68,y*68);
blit(base,{w:1224,h:680,data:render.data});
const box={x:800,y:224,w:204,h:204},naked=crop(base,box.x,box.y,box.w,box.h),oldDiag=crop(base,box.x,box.y,box.w,box.h),corrected=crop(base,box.x,box.y,box.w,box.h);
function line(r,a,b,color){const l=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y));for(let i=0;i<=l;i++){const t=l?i/l:0;r.dot(a.x+(b.x-a.x)*t-box.x,a.y+(b.y-a.y)*t-box.y,color);}}
function geometry(r){
 for(const [index,p]of sweep.parts.entries()){let prev=pose(p,0);for(let i=1;i<=80;i++){const next=pose(p,i/80);line(r,prev,next,index===sample.primitive?'78e6ff':'cf91ed');prev=next;}}
 line(r,{x:sample.x-sample.dx*24,y:sample.y-sample.dy*24},{x:sample.x+sample.dx*24,y:sample.y+sample.dy*24},'62d9ed');
 line(r,{x:sample.x+sample.dy*52,y:sample.y-sample.dx*52},{x:sample.x-sample.dy*52,y:sample.y+sample.dx*52},'e7d153');
}
geometry(oldDiag);geometry(corrected);
for(const p of measure.pixels){oldDiag.dot(p.x-box.x,p.y-box.y,'ff625a');corrected.dot(p.x-box.x,p.y-box.y,p.type==='A'?'64ff95':p.type==='B'?'60b7ff':'ff86ed');}
for(const r of [oldDiag,corrected])r.rect(sample.x-box.x-1,sample.y-box.y-1,3,3,'ffffe5');
for(const [name,r]of [['naked',naked],['old-validator',oldDiag],['corrected-validator',corrected]]){
 fs.writeFileSync(new URL(name+'.png',out),png(r.w,r.h,r.data));const big=resize(r,r.w*4,r.h*4);fs.writeFileSync(new URL(name+'-4x.png',out),png(big.w,big.h,big.data));
}
fs.writeFileSync(new URL('metrics.json',out),JSON.stringify({metrics,measure,rows})+'\n');
const csv='x,y,normalOffset,class,localD,chosenD,nearestD,chosenPrimitive,retainedD\n'+measure.pixels.map(p=>[p.x,p.y,p.offset,p.type,p.localD,p.chosenD,p.nearestD,p.chosenPrimitive,p.retainedD].join(',')).join('\n')+'\n';
fs.writeFileSync(new URL('counted-pixels.csv',out),csv);
console.log(JSON.stringify(metrics,null,2));
