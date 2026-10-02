// Independently authored raster masters. Never reads review screenshots or legacy art.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../../grib/mushroom-snake-retro-v2');
fs.mkdirSync(root, { recursive: true });
const inventory = [];
const previous = fs.existsSync(path.join(root,'inventory.json'))?JSON.parse(fs.readFileSync(path.join(root,'inventory.json'),'utf8')).assets:[];
const crc = b => { let c = 0xffffffff; for (const v of b) { c ^= v; for (let k=0;k<8;k++) c = (c>>>1) ^ ((c&1)?0xedb88320:0); } return (c^0xffffffff)>>>0; };
function chunk(type, b) { const t=Buffer.from(type), n=Buffer.alloc(4), c=Buffer.alloc(4); n.writeUInt32BE(b.length); c.writeUInt32BE(crc(Buffer.concat([t,b]))); return Buffer.concat([n,t,b,c]); }
function png(w,h,rgba) {
 const ih=Buffer.alloc(13); ih.writeUInt32BE(w); ih.writeUInt32BE(h,4); ih[8]=8; ih[9]=6;
 const rows=Buffer.alloc(h*(w*4+1)); for(let y=0;y<h;y++) Buffer.from(rgba).copy(rows,y*(w*4+1)+1,y*w*4,(y+1)*w*4);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
function decode(b) {
 let w,h,type,depth,id=[]; for(let p=8;p<b.length;) { const n=b.readUInt32BE(p),t=b.toString('ascii',p+4,p+8),d=b.subarray(p+8,p+8+n); if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);depth=d[8];type=d[9];if(d[12])throw Error('Interlaced source not supported');} if(t==='IDAT')id.push(d);p+=n+12; }
 if(depth!==8||![0,2,4,6].includes(type))throw Error(`Unsupported source PNG ${depth}/${type}`);
 const channels={0:1,2:3,4:2,6:4}[type], stride=w*channels,raw=zlib.inflateSync(Buffer.concat(id)),un=Buffer.alloc(h*stride),out=Buffer.alloc(w*h*4);
 const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
 for(let y=0;y<h;y++)for(let x=0;x<stride;x++){const f=raw[y*(stride+1)],v=raw[y*(stride+1)+x+1],a=x>=channels?un[y*stride+x-channels]:0,up=y?un[(y-1)*stride+x]:0,c=y&&x>=channels?un[(y-1)*stride+x-channels]:0;un[y*stride+x]=(v+[0,a,up,Math.floor((a+up)/2),paeth(a,up,c)][f])&255;}
 for(let i=0;i<w*h;i++){out[i*4]=un[i*channels];out[i*4+1]=type===0||type===4?un[i*channels]:un[i*channels+1];out[i*4+2]=type===0||type===4?un[i*channels]:un[i*channels+2];out[i*4+3]=type===6?un[i*channels+3]:type===4?un[i*channels+1]:255;}return {w,h,data:out};
}
const rgba = c => typeof c==='string'?[...c.match(/\w\w/g).map(v=>parseInt(v,16)),255]:c;
class Raster {
 constructor(w,h=w){this.w=w;this.h=h;this.data=Buffer.alloc(w*h*4);}
 dot(x,y,c){if(x<0||y<0||x>=this.w||y>=this.h)return;const i=(y*this.w+x)*4;this.data.set(rgba(c),i);}
 rect(x,y,w,h,c){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)this.dot(xx,yy,c);}
 poly(points,c){for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y+.5)!==(b[1]>y+.5)&&x+.5<(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1])+a[0])inside=!inside;}if(inside)this.dot(x,y,c);}}
 rotate(n){let s=this;for(let q=0;q<n;q++){const r=new Raster(s.h,s.w);for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++)r.dot(s.h-y-1,x,[...s.data.subarray((y*s.w+x)*4,(y*s.w+x)*4+4)]);s=r;}return s;}
}
function save(id,r,extra={}) {const file=id+'.png';fs.writeFileSync(path.join(root,file),png(r.w,r.h,r.data));const old=inventory.findIndex(a=>a.id===id);if(old>=0)inventory.splice(old,1);inventory.push({id,file,width:r.w,height:r.h,kind:extra.kind||'manual-raster',...extra});}
const cream=['806b43','c6a66d','e6ca91','f9e6b6','fff4d1'];
function tube(points, radius=10) {
 const r=new Raster(36);for(let y=0;y<36;y++)for(let x=0;x<36;x++){const px=x-1.5,py=y-1.5;let d=Infinity,t=0;
  for(let i=1;i<points.length;i++){const [ax,ay]=points[i-1],[bx,by]=points[i],vx=bx-ax,vy=by-ay,u=Math.max(0,Math.min(1,((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy))),dd=Math.hypot(px-ax-u*vx,py-ay-u*vy);if(dd<d){d=dd;t=(i-1+u)/(points.length-1);}}
  const rad=typeof radius==='function'?radius(t,px,py):radius;if(d>=rad)continue;
  r.dot(x,y,cream[d>rad-1?0:d>rad-2?1:d>rad-3?2:3]);
 }return r;
}
const straight=tube([[-20,16],[52,16]]);
save('snake-body-horizontal',straight,{ports:[1,3],radii:[10,10],group:'snake'});
save('snake-body-vertical',straight.rotate(1),{ports:[0,2],radii:[10,10],group:'snake'});
for(let v=1;v<=2;v++){const r=new Raster(36);r.data.set(straight.data);r.poly(v===1?[[13,12],[16,12],[19,15],[16,17],[14,15]]:[[19,18],[21,17],[24,19],[23,21],[20,21]],'285631');r.dot(v===1?16:21,v===1?13:19,'527845');save(`snake-body-horizontal-v${v}`,r,{ports:[1,3],radii:[10,10],group:'snake'});save(`snake-body-vertical-v${v}`,r.rotate(1),{ports:[0,2],radii:[10,10],group:'snake'});}
const curve=[[16,-20],[16,8]];for(let k=1;k<=16;k++){const a=Math.PI-k*Math.PI/32;curve.push([24+8*Math.cos(a),8+8*Math.sin(a)]);}curve.push([52,16]);
const corners=['up-right','right-down','down-left','left-up'];
for(let n=0;n<4;n++)save('snake-corner-'+corners[n],tube(curve).rotate(n),{ports:[n,(n+1)%4],radii:[10,10],group:'snake'});
const taper=tube([[-20,16],[52,16]],(_,x)=>10-3*Math.max(0,Math.min(1,x/32)));
save('snake-taper-horizontal',taper,{ports:[3,1],radii:[10,7],group:'snake'});
save('snake-taper-vertical',taper.rotate(1),{ports:[0,2],radii:[10,7],group:'snake'});
// Turn immediately before the terminal cell needs a narrowed outgoing port too.
for(let n=0;n<4;n++)for(const reverse of [false,true]){const p=reverse?[...curve].reverse():curve;save(`snake-taper-corner-${corners[n]}${reverse?'-reverse':''}`,tube(p,(t)=>t<.5?10:10-3*Math.min(1,(t-.5)*2)).rotate(n),{ports:reverse?[(n+1)%4,n]:[n,(n+1)%4],radii:[10,7],group:'snake'});}
const tail=tube([[-20,16],[52,16]],(_,x)=>x<0?7:Math.max(.35,7*(1-x/27)));
const head=tube([[-20,16],[19,16]],10);
for(let y=5;y<31;y++)for(let x=12;x<34;x++){const d=Math.hypot(Math.max(0,Math.abs(x-23)-6),Math.max(0,Math.abs(y-18)-6));if(d<7)head.dot(x,y,cream[d>6?0:d>5?1:d>4?2:3]);}
head.rect(22,10,4,6,'163a27');head.dot(23,11,'fff7d9');head.rect(22,23,4,5,'163a27');head.dot(23,24,'fff7d9');head.rect(29,18,3,1,'6b5738');
head.rect(8,5,3,6,'dccb91');head.poly([[5,5],[6,2],[9,0],[13,2],[14,5]],'962d24');head.rect(7,3,5,2,'d9452b');head.dot(8,2,'fff4d1');head.dot(11,4,'fff4d1');
for(const [name,n,p]of [['right',0,3],['down',1,0],['left',2,1],['up',3,2]]){save('snake-head-'+name,head.rotate(n),{ports:[p],radii:[10],group:'snake'});save('snake-tail-'+name,tail.rotate(n),{ports:[p],radii:[7],group:'snake'});}
for(let v=0;v<4;v++){const r=new Raster(32);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const noise=((x*37+y*19+v*13)%31===0),edge=x===0||y===0;r.dot(x,y,edge?'16584f':x===1||y===1?'052d2b':noise?['06413a','07453c','08433a','093f34'][v]:['063b35','073e37','063930','083b34'][v]);}if(v===3){r.rect(22,24,2,1,'134b39');r.rect(24,22,1,2,'124936');}save('arena-floor-'+v,r,{group:'arena'});}
function rail(r,x,y,w,h){r.rect(x,y,w,h,'1b1710');r.rect(x+1,y+1,w-2,h-2,'915022');r.rect(x+2,y+2,w-4,2,'f3be54');r.rect(x+2,y+4,w-4,1,'9b662c');r.rect(x+3,y+5,w-6,h-8,'512c1a');r.rect(x+3,y+h-3,w-6,1,'b27330');for(let yy=y+6;yy<y+h-4;yy++)for(let xx=x+3;xx<x+w-3;xx++)if((xx*7+yy*11)%17<3)r.dot(xx,yy,'65391f');}
const floorAtlas=new Raster(256),floors=[0,1,2,3].map(v=>decode(fs.readFileSync(path.join(root,`arena-floor-${v}.png`))));
for(let y=0;y<8;y++)for(let x=0;x<8;x++){let h=Math.imul((y*8191+x+1)*2654435761,2246822519)>>>0;const src=floors[h%100<18?1+h%3:0];for(let yy=0;yy<32;yy++)for(let xx=0;xx<32;xx++)floorAtlas.dot(x*32+xx,y*32+yy,[...src.data.subarray((yy*32+xx)*4,(yy*32+xx)*4+4)]);}
save('arena-floor-atlas',floorAtlas,{group:'arena',cell:32,macroCells:8,kind:'manual-raster-atlas'});
const edge=new Raster(64,20);rail(edge,0,2,64,16);save('frame-edge-horizontal',edge,{group:'frame',axis:'x'});save('frame-edge-vertical',edge.rotate(1),{group:'frame',axis:'y'});
const fc=new Raster(48);rail(fc,4,4,44,18);const ev=edge.rotate(1);for(let y=22;y<48;y++)for(let x=0;x<20;x++)fc.dot(x+2,y,[...ev.data.subarray(((y%64)*20+x)*4,((y%64)*20+x)*4+4)]);
fc.rect(3,3,22,22,'312216');fc.rect(5,5,18,18,'b87928');fc.rect(7,7,14,14,'f4bc51');fc.rect(9,9,10,10,'765021');fc.rect(11,11,6,6,'c49136');fc.rect(11,11,4,2,'ffe19b');fc.rect(14,15,3,3,'482c17');
for(const [name,n]of [['top-left',0],['top-right',1],['bottom-right',2],['bottom-left',3]])save('frame-corner-'+name,fc.rotate(n),{group:'frame',stretch:false});
const fill=new Raster(16);for(let y=0;y<16;y++)for(let x=0;x<16;x++)fill.dot(x,y,(x*7+y*3)%17===0?'0d231c':'091b16');save('hud-inner-fill',fill,{group:'hud'});
// Small nine-slice HUD shell (the transparent center uses hud-inner-fill).
const hud=new Raster(32);rail(hud,0,0,32,8);rail(hud,0,24,32,8);for(let y=8;y<24;y++){hud.rect(0,y,3,1,'b88735');hud.rect(3,y,2,1,'4c311c');hud.rect(27,y,2,1,'4c311c');hud.rect(29,y,3,1,'b88735');}save('hud-panel',hud,{group:'hud',slice:8});
function icon(id,draw){const r=new Raster(24);draw(r);save(id,r,{group:'hud'});}
icon('icon-pause',r=>{r.rect(6,5,4,14,'fff0c5');r.rect(14,5,4,14,'fff0c5');});
icon('icon-fullscreen',r=>{for(const n of [0,1,2,3]){const a=new Raster(24);a.rect(3,3,7,3,'fff0c5');a.rect(3,3,3,7,'fff0c5');const b=a.rotate(n);for(let i=0;i<b.data.length;i+=4)if(b.data[i+3])r.data.set(b.data.subarray(i,i+4),i);}});
icon('icon-score',r=>{r.poly([[12,2],[21,9],[18,20],[6,20],[3,9]],'d99c36');r.poly([[12,5],[17,10],[15,17],[9,17],[7,10]],'fff0c5');});
icon('icon-length',r=>{r.rect(3,7,18,5,'fff0c5');r.rect(3,7,5,14,'fff0c5');r.rect(3,16,15,5,'fff0c5');});
icon('icon-combo',r=>r.poly([[13,1],[5,14],[11,14],[8,23],[21,9],[14,9]],'ffd47b'));
icon('icon-effect',r=>{r.poly([[12,2],[20,10],[12,22],[4,10]],'5ce0de');r.poly([[12,6],[16,10],[12,17],[8,10]],'fff0c5');});
for(const pressed of [false,true]){const r=new Raster(40);r.poly([[7,2],[33,2],[38,7],[38,33],[33,38],[7,38],[2,33],[2,7]],'231e12');r.poly([[7,3],[33,3],[37,7],[37,33],[33,37],[7,37],[3,33],[3,7]],pressed?'95702e':'edbd61');r.poly([[8,5],[32,5],[35,8],[35,32],[32,35],[8,35],[5,32],[5,8]],pressed?'08392e':'0a2c26');r.poly([[20,10],[29,25],[11,25]],pressed?'d6c38f':'fff0c5');for(const [name,n]of [['up',0],['right',1],['down',2],['left',3]])save(`dpad-${name}-${pressed?'pressed':'normal'}`,r.rotate(n),{group:'controls',visualCss:34,hitCss:44});}
const vfxIds=['food-pickup','positive-pickup','negative-activation','combo-pop','portal-enter','portal-exit','death','new-record'];
const atlas=new Raster(256,128);
for(let row=0;row<8;row++)for(let frame=0;frame<8;frame++){const color=['ffd36f','79f3e5','d765ff','fff3b9','65dcfa','b684ff','f4a279','ffe38b'][row];for(let p=0;p<8;p++){const angle=p*Math.PI/4+row*.17,d=frame<2?2+frame*2:4+(frame-2)*1.15;const x=Math.round(16+Math.cos(angle)*d),y=Math.round(8+Math.sin(angle)*d*.6);if(frame<6||p%2===0)atlas.rect(frame*32+x,row*16+y,frame<3?2:1,frame<3?2:1,color);}}
save('vfx-atlas',atlas,{group:'vfx',frames:8,frameWidth:32,frameHeight:16,rows:vfxIds,durationMs:320});
// Optional normalization of INDEPENDENT generated masters, never of references.
const imports=process.argv.slice(2);for(let i=0;i<imports.length;i+=2){const id=imports[i],file=imports[i+1];if(!id||!file)throw Error('Expected id/file pairs');const b=fs.readFileSync(file),s=decode(b);
 if(id==='frame-master'){
  const r=new Raster(256);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const sx=Math.floor((x+.5)*s.w/256),sy=Math.floor((y+.5)*s.h/256),p=s.data.subarray((sy*s.w+sx)*4,(sy*s.w+sx)*4+4);if(p[3]>=192)r.dot(x,y,[p[0],p[1],p[2],255]);}
  fs.mkdirSync(path.join(root,'sources'),{recursive:true});fs.writeFileSync(path.join(root,'sources/frame-master.png'),png(256,256,r.data));
  fs.writeFileSync(path.join(root,'sources/provenance.json'),JSON.stringify({sourceSha256:crypto.createHash('sha256').update(b).digest('hex'),independentlyGenerated:true},null,2)+'\n');continue;
 }
 let x0=s.w,y0=s.h,x1=-1,y1=-1;for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++)if(s.data[(y*s.w+x)*4+3]>=192){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}if(x1<0)throw Error('No opaque art');const r=new Raster(id==='frame-ornament'?48:64),fit=(r.w-6)/Math.max(x1-x0+1,y1-y0+1),ox=(r.w-(x1-x0+1)*fit)/2,oy=(r.h-(y1-y0+1)*fit)/2;for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++){const sx=x0+Math.floor((x-ox)/fit),sy=y0+Math.floor((y-oy)/fit);if(sx<x0||sx>x1||sy<y0||sy>y1)continue;const p=s.data.subarray((sy*s.w+sx)*4,(sy*s.w+sx)*4+4);if(p[3]>=192)r.dot(x,y,[p[0],p[1],p[2],255]);}save(id,r,{group:id==='frame-ornament'?'frame':'objects',kind:'imagegen-normalized',sourceSha256:crypto.createHash('sha256').update(b).digest('hex')});}
