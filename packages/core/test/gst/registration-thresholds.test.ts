/* Tests for the Section 22 registration threshold resolver.
 * Covers regular State / special-category State, GOODS_ONLY / SERVICES_ONLY / MIXED supply mix,
 * the strict-greater-than crossing semantic.
 */

import {
  REGULAR_GOODS_THRESHOLD_PAISE,
  REGULAR_SERVICES_THRESHOLD_PAISE,
  SPECIAL_CATEGORY_GOODS_THRESHOLD_PAISE,
  SPECIAL_CATEGORY_SERVICES_THRESHOLD_PAISE,
  SPECIAL_CATEGORY_STATE_CODES,
  isSpecialCategoryStateForRegistration,
  isThresholdCrossed,
  resolveRegistrationThreshold,
} from '../../src/gst/registration/index.js';

describe('threshold constants -- paise representation', () => {
  it('regular goods threshold is Rs 40 lakh in paise', () => {
    expect(REGULAR_GOODS_THRESHOLD_PAISE).toBe(40n * 100_000n * 100n);
  });

  it('regular services threshold is Rs 20 lakh in paise', () => {
    expect(REGULAR_SERVICES_THRESHOLD_PAISE).toBe(20n * 100_000n * 100n);
  });

  it('special category goods threshold is Rs 20 lakh', () => {
    expect(SPECIAL_CATEGORY_GOODS_THRESHOLD_PAISE).toBe(20n * 100_000n * 100n);
  });

  it('special category services threshold is Rs 10 lakh', () => {
    expect(SPECIAL_CATEGORY_SERVICES_THRESHOLD_PAISE).toBe(10n * 100_000n * 100n);
  });
});

describe('isSpecialCategoryStateForRegistration', () => {
  it('classifies the seven North-Eastern States as special-category', () => {
    expect(isSpecialCategoryStateForRegistration('11')).toBe(true);
    expect(isSpecialCategoryStateForRegistration('12')).toBe(true);
    expect(isSpecialCategoryStateForRegistration('13')).toBe(true);
    expect(isSpecialCategoryStateForRegistration('14')).toBe(true);
    expect(isSpecialCategoryStateForRegistration('15')).toBe(true);
    expect(isSpecialCategoryStateForRegistration('16')).toBe(true);
    expect(isSpecialCategoryStateForRegistration('17')).toBe(true);
  });

  it('classifies Maharashtra (27), Karnataka (29), Tamil Nadu (33) as regular', () => {
    expect(isSpecialCategoryStateForRegistration('27')).toBe(false);
    expect(isSpecialCategoryStateForRegistration('29')).toBe(false);
    expect(isSpecialCategoryStateForRegistration('33')).toBe(false);
  });

  it('SPECIAL_CATEGORY_STATE_CODES is a non-empty Set', () => {
    expect(SPECIAL_CATEGORY_STATE_CODES.size).toBeGreaterThanOrEqual(7);
  });
});

describe('resolveRegistrationThreshold -- regular State', () => {
  it('GOODS_ONLY in Maharashtra (27) -- Rs 40 lakh', () => {
    const result = resolveRegistrationThreshold({
      stateCode: '27',
      supplyMix: 'GOODS_ONLY',
    });
    expect(result.thresholdPaise).toBe(REGULAR_GOODS_THRESHOLD_PAISE);
    expect(result.thresholdType).toBe('GOODS');
    expect(result.category).toBe('REGULAR_STATE');
  });

  it('SERVICES_ONLY in Karnataka (29) -- Rs 20 lakh', () => {
    const result = resolveRegistrationThreshold({
      stateCode: '29',
      supplyMix: 'SERVICES_ONLY',
    });
    expect(result.thresholdPaise).toBe(REGULAR_SERVICES_THRESHOLD_PAISE);
    expect(result.thresholdType).toBe('SERVICES');
    expect(result.category).toBe('REGULAR_STATE');
  });

  it('MIXED in Tamil Nadu (33) -- lower of the two (Rs 20 lakh)', () => {
    const result = resolveRegistrationThreshold({
      stateCode: '33',
      supplyMix: 'MIXED',
    });
    expect(result.thresholdPaise).toBe(REGULAR_SERVICES_THRESHOLD_PAISE);
    expect(result.thresholdType).toBe('MIXED');
  });
});

