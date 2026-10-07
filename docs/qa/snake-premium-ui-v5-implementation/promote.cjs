// Promote approved individual masters, NEVER flattened concepts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),source=path.join(root,'docs/qa/snake-premium-ui-v5/masters'),target=path.join(root,'grib/mushroom-snake-ui-v5');
fs.mkdirSync(target,{recursive:true});
const assets=fs.readdirSync(source).filter(n=>n.endsWith('.png')).sort().map(file=>{
 const bytes=fs.readFileSync(path.join(source,file)),dest=path.join(target,file);
 if(fs.existsSync(dest)&&!fs.readFileSync(dest).equals(bytes))throw Error('Refusing different asset: '+file);
 if(!fs.existsSync(dest))fs.copyFileSync(path.join(source,file),dest);
 return {file,source:'docs/qa/snake-premium-ui-v5/masters/'+file,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
});
fs.writeFileSync(path.join(target,'inventory.json'),JSON.stringify({schema:1,approval:'Human V5 implementation approval; static checkpoint 95163e3',assets},null,2)+'\n');
console.log('Promoted '+assets.length+' byte-identical individual masters.');
