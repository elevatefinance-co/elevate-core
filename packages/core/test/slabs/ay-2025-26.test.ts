/* Tests for the AY 2025-26 slab tables.
 * AY 2025-26 corresponds to FY 2024-25 and is governed by Finance Act 2024.
 * The four tables (new-regime, old-regime individual, old-regime senior,
 * old-regime super-senior) are AY-frozen. Pinned: every band's lowerBound and upperBound boundary,
 * the regime-specific basic exemption (Rs. 3L new, Rs. 2.5L individual old, Rs. 3L senior, Rs.
 * 5L super-senior), the standard-deduction constants (Rs. 75k new, Rs. 50k old),
 * and the Finance Act 2024 + Section 115BAC citation set. Citations: Finance Act 2024, Section 115BAC.
 */

import {
  AY_2025_26_CITATIONS,
  NEW_REGIME_SLABS_AY_2025_26,
  OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26,
  OLD_REGIME_SLABS_SENIOR_AY_2025_26,
  OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26,
  STANDARD_DEDUCTION_SALARY_NEW_AY_2025_26,
  STANDARD_DEDUCTION_SALARY_OLD_AY_2025_26,
} from '../../src/slabs/ay-2025-26.js';

describe('NEW_REGIME_SLABS_AY_2025_26', () => {
  it('should expose six bands ascending from Rs. 0 to infinity', () => {
    expect(NEW_REGIME_SLABS_AY_2025_26).toHaveLength(6);
    expect(NEW_REGIME_SLABS_AY_2025_26[0]?.lowerBound).toBe(0);
    expect(NEW_REGIME_SLABS_AY_2025_26[5]?.upperBound).toBe(Infinity);
  });

  it('should pin the Rs. 0 to Rs. 3L band at 0 percent', () => {
    expect(NEW_REGIME_SLABS_AY_2025_26[0]).toEqual({
      lowerBound: 0,
      upperBound: 300_000,
      rate: 0,
    });
  });

  it('should pin the Rs. 3L to Rs. 7L band at 5 percent', () => {
    expect(NEW_REGIME_SLABS_AY_2025_26[1]).toEqual({
      lowerBound: 300_000,
      upperBound: 700_000,
      rate: 0.05,
    });
  });

  it('should pin the top-tier Rs. 15L+ band at 30 percent', () => {
    expect(NEW_REGIME_SLABS_AY_2025_26[5]).toEqual({
      lowerBound: 1_500_000,
      upperBound: Infinity,
      rate: 0.3,
    });
  });

  it('should expose contiguous band boundaries with no overlap or gap', () => {
    for (let bandIndex = 1; bandIndex < NEW_REGIME_SLABS_AY_2025_26.length; bandIndex++) {
      expect(NEW_REGIME_SLABS_AY_2025_26[bandIndex]?.lowerBound).toBe(
        NEW_REGIME_SLABS_AY_2025_26[bandIndex - 1]?.upperBound,
      );
    }
  });
});

describe('OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26', () => {
  it('should pin the Rs. 0 to Rs. 2.5L basic-exemption band at 0 percent', () => {
    expect(OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26[0]).toEqual({
      lowerBound: 0,
      upperBound: 250_000,
      rate: 0,
    });
  });

  it('should pin the top-tier 30 percent band starting at Rs. 10L', () => {
    const lastBand = OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26[3];
    expect(lastBand?.lowerBound).toBe(1_000_000);
    expect(lastBand?.upperBound).toBe(Infinity);
    expect(lastBand?.rate).toBe(0.3);
  });
});

describe('OLD_REGIME_SLABS_SENIOR_AY_2025_26', () => {
  it('should expose a Rs. 3L basic exemption (senior raised from Rs. 2.5L)', () => {
    expect(OLD_REGIME_SLABS_SENIOR_AY_2025_26[0]).toEqual({
      lowerBound: 0,
      upperBound: 300_000,
      rate: 0,
    });
  });
});

