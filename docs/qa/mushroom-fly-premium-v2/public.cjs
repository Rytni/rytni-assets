const fs=require('node:fs'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync('giveaway-test/manifest.json','utf8'));
const checks=[],failures=[];
async function verify(url,file){
 const response=await fetch(url,{cache:'no-store'}),bytes=Buffer.from(await response.arrayBuffer());
 const expected=fs.readFileSync(file),ok=response.ok&&hash(bytes)===hash(expected);
 const row={url,status:response.status,size:bytes.length,sha256:hash(bytes),expectedSHA256:hash(expected),ok};checks.push(row);if(!ok)failures.push(row);
}
(async()=>{
 for(const root of ['https://rytni.github.io/rytni-assets/giveaway-test/','https://storage-1090.s3hoster.by/rytnistatictest/giveaway-test/']){
  await verify(root+'manifest.json','giveaway-test/manifest.json');
  await verify(root+manifest.current.file,'giveaway-test/'+manifest.current.file);
  await verify(root+manifest.current.snake_runtime.file,'giveaway-test/'+manifest.current.snake_runtime.file);
  await verify(root+manifest.previous.file,'giveaway-test/'+manifest.previous.file);
 }
 for(const file of fs.readdirSync('grib/mushroom-fly-premium-v2').filter(n=>n.endsWith('.png'))){for(const root of ['https://rytni.github.io/rytni-assets/','https://storage-1090.s3hoster.by/rytnistatictest/'])await verify(root+'grib/mushroom-fly-premium-v2/'+file,'grib/mushroom-fly-premium-v2/'+file);}
 const result={checkedAt:new Date().toISOString(),release:manifest.current.id,runtime:manifest.current.snake_runtime.id,rollback:manifest.previous.id,productionSHA256:hash(fs.readFileSync('giveaway/manifest.json')),checks,failures};
 fs.writeFileSync(__dirname+'/public.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({release:result.release,checks:checks.length,failures:failures.map(r=>({url:r.url,status:r.status})),productionSHA256:result.productionSHA256},null,2));if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
