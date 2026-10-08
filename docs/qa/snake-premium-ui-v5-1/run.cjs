// Generate evidence only; source editing is never performed by this runner.
const cp=require('node:child_process'),fs=require('node:fs');
const phase=process.argv[2];if(!['before','after','candidate','live','legacy','flows','mobile-contrast'].includes(phase))throw Error('Unexpected QA phase');
const r=cp.spawnSync('cmd.exe',['/d','/s','/c',`playwright-cli -s=snakev43 run-code --filename=docs/qa/snake-premium-ui-v5-1/${phase}.js`],{encoding:'utf8',maxBuffer:32*1024*1024,timeout:600000});
const match=/### Result\r?\n([\s\S]*?)\r?\n###/.exec(r.stdout||'');if(!match)throw Error((r.stdout||'')+(r.stderr||''));
const data=require('./compact.cjs')(JSON.parse(match[1]));fs.writeFileSync(__dirname+'/'+phase+'.json',JSON.stringify(data)+'\n');
console.log(JSON.stringify({phase,checks:data.checks,pass:data.pass,failedChecks:data.failedChecks,errors:data.errors,failed:data.failed,failures:data.failures?.slice(0,12)},null,2));
if(phase!=='before'&&(data.failedChecks||data.errors?.length||data.failed?.length))process.exitCode=1;
