// Copy only the transitive, render-free canonical simulation into the Edge bundle.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),destination=process.argv[2];
if(!destination||!path.isAbsolute(destination))throw Error('Absolute function destination required');
const seen=new Set();
function copy(relative){
 if(seen.has(relative))return;seen.add(relative);
 const source=path.join(root,relative),text=fs.readFileSync(source,'utf8');
 const dest=path.join(destination,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,text);
 for(const m of text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){
  if(!m[1].startsWith('.'))throw Error('Unexpected external simulation dependency');
  const dependency=path.normalize(path.join(path.dirname(relative),m[1]));
  if(dependency.startsWith('..'))throw Error('Dependency outside repository');copy(dependency);
 }
}
copy('server/arcade-verifier/verifier-core.js');
copy('arcade/snake-next/simulation/types.js');
fs.writeFileSync(path.join(destination,'index.ts'),fs.readFileSync(path.join(root,'server/arcade-verifier/index.ts'),'utf8').replace("from './verifier-core.js'","from './server/arcade-verifier/verifier-core.js'"));
console.log(JSON.stringify({modules:seen.size,jwt_verification:true}));
