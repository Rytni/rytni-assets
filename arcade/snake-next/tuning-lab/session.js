import {Session} from '../forest-training/session.js';
import {validateProfile,profileCadence,portalWindowOpen} from './config.js';
import {attachTelemetry} from './telemetry.js';
export function labSession(profile,options={}){
 const config=validateProfile(profile),pacing=Object.freeze({...config,config,cadence:tick=>profileCadence(config,tick),portalWindowOpen:tick=>portalWindowOpen(config,tick)});
 return attachTelemetry(new Session({...options,pacing}),config);
}
