// Optional deterministic 60Hz movement scheduler. No wall-clock state.
export const MOVE_UNIT=60_000_000;
export function movementDue(state){return state.movement.progress+state.movement.rate>=MOVE_UNIT;}
export function movementAlpha(state,fraction=0){return Math.min(1,Math.max(0,(state.movement.progress+state.movement.rate*fraction)/MOVE_UNIT));}
