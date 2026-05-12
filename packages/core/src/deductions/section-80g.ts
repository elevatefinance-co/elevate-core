/* Section 80G. Donations to approved charitable institutions. The trickiest Chapter VI-A deduction to model
 * because it combines four independent variables per donation:
 *
 *   1. **Rate**. 50% or 100% of the donation amount, depending on the institution's approval category.
 *      Set by CBDT.
 *   2. **Qualifying-limit gate**. Some institutions are subject to a cap of 10% of "Adjusted Gross Total
 *      Income" (AGTI). Others are not (certain government funds. CM's Relief, PM Cares).
 *   3. **Mode of payment**. Cash donations above Rs. 2,000 do NOT qualify (Finance Act 2017 amendment).
 *      Callers must declare the mode.
 *   4. **80G(5) approval validity**. The donee must be approved as on the payment date. Caller attests this;
 *      we don't verify.
 *
 * The module encodes the 50%/100% x with-cap/without-cap matrix as four donation categories, matching the
 * CBDT classification.
 *
 * New-regime: disallowed entirely. */

import { SECTIONS } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import { guardRegime } from './new-regime-eligibility.js';

export type Section80gDonationCategory =
  | '100_PCT_NO_LIMIT'
  | '50_PCT_NO_LIMIT'
  | '100_PCT_WITH_LIMIT'
  | '50_PCT_WITH_LIMIT';

export type Section80gDonation = {
  readonly category: Section80gDonationCategory;
  readonly amount: number;
  readonly mode: 'CASH' | 'NON_CASH';
  readonly doneeName?: string;
  readonly done8eApprovalNumber?: string;
};

const CASH_CEILING = 2_000;
const AGTI_LIMIT_RATE = 0.1;

export type ComputeSection80gArgs = {
  readonly regime: 'NEW' | 'OLD';
  readonly donations: readonly Section80gDonation[];
  readonly adjustedGrossTotalIncome: number;
  readonly ay: AssessmentYear;
};

export function computeSection80g({
  regime,
  donations,
  adjustedGrossTotalIncome,
  ay,
}: ComputeSection80gArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [SECTIONS.SEC_80G];

  const guard = guardRegime({ regime, sectionKey: 'SEC_80G' });
  if (!guard.allowed) {
    steps.push({
      label: 'Section 80G not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime, reason: guard.reason },
      output: 0,
      citations: [SECTIONS.SEC_80G, SECTIONS.SEC_115BAC],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, SECTIONS.SEC_115BAC]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  let noLimitAllowable = 0;
  let withLimitGross = 0;

  for (const donation of donations) {
    if (donation.mode === 'CASH' && donation.amount > CASH_CEILING) {
      steps.push({
        label: `Donation of Rs. ${donation.amount.toLocaleString('en-IN')} in cash. Disqualified (> Rs. 2,000)`,
        formula: 'disqualified under Finance Act 2017',
        inputs: { amount: donation.amount, cashCeiling: CASH_CEILING },
        output: 0,
        citations: [SECTIONS.SEC_80G],
      });
      continue;
    }

    const rate =
      donation.category === '100_PCT_NO_LIMIT' || donation.category === '100_PCT_WITH_LIMIT'
        ? 1
        : 0.5;
    const gross = Math.round(donation.amount * rate);

    if (donation.category === '100_PCT_NO_LIMIT' || donation.category === '50_PCT_NO_LIMIT') {
      noLimitAllowable += gross;
      steps.push({
        label: `Donation ${donation.doneeName ?? ''}. ${donation.category} @ ${(rate * 100).toFixed(0)}% (no AGTI limit)`,
        formula: 'amount x rate',
        inputs: { amount: donation.amount, rate, gross },
        output: gross,
        citations: [SECTIONS.SEC_80G],
      });
    } else {
      withLimitGross += gross;
      steps.push({
        label: `Donation ${donation.doneeName ?? ''}. ${donation.category} @ ${(rate * 100).toFixed(0)}% (subject to AGTI cap)`,
        formula: 'amount x rate',
        inputs: { amount: donation.amount, rate, gross },
        output: gross,
        citations: [SECTIONS.SEC_80G],
      });
    }
  }

  const agtiCap = Math.round(adjustedGrossTotalIncome * AGTI_LIMIT_RATE);
  const withLimitAllowable = Math.min(withLimitGross, agtiCap);

  if (withLimitGross > 0) {
    steps.push({
      label: `Apply 10% AGTI cap to "with-limit" donations`,
      formula: 'min(with_limit_gross, AGTI x 10%)',
      inputs: { withLimitGross, agtiCap, withLimitAllowable },
      output: withLimitAllowable,
      citations: [SECTIONS.SEC_80G],
    });
  }

  const total = noLimitAllowable + withLimitAllowable;

  steps.push({
    label: 'Total Section 80G allowable',
    formula: 'no_limit + capped_with_limit',
    inputs: { noLimitAllowable, withLimitAllowable, total },
    output: total,
    citations: [SECTIONS.SEC_80G],
  });

  return {
    value: total,
    steps,
    citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
