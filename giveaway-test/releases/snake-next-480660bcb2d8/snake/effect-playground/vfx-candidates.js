import {effectAssets} from './asset-bank.js';
// Explicit internal visual-gate candidates for isolated DEV only.
// NOT human approval / VFX ART LOCK. Never add these to APPROVED_ASSETS.
export const DEV_VFX_CANDIDATES=Object.freeze(Object.fromEntries([
 'harvest-sparkle','harvest-third-burst','focus-wisp',
 'spore-idle','spore-trail','spore-burst',
 'guard-plate','guard-charged','guard-break',
 'portal-charged-ring','portal-body-trail','rush-ember','rush-thorn',
 'corruption-particle','roots-crack','roots-sprout','roots-root','roots-decay','mist-puff'
].map(name=>['vfx.'+name,true])));
export function enableDevVfx(){
 effectAssets.approved=Object.freeze({...effectAssets.approved,...DEV_VFX_CANDIDATES});
 return effectAssets.preload();
}
