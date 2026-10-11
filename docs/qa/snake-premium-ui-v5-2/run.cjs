const cp=require('node:child_process'),fs=require('node:fs');
const phase=process.argv[2]||'after';
if(!['before','after','host','live','effects','flows','overlay'].includes(phase))throw Error('Unknown phase');
const r=cp.spawnSync('cmd.exe',['/d','/s','/c',`playwright-cli -s=snakev52 run-code --filename=docs/qa/snake-premium-ui-v5-2/${phase}.js`],{encoding:'utf8',maxBuffer:32e6,timeout:600000});
const m=/### Result\r?\n([\s\S]*?)\r?\n###/.exec(r.stdout||'');if(!m)throw Error(r.stdout+r.stderr);
const d=JSON.parse(m[1]);fs.writeFileSync(__dirname+'/'+phase+'.json',JSON.stringify(d,null,2)+'\n');console.log(JSON.stringify({phase,checks:d.checks,failures:d.failures,errors:d.errors,failed:d.failed},null,2));if(d.failures?.length||d.errors?.length||d.failed?.length)process.exitCode=1;
