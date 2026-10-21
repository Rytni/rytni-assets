import {verifyClaim} from './verifier-core.js';

const url=Deno.env.get('SUPABASE_URL')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
const origins=new Set(['https://rytni.live','https://www.rytni.live']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function rpc(name:string,args:unknown){
 const r=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify(args)});
 if(!r.ok)throw Error('verification_unavailable');return await r.json();
}
async function limitedBody(req:Request){
 const reader=req.body?.getReader();if(!reader)throw Error('invalid_replay');
 let size=0;const chunks:Uint8Array[]=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>524288){await reader.cancel();throw Error('invalid_replay');}chunks.push(value);}
 const bytes=new Uint8Array(size);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export async function handler(req:Request){
 const origin=req.headers.get('Origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(origins.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'}:{})};
 const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
 if(origin&&!origins.has(origin))return reply({success:false,status:'forbidden'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({success:false,status:'method_not_allowed'},405);
 try{
  const authorization=req.headers.get('Authorization')||'';
  if(!/^Bearer \S+$/i.test(authorization))return reply({success:false,status:'not_authenticated'},401);
  const auth=await fetch(url+'/auth/v1/user',{headers:{apikey:anon,Authorization:authorization}});
  if(!auth.ok)return reply({success:false,status:'not_authenticated'},401);
  const user=await auth.json();if(!uuid.test(user.id))return reply({success:false,status:'not_authenticated'},401);
  const p=await limitedBody(req);
  if(!['fly','snake'].includes(p.game)||!uuid.test(p.participant_id)||!uuid.test(p.attempt_id)||typeof p.client_token!=='string'||p.client_token.length<16||p.client_token.length>512||typeof p.release!=='string'||p.release.length>128)throw Error('invalid_replay');
  const args={p_user_id:user.id,p_game:p.game,p_participant_id:p.participant_id,p_attempt_id:p.attempt_id,p_client_token:p.client_token,p_release:p.release};
  const context=await rpc('admin_arcade_verification_context_v1',args);
  if(!context.success)return reply(context);
  // Check elapsed server time before spending CPU on the untrusted input log.
  if(!Number.isSafeInteger(p.proof?.ticks)||p.proof.ticks>context.max_ticks+27)throw Error('invalid_replay');
  const summary=verifyClaim(p.game,context.seed,p.proof,p.claimed);
  if(summary.duration_ms>context.max_duration_ms)throw Error('invalid_replay');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({game:p.game,release:p.release,proof:p.proof}))))).map(x=>x.toString(16).padStart(2,'0')).join('');
  return reply(await rpc('admin_commit_arcade_verified_v1',{...args,p_summary:summary,p_evidence_sha256:digest}));
 }catch(e){const status=e instanceof Error&&e.message==='invalid_replay'?'invalid_replay':'verification_unavailable';return reply({success:false,status});}
}
Deno.serve(handler);