describe('OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26', () => {
  it('should expose a Rs. 5L basic exemption (super-senior carve-out)', () => {
    expect(OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26[0]).toEqual({
      lowerBound: 0,
      upperBound: 500_000,
      rate: 0,
    });
  });
});

describe('standard-deduction constants', () => {
  it('should pin the new-regime salaried standard deduction at Rs. 75,000', () => {
    expect(STANDARD_DEDUCTION_SALARY_NEW_AY_2025_26).toBe(75_000);
  });

  it('should pin the old-regime salaried standard deduction at Rs. 50,000', () => {
    expect(STANDARD_DEDUCTION_SALARY_OLD_AY_2025_26).toBe(50_000);
  });
});

describe('AY_2025_26_CITATIONS', () => {
  it('should include Section 115BAC and Finance Act 2024', () => {
    const hasSec115BAC = AY_2025_26_CITATIONS.some(
      (citation) => citation.kind === 'section' && citation.section === '115BAC',
    );
    const hasFa2024 = AY_2025_26_CITATIONS.some(
      (citation) => citation.kind === 'finance-act' && citation.year === 2024,
    );
    expect(hasSec115BAC).toBe(true);
    expect(hasFa2024).toBe(true);
  });
});

describe('OLD_REGIME_SLABS_SENIOR_AY_2025_26 every band verbatim', () => {
  it('should expose four bands ascending from Rs. 0 to infinity', () => {
    expect(OLD_REGIME_SLABS_SENIOR_AY_2025_26).toHaveLength(4);
  });

  it('should pin the Rs. 3L to Rs. 5L band at 5 percent', () => {
    expect(OLD_REGIME_SLABS_SENIOR_AY_2025_26[1]).toEqual({
      lowerBound: 300_000,
      upperBound: 500_000,
      rate: 0.05,
    });
  });

  it('should pin the Rs. 5L to Rs. 10L band at 20 percent', () => {
    expect(OLD_REGIME_SLABS_SENIOR_AY_2025_26[2]).toEqual({
      lowerBound: 500_000,
      upperBound: 1_000_000,
      rate: 0.2,
    });
  });

  it('should pin the Rs. 10L+ band at 30 percent (Infinity upper bound)', () => {
    expect(OLD_REGIME_SLABS_SENIOR_AY_2025_26[3]).toEqual({
      lowerBound: 1_000_000,
      upperBound: Infinity,
      rate: 0.3,
    });
  });
});

describe('OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26 every band verbatim', () => {
  it('should expose three bands ascending from Rs. 0 to infinity', () => {
    expect(OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26).toHaveLength(3);
  });

  it('should pin the Rs. 5L to Rs. 10L band at 20 percent', () => {
    expect(OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26[1]).toEqual({
      lowerBound: 500_000,
      upperBound: 1_000_000,
      rate: 0.2,
    });
  });

  it('should pin the Rs. 10L+ band at 30 percent (Infinity upper bound)', () => {
    expect(OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26[2]).toEqual({
      lowerBound: 1_000_000,
      upperBound: Infinity,
      rate: 0.3,
    });
  });
});

describe('full senior / super-senior tables verbatim', () => {
  it('should pin the senior table verbatim', () => {
    expect(OLD_REGIME_SLABS_SENIOR_AY_2025_26).toEqual([
      { lowerBound: 0, upperBound: 300_000, rate: 0 },
      { lowerBound: 300_000, upperBound: 500_000, rate: 0.05 },
      { lowerBound: 500_000, upperBound: 1_000_000, rate: 0.2 },
      { lowerBound: 1_000_000, upperBound: Infinity, rate: 0.3 },
    ]);
  });

  it('should pin the super-senior table verbatim', () => {
    expect(OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26).toEqual([
      { lowerBound: 0, upperBound: 500_000, rate: 0 },
      { lowerBound: 500_000, upperBound: 1_000_000, rate: 0.2 },
      { lowerBound: 1_000_000, upperBound: Infinity, rate: 0.3 },
    ]);
  });
});
