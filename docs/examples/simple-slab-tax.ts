/* Simple end-to-end slab-tax computation under the new regime.
 *
 * Chain: getSlabs -> computeSlabTax -> computeRebate87A
 *        -> computeSurcharge -> computeCess.
 *
 * The output of each step feeds the next.
 * Every step contributes to a flat citations[] array via dedupeCitations,
 * and to a concatenated steps[] for the audit trail.
 *
 * Run with: pnpm tsx docs/examples/simple-slab-tax.ts
 */

import {
  getSlabs,
  computeSlabTax,
  computeRebate87A,
  computeSurcharge,
  computeCess,
  dedupeCitations,
  SURCHARGE_TIERS_INDIVIDUAL_NEW,
} from '@elevatefinance-co/india-tax-rules';

const ay = 'AY2026-27';
const taxableIncome = 1_500_000;

const slabs = getSlabs({ regime: 'NEW', ay });

const base = computeSlabTax({
  taxableIncome,
  slabs: slabs.value,
  ay,
});

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

const final = computeCess({
  taxPlusSurcharge: surcharged.value,
  ay,
});

const allSteps = [...base.steps, ...rebated.steps, ...surcharged.steps, ...final.steps];

const allCitations = dedupeCitations([
  ...base.citations,
  ...rebated.citations,
  ...surcharged.citations,
  ...final.citations,
]);

console.log(
  JSON.stringify(
    {
      ay,
      taxableIncome,
      netTaxPayable: final.value,
      steps: allSteps,
      citations: allCitations,
    },
    null,
    2,
  ),
);
