import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function fixture(query='?host=1&parent_origin=https%3A%2F%2Frytni.live&channel=qa-channel') {
 const messages=[],listeners={},parent={},self={parent,location:{search:query},setTimeout,clearTimeout,addEventListener:(name,fn)=>listeners[name]=fn};
 parent.postMessage=(message,origin)=>messages.push({message,origin});
 vm.runInNewContext(fs.readFileSync(new URL('./host-bridge.js',import.meta.url),'utf8'),{window:self,URL,URLSearchParams});
 const receive=(data,origin='https://rytni.live',source=parent)=>listeners.message?.({data,origin,source});
 return {self,messages,receive};
}
test('standalone has no host routing or parent messages',()=>{const f=fixture('');assert.equal(f.self.RytniArcadeHub,undefined);assert.equal(f.messages.length,0);});
test('host sends channel-scoped readiness and other-game routing to exact parent origin',()=>{const f=fixture();f.self.SnakeTestHost.bind(()=>{});f.self.RytniArcadeHub.leave();assert.deepEqual(f.messages.map(m=>m.message.type),['ready','leave']);assert.ok(f.messages.every(m=>m.origin==='https://rytni.live'&&m.message.channel==='qa-channel'));});
test('forged messages cannot stop game; valid shutdown disposes once',()=>{const f=fixture();let disposed=0;f.self.SnakeTestHost.bind(()=>disposed++);const data={type:'shutdown',protocol:'snake-next-test-v1',channel:'qa-channel'};f.receive(data,'https://evil.invalid');f.receive(data,'https://rytni.live',{});f.receive({...data,channel:'bad'});assert.equal(disposed,0);f.receive(data);f.receive(data);assert.equal(disposed,1);});
test('fullscreen gate resolves only after exact parent acknowledges matching request',async()=>{const f=fixture();const pending=f.self.SnakeTestHost.fullscreen(true);const request=f.messages.at(-1).message;let resolved=false;pending.then(()=>resolved=true);f.receive({...request,type:'fullscreen-ack'},'https://evil.invalid');await Promise.resolve();assert.equal(resolved,false);f.receive({...request,type:'fullscreen-ack'});assert.equal(await pending,true);});
