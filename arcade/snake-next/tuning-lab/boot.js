// Lab-only entry boundary. A stale dependency may lack an export needed by
// another module; catch linking failures before exposing the Training menu.
import('./lab.js').catch(error=>{
 const badge=document.querySelector('#dev-build');badge.dataset.status='stale';
 badge.querySelector('strong').textContent='STALE DEV MODULES — HARD RELOAD';
 badge.querySelector('[data-implementation]').textContent='DEV launch blocked';
 badge.querySelector('small').textContent=error.message;
 document.querySelector('#lab-status').textContent='Current DEV sources could not initialize. Hard reload this Lab URL.';
 document.querySelector('#training').dataset.sourceState='stale';
});
