/* Section 112A. Long-Term Capital Gains on STT-paid listed equity (and equity-oriented mutual funds).
 * Three things make this module more involved than 111A:
 *
 *   1. **Rate split at 23-Jul-2024.** 10% before, 12.5% on or after.
 *   2. **Consolidated annual exemption of Rs. 1.25L.** CBDT Circular 12/2024 clarified that the pre-split
 *      Rs. 1L exemption and the post-split Rs. 1.25L exemption are NOT cumulative. A single taxpayer-annual
 *      Rs. 1.25L pool applies across both halves of the year. The caller supplies the whole year's 112A gains;
 *      this module consumes the exemption pre first, spills to post.
 *   3. **Grandfathering for pre-Feb-2018 acquisitions.** Section 112A(4) carves out every share / MF unit
 *      acquired on or before 31-Jan-2018: the cost of acquisition is computed as
 *      MAX(actual cost, MIN(FMV on 31-Jan-2018, sale consideration)). Consumers pass `fmvJan312018` on each
 *      such transaction; we honour it.
 *
 * Holding period cut-off: 12 months. Callers route only transactions already classified as LTCG. */

import { SECTIONS, FINANCE_ACTS, CIRCULARS } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import { isPostSplitDate } from './split-date.js';
import type { ListedEquityTxn } from './shared.js';

const LTCG_112A_PRE_SPLIT_RATE = 0.1;
const LTCG_112A_POST_SPLIT_RATE = 0.125;
export const LTCG_112A_CONSOLIDATED_EXEMPTION = 125_000;

function netGainListed(txn: ListedEquityTxn): number {
  const expenses = txn.transferExpenses ?? 0;
  const fmv = txn.fmvJan312018 ?? 0;
  const grandfatheredCost =
    fmv > 0
      ? Math.max(txn.acquisitionCost, Math.min(fmv, txn.saleConsideration))
      : txn.acquisitionCost;
  return Math.max(0, txn.saleConsideration - grandfatheredCost - expenses);
}

export type ComputeLtcg112AArgs = {
  readonly transactions: readonly ListedEquityTxn[];
  readonly ay: AssessmentYear;
};

export function computeLtcg112A({
  transactions,
  ay,
}: ComputeLtcg112AArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [SECTIONS.SEC_112A];

  let preSplitGrossGain = 0;
  let postSplitGrossGain = 0;
  for (const txn of transactions) {
    const gain = netGainListed(txn);
    if (isPostSplitDate(txn.saleDate)) postSplitGrossGain += gain;
    else preSplitGrossGain += gain;
  }

  const totalGrossGain = preSplitGrossGain + postSplitGrossGain;

  if (totalGrossGain === 0) {
    steps.push({
      label: 'No taxable LTCG under Section 112A',
      formula: 'sum(gains) = 0',
      inputs: { transactions: transactions.length },
      output: 0,
      citations: [SECTIONS.SEC_112A],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations(citations),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  steps.push({
    label: 'Gross LTCG on listed equity / equity MF',
    formula: 'sum(sale - max(cost, min(fmv-31-Jan-2018, sale)) - expenses)',
    inputs: { preSplitGrossGain, postSplitGrossGain, totalGrossGain },
    output: totalGrossGain,
    citations: [SECTIONS.SEC_112A],
  });

  const exemptionApplied = Math.min(LTCG_112A_CONSOLIDATED_EXEMPTION, totalGrossGain);
  steps.push({
    label: `Consolidated annual exemption. Rs. ${LTCG_112A_CONSOLIDATED_EXEMPTION.toLocaleString('en-IN')}`,
    formula: 'min(Rs. 1,25,000, gross gain)',
    inputs: {
      annualExemption: LTCG_112A_CONSOLIDATED_EXEMPTION,
      grossGain: totalGrossGain,
      applied: exemptionApplied,
    },
    output: -exemptionApplied,
    citations: [SECTIONS.SEC_112A, CIRCULARS.CBDT_CIRC_12_2024],
  });

  let remainingExemption = LTCG_112A_CONSOLIDATED_EXEMPTION;
  const preAfterExemption = Math.max(0, preSplitGrossGain - remainingExemption);
  remainingExemption = Math.max(0, remainingExemption - preSplitGrossGain);
  const postAfterExemption = Math.max(0, postSplitGrossGain - remainingExemption);

  let totalTax = 0;

  if (preAfterExemption > 0) {
    const tax = Math.round(preAfterExemption * LTCG_112A_PRE_SPLIT_RATE);
    totalTax += tax;
    steps.push({
      label: 'LTCG. Listed equity (pre 23-Jul-2024) @ 10%',
      formula: '(gain - exemption_applied_pre) x 0.10',
      inputs: { taxable: preAfterExemption, rate: LTCG_112A_PRE_SPLIT_RATE },
      output: tax,
      citations: [SECTIONS.SEC_112A],
    });
  }

  if (postAfterExemption > 0) {
    const tax = Math.round(postAfterExemption * LTCG_112A_POST_SPLIT_RATE);
    totalTax += tax;
    steps.push({
      label: 'LTCG. Listed equity (from 23-Jul-2024) @ 12.5%',
      formula: '(gain - exemption_spill) x 0.125',
      inputs: { taxable: postAfterExemption, rate: LTCG_112A_POST_SPLIT_RATE },
      output: tax,
      citations: [SECTIONS.SEC_112A, FINANCE_ACTS.FA_2024, CIRCULARS.CBDT_CIRC_12_2024],
    });
  }

  const allCitations = dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]);

  return {
    value: totalTax,
    steps,
    citations: allCitations,
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
