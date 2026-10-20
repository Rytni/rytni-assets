const cp=require('node:child_process'),fs=require('node:fs');
const result=cp.spawnSync('cmd.exe',['/d','/s','/c','playwright-cli -s=musicqa run-code --filename=docs/qa/arcade-music/browser.js'],{encoding:'utf8',timeout:240000,maxBuffer:10e6});
const match=/### Result\r?\n([\s\S]*?)\r?\n###/.exec(result.stdout||'');
if(!match)throw Error(result.stdout+result.stderr);
const data=JSON.parse(match[1]);fs.writeFileSync(__dirname+'/browser-results.json',JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({checks:data.checks,failures:data.failures,errors:data.errors},null,2));
if(result.status){console.error(result.stderr);console.error((result.stdout||'').slice(-2500));}
if(result.status||data.failures.length||data.errors.length)process.exitCode=1;
