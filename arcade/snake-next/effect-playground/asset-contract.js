// Production delivery contract, NOT artwork. Pending entries never request URLs.
// Approve individual PNGs in asset-approvals.js only after human art review.
export const ASSET_ROOT='/grib/mushroom-snake-effects-v1/assets/';
export const EFFECT_NAMES={harvest:'harvest',focus:'focus',spores:'spores',guard:'guard',portalPrize:'portal-plus',rush:'rush',weak:'corruption',brambles:'roots',mist:'mist'};
const specs={};
function add(key,file,w,h,frames=1,ticks=10,loop=true,content={x:0,y:0,w,h},anchor={x:w/2,y:h/2}){
 specs[key]=Object.freeze({key,url:ASSET_ROOT+file,frameWidth:w,frameHeight:h,sheetWidth:w*frames,sheetHeight:h,frames,ticks,loop,content:Object.freeze(content),anchor:Object.freeze(anchor),status:'awaiting-artwork'});
}
for(const [kind,name] of Object.entries(EFFECT_NAMES)){
 for(const [role,n,pad,frames]of [['field@1x',64,4,1],['field-lod',24,2,1],['hud',32,2,1],['idle',64,4,4]]){
  const suffix={'field@1x':'field','field-lod':'lod',hud:'hud',idle:'idle'}[role];
  add(kind+'.'+role,'effects/'+name+'-'+suffix+'.png',n,n,frames,15,true,{x:pad,y:pad,w:n-2*pad,h:n-2*pad});
 }
}
// All sheets are one horizontal row; time is authoritative active simulation
// ticks (60 Hz), never Date.now/RAF counters. One-shot frames clamp, idle loops.
const vfx=[
 ['harvest-sparkle',32,32,4,6,true],['harvest-third-burst',64,64,6,3,false],
 ['focus-wisp',32,32,4,10,true],['spore-idle',24,24,4,12,true],
 ['spore-trail',32,16,4,5,true],['spore-burst',48,48,6,3,false],
 ['guard-plate',40,40,4,12,true],['guard-charged',48,48,4,8,true],['guard-break',64,64,6,3,false],
 ['portal-charged-ring',68,68,4,10,true],['portal-body-trail',32,32,4,6,true],
 ['rush-ember',32,32,4,6,true],['rush-thorn',32,32,4,10,true],
 ['corruption-particle',32,32,4,10,true],
 ['roots-crack',68,68,4,9,false],['roots-sprout',68,68,4,9,false],['roots-root',68,68,4,15,true],['roots-decay',68,68,6,3,false],
 ['mist-puff',96,64,4,20,true]
];
for(const [key,w,h,n,t,loop]of vfx)add('vfx.'+key,'vfx/'+key+'.png',w,h,n,t,loop);
for(const name of ['golden','corrupted'])for(const [role,n,pad]of [['field@1x',48,2],['field-lod',24,2]])
 add('food-'+name+'.'+role,'food/'+name+'-'+(role==='field@1x'?'field':'lod')+'.png',n,n,1,10,true,{x:pad,y:pad,w:n-2*pad,h:n-2*pad});
export const ASSET_CONTRACT=Object.freeze(specs);
export const PICKUP_RULE=Object.freeze({desktopScale:.68,mobileScale:.94,lodBelow:28,desktopMin:21,mobileMin:19});
export const FOOD_RULE=Object.freeze({desktopScale:.70,mobileScale:.70,lodBelow:28,desktopMin:15,mobileMin:14});
export const VFX_ALIASES=Object.freeze({wisp:'focus-wisp',mote:'spore-idle',plate:'guard-plate',cracked:'guard-break',glint:'harvest-sparkle',crown:'harvest-sparkle',ember:'rush-ember',thorn:'rush-thorn',mold:'corruption-particle',rune:'portal-charged-ring',cracks:'roots-crack',tips:'roots-sprout',roots:'roots-root',decay:'roots-decay'});
