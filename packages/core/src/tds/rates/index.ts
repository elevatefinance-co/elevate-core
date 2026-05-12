/* Barrel for the tds rates sub-namespace. The rate-band resolver is the central dispatcher every TDS
 * computation goes through; surcharge + cess application logic lands in follow-up commits (the surcharge
 * rates depend on recipient income band and apply primarily to non-resident TDS under Section 195). */

export * from './rate-band-resolver.js';
