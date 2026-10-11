/** One measured component for embedded, fullscreen and resize. Typography
 * stops at 16px; a long value gets a physical plate, never a microscopic fit. */
export class RecordPlaceValue {
 constructor(root,stage){this.root=root;this.stage=stage;this.pending=false;this.observer=new ResizeObserver(()=>this.schedule());this.observer.observe(stage);document.fonts.ready.then(()=>this.schedule());}
 schedule(){if(this.pending)return;this.pending=true;document.fonts.ready.then(()=>requestAnimationFrame(()=>{this.pending=false;this.fit();}));}
 fit(){
  for(const e of this.root.querySelectorAll('.title-scene [data-record-place]')){
   e.classList.remove('attached-value');e.style.fontSize='';
   const box=e.closest('.value-box'),safe=box.getBoundingClientRect().width*.66;
   const range=document.createRange();range.selectNodeContents(e);
   const preferred=Math.min(26,Math.max(16,this.stage.clientWidth*.01354));
   let fitted=false;
   for(const size of [26,24,22,20,18,16].filter(n=>n<=preferred+.01)){
    e.style.fontSize=size+'px';if(range.getBoundingClientRect().width<=safe){fitted=true;break;}
   }
   if(!fitted){e.style.fontSize=Math.max(16,Math.min(20,preferred))+'px';e.classList.add('attached-value');}
  }
 }
 disconnect(){this.observer.disconnect();}
}
