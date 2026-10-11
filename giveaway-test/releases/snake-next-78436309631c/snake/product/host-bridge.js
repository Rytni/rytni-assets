/* TEST-only iframe transport. No gameplay or ranked transport lives here. */
(() => {
 const w=window,p=new URLSearchParams(w.location.search);
 if(p.get('host')!=='1'||w.parent===w)return;
 let origin;try{const url=new URL(p.get('parent_origin'));if(!['http:','https:'].includes(url.protocol))return;origin=url.origin;}catch{return;}
 const channel=p.get('channel');if(!channel)return;
 const protocol='snake-next-test-v1';let stop=null,fullscreenChanged=null,closed=false,serial=0;const pending=new Map();
 const send=(type,payload={})=>w.parent.postMessage({protocol,channel,type,...payload},origin);
 w.SnakeTestHost={bind(dispose,onFullscreen){stop=dispose;fullscreenChanged=onFullscreen;if(closed)stop();else send('ready');},state(screen){if(!closed)send('state',{screen});},fullscreen(active){if(closed)return Promise.resolve(false);const request=++serial;return new Promise(resolve=>{const timer=w.setTimeout(()=>{pending.delete(request);resolve(false);},5000);pending.set(request,{resolve,timer});send('fullscreen',{active,request});});}};
 w.RytniArcadeHub={leave:()=>send('leave')};
 w.addEventListener('message',e=>{
  if(e.source!==w.parent||e.origin!==origin||e.data?.protocol!==protocol||e.data?.channel!==channel)return;
  if(e.data.type==='fullscreen-ack'){const item=pending.get(e.data.request);if(item){pending.delete(e.data.request);w.clearTimeout(item.timer);item.resolve(e.data.active===true);}}
  if(e.data.type==='fullscreen-state')fullscreenChanged?.(e.data.active===true);
  if(e.data.type==='shutdown'&&!closed){closed=true;for(const item of pending.values()){w.clearTimeout(item.timer);item.resolve(false);}pending.clear();stop?.();}
 });
})();
