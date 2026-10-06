const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const local=JSON.parse(fs.readFileSync('giveaway-test/manifest.json','utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function read(url){const r=await fetch(url+'?verify='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,url);return {bytes:Buffer.from(await r.arrayBuffer()),type:r.headers.get('content-type')};}
(async()=>{
 const results=[];
 for(const base of ['https://rytni.github.io/rytni-assets/giveaway-test/','https://storage-1090.s3hoster.by/rytnistatictest/giveaway-test/']){
  const m=JSON.parse((await read(base+'manifest.json')).bytes);assert.deepEqual(m.current,local.current);assert.deepEqual(m.previous,local.previous);
  const app=await read(base+m.current.file);assert.equal(hash(app.bytes),m.current.sha256);assert.equal(app.bytes.length,m.current.size);
  const descriptor=m.current.snake_runtime,manifest=await read(base+descriptor.file);assert.equal(hash(manifest.bytes),descriptor.sha256);assert.equal(manifest.bytes.length,descriptor.size);
  const runtime=JSON.parse(manifest.bytes),root=base+descriptor.file.slice(0,-'runtime.json'.length),checks=[];
  for(const file of ['snake/product/index.html','snake/product/app.js','snake/product/frame-runtime.js','snake/product/parity.css','snake/retro-v5/geometry.mjs','snake/retro-v5/material.mjs','snake/effect-playground/style.css','grib/mushroom-snake-menu-v1/snake-hero.png']){
   const expected=runtime.files.find(f=>f.file===file);assert.ok(expected,file);const asset=await read(root+file);assert.equal(hash(asset.bytes),expected.sha256);assert.equal(asset.bytes.length,expected.size);
   if(/\.m?js$/.test(file))assert.match(asset.type,/javascript|ecmascript/,file+' MIME');checks.push({file,type:asset.type});
  }
  results.push({base,current:m.current.id,previous:m.previous.id,runtime:descriptor.id,appHash:m.current.sha256,runtimeHash:descriptor.sha256,checks});
 }
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
