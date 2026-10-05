import {DEV_BUILD} from './dev-build.js';
import * as visuals from '../effect-playground/visuals.js';
import * as presentation from '../effect-playground/vfx-presentation.js';
import * as director from '../progressive-run/director.js';

// Read namespace exports: an older cached module with a missing stamp must
// produce a visible mismatch, not fail at a new named-import binding.
export const build=Object.freeze({...DEV_BUILD,modules:Object.freeze({
 visuals:visuals.DEV_VFX_REVISION??'MISSING',
 presentation:presentation.DEV_VFX_REVISION??'MISSING',
 director:director.DEV_VFX_REVISION??'MISSING'
})});
export const sourcesMatch=Object.values(build.modules).every(v=>v===build.expectedVfx);
export function showBuild(state){
 const badge=document.querySelector('#dev-build');
 badge.dataset.status=sourcesMatch?'ready':'stale';
 badge.querySelector('strong').textContent=sourcesMatch?`DEV BUILD ${build.revision}`:'STALE DEV MODULES — HARD RELOAD';
 badge.querySelector('small').textContent=`source ${build.fingerprint} · ${sourcesMatch?'B.2 stamps verified':Object.entries(build.modules).map(([k,v])=>k+'='+v).join(' · ')}`;
 badge.querySelector('[data-implementation]').textContent=state;
}
