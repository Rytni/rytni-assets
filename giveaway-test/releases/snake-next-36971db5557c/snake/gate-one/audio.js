/** Existing portal cue through the existing SFX bus; no AudioContext, music,
 * timer, source owner or asset is added. End/stop cleanup follows the mixer. */
export function portalExitCue(audio,cell,width,view){
 const source=audio.play('portal-exit'),gain=audio.gains?.get(source);
 if(!source||!gain||!audio.context.createStereoPanner||!view)return source;
 const pan=audio.context.createStereoPanner();pan.pan.value=Math.max(-.75,Math.min(.75,((cell%width-view.x+.5)/view.cols-.5)*1.5));
 gain.disconnect();gain.connect(pan);pan.connect(audio.sfxBus);
 const ended=source.onended;source.onended=()=>{pan.disconnect();ended?.();};return source;
}
