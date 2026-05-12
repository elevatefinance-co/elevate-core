/* Tests for the Section 10 composition-scheme eligibility checker.
 * Two schemes (GOODS_OR_RESTAURANT under 10(1), SERVICES under 10(2A)). Three turnover limits:
 * regular goods Rs. 1.5 cr, special-category goods Rs. 75 lakh, services Rs. 50 lakh.
 * Five disqualification paths: inter-State outward, TCS-collecting ECO, casual / NRTP,
 * manufacturer of restricted goods, services-other-than-restaurant outside the SERVICES scheme. Pinned:
 * every disqualification reason, special-State lower limit, regular-State higher limit,
 * services-only path, turnover boundary at the upper limit. Citations:
 * CGST Act 2017 Section 10 (composition levy), CBIC Notification 14/2019-CT (manufacturer carve-out).
 */

import {
  COMPOSITION_GOODS_TURNOVER_LIMIT_PAISE,
  COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE,
  COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE,
  checkCompositionEligibility,
} from '../../../src/gst/composition/eligibility.js';

describe('composition turnover-limit constants', () => {
  it('should pin the regular-State goods limit at Rs. 1.5 crore', () => {
    expect(COMPOSITION_GOODS_TURNOVER_LIMIT_PAISE).toBe(1_500_000_000n);
  });

  it('should pin the special-State goods limit at Rs. 75 lakh', () => {
    expect(COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE).toBe(750_000_000n);
  });

  it('should pin the services scheme limit at Rs. 50 lakh', () => {
    expect(COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE).toBe(500_000_000n);
  });
});

describe('checkCompositionEligibility -- positive paths', () => {
  it('should return eligible for goods scheme in a regular State within Rs. 1.5 cr', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 1_000_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(true);
    if (result.eligible) {
      expect(result.scheme).toBe('GOODS_OR_RESTAURANT');
      expect(result.turnoverLimitPaise).toBe(COMPOSITION_GOODS_TURNOVER_LIMIT_PAISE);
    }
  });

  it('should apply the lower Rs. 75 lakh limit for a special-category State', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '14',
      aggregateTurnoverPreviousFyPaise: 700_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(true);
    if (result.eligible) {
      expect(result.turnoverLimitPaise).toBe(COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE);
    }
  });

  it('should return eligible for the services scheme within Rs. 50 lakh', () => {
    const result = checkCompositionEligibility({
      scheme: 'SERVICES',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 400_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(true);
    if (result.eligible) {
      expect(result.turnoverLimitPaise).toBe(COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE);
    }
  });

  it('should return eligible at exactly the regular-State turnover limit (boundary inclusive)', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: COMPOSITION_GOODS_TURNOVER_LIMIT_PAISE,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(true);
  });
});

describe('checkCompositionEligibility -- disqualification paths', () => {
  it('should disqualify on inter-State outward supply (Section 10 restriction)', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasInterStateOutwardSupply: true,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toBe('INTER_STATE_OUTWARD_SUPPLY');
  });

  it('should disqualify on supplies via TCS-collecting e-commerce operator', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: true,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toBe('SUPPLIES_VIA_ECOMMERCE_OPERATOR_WITH_TCS');
  });

  it('should disqualify on casual / non-resident taxable person', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: true,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toBe('CASUAL_OR_NON_RESIDENT');
  });

  it('should disqualify a manufacturer of restricted goods (Notification 14/2019-CT)', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: true,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toBe('MANUFACTURER_OF_RESTRICTED_GOODS');
  });

  it('should disqualify a turnover one paise above the regular-State limit', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: COMPOSITION_GOODS_TURNOVER_LIMIT_PAISE + 1n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toBe('TURNOVER_EXCEEDS_LIMIT');
  });

  it('should disqualify other-services-outside-scheme when not on the SERVICES path', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
      suppliesOtherServicesOutsideScheme: true,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toBe('OTHER_SERVICES_OUTSIDE_SCHEME');
  });

  it('should cite Section 10 on every result', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasInterStateOutwardSupply: true,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    const hasSec10 = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '10',
    );
    expect(hasSec10).toBe(true);
  });
});
