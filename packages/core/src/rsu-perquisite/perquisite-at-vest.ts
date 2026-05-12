/* Section 17(2)(vi) perquisite. The employer-granted securities taxation event. On vest / allotment of an
 * RSU or ESOP, the perquisite value added to the employee's salary is:
 *
 *   perquisite = (FMV per unit on vest date - exercise price per unit) x units vested
 *
 * Computed in INR after FMV sourcing routes through Rule 3(8) for the underlying security's listing status.
 * The entire perquisite value flows into "Income from Salary" and attracts TDS u/s 192 at the employee's
 * marginal rate; the employer is the deductor.
 *
 * This module does NOT:
 *   - Compute the employee's marginal tax on the perquisite. That's a slab + surcharge + cess composition
 *     the caller performs (using the slabs / surcharge / cess modules).
 *   - Determine whether the grant is tax-deferred under the eligible-startup rules of Section 17(2)(vi)
 *     second proviso (only for DPIIT-recognised eligible startups; deferral up to 48 months or until sale /
 *     cessation). The caller flags this via `isEligibleStartup` and we return a zero perquisite with an
 *     explanatory step so the deferred amount can be picked up in the tax-trigger year.
 *
 * The FX conversion for foreign-listed grants uses the SBI TTBR on the vest date, per Rule 3(8)(iii)(c).
 * Callers for whom TTBR isn't available (e.g., historical data pre-1999) can substitute Rule 26 fallbacks;
 * this module accepts whatever TTBR the caller passes. */

import { SECTIONS, RULES } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import type { RsuGrant, RsuVestEvent } from './types.js';
import { sourceFmvPerUnitInr } from './fmv-sourcing.js';

export type ComputePerquisiteAtVestArgs = {
  readonly grant: RsuGrant;
  readonly vest: RsuVestEvent;
  readonly isEligibleStartup?: boolean;
  readonly ay: AssessmentYear;
};

export function computePerquisiteAtVest({
  grant,
  vest,
  isEligibleStartup = false,
  ay,
}: ComputePerquisiteAtVestArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [SECTIONS.SEC_17_2_vi, RULES.RULE_3, RULES.RULE_3_8];

  if (isEligibleStartup) {
    steps.push({
      label: 'Eligible-startup deferral. Perquisite tax deferred up to 48 months',
      formula:
        'perquisite = 0 (deferred to earlier of: (a) 48 months from vest, (b) employment cessation, (c) sale)',
      inputs: {
        units: vest.unitsVested,
        fmvForeign: vest.fmvPerUnitInOriginalCurrency,
        exercisePriceForeign: grant.exercisePriceInOriginalCurrency,
        isEligibleStartup: String(isEligibleStartup),
      },
      output: 0,
      citations: [SECTIONS.SEC_17_2_vi],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  const fmvResult = sourceFmvPerUnitInr({ grant, vest, ay });
  for (const fmvStep of fmvResult.steps) steps.push(fmvStep);
  const fmvPerUnitInr = fmvResult.value;

  const ttbr = vest.sbiTtbrOnVestDate ?? 0;
  const exercisePriceInr = Math.round(
    grant.exercisePriceInOriginalCurrency *
      (grant.listingStatus === 'LISTED_FOREIGN_EXCHANGE' && ttbr > 0 ? ttbr : 1),
  );

  steps.push({
    label: 'Exercise price per unit in INR',
    formula:
      grant.listingStatus === 'LISTED_FOREIGN_EXCHANGE'
        ? 'exercise_price_foreign x SBI_TTBR'
        : 'exercise_price (already INR)',
    inputs: {
      exercisePriceForeign: grant.exercisePriceInOriginalCurrency,
      originalCurrency: grant.originalCurrency,
      ttbr,
      exercisePriceInr,
    },
    output: exercisePriceInr,
    citations: [RULES.RULE_3_8_iii_c],
  });

  const perquisitePerUnit = Math.max(0, fmvPerUnitInr - exercisePriceInr);
  const totalPerquisite = Math.round(perquisitePerUnit * vest.unitsVested);

  steps.push({
    label: 'Perquisite under Section 17(2)(vi)',
    formula: '(FMV_per_unit_INR - exercise_price_per_unit_INR) x units_vested',
    inputs: {
      fmvPerUnitInr,
      exercisePriceInr,
      perquisitePerUnit,
      unitsVested: vest.unitsVested,
      totalPerquisite,
    },
    output: totalPerquisite,
    citations: [SECTIONS.SEC_17_2_vi],
  });

  return {
    value: totalPerquisite,
    steps,
    citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
