import {CELL} from '../../smooth-v4-proof/ribbon.js';

export const EFFECT_KINDS=Object.freeze(['focus','harvest','spores','guard','portalPrize','rush','weak','brambles','mist']);
export const MATERIAL_POLICY=Object.freeze({transitionTicks:15,period:CELL*4,rows:73,patternOrder:['spores','portalPrize','guard'],paletteOrder:['harvest','rush','weak'],edgeOrder:['focus','mist','rush'],headAccentOrder:['harvest','spores','portalPrize','focus','guard','rush','weak']});
const PERIOD=MATERIAL_POLICY.period,ROWS=MATERIAL_POLICY.rows,STRIDE=7;
const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);},mod=(n,p)=>((n%p)+p)%p;
const C=Object.freeze({harvest:[242,186,72],rush:[216,111,53],weak:[145,101,160],spores:[250,174,215],sporeLight:[255,232,189],guard:[66,148,96],guardLight:[229,203,116],portal:[179,146,240],portalLight:[250,226,151],focus:[143,214,228],mist:[160,186,199],rushEdge:[250,157,67],bramble:[76,60,51],brambleLight:[157,137,86],mint:[157,230,197]});

/** A bounded RGB-only affine material table. Existing V4 d/v are the only
 * coordinates; neither the table nor its painter creates geometry/alpha.
 * Its clock is session.tick, with no wall time, RAF alpha or random sampling. */
