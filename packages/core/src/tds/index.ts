/* Public surface of the tds sub-namespace within @elevatefinance-co/india-tax-rules. Mirrors the gst
 * namespace discipline -- citations are first-class, every rule carries provenance, the namespace is
 * composable from sub-modules.
 *
 * Currently exposes:
 *   citations        ITA Sections (Chapter XVII-B + XVII-BB), IT Rules 1962, Finance Acts (incl Oct 2024
 *                    cliff), CBDT Circulars
 *   rates            Rate-band resolver -- per-Section, per-period base rate plus 206AA / 206AB /
 *                    inoperative-PAN uplift logic
 *   penalties        Section 201(1A) interest (1 / 1.5 percent monthly), Section 234E late fee
 *                    (Rs 200 / day capped at TDS amount)
 *   pan-validation   Specified-person check against CBDT non-filer list, 206AB carve-out enforcement
 *
 * Form schemas (24Q / 26Q / 27Q / 27EQ Zod schemas), certificate builders
 * (Form 16 / 16A / 16B / 16C / 16D / 16E / 27D), challan builders (ITNS-281 + challan-cum-statement), and
 * the full FVU file generator land in follow-up commits. */

export * from './citations/index.js';
export * from './rates/index.js';
export * from './penalties/index.js';
export * from './pan-validation/index.js';
