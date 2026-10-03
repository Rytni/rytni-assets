// Original short pixel-game cues; no samples, no changes to the existing theme.
const fs=require('node:fs'),path=require('node:path');
const rate=22050,dir=path.join(__dirname,'audio');fs.mkdirSync(dir,{recursive:true});
const cues={buff:[[0,.12,72],[.08,.14,79],[.16,.18,84]],debuff:[[0,.15,57],[.1,.2,51]],'portal-enter':[[0,.12,81],[.08,.14,74],[.17,.16,66]],'portal-exit':[[0,.11,66],[.08,.14,74],[.17,.18,81]]};
for(const [name,notes]of Object.entries(cues)){
 const pcm=new Float32Array(Math.ceil(.4*rate));
 for(const [start,duration,midi]of notes)for(let i=0;i<duration*rate;i++){
   const t=i/rate,f=440*2**((midi-69)/12),phase=2*Math.PI*f*t,env=Math.min(1,t/.006)*Math.min(1,(duration-t)/.02)*Math.exp(-t*7);
   pcm[Math.floor(start*rate)+i]+=.22*(Math.sin(phase)+.15*Math.sin(phase*3))*env;
 }
 const out=Buffer.alloc(44+pcm.length*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(pcm.length*2,40);
 for(let i=0;i<pcm.length;i++)out.writeInt16LE(Math.round(Math.max(-1,Math.min(1,pcm[i]))*32767),44+i*2);
 fs.writeFileSync(path.join(dir,name+'.wav'),out);
}