describe('resolveRegistrationThreshold -- special-category State', () => {
  it('GOODS_ONLY in Manipur (14) -- Rs 20 lakh', () => {
    const result = resolveRegistrationThreshold({
      stateCode: '14',
      supplyMix: 'GOODS_ONLY',
    });
    expect(result.thresholdPaise).toBe(SPECIAL_CATEGORY_GOODS_THRESHOLD_PAISE);
    expect(result.category).toBe('SPECIAL_CATEGORY_STATE');
  });

  it('SERVICES_ONLY in Mizoram (15) -- Rs 10 lakh', () => {
    const result = resolveRegistrationThreshold({
      stateCode: '15',
      supplyMix: 'SERVICES_ONLY',
    });
    expect(result.thresholdPaise).toBe(SPECIAL_CATEGORY_SERVICES_THRESHOLD_PAISE);
    expect(result.category).toBe('SPECIAL_CATEGORY_STATE');
  });
});

describe('isThresholdCrossed', () => {
  it('crossed when turnover strictly exceeds threshold', () => {
    const result = isThresholdCrossed({
      stateCode: '27',
      supplyMix: 'GOODS_ONLY',
      aggregateTurnoverPaise: REGULAR_GOODS_THRESHOLD_PAISE + 1n,
    });
    expect(result.crossed).toBe(true);
  });

  it('not crossed when turnover equals threshold', () => {
    const result = isThresholdCrossed({
      stateCode: '27',
      supplyMix: 'GOODS_ONLY',
      aggregateTurnoverPaise: REGULAR_GOODS_THRESHOLD_PAISE,
    });
    expect(result.crossed).toBe(false);
  });

  it('not crossed when turnover is below threshold', () => {
    const result = isThresholdCrossed({
      stateCode: '27',
      supplyMix: 'GOODS_ONLY',
      aggregateTurnoverPaise: REGULAR_GOODS_THRESHOLD_PAISE / 2n,
    });
    expect(result.crossed).toBe(false);
  });

  it('returns the resolved threshold alongside the crossed flag', () => {
    const result = isThresholdCrossed({
      stateCode: '17',
      supplyMix: 'SERVICES_ONLY',
      aggregateTurnoverPaise: 99n,
    });
    expect(result.threshold.thresholdPaise).toBe(SPECIAL_CATEGORY_SERVICES_THRESHOLD_PAISE);
    expect(result.threshold.category).toBe('SPECIAL_CATEGORY_STATE');
  });
});

describe('SPECIAL_CATEGORY_STATE_CODES -- per-state lookup-table membership', () => {
  it('contains exactly the expected nine special-category State codes', () => {
    expect(SPECIAL_CATEGORY_STATE_CODES).toEqual(
      new Set(['11', '12', '13', '14', '15', '16', '17', '18', '05']),
    );
  });

  it('Uttarakhand (05) is a special-category State', () => {
    expect(isSpecialCategoryStateForRegistration('05')).toBe(true);
    expect(SPECIAL_CATEGORY_STATE_CODES.has('05')).toBe(true);
  });

  it('Assam (18) is a special-category State', () => {
    expect(isSpecialCategoryStateForRegistration('18')).toBe(true);
    expect(SPECIAL_CATEGORY_STATE_CODES.has('18')).toBe(true);
  });

  it('every code in the set resolves to special-category-state via resolveRegistrationThreshold', () => {
    for (const stateCode of SPECIAL_CATEGORY_STATE_CODES) {
      const result = resolveRegistrationThreshold({
        stateCode,
        supplyMix: 'GOODS_ONLY',
      });
      expect(result.category).toBe('SPECIAL_CATEGORY_STATE');
      expect(result.thresholdPaise).toBe(SPECIAL_CATEGORY_GOODS_THRESHOLD_PAISE);
    }
  });
});

