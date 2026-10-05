// Run with playwright-cli -s=skin-review run-code --filename=this-file.
async page=>{
 await page.waitForFunction(()=>window.effectSkinQA?.ready);
 const results=await page.evaluate(()=>{
  const qa=window.effectSkinQA,kinds=['focus','harvest','spores','guard','portalPrize','rush','weak','brambles','mist'];
  const picture=id=>document.getElementById(id).getContext('2d').getImageData(0,0,document.getElementById(id).width,document.getElementById(id).height).data;
  const checksum=data=>{let h=2166136261;for(const n of data)h=Math.imul(h^n,16777619);return h>>>0;};
  const verify=(yes,message)=>{if(!yes)throw Error(message);};
  const metrics={},hashes=[];
  for(const fixture of ['desktop30','mobile30','mobile40','mobile50','mobile60']){
   metrics[fixture]=qa.set({fixture,kinds:['harvest'],tick:20});
   const canvas=document.getElementById('active');verify(Math.abs(canvas.getBoundingClientRect().width-canvas.width)<1,'review scaled the actual fixture');
  }
  for(const kind of kinds){qa.set({fixture:'mobile50',kinds:[kind],tick:20});const base=picture('base'),active=picture('active');let changed=0;
   for(let i=0;i<base.length;i+=4)if(base[i]!==active[i]||base[i+1]!==active[i+1]||base[i+2]!==active[i+2])changed++;
   verify(changed>50,kind+' is not visible at mobile50');hashes.push(checksum(active));
  }
  verify(new Set(hashes).size===9,'mobile50 skins are visually identical');
  for(const kinds of [['harvest','focus'],['harvest','guard'],['focus','portalPrize'],['spores','guard'],['harvest','rush'],['harvest','weak'],['guard','brambles'],['focus','mist'],['harvest','guard','weak'],['spores','portalPrize','rush'],['focus','harvest','mist'],['guard','portalPrize','brambles']]){
   qa.set({fixture:'mobile50',kinds,tick:20});verify(checksum(picture('active'))!==checksum(picture('base')),'combination absent '+kinds.join('+'));
  }
  qa.set({fixture:'mobile50',kinds:['harvest','guard','weak'],tick:20});const paused=checksum(picture('active'));qa.draw();verify(checksum(picture('active'))===paused,'paused appearance changed');
  qa.set({tick:0});const onset=picture('active'),original=picture('base');let onsetDelta=0;for(let i=0;i<onset.length;i++)if(onset[i]!==original[i])onsetDelta++;
  let first=[];for(let i=0;i<onset.length&&first.length<4;i++)if(onset[i]!==original[i])first.push([i,onset[i],original[i]]);
  verify(onsetDelta===0,'onset jumped: '+onsetDelta+' channels differ '+JSON.stringify(first)+', '+JSON.stringify(qa.snapshot()));
  qa.set({tick:45});verify(checksum(picture('active'))===checksum(picture('base')),'expiry failed to restore base');
  qa.set({kinds:['guard','portalPrize','brambles'],tick:20,portal:true});verify(checksum(picture('active'))!==checksum(picture('base')),'tunnel has no skin');
  qa.set({kinds:['spores','portalPrize','rush'],tick:20,portal:false});
  return {nineDistinctMobile50:true,eightPairs:true,fourTriples:true,pause:true,onset:true,expiry:true,tunnel:true,metrics};
 });
 return results;
}
