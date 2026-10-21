const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {build,safe,outside}=require('./build-main-candidate.cjs');
const {verify}=require('./verify-main-candidate.cjs');
const root=path.resolve(__dirname,'..');
test('preparation refuses repository output and existing directories',()=>{
 assert.throws(()=>outside(root,path.join(root,'giveaway/releases/unsafe')),/outside/);
 assert.throws(()=>outside(root,'relative'),/absolute/);
 assert.throws(()=>outside(root,os.tmpdir()),/already exists/);
});
test('package paths cannot escape the candidate folder',()=>{
 for(const file of ['../private','/absolute','giveaway/../../bad','giveaway\\bad'])assert.throws(()=>safe(os.tmpdir(),file),/Unsafe/);
});
test('complete candidate is deterministic, manifest-safe and tamper-evident',()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'rytni-main-candidate-'));
 try{
  const directory=path.join(parent,'candidate'),beforeMain=fs.readFileSync(path.join(root,'giveaway/manifest.json')),beforeTest=fs.readFileSync(path.join(root,'giveaway-test/manifest.json'));
  const a=build({output:directory});assert.equal(verify({directory}).pass,true);
  const b=build({output:path.join(parent,'second')});assert.deepEqual(a.current,b.current);
  assert.ok(fs.readFileSync(path.join(root,'giveaway/manifest.json')).equals(beforeMain));assert.ok(fs.readFileSync(path.join(root,'giveaway-test/manifest.json')).equals(beforeTest));
  const app=path.join(directory,'giveaway',a.current.file);fs.appendFileSync(app,'tampered');assert.throws(()=>verify({directory}),/integrity mismatch/);
 }finally{
  if(!path.resolve(parent).startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(parent).startsWith('rytni-main-candidate-'))throw Error('Unsafe test cleanup');
  fs.rmSync(parent,{recursive:true,force:true});
 }
});
