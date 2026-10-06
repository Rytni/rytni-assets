// Read-only local QA server. Isolated port; no production/API transport.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..'),types={html:'text/html',js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json',png:'image/png',ogg:'audio/ogg',wav:'audio/wav',webp:'image/webp'};
http.createServer(async(req,res)=>{try{
 const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).slice(1);
 if(!/^(arcade|grib|docs\/qa|giveaway-test|tilda-test)\//.test(name)||name.split('/').some(s=>s==='..'||s==='.'||s.startsWith('.')))throw Error();
 const file=path.resolve(root,name);if(!file.startsWith(root+path.sep))throw Error();
 const data=await fs.promises.readFile(file);res.writeHead(200,{'Content-Type':types[file.split('.').at(-1)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen({host:'127.0.0.1',port:8776,backlog:512},()=>console.log('Snake UI V4 preview: http://127.0.0.1:8776/'));
