/* Section 80CCD. National Pension System deductions. Three distinct buckets, each with its own rule:
 *
 *   **80CCD(1). Employee contribution to NPS.**
 *   Sits WITHIN the combined Rs. 1,50,000 cap of Section 80CCE (along with 80C and 80CCC). Handled as one
 *   field inside the 80C breakdown; this module does not re-apply it.
 *
 *   **80CCD(1B). Additional NPS deduction.**
 *   An additional Rs. 50,000 OVER AND ABOVE the 80CCE cap. Available only in the old regime. Requires the
 *   taxpayer to have contributed at least the claimed amount over and above any portion already used toward
 *   80CCD(1).
 *
 *   **80CCD(2). Employer contribution to NPS.**
 *   Outside the 80CCE cap. Capped at 10% of salary (14% for Central / State Government employees per Finance
 *   Act 2019). **Available under the new regime**. The one Chapter VI-A deduction that survives Section
 *   115BAC's carve-out.
 *
 * This module computes (1B) and (2). (1) stays with the 80C breakdown since it shares the 80CCE cap. */

import { SECTIONS } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import { guardRegime } from './new-regime-eligibility.js';

export const SECTION_80CCD_1B_CAP = 50_000;
export const SECTION_80CCD_2_GOVT_CAP_PCT = 0.14;
export const SECTION_80CCD_2_PRIVATE_CAP_PCT = 0.1;

export type ComputeSection80ccd1bArgs = {
  readonly regime: 'NEW' | 'OLD';
  readonly claim: number;
  readonly ay: AssessmentYear;
};

export function computeSection80ccd1b({
  regime,
  claim,
  ay,
}: ComputeSection80ccd1bArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [SECTIONS.SEC_80CCD_1B];

  const guard = guardRegime({ regime, sectionKey: 'SEC_80CCD_1B' });
  if (!guard.allowed) {
    steps.push({
      label: 'Section 80CCD(1B) not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime, reason: guard.reason },
      output: 0,
      citations: [SECTIONS.SEC_80CCD_1B, SECTIONS.SEC_115BAC],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, SECTIONS.SEC_115BAC]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  const allowable = Math.min(Math.max(0, claim), SECTION_80CCD_1B_CAP);
  steps.push({
    label: `Section 80CCD(1B). Additional Rs. ${SECTION_80CCD_1B_CAP.toLocaleString('en-IN')}`,
    formula: 'min(claim, 50000)',
    inputs: { claim, cap: SECTION_80CCD_1B_CAP, allowable },
    output: allowable,
    citations: [SECTIONS.SEC_80CCD_1B],
  });

  return {
    value: allowable,
    steps,
    citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}

export type ComputeSection80ccd2Args = {
  readonly regime: 'NEW' | 'OLD';
  readonly employerContribution: number;
  readonly salaryForLimitComputation: number;
  readonly employeeCategory: 'PRIVATE' | 'CENTRAL_GOVT' | 'STATE_GOVT';
  readonly ay: AssessmentYear;
};

export function computeSection80ccd2(args: ComputeSection80ccd2Args): ComputationResult<number> {
  const { employerContribution, salaryForLimitComputation, employeeCategory, ay } = args;
  const steps: ComputationStep[] = [];

  const rateCap =
    employeeCategory === 'PRIVATE' ? SECTION_80CCD_2_PRIVATE_CAP_PCT : SECTION_80CCD_2_GOVT_CAP_PCT;

  const salaryLinkedCap = Math.round(salaryForLimitComputation * rateCap);
  const allowable = Math.min(Math.max(0, employerContribution), salaryLinkedCap);

  steps.push({
    label: `Section 80CCD(2). Employer NPS contribution, capped at ${(rateCap * 100).toFixed(0)}% of salary`,
    formula: 'min(employer_contribution, salary x cap_pct)',
    inputs: {
      employerContribution,
      salaryForLimitComputation,
      rateCap,
      salaryLinkedCap,
      allowable,
    },
    output: allowable,
    citations: [SECTIONS.SEC_80CCD_2],
  });

  return {
    value: allowable,
    steps,
    citations: dedupeCitations(steps.flatMap((step) => step.citations)),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
