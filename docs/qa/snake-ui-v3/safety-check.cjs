const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else files.push(file+':'+sha(fs.readFileSync(file)));}}
walk('giveaway');const productionDigest=sha(files.sort().join('\n'));
assert.equal(productionDigest,'5003cfcd190b3e2071e422bf4b12ca597fcf0fdcb16c1109f9e4186e0fa356ed');
assert.equal(sha(fs.readFileSync('tilda-test/blocks/08_T123_BROWSER_ARCADE_2.15.34.html')),'1c76cc728a16ab87ff0c7f122884154f7fa63edc27630b0e1930cc949681e506');
// Scope all prior approved art and canonical gameplay to the ACTUAL start,
// not an older product checkpoint. New UI V3 is intentionally unlocked.
const locked=['simulation','input','gate-one','smooth-v4-proof','progressive-run','effect-playground','forest-training','product/appearance','product/backend.js','product/controller.js','product/progression.js','product/host-bridge.js'];
const tracked=cp.execFileSync('git',['ls-tree','-r','--name-only','14eeb95','--','grib',...locked.map(p=>'arcade/snake-next/'+p)],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const normalize=(file,b)=>/\.(?:js|css|html|json|md|mjs|cjs|txt)$/.test(file)?Buffer.from(b.toString('utf8').replace(/\r\n/g,'\n')):b;
for(const file of tracked){const base=cp.execFileSync('git',['show','14eeb95:'+file],{maxBuffer:32*1024*1024});assert.ok(normalize(file,base).equals(normalize(file,fs.readFileSync(file))),'Locked file changed: '+file);}
console.log(JSON.stringify({productionDigest,flyUnchanged:true,lockedFiles:tracked.length,gameplayGeometrySkinsAndApprovedArtUnchanged:true}));
