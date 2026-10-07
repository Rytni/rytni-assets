// TEST-only immutable dependency snapshot. No gameplay is inlined into Tilda.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const DEFAULT_ROOT=path.resolve(__dirname,'..');
const ASSET_FAMILIES=['mushroom-snake-menu-v1','mushroom-snake-ui-v3','mushroom-snake-ui-v4','mushroom-snake-ui-v4-1','mushroom-snake-ui-v4-3','mushroom-snake-ui-v5','mushroom-snake-retro-v5','mushroom-snake-effects-v1/assets','mushroom-snake-forest-cabinet-v2','mushroom-snake-forest-final-v3','mushroom-snake-forest-food'];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const posix=value=>value.split(path.sep).join('/');
function readSafe(root,file){
 const full=path.resolve(root,file),relative=path.relative(root,full);
 if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Path outside package root: '+file);
 if(!fs.existsSync(full))throw Error('Missing runtime dependency: '+file);
 if(fs.lstatSync(full).isSymbolicLink()||!fs.statSync(full).isFile())throw Error('Runtime dependency must be a regular file: '+file);
 return fs.readFileSync(full);
}
function prepareRuntime({root=DEFAULT_ROOT}={}){
 root=path.resolve(root);const snakeRoot=path.join(root,'arcade/snake-next'),files=new Map(),sources=new Map();
 function visit(relative){
  relative=posix(path.normalize(relative));
  if(relative.startsWith('../')||path.isAbsolute(relative))throw Error('Dependency outside Snake Next: '+relative);
  if(files.has('snake/'+relative))return;
  if(!/\.(?:html|css|js|mjs)$/.test(relative)||/(?:\.test\.|browser-qa|\/review\.|\/dev\.)/.test('/'+relative))throw Error('Unapproved runtime source: '+relative);
  let text=readSafe(snakeRoot,relative).toString('utf8').replace(/\r\n?/g,'\n');
  if(/https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?=[:/])/i.test(text)||/\b[A-Za-z]:[\\/]/.test(text))throw Error('Runtime contains a development URL/path: '+relative);
  if(relative==='product/index.html')text=text.replace(/<div class="local-badge">[\s\S]*?<\/div>/,'').replace(/\.\/frame\.html\?qa=1/g,'./frame.html');
  sources.set(relative,text);
  files.set('snake/'+relative,Buffer.from(text.replaceAll('/grib/','../../grib/')));
  const dependencies=[];
  if(/\.(?:js|mjs)$/.test(relative)){
   for(const match of text.matchAll(/\b(?:import|export)\s+(?:[^;'"`]*?\sfrom\s*)?['"]([^'"]+)['"]/g))dependencies.push(match[1]);
   for(const match of text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g))dependencies.push(match[1]);
   for(const match of text.matchAll(/\bnew\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g))dependencies.push(match[1]);
  }
  if(relative.endsWith('.html'))for(const match of text.matchAll(/\b(?:src|href)\s*=\s*['"]([^'"]+)['"]/g)){
   if(!match[1].startsWith('/grib/')&&!/^(?:data:|https?:|#)/.test(match[1]))dependencies.push(match[1].split(/[?#]/)[0]);
  }
  if(relative.endsWith('.css'))for(const match of text.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g))dependencies.push(match[1]);
  for(const dependency of dependencies){
   if(!dependency.startsWith('.'))throw Error('Nonlocal runtime dependency: '+dependency);
   visit(posix(path.join(path.dirname(relative),dependency)));
  }
 }
 visit('product/index.html');visit('product/frame.html');
 const combined=[...sources.values()].join('\n');
 function addAsset(file){
  const bytes=readSafe(root,file);
  // JSON metadata must survive Git's Windows text normalization unchanged.
  // PNG/audio artwork stays byte-identical. Freeze canonical LF before hashing.
  files.set(file,file.endsWith('/inventory.json')?Buffer.from(bytes.toString('utf8').replace(/\r\n?/g,'\n')):bytes);
 }
 function walkAssets(relative){
  const dir=path.join(root,relative);
  if(!fs.existsSync(dir))throw Error('Missing runtime asset family: '+relative);
  for(const item of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
   if(item.isSymbolicLink())throw Error('Asset symlink is not allowed: '+relative+'/'+item.name);
   const file=relative+'/'+item.name;
   if(item.isDirectory())walkAssets(file);
   else if(item.isFile()&&(/\.png$/.test(item.name)||item.name==='inventory.json'))addAsset(file);
  }
 }
 for(const family of ASSET_FAMILIES){
  const dynamicForest=combined.includes('/grib/mushroom-snake-${')&&family.startsWith('mushroom-snake-forest-')&&!family.endsWith('food');
  if(combined.includes('/grib/'+family)||dynamicForest)walkAssets('grib/'+family);
 }
 // Shared podium icon is a read-only artwork dependency, never Fly runtime.
 const leader='grib/mushroom-fly-v2/ui/icons-recovery-v1/leader-first-v1.png';
 if(combined.includes('/'+leader))addAsset(leader);
 const audio=[
  ['production/audio.js','assets/audio',['forest-theme-v1.ogg',...['hover','click','pickup','combo','turn','death','result','pause','resume','arrival'].map(n=>n+'-v1.wav')]],
  ['forest-training/audio.js','forest-training/audio',['buff','debuff','portal-enter','portal-exit'].map(n=>n+'.wav')]
 ];
 for(const [owner,dir,names]of audio)if(sources.has(owner))for(const name of names)files.set('snake/'+dir+'/'+name,readSafe(snakeRoot,dir+'/'+name));
 for(const [file,bytes]of files)if(file.endsWith('/inventory.json')){
  const inventory=JSON.parse(bytes);
  if(!Array.isArray(inventory.assets))throw Error('Invalid runtime asset inventory: '+file);
  for(const asset of inventory.assets)if(typeof asset.file!=='string'||!/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.png$/.test(asset.file)||!files.has(path.posix.dirname(file)+'/'+asset.file))throw Error('Invalid or missing inventory dependency: '+file+' / '+asset.file);
 }
 // Check literal paths as well as family presence. Template-derived paths use
 // the reviewed, bounded families above; their inventories are snapshotted.
 for(const match of combined.matchAll(/\/grib\/(?![^'"`\s]*\$\{)([A-Za-z0-9_./-]+\.(?:png|json))/g))if(!files.has('grib/'+match[1]))throw Error('Missing runtime asset: grib/'+match[1]);
 const entries=[...files.keys()].sort().map(file=>({file,sha256:hash(files.get(file)),size:files.get(file).length}));
 const id='snake-next-'+hash(Buffer.from(JSON.stringify(entries))).slice(0,12);
 const manifest={schema:1,id,entry:'snake/product/index.html',files:entries};
 return {manifest,files};
}
function publishRuntime(runtime,{root=DEFAULT_ROOT}={}){
 const {manifest,files}=runtime,relative='releases/'+manifest.id,base=path.join(root,'giveaway-test',relative);
 const manifestBytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n'),outputs=new Map([...files,['runtime.json',manifestBytes]]);
 // Verify the entire destination before writing anything. Existing immutable
 // candidates are never repaired or replaced silently.
 for(const [file,bytes]of outputs){const target=path.join(base,file);if(fs.existsSync(target)&&!readSafe(base,file).equals(bytes))throw Error('Immutable runtime collision: '+relative+'/'+file);}
 for(const [file,bytes]of outputs){const target=path.join(base,file);fs.mkdirSync(path.dirname(target),{recursive:true});if(!fs.existsSync(target))fs.writeFileSync(target,bytes,{flag:'wx'});}
 return {id:manifest.id,file:relative+'/runtime.json',sha256:hash(manifestBytes),size:manifestBytes.length,entry:relative+'/'+manifest.entry};
}
function assembleCandidate({root=DEFAULT_ROOT}={}){
 const snapshot=prepareRuntime({root}),runtime=publishRuntime(snapshot,{root});
 const host=readSafe(root,'arcade/snake-next/test-host.html').toString('utf8').replace(/\r\n?/g,'\n');
 const tokens=host.match(/__SNAKE_NEXT_RUNTIME_URL__/g)||[];
 if(tokens.length!==1)throw Error('Snake Next host needs exactly one immutable runtime URL token.');
 const base='https://rytni.github.io/rytni-assets/giveaway-test/releases/'+runtime.id+'/';
 const bundle=host.replace('__SNAKE_NEXT_RUNTIME_URL__','https://rytni.github.io/rytni-assets/giveaway-test/'+runtime.entry).replace(/https:\/\/rytni\.github\.io\/rytni-assets\/(grib\/mushroom-snake-(?:menu-v1|ui-v3|ui-v4|ui-v4-1)\/[A-Za-z0-9_-]+\.png)/g,(url,file)=>{
  if(!snapshot.files.has(file))throw Error('Host artwork missing from Snake snapshot: '+file);
  return base+file;
 });
 return {runtime,bundle};
}
function assemble(options){return assembleCandidate(options).bundle;}
function validateRuntime({root=DEFAULT_ROOT,descriptor}={}){
 if(!descriptor||!/^snake-next-[a-f0-9]{12}$/.test(descriptor.id)||descriptor.file!=='releases/'+descriptor.id+'/runtime.json'||descriptor.entry!=='releases/'+descriptor.id+'/snake/product/index.html'||!/^\w{64}$/.test(descriptor.sha256)||!Number.isSafeInteger(descriptor.size)||descriptor.size<=0)throw Error('Invalid Snake runtime descriptor');
 const base='giveaway-test/releases/'+descriptor.id+'/',bytes=readSafe(root,descriptor.file.replace(/^releases\//,'giveaway-test/releases/'));
 if(hash(bytes)!==descriptor.sha256||bytes.length!==descriptor.size)throw Error('Runtime manifest hash/size mismatch');
 const manifest=JSON.parse(bytes);
 if(manifest.schema!==1||manifest.id!==descriptor.id||manifest.entry!=='snake/product/index.html'||!Array.isArray(manifest.files)||!manifest.files.length)throw Error('Invalid Snake runtime manifest');
 const canonical=manifest.files.map(f=>({file:f.file,sha256:f.sha256,size:f.size}));
 if('snake-next-'+hash(Buffer.from(JSON.stringify(canonical))).slice(0,12)!==manifest.id)throw Error('Runtime content identity mismatch');
 const seen=new Set(),paths=[];
 for(const f of manifest.files){
  if(typeof f.file!=='string'||!/^(?:snake|grib)\/[A-Za-z0-9_.\/-]+$/.test(f.file)||f.file.split('/').some(p=>!p||p==='.'||p==='..')||seen.has(f.file)||!/^\w{64}$/.test(f.sha256)||!Number.isSafeInteger(f.size)||f.size<0)throw Error('Invalid runtime dependency manifest entry');
  seen.add(f.file);const data=readSafe(root,base+f.file);
  if(hash(data)!==f.sha256||data.length!==f.size)throw Error('Runtime dependency hash/size mismatch: '+f.file);
  paths.push(base+f.file);
 }
 const expected=prepareRuntime({root});
 if(JSON.stringify(expected.manifest)!==JSON.stringify(manifest))throw Error('Runtime snapshot does not match current Snake source closure');
 return [base+'runtime.json',...paths];
}
module.exports={prepareRuntime,publishRuntime,assembleCandidate,assemble,validateRuntime};
if(require.main===module){
 try{if(process.argv.includes('--validate')){const file=process.argv[process.argv.indexOf('--validate')+1]||path.join(DEFAULT_ROOT,'giveaway-test/manifest.json'),manifest=JSON.parse(fs.readFileSync(file,'utf8'));console.log(JSON.stringify(validateRuntime({descriptor:manifest.current?.snake_runtime})));}else if(process.argv.includes('--candidate'))console.log(JSON.stringify(assembleCandidate()));else if(process.argv.includes('--runtime'))console.log(JSON.stringify(publishRuntime(prepareRuntime())));else if(process.argv.includes('--bundle'))process.stdout.write(assemble());else{const p=prepareRuntime();console.log('Snake Next package gate PASS: '+p.manifest.id+', '+p.manifest.files.length+' files');}}
 catch(error){console.error(error.message);process.exitCode=1;}
}
