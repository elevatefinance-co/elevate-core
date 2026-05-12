/* Section 10 of the CGST Act -- composition scheme eligibility. The composition levy is the simplified-tax
 * option for small taxpayers: pay a flat percentage of turnover (1 / 5 / 6 percent depending on category)
 * instead of standard CGST + SGST, in exchange for forfeiting Input Tax Credit and being restricted to
 * intra-State outward supplies.
 *
 * Eligibility checks per Section 10(1) and 10(2A):
 *   - Aggregate turnover in preceding FY <= Rs 1.5 crore (Rs 75 lakh in special-category States) for the
 *     goods / restaurant scheme
 *   - Aggregate turnover in preceding FY <= Rs 50 lakh for the services-composition scheme
 *     (Section 10(2A), Notification 02/2019-CT (Rate))
 *
 * Restrictions (any one disqualifies):
 *   - Engaged in supply of services other than restaurant (except under the Section 10(2A)
 *     services-composition scheme)
 *   - Inter-State outward supply
 *   - Supplies through e-commerce operator who collects TCS
 *   - Casual taxable person or non-resident
 *   - Manufacturer of certain notified goods (ice cream, pan masala, tobacco, aerated waters per
 *     Notification 14/2019-CT) */

import type { Citation } from '../../types/citation.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';

export const COMPOSITION_GOODS_TURNOVER_LIMIT_PAISE = 1_500_000_000n;
export const COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE = 750_000_000n;
export const COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE = 500_000_000n;

export const COMPOSITION_SPECIAL_CATEGORY_STATE_CODES: ReadonlySet<string> = new Set([
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '11',
]);

export type CompositionScheme = 'GOODS_OR_RESTAURANT' | 'SERVICES';

export type CompositionEligibilityResult =
  | {
      readonly eligible: true;
      readonly scheme: CompositionScheme;
      readonly turnoverLimitPaise: bigint;
      readonly citations: readonly Citation[];
    }
  | {
      readonly eligible: false;
      readonly reason: CompositionDisqualificationReason;
      readonly citations: readonly Citation[];
      readonly notes: string;
    };

export type CompositionDisqualificationReason =
  | 'TURNOVER_EXCEEDS_LIMIT'
  | 'INTER_STATE_OUTWARD_SUPPLY'
  | 'SUPPLIES_VIA_ECOMMERCE_OPERATOR_WITH_TCS'
  | 'CASUAL_OR_NON_RESIDENT'
  | 'MANUFACTURER_OF_RESTRICTED_GOODS'
  | 'OTHER_SERVICES_OUTSIDE_SCHEME';

export function checkCompositionEligibility(input: {
  readonly scheme: CompositionScheme;
  readonly stateCode: string;
  readonly aggregateTurnoverPreviousFyPaise: bigint;
  readonly hasInterStateOutwardSupply: boolean;
  readonly suppliesViaEcommerceOperatorWithTcs: boolean;
  readonly isCasualOrNonResident: boolean;
  readonly isManufacturerOfRestrictedGoods: boolean;
  readonly suppliesOtherServicesOutsideScheme?: boolean;
}): CompositionEligibilityResult {
  const baseCitations: Citation[] = [CGST_ACT_SECTIONS.SEC_10];

  if (input.hasInterStateOutwardSupply) {
    return {
      eligible: false,
      reason: 'INTER_STATE_OUTWARD_SUPPLY',
      citations: baseCitations,
      notes:
        'Composition scheme is restricted to intra-State outward supplies; any inter-State outward supply disqualifies.',
    };
  }
  if (input.suppliesViaEcommerceOperatorWithTcs) {
    return {
      eligible: false,
      reason: 'SUPPLIES_VIA_ECOMMERCE_OPERATOR_WITH_TCS',
      citations: baseCitations,
      notes:
        'Suppliers through e-commerce operators that collect TCS under Section 52 are disqualified from composition.',
    };
  }
  if (input.isCasualOrNonResident) {
    return {
      eligible: false,
      reason: 'CASUAL_OR_NON_RESIDENT',
      citations: baseCitations,
      notes:
        'Casual taxable persons and non-resident taxable persons cannot opt for the composition scheme.',
    };
  }
  if (input.isManufacturerOfRestrictedGoods) {
    return {
      eligible: false,
      reason: 'MANUFACTURER_OF_RESTRICTED_GOODS',
      citations: baseCitations,
      notes:
        'Manufacturers of ice cream, pan masala, tobacco, aerated waters per Notification 14/2019-CT are disqualified.',
    };
  }
  if (input.suppliesOtherServicesOutsideScheme === true && input.scheme !== 'SERVICES') {
    return {
      eligible: false,
      reason: 'OTHER_SERVICES_OUTSIDE_SCHEME',
      citations: baseCitations,
      notes:
        'A taxpayer supplying services other than restaurant must opt for the Section 10(2A) services-composition scheme to remain eligible.',
    };
  }

  const isSpecial = COMPOSITION_SPECIAL_CATEGORY_STATE_CODES.has(input.stateCode);
  let turnoverLimit: bigint;
  if (input.scheme === 'GOODS_OR_RESTAURANT') {
    turnoverLimit = isSpecial
      ? COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE
      : COMPOSITION_GOODS_TURNOVER_LIMIT_PAISE;
  } else {
    turnoverLimit = COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE;
  }

  if (input.aggregateTurnoverPreviousFyPaise > turnoverLimit) {
    return {
      eligible: false,
      reason: 'TURNOVER_EXCEEDS_LIMIT',
      citations: baseCitations,
      notes: `Aggregate turnover in preceding FY exceeds the ${input.scheme} threshold for ${
        isSpecial ? 'special-category' : 'regular'
      } States.`,
    };
  }

  return {
    eligible: true,
    scheme: input.scheme,
    turnoverLimitPaise: turnoverLimit,
    citations: baseCitations,
  };
}
