// Upload only the reviewed, committed AJAZZ chest before switching a release.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {transport,SPONSOR_ART_KEYS}=require('./sync-snake-test-mirror.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function createPlan(root){
 return SPONSOR_ART_KEYS.map(key=>{
  const body=fs.readFileSync(path.join(root,key));
  const committed=cp.execFileSync('git',['-C',root,'show','HEAD:'+key],{maxBuffer:1e6});
  if(!body.equals(committed))throw Error('Uncommitted sponsor art: '+key);
  return {key,body};
 });
}
async function sync(root,request){
 let uploaded=0,unchanged=0;
 for(const {key,body} of createPlan(root)){
  const old=await request('GET',key);
  if(old.status===200){if(hash(old.body)!==hash(body))throw Error('Existing sponsor art differs');unchanged++;continue;}
  if(old.status!==404)throw Error('Unexpected sponsor art status');
  const put=await request('PUT',key,body,{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable'});
  if(put.status<200||put.status>=300)throw Error('Sponsor art upload failed');
  const read=await request('GET',key);
  if(read.status!==200||hash(read.body)!==hash(body))throw Error('Sponsor art verification failed');
  uploaded++;
 }
 return {uploaded,unchanged,keys:SPONSOR_ART_KEYS};
}
module.exports={createPlan,sync};
if(require.main===module){
 const main=process.argv.includes('--main');
 sync(path.resolve(__dirname,'..'),transport(process.env,{sponsorArt:true,main})).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
}
