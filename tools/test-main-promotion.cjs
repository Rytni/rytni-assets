const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {build}=require('./build-main-candidate.cjs'),{promote}=require('./publish-main-candidate.cjs');
const ROOT=path.resolve(__dirname,'..');
test('MAIN is explicit; default signer still rejects MAIN and MAIN signer rejects TEST',()=>{
 const {transport}=require('./sync-snake-test-mirror.cjs'),env={RYTNI_S3_ACCESS_KEY:'fixture',RYTNI_S3_SECRET_KEY:'fixture'};
 assert.throws(()=>transport(env)('PUT','giveaway/manifest.json'),/Protected/);
 assert.throws(()=>transport({...env,RYTNI_S3_CHANNEL:'giveaway-test'},{main:true}),/Unexpected MAIN/);
 assert.throws(()=>transport(env,{main:true})('PUT','giveaway-test/manifest.json'),/Protected/);
});
test('promotion validates every immutable byte and publishes manifest last; changed live pointer fails closed',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'rytni-main-promotion-')),directory=path.join(parent,'candidate'),root=path.join(parent,'root');
 try{
  const report=build({output:directory});
  const copy=file=>{const to=path.join(root,file);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(ROOT,file),to);};
  for(const f of report.source_inputs)copy(f.file);
  copy('giveaway/manifest.json');copy('giveaway-test/manifest.json');
  for(const r of [report.approved_test])copy('giveaway-test/'+r.file);
  const rt=report.approved_test.snake_runtime;copy('giveaway-test/'+rt.file);
  for(const f of JSON.parse(fs.readFileSync(path.join(ROOT,'giveaway-test',rt.file))).files){copy('giveaway-test/releases/'+rt.id+'/'+f.file);copy(f.file.startsWith('snake/')?'arcade/snake-next/'+f.file.slice(6):f.file);}
  const objects=new Map([['giveaway/manifest.json',Buffer.from(JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'giveaway/manifest.json')))))]]),puts=[];
  const request=async(method,key,body)=>{if(method==='PUT'){puts.push(key);objects.set(key,body);}return {status:objects.has(key)?200:404,body:objects.get(key)||Buffer.alloc(0),headers:{}};};
  const result=await promote({directory,root,request});
  assert.equal(result.manifestLast,true);assert.equal(puts.at(-1),'giveaway/manifest.json');
  assert.ok(puts.every(k=>k.startsWith('giveaway/')));
  assert.ok(JSON.parse(objects.get('giveaway/manifest.json')).published_at);
  // Restore source baseline for independent conflict test; no PUT may occur.
  copy('giveaway/manifest.json');let writes=0;
  await assert.rejects(promote({directory,root,request:async(method)=>{if(method==='PUT')writes++;return {status:200,body:Buffer.from('changed'),headers:{}};}}),/Live MAIN changed/);
  assert.equal(writes,0);
 }finally{if(path.dirname(parent)!==os.tmpdir()||!path.basename(parent).startsWith('rytni-main-promotion-'))throw Error('Unsafe cleanup');fs.rmSync(parent,{recursive:true,force:true});}
});
