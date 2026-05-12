/* Section 112. Long-Term Capital Gains on assets other than STT-paid listed equity.
 * Applies to unlisted shares, immovable property, debentures (non-listed), gold / jewellery, and so on.
 *
 * Rate timeline:
 *   - Pre-23-Jul-2024: 20% flat with indexation benefit under Section 48 second proviso (indexed cost of
 *     acquisition using CII). Holding-period cut-off for most assets is 24 months.
 *   - From 23-Jul-2024: 12.5% flat WITHOUT indexation, for every covered asset.
 *
 * The second proviso to Section 112 (Finance (No. 2) Act 2024, as clarified in CBDT Circular 12/2024) gives
 * resident individuals and HUFs an election on pre-23-Jul-2024-acquired land / buildings: they MAY choose
 * between 20%-with-indexation and 12.5%-without-indexation, whichever produces lower tax. The caller signals
 * this election via `indexationOptIn = true` on the specific transaction.
 *
 * This module does NOT compute indexed cost. That requires a CII table that changes every year. Callers pass
 * `acquisitionCost` already indexed (if they want the indexation path) and set the `indexationOptIn` flag so
 * we pick the correct rate. This keeps the package zero-dep and leaves the year-specific CII table as a
 * caller concern. */

import { SECTIONS, FINANCE_ACTS, CIRCULARS } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import { isPostSplitDate } from './split-date.js';
import type { OtherAssetTxn } from './shared.js';

const LTCG_112_PRE_SPLIT_RATE = 0.2;
const LTCG_112_POST_SPLIT_RATE_NO_INDEX = 0.125;
const LTCG_112_POST_SPLIT_RATE_INDEXATION_OPTION = 0.2;

function netGain(txn: OtherAssetTxn): number {
  const expenses = txn.transferExpenses ?? 0;
  const improvement = txn.improvementCost ?? 0;
  return Math.max(0, txn.saleConsideration - txn.acquisitionCost - expenses - improvement);
}

function sumClaimedExemptions(txn: OtherAssetTxn): number {
  return txn.exemptionsClaimed?.reduce((sum, row) => sum + (row.amount ?? 0), 0) ?? 0;
}

export type ComputeLtcg112Args = {
  readonly transactions: readonly OtherAssetTxn[];
  readonly ay: AssessmentYear;
  readonly isResidentIndividualOrHuf?: boolean;
};

export function computeLtcg112({
  transactions,
  ay,
  isResidentIndividualOrHuf = false,
}: ComputeLtcg112Args): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  let totalTax = 0;

  for (const txn of transactions) {
    const grossGain = netGain(txn);
    const exemption = sumClaimedExemptions(txn);
    const taxableGain = Math.max(0, grossGain - exemption);
    if (taxableGain === 0) continue;

    const postSplit = isPostSplitDate(txn.saleDate);
    const isLandOrBuilding =
      txn.assetType === 'IMMOVABLE_PROPERTY_LAND' ||
      txn.assetType === 'IMMOVABLE_PROPERTY_BUILDING';
    const pre23JulyAcquisition =
      new Date(txn.purchaseDate).getTime() < new Date('2024-07-23T00:00:00Z').getTime();
    const eligibleForIndexationOption =
      postSplit && isResidentIndividualOrHuf && isLandOrBuilding && pre23JulyAcquisition;
    const usingIndexationOption = Boolean(eligibleForIndexationOption && txn.indexationOptIn);

    const rate = !postSplit
      ? LTCG_112_PRE_SPLIT_RATE
      : usingIndexationOption
        ? LTCG_112_POST_SPLIT_RATE_INDEXATION_OPTION
        : LTCG_112_POST_SPLIT_RATE_NO_INDEX;

    const tax = Math.round(taxableGain * rate);
    totalTax += tax;

    const txnCitations: Citation[] = [SECTIONS.SEC_112];
    if (postSplit) {
      txnCitations.push(FINANCE_ACTS.FA_2024, CIRCULARS.CBDT_CIRC_12_2024);
    }
    if (usingIndexationOption) {
      txnCitations.push(SECTIONS.SEC_48);
    }

    steps.push({
      label: `LTCG. ${txn.assetDescription ?? txn.assetType.toLowerCase()} ${postSplit ? '(from 23-Jul-2024)' : '(pre 23-Jul-2024)'}${usingIndexationOption ? ' - indexation option' : ''}`,
      formula: `(sale - cost - expenses - improvement - exemption) x ${(rate * 100).toFixed(1)}%`,
      inputs: {
        saleConsideration: txn.saleConsideration,
        acquisitionCost: txn.acquisitionCost,
        improvementCost: txn.improvementCost ?? 0,
        transferExpenses: txn.transferExpenses ?? 0,
        exemption,
        taxableGain,
        rate,
      },
      output: tax,
      citations: txnCitations,
    });
  }

  if (steps.length === 0) {
    steps.push({
      label: 'No taxable LTCG under Section 112',
      formula: 'sum(gains) = 0',
      inputs: { transactions: transactions.length },
      output: 0,
      citations: [SECTIONS.SEC_112],
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
