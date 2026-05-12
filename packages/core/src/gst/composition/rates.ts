/* Composition tax rates per the principal scheme notifications. Three categories with three rates:
 *
 *   Manufacturers and traders of goods                1 percent (CGST 0.5 + SGST 0.5)
 *   Restaurants (without alcohol service)             5 percent (CGST 2.5 + SGST 2.5)
 *   Other service providers (Section 10(2A) scheme)   6 percent (CGST 3.0 + SGST 3.0)
 *
 * Composition tax is paid on aggregate turnover (not just taxable supplies). ITC cannot be availed; outward
 * invoices say "composition taxable person, not eligible to collect tax on supplies" -- the supplier bears
 * the tax from margin.
 *
 * Rates encoded as basis points so floating-point never enters tax calculations: 1% = 100 bp; 5% = 500 bp;
 * 6% = 600 bp. The CGST half is computed from the total via the half-split. */

import type { Citation } from '../../types/citation.js';
import { CBIC_NOTIFICATIONS } from '../citations/cbic-notifications.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';

export type CompositionCategory =
  | 'MANUFACTURER_OR_TRADER'
  | 'RESTAURANT_WITHOUT_ALCOHOL'
  | 'OTHER_SERVICES_S10_2A';

export type CompositionRateBreakup = {
  readonly category: CompositionCategory;
  readonly totalRateBasisPoints: number;
  readonly cgstRateBasisPoints: number;
  readonly sgstRateBasisPoints: number;
  readonly citations: readonly Citation[];
};

const MANUFACTURER_OR_TRADER_RATE_BP = 100;
const RESTAURANT_RATE_BP = 500;
const OTHER_SERVICES_RATE_BP = 600;

export function getCompositionRate(category: CompositionCategory): CompositionRateBreakup {
  switch (category) {
    case 'MANUFACTURER_OR_TRADER':
      return {
        category,
        totalRateBasisPoints: MANUFACTURER_OR_TRADER_RATE_BP,
        cgstRateBasisPoints: MANUFACTURER_OR_TRADER_RATE_BP / 2,
        sgstRateBasisPoints: MANUFACTURER_OR_TRADER_RATE_BP / 2,
        citations: [CGST_ACT_SECTIONS.SEC_10, CBIC_NOTIFICATIONS.N_8_2017_CT_RATE],
      };
    case 'RESTAURANT_WITHOUT_ALCOHOL':
      return {
        category,
        totalRateBasisPoints: RESTAURANT_RATE_BP,
        cgstRateBasisPoints: RESTAURANT_RATE_BP / 2,
        sgstRateBasisPoints: RESTAURANT_RATE_BP / 2,
        citations: [CGST_ACT_SECTIONS.SEC_10, CBIC_NOTIFICATIONS.N_8_2017_CT_RATE],
      };
    case 'OTHER_SERVICES_S10_2A':
      return {
        category,
        totalRateBasisPoints: OTHER_SERVICES_RATE_BP,
        cgstRateBasisPoints: OTHER_SERVICES_RATE_BP / 2,
        sgstRateBasisPoints: OTHER_SERVICES_RATE_BP / 2,
        citations: [CGST_ACT_SECTIONS.SEC_10],
      };
  }
}

export function computeCompositionTaxPaise(input: {
  readonly aggregateTurnoverPaise: bigint;
  readonly category: CompositionCategory;
}): {
  readonly cgstPaise: bigint;
  readonly sgstPaise: bigint;
  readonly totalPaise: bigint;
  readonly rate: CompositionRateBreakup;
} {
  const rate = getCompositionRate(input.category);
  const cgstPaise = (input.aggregateTurnoverPaise * BigInt(rate.cgstRateBasisPoints)) / 10_000n;
  const sgstPaise = (input.aggregateTurnoverPaise * BigInt(rate.sgstRateBasisPoints)) / 10_000n;
  return {
    cgstPaise,
    sgstPaise,
    totalPaise: cgstPaise + sgstPaise,
    rate,
  };
}
