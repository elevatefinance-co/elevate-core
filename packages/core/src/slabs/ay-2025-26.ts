/* AY 2025-26 corresponds to Financial Year 2024-25. Slabs per Finance Act 2024. These are FROZEN.
 * Any amendment that would retrospectively change an AY2025-26 rate must add a new AY variant, never mutate
 * this file. */

import type { Citation } from '../types/citation.js';
import { SECTIONS } from '../citations/sections.js';
import { FINANCE_ACTS } from '../citations/finance-acts.js';

export type TaxSlab = {
  readonly lowerBound: number;
  readonly upperBound: number;
  readonly rate: number;
};

export const NEW_REGIME_SLABS_AY_2025_26: readonly TaxSlab[] = [
  { lowerBound: 0, upperBound: 300_000, rate: 0 },
  { lowerBound: 300_000, upperBound: 700_000, rate: 0.05 },
  { lowerBound: 700_000, upperBound: 1_000_000, rate: 0.1 },
  { lowerBound: 1_000_000, upperBound: 1_200_000, rate: 0.15 },
  { lowerBound: 1_200_000, upperBound: 1_500_000, rate: 0.2 },
  { lowerBound: 1_500_000, upperBound: Infinity, rate: 0.3 },
];

export const OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26: readonly TaxSlab[] = [
  { lowerBound: 0, upperBound: 250_000, rate: 0 },
  { lowerBound: 250_000, upperBound: 500_000, rate: 0.05 },
  { lowerBound: 500_000, upperBound: 1_000_000, rate: 0.2 },
  { lowerBound: 1_000_000, upperBound: Infinity, rate: 0.3 },
];

export const OLD_REGIME_SLABS_SENIOR_AY_2025_26: readonly TaxSlab[] = [
  { lowerBound: 0, upperBound: 300_000, rate: 0 },
  { lowerBound: 300_000, upperBound: 500_000, rate: 0.05 },
  { lowerBound: 500_000, upperBound: 1_000_000, rate: 0.2 },
  { lowerBound: 1_000_000, upperBound: Infinity, rate: 0.3 },
];

export const OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26: readonly TaxSlab[] = [
  { lowerBound: 0, upperBound: 500_000, rate: 0 },
  { lowerBound: 500_000, upperBound: 1_000_000, rate: 0.2 },
  { lowerBound: 1_000_000, upperBound: Infinity, rate: 0.3 },
];

export const STANDARD_DEDUCTION_SALARY_NEW_AY_2025_26 = 75_000;
export const STANDARD_DEDUCTION_SALARY_OLD_AY_2025_26 = 50_000;

export const AY_2025_26_CITATIONS: readonly Citation[] = [
  SECTIONS.SEC_115BAC,
  FINANCE_ACTS.FA_2024,
];
