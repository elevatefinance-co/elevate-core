/* Barrel for the place-of-supply resolvers. Sections 10 through 13 of the IGST Act, encoded as four
 * discriminated-union resolvers (goods, imports/exports, services within India, services cross-border).
 * The intra-vs-inter helpers in types.ts lift a resolution to the GSTR-1 / GSTR-3B classification domain. */

export * from './types.js';
export * from './goods.js';
export * from './imports-exports.js';
export * from './services-india.js';
export * from './services-cross-border.js';
