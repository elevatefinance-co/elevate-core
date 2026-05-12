/* AY-aware slab dispatch. Each Assessment Year is its own frozen module (`ay-2025-26.ts`, `ay-2026-27.ts`);
 * this barrel routes (regime, ageBand, ay) at runtime to the right table and emits the matching citation
 * set. New AYs land as a sibling file and a single dispatch entry; past AYs stay immutable forever so
 * historical filings remain reproducible. */

import type { AssessmentYear, Citation } from '../types/citation.js';
import {
  NEW_REGIME_SLABS_AY_2025_26,
  OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26,
  OLD_REGIME_SLABS_SENIOR_AY_2025_26,
  OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26,
  AY_2025_26_CITATIONS,
  type TaxSlab,
} from './ay-2025-26.js';
import {
  NEW_REGIME_SLABS_AY_2026_27,
  OLD_REGIME_SLABS_INDIVIDUAL_AY_2026_27,
  OLD_REGIME_SLABS_SENIOR_AY_2026_27,
  OLD_REGIME_SLABS_SUPER_SENIOR_AY_2026_27,
  AY_2026_27_CITATIONS,
} from './ay-2026-27.js';

export type Regime = 'NEW' | 'OLD';
export type AgeBand = 'INDIVIDUAL' | 'SENIOR' | 'SUPER_SENIOR';

export const SUPPORTED_ASSESSMENT_YEARS: readonly AssessmentYear[] = [
  'AY2025-26',
  'AY2026-27',
] as const;

export type SupportedAssessmentYear = (typeof SUPPORTED_ASSESSMENT_YEARS)[number];

export function isSupportedAssessmentYear(ay: string): ay is SupportedAssessmentYear {
  return (SUPPORTED_ASSESSMENT_YEARS as readonly string[]).includes(ay);
}

export type GetSlabsArgs = {
  regime: Regime;
  ay: SupportedAssessmentYear;
  ageBand?: AgeBand;
};

export type SlabsResult = {
  slabs: readonly TaxSlab[];
  citations: readonly Citation[];
};

export function getSlabs({ regime, ay, ageBand = 'INDIVIDUAL' }: GetSlabsArgs): SlabsResult {
  if (regime === 'NEW') {
    const slabs = ay === 'AY2025-26' ? NEW_REGIME_SLABS_AY_2025_26 : NEW_REGIME_SLABS_AY_2026_27;
    const citations = ay === 'AY2025-26' ? AY_2025_26_CITATIONS : AY_2026_27_CITATIONS;
    return { slabs, citations };
  }

  const individual =
    ay === 'AY2025-26'
      ? OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26
      : OLD_REGIME_SLABS_INDIVIDUAL_AY_2026_27;
  const senior =
    ay === 'AY2025-26' ? OLD_REGIME_SLABS_SENIOR_AY_2025_26 : OLD_REGIME_SLABS_SENIOR_AY_2026_27;
  const superSenior =
    ay === 'AY2025-26'
      ? OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26
      : OLD_REGIME_SLABS_SUPER_SENIOR_AY_2026_27;

  const slabs =
    ageBand === 'SUPER_SENIOR' ? superSenior : ageBand === 'SENIOR' ? senior : individual;

  return {
    slabs,
    citations: ay === 'AY2025-26' ? AY_2025_26_CITATIONS : AY_2026_27_CITATIONS,
  };
}

export type { TaxSlab } from './ay-2025-26.js';
export {
  NEW_REGIME_SLABS_AY_2025_26,
  OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26,
  OLD_REGIME_SLABS_SENIOR_AY_2025_26,
  OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26,
  STANDARD_DEDUCTION_SALARY_NEW_AY_2025_26,
  STANDARD_DEDUCTION_SALARY_OLD_AY_2025_26,
} from './ay-2025-26.js';
export {
  NEW_REGIME_SLABS_AY_2026_27,
  STANDARD_DEDUCTION_SALARY_NEW_AY_2026_27,
  STANDARD_DEDUCTION_SALARY_OLD_AY_2026_27,
} from './ay-2026-27.js';
