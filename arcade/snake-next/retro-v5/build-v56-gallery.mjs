import fs from 'node:fs';
const out=new URL('../../../docs/qa/retro-v5-6/',import.meta.url);
const image=(file,label)=>{
 const bytes=fs.readFileSync(new URL(file,out)),w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
 return `<figure><figcaption>${label} · ${w}×${h} · 100%</figcaption><div class="checker"><img src="${file}" width="${w}" height="${h}" alt="${label}"></div></figure>`;
};
const pair=(title,before,after)=>`<section><h2>${title}</h2><div class="scroll"><div class="row">${image(before,'V5.5')}${image(after,'V5.6')}</div></div></section>`;
const runtime=['mobile-844.png','desktop-1920.png'].map(file=>pair('Actual runtime: '+file,'../retro-v5-5/'+file,file)).join('\n');
const native=['head-neck','taper-tail','straight-8','straight-30'].map(id=>pair(id+' / native scale','v55-'+id+'.png',id+'.png')).join('\n');
fs.writeFileSync(new URL('review.html',out),`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Mushroom Snake V5.6 — head/tail micro review</title><style>
*{box-sizing:border-box}body{margin:0;background:#102019;color:#f0e7ce;font:16px/1.5 system-ui,sans-serif}header,section{padding:20px}header{max-width:1100px}h1{margin:0}h2{font-size:18px}a{color:#f1d7a0}.scroll{overflow:auto;border:1px solid #4b6150}.row{display:flex;gap:24px;width:max-content;padding:12px}figure{margin:0;flex:none}figcaption{padding:6px;background:#27382d}.checker{width:max-content;background:repeating-conic-gradient(#29392f 0% 25%,#45584b 0% 50%) 0 0/20px 20px}img{display:block;width:auto;height:auto;max-width:none;image-rendering:pixelated}section{border-top:1px solid #37513d}
</style><header><h1>V5.6 — final micro polish</h1><p>V5.5 → V5.6. Review the actual 844×390 capture first, without zoom. Images are always 1 pixel = 1 CSS pixel at browser zoom 100%; horizontal scrolling is intentional.</p><p>Only internal head art and terminal edge shading changed. Body, neck, corners, micro-texture, moss density and variant selection unchanged. Cell 68 / body 36 / head 42 / terminal 68 and every alpha mask remain locked.</p><p>No ImageGen, renderer/gameplay change, benchmark or publication. Technical connector PASS is not final artistic approval.</p><p><a href="report.md">Report</a> · <a href="capture-results.json">Capture evidence</a> · <a href="../../../arcade/snake-next/retro-v5-review.html">Unchanged isolated DEV renderer</a></p></header>${runtime}${native}</html>\n`);
console.log('V5.6 native gallery written');
