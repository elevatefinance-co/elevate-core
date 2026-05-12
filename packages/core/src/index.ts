/* Public surface of @elevatefinance-co/india-tax-rules.
 *
 * Every function returns ComputationResult<T>. A number plus the full provenance trail (steps + citations).
 * Consumers project this into a Receipt PDF or on-screen breakdown. No rule ever returns a bare number;
 * if you find one, it's a bug. */

export * from './types/index.js';
export * from './citations/index.js';
export * from './slabs/index.js';
export * from './slab-compute.js';
export * from './rebate-87a.js';
export * from './surcharge.js';
export * from './cess.js';
export * from './capital-gains/index.js';
export * from './deductions/index.js';
export * from './rsu-perquisite/index.js';

export * as gst from './gst/index.js';

export * as tds from './tds/index.js';
