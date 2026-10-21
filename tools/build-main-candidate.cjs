// OFFLINE ONLY. Never writes a repository manifest or invokes deployment/DB APIs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {prepareRuntime,validateRuntime,renderHost}=require('../arcade/assemble-snake-next.cjs');
const ROOT=path.resolve(__dirname,'..');
const BLOCKS=[
 '01_T123_ОСНОВНЫЕ_СТИЛИ_2.12.html','02_T123_КАРТОЧКА_УЧАСТНИКА_2.12.html',
 '03_T123_СТИЛИ_СТРАНИЦЫ_2.12.html','04_T123_HTML_РАЗМЕТКА_2.12.html',
 '05A_T123_JAVASCRIPT_ЧАСТЬ_1_2.12.html','05B_T123_JAVASCRIPT_ЧАСТЬ_2_2.12.html',
 '07_T123_TIKTOK_КВЕСТ_2.12.html','08_T123_BROWSER_ARCADE_2.15.34.html',
 '10_T123_COMMUNITY_RANKING.html','11_T123_ARCADE_SECURITY.html'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const normalized=b=>b.toString('utf8').replace(/\r\n?/g,'\n').trimEnd();
function outside(root,output){
 if(!path.isAbsolute(output))throw Error('An absolute external output directory is required');
 const target=path.resolve(output),relative=path.relative(root,target);
 if(!relative||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw Error('Candidate output must be outside the source repository');
 if(fs.existsSync(target))throw Error('Candidate directory already exists; use a new directory');
 return target;
}
function safe(base,file){
 if(typeof file!=='string'||file.includes('\\')||file.split('/').some(p=>!p||p==='.'||p==='..')||path.isAbsolute(file))throw Error('Unsafe candidate path');
 const target=path.resolve(base,file),rel=path.relative(base,target);
 if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('Candidate path escapes root');
 return target;
}
function readVerified(base,descriptor){
 const bytes=fs.readFileSync(safe(base,descriptor.file));
 if(bytes.length!==descriptor.size||sha(bytes)!==descriptor.sha256)throw Error('Release integrity mismatch: '+descriptor.file);
 return bytes;
}
function build({root=ROOT,output}){
 root=path.resolve(root);output=outside(root,output);
 const mainPath=path.join(root,'giveaway/manifest.json'),testPath=path.join(root,'giveaway-test/manifest.json');
 const beforeMain=fs.readFileSync(mainPath),beforeTest=fs.readFileSync(testPath);
 const main=JSON.parse(beforeMain),test=JSON.parse(beforeTest);
 const rollback=readVerified(path.join(root,'giveaway'),main.current);
 const approvedTest=readVerified(path.join(root,'giveaway-test'),test.current);
 validateRuntime({root,descriptor:test.current.snake_runtime});
 const snapshot=prepareRuntime({root}),runtime=test.current.snake_runtime;
 const inputs=[],parts=BLOCKS.map(name=>{
  const file='tilda-test/blocks/'+name,bytes=fs.readFileSync(path.join(root,file));inputs.push({file,sha256:sha(bytes)});return normalized(bytes);
 });
 const version=parts[4].match(/window\.RYTNI_RELEASE\s*=\s*"([^"]+)"/)?.[1];
 if(!version)throw Error('Missing release version');
 // The complete approved source set is composed; no additive old-MAIN overlay.
 parts.push(renderHost(snapshot,runtime,{root,channel:'giveaway'}).trimEnd());
 let html=parts.join('\n\n')+'\n';
 const mount='<div id="communityRankingMount" data-channel="test"></div>';
 if(html.split(mount).length!==2)throw Error('Unexpected ranking mount');
 html=html.replace(mount,mount.replace('"test"','"main"'));
 html=html.replaceAll('/giveaway-test/','/giveaway/');
 const music='https://storage-1090.s3hoster.by/rytnistatictest/giveaway/releases/'+runtime.id+'/grib/arcade-music-v1/player.js';
 html=html.replaceAll('__ARCADE_MUSIC_URL__',music);
 // MAIN must not enter a mock/preview path through public query parameters.
 const replacements=[
  [/  const preview=\/\[\?&\]arcade_preview=1[^\n]+;/g,'  const preview=false;'],
  [/  const diagEnabled=[^\n]+;/g,'  const diagEnabled=false;'],
  [/  const perfEnabled=[^\n]+;/g,'  const perfEnabled=false;'],
  [/const previewRequested=new URL\(location.href\).searchParams.get\("progression_preview"\)==="1";/g,'const previewRequested=false;'],
  [/const roomPreviewRequested=new URL\(location.href\).searchParams.get\("room_preview"\)==="1";/g,'const roomPreviewRequested=false;'],
  [/<span class="ms-player-test">TEST<\/span>/g,''],
  [/url.searchParams.set\('test','1'\);/g,''],
  [/if\(query.get\('qa'\)==='1'\)url.searchParams.set\('qa','1'\);/g,''],
  [/if\(query.get\('arcade_preview'\)==='1'\)url.searchParams.set\('mock','ready'\);/g,''],
 ];
 for(const [pattern,value] of replacements){if(!pattern.test(html))throw Error('MAIN transform source contract changed: '+pattern);pattern.lastIndex=0;html=html.replace(pattern,value);}
 if(html.includes('/giveaway-test/')||html.includes('__ARCADE_MUSIC_URL__')||html.includes('__SNAKE_NEXT_RUNTIME_URL__'))throw Error('Unresolved TEST dependency');
 if(!html.includes('const preview=false;'))throw Error('MAIN preview gate missing');
 let scripts=0;for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))if(m[1].trim()){new vm.Script(m[1]);scripts++;}
 const bytes=Buffer.from(html),digest=sha(bytes),id=version+'-'+digest.slice(0,12);
 const current={id,version,loader_schema:2,file:'releases/'+id+'/app.html',sha256:digest,size:bytes.length,snake_runtime:runtime};
 const manifest={schema:1,published_at:null,current,previous:main.current};
 const files=new Map([
  ['giveaway/'+current.file,bytes],['giveaway/'+main.current.file,rollback],
  ['candidate-manifest.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n')],
  ['rollback-manifest.json',beforeMain],
 ]);
 const runtimeRoot='giveaway/releases/'+runtime.id+'/';
 for(const [file,data] of snapshot.files)files.set(runtimeRoot+file,data);
 const runtimeBytes=fs.readFileSync(safe(path.join(root,'giveaway-test'),runtime.file));
 files.set('giveaway/'+runtime.file,runtimeBytes);
 for(const file of ['arcade/snake-next/test-host.html','arcade/assemble-snake-next.cjs','tools/build-main-candidate.cjs'])inputs.push({file,sha256:sha(fs.readFileSync(path.join(root,file)))});
 const report={status:'PREPARED_NOT_PUBLISHED',created_at:new Date().toISOString(),channel:'main',
  current,rollback:main.current,approved_test:test.current,approved_test_hash_verified:sha(approvedTest)===test.current.sha256,
  source_inputs:inputs,source_main_manifest_sha256:sha(beforeMain),source_test_manifest_sha256:sha(beforeTest),
  inline_scripts_checked:scripts,changes_from_test:['current rules from canonical source','MAIN ranking channel','MAIN immutable runtime/music URLs','no query-triggered preview or TEST badge'],
  publish_performed:false,season_changed:false,open_items:['publish and refresh MAIN ranking for the new season','fresh backup and explicit season transition','controlled real ranked HTTP award before public launch'],
  files:[...files].map(([file,data])=>({file,size:data.length,sha256:sha(data)}))};
 files.set('release-report.json',Buffer.from(JSON.stringify(report,null,2)+'\n'));
 files.set('README.txt',Buffer.from('PREPARED ONLY — NOT PUBLISHED\n\nThe full MAIN app, 529 immutable runtime files and current MAIN rollback are included.\nNo live manifest or season was changed. candidate-manifest.json is a draft, not a deployed manifest.\nDo not upload it until separate approval; it must be published last after all dependencies.\nThe existing MAIN loader can consume this schema. MAIN ranking intentionally remains unpublished.\nSee the source repository docs/SEASON4_MAIN_CANDIDATE.md for checks and launch steps.\n'));
 for(const [file,data] of files){const target=safe(output,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data,{flag:'wx'});}
 if(!fs.readFileSync(mainPath).equals(beforeMain)||!fs.readFileSync(testPath).equals(beforeTest))throw Error('Source manifests changed during preparation');
 return report;
}
module.exports={build,safe,outside,sha,BLOCKS};
if(require.main===module){try{const at=process.argv.indexOf('--output');if(at<0)throw Error('--output ABSOLUTE_DIRECTORY required');const result=build({output:process.argv[at+1]});console.log(JSON.stringify({status:result.status,id:result.current.id,files:result.files.length,published:false}));}catch(e){console.error(e.message);process.exitCode=1;}}
