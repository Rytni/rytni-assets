// Normalize only line endings of the *same* current TEST channel. Never promote an older one.
const cp=require('node:child_process'),crypto=require('node:crypto');
const {transport}=require('../../../tools/sync-snake-test-mirror.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const canonical=cp.execFileSync('git',['show','HEAD:giveaway-test/manifest.json']);
 const expected=JSON.parse(canonical),key='giveaway-test/manifest.json',request=transport(process.env);
 const pages=Buffer.from(await(await fetch('https://rytni.github.io/rytni-assets/'+key+'?music='+Date.now())).arrayBuffer());
 if(!pages.equals(canonical))throw Error('Pages is not yet on the current committed manifest');
 const old=await request('GET',key);if(old.status!==200)throw Error('Cannot inspect TEST manifest');
 if(JSON.stringify(JSON.parse(old.body))!==JSON.stringify(expected))throw Error('Concurrent TEST publication: refuse overwrite');
 if(hash(old.body)===hash(canonical)){console.log('Manifest already canonical');return;}
 if(old.body.toString().replace(/\r\n/g,'\n')!==canonical.toString())throw Error('Difference is not line endings');
 if(!old.headers.etag)throw Error('Missing ETag; refuse an unconditional overwrite');
 const put=await request('PUT',key,canonical,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','If-Match':old.headers.etag});
 if(put.status<200||put.status>=300)throw Error('Conditional normalization refused: '+put.status);
 const verified=await request('GET',key);
 if(verified.status!==200||hash(verified.body)!==hash(canonical))throw Error('Canonical TEST verification failed');
 console.log(JSON.stringify({id:expected.current.id,manifestSha256:hash(canonical),normalizedLineEndingsOnly:true}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
