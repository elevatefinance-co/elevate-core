/* Section 80D. Medical insurance premium + preventive health check-up. The deduction has two independent
 * buckets:
 *
 *   **Self + family**. Rs. 25,000 if the insured self/spouse/kids are all under 60; Rs. 50,000 if anyone
 *   covered is a senior (60+).
 *
 *   **Parents**. Rs. 25,000 if parents are under 60; Rs. 50,000 if a parent is a senior. Available even when
 *   the taxpayer is young.
 *
 * Preventive health check-up is a sub-sublimit of Rs. 5,000, and it sits WITHIN each of the two buckets
 * above. It does NOT add on top. This is where every DIY tax tool gets it wrong.
 *
 * New-regime: disallowed entirely. */

import { SECTIONS } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import { guardRegime } from './new-regime-eligibility.js';

const SECTION_80D_NON_SENIOR_CAP = 25_000;
const SECTION_80D_SENIOR_CAP = 50_000;
const SECTION_80D_PHC_SUBLIMIT = 5_000;

function capForBucket(anySeniorInBucket: boolean): number {
  return anySeniorInBucket ? SECTION_80D_SENIOR_CAP : SECTION_80D_NON_SENIOR_CAP;
}

export type Section80dClaim = {
  readonly selfFamilyPremium?: number;
  readonly selfFamilyPreventiveHealthCheckup?: number;
  readonly anySelfFamilySenior: boolean;
  readonly parentsPremium?: number;
  readonly parentsPreventiveHealthCheckup?: number;
  readonly anyParentSenior: boolean;
};

export type ComputeSection80dArgs = {
  readonly regime: 'NEW' | 'OLD';
  readonly claim: Section80dClaim;
  readonly ay: AssessmentYear;
};

function computeBucket(
  premium: number,
  phc: number,
  bucketCap: number,
): { allowable: number; phcWithinLimit: number } {
  const phcWithinLimit = Math.min(phc, SECTION_80D_PHC_SUBLIMIT);
  const combinedClaim = premium + phcWithinLimit;
  const allowable = Math.min(combinedClaim, bucketCap);
  return { allowable, phcWithinLimit };
}

export function computeSection80d({
  regime,
  claim,
  ay,
}: ComputeSection80dArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [SECTIONS.SEC_80D];

  const guard = guardRegime({ regime, sectionKey: 'SEC_80D' });
  if (!guard.allowed) {
    steps.push({
      label: 'Section 80D not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime, reason: guard.reason },
      output: 0,
      citations: [SECTIONS.SEC_80D, SECTIONS.SEC_115BAC],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, SECTIONS.SEC_115BAC]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  const selfCap = capForBucket(claim.anySelfFamilySenior);
  const selfBucket = computeBucket(
    claim.selfFamilyPremium ?? 0,
    claim.selfFamilyPreventiveHealthCheckup ?? 0,
    selfCap,
  );

  steps.push({
    label: `Self + family bucket. Cap Rs. ${selfCap.toLocaleString('en-IN')}${claim.anySelfFamilySenior ? ' (senior)' : ''}`,
    formula: 'min(premium + min(phc, 5000), bucket_cap)',
    inputs: {
      premium: claim.selfFamilyPremium ?? 0,
      phc: claim.selfFamilyPreventiveHealthCheckup ?? 0,
      phcWithinLimit: selfBucket.phcWithinLimit,
      bucketCap: selfCap,
      allowable: selfBucket.allowable,
    },
    output: selfBucket.allowable,
    citations: [SECTIONS.SEC_80D],
  });

  const parentCap = capForBucket(claim.anyParentSenior);
  const parentBucket = computeBucket(
    claim.parentsPremium ?? 0,
    claim.parentsPreventiveHealthCheckup ?? 0,
    parentCap,
  );

  steps.push({
    label: `Parents bucket. Cap Rs. ${parentCap.toLocaleString('en-IN')}${claim.anyParentSenior ? ' (senior)' : ''}`,
    formula: 'min(parents_premium + min(parents_phc, 5000), parent_cap)',
    inputs: {
      premium: claim.parentsPremium ?? 0,
      phc: claim.parentsPreventiveHealthCheckup ?? 0,
      phcWithinLimit: parentBucket.phcWithinLimit,
      bucketCap: parentCap,
      allowable: parentBucket.allowable,
    },
    output: parentBucket.allowable,
    citations: [SECTIONS.SEC_80D],
  });

  const total = selfBucket.allowable + parentBucket.allowable;
  steps.push({
    label: 'Total Section 80D allowable',
    formula: 'self_bucket + parents_bucket',
    inputs: {
      selfBucket: selfBucket.allowable,
      parentsBucket: parentBucket.allowable,
      total,
    },
    output: total,
    citations: [SECTIONS.SEC_80D],
  });

  return {
    value: total,
    steps,
    citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
