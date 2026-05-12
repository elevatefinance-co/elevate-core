/* AY 2026-27 corresponds to Financial Year 2025-26. Slabs per Finance Act 2025. Revised new-regime bands
 * introduced in Union Budget 2025-26. Old regime slabs unchanged.
 *
 * Finance Act 2025 also revised Sec 87A: under the new regime, no tax up to Rs. 12,00,000 of total income
 * (max rebate Rs. 60,000). With the Rs. 75,000 salaried standard deduction, the effective zero-tax ceiling
 * for salaried filers is Rs. 12,75,000.
 *
 * AY-frozen. Do not mutate. */

import type { Citation } from '../types/citation.js';
import { SECTIONS } from '../citations/sections.js';
import { FINANCE_ACTS } from '../citations/finance-acts.js';
import type { TaxSlab } from './ay-2025-26.js';

export const NEW_REGIME_SLABS_AY_2026_27: readonly TaxSlab[] = [
  { lowerBound: 0, upperBound: 400_000, rate: 0 },
  { lowerBound: 400_000, upperBound: 800_000, rate: 0.05 },
  { lowerBound: 800_000, upperBound: 1_200_000, rate: 0.1 },
  { lowerBound: 1_200_000, upperBound: 1_600_000, rate: 0.15 },
  { lowerBound: 1_600_000, upperBound: 2_000_000, rate: 0.2 },
  { lowerBound: 2_000_000, upperBound: 2_400_000, rate: 0.25 },
  { lowerBound: 2_400_000, upperBound: Infinity, rate: 0.3 },
];

export {
  OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26 as OLD_REGIME_SLABS_INDIVIDUAL_AY_2026_27,
  OLD_REGIME_SLABS_SENIOR_AY_2025_26 as OLD_REGIME_SLABS_SENIOR_AY_2026_27,
  OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26 as OLD_REGIME_SLABS_SUPER_SENIOR_AY_2026_27,
} from './ay-2025-26.js';

export const STANDARD_DEDUCTION_SALARY_NEW_AY_2026_27 = 75_000;
export const STANDARD_DEDUCTION_SALARY_OLD_AY_2026_27 = 50_000;

export const AY_2026_27_CITATIONS: readonly Citation[] = [
  SECTIONS.SEC_115BAC,
  FINANCE_ACTS.FA_2025,
];