describe('resolveRegistrationThreshold -- citation provenance', () => {
  it('GOODS_ONLY result cites exactly Section 22', () => {
    const result = resolveRegistrationThreshold({
      stateCode: '27',
      supplyMix: 'GOODS_ONLY',
    });
    expect(result.citations).toHaveLength(1);
    const sec22 = result.citations[0];
    expect(sec22?.kind).toBe('section');
    if (sec22?.kind === 'section') {
      expect(sec22.section).toBe('22');
      expect(sec22.subSection).toBeUndefined();
    }
  });

  it('SERVICES_ONLY result cites exactly Section 22', () => {
    const result = resolveRegistrationThreshold({
      stateCode: '27',
      supplyMix: 'SERVICES_ONLY',
    });
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0]?.kind).toBe('section');
  });

  it('MIXED result cites exactly Section 22', () => {
    const result = resolveRegistrationThreshold({
      stateCode: '27',
      supplyMix: 'MIXED',
    });
    expect(result.citations).toHaveLength(1);
    const sec22 = result.citations[0];
    if (sec22?.kind === 'section') expect(sec22.section).toBe('22');
  });
});

describe('resolveRegistrationThreshold -- MIXED supply lower-of-two', () => {
  it('MIXED in regular State returns the services threshold (Rs 20 lakh < Rs 40 lakh)', () => {
    const result = resolveRegistrationThreshold({
      stateCode: '27',
      supplyMix: 'MIXED',
    });
    expect(result.thresholdPaise).toBe(REGULAR_SERVICES_THRESHOLD_PAISE);
    expect(result.thresholdPaise).toBeLessThan(REGULAR_GOODS_THRESHOLD_PAISE);
  });

  it('MIXED in special-category State returns the services threshold (Rs 10 lakh < Rs 20 lakh)', () => {
    const result = resolveRegistrationThreshold({
      stateCode: '14',
      supplyMix: 'MIXED',
    });
    expect(result.thresholdPaise).toBe(SPECIAL_CATEGORY_SERVICES_THRESHOLD_PAISE);
    expect(result.thresholdPaise).toBeLessThan(SPECIAL_CATEGORY_GOODS_THRESHOLD_PAISE);
  });
});

describe('isThresholdCrossed -- boundary semantics at exactly Rs 20 lakh services threshold', () => {
  it('not crossed at exactly Rs 20 lakh in regular State for SERVICES_ONLY', () => {
    const result = isThresholdCrossed({
      stateCode: '27',
      supplyMix: 'SERVICES_ONLY',
      aggregateTurnoverPaise: REGULAR_SERVICES_THRESHOLD_PAISE,
    });
    expect(result.crossed).toBe(false);
  });

  it('crossed at Rs 20 lakh + 1 paisa in regular State for SERVICES_ONLY', () => {
    const result = isThresholdCrossed({
      stateCode: '27',
      supplyMix: 'SERVICES_ONLY',
      aggregateTurnoverPaise: REGULAR_SERVICES_THRESHOLD_PAISE + 1n,
    });
    expect(result.crossed).toBe(true);
  });

  it('not crossed at Rs 10 lakh in special-category for SERVICES_ONLY', () => {
    const result = isThresholdCrossed({
      stateCode: '17',
      supplyMix: 'SERVICES_ONLY',
      aggregateTurnoverPaise: SPECIAL_CATEGORY_SERVICES_THRESHOLD_PAISE,
    });
    expect(result.crossed).toBe(false);
  });

  it('crossed at Rs 10 lakh + 1 paisa in special-category for SERVICES_ONLY', () => {
    const result = isThresholdCrossed({
      stateCode: '17',
      supplyMix: 'SERVICES_ONLY',
      aggregateTurnoverPaise: SPECIAL_CATEGORY_SERVICES_THRESHOLD_PAISE + 1n,
    });
    expect(result.crossed).toBe(true);
  });
});
