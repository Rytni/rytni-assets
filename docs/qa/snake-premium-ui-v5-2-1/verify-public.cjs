const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const expected=JSON.parse(fs.readFileSync('giveaway-test/manifest.json')).current;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const rows=[];
 for(const base of ['https://rytni.github.io/rytni-assets/giveaway-test/','https://storage-1090.s3hoster.by/rytnistatictest/giveaway-test/']){
  const get=async path=>{const r=await fetch(base+path+'?qa=v521-'+new Date().getTime(),{cache:'no-store'});assert.equal(r.status,200,base+path);return Buffer.from(await r.arrayBuffer());};
  const manifest=JSON.parse(await get('manifest.json'));assert.equal(manifest.current.id,expected.id);assert.equal(manifest.current.snake_runtime.id,expected.snake_runtime.id);assert.equal(manifest.previous.id,'2.15.33-bc52be687115');
  const app=await get(expected.file);assert.equal(hash(app),expected.sha256);assert.equal(app.length,expected.size);
  const runtimeBytes=await get(expected.snake_runtime.file);assert.equal(hash(runtimeBytes),expected.snake_runtime.sha256);const runtime=JSON.parse(runtimeBytes);
  for(const name of ['ui.js','ui-v5-2.css','record-place-value.js']){const record=runtime.files.find(f=>f.file==='snake/product/'+name);assert.equal(hash(await get('releases/'+runtime.id+'/'+record.file)),record.sha256);}
  rows.push({base,current:manifest.current.id,runtime:runtime.id,previous:manifest.previous.id,appSha256:hash(app),appSize:app.length,changedModulesVerified:3});
 }
 fs.writeFileSync(__dirname+'/public.json',JSON.stringify({pass:true,rows},null,2)+'\n');console.log(rows);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
