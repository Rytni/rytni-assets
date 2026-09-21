// Prepare the v2 runtime without changing the currently published Hub block.
// Publishing must call the default strict mode; incomplete art is a hard failure.
const fs=require('node:fs'),path=require('node:path');
const assets=['head','ground-calm','ground-calm-earth','food','magnet','drunk','rock','decor','title-background','hero-snake-v2','ui-icons-v1','logo','frame-desktop','frame-mobile','button','button-primary','snake-card','dpad-idle','dpad-up','dpad-down','dpad-left','dpad-right','snake-head-up','snake-head-right','snake-head-down','snake-head-left','snake-body-a','snake-body-b','snake-body-c','snake-body-d','snake-body-e','snake-tail-stage-1','snake-tail-stage-2','snake-tail-tip','biome-cave-ground','biome-cave-obstacle','biome-winter-ground','biome-winter-obstacle','pickup-magnet-v1','pickup-golden-v1','pickup-ghost-v1','pickup-fairy-v1','pickup-time-v1','pickup-drunk-v1','pickup-hiccup-v1','pickup-slime-v1','portal-fairy-entry-v1','portal-fairy-exit-v1','vfx-magnet-v1','vfx-golden-v1','vfx-ghost-v1','vfx-fairy-v1','vfx-time-v1','vfx-drunk-v1','vfx-hiccup-v1','vfx-slime-v1'];
const effectAudio=['magnet','golden','ghost','ghost-warning','fairy','time','drunk','hiccup','hiccup-warning','hiccup-1','hiccup-2','hiccup-3','slime'];
function assemble({allowIncomplete=false}={}){
 const forestAssets=['forest-snake-atlas-v1','forest-ground-v1','forest-decor-v1','forest-objects-v1','forest-food-spore-v1','forest-frame-v1','forest-hud-v1'];
 const missing=[...assets,...forestAssets].filter(n=>!fs.existsSync(path.join(__dirname,'../grib/mushroom-snake-v2',n+'.png')));
 if(missing.length&&!allowIncomplete)throw Error('Snake v2 is NOT publishable. Missing art: '+missing.join(', '));
 const missingAudio=effectAudio.filter(n=>!fs.existsSync(path.join(__dirname,'../grib/mushroom-snake-v2/audio',n+'.wav')));
 if(missingAudio.length&&!allowIncomplete)throw Error('Snake v2 is NOT publishable. Missing effect audio: '+missingAudio.join(', '));
 let hub=fs.readFileSync(path.join(__dirname,'09_T123_ARCADE_HUB_SNAKE.html'),'utf8');
 const start=hub.indexOf("  const bestKey="),end=hub.indexOf('  const registry=');
 if(start<0||end<=start)throw Error('Unexpected Hub source: keep existing lifecycle/registry intact.');
 hub=hub.slice(0,start)+'  const Snake=window.RytniMushroomSnake;\n'+hub.slice(end);
 hub=hub.replace('engine:SnakeEngine','engine:window.MushroomSnakeCore.Engine');
 hub=hub.replace('BASE+g.art',"(id==='snake'?'https://rytni.github.io/rytni-assets/grib/mushroom-snake-v2/':BASE)+g.art");
 return ['snake-core.js','snake-segments.js','snake-forest.js','snake-controller.js'].map(n=>'<script>\n'+fs.readFileSync(path.join(__dirname,n),'utf8')+'\n</script>').join('\n')+'\n'+hub+'\n'+fs.readFileSync(path.join(__dirname,'snake-ui.html'),'utf8');
}
module.exports={assemble,assets};
if(require.main===module){const bundle=assemble();if(process.argv.includes('--bundle'))process.stdout.write(bundle);else console.log('Snake v2 asset gate PASS');}
