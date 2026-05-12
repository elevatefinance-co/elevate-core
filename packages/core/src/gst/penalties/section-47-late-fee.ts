/* Section 47 of the CGST Act -- late fee for delayed return filing. Per the principal late-fee schedule and
 * Notification 7/2023-CT and successor notifications, the per-day late fee varies by return type and
 * turnover band, with caps that truncate the penalty for small taxpayers.
 *
 * Encoded bands (per Notification 7/2023-CT):
 *
 *   GSTR-1 / GSTR-3B for nil returns (zero outward / inward)
 *     Rs 20 per day (Rs 10 CGST + Rs 10 SGST), capped at Rs 500
 *
 *   GSTR-1 / GSTR-3B for non-nil returns by taxpayers with
 *   aggregate turnover up to Rs 1.5 crore
 *     Rs 50 per day (Rs 25 CGST + Rs 25 SGST), capped at Rs 2000
 *
 *   GSTR-1 / GSTR-3B for non-nil returns by taxpayers with
 *   aggregate turnover Rs 1.5 crore -- Rs 5 crore
 *     Rs 50 per day (Rs 25 CGST + Rs 25 SGST), capped at Rs 5000
 *
 *   GSTR-1 / GSTR-3B for non-nil returns by taxpayers above
 *   Rs 5 crore turnover
 *     Rs 100 per day (Rs 50 CGST + Rs 50 SGST), capped at Rs 10000
 *
 * The platform stores all amounts in paise; the per-day rates and caps are encoded per the notification. */

import type { Citation } from '../../types/citation.js';
import { CBIC_NOTIFICATIONS } from '../citations/cbic-notifications.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';

export type LateFeeBand =
  | 'NIL_RETURN'
  | 'TURNOVER_UP_TO_1_5_CR'
  | 'TURNOVER_1_5_TO_5_CR'
  | 'TURNOVER_ABOVE_5_CR';

const LATE_FEE_PER_DAY_PAISE: Readonly<Record<LateFeeBand, bigint>> = {
  NIL_RETURN: 2_000n,
  TURNOVER_UP_TO_1_5_CR: 5_000n,
  TURNOVER_1_5_TO_5_CR: 5_000n,
  TURNOVER_ABOVE_5_CR: 10_000n,
};

const LATE_FEE_CAP_PAISE: Readonly<Record<LateFeeBand, bigint>> = {
  NIL_RETURN: 50_000n,
  TURNOVER_UP_TO_1_5_CR: 200_000n,
  TURNOVER_1_5_TO_5_CR: 500_000n,
  TURNOVER_ABOVE_5_CR: 1_000_000n,
};

export function resolveLateFeeBand(input: {
  readonly isNilReturn: boolean;
  readonly aggregateTurnoverPreviousFyPaise: bigint;
}): LateFeeBand {
  if (input.isNilReturn) return 'NIL_RETURN';
  /* Rs 1.5 crore in paise = 1,500,000 * 100 = 150_000_000 -- written as 1.5 cr literal */
  const ONE_AND_HALF_CRORE_PAISE = 1_500_000_00n;
  const FIVE_CRORE_PAISE = 5_000_000_00n;
  if (input.aggregateTurnoverPreviousFyPaise <= ONE_AND_HALF_CRORE_PAISE) {
    return 'TURNOVER_UP_TO_1_5_CR';
  }
  if (input.aggregateTurnoverPreviousFyPaise <= FIVE_CRORE_PAISE) {
    return 'TURNOVER_1_5_TO_5_CR';
  }
  return 'TURNOVER_ABOVE_5_CR';
}

export type Section47LateFeeResult = {
  readonly band: LateFeeBand;
  readonly perDayPaise: bigint;
  readonly capPaise: bigint;
  readonly delayDays: number;
  readonly uncappedFeePaise: bigint;
  readonly cappedFeePaise: bigint;
  readonly capWasApplied: boolean;
  readonly citations: readonly Citation[];
};

export function computeSection47LateFee(input: {
  readonly band: LateFeeBand;
  readonly delayDays: number;
}): Section47LateFeeResult {
  if (input.delayDays < 0) {
    throw new Error('delayDays must be non-negative');
  }
  const perDayPaise = LATE_FEE_PER_DAY_PAISE[input.band];
  const capPaise = LATE_FEE_CAP_PAISE[input.band];
  const uncappedFeePaise = perDayPaise * BigInt(input.delayDays);
  const capWasApplied = uncappedFeePaise > capPaise;
  const cappedFeePaise = capWasApplied ? capPaise : uncappedFeePaise;
  return {
    band: input.band,
    perDayPaise,
    capPaise,
    delayDays: input.delayDays,
    uncappedFeePaise,
    cappedFeePaise,
    capWasApplied,
    citations: [CGST_ACT_SECTIONS.SEC_47, CBIC_NOTIFICATIONS.N_7_2023_CT],
  };
}
