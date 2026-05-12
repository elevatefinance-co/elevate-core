/* Render a ComputationResult chain as a CA-printable audit trail.
 *
 * This example shows how a downstream tool composes the slab + rebate + surcharge + cess primitives,
 * then renders the combined audit trail in a structure suitable for a Receipt PDF or an on-screen "show
 * my work" expander.
 *
 * The output is plain JSON - a real consuming UI would project it into a table for the steps[] and a
 * list of deep links for the citations[].
 * The library does not pre-decide presentation; it gives data and the consumer decides.
 *
 * Run with: pnpm tsx docs/examples/audit-trail-receipt.ts
 */

import {
  getSlabs,
  computeSlabTax,
  computeRebate87A,
  computeSurcharge,
  computeCess,
  dedupeCitations,
  SURCHARGE_TIERS_INDIVIDUAL_NEW,
  type Citation,
  type ComputationStep,
} from '@elevatefinance-co/india-tax-rules';

type Receipt = {
  generatedAt: string;
  ay: string;
  taxableIncome: number;
  netTaxPayable: number;
  steps: ComputationStep[];
  citations: ReadonlyArray<Citation>;
  engineVersion: string;
};

function renderReceipt(taxableIncome: number, ay: 'AY2025-26' | 'AY2026-27'): Receipt {
  const slabs = getSlabs({ regime: 'NEW', ay });
  const base = computeSlabTax({ taxableIncome, slabs: slabs.value, ay });
  const rebated = computeRebate87A({
    taxableIncome,
    taxBeforeRebate: base.value,
    regime: 'NEW',
    ay,
  });
  const surcharged = computeSurcharge({
    taxableIncome,
    taxBeforeCess: rebated.value,
    tiers: SURCHARGE_TIERS_INDIVIDUAL_NEW,
    ay,
  });
  const final = computeCess({ taxPlusSurcharge: surcharged.value, ay });

  return {
    generatedAt: new Date().toISOString(),
    ay,
    taxableIncome,
    netTaxPayable: final.value,
    steps: [...base.steps, ...rebated.steps, ...surcharged.steps, ...final.steps],
    citations: dedupeCitations([
      ...base.citations,
      ...rebated.citations,
      ...surcharged.citations,
      ...final.citations,
    ]),
    engineVersion: final.engineVersion,
  };
}

const receipt = renderReceipt(1_500_000, 'AY2026-27');
console.log(JSON.stringify(receipt, null, 2));
