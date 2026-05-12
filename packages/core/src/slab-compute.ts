/* Core slab-to-tax computation. Pure function. Produces a ComputationResult carrying a per-slab breakdown.
 * Consumer projects the breakdown into the Receipt PDF. */

import type { AssessmentYear, Citation } from './types/citation.js';
import type { ComputationResult, ComputationStep } from './types/result.js';
import { ENGINE_VERSION } from './types/result.js';
import type { TaxSlab } from './slabs/index.js';

export type ComputeSlabTaxArgs = {
  readonly taxableIncome: number;
  readonly slabs: readonly TaxSlab[];
  readonly ay: AssessmentYear;
  readonly citations?: readonly Citation[];
};

export function computeSlabTax({
  taxableIncome,
  slabs,
  ay,
  citations = [],
}: ComputeSlabTaxArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  let total = 0;

  if (taxableIncome <= 0) {
    return {
      value: 0,
      steps: [
        {
          label: 'Taxable income is zero or negative',
          formula: 'tax = 0',
          inputs: { taxableIncome },
          output: 0,
          citations,
        },
      ],
      citations,
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  for (const slab of slabs) {
    const slabTop = Math.min(taxableIncome, slab.upperBound);
    if (slabTop <= slab.lowerBound) break;
    const taxableAtSlab = slabTop - slab.lowerBound;
    const taxAtSlab = taxableAtSlab * slab.rate;
    total += taxAtSlab;

    steps.push({
      label: `Slab ${formatBound(slab.lowerBound)} to ${formatBound(slab.upperBound)} @ ${(
        slab.rate * 100
      ).toFixed(0)}%`,
      formula: `${taxableAtSlab} x ${slab.rate} = ${taxAtSlab}`,
      inputs: {
        lowerBound: slab.lowerBound,
        upperBound: slab.upperBound === Infinity ? 'infinity' : slab.upperBound,
        rate: slab.rate,
        taxableAtSlab,
      },
      output: Math.round(taxAtSlab),
      citations,
    });
  }

  const rounded = Math.round(total);

  return {
    value: rounded,
    steps,
    citations,
    ay,
    engineVersion: ENGINE_VERSION,
  };
}

function formatBound(bound: number): string {
  if (bound === Infinity) return 'infinity';
  if (bound === 0) return '0';
  return `Rs. ${bound.toLocaleString('en-IN')}`;
}
