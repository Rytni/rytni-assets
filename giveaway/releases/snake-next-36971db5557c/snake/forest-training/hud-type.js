// Read the existing accessible DOM/state text. Only its bitmap presentation
// changes; no baked labels, fonts fetched remotely or gameplay state ownership.
import {pixelText,textWidth} from '../retro-v5/pixel-text.js';
const extra={
 'Г':['11111','11000','11000','11000','11000','11000','11000'],
 'Ж':['10101','10101','01110','00100','01110','10101','10101'],
 'Й':['01010','00100','11011','11011','11111','11011','11011'],
 'Х':['10001','11011','01010','00100','01010','11011','10001'],
 'Ц':['11010','11010','11010','11010','11010','11111','00001'],
 'Щ':['10101','10101','10101','10101','10101','11111','00001'],
 'Ъ':['11100','01100','01100','01110','01101','01101','01110'],
 'Ы':['10001','10001','10001','11101','10101','10101','11101'],
 'Ю':['10110','11011','11011','11011','11011','11011','10110'],
 'Я':['01111','11011','11011','01111','00111','01111','11011']
};
function text(ctx,value,x,y,size,color){
 let left=Math.round(x-textWidth(value,size)/2);y=Math.round(y);
 for(const ch of value){
  const rows=extra[ch];if(!rows)pixelText(ctx,ch,left,y,size,color);
  else for(const [ox,oy,ink] of [[size,size,'#10140d'],[0,0,color]]){
   ctx.fillStyle=ink;for(let r=0;r<7;r++)for(let c=0;c<5;c++)if(rows[r][c]==='1')ctx.fillRect(left+c*size+ox,y+r*size+oy,size,size);
  }left+=size*6;
 }
}
export function drawHudType(hud){
 let canvas=hud.querySelector('.hud-type');if(!canvas){canvas=document.createElement('canvas');canvas.className='hud-type';canvas.ariaHidden='true';hud.append(canvas);}
 const rect=hud.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
 for(const node of hud.querySelectorAll('small,strong,.effect span,.effect b,.effect-empty')){
  const box=node.getBoundingClientRect();if(!box.width||!box.height)continue;
  const style=getComputedStyle(node),value=node.matches('.effect span')?node.firstChild.textContent.trim():node.textContent.trim();
  const size=Math.max(1,Math.floor(parseFloat(style.fontSize)/7)),line=node.matches('.effect span')?parseFloat(style.lineHeight):box.height;
  text(ctx,value,box.x-rect.x+box.width/2,box.y-rect.y+(line-7*size)/2,size,node.matches('strong,b')?'#fff0ba':'#e5d7ab');
 }
}
