const fs=require('node:fs'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const local=JSON.parse(fs.readFileSync('giveaway-test/manifest.json'));
const runtime=JSON.parse(fs.readFileSync('giveaway-test/'+local.current.snake_runtime.file));
const music=runtime.files.filter(f=>f.file.startsWith('grib/arcade-music-v1/'));
(async()=>{
 const rows=[];
 for(const base of ['https://rytni.github.io/rytni-assets/giveaway-test/','https://storage-1090.s3hoster.by/rytnistatictest/giveaway-test/']){
  const response=await fetch(base+'manifest.json?music-qa='+Date.now(),{cache:'no-store'});
  const bytes=Buffer.from(await response.arrayBuffer()),manifest=JSON.parse(bytes);
  if(manifest.current.id!==local.current.id)throw Error(base+' still on '+manifest.current.id);
  const bundle=Buffer.from(await(await fetch(base+manifest.current.file)).arrayBuffer());
  if(hash(bundle)!==local.current.sha256||bundle.length!==local.current.size)throw Error('Bundle mismatch');
  if(manifest.previous.id!==local.previous.id)throw Error('Rollback differs from current committed channel');
  const rollback=Buffer.from(await(await fetch(base+manifest.previous.file)).arrayBuffer());
  if(hash(rollback)!==manifest.previous.sha256)throw Error('Published rollback integrity mismatch');
  for(const file of music){const r=await fetch(base+'releases/'+runtime.id+'/'+file.file),b=Buffer.from(await r.arrayBuffer());
   if(!r.ok||hash(b)!==file.sha256||b.length!==file.size)throw Error('Music integrity: '+file.file);}
  rows.push({base,id:manifest.current.id,manifestSha256:hash(bytes),bundleSha256:hash(bundle),runtime:runtime.id,verifiedMusicFiles:music.length});
 }
 if(rows[0].manifestSha256!==rows[1].manifestSha256)throw Error('Mirror manifest bytes differ');
 const productionSha256=hash(fs.readFileSync('giveaway/manifest.json'));
 if(productionSha256!=='0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591')throw Error('Production changed');
 const result={rows,productionSha256,failures:[]};fs.writeFileSync(__dirname+'/mirrors.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
