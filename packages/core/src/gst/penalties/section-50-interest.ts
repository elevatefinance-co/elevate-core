/* Section 50 of the CGST Act -- interest on delayed payment of tax. One operative rate, two bases:
 *
 *   Section 50(1) -- 18 percent per annum simple, on net cash tax liability for delayed payment where the
 *                    return is filed late (Rule 88B(1))
 *   Section 50(3) -- 18 percent per annum simple, on ITC wrongly availed AND utilised (Rule 88B(3)); the
 *                    24 percent figure in the statute is a ceiling that was never the notified operative
 *                    rate -- Notification 9/2022-CT applies the 18 percent rate retrospectively from
 *                    1 July 2017
 *
 * Rule 88B (inserted by Notification 14/2022-CT effective 1 July 2022) clarifies that interest under Section
 * 50(1) applies on net cash basis. The pre-Rule-88B interpretation was contested across multiple High
 * Courts; the Rule clarifies the operative computation.
 *
 * Interest computation (simple, prorated per day of delay per Rule 88B):
 *   interest = principal * rate * days / 365
 *
 * Day counting is calendar-day inclusive of both ends per standard CBIC interpretation. The platform's
 * BigInt-paise convention applies; integer arithmetic only. */

import type { Citation } from '../../types/citation.js';
import { CBIC_NOTIFICATIONS } from '../citations/cbic-notifications.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';
import { CGST_RULES } from '../citations/cgst-rules.js';

export const SECTION_50_1_RATE_BASIS_POINTS = 1800;
export const SECTION_50_3_RATE_BASIS_POINTS = 1800;

export type Section50InterestKind =
  | 'DELAYED_CASH_PAYMENT_S50_1'
  | 'WRONGLY_AVAILED_AND_UTILISED_ITC_S50_3';

export type Section50InterestResult = {
  readonly kind: Section50InterestKind;
  readonly principalPaise: bigint;
  readonly delayDays: number;
  readonly rateBasisPoints: number;
  readonly interestPaise: bigint;
  readonly citations: readonly Citation[];
  readonly notes: string;
};

export function computeSection50Interest(input: {
  readonly kind: Section50InterestKind;
  readonly principalPaise: bigint;
  readonly delayDays: number;
}): Section50InterestResult {
  if (input.delayDays < 0) {
    throw new Error('delayDays must be non-negative');
  }
  if (input.principalPaise < 0n) {
    throw new Error('principalPaise must be non-negative');
  }

  const rateBasisPoints =
    input.kind === 'DELAYED_CASH_PAYMENT_S50_1'
      ? SECTION_50_1_RATE_BASIS_POINTS
      : SECTION_50_3_RATE_BASIS_POINTS;

  const interestPaise =
    (input.principalPaise * BigInt(rateBasisPoints) * BigInt(input.delayDays)) / (10_000n * 365n);

  const citations: Citation[] =
    input.kind === 'DELAYED_CASH_PAYMENT_S50_1'
      ? [
          CGST_ACT_SECTIONS.SEC_50,
          CGST_ACT_SECTIONS.SEC_50_1,
          CGST_RULES.RULE_88B,
          CGST_RULES.RULE_88B_1,
          CBIC_NOTIFICATIONS.N_14_2022_CT,
        ]
      : [
          CGST_ACT_SECTIONS.SEC_50,
          CGST_ACT_SECTIONS.SEC_50_3,
          CGST_RULES.RULE_88B_3,
          CBIC_NOTIFICATIONS.N_9_2022_CT,
        ];

  const notes =
    input.kind === 'DELAYED_CASH_PAYMENT_S50_1'
      ? '18 percent per annum on net cash tax liability for delayed payment per Section 50(1) read with Rule 88B (effective 1 July 2022).'
      : '18 percent per annum simple interest on ITC wrongly availed and utilised per Section 50(3) read with Rule 88B(3) -- notified rate per Notification 9/2022-CT, retrospective from 1 July 2017; the 24 percent statutory ceiling was never the notified rate.';

  return {
    kind: input.kind,
    principalPaise: input.principalPaise,
    delayDays: input.delayDays,
    rateBasisPoints,
    interestPaise,
    citations,
    notes,
  };
}
