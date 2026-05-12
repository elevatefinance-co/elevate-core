/* Section 234E late fee for delayed quarterly TDS return filing. Rs 200 per day of delay, capped at the TDS
 * amount in the return. The rule is hard -- no waiver discretion under Section 234E itself; the deductor's
 * only relief is application under Section 273A or condonation under Section 119 by the CBDT.
 *
 * 'Per day' is calendar days inclusive; the day of due date is day zero and each subsequent calendar day
 * adds Rs 200. The cap applies on the running aggregate -- once the late fee equals the TDS amount in the
 * return, additional delay does not increase it further. */

import type { Citation } from '../../types/citation.js';
import { ITA_SECTIONS } from '../citations/ita-sections.js';

const LATE_FEE_PER_DAY_PAISE = 200n * 100n;

export type Section234ELateFeeInput = {
  readonly dueDate: Date;
  readonly actualFilingDate: Date | null;
  readonly tdsAmountInReturnPaise: bigint;
  readonly asOfDate?: Date;
};

export type Section234ELateFeeComputation = {
  readonly daysLate: number;
  readonly uncappedLateFeePaise: bigint;
  readonly cappedLateFeePaise: bigint;
  readonly capWasApplied: boolean;
  readonly citations: readonly Citation[];
  readonly notes?: string;
};

function daysBetween(from: Date, to: Date): number {
  const millisPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / millisPerDay));
}

export function computeSection234ELateFee(
  input: Section234ELateFeeInput,
): Section234ELateFeeComputation {
  const computeAsOf = input.actualFilingDate ?? input.asOfDate ?? new Date();
  const daysLate = daysBetween(input.dueDate, computeAsOf);
  const uncappedLateFeePaise = BigInt(daysLate) * LATE_FEE_PER_DAY_PAISE;
  const cap = input.tdsAmountInReturnPaise;
  const capWasApplied = uncappedLateFeePaise > cap;
  const cappedLateFeePaise = capWasApplied ? cap : uncappedLateFeePaise;

  return {
    daysLate,
    uncappedLateFeePaise,
    cappedLateFeePaise,
    capWasApplied,
    citations: [ITA_SECTIONS.SEC_234E],
    notes:
      daysLate === 0
        ? 'Filed by due date -- no late fee'
        : capWasApplied
          ? 'Late fee capped at TDS amount in return'
          : 'Late fee Rs 200 per day, uncapped (below TDS amount)',
  };
}
