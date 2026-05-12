/* Wave 4. RSU / ESOP perquisite engine. The differentiator module for the RSU optimizer product.
 * Three pure functions, composed by callers:
 *
 *   1. `sourceFmvPerUnitInr`. Rule 3(8) dispatcher. Handles the three listing-status cases (Indian exchange,
 *      foreign exchange with SBI TTBR, unlisted with merchant-banker FMV).
 *
 *   2. `computePerquisiteAtVest`. Section 17(2)(vi) taxable amount added to salary at each vest event.
 *      Composes the FMV sourcing result with the exercise-price-in-INR conversion to produce the perquisite
 *      total. Respects the eligible-startup deferral carve-out.
 *
 *   3. `computeSaleCostBasis`. Section 49 / Bhojison-ruling cost-basis computation for a later sale.
 *      Produces the triple (cost_basis, sale_proceeds, net_gain) that feeds directly into Wave 2's
 *      112A / 112 / 115AD modules.
 *
 * The engine deliberately does NOT compute the final tax on a perquisite or a sale. That requires slab +
 * surcharge + cess composition plus Form 67 FTC logic, which are separate modules. Perquisite flows into
 * "Income from Salary"; capital gain flows into "Capital Gains". Callers stitch them together. */

export * from './types.js';
export * from './fmv-sourcing.js';
export * from './perquisite-at-vest.js';
export * from './sale-cost-basis.js';
