import {SNAKE_SPONSOR_URL} from './backend.js';

// Called synchronously from the real click, before any audio/network await.
// Opening Telegram is a link bonus, not proof of subscription or a purchase.
export function openSponsorForClaim(controller,backend,open){
 if(backend.mode!=='ranked'||backend.sponsorUrl!==SNAKE_SPONSOR_URL||controller.pending||controller.disposed||controller.run&&!controller.result||controller.hub?.success!==true||controller.hub.available===false||controller.hub.sponsor_attempt_available!==true)return false;
 try{open(SNAKE_SPONSOR_URL,'_blank','noopener,noreferrer');return true;}catch{return false;}
}
