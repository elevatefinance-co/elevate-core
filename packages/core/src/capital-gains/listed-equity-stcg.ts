/* Section 111A. Short-Term Capital Gains on STT-paid listed equity (and equity-oriented mutual funds).
 * The only STCG category in the Act that carries a concessional rate; every other short-term gain goes at slab.
 *
 * Rate timeline:
 *   - Pre-23-Jul-2024: 15% flat (original Section 111A text)
 *   - From 23-Jul-2024: 20% flat (amended by Finance (No. 2) Act 2024 to narrow the gap with 112A LTCG rate)
 *
 * Holding period cut-off: 12 months for listed equity. The caller is responsible for classifying a transaction
 * as STCG vs LTCG before routing it here; this module assumes every input is already known to be STCG. */

import { SECTIONS, FINANCE_ACTS, CIRCULARS } from '../citations/index.js';
import type { AssessmentYear } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import { isPostSplitDate } from './split-date.js';
import type { ListedEquityTxn } from './shared.js';

const STCG_111A_PRE_SPLIT_RATE = 0.15;
const STCG_111A_POST_SPLIT_RATE = 0.2;

function netGain(txn: ListedEquityTxn): number {
  const expenses = txn.transferExpenses ?? 0;
  return Math.max(0, txn.saleConsideration - txn.acquisitionCost - expenses);
}

export type ComputeStcg111AArgs = {
  readonly transactions: readonly ListedEquityTxn[];
  readonly ay: AssessmentYear;
};

export function computeStcg111A({
  transactions,
  ay,
}: ComputeStcg111AArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];

  let preSplitGain = 0;
  let postSplitGain = 0;
  for (const txn of transactions) {
    const gain = netGain(txn);
    if (isPostSplitDate(txn.saleDate)) postSplitGain += gain;
    else preSplitGain += gain;
  }

  let totalTax = 0;

  if (preSplitGain > 0) {
    const tax = Math.round(preSplitGain * STCG_111A_PRE_SPLIT_RATE);
    totalTax += tax;
    steps.push({
      label: 'STCG. Listed equity (pre 23-Jul-2024) @ 15%',
      formula: 'gain x 0.15',
      inputs: { gain: preSplitGain, rate: STCG_111A_PRE_SPLIT_RATE },
      output: tax,
      citations: [SECTIONS.SEC_111A],
    });
  }

  if (postSplitGain > 0) {
    const tax = Math.round(postSplitGain * STCG_111A_POST_SPLIT_RATE);
    totalTax += tax;
    steps.push({
      label: 'STCG. Listed equity (from 23-Jul-2024) @ 20%',
      formula: 'gain x 0.20',
      inputs: { gain: postSplitGain, rate: STCG_111A_POST_SPLIT_RATE },
      output: tax,
      citations: [SECTIONS.SEC_111A, FINANCE_ACTS.FA_2024, CIRCULARS.CBDT_CIRC_12_2024],
    });
  }

  if (steps.length === 0) {
    steps.push({
      label: 'No taxable STCG under Section 111A',
      formula: 'sum(gains) = 0',
      inputs: { transactions: transactions.length },
      output: 0,
      citations: [SECTIONS.SEC_111A],
    });
  }

  const allCitations = dedupeCitations(steps.flatMap((step) => step.citations));

  return {
    value: totalTax,
    steps,
    citations: allCitations,
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
