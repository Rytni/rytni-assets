import test from 'node:test';
import assert from 'node:assert/strict';
import {openSponsorForClaim} from './sponsor-link.js';
import {SNAKE_SPONSOR_URL} from './backend.js';
const fixture=()=>({controller:{hub:{success:true,available:true,sponsor_attempt_available:true}},backend:{mode:'ranked',sponsorUrl:SNAKE_SPONSOR_URL}});
test('eligible click opens exact sponsor immediately with isolated opener',()=>{
 const {controller,backend}=fixture(),calls=[];
 assert.equal(openSponsorForClaim(controller,backend,(...args)=>{calls.push(args);return null;}),true);
 assert.deepEqual(calls,[[SNAKE_SPONSOR_URL,'_blank','noopener,noreferrer']]);
});
test('mock, pending, unavailable, exhausted and active play never open sponsor',()=>{
 for(const mutate of [f=>f.backend.mode='mock',f=>f.backend.sponsorUrl='https://example.invalid',f=>f.controller.pending='claim',f=>f.controller.disposed=true,f=>f.controller.hub.success=false,f=>f.controller.hub.available=false,f=>f.controller.hub.sponsor_attempt_available=false,f=>f.controller.run={}]){
  const f=fixture();mutate(f);assert.equal(openSponsorForClaim(f.controller,f.backend,()=>assert.fail('Unexpected navigation')),false);
 }
});
test('browser exception leaves the existing credit flow and manual link available',()=>{
 const f=fixture();assert.equal(openSponsorForClaim(f.controller,f.backend,()=>{throw Error('Blocked');}),false);
});
