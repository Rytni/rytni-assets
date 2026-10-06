const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const m=JSON.parse(fs.readFileSync('giveaway-test/manifest.json')),rt=JSON.parse(fs.readFileSync('giveaway-test/'+m.current.snake_runtime.file));
const bases=['https://rytni.github.io/rytni-assets/','https://storage-1090.s3hoster.by/rytnistatictest/'];
async function bytes(url){const r=await fetch(url);assert.equal(r.status,200,url);return {body:Buffer.from(await r.arrayBuffer()),type:r.headers.get('content-type')||''};}
(async()=>{const results=[];for(const base of bases){
 const manifest=JSON.parse((await bytes(base+'giveaway-test/manifest.json?verify='+Date.now())).body);
 assert.equal(manifest.current.id,m.current.id);assert.equal(manifest.current.snake_runtime.id,rt.id);assert.equal(manifest.previous.id,'2.15.33-a67c23267bc6');
 const app=await bytes(base+'giveaway-test/'+m.current.file);assert.equal(sha(app.body),m.current.sha256);assert.equal(app.body.length,m.current.size);assert.match(app.type,/text\/html/);
 const runtime=await bytes(base+'giveaway-test/'+m.current.snake_runtime.file);assert.equal(sha(runtime.body),m.current.snake_runtime.sha256);assert.match(runtime.type,/application\/json/);
 let i=0;const errors=[];
 await Promise.all(Array.from({length:8},async()=>{while(i<rt.files.length){const f=rt.files[i++];try{
  const r=await bytes(base+'giveaway-test/releases/'+rt.id+'/'+f.file);assert.equal(sha(r.body),f.sha256);assert.equal(r.body.length,f.size);
  const ext=f.file.split('.').at(-1),type={js:/javascript/,mjs:/javascript/,css:/text\/css/,json:/application\/json/,png:/image\/png/,html:/text\/html/,wav:/audio/,ogg:/audio/}[ext];if(type)assert.match(r.type,type);
 }catch(e){errors.push({file:f.file,message:e.message});}}}));
 results.push({base,release:m.current.id,runtime:rt.id,files:rt.files.length,errors});
 }console.log(JSON.stringify(results,null,2));if(results.some(r=>r.errors.length))process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
