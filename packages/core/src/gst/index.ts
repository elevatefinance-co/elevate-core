/* Public surface of the gst sub-namespace within @elevatefinance-co/india-tax-rules. Mirrors the existing
 * top-level discipline -- citations are first-class, every rule carries provenance, the namespace is
 * composable from sub-modules.
 *
 * Currently exposes the citation registry (CGST Act sections, IGST Act sections, CGST Rules, operative CBIC
 * notifications), the rate slab structure (5 slabs, basis-point internals, effective-date band), and the
 * Section 17(5) blocked-credit classifier. Place-of-supply resolvers (Sections 10-13 IGST), registration
 * thresholds, composition eligibility, filing frequencies, HSN digit-granularity, IMS state machine, notice
 * taxonomy, and ITC apportionment formulas land in follow-up commits per the comprehensive build plan at
 * gst-tds-build/plan.md section 4. */

export * from './citations/index.js';
export * from './rates/index.js';
export * from './itc/index.js';
export * from './place-of-supply/index.js';
export * from './registration/index.js';
export * from './composition/index.js';
export * from './frequencies/index.js';
export * from './penalties/index.js';
