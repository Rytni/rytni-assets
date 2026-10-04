import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSweep,radiusAt} from '../ribbon.js';
import {frameAt} from '../fixtures.js';
import {measureSection,sampleFor,parallelClearance} from './local-validator.mjs';

const section={d:2.213636363636364,x:903.4727272727273,y:306};
test('exact reported U/alternating failure is 36 local + 9 cap, not a 45px body',()=>{
 for(const name of ['U','alternating']){
  const sweep=makeSweep(frameAt(name,2/11)),m=measureSection(sweep,sampleFor(sweep,section));
  assert.equal(m.localThickness,36);assert.equal(m.globalSpan,45);
  assert.deepEqual(m.counts,{A:36,B:0,C:9});assert.equal(m.missing,0);assert.equal(m.region,'HEAD_TRANSITION');
 }
});
function straightSweep(radius=18,second=false,separation=50){
 const line=y=>({kind:'line',a:{x:100,y},b:{x:400,y},d0:1,d1:1+300/68});
 const parts=[line(100)];if(second)parts.push({...line(100+separation),d0:20,d1:20+300/68});
 return {parts,frame:{start:0},limit:30};
}
const straightSample={x:250,y:100,d:1+150/68,dx:1,dy:0};
test('nominal straight 36 and a real same-neighbourhood 44px defect are distinguished',()=>{
 assert.equal(measureSection(straightSweep(),straightSample).localThickness,36);
 const bad=measureSection(straightSweep(),straightSample,{radius:()=>22});
 assert.equal(bad.localThickness,44);assert.ok(bad.localThickness>38);
});
test('foreign branch inflation is excluded without masking a real missing local pixel',()=>{
 const s=straightSweep(18,true,30),m=measureSection(s,straightSample);
 assert.equal(m.localThickness,36);assert.ok(m.globalSpan>36);assert.ok(m.counts.B>0);
 const gap=measureSection(straightSweep(),straightSample,{contains:(x,y)=>Math.abs(y-100)>=1&&Math.abs(y-100)<18});
 assert.equal(gap.localThickness,34);assert.equal(gap.missing,2);
});
test('nominal 68px branch spacing gives 32px surface clearance; actual overlap is rejected',()=>{
 function parallel(separation){const s=straightSweep(18,true,separation);s.parts.splice(1,0,...Array.from({length:2},()=>({kind:'arc',cx:0,cy:0,r:1,angle:0,delta:1,d0:10,d1:11})));return parallelClearance(s)[0];}
 assert.equal(parallel(68).minimumSurfaceClearance,32);
 assert.equal(parallel(68).overlap,false);assert.equal(parallel(30).minimumSurfaceClearance,-6);assert.equal(parallel(30).overlap,true);
});

test('cap profile is monotonic to radius18 and meets the body without a radius step',()=>{
 const s=makeSweep(frameAt('U',2/11));let previous=0;
 for(let i=0;i<=24;i++){
  const radius=radiusAt(s,s.frame.start-(24-i)/68);
  assert.ok(radius>=previous-1e-6&&radius<=18);previous=radius;
 }
 assert.equal(previous,18);assert.equal(radiusAt(s,s.frame.start+.0001),18);
});
