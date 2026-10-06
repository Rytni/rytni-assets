const fs=require('node:fs'),path=require('node:path');
const source=process.env.RYTNI_SOURCE_ROOT||'C:/Codex/Rytni Gift/RYTNI_TRANSFER_2026-07-31/CORE/Сайт';
const {chromium}=require(path.join(source,'node_modules/playwright-core'));
(async()=>{
 const c=await chromium.launchPersistentContext('C:/Users/rytni/AppData/Local/Temp/snake-zoom-qa-20261006',{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,viewport:{width:1366,height:768}});
 try{const p=await c.newPage();await p.goto('edge://settings/appearance');await p.evaluate(()=>new Promise(resolve=>chrome.settingsPrivate.setDefaultZoom(1.25,resolve)));const run=eval('('+fs.readFileSync(path.join(__dirname,'site-candidate-qa.js'),'utf8')+')');const result=await run(p,{reuseContext:true,zoom:1.25});console.log(JSON.stringify(result,null,2));if(!Array.isArray(result))process.exitCode=1;}finally{await c.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
