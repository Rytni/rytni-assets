const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const base='22624f2',dir=__dirname;
fs.writeFileSync(path.join(dir,'baseline-fly.html'),cp.execFileSync('git',['show',base+':tilda-test/blocks/08_T123_BROWSER_ARCADE_2.15.34.html'],{maxBuffer:5e6}));
// Preserve the original diagnostic capture despite subsequent candidate probes.
for(const name of ['diagnose.json','before-fixture-844.png','before-fixture-844-fullscreen.png','before-host-844.png','before-host-844-fullscreen.png'])fs.writeFileSync(path.join(dir,name),cp.execFileSync('git',['show','26ba30c:docs/qa/mushroom-fly-premium-v2-1/'+name],{maxBuffer:8e6}));
