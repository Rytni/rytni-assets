/**
 * @typedef {0|1|2|3} Direction
 * @typedef {{tick:number, sequence:number, direction:Direction, repeat?:boolean}} TurnCommand
 * @typedef {{sequence:number, tick:number, type:string, cell?:number, score?:number, reason?:string, inputSequence?:number, direction?:Direction}} SimulationEvent
 * @typedef {{seen:Uint8Array, queue:Uint32Array, candidates:Uint32Array}} Scratch
 * @typedef {Object} State
 * @property {number} seed
 * @property {string} session
 * @property {string} rulesVersion
 * @property {number} rulesKey
 * @property {number} arenaHash
 * @property {'playing'|'dead'|'full'} status
 * @property {string|null} reason
 * @property {number} tick
 * @property {number} movePhase
 * @property {number} cadence Ticks per current cell interval, changed at boundaries only.
 * @property {Direction} direction
 * @property {Uint8Array} turns
 * @property {number} turnCount
 * @property {number} lastInputSequence
 * @property {Uint32Array} body
 * @property {number} headIndex
 * @property {number} length
 * @property {Uint32Array} occupancy
 * @property {number} growth
 * @property {number} score
 * @property {number} food
 * @property {number} rng
 * @property {number} eventSequence
 * @property {SimulationEvent[]} events Per-tick events; consumed outside step.
 * @property {Scratch} scratch Derived workspace, not authoritative state.
 */
export {};
