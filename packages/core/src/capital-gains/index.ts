/* Wave 2. Capital Gains. Public surface for every charging section that touches a capital-asset transfer.
 * Consumers import what they need; each rule is a pure ComputationResult-returning function and can be
 * composed without orchestration.
 *
 * Design note: callers always pre-classify a transaction as STCG vs LTCG before routing it to the right
 * function. This module does not infer holding-period; the classification logic depends on asset class +
 * Section 2(42A) special rules that aren't worth encoding here when callers already know the class. */

export * from './split-date.js';
export * from './shared.js';
export * from './listed-equity-stcg.js';
export * from './listed-equity-ltcg.js';
export * from './other-assets-ltcg.js';
export * from './vda.js';
