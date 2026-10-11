import {EffectMaterial} from '../product/appearance/material.js';
import {RibbonSprites} from '../forest-training/ribbon-sprites.js';

export const POLICY=Object.freeze({transitionTicks:15,baseUnchangedMinimum:.8,edge:['rush','focus','portalPrize','harvest'],negative:'localized cracks only',guard:'short field-following shell',mist:'world only',brambles:'world only'});
const mod=(n,p)=>((n%p)+p)%p;
/** DEV ONLY. RGB accents reuse the approved d/v field. No alpha writes,
 * full-body palette transform, tint of face/cap/moss or new geometry. */
export class AccentMaterial extends EffectMaterial{
 constructor(){super();this.painter.overlay=()=>{};const paint=this.painter;this.painter=(data,k,d,v,radius,start)=>{if(radius<17||d<start)return;const r=data[k],g=data[k+1],b=data[k+2];if(g>r&&g>b)return;paint(data,k,d,v,radius,start);};this.painter.overlay=()=>{};}
 build(tick){
  const s=this.strengths,t=this.table,period=272,rows=73,stride=7;
  const dominant=POLICY.edge.find(k=>s[k]>.01),colors={harvest:[227,199,123],focus:[125,199,205],portalPrize:[175,165,213],rush:[224,175,106]};
  for(let row=0;row<rows;row++)for(let x=0;x<period;x++){
   const v=-18+row/2,i=(row*period+x)*stride;let keep=1,r=0,g=0,b=0;
   const stamp=(color,a)=>{keep*=1-a;r=r*(1-a)+color[0]*a;g=g*(1-a)+color[1]*a;b=b*(1-a)+color[2]*a;};
   // One selected dorsal lane, not a complete neon rim.
   if(dominant&&v>=14&&v<17){const pulse=.85+.15*Math.sin(tick/30),window=dominant==='portalPrize'?(mod(x-tick,91)<20?1:.12):dominant==='rush'?(mod(x-tick*2,91)<60?1:.2):1;stamp(colors[dominant],s[dominant]*.42*pulse*window);}
   if(s.harvest&&v>=8&&v<10&&mod(x-tick/3,91)<2)stamp(colors.harvest,s.harvest*.55);
   // Local muted fungal cracks. No global purple/desaturation replacement.
   if(s.weak&&Math.abs(v)<12&&mod(x+Math.floor(v*1.8),113)<3)stamp([104,83,116],s.weak*.52);
   t[i]=keep;t[i+1]=t[i+2]=t[i+3]=0;t[i+4]=r;t[i+5]=g;t[i+6]=b;
  }
 }
}
export class AccentRibbon extends RibbonSprites{
 constructor(art){super(art);this.material=new AccentMaterial();this.raster.painter=this.material.painter;}
 setSession(s){if(this.material.setSession(s)){this.key=null;this.materialKey=this.material.key;}}
}
