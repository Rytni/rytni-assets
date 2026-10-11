const cp=require('node:child_process'),fs=require('node:fs');
const phase=process.argv[2];if(!/^[a-z-]+$/.test(phase))throw Error('Phase required');
const r=cp.spawnSync('cmd.exe',['/d','/s','/c',`playwright-cli -s=snakev532 run-code --filename=docs/qa/snake-presentation-v5-3-2/${phase}.js`],{encoding:'utf8',maxBuffer:32e6,timeout:600000});
const m=/### Result\r?\n([\s\S]*?)\r?\n###/.exec(r.stdout||'');if(!m)throw Error(r.stdout+r.stderr);
const d=JSON.parse(m[1]);fs.writeFileSync(__dirname+'/'+phase+'.json',JSON.stringify(d,null,2)+'\n');console.log(JSON.stringify({checks:d.checks,failures:d.failures,errors:d.errors,rows:d.rows?.length},null,2));if(d.failures?.length||d.errors?.length)process.exitCode=1;
