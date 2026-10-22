/* TEST iframe transport: credentials stay in the authenticated parent. */
(() => {
 const w=window,p=new URLSearchParams(w.location.search);
 if(p.get('host')!=='1'||w.parent===w)return;
 let origin;try{const url=new URL(p.get('parent_origin'));if(!['http:','https:'].includes(url.protocol))return;origin=url.origin;}catch{return;}
 const channel=p.get('channel');if(!channel)return;
 const protocol='snake-next-test-v1';let stop=null,fullscreenChanged=null,closed=false,serial=0;const pending=new Map();
 const send=(type,payload={})=>w.parent.postMessage({protocol,channel,type,...payload},origin);
 const requestHost=(type,payload,fallback,timeout)=>{
  if(closed)return Promise.resolve(fallback);const request=++serial;
  return new Promise(resolve=>{const timer=w.setTimeout(()=>{pending.delete(request);resolve(fallback);},timeout);pending.set(request,{resolve,timer,type,fallback});send(type,{...payload,request});});
 };
 w.SnakeTestHost={bind(dispose,onFullscreen){stop=dispose;fullscreenChanged=onFullscreen;if(closed)stop();else send('ready');},state(screen){if(!closed)send('state',{screen});},fullscreen:active=>requestHost('fullscreen',{active},false,5000),ranked:(method,payload={})=>requestHost('ranked',{method,payload},{success:false,status:'network_error'},15000)};
 w.RytniArcadeHub={leave:()=>send('leave')};
 w.addEventListener('message',e=>{
  if(e.source!==w.parent||e.origin!==origin||e.data?.protocol!==protocol||e.data?.channel!==channel)return;
  if(e.data.type==='fullscreen-ack'||e.data.type==='ranked-result'){const item=pending.get(e.data.request);if(item&&e.data.type===(item.type==='ranked'?'ranked-result':'fullscreen-ack')){pending.delete(e.data.request);w.clearTimeout(item.timer);item.resolve(item.type==='ranked'?e.data.result:e.data.active===true);}}
  if(e.data.type==='fullscreen-state')fullscreenChanged?.(e.data.active===true);
  if(e.data.type==='shutdown'&&!closed){closed=true;for(const item of pending.values()){w.clearTimeout(item.timer);item.resolve(item.fallback);}pending.clear();stop?.();}
 });
})();
