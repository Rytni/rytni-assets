const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {sync,createPlan}=require('./sync-community-ranking-art.cjs');
const {transport,COMMUNITY_ART_KEYS}=require('./sync-snake-test-mirror.cjs');
const root=path.resolve(__dirname,'..');
test('only the exact committed community icons are admitted',()=>assert.deepEqual(createPlan(root).map(r=>r.key),COMMUNITY_ART_KEYS));
test('art upload verifies bytes and is idempotent',async()=>{
 const objects=new Map();const request=async(method,key,body,headers)=>{
  assert.ok(COMMUNITY_ART_KEYS.includes(key));
  if(method==='PUT'){assert.equal(headers['Content-Type'],'image/webp');objects.set(key,body);return {status:200};}
  return {status:objects.has(key)?200:404,body:objects.get(key)};
 };
 assert.equal((await sync(root,request)).uploaded,COMMUNITY_ART_KEYS.length);assert.equal((await sync(root,request)).unchanged,COMMUNITY_ART_KEYS.length);
});
test('existing different art is not overwritten',async()=>{
 await assert.rejects(sync(root,async method=>{assert.equal(method,'GET');return {status:200,body:Buffer.from('other')};}),/differs/);
});
test('optional art permission preserves default and production guards',()=>{
 const env={RYTNI_S3_ACCESS_KEY:'fixture',RYTNI_S3_SECRET_KEY:'fixture'};
 assert.throws(()=>transport(env)('PUT',COMMUNITY_ART_KEYS[0]),/Protected/);
 const art=transport(env,{communityArt:true});
 for(const key of ['giveaway/manifest.json','web/2/other.webp','web/2/../secret.webp'])assert.throws(()=>art('PUT',key),/Protected/);
});
