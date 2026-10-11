// Generated manifest only; retain the last published good release, never a local intermediate.
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const p='giveaway-test/manifest.json',m=JSON.parse(fs.readFileSync(p)),base=JSON.parse(cp.execFileSync('git',['show','22624f2:'+p],{encoding:'utf8'}));
if(base.current.id!=='2.15.33-3e5257288eb3'||m.current.snake_runtime.id!=='snake-next-78436309631c')throw Error('Unexpected publication base');
const bytes=fs.readFileSync('giveaway-test/'+m.current.file);if(crypto.createHash('sha256').update(bytes).digest('hex')!==m.current.sha256)throw Error('Candidate bytes mismatch');m.previous=base.current;fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');console.log({current:m.current.id,previous:m.previous.id});
