// Fly presentation allowlist. Every other named function, including backend,
// simulation, audio and lifecycle, must stay byte-identical to the approved base.
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),vm=require('node:vm');
const file='tilda-test/blocks/08_T123_BROWSER_ARCADE_2.15.34.html';
const base=cp.execFileSync('git',['show','a9aa81c:'+file],{encoding:'utf8'}),now=fs.readFileSync(file,'utf8');
const allowed=new Set(['renderShell','showMenu','renderBoard','handleMenuAction','applyHub']);
const functions=s=>{const a=s.match(/(?:^  (?:async )?function |^  [a-zA-Z]\w*=function)/gm)||[];const lines=s.split('\n'),out={};for(let i=0;i<lines.length;i++){const m=/^  (?:async )?function (\w+)\(/.exec(lines[i]);if(!m)continue;let j=i+1;while(j<lines.length&&!/^  (?:async )?function |^  (?:const|let|if|window\.)/.test(lines[j]))j++;out[m[1]]=lines.slice(i,j).join('\n');}return out;};
const old=functions(base),current=functions(now),fail=[];for(const [name,body]of Object.entries(old))if(!allowed.has(name)&&current[name]!==body)fail.push(name);
const protectedPaths=['arcade/snake-next',':(glob)grib/mushroom-snake*/**','grib/arcade-v2','grib/mushroom-fly-v2','giveaway/manifest.json'];
const changed=cp.execFileSync('git',['diff','a9aa81c','--name-only','--',...protectedPaths],{encoding:'utf8'}).trim();if(changed)fail.push('protected paths: '+changed);
for(const script of now.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
const result={base:'a9aa81c',protectedFunctions:Object.keys(old).length-allowed.size,failures:fail,productionSHA256:crypto.createHash('sha256').update(fs.readFileSync('giveaway/manifest.json')).digest('hex')};
fs.writeFileSync(__dirname+'/protection.json',JSON.stringify(result,null,2)+'\n');console.log(result);if(fail.length)process.exitCode=1;
