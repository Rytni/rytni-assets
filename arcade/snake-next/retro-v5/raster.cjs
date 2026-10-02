// PNG manufacture only. No game art or runtime dependency on previous proof kits.
const zlib = require('node:zlib');
const crc = b => { let c=0xffffffff; for(const v of b){ c^=v; for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0); } return(c^0xffffffff)>>>0; };
function chunk(type,b){const t=Buffer.from(type),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(b.length);c.writeUInt32BE(crc(Buffer.concat([t,b])));return Buffer.concat([n,t,b,c]);}
function png(w,h,data){const ih=Buffer.alloc(13);ih.writeUInt32BE(w);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;const rows=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)Buffer.from(data).copy(rows,y*(w*4+1)+1,y*w*4,(y+1)*w*4);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
function decode(b){
 let w,h,type,depth,id=[];for(let p=8;p<b.length;){const n=b.readUInt32BE(p),t=b.toString('ascii',p+4,p+8),d=b.subarray(p+8,p+8+n);if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);depth=d[8];type=d[9];if(d[12])throw Error('Interlaced source');}if(t==='IDAT')id.push(d);p+=n+12;}
 if(depth!==8||![0,2,4,6].includes(type))throw Error(`Unsupported PNG ${depth}/${type}`);
 const ch={0:1,2:3,4:2,6:4}[type],stride=w*ch,raw=zlib.inflateSync(Buffer.concat(id)),un=Buffer.alloc(h*stride),out=Buffer.alloc(w*h*4);
 const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
 for(let y=0;y<h;y++)for(let x=0;x<stride;x++){const f=raw[y*(stride+1)],v=raw[y*(stride+1)+x+1],a=x>=ch?un[y*stride+x-ch]:0,u=y?un[(y-1)*stride+x]:0,c=y&&x>=ch?un[(y-1)*stride+x-ch]:0;un[y*stride+x]=(v+[0,a,u,Math.floor((a+u)/2),paeth(a,u,c)][f])&255;}
 for(let i=0;i<w*h;i++){out[i*4]=un[i*ch];out[i*4+1]=type===0||type===4?un[i*ch]:un[i*ch+1];out[i*4+2]=type===0||type===4?un[i*ch]:un[i*ch+2];out[i*4+3]=type===6?un[i*ch+3]:type===4?un[i*ch+1]:255;}return {w,h,data:out};
}
class Raster{
 constructor(w,h=w){this.w=w;this.h=h;this.data=Buffer.alloc(w*h*4);}
 dot(x,y,c){x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=this.w||y>=this.h)return;const rgba=typeof c==='string'?[...c.match(/\w\w/g).map(v=>parseInt(v,16)),255]:c;this.data.set(rgba,(y*this.w+x)*4);}
 rect(x,y,w,h,c){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)this.dot(xx,yy,c);}
 poly(points,c){for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y+.5)!==(b[1]>y+.5)&&x+.5<(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1])+a[0])yes=!yes;}if(yes)this.dot(x,y,c);}}
 rotate(n){let s=this;for(let k=0;k<n;k++){const r=new Raster(s.h,s.w);for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++)r.dot(s.h-y-1,x,Array.from(s.data.subarray((y*s.w+x)*4,(y*s.w+x)*4+4)));s=r;}return s;}
}
function crop(s,x,y,w,h){const r=new Raster(w,h);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)r.dot(xx,yy,Array.from(s.data.subarray(((y+yy)*s.w+x+xx)*4,((y+yy)*s.w+x+xx)*4+4)));return r;}
function resize(s,w,h){const r=new Raster(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(Math.min(s.h-1,Math.floor((y+.5)*s.h/h))*s.w+Math.min(s.w-1,Math.floor((x+.5)*s.w/w)))*4;r.dot(x,y,Array.from(s.data.subarray(i,i+4)));}return r;}
function bounds(s){let x0=s.w,y0=s.h,x1=0,y1=0;for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++)if(s.data[(y*s.w+x)*4+3]>128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return [x0,y0,x1-x0+1,y1-y0+1];}
module.exports={png,decode,Raster,crop,resize,bounds};
