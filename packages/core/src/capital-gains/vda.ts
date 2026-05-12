/* Section 115BBH. Virtual Digital Assets (crypto, NFT, etc.). Finance Act 2022 introduced VDA as a charging
 * section with a deliberately punitive design:
 *
 *   - Flat 30% on gross transfer gain.
 *   - ZERO set-off of any loss against any other head (not even against another VDA transaction).
 *   - ZERO deduction except acquisition cost. No transfer expenses, no indexation, no exemptions.
 *   - TDS 1% u/s 194S on every transfer above the threshold (caller tracks this separately.
 *     It affects refund, not liability).
 *
 * Because no set-off is permitted, a loss-making VDA transaction simply yields zero; it cannot offset any
 * other gain. We enforce this per-transaction, NOT in aggregate. Two transactions cannot net out even within
 * the same wallet. */

import { SECTIONS, FINANCE_ACTS } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import type { VdaTxn } from './shared.js';

const VDA_RATE = 0.3;

export type ComputeVdaTaxArgs = {
  readonly transactions: readonly VdaTxn[];
  readonly ay: AssessmentYear;
};

export function computeVdaTax({ transactions, ay }: ComputeVdaTaxArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [SECTIONS.SEC_115BBH, FINANCE_ACTS.FA_2022];
  let totalTax = 0;
  let totalGain = 0;

  for (const txn of transactions) {
    const gain = Math.max(0, txn.saleConsideration - txn.acquisitionCost);
    totalGain += gain;
  }

  if (totalGain > 0) {
    totalTax = Math.round(totalGain * VDA_RATE);
    steps.push({
      label: 'Virtual digital assets @ 30%. Section 115BBH',
      formula: 'sum(max(0, sale - cost)) x 0.30',
      inputs: { totalGain, rate: VDA_RATE, transactions: transactions.length },
      output: totalTax,
      citations: [SECTIONS.SEC_115BBH, FINANCE_ACTS.FA_2022, SECTIONS.SEC_194S],
    });
  } else {
    steps.push({
      label: 'No taxable VDA gain',
      formula: 'sum(gains) = 0',
      inputs: { transactions: transactions.length },
      output: 0,
      citations: [SECTIONS.SEC_115BBH],
    });
  }

  return {
    value: totalTax,
    steps,
    citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