export class EffectMaterial {
 constructor(){
  this.table=new Float32Array(PERIOD*ROWS*STRIDE);this.tracks=new Map();this.strengths=Object.fromEntries(EFFECT_KINDS.map(k=>[k,0]));this.key='';this.session=null;this.active=false;
  this.painter=(data,k,d,v,radius,start=0)=>{
   if(!this.active)return;
   const x=mod(Math.floor((d-start)*CELL+1e-8),PERIOD),row=Math.max(0,Math.min(ROWS-1,Math.floor(v+18)*2+(Number.isInteger(v+18)?0:1))),i=(row*PERIOD+x)*STRIDE,t=this.table;
   const r=data[k],g=data[k+1],b=data[k+2],luma=r*.299+g*.587+b*.114,keep=t[i];
   data[k]=r*keep+luma*t[i+1]+t[i+4];data[k+1]=g*keep+luma*t[i+2]+t[i+5];data[k+2]=b*keep+luma*t[i+3]+t[i+6];
  };
  this.painter.overlay=(data,k,color)=>{
   if(!this.active)return;
   const [r,g,b]=color,cap=r===212&&g===63&&b===49,darkCap=r===142&&g===48&&b===43,moss=g>r&&g>b&&g<200,s=this.strengths;
   // Existing face pupils/eye ink and white highlights are never tinted.
   if(!cap&&!darkCap&&!moss)return;
   const shade=darkCap?.65:moss?.78:1,mix=(target,a)=>{if(!a)return;for(let i=0;i<3;i++)data[k+i]=data[k+i]*(1-a)+target[i]*shade*a;};
   if(cap||darkCap){mix(C.harvest,s.harvest*.3);mix(C.rush,s.rush*.35);mix(C.weak,s.weak*.9);}
   else {mix(C.harvest,s.harvest*.9);mix(C.mint,Math.max(s.spores,s.portalPrize,s.focus)*.85);mix(C.guardLight,s.guard*.85);}
  };
 }
 setSession(session,{quality='desktop'}={}){
  const tick=Math.max(0,Math.floor(session?.tick||0)),identity=session?(session.state?.seed??'')+':'+(session.startsKey??''):null;
  if(identity!==this.session||tick<(this.tick??0)){this.tracks.clear();this.session=identity;this.key='';}
  this.tick=tick;this.quality=quality;
  const visible=new Map((session?.effects||[]).filter(e=>EFFECT_KINDS.includes(e.kind)).map(e=>[e.kind,e]));
  for(const kind of EFFECT_KINDS){
   const effect=visible.get(kind);let track=this.tracks.get(kind);
   if(effect){const start=effect.started??effect.starts??effect.born??track?.started??tick;
    if(!track||track.started!==start||track.off!==undefined){track={started:start,ends:effect.ends};this.tracks.set(kind,track);}else track.ends=effect.ends;
   }else if(track&&track.off===undefined){track.off=Math.min(tick,Number.isFinite(track.ends)?track.ends:tick);track.offStrength=smooth((track.off-track.started)/15);}
   this.strengths[kind]=track?(track.off===undefined?smooth((tick-track.started)/15):track.offStrength*(1-smooth((tick-track.off)/15))):0;
   if(track?.off!==undefined&&tick-track.off>=15)this.tracks.delete(kind);
  }
  const values=EFFECT_KINDS.map(k=>this.strengths[k]),active=values.some(n=>n>0),phase=active?Math.floor(tick/4)*4:0,key=values.join(',')+':'+phase;
  if(this.key===key)return false;this.key=key;this.active=active;this.build(phase);return true;
 }
 build(tick){
  const t=this.table,s=this.strengths,breath=.88+.12*Math.sin(tick/29),sporeBreath=.87+.13*Math.sin(tick/21);
  // Palette channels retain the original material's luminance and shading.
  let keep=1,r=0,g=0,b=0;
  for(const kind of MATERIAL_POLICY.paletteOrder){const a=s[kind]*(kind==='weak'?.84:.78);if(!a)continue;keep*=1-a;r=r*(1-a)+C[kind][0]/230*a;g=g*(1-a)+C[kind][1]/230*a;b=b*(1-a)+C[kind][2]/230*a;}
  for(let row=0;row<ROWS;row++)for(let x=0;x<PERIOD;x++){
   const v=-18+row/2,edge=Math.abs(v),i=(row*PERIOD+x)*STRIDE;let a0=keep,a1=r,a2=g,a3=b,a4=0,a5=0,a6=0;
   const stamp=(color,amount)=>{const inv=1-amount;a0*=inv;a1*=inv;a2*=inv;a3*=inv;a4=a4*inv+color[0]*amount;a5=a5*inv+color[1]*amount;a6=a6*inv+color[2]*amount;};
   // Body-space islands (never external motes). Four large clusters per
   // period, staggered laterally; dark centers make them read as spores.
   if(s.spores&&edge<12){const sx=mod(x+Math.floor((v+18)/9)*19,34),sy=mod(Math.floor(v+18),9);if(sx>=8&&sx<14&&sy>=2&&sy<7)stamp(sx<10||sy<4?C.sporeLight:C.spores,s.spores*.87*sporeBreath);}
   // Violet transverse bands and two quiet gold marks. They can coexist
   // with Guard: the outer lateral lanes remain exposed.
   if(s.portalPrize&&edge<14){const u=mod(x,68),band=u>=8&&u<18||u>=21&&u<24;if(band)stamp(u<18?C.portal:C.portalLight,s.portalPrize*.9);else if((u>=31&&u<37||u>=44&&u<48)&&edge>=7&&edge<11)stamp(C.portal,s.portalPrize*.86);}
   // Interlocked cyan scales occupy the dorsal center. Guard is last in
   // the pattern pass so its charged seam survives every legal positive pair.
   if(s.guard&&edge<8){const u=mod(x,34),diamond=Math.abs(u-17)*.58+edge;if(diamond>=6&&diamond<9)stamp(C.guardLight,s.guard*.94*breath);else if(diamond<6)stamp(C.guard,s.guard*.64);}
   // Roots stay the world hazard. Brambles adds an internal bark seam only.
   if(s.brambles&&edge<12){const seam=mod(x+Math.floor(v*1.8),43);if(seam<3)stamp(C.bramble,s.brambles*.78);else if(seam<5)stamp(C.brambleLight,s.brambles*.58);}
   if(s.focus&&edge>=12&&edge<17)stamp(C.focus,s.focus*.76*breath);
   if(s.mist&&edge>=10&&edge<17)stamp(C.mist,s.mist*.78);
   if(s.rush&&edge>=13&&edge<17)stamp(C.rushEdge,s.rush*.87*(.91+.09*Math.sin(tick/13)));
   t[i]=a0;t[i+1]=a1;t[i+2]=a2;t[i+3]=a3;t[i+4]=a4;t[i+5]=a5;t[i+6]=a6;
  }
 }
}
