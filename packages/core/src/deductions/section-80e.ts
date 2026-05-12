/* Section 80E. Interest paid on a loan taken for higher education, for the taxpayer / spouse / kids /
 * student of whom the taxpayer is legal guardian. Two non-obvious aspects:
 *
 *   1. **No monetary cap.** The full interest amount actually paid during the previous year is deductible.
 *      Principal repayment does NOT qualify.
 *   2. **Time limit of 8 years** starting from the year the taxpayer first starts paying interest (or until
 *      the interest is fully paid, whichever is earlier). Caller supplies the "year-of-first-interest-payment"
 *      + current AY; we enforce.
 *
 * New-regime: disallowed entirely. */

import { SECTIONS } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import { guardRegime } from './new-regime-eligibility.js';

const SECTION_80E_MAX_YEARS = 8;

function parseAyStartYear(ay: AssessmentYear): number {
  const match = ay.match(/^AY(\d{4})-(\d{2})$/);
  if (!match) return NaN;
  const startYear = Number(match[1]);
  const endYearTwoDigits = Number(match[2]);
  const expectedEndTwoDigits = (startYear + 1) % 100;
  if (endYearTwoDigits !== expectedEndTwoDigits) return NaN;
  return startYear;
}

export type ComputeSection80eArgs = {
  readonly regime: 'NEW' | 'OLD';
  readonly interestPaid: number;
  readonly firstInterestPaymentAyStartYear: number;
  readonly ay: AssessmentYear;
};

export function computeSection80e({
  regime,
  interestPaid,
  firstInterestPaymentAyStartYear,
  ay,
}: ComputeSection80eArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [SECTIONS.SEC_80E];

  const guard = guardRegime({ regime, sectionKey: 'SEC_80E' });
  if (!guard.allowed) {
    steps.push({
      label: 'Section 80E not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime, reason: guard.reason },
      output: 0,
      citations: [SECTIONS.SEC_80E, SECTIONS.SEC_115BAC],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, SECTIONS.SEC_115BAC]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  const currentAyStartYear = parseAyStartYear(ay);
  const yearsElapsed = currentAyStartYear - firstInterestPaymentAyStartYear + 1;
  const withinWindow = yearsElapsed >= 1 && yearsElapsed <= SECTION_80E_MAX_YEARS;

  if (!withinWindow) {
    steps.push({
      label: 'Section 80E. 8-year window expired or not yet started',
      formula: 'deduction = 0 outside window',
      inputs: {
        firstInterestPaymentAyStartYear,
        currentAyStartYear,
        yearsElapsed,
        maxYears: SECTION_80E_MAX_YEARS,
      },
      output: 0,
      citations: [SECTIONS.SEC_80E],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  const allowable = Math.max(0, interestPaid);

  steps.push({
    label: `Section 80E. Full interest paid (year ${yearsElapsed} of ${SECTION_80E_MAX_YEARS})`,
    formula: 'interest_paid (no cap, within 8-year window)',
    inputs: {
      interestPaid,
      yearsElapsed,
      maxYears: SECTION_80E_MAX_YEARS,
      allowable,
    },
    output: allowable,
    citations: [SECTIONS.SEC_80E],
  });

  return {
    value: allowable,
    steps,
    citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
