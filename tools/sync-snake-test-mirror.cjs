// TEST-only exact candidate mirror. No shared media, vendors, Production or DB.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),https=require('node:https'),zlib=require('node:zlib');
const {validateRuntime}=require('../arcade/assemble-snake-next.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const MIME={html:'text/html; charset=utf-8',json:'application/json; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',png:'image/png',webp:'image/webp',wav:'audio/wav',ogg:'audio/ogg',mp3:'audio/mpeg',woff2:'font/woff2'};
function createPlan(root){
 const manifestBytes=fs.readFileSync(path.join(root,'giveaway-test/manifest.json')),m=JSON.parse(manifestBytes);
 for(const r of [m.current,m.previous]){if(!r||!/^releases\/[a-zA-Z0-9.-]+\/app\.html$/.test(r.file))throw Error('Unsafe TEST release');const b=fs.readFileSync(path.join(root,'giveaway-test',r.file));if(sha(b)!==r.sha256||b.length!==r.size)throw Error('TEST release hash/size mismatch');}
 const paths=[...validateRuntime({root,descriptor:m.current.snake_runtime}),'giveaway-test/'+m.current.file,'giveaway-test/manifest.json'];
 return paths.map(key=>{if(!key.startsWith('giveaway-test/')||key.split('/').some(s=>s==='..'||s==='.'||!s))throw Error('Protected mirror path');const body=key==='giveaway-test/manifest.json'?manifestBytes:fs.readFileSync(path.join(root,key)),type=MIME[key.split('.').at(-1)];if(!type)throw Error('Unknown mirror MIME');return {key,body,type,cache:key.endsWith('/manifest.json')?'no-store, max-age=0':'public, max-age=31536000, immutable'};});
}
function content(response){return response.headers?.['content-encoding']==='gzip'?zlib.gunzipSync(response.body):response.body;}
async function sync(root,request){
 const plan=createPlan(root),manifest=JSON.parse(plan.at(-1).body),previous=await request('GET','giveaway-test/'+manifest.previous.file);
 if(previous.status!==200||sha(content(previous))!==manifest.previous.sha256)throw Error('Remote rollback mismatch; TEST manifest not promoted');
 let uploaded=0,unchanged=0,index=0;const dependencies=plan.slice(0,-1);
 async function upload(file){const old=await request('GET',file.key);if(old.status===200){if(sha(content(old))!==sha(file.body))throw Error('Immutable remote mismatch: '+file.key);unchanged++;return;}if(old.status!==404)throw Error('Unexpected remote status '+old.status+' for '+file.key);const put=await request('PUT',file.key,file.body,{'Content-Type':file.type,'Cache-Control':file.cache});if(put.status<200||put.status>=300)throw Error('TEST mirror PUT failed: '+file.key+' HTTP '+put.status);const read=await request('GET',file.key);if(read.status!==200||sha(content(read))!==sha(file.body))throw Error('Remote verification mismatch: '+file.key);uploaded++;}
 await Promise.all(Array.from({length:6},async()=>{while(index<dependencies.length)await upload(dependencies[index++]);}));
 const final=plan.at(-1),put=await request('PUT',final.key,final.body,{'Content-Type':final.type,'Cache-Control':final.cache});if(put.status<200||put.status>=300)throw Error('TEST manifest PUT failed');const read=await request('GET',final.key);if(read.status!==200||sha(content(read))!==sha(final.body))throw Error('TEST manifest verification mismatch');
 return {id:manifest.current.id,uploaded,unchanged,manifestLast:true};
}
function transport(env){
 const endpoint=env.RYTNI_S3_ENDPOINT||'storage-1090.s3hoster.by',region=env.RYTNI_S3_REGION||'A1',bucket=env.RYTNI_S3_BUCKET||'rytnistatictest';
 if(endpoint!=='storage-1090.s3hoster.by'||bucket!=='rytnistatictest'||env.RYTNI_S3_CHANNEL&&env.RYTNI_S3_CHANNEL!=='giveaway-test')throw Error('Unexpected TEST mirror target');
 if(!env.RYTNI_S3_ACCESS_KEY||!env.RYTNI_S3_SECRET_KEY)throw Error('TEST mirror credentials unavailable');
 const hmac=(key,data)=>crypto.createHmac('sha256',key).update(data).digest();
 return (method,key,body=Buffer.alloc(0),headers={})=>{
  if(!['GET','PUT'].includes(method)||!key.startsWith('giveaway-test/')||key.split('/').some(p=>['','..','.'].includes(p)))throw Error('Protected S3 request');
  const date=new Date().toISOString().replace(/[:-]|\.\d{3}/g,''),day=date.slice(0,8),uri='/'+bucket+'/'+key.split('/').map(encodeURIComponent).join('/'),payload=sha(body),signed='host;x-amz-content-sha256;x-amz-date';
  const canonical=[method,uri,'',`host:${endpoint}\nx-amz-content-sha256:${payload}\nx-amz-date:${date}\n`,signed,payload].join('\n'),scope=`${day}/${region}/s3/aws4_request`,string=['AWS4-HMAC-SHA256',date,scope,sha(Buffer.from(canonical))].join('\n');
  const signing=hmac(hmac(hmac(hmac(Buffer.from('AWS4'+env.RYTNI_S3_SECRET_KEY),day),region),'s3'),'aws4_request'),signature=crypto.createHmac('sha256',signing).update(string).digest('hex');
  return new Promise((resolve,reject)=>{const req=https.request({hostname:endpoint,method,path:uri,timeout:20000,headers:{Host:endpoint,'x-amz-date':date,'x-amz-content-sha256':payload,Authorization:`AWS4-HMAC-SHA256 Credential=${env.RYTNI_S3_ACCESS_KEY}/${scope}, SignedHeaders=${signed}, Signature=${signature}`,'Content-Length':body.length,...headers}},res=>{const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));});req.on('timeout',()=>req.destroy(Error('TEST mirror timeout')));req.on('error',reject);req.end(body);});
 };
}
module.exports={createPlan,sync,transport};
if(require.main===module)sync(path.resolve(__dirname,'..'),transport(process.env)).then(result=>console.log(JSON.stringify(result))).catch(e=>{console.error(e.message);process.exitCode=1;});
