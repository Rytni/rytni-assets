// Explicit MAIN promotion: verified candidate dependencies first, manifest last.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {verify}=require('./verify-main-candidate.cjs');
const {safe,sha}=require('./build-main-candidate.cjs');
const {transport}=require('./sync-snake-test-mirror.cjs');
const ROOT=path.resolve(__dirname,'..');
const sameManifest=(bytes,expected)=>{try{return require('node:util').isDeepStrictEqual(JSON.parse(bytes),expected);}catch{return false;}};
const MIME={html:'text/html; charset=utf-8',json:'application/json; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',png:'image/png',webp:'image/webp',wav:'audio/wav',ogg:'audio/ogg',mp3:'audio/mpeg',woff2:'font/woff2',svg:'image/svg+xml'};
const content=r=>r.headers?.['content-encoding']==='gzip'?zlib.gunzipSync(r.body):r.body;
async function promote({directory,request,root=ROOT}){
 verify({directory,root});
 const report=JSON.parse(fs.readFileSync(path.join(directory,'release-report.json')));
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'candidate-manifest.json')));
 const baseline=JSON.parse(fs.readFileSync(path.join(directory,'rollback-manifest.json')));
 const remote=await request('GET','giveaway/manifest.json');
 // Existing hosts have equivalent manifests with different whitespace/line endings.
 // All descriptor values must agree; immutable file hashes remain byte-exact.
 if(remote.status!==200||!sameManifest(content(remote),baseline))throw Error('Live MAIN changed; promotion refused');
 const files=report.files.filter(f=>f.file.startsWith('giveaway/'));
 let index=0,uploaded=0,unchanged=0;
 async function upload(f){
  const body=fs.readFileSync(safe(directory,f.file)),old=await request('GET',f.file);
  if(old.status===200){if(sha(content(old))!==f.sha256)throw Error('Immutable MAIN mismatch: '+f.file);unchanged++;return;}
  if(old.status!==404)throw Error('Unexpected MAIN dependency response');
  const type=MIME[f.file.split('.').at(-1)];if(!type)throw Error('Unknown MIME: '+f.file);
  const put=await request('PUT',f.file,body,{'Content-Type':type,'Cache-Control':'public, max-age=31536000, immutable'});
  if(put.status<200||put.status>=300)throw Error('MAIN dependency PUT failed');
  const read=await request('GET',f.file);if(read.status!==200||sha(content(read))!==f.sha256)throw Error('MAIN dependency read-back failed');
  uploaded++;
 }
 await Promise.all(Array.from({length:6},async()=>{while(index<files.length)await upload(files[index++]);}));
 // Recheck before the one mutable pointer is changed.
 const check=await request('GET','giveaway/manifest.json');
 if(check.status!==200||!sameManifest(content(check),baseline))throw Error('MAIN changed while uploading');
 manifest.published_at=new Date().toISOString();
 const body=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
 const put=await request('PUT','giveaway/manifest.json',body,{'Content-Type':MIME.json,'Cache-Control':'no-store, max-age=0'});
 if(put.status<200||put.status>=300)throw Error('MAIN manifest PUT failed');
 const read=await request('GET','giveaway/manifest.json');if(read.status!==200||sha(content(read))!==sha(body))throw Error('MAIN manifest read-back failed');
 // Copy only reviewed immutable files. Never overwrite a different local release.
 for(const f of files){const target=safe(root,f.file),bytes=fs.readFileSync(safe(directory,f.file));if(fs.existsSync(target)){if(sha(fs.readFileSync(target))!==f.sha256)throw Error('Local immutable mismatch');}else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});}}
 fs.writeFileSync(path.join(root,'giveaway/manifest.json'),body);
 return {id:manifest.current.id,uploaded,unchanged,manifestLast:true,published_at:manifest.published_at,paths:[...files.map(f=>f.file),'giveaway/manifest.json']};
}
module.exports={promote};
if(require.main===module){if(process.argv[2]!=='--publish'){console.error('Explicit --publish CANDIDATE required');process.exitCode=1;}else promote({directory:process.argv[3],request:transport(process.env,{main:true})}).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});}