// Retain already-normalized generated art during deterministic manual rebuilds.
for(const id of ['food-magical-seed','pickup-positive','pickup-negative','portal','obstacle-stone','frame-ornament'])if(!inventory.some(a=>a.id===id)&&fs.existsSync(path.join(root,id+'.png'))){const s=decode(fs.readFileSync(path.join(root,id+'.png')));inventory.push(previous.find(a=>a.id===id)||{id,file:id+'.png',width:s.w,height:s.h,kind:'imagegen-normalized',group:id==='frame-ornament'?'frame':'objects'});}
// Slice only this NEW generated production master; never any review reference.
if(fs.existsSync(path.join(root,'sources/frame-master.png'))){
 const s=decode(fs.readFileSync(path.join(root,'sources/frame-master.png'))),provenance=JSON.parse(fs.readFileSync(path.join(root,'sources/provenance.json'),'utf8'));
 function crop(x,y,w,h){const r=new Raster(w,h);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)r.dot(xx,yy,[...s.data.subarray(((y+yy)*s.w+x+xx)*4,((y+yy)*s.w+x+xx)*4+4)]);return r;}
 for(const [name,x,y]of [['top-left',0,0],['top-right',192,0],['bottom-right',192,192],['bottom-left',0,192]])save('frame-corner-'+name,crop(x,y,64,64),{group:'frame',stretch:false,kind:'imagegen-nine-slice',...provenance});
 save('frame-edge-horizontal',crop(64,0,128,32),{group:'frame',axis:'x',kind:'imagegen-nine-slice',...provenance});
 save('frame-edge-vertical',crop(0,64,32,128),{group:'frame',axis:'y',kind:'imagegen-nine-slice',...provenance});
 const r=new Raster(32);
 function paste(src,dx,dy,w,h){for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sx=Math.min(src.w-1,Math.floor(x*src.w/w)),sy=Math.min(src.h-1,Math.floor(y*src.h/h));r.dot(dx+x,dy+y,[...src.data.subarray((sy*src.w+sx)*4,(sy*src.w+sx)*4+4)]);}}
 const gold=crop(15,15,18,18),woodH=crop(64,15,128,14),woodV=crop(15,64,14,128);
 for(const [x,y,n]of [[0,0,0],[24,0,1],[24,24,2],[0,24,3]])paste(gold.rotate(n),x,y,8,8);
 paste(woodH,8,0,16,5);paste(woodH.rotate(2),8,27,16,5);paste(woodV,0,8,5,16);paste(woodV.rotate(2),27,8,5,16);
 save('hud-panel',r,{group:'hud',slice:8,kind:'imagegen-nine-slice',...provenance});
}
fs.writeFileSync(path.join(root,'inventory.json'),JSON.stringify({version:1,cell:32,snakeSource:36,overhang:2,bodyDiameter:20,tailBaseDiameter:14,assets:inventory},null,2)+'\n');
console.log(`${inventory.length} raster assets; ${inventory.reduce((sum,a)=>sum+a.width*a.height*4,0)} decoded bytes`);
module.exports={decode,png,Raster};
