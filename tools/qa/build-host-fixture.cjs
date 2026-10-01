// Local verification output only: never touches either release manifest.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'.playwright-cli/phase2a');
fs.mkdirSync(out,{recursive:true});
const names=['01_T123_ОСНОВНЫЕ_СТИЛИ_2.12.html','02_T123_КАРТОЧКА_УЧАСТНИКА_2.12.html','03_T123_СТИЛИ_СТРАНИЦЫ_2.12.html','04_T123_HTML_РАЗМЕТКА_2.12.html','05A_T123_JAVASCRIPT_ЧАСТЬ_1_2.12.html','05B_T123_JAVASCRIPT_ЧАСТЬ_2_2.12.html','07_T123_TIKTOK_КВЕСТ_2.12.html','08_T123_BROWSER_ARCADE_2.15.34.html'];
const blocks=names.map(n=>fs.readFileSync(path.join(root,'tilda-test/blocks',n),'utf8'));
blocks.push(cp.execFileSync(process.execPath,[path.join(root,'arcade/assemble-snake-v2.cjs'),'--bundle'],{encoding:'utf8',maxBuffer:8e6}));
fs.writeFileSync(path.join(out,'host.html'),'<!doctype html><meta charset="utf-8">\n'+blocks.join('\n\n'));
console.log(path.join(out,'host.html'));
