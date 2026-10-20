// Reuse the existing TEST signer; admit only two existing committed site icons.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {transport,COMMUNITY_ART_KEYS}=require('./sync-snake-test-mirror.cjs');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function createPlan(root){
  return COMMUNITY_ART_KEYS.map(key=>{
    const body=fs.readFileSync(path.join(root,key));
    const committed=cp.execFileSync('git',['-C',root,'show','HEAD:'+key],{maxBuffer:1e6});
    if(!body.equals(committed))throw Error('Uncommitted community art: '+key);
    return {key,body};
  });
}
async function sync(root,request){
  let uploaded=0,unchanged=0;
  for(const {key,body} of createPlan(root)){
    const old=await request('GET',key);
    if(old.status===200){if(hash(old.body)!==hash(body))throw Error('Existing community art differs');unchanged++;continue;}
    if(old.status!==404)throw Error('Unexpected community art status');
    const put=await request('PUT',key,body,{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable'});
    if(put.status<200||put.status>=300)throw Error('Community art upload failed');
    const verified=await request('GET',key);
    if(verified.status!==200||hash(verified.body)!==hash(body))throw Error('Community art verification failed');
    uploaded++;
  }
  return {uploaded,unchanged,keys:COMMUNITY_ART_KEYS};
}
module.exports={createPlan,sync};
if(require.main===module)sync(path.resolve(__dirname,'..'),transport(process.env,{communityArt:true})).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
