const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {safe,sha}=require('./build-main-candidate.cjs');
const {validateRuntime}=require('../arcade/assemble-snake-next.cjs');
const ROOT=path.resolve(__dirname,'..');
function verify({directory,root=ROOT}){
 directory=path.resolve(directory);
 const report=JSON.parse(fs.readFileSync(path.join(directory,'release-report.json')));
 if(report.status!=='PREPARED_NOT_PUBLISHED'||report.publish_performed!==false||report.season_changed!==false)throw Error('Not an offline candidate');
 if(sha(fs.readFileSync(path.join(root,'giveaway/manifest.json')))!==report.source_main_manifest_sha256)throw Error('MAIN baseline changed; reprepare candidate');
 if(sha(fs.readFileSync(path.join(root,'giveaway-test/manifest.json')))!==report.source_test_manifest_sha256)throw Error('Approved TEST changed; review candidate again');
 const seen=new Set();
 for(const item of report.files){
  if(seen.has(item.file))throw Error('Duplicate package entry');seen.add(item.file);
  const bytes=fs.readFileSync(safe(directory,item.file));if(bytes.length!==item.size||sha(bytes)!==item.sha256)throw Error('Package integrity mismatch: '+item.file);
 }
 for(const item of report.source_inputs)if(sha(fs.readFileSync(safe(root,item.file)))!==item.sha256)throw Error('Source changed: '+item.file);
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'candidate-manifest.json'))),current=manifest.current;
 if(manifest.published_at!==null||JSON.stringify(current)!==JSON.stringify(report.current)||JSON.stringify(manifest.previous)!==JSON.stringify(report.rollback))throw Error('Draft manifest differs from report');
 const app=fs.readFileSync(safe(directory,'giveaway/'+current.file));
 if(sha(app)!==current.sha256||app.length!==current.size)throw Error('App hash mismatch');
 const html=app.toString('utf8');
 for(const marker of ['data-channel="main"','window.RYTNI_VIDEO_QUEST_ENABLED=false','const preview=false;','function callArcadeVerifier','id="rulesCommunityRating"','повторить отправку без повторного начисления'])if(!html.includes(marker))throw Error('Missing MAIN contract: '+marker);
 for(const marker of ['/giveaway-test/','data-channel="test"','id="supportTicketLauncher"','<span class="ms-player-test">TEST</span>','Смотреть ролики в прокачке','выполняет ли видеозадания','__ARCADE_MUSIC_URL__','__SNAKE_NEXT_RUNTIME_URL__'])if(html.includes(marker))throw Error('Unwanted candidate content: '+marker);
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))if(match[1].trim())new vm.Script(match[1]);
 const descriptor=current.snake_runtime,runtimeBytes=fs.readFileSync(safe(directory,'giveaway/'+descriptor.file));
 validateRuntime({root,descriptor});
 if(sha(runtimeBytes)!==descriptor.sha256||runtimeBytes.length!==descriptor.size)throw Error('Runtime descriptor mismatch');
 const runtime=JSON.parse(runtimeBytes),identity='snake-next-'+sha(Buffer.from(JSON.stringify(runtime.files))).slice(0,12);
 if(identity!==descriptor.id||runtime.id!==descriptor.id||descriptor.entry!=='releases/'+identity+'/'+runtime.entry)throw Error('Runtime identity mismatch');
 for(const item of runtime.files){
  const file='giveaway/releases/'+runtime.id+'/'+item.file,b=fs.readFileSync(safe(directory,file));
  if(!seen.has(file)||sha(b)!==item.sha256||b.length!==item.size)throw Error('Runtime dependency mismatch: '+item.file);
 }
 for(const item of [current,manifest.previous])if(!seen.has('giveaway/'+item.file))throw Error('Missing app or rollback');
 return {pass:true,status:report.status,id:current.id,package_files:report.files.length,runtime_files:runtime.files.length,source_inputs:report.source_inputs.length,main_unchanged:true,test_unchanged:true,published:false};
}
module.exports={verify};
if(require.main===module){try{const result=verify({directory:process.argv[2]});console.log(JSON.stringify(result));}catch(e){console.error(e.message);process.exitCode=1;}}
