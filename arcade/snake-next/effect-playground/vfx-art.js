// Frozen rejected procedural fallback. Production identity comes from PNGs.
import {drawAuthoredVfx} from './asset-bank.js';
// Small authored native sprites, cached once. Runtime only selects/positions
// frames; no strokes, vector rings, arbitrary rotation, blur or image generator.
const palette={d:'#19322b',c:'#78d7d3',h:'#edffdc',g:'#a8cf6c',m:'#507b45',b:'#b17f4d',s:'#624734',p:'#bb88c8',v:'#644b79',r:'#d85f45',o:'#ffc077',y:'#e9bf5a'};
const masters={
 wisp:['.........hh.....','.......hccc.....','......hcccd.....','.....hccccd.....','....hcccdcd.....','...hcccdccd.....','..hcccdcccd.....','..hcdccccd......','..hdccccd.......','...dcccdd.......','....ddd.........','.....c..........','......c.........','.......h........'],
 mote:['......hhh.......','.....hgcgh......','...hhgcgcghh....','..hgcchhhccgh...','..hgcchhhccgh...','...hggchcggch...','....hgcgcgh.....','.....hccch......','......hhh.......','.......g........','......g.........','.....h..........'],
 plate:['....gggg........','...ghhhgg.......','..ghmmmhg.......','..gmmhmmg.......','..gmmhmmg.......','...gmhmg........','....ghg.........','.....g..........'],
 cracked:['...ggg..........','..ghmg..........','..gmddg.........','...dg...........','........gg......','.......ghmg.....','........dg......','...g............','..gmg...........','...g............'],
 glint:['.....h..........','....hyh.........','...hyyyh........','..hyhhhyh.......','..hyhhhyh.......','...hyyyh........','....hyh.........','.....h..........'],
 crown:['..y....y....y...','..yh..yhy..hy...','...yhyyyyyhy....','...yyyyyyyyy....','....hhhhhhh.....','....yyyyyyy.....'],
 ember:['.......o........','......oor.......','.....ohorr......','....ohorrr......','...ohorrr.......','....oorrr.......','.....rrr........','......rr........','....r...........','...o............'],
 thorn:['......o.........','.....orr........','....orrr........','...orrrr........','..orrrrr........','...rrr..........','....rr..........','.....r..........'],
 mold:['.....pp.........','....phhp........','...pvvvvp.......','..pvvpvvp.......','..pvpvvp........','...pvvp.........','....pp..........','.....v..........','....vv..........','...pv...........'],
 rune:['.....hh.........','....hcc.........','...hccd.........','..hccdd.........','...hc...........','....hc..........','.....hc.........','....hccd........','...hccd.........','..hccd..........','...dd...........'],
 cracks:['................','...ss...........','....sss.........','......ssss......','.....ss..sss....','...sss.....ss...','..ss........ss..','......ss........','.......sss......','.........ss.....','..........s.....'],
 tips:['........m.......','.......mg.......','..m....mb.......','..mg..mbb.......','...mbmbb........','...mbb..m.......','....bb.mg.......','.....bmbb.......','....bbbbb.......','...ssbbsss......'],
 roots:['.......m....m...','......mg...mg...','..m...mb..mbb...','..mg.mbb.mbb....','...mbbbbbbb.....','...mbbsbbbb.....','....bssbb..m....','..mbbsbbb.mg....','...bbbsbbmbb....','..sbbbbbbbbb....','...ssbbssbb.....','.....ssss.......'],
 decay:['..b..........m..','...s........g...','........b.......','......s.........','...m.......b....','....g........s..','........m.......','.........g......']
};
const cache=new Map();
export function paintVfx(ctx,kind,phase=0){
 const rows=masters[kind];if(!rows)throw Error('Unknown authored VFX '+kind);
 // Four small authored shimmer phases: only accent ink changes, never pose.
 rows.forEach((row,y)=>[...row].forEach((key,x)=>{if(key==='.')return;ctx.fillStyle=key==='h'&&phase===2?'#e0ecc7':palette[key];ctx.fillRect(x*2,y*2,2,2);}));
 if(phase===1||phase===3){ctx.fillStyle=kind==='mold'?'#bc8ac6':'#fff4bf';ctx.fillRect(24,phase===1?4:22,2,2);ctx.fillRect(26,phase===1?2:24,2,2);}
}
export function vfxSprite(kind,phase=0){const key=kind+':'+phase;if(!cache.has(key)){const c=document.createElement('canvas');c.width=c.height=32;paintVfx(c.getContext('2d'),kind,phase);cache.set(key,c);}return cache.get(key);}
export function drawVfx(ctx,kind,x,y,size,tick=0,opacity=1,startTick=0){if(drawAuthoredVfx(ctx,kind,x,y,size,tick,opacity,startTick))return;ctx.save();ctx.globalAlpha*=opacity;ctx.imageSmoothingEnabled=false;ctx.drawImage(vfxSprite(kind,Math.floor(tick/10)%4),Math.round(x-size/2),Math.round(y-size/2),size,size);ctx.restore();}
export const VFX_KINDS=Object.keys(masters);
