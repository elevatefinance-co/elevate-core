/* Type-only barrel for the public API. Two distinct surfaces are re-exported: the Citation discriminated
 * union (the moat) and the ComputationResult contract (every public function returns one). Keeping them in
 * a single barrel means consumers writing adapter layers can pull both with a single import path. */

export * from './citation.js';
export * from './result.js';
