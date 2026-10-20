const cp=require('node:child_process'),fs=require('node:fs');
const r=cp.spawnSync('cmd.exe',['/d','/s','/c','playwright-cli -s=rankedqa run-code --filename=docs/qa/arcade-ranked/browser.js'],{encoding:'utf8',timeout:90000,maxBuffer:2e6});
const m=/### Result\r?\n([\s\S]*?)\r?\n###/.exec(r.stdout||'');
if(!m)throw Error(r.stdout+r.stderr);const result=JSON.parse(m[1]);
fs.writeFileSync(__dirname+'/browser-results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({checks:result.checks,failures:result.failures,errors:result.errors}));
if(r.status||result.failures.length||result.errors.length)process.exitCode=1;
