/* Tests for the composition scheme eligibility checker and rate computer.
 * Section 10 eligibility plus 1 / 5 / 6 percent rate breakups.
 */

import {
  COMPOSITION_GOODS_TURNOVER_LIMIT_PAISE,
  COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE,
  COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE,
  checkCompositionEligibility,
  computeCompositionTaxPaise,
  getCompositionRate,
} from '../../src/gst/composition/index.js';

describe('composition turnover-limit constants', () => {
  it('regular goods scheme limit is Rs 1.5 crore', () => {
    expect(COMPOSITION_GOODS_TURNOVER_LIMIT_PAISE).toBe(1_500_000_000n);
  });

  it('special-category goods scheme limit is Rs 75 lakh', () => {
    expect(COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE).toBe(750_000_000n);
  });

  it('services scheme limit is Rs 50 lakh', () => {
    expect(COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE).toBe(500_000_000n);
  });
});

describe('checkCompositionEligibility -- positive paths', () => {
  it('eligible -- goods scheme in regular State, turnover within limit', () => {
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

  it('eligible -- goods scheme in special-category State applies the lower Rs 75 lakh limit', () => {
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
    if (result.eligible)
      expect(result.turnoverLimitPaise).toBe(COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE);
  });

  it('eligible -- services scheme', () => {
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
    if (result.eligible)
      expect(result.turnoverLimitPaise).toBe(COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE);
  });
});

describe('checkCompositionEligibility -- disqualification paths', () => {
  it('disqualified -- inter-State outward supply', () => {
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

  it('disqualified -- supplies via TCS-collecting e-commerce operator', () => {
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

  it('disqualified -- casual or non-resident', () => {
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

  it('disqualified -- manufacturer of restricted goods', () => {
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

  it('disqualified -- turnover exceeds limit', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 1_500_000_001n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toBe('TURNOVER_EXCEEDS_LIMIT');
  });

  it('disqualified -- supplying other services outside the scheme without selecting SERVICES', () => {
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
});

describe('getCompositionRate', () => {
  it('manufacturer / trader -- 1 percent split equally between CGST and SGST', () => {
    const rate = getCompositionRate('MANUFACTURER_OR_TRADER');
    expect(rate.totalRateBasisPoints).toBe(100);
    expect(rate.cgstRateBasisPoints).toBe(50);
    expect(rate.sgstRateBasisPoints).toBe(50);
  });

  it('restaurant -- 5 percent split equally', () => {
    const rate = getCompositionRate('RESTAURANT_WITHOUT_ALCOHOL');
    expect(rate.totalRateBasisPoints).toBe(500);
    expect(rate.cgstRateBasisPoints).toBe(250);
    expect(rate.sgstRateBasisPoints).toBe(250);
  });

  it('other services -- 6 percent split equally', () => {
    const rate = getCompositionRate('OTHER_SERVICES_S10_2A');
    expect(rate.totalRateBasisPoints).toBe(600);
    expect(rate.cgstRateBasisPoints).toBe(300);
    expect(rate.sgstRateBasisPoints).toBe(300);
  });
});

describe('checkCompositionEligibility -- exact disqualification notes', () => {
  it('INTER_STATE_OUTWARD_SUPPLY note quotes the intra-State restriction', () => {
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
    if (!result.eligible) {
      expect(result.notes).toBe(
        'Composition scheme is restricted to intra-State outward supplies; any inter-State outward supply disqualifies.',
      );
    }
  });

  it('SUPPLIES_VIA_ECOMMERCE_OPERATOR_WITH_TCS note quotes Section 52', () => {
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
    if (!result.eligible) {
      expect(result.notes).toBe(
        'Suppliers through e-commerce operators that collect TCS under Section 52 are disqualified from composition.',
      );
    }
  });

  it('CASUAL_OR_NON_RESIDENT note', () => {
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
    if (!result.eligible) {
      expect(result.notes).toBe(
        'Casual taxable persons and non-resident taxable persons cannot opt for the composition scheme.',
      );
    }
  });

  it('MANUFACTURER_OF_RESTRICTED_GOODS note quotes ice cream, pan masala, tobacco, aerated waters', () => {
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
    if (!result.eligible) {
      expect(result.notes).toBe(
        'Manufacturers of ice cream, pan masala, tobacco, aerated waters per Notification 14/2019-CT are disqualified.',
      );
    }
  });

  it('OTHER_SERVICES_OUTSIDE_SCHEME note quotes Section 10(2A) services-composition scheme', () => {
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
    if (!result.eligible) {
      expect(result.notes).toBe(
        'A taxpayer supplying services other than restaurant must opt for the Section 10(2A) services-composition scheme to remain eligible.',
      );
    }
  });

  it('TURNOVER_EXCEEDS_LIMIT note quotes the scheme name and the regular-States label for Maharashtra', () => {
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
    if (!result.eligible) {
      expect(result.notes).toBe(
        'Aggregate turnover in preceding FY exceeds the GOODS_OR_RESTAURANT threshold for regular States.',
      );
    }
  });

  it('TURNOVER_EXCEEDS_LIMIT note quotes the special-category label for Manipur', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '14',
      aggregateTurnoverPreviousFyPaise: COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE + 1n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.notes).toBe(
        'Aggregate turnover in preceding FY exceeds the GOODS_OR_RESTAURANT threshold for special-category States.',
      );
    }
  });

  it('TURNOVER_EXCEEDS_LIMIT note for SERVICES scheme references the SERVICES threshold', () => {
    const result = checkCompositionEligibility({
      scheme: 'SERVICES',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE + 1n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.notes).toBe(
        'Aggregate turnover in preceding FY exceeds the SERVICES threshold for regular States.',
      );
    }
  });
});

describe('checkCompositionEligibility -- OTHER_SERVICES_OUTSIDE_SCHEME branch boundaries', () => {
  it('SERVICES scheme with suppliesOtherServicesOutsideScheme=true is still eligible (scheme satisfies the carve-out)', () => {
    const result = checkCompositionEligibility({
      scheme: 'SERVICES',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
      suppliesOtherServicesOutsideScheme: true,
    });
    expect(result.eligible).toBe(true);
  });

  it('GOODS_OR_RESTAURANT scheme with suppliesOtherServicesOutsideScheme=false is eligible (no other services flag)', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
      suppliesOtherServicesOutsideScheme: false,
    });
    expect(result.eligible).toBe(true);
  });

  it('GOODS_OR_RESTAURANT scheme with suppliesOtherServicesOutsideScheme omitted is eligible', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(true);
  });
});

describe('checkCompositionEligibility -- turnover boundary semantics', () => {
  it('eligible at exactly Rs 1.5 crore in regular State (strict-greater-than crossing)', () => {
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

  it('disqualified at Rs 1.5 crore + 1 paisa in regular State', () => {
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

  it('eligible at exactly Rs 75 lakh in special-category State', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '14',
      aggregateTurnoverPreviousFyPaise: COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(true);
  });

  it('disqualified at Rs 75 lakh + 1 paisa in special-category State', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '14',
      aggregateTurnoverPreviousFyPaise: COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE + 1n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(false);
  });

  it('eligible at exactly Rs 50 lakh under SERVICES scheme', () => {
    const result = checkCompositionEligibility({
      scheme: 'SERVICES',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(true);
  });

  it('disqualified at Rs 50 lakh + 1 paisa under SERVICES scheme', () => {
    const result = checkCompositionEligibility({
      scheme: 'SERVICES',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: COMPOSITION_SERVICES_TURNOVER_LIMIT_PAISE + 1n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(false);
  });
});

describe('COMPOSITION_SPECIAL_CATEGORY_STATE_CODES -- per-state lookup-table membership', () => {
  it('all eight special-category codes resolve to the lower Rs 75 lakh limit under GOODS_OR_RESTAURANT', () => {
    const codes: readonly { readonly code: string; readonly name: string }[] = [
      { code: '11', name: 'Sikkim' },
      { code: '12', name: 'Arunachal Pradesh' },
      { code: '13', name: 'Nagaland' },
      { code: '14', name: 'Manipur' },
      { code: '15', name: 'Mizoram' },
      { code: '16', name: 'Tripura' },
      { code: '17', name: 'Meghalaya' },
      { code: '18', name: 'Assam' },
    ];
    for (const entry of codes) {
      const result = checkCompositionEligibility({
        scheme: 'GOODS_OR_RESTAURANT',
        stateCode: entry.code,
        aggregateTurnoverPreviousFyPaise: 700_000_000n,
        hasInterStateOutwardSupply: false,
        suppliesViaEcommerceOperatorWithTcs: false,
        isCasualOrNonResident: false,
        isManufacturerOfRestrictedGoods: false,
      });
      expect(
        result.eligible,
        `${entry.name} (${entry.code}) at Rs 7 crore should be eligible under special-category Rs 75 lakh limit`,
      ).toBe(true);
      if (result.eligible) {
        expect(
          result.turnoverLimitPaise,
          `${entry.name} (${entry.code}) should resolve to special-category limit`,
        ).toBe(COMPOSITION_GOODS_TURNOVER_LIMIT_SPECIAL_PAISE);
      }
    }
  });

  it('Maharashtra (27) does not appear in the special-category set -- regular Rs 1.5 crore limit applies', () => {
    const result = checkCompositionEligibility({
      scheme: 'GOODS_OR_RESTAURANT',
      stateCode: '27',
      aggregateTurnoverPreviousFyPaise: 700_000_000n,
      hasInterStateOutwardSupply: false,
      suppliesViaEcommerceOperatorWithTcs: false,
      isCasualOrNonResident: false,
      isManufacturerOfRestrictedGoods: false,
    });
    expect(result.eligible).toBe(true);
    if (result.eligible) {
      expect(result.turnoverLimitPaise).toBe(COMPOSITION_GOODS_TURNOVER_LIMIT_PAISE);
    }
  });
});

describe('getCompositionRate -- citation provenance', () => {
  it('manufacturer/trader cites Section 10 and Notification 8/2017-CT (Rate)', () => {
    const rate = getCompositionRate('MANUFACTURER_OR_TRADER');
    expect(rate.citations).toHaveLength(2);
    const sec10 = rate.citations.find((c) => c.kind === 'section' && c.section === '10');
    expect(sec10).toBeDefined();
    const notification = rate.citations.find((c) => c.kind === 'notification');
    expect(notification).toBeDefined();
  });

  it('restaurant cites Section 10 and Notification 8/2017-CT (Rate)', () => {
    const rate = getCompositionRate('RESTAURANT_WITHOUT_ALCOHOL');
    expect(rate.citations).toHaveLength(2);
    const sec10 = rate.citations.find((c) => c.kind === 'section' && c.section === '10');
    expect(sec10).toBeDefined();
    const notification = rate.citations.find((c) => c.kind === 'notification');
    expect(notification).toBeDefined();
  });

  it('other-services Section 10(2A) cites exactly Section 10 (no rate notification)', () => {
    const rate = getCompositionRate('OTHER_SERVICES_S10_2A');
    expect(rate.citations).toHaveLength(1);
    const sec10 = rate.citations[0];
    if (sec10?.kind === 'section') {
      expect(sec10.section).toBe('10');
    }
  });
});

describe('computeCompositionTaxPaise', () => {
  it('Rs 1 crore turnover under manufacturer/trader scheme -- Rs 1 lakh tax', () => {
    const result = computeCompositionTaxPaise({
      aggregateTurnoverPaise: 1_000_000_000n,
      category: 'MANUFACTURER_OR_TRADER',
    });
    expect(result.totalPaise).toBe(10_000_000n);
    expect(result.cgstPaise).toBe(5_000_000n);
    expect(result.sgstPaise).toBe(5_000_000n);
  });

  it('Rs 1 crore turnover under restaurant scheme -- Rs 5 lakh tax', () => {
    const result = computeCompositionTaxPaise({
      aggregateTurnoverPaise: 1_000_000_000n,
      category: 'RESTAURANT_WITHOUT_ALCOHOL',
    });
    expect(result.totalPaise).toBe(50_000_000n);
  });

  it('Rs 50 lakh turnover under services scheme -- Rs 3 lakh tax', () => {
    const result = computeCompositionTaxPaise({
      aggregateTurnoverPaise: 500_000_000n,
      category: 'OTHER_SERVICES_S10_2A',
    });
    expect(result.totalPaise).toBe(30_000_000n);
    expect(result.cgstPaise).toBe(15_000_000n);
    expect(result.sgstPaise).toBe(15_000_000n);
  });
});
