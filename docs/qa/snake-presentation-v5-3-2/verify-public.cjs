const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const local=JSON.parse(fs.readFileSync('giveaway-test/manifest.json')),expected=local.current,changed=JSON.parse(fs.readFileSync(__dirname+'/closure.json')).changed;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{const rows=[];
 for(const base of ['https://rytni.github.io/rytni-assets/giveaway-test/','https://storage-1090.s3hoster.by/rytnistatictest/giveaway-test/']){
  const get=async path=>{const r=await fetch(base+path+'?qa=v532-'+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,base+path);return Buffer.from(await r.arrayBuffer());};
  const manifest=JSON.parse(await get('manifest.json'));assert.equal(manifest.current.id,expected.id);assert.equal(manifest.current.snake_runtime.id,expected.snake_runtime.id);assert.equal(manifest.previous.id,'2.15.33-c77364482deb');
  const app=await get(expected.file);assert.equal(hash(app),expected.sha256);assert.equal(app.length,expected.size);
  const runtimeBytes=await get(expected.snake_runtime.file);assert.equal(hash(runtimeBytes),expected.snake_runtime.sha256);assert.equal(runtimeBytes.length,expected.snake_runtime.size);const runtime=JSON.parse(runtimeBytes);
  await Promise.all(changed.map(async file=>{const record=runtime.files.find(f=>f.file===file);assert(record,file);const bytes=await get('releases/'+runtime.id+'/'+file);assert.equal(hash(bytes),record.sha256,file);assert.equal(bytes.length,record.size,file);}));
  const previous=await get(manifest.previous.file);assert.equal(hash(previous),manifest.previous.sha256);assert.equal(previous.length,manifest.previous.size);
  rows.push({base,current:manifest.current.id,runtime:runtime.id,previous:manifest.previous.id,appSha256:hash(app),appSize:app.length,runtimeSha256:hash(runtimeBytes),runtimeSize:runtimeBytes.length,changedFilesVerified:changed.length,rollbackVerified:true});
 }
 fs.writeFileSync(__dirname+'/public.json',JSON.stringify({pass:true,rows},null,2)+'\n');console.log(rows);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
