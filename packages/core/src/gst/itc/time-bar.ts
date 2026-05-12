/* Section 16(4) of the CGST Act -- ITC time-bar. ITC for an invoice or debit note pertaining to financial
 * year FY can be claimed only up to:
 *
 *   30 November of the financial year following FY, OR
 *   The date of filing the annual return for FY,
 *
 * whichever is earlier. Beyond that, the ITC lapses.
 *
 * The time-bar checker takes the invoice / debit-note FY plus the proposed claim date plus an optional
 * annual-return-filed-on date and returns whether the claim is within the window. */

import type { Citation } from '../../types/citation.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';

export type TimeBarCheckResult = {
  readonly withinWindow: boolean;
  readonly cutOffDate: Date;
  readonly cutOffReason: 'NOVEMBER_30_NEXT_FY' | 'ANNUAL_RETURN_FILED';
  readonly citations: readonly Citation[];
};

export function checkSection16TimeBar(input: {
  readonly fyStartYear: number;
  readonly proposedClaimDate: Date;
  readonly annualReturnFiledOn?: Date;
}): TimeBarCheckResult {
  const novemberCutOff = new Date(Date.UTC(input.fyStartYear + 1, 10, 30));

  let cutOffDate = novemberCutOff;
  let cutOffReason: TimeBarCheckResult['cutOffReason'] = 'NOVEMBER_30_NEXT_FY';

  if (
    input.annualReturnFiledOn !== undefined &&
    input.annualReturnFiledOn.getTime() < novemberCutOff.getTime()
  ) {
    cutOffDate = input.annualReturnFiledOn;
    cutOffReason = 'ANNUAL_RETURN_FILED';
  }

  return {
    withinWindow: input.proposedClaimDate.getTime() <= cutOffDate.getTime(),
    cutOffDate,
    cutOffReason,
    citations: [CGST_ACT_SECTIONS.SEC_16, CGST_ACT_SECTIONS.SEC_16_4],
  };
}
