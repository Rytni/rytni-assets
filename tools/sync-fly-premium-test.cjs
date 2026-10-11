// Six new, independently authored Fly UI PNGs only; TEST bucket, immutable writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {transport,FLY_PREMIUM_V2_KEYS}=require('./sync-snake-test-mirror.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function createPlan(root){return FLY_PREMIUM_V2_KEYS.map(key=>{const body=fs.readFileSync(path.join(root,key)),committed=cp.execFileSync('git',['-C',root,'show','HEAD:'+key],{maxBuffer:20e6});if(!body.equals(committed))throw Error('Uncommitted Fly asset: '+key);return {key,body};});}
async function sync(root,request){let uploaded=0,unchanged=0;for(const {key,body}of createPlan(root)){const old=await request('GET',key);if(old.status===200){if(hash(old.body)!==hash(body))throw Error('Immutable Fly asset mismatch: '+key);unchanged++;continue;}if(old.status!==404)throw Error('Unexpected Fly asset status: '+old.status);const put=await request('PUT',key,body,{'Content-Type':'image/png','Cache-Control':'public, max-age=31536000, immutable'});if(put.status<200||put.status>=300)throw Error('Fly asset PUT failed');const read=await request('GET',key);if(read.status!==200||hash(read.body)!==hash(body))throw Error('Fly asset verification failed');uploaded++;}return {uploaded,unchanged,keys:FLY_PREMIUM_V2_KEYS};}
module.exports={createPlan,sync};
if(require.main===module)sync(path.resolve(__dirname,'..'),transport(process.env,{flyPremiumV2:true})).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
