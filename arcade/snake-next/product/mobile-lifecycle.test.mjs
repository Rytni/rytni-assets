import test from 'node:test';
import assert from 'node:assert/strict';
import {createMobileLifecycle} from './mobile-lifecycle.js';
test('valid landscape toolbar resize never suspends or pauses',()=>{
 let stops=0,pauses=0;const l=createMobileLifecycle({invalid:()=>null,suspend:()=>stops++,resume:()=>{},pause:()=>pauses++});
 for(let i=0;i<100;i++)l.check('orientation-portrait');assert.equal(stops,0);assert.equal(pauses,0);
});
test('transient invalid state holds clock then resumes, no pause',()=>{
 let invalid=true,callback,stops=0,resumes=0,pauses=0;
 const l=createMobileLifecycle({invalid:()=>invalid?'fullscreen-exit':null,suspend:()=>stops++,resume:()=>resumes++,pause:()=>pauses++,setTimer:f=>(callback=f,1),clearTimer:()=>{}});
 l.check('fullscreen-exit');assert.equal(stops,1);invalid=false;callback();assert.equal(resumes,1);assert.equal(pauses,0);assert.equal(l.held,false);
});
test('persistent portrait pauses once after clock hold; cancel disposes timer',()=>{
 let callback,reason,stops=0,cleared=0;const l=createMobileLifecycle({invalid:()=> 'orientation-portrait',suspend:()=>stops++,resume:()=>assert.fail(),pause:r=>reason=r,setTimer:f=>(callback=f,1),clearTimer:()=>cleared++});
 l.check('orientation-portrait');l.check('orientation-portrait');assert.equal(stops,1);assert.equal(cleared,1);assert.equal(reason,undefined);callback();assert.equal(reason,'orientation-portrait');
 l.check('orientation-portrait');l.dispose();assert.equal(l.held,false);assert.equal(cleared,2);
});
