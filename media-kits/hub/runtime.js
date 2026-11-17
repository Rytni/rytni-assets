/* Public aggregates only. Reads the releases already published by RYTNI Studio. */
(function(global){
 'use strict';
 const BASE='https://rytni.github.io/rytni-assets/';
 const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'));
 const count=value=>Number.isSafeInteger(value)&&value>=0&&value<=1e15;
 function select(key,config,manifest,value){
  let result;
  if(config.platform==='tiktok'){
   if(manifest.schema_version!==3||manifest.account_key!==key||manifest.username!==config.handle||manifest.media_kit_slug!==config.slug||manifest.release_id!==manifest.release_sha256)throw Error('Wrong channel');
   if(value.schema_version!==2||value.account_key!==key||value.username!==config.handle||value.media_kit_slug!==config.slug)throw Error('Wrong release account');
   result={followers:value.current?.followers?.value,followersAsOf:value.current?.followers?.as_of_date,
    views:value.period?.metrics?.views?.value,start:value.period?.period_start,end:value.period?.period_end,
    capturedAt:value.period?.captured_at,timezone:value.period?.source_timezone};
  }else{
   if(manifest.schema_version!==1||manifest.platform!==key||value.platform!==key||![1,2,3].includes(value.schema_version))throw Error('Wrong platform');
   for(const a of [manifest.account,value.account])if(a?.handle!==config.handle||a?.platform_id!==config.platformId||a?.url!==config.profile)throw Error('Wrong platform account');
   const followers=value.metrics?.filter(m=>m.key==='followers'),views=value.metrics?.filter(m=>m.key==='views');
   if(followers?.length!==1||views?.length!==1||followers[0].scope!=='CURRENT'||views[0].scope!=='PERIOD'||followers[0].unit!=='count'||views[0].unit!=='count')throw Error('Wrong metric semantics');
   result={followers:followers[0].value,followersAsOf:value.captured_at?.slice(0,10),views:views[0].value,
    start:value.period?.start,end:value.period?.end,capturedAt:value.captured_at,timezone:value.period?.timezone};
  }
  if(!count(result.followers)||!count(result.views)||!date(result.followersAsOf)||!date(result.start)||!date(result.end)||result.start>result.end||result.end>new Date().toISOString().slice(0,10)||!Number.isFinite(Date.parse(result.capturedAt))||Date.parse(result.capturedAt)>Date.now()+300000)throw Error('Invalid aggregate');
  return result;
 }
 function target(key,config,m){
  if(config.platform==='tiktok'){
   const sha=m.release_sha256,path='data/media-kits/'+key+'/releases/'+sha+'.json';
   if(!/^[a-f0-9]{64}$/.test(sha)||m.release_id!==sha||m.release_url!==BASE+path)throw Error('Wrong target');
   return {url:BASE+path,sha,size:null};
  }
  const r=m.release,path='data/platform-media/'+key+'/releases/'+r?.sha256+'.json';
  if(!r||!/^[a-f0-9]{64}$/.test(r.sha256)||r.file!==path||!Number.isSafeInteger(r.size)||r.size<1||r.size>150000)throw Error('Wrong target');
  return {url:BASE+path,sha:r.sha256,size:r.size};
 }
 async function read(url,max){
  const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Unavailable');const raw=await response.arrayBuffer();if(raw.byteLength>max)throw Error('Too large');return raw;
 }
 async function load(key,config){
  const prefix=config.platform==='tiktok'?'data/media-kits/':'data/platform-media/';
  const manifest=JSON.parse(new TextDecoder().decode(await read(BASE+prefix+key+'/manifest.json',20000)));
  const ref=target(key,config,manifest),raw=await read(ref.url,2000000);
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(v=>v.toString(16).padStart(2,'0')).join('');
  if(hash!==ref.sha||ref.size!==null&&ref.size!==raw.byteLength)throw Error('Integrity failure');
  return select(key,config,manifest,JSON.parse(new TextDecoder().decode(raw)));
 }
 if(typeof module==='object'&&module.exports){module.exports={select,target};return;}
 const root=document.getElementById('rmk-hub');if(!root)return;
 const bootstrap=JSON.parse(document.getElementById('hub-bootstrap').textContent),configs=bootstrap.config,rows=bootstrap.accounts;
 root.querySelector('.hub-language').hidden=false;
 let language='ru';
 const shortDate=value=>value.slice(8,10)+'.'+value.slice(5,7)+'.'+value.slice(0,4);
 function render(){
  root.lang=language;document.documentElement.lang=language;
  root.querySelectorAll('[data-ru]').forEach(e=>e.textContent=e.dataset[language]);
  root.querySelectorAll('[data-lang]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.lang===language)));
  const number=new Intl.NumberFormat(language==='ru'?'ru-RU':'en-US'),compact=new Intl.NumberFormat(language==='ru'?'ru-RU':'en-US',{notation:'compact',maximumFractionDigits:1}),t=(ru,en)=>language==='ru'?ru:en;
  for(const [key,value] of Object.entries(rows)){
   const card=root.querySelector('[data-key='+key+']');
   const follower=card.querySelector('[data-stat=followers]'),views=card.querySelector('[data-stat=views]');follower.textContent=number.format(value.followers);follower.dataset.value=String(value.followers);follower.title=number.format(value.followers);follower.setAttribute('aria-label',number.format(value.followers));
   views.textContent=compact.format(value.views);views.dataset.value=String(value.views);views.title=number.format(value.views);views.setAttribute('aria-label',number.format(value.views));
   card.querySelector('[data-asof]').textContent=t('на ','as of ')+shortDate(value.followersAsOf);
   card.querySelector('[data-period]').textContent=shortDate(value.start)+' — '+shortDate(value.end)+(value.timezone==='UTC'?' · UTC':'');
  }
 }
 root.querySelectorAll('[data-lang]').forEach(e=>e.addEventListener('click',()=>{language=e.dataset.lang;render();}));
 render();
 Promise.allSettled(Object.entries(configs).map(async([key,config])=>{
  const next=await load(key,config);
  if(Date.parse(next.capturedAt)<Date.parse(rows[key].capturedAt)||next.followersAsOf<rows[key].followersAsOf)throw Error('Older release');
  rows[key]=next;root.querySelector('[data-key='+key+']').dataset.dataState='LIVE';render();
 })).then(()=>{root.dataset.dataState=[...root.querySelectorAll('.channel-card')].every(e=>e.dataset.dataState==='LIVE')?'LIVE':'SAVED';});
})(globalThis);
