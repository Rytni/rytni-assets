const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm');
const file='tilda-test/blocks/08_T123_BROWSER_ARCADE_2.15.34.html';
const before=cp.execFileSync('git',['show','7cc66d4:'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n');
const current=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
function bodies(source){const lines=source.split('\n'),out={};for(let i=0;i<lines.length;i++){
 const match=/^  (?:async )?function (\w+)\(/.exec(lines[i]);if(!match)continue;
 let end=i+1;while(end<lines.length&&!/^  (?:async )?function |^  (?:const|let|if|window\.)/.test(lines[end]))end++;
 out[match[1]]=lines.slice(i,end).join('\n');}return out;}
const old=bodies(before),now=bodies(current),failures=[];
for(const [name,body]of Object.entries(old)){
 let actual=now[name];
 if(name==='pauseGame')actual=actual.replace('AudioManager.pauseMusic();','');
 if(name==='resumeGame')actual=actual.replace('    AudioManager.resumeMusic();\n','');
 if(name==='resetGame')actual=actual.replace('    AudioManager.resetMusic();\n','');
 if(name==='syncHud')actual=actual.replace('    AudioManager.updateMusic();\n','');
 if(actual!==body)failures.push(name);
}
for(const [start,end]of [['    function tone(','    function noise('],['    function noise(','    function play('],['    function play(','    let warmPromise=']]){
 const section=source=>source.slice(source.indexOf(start),source.indexOf(end));
 if(section(before)!==section(current))failures.push(start.trim());
}
for(const script of current.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
const result={base:'7cc66d4',protectedFlyFunctions:Object.keys(old).length,sfxFunctionsIdentical:3,failures};
fs.writeFileSync(__dirname+'/protection.json',JSON.stringify(result,null,2)+'\n');console.log(result);
if(failures.length)process.exitCode=1;
