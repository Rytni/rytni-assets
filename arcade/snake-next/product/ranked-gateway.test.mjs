import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../test-host.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('async function snakeRanked'),html.indexOf(' function pseudoFullscreen'));
function gateway(){
 let profile={id:'linked-owner'},reply={success:true};const calls=[];
 const context={window:{RYTNI_RELEASE:'test-release'},snakeRelease:()=> 'test-release',player:()=>profile,snakeParticipant:'linked-owner',getClientToken:()=> 'parent-private-token',callSupabaseRpc:async(...args)=>{calls.push(args);return typeof reply==='function'?reply():reply;}};
 vm.createContext(context);vm.runInContext(source+';globalThis.gateway=snakeRanked;',context);
 return {call:context.gateway,calls,setProfile:p=>profile=p,setReply:r=>reply=r};
}
test('gateway fixes identity/release/token; never accepts arbitrary RPC or participant',async()=>{
 const g=gateway();await g.call('hub');assert.equal(g.calls[0][0],'get_snake_product_hub_v1');assert.equal(g.calls[0][1].p_participant_id,'linked-owner');
 await g.call('start',{release:'test-release',requestId:'once',p_participant_id:'attacker',p_client_token:'forged'});
 const args=g.calls[1];assert.equal(args[0],'start_snake_product_attempt_v1');assert.equal(args[1].p_participant_id,'linked-owner');assert.equal(args[1].p_client_token,'parent-private-token');assert.equal(args[5],false);
 assert.equal((await g.call('claim_browser_arcade_sponsor_attempt_v21536')).success,false);
 assert.equal((await g.call('start',{release:'stale'})).status,'release_mismatch');assert.equal(g.calls.length,2);
});
test('gateway whitelists canonical audit, and account changes discard stale results',async()=>{
 const g=gateway();await g.call('finish',{release:'test-release',attempt_id:'a',score:500,duration_ms:1000,active_ticks:60,seed:17,final_hash:'abcd',foods:1,audit:{admin:true},unknown:'omit'});
 const args=g.calls[0][1];assert.equal(args.p_ticks,60);assert.deepEqual(JSON.parse(JSON.stringify(args.p_audit)),{foods:1,seed:17,final_hash:'abcd'});assert.equal(args.unknown,undefined);
 g.setReply(()=>{g.setProfile({id:'other'});return {success:true};});assert.equal((await g.call('hub')).status,'account_changed');assert.equal((await g.call('hub')).status,'account_changed');assert.equal(g.calls.length,2);
 g.setProfile(null);assert.equal((await g.call('hub')).status,'not_authenticated');
});
test('gateway errors are failures and never disclose auth exceptions',async()=>{
 const g=gateway();g.setReply(()=>{throw Error('credential-like secret');});const r=await g.call('hub');assert.equal(r.status,'network_error');assert.equal(JSON.stringify(r).includes('secret'),false);
});
