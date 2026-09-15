// Local-only preview; serves current art, never changes channel manifests.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {assemble}=require('./assemble-snake-v2.cjs');
const root=path.resolve(__dirname,'..');
const source=process.env.RYTNI_SOURCE_ROOT||'C:/Codex/Rytni Gift/RYTNI_TRANSFER_2026-07-31/CORE/Сайт';
const fly=fs.readFileSync(path.join(source,'02_Tilda_7_блоков/08_T123_BROWSER_ARCADE_2.15.34.html'),'utf8');
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/grib/')){
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',file.endsWith('.png')?'image/png':file.endsWith('.wav')?'audio/wav':'image/webp');
  return fs.createReadStream(file).pipe(res);
 }
 if(url.pathname!=='/'&&url.pathname!=='/favicon.ico'){res.writeHead(404);return res.end();}
 const html='<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Snake · Green Forest preview</title><style>body{margin:0;background:#0d1412}#applicationPopup{max-width:1160px;margin:20px auto}</style><div id="applicationPopup"><div id="rytniProgressionHub"><div id="progressionPanelArcade"><div id="rytniArcadeHost"></div></div></div></div>'+fly+assemble({allowIncomplete:true});
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');
 res.end(html.replaceAll('https://rytni.github.io/rytni-assets/grib/','/grib/'));
}).listen(8825,'127.0.0.1',()=>console.log('Snake preview: http://127.0.0.1:8825/?arcade_preview=1'));
