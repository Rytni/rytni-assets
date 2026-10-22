import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {restoredNotificationText,restoredMediaKind} from './restored-notifications.js';
function fixture(items=[],fail=false,subscription=null){
 const calls=[],receipts=[],updates=[];let handler;
 const service={rpc:async(name,args)=>{receipts.push({name,args});return {data:name==='telegram_claim_due_notifications_v2292'?items:{success:true},error:null};},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:subscription,error:null})})}),update:value=>({eq:async(key,id)=>{updates.push({value,key,id});return {error:null};}})})};
 const context={console,URL,Request,Response,AbortSignal,TextEncoder,atob,btoa,Date,setTimeout,clearTimeout,
  SECRET_MISSION_FACTS:[],SECRET_MISSION_INTROS:[],restoredNotificationText,restoredMediaKind,createClient:()=>service,
  Deno:{env:{get:key=>({TELEGRAM_PUBLIC_BOT_TOKEN:'fixture-only',SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-only'}[key]||'')},serve:fn=>handler=fn},
  fetch:async(url,options)=>{assert.ok(url.startsWith('https://api.telegram.org/botfixture-only/'));calls.push({method:url.split('/').at(-1),body:JSON.parse(options.body)});return new Response(JSON.stringify(fail?{ok:false,error_code:403,description:'fixture blocked'}:{ok:true,result:{message_id:1}}),{status:fail?403:200});}};
 let source=fs.readFileSync(new URL('./index.ts',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
 source=stripTypeScriptTypes(source,{mode:'strip'});
 vm.runInNewContext(source+'\nglobalThis.api={runNotifications,settingsKeyboard,settingsText,notificationText,notificationMedia,handleCallback};',context);
 return {api:context.api,calls,receipts,updates,handler:()=>handler};
}
test('new jobs use existing queue delivery/finish contract and safe site buttons',async()=>{
 const items=['sponsor_chest','arcade_fly','arcade_snake'].map((kind,i)=>({kind,delivery_id:'d'+i,subscription_id:'s'+i,telegram_chat_id:i,payload:{opportunity:i===2?'sponsor':'regular'}}));
 const f=fixture(items),r=await f.api.runNotifications();assert.equal(r.sent,3);assert.equal(r.failed,0);
 assert.equal(f.calls.length,3);assert.ok(f.calls.every(c=>c.method==='sendPhoto'&&c.body.parse_mode==='HTML'&&c.body.caption.length<1024&&c.body.photo.length>20));
 assert.match(f.calls[0].body.caption,/Сундук от спонсора/);assert.match(f.calls[1].body.caption,/Mushroom Fly/);assert.match(f.calls[2].body.caption,/Mushroom Snake.*спонсора/);
 assert.ok(f.calls.every(c=>JSON.stringify(c.body.reply_markup).includes('https://rytni.live/rytni-gift')));
 assert.equal(f.receipts.filter(r=>r.name==='telegram_finish_delivery_v2180'&&r.args.p_success).length,3);
});
test('Telegram rejection preserves retry handling and pauses blocked subscriptions',async()=>{
 const f=fixture([{kind:'arcade_snake',delivery_id:'d',subscription_id:'s',telegram_chat_id:1,payload:{}}],true);
 const r=await f.api.runNotifications();assert.equal(r.failed,1);assert.equal(r.sent,0);
 assert.ok(f.receipts.some(r=>r.name==='telegram_finish_delivery_v2180'&&r.args.p_success===false));assert.equal(f.updates[0].value.active,false);
});
test('new settings have independent toggles and empty queue sends nothing',async()=>{
 const f=fixture(),s={notify_chest:true,notify_sponsor_chest:false,notify_arcade:true};
 const buttons=f.api.settingsKeyboard(s).inline_keyboard.flat();
 assert.match(buttons.find(b=>b.callback_data==='pref:sponsor_chest').text,/❌/);assert.match(buttons.find(b=>b.callback_data==='pref:arcade').text,/✅/);
 assert.ok(buttons.some(b=>b.callback_data==='pref:chest'));
 const r=await f.api.runNotifications();assert.equal(r.claimed,0);assert.equal(f.calls.length,0);
});
test('webhook still requires its secret and scheduler does not accept a fake token',async()=>{
 const f=fixture(),handler=f.handler();
 const health=await handler(new Request('https://example.invalid'));assert.equal((await health.json()).version,'2.33.0');
 for(const headers of [{},{authorization:'Bearer fixture-not-authorized'}]){
  const r=await handler(new Request('https://example.invalid',{method:'POST',headers,body:'{}'}));assert.equal(r.status,403);
 }
 assert.equal(f.calls.length,0);
});
test('real callback route changes only the requested preference of its linked subscription',async()=>{
 for(const [action,column] of [['pref:sponsor_chest','notify_sponsor_chest'],['pref:arcade','notify_arcade']]){
  const f=fixture([],false,{id:'linked-subscription',active:true,notify_chest:true,notify_sponsor_chest:true,notify_arcade:true});
  await f.api.handleCallback({id:'callback',data:action,from:{id:101},message:{message_id:1,chat:{id:101}}},{});
  assert.equal(f.updates.length,1);assert.equal(f.updates[0].id,'linked-subscription');assert.equal(f.updates[0].key,'id');
  assert.equal(f.updates[0].value[column],false);assert.ok(!('notify_chest' in f.updates[0].value));
  assert.ok(!((column==='notify_arcade'?'notify_sponsor_chest':'notify_arcade') in f.updates[0].value));
 }
});
