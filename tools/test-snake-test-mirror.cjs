const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('mirror admits only validated TEST candidate bytes, JavaScript MIME, manifest last',async()=>{
 const api=require('./sync-snake-test-mirror.cjs'),root=path.resolve(__dirname,'..'),plan=api.createPlan(root),m=JSON.parse(fs.readFileSync(path.join(root,'giveaway-test/manifest.json')));
 assert.equal(plan.at(-1).key,'giveaway-test/manifest.json');
 assert.ok(plan.every(f=>f.key.startsWith('giveaway-test/')&&!f.key.split('/').includes('..')));
 assert.equal(plan.filter(f=>f.key.endsWith('.mjs')).length,2);
 assert.ok(plan.filter(f=>f.key.endsWith('.mjs')).every(f=>f.type.startsWith('text/javascript')));
 const objects=new Map(),events=[],previous=fs.readFileSync(path.join(root,'giveaway-test',m.previous.file));
 objects.set('giveaway-test/'+m.previous.file,previous);
 const request=async(method,key,body)=>{events.push([method,key]);if(method==='PUT'){objects.set(key,body);return {status:200,body:Buffer.alloc(0),headers:{}};}return {status:objects.has(key)?200:404,body:objects.get(key)||Buffer.alloc(0),headers:{}};};
 await api.sync(root,request);assert.equal(events.filter(e=>e[0]==='PUT').at(-1)[1],'giveaway-test/manifest.json');
 assert.equal(objects.size,plan.length+1);assert.deepEqual(objects.get('giveaway-test/manifest.json'),plan.at(-1).body);
});
test('failed asset verification cannot promote TEST manifest',async()=>{
 const api=require('./sync-snake-test-mirror.cjs'),root=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(path.join(root,'giveaway-test/manifest.json'))),puts=[];
 await assert.rejects(api.sync(root,async(method,key)=>{if(method==='PUT'){puts.push(key);return {status:200,body:Buffer.alloc(0),headers:{}};}return {status:200,body:key==='giveaway-test/'+m.previous.file?fs.readFileSync(path.join(root,'giveaway-test',m.previous.file)):Buffer.from('wrong'),headers:{}};}),/mismatch/);
 assert.ok(!puts.includes('giveaway-test/manifest.json'));
});
test('signer rejects Production keys and alternative buckets before any request',()=>{
 const {transport}=require('./sync-snake-test-mirror.cjs');
 assert.throws(()=>transport({RYTNI_S3_BUCKET:'production'}),/Unexpected TEST/);
 const request=transport({RYTNI_S3_ACCESS_KEY:'fixture-not-real',RYTNI_S3_SECRET_KEY:'fixture-not-real'});
 assert.throws(()=>request('PUT','giveaway/manifest.json',Buffer.alloc(0)),/Protected S3/);
 assert.throws(()=>request('PUT','giveaway-test/../giveaway/manifest.json',Buffer.alloc(0)),/Protected S3/);
});
