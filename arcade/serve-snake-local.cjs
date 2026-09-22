// Local-only assembly preview, including the existing Fly audio/lifecycle owner.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const repo=path.resolve(__dirname,'..'),source=process.env.RYTNI_SOURCE_ROOT||'C:/Codex/Rytni Gift/RYTNI_TRANSFER_2026-07-31/CORE/Сайт';
const port=Number(process.env.SNAKE_QA_PORT||8827);
http.createServer((q,r)=>{
 const u=new URL(q.url,'http://localhost');
 if(u.pathname==='/favicon.ico'){r.writeHead(204);return r.end();}
 if(u.pathname.startsWith('/assets/')){
  const file=path.resolve(repo,decodeURIComponent(u.pathname.slice(8))),relative=path.relative(repo,file);
  if(relative.startsWith('..')||path.isAbsolute(relative)||!fs.existsSync(file)||!fs.statSync(file).isFile()){r.writeHead(404);return r.end();}
  r.setHeader('Content-Type',file.endsWith('.png')?'image/png':file.endsWith('.wav')?'audio/wav':file.endsWith('.webp')?'image/webp':'application/octet-stream');return fs.createReadStream(file).pipe(r);
 }
 try{
  delete require.cache[require.resolve('./assemble-snake-v2.cjs')];
  const fly=fs.readFileSync(path.join(source,'02_Tilda_7_блоков/08_T123_BROWSER_ARCADE_2.15.34.html'),'utf8');
  const html='<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;background:#0d1412}#applicationPopup{max-width:1160px;margin:20px auto}</style><div id="applicationPopup"><div id="rytniProgressionHub"><div id="progressionPanelArcade"><div id="rytniArcadeHost"></div></div></div></div>'+fly+require('./assemble-snake-v2.cjs').assemble();
  r.setHeader('Content-Type','text/html;charset=utf-8');r.end(html.replaceAll('https://rytni.github.io/rytni-assets/','/assets/'));
 }catch(e){r.writeHead(500);r.end(e.message);}
}).listen(port,'127.0.0.1',()=>console.log('Local-only Snake preview: http://127.0.0.1:'+port));
