/* Explicit operations only. CLI credentials remain in the existing linked project. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const source=process.env.RYTNI_SOURCE_ROOT||'C:/Codex/Rytni Gift/RYTNI_TRANSFER_2026-07-31/CORE/Сайт';
const cli=path.join(source,'node_modules/supabase/dist/supabase.js');
const mode=process.argv[2];let sql;
if(mode==='transaction-test'){
 sql=fs.readFileSync(path.join(root,'migrations/snake_product_v1_candidate.sql'),'utf8').replace(/commit;\s*$/i,'');
 sql+=fs.readFileSync(path.join(root,'migrations/snake_product_v1_transaction_test.sql'),'utf8');
}else if(mode==='apply-schema')sql=fs.readFileSync(path.join(root,'migrations/snake_product_v1_candidate.sql'),'utf8');
else if(mode==='update-hub'){
 const source=fs.readFileSync(path.join(root,'migrations/snake_product_v1_candidate.sql'),'utf8');
 const start=source.indexOf('create function public.get_snake_product_hub_v1('),end=source.indexOf('create function public.start_snake_product_attempt_v1(');
 if(start<0||end<start)throw Error('Hub source not found');
 sql='begin;\n'+source.slice(start,end).replace('create function','create or replace function')+'\ncommit;';
}
else if(mode==='apply-quota')sql=fs.readFileSync(path.join(root,'migrations/arcade_one_normal_attempt.sql'),'utf8');
else if(mode==='verify')sql=fs.readFileSync(path.join(root,'migrations/arcade_ranked_verify.sql'),'utf8');
else if(mode==='activate-current-test'){
 const id=JSON.parse(fs.readFileSync(path.join(root,'giveaway-test/manifest.json'))).current.snake_runtime.id;
 if(!/^snake-next-[a-f0-9]{12}$/.test(id))throw Error('Unexpected Snake runtime');
 sql=`begin; update public.snake_product_settings set enabled=true,approved_releases=array(select distinct unnest(approved_releases||array['${id}'])) where id=1; select enabled,normal_limit,sponsor_limit,approved_releases from public.snake_product_settings where id=1; commit;`;
}else throw Error('Use transaction-test, apply-schema, update-hub, apply-quota, verify or activate-current-test explicitly');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rytni-ranked-')),file=path.join(dir,'query.sql');
try{
 fs.writeFileSync(file,sql);
 const result=cp.spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'--output','json'],{cwd:path.join(source,'06_Supabase_Edge_Functions'),encoding:'utf8'});
 if(result.error)throw result.error;
 process.stdout.write(result.stdout);process.stderr.write(result.stderr);
 if(mode==='verify'&&!result.status){
  const report=JSON.parse(result.stdout);fs.writeFileSync(path.join(root,'docs/qa/arcade-ranked/database-results.json'),JSON.stringify(report.rows,null,2)+'\n');
 }
 if(result.status)process.exitCode=result.status;
}finally{fs.unlinkSync(file);fs.rmdirSync(dir);}
