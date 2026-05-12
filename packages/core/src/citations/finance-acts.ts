/* Finance Act citations. Every slab / rate that changed in a given Finance Act is tagged here so consumers
 * can render "Changed by Finance Act 2024" tooltips next to the number. */

import type { FinanceActCitation } from '../types/citation.js';

export const fa = (year: number, section?: string, note?: string): FinanceActCitation => ({
  kind: 'finance-act',
  year,
  ...(section !== undefined ? { section } : {}),
  ...(note !== undefined ? { note } : {}),
});

export const FINANCE_ACTS = {
  FA_2024: fa(2024, undefined, 'Revised new-regime slabs; LTCG @ 12.5%; STCG 111A @ 20%'),
  FA_2025: fa(
    2025,
    undefined,
    'Revised new-regime slabs (Rs. 0 to 4L nil, etc.); 87A rebate to Rs. 12L',
  ),
  FA_2022: fa(2022, '115BBH', 'Introduced VDA charging section; 1% TDS u/s 194S'),
  FA_2023: fa(2023, '50AA', 'Specified MF / debt. Always slab rate post 01-Apr-2023'),
} as const;

export type FinanceActKey = keyof typeof FINANCE_ACTS;
