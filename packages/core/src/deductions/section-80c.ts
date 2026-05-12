/* Section 80C. The single most-used deduction. Computes the allowable deduction given a basket of claimed
 * payments/investments, subject to the statutory cap.
 *
 * Cap architecture under the IT Act:
 *   Section 80CCE consolidates three sections into a single overall Rs. 1,50,000 ceiling:
 *     - Section 80C. LIC, PPF, ELSS, principal on home loan, kids' tuition, NSC, etc.
 *     - Section 80CCC. Pension fund contribution.
 *     - Section 80CCD(1). NPS employee contribution.
 *   The first two plus the employee-share of NPS together cannot exceed Rs. 1,50,000. An additional
 *   Rs. 50,000 under 80CCD(1B) and the employer share under 80CCD(2) sit OUTSIDE this ceiling (handled in
 *   `section-80ccd.ts`).
 *
 * New regime: disallowed entirely (see `new-regime-eligibility.ts`).
 * Old regime: apply the cap; return the lower of claim and cap.
 *
 * The caller passes a BREAKDOWN (so the Receipt PDF can show which instrument contributed what), not just a
 * total. This lets us emit step-level citations to the sub-provision that authorises each instrument. */

import { SECTIONS } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import { guardRegime } from './new-regime-eligibility.js';

export const SECTION_80C_CAP_COMBINED = 150_000;

export type Section80cBreakdown = {
  readonly lifeInsurancePremium?: number;
  readonly ppfContribution?: number;
  readonly elssInvestment?: number;
  readonly epfEmployeeContribution?: number;
  readonly nscInvestment?: number;
  readonly homeLoanPrincipal?: number;
  readonly childrenTuition?: number;
  readonly sukanyaSamriddhi?: number;
  readonly seniorCitizenSavings?: number;
  readonly fdWithLockIn?: number;
  readonly other?: number;
  readonly section80ccc?: number;
  readonly section80ccd1?: number;
};

export type ComputeSection80cArgs = {
  readonly regime: 'NEW' | 'OLD';
  readonly claim: Section80cBreakdown;
  readonly ay: AssessmentYear;
};

function sumBreakdown(claim: Section80cBreakdown): number {
  const fields: readonly (keyof Section80cBreakdown)[] = [
    'lifeInsurancePremium',
    'ppfContribution',
    'elssInvestment',
    'epfEmployeeContribution',
    'nscInvestment',
    'homeLoanPrincipal',
    'childrenTuition',
    'sukanyaSamriddhi',
    'seniorCitizenSavings',
    'fdWithLockIn',
    'other',
    'section80ccc',
    'section80ccd1',
  ];
  return fields.reduce((sum, key) => sum + (claim[key] ?? 0), 0);
}

export function computeSection80c({
  regime,
  claim,
  ay,
}: ComputeSection80cArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [SECTIONS.SEC_80C];

  const guard = guardRegime({ regime, sectionKey: 'SEC_80C' });
  if (!guard.allowed) {
    steps.push({
      label: 'Section 80C not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime, reason: guard.reason },
      output: 0,
      citations: [SECTIONS.SEC_80C, SECTIONS.SEC_115BAC],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, SECTIONS.SEC_115BAC]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  const totalClaim = sumBreakdown(claim);

  steps.push({
    label: 'Sum of 80C / 80CCC / 80CCD(1) claims',
    formula: 'sum(each instrument amount)',
    inputs: { totalClaim },
    output: totalClaim,
    citations: [SECTIONS.SEC_80C, SECTIONS.SEC_80CCC, SECTIONS.SEC_80CCD_1],
  });

  const allowable = Math.min(totalClaim, SECTION_80C_CAP_COMBINED);

  steps.push({
    label: `Apply combined Rs. ${SECTION_80C_CAP_COMBINED.toLocaleString('en-IN')} cap (Section 80CCE)`,
    formula: 'min(claim, cap)',
    inputs: { claim: totalClaim, cap: SECTION_80C_CAP_COMBINED, allowable },
    output: allowable,
    citations: [SECTIONS.SEC_80C],
  });

  return {
    value: allowable,
    steps,
    citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
