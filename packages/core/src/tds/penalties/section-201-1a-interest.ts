/* Section 201(1A) interest computation. Two distinct interest regimes apply depending on whether the
 * deductor failed to deduct or merely failed to deposit timely:
 *
 *   1 percent per month from the date tax was deductible to the date it was actually deducted
 *   (Section 201(1A)(i))
 *
 *   1.5 percent per month from the date of actual deduction to the date of actual payment
 *   (Section 201(1A)(ii))
 *
 * 'Per month' means per part of a month -- any calendar month even partially crossed counts as a full month
 * for interest computation. The CBDT clarifications (referenced inline) cover the boundary cases. */

import type { Citation } from '../../types/citation.js';
import { ITA_SECTIONS } from '../citations/ita-sections.js';

const INTEREST_RATE_DEDUCTION_LAG_BP = 100;
const INTEREST_RATE_DEPOSIT_LAG_BP = 150;

export type Section201InterestInput = {
  readonly tdsAmountPaise: bigint;
  readonly dueDateOfDeduction: Date;
  readonly actualDateOfDeduction: Date | null;
  readonly actualDateOfDeposit: Date;
};

export type Section201InterestComputation = {
  readonly deductionLagInterestPaise: bigint;
  readonly depositLagInterestPaise: bigint;
  readonly totalInterestPaise: bigint;
  readonly deductionLagMonths: number;
  readonly depositLagMonths: number;
  readonly citations: readonly Citation[];
  readonly notes?: string;
};

function monthsCrossed(from: Date, to: Date): number {
  if (to.getTime() <= from.getTime()) return 0;
  const fromYear = from.getUTCFullYear();
  const fromMonth = from.getUTCMonth();
  const toYear = to.getUTCFullYear();
  const toMonth = to.getUTCMonth();
  const months = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
  return Math.max(0, months);
}

function applyInterestRate(amountPaise: bigint, rateBp: number, months: number): bigint {
  const safeMonths = Math.max(0, months);
  const numerator = amountPaise * BigInt(rateBp) * BigInt(safeMonths);
  return numerator / 10000n;
}

export function computeSection201Interest(
  input: Section201InterestInput,
): Section201InterestComputation {
  const dueDate = input.dueDateOfDeduction;
  const actualDeduction = input.actualDateOfDeduction ?? input.actualDateOfDeposit;
  const deposit = input.actualDateOfDeposit;

  const deductionLagMonths = monthsCrossed(dueDate, actualDeduction);
  const depositLagMonths = monthsCrossed(actualDeduction, deposit);

  const deductionLagInterestPaise = applyInterestRate(
    input.tdsAmountPaise,
    INTEREST_RATE_DEDUCTION_LAG_BP,
    deductionLagMonths,
  );
  const depositLagInterestPaise = applyInterestRate(
    input.tdsAmountPaise,
    INTEREST_RATE_DEPOSIT_LAG_BP,
    depositLagMonths,
  );

  return {
    deductionLagInterestPaise,
    depositLagInterestPaise,
    totalInterestPaise: deductionLagInterestPaise + depositLagInterestPaise,
    deductionLagMonths,
    depositLagMonths,
    citations: [ITA_SECTIONS.SEC_201, ITA_SECTIONS.SEC_201_1A],
    notes:
      deductionLagMonths > 0 && depositLagMonths > 0
        ? 'Both deduction-lag (1 percent / month) and deposit-lag (1.5 percent / month) interest applied'
        : deductionLagMonths > 0
          ? 'Deduction-lag interest applied at 1 percent per month'
          : depositLagMonths > 0
            ? 'Deposit-lag interest applied at 1.5 percent per month'
            : 'No interest -- deduction and deposit timely',
  };
}
