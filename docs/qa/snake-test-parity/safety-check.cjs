const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else files.push(file+':'+sha(fs.readFileSync(file)));}}
walk('giveaway');const digest=sha(files.sort().join('\n'));
assert.equal(digest,'5003cfcd190b3e2071e422bf4b12ca597fcf0fdcb16c1109f9e4186e0fa356ed','Production bytes differ from task-start snapshot');
assert.equal(sha(fs.readFileSync('tilda-test/blocks/08_T123_BROWSER_ARCADE_2.15.34.html')),'1c76cc728a16ab87ff0c7f122884154f7fa63edc27630b0e1930cc949681e506','Current Fly source changed');
const locked=['simulation','input','tuning-lab/config.js','gate-one','smooth-v4-proof','progressive-run/session.js','progressive-run/config.js','progressive-run/director.js','progressive-run/food.js','progressive-run/world.js','forest-training/motion.js','forest-training/ribbon-sprites.js','forest-training/ribbon-raster.js','forest-training/renderer.js','forest-training/style.css','forest-training/hud-type.js'];
const diff=cp.execFileSync('git',['diff','2c7a6d4','--name-only','--',...locked.map(p=>'arcade/snake-next/'+p),'grib'],{encoding:'utf8'}).trim();assert.equal(diff,'','Locked simulation/render/art changed');
console.log(JSON.stringify({productionDigest:digest,flyUnchanged:true,lockedSimulationGeometryArt:true}));
