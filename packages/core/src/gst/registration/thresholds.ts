/* GST registration thresholds. Aggregate turnover above the relevant threshold in the financial year
 * triggers mandatory registration under Section 22 of the CGST Act read with the principal notification
 * carving out special-category States.
 *
 * Historical threshold landscape:
 *   Goods supplier in regular State        Rs 40 lakh aggregate turnover
 *   Goods supplier in special-category     Rs 20 lakh aggregate turnover
 *   Service provider in regular State      Rs 20 lakh aggregate turnover
 *   Service provider in special-category   Rs 10 lakh aggregate turnover (some States)
 *
 * Special-category States carved out per Section 22(1) explanation read with notifications: Manipur,
 * Mizoram, Nagaland, Tripura, Sikkim, Arunachal Pradesh, Meghalaya, Assam, Uttarakhand (with historical
 * inclusion / exclusion of others). The platform's `SPECIAL_CATEGORY_STATE_CODES_LOWER_LIMIT` set captures
 * the states subject to the lower threshold; consumers checking eligibility pass the State code and the
 * supply mix.
 *
 * The thresholds are encoded in paise per the platform's BigInt-paise convention so floating-point
 * arithmetic never enters tax calculations. */

import type { Citation } from '../../types/citation.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';

export const REGULAR_GOODS_THRESHOLD_PAISE = 4_000_000_00n;
export const REGULAR_SERVICES_THRESHOLD_PAISE = 2_000_000_00n;
export const SPECIAL_CATEGORY_GOODS_THRESHOLD_PAISE = 2_000_000_00n;
export const SPECIAL_CATEGORY_SERVICES_THRESHOLD_PAISE = 1_000_000_00n;

export const SPECIAL_CATEGORY_STATE_CODES: ReadonlySet<string> = new Set([
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '05',
]);

export type SupplyMix = 'GOODS_ONLY' | 'SERVICES_ONLY' | 'MIXED';

export type RegistrationThresholdResult = {
  readonly thresholdPaise: bigint;
  readonly thresholdType: 'GOODS' | 'SERVICES' | 'MIXED';
  readonly category: 'REGULAR_STATE' | 'SPECIAL_CATEGORY_STATE';
  readonly citations: readonly Citation[];
};

export function isSpecialCategoryStateForRegistration(stateCode: string): boolean {
  return SPECIAL_CATEGORY_STATE_CODES.has(stateCode);
}

export function resolveRegistrationThreshold(input: {
  readonly stateCode: string;
  readonly supplyMix: SupplyMix;
}): RegistrationThresholdResult {
  const isSpecial = isSpecialCategoryStateForRegistration(input.stateCode);
  const category: RegistrationThresholdResult['category'] = isSpecial
    ? 'SPECIAL_CATEGORY_STATE'
    : 'REGULAR_STATE';

  const goodsThreshold = isSpecial
    ? SPECIAL_CATEGORY_GOODS_THRESHOLD_PAISE
    : REGULAR_GOODS_THRESHOLD_PAISE;
  const servicesThreshold = isSpecial
    ? SPECIAL_CATEGORY_SERVICES_THRESHOLD_PAISE
    : REGULAR_SERVICES_THRESHOLD_PAISE;

  const baseCitations: Citation[] = [CGST_ACT_SECTIONS.SEC_22];

  switch (input.supplyMix) {
    case 'GOODS_ONLY':
      return {
        thresholdPaise: goodsThreshold,
        thresholdType: 'GOODS',
        category,
        citations: baseCitations,
      };
    case 'SERVICES_ONLY':
      return {
        thresholdPaise: servicesThreshold,
        thresholdType: 'SERVICES',
        category,
        citations: baseCitations,
      };
    case 'MIXED':
      return {
        thresholdPaise: servicesThreshold,
        thresholdType: 'MIXED',
        category,
        citations: baseCitations,
      };
  }
}

export function isThresholdCrossed(input: {
  readonly stateCode: string;
  readonly supplyMix: SupplyMix;
  readonly aggregateTurnoverPaise: bigint;
}): {
  readonly crossed: boolean;
  readonly threshold: RegistrationThresholdResult;
} {
  const threshold = resolveRegistrationThreshold(input);
  return {
    crossed: input.aggregateTurnoverPaise > threshold.thresholdPaise,
    threshold,
  };
}
