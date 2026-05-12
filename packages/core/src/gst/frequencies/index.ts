/* GST filing frequency dispatcher and due-date computers.
 *
 * Three filing cadences:
 *
 *   MONTHLY                Aggregate turnover above Rs 5 crore in the
 *                          preceding financial year. GSTR-1 due 11th of
 *                          the next month; GSTR-3B due 20th. Per
 *                          Notification 6/2017-CT and successors.
 *
 *   QUARTERLY_QRMP         Aggregate turnover up to Rs 5 crore, opted in
 *                          via Form CMP-02 or directly. GSTR-1 due 13th
 *                          of the month after quarter end; IFF (B2B
 *                          subset) for months 1 and 2 of quarter due
 *                          13th; PMT-06 monthly tax payment due 25th of
 *                          months 1 and 2; GSTR-3B due 22nd or 24th of
 *                          the month after quarter end depending on
 *                          State Group I / II per Notification
 *                          76/2020-CT.
 *
 *   COMPOSITION_QUARTERLY  Composition-scheme taxpayers under Section
 *                          10. CMP-08 quarterly statement due 18th of
 *                          the month after quarter end; GSTR-4 annual
 *                          return due 30 April of the year following
 *                          the financial year.
 *
 * The Rs 5 crore threshold for MONTHLY vs QRMP applies in the preceding FY -- a taxpayer crossing
 * Rs 5 crore mid-year does not switch immediately; the change applies from the next FY.
 *
 * State Group I (22nd) and Group II (24th) for QRMP GSTR-3B are encoded per the principal
 * Notification 76/2020-CT.
 *
 * State Group I codes (22nd-of-month due date): 24 Gujarat,
 * 25 Daman and Diu, 26 Dadra and Nagar Haveli, 27 Maharashtra,
 * 28 Andhra Pradesh (pre-division), 29 Karnataka, 30 Goa,
 * 31 Lakshadweep, 32 Kerala, 33 Tamil Nadu, 34 Puducherry,
 * 35 Andaman and Nicobar Islands, 36 Telangana,
 * 37 Andhra Pradesh (post-division), 38 Ladakh,
 * 97 Centre Jurisdiction. All other States fall in Group II
 * (24th-of-month). */

import type { Citation } from '../../types/citation.js';
import { CBIC_NOTIFICATIONS } from '../citations/cbic-notifications.js';
import { CGST_RULES } from '../citations/cgst-rules.js';

export const MONTHLY_FILING_TURNOVER_THRESHOLD_PAISE = 5_000_000_000n;

export type GstFilingFrequency = 'MONTHLY' | 'QUARTERLY_QRMP' | 'COMPOSITION_QUARTERLY';

export const QRMP_GSTR3B_GROUP_I_STATE_CODES: ReadonlySet<string> = new Set([
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '97',
]);

export function resolveQrmpGstr3bDueDay(stateCode: string): 22 | 24 {
  return QRMP_GSTR3B_GROUP_I_STATE_CODES.has(stateCode) ? 22 : 24;
}

export function resolveFilingFrequency(input: {
  readonly aggregateTurnoverPreviousFyPaise: bigint;
  readonly hasOptedIntoQrmp: boolean;
  readonly hasOptedIntoComposition: boolean;
}): {
  readonly frequency: GstFilingFrequency;
  readonly citations: readonly Citation[];
} {
  if (input.hasOptedIntoComposition) {
    return {
      frequency: 'COMPOSITION_QUARTERLY',
      citations: [CGST_RULES.RULE_62],
    };
  }
  if (
    input.aggregateTurnoverPreviousFyPaise <= MONTHLY_FILING_TURNOVER_THRESHOLD_PAISE &&
    input.hasOptedIntoQrmp
  ) {
    return {
      frequency: 'QUARTERLY_QRMP',
      citations: [
        CBIC_NOTIFICATIONS.N_75_2020_CT,
        CBIC_NOTIFICATIONS.N_76_2020_CT,
        CGST_RULES.RULE_61,
      ],
    };
  }
  return {
    frequency: 'MONTHLY',
    citations: [CBIC_NOTIFICATIONS.N_6_2017_CT, CGST_RULES.RULE_61],
  };
}

export function gstr1MonthlyDueDate(periodMonth: number, periodYear: number): Date {
  return computeDueDate(periodMonth, periodYear, 1, 11);
}

export function gstr3bMonthlyDueDate(periodMonth: number, periodYear: number): Date {
  return computeDueDate(periodMonth, periodYear, 1, 20);
}

export function gstr1QuarterlyDueDate(periodQuarter: 1 | 2 | 3 | 4, fyStartYear: number): Date {
  const quarterEndMonth = quarterEndCalendarMonth(periodQuarter);
  return computeDueDateFromZeroIndexedMonth(
    quarterEndMonth,
    quarterStartYearOffset(periodQuarter, fyStartYear),
    1,
    13,
  );
}

export function gstr3bQuarterlyDueDate(input: {
  readonly periodQuarter: 1 | 2 | 3 | 4;
  readonly fyStartYear: number;
  readonly stateCode: string;
}): Date {
  const dueDay = resolveQrmpGstr3bDueDay(input.stateCode);
  const quarterEndMonth = quarterEndCalendarMonth(input.periodQuarter);
  return computeDueDateFromZeroIndexedMonth(
    quarterEndMonth,
    quarterStartYearOffset(input.periodQuarter, input.fyStartYear),
    1,
    dueDay,
  );
}

export function iffDueDate(periodMonth: number, periodYear: number): Date {
  return computeDueDate(periodMonth, periodYear, 1, 13);
}

export function pmt06DueDate(periodMonth: number, periodYear: number): Date {
  return computeDueDate(periodMonth, periodYear, 1, 25);
}

export function cmp08DueDate(periodQuarter: 1 | 2 | 3 | 4, fyStartYear: number): Date {
  const quarterEndMonth = quarterEndCalendarMonth(periodQuarter);
  return computeDueDateFromZeroIndexedMonth(
    quarterEndMonth,
    quarterStartYearOffset(periodQuarter, fyStartYear),
    1,
    18,
  );
}

export function gstr4DueDate(fyStartYear: number): Date {
  return new Date(Date.UTC(fyStartYear + 1, 3, 30));
}

function computeDueDate(
  periodMonth: number,
  periodYear: number,
  monthOffset: number,
  dueDay: number,
): Date {
  const dueMonthZeroIndexed = periodMonth - 1 + monthOffset;
  const yearAddend = Math.floor(dueMonthZeroIndexed / 12);
  const monthInYear = ((dueMonthZeroIndexed % 12) + 12) % 12;
  return new Date(Date.UTC(periodYear + yearAddend, monthInYear, dueDay));
}

function computeDueDateFromZeroIndexedMonth(
  zeroIndexedMonth: number,
  year: number,
  monthOffset: number,
  dueDay: number,
): Date {
  const targetMonth = zeroIndexedMonth + monthOffset;
  const yearAddend = Math.floor(targetMonth / 12);
  const monthInYear = ((targetMonth % 12) + 12) % 12;
  return new Date(Date.UTC(year + yearAddend, monthInYear, dueDay));
}

function quarterEndCalendarMonth(quarter: 1 | 2 | 3 | 4): number {
  switch (quarter) {
    case 1:
      return 5;
    case 2:
      return 8;
    case 3:
      return 11;
    case 4:
      return 2;
  }
}

function quarterStartYearOffset(quarter: 1 | 2 | 3 | 4, fyStartYear: number): number {
  return quarter === 4 ? fyStartYear + 1 : fyStartYear;
}
