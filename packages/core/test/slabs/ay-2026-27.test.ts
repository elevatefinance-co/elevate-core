/* Tests for the AY 2026-27 slab tables.
 * AY 2026-27 corresponds to FY 2025-26 and is governed by Finance Act 2025.
 * The new-regime slabs are revised (Union Budget 2025-26): the 0-rate band widens to Rs.
 * 4L and a new 25 percent tier appears between Rs. 20L and Rs. 24L.
 * Old-regime slabs are unchanged from AY 2025-26 (re-exported). Pinned: every band's boundaries,
 * the new 25 percent tier, the standard-deduction constants,
 * and the Section 115BAC + Finance Act 2025 citation set. Citations: Finance Act 2025, Section 115BAC.
 */

import {
  AY_2026_27_CITATIONS,
  NEW_REGIME_SLABS_AY_2026_27,
  OLD_REGIME_SLABS_INDIVIDUAL_AY_2026_27,
  OLD_REGIME_SLABS_SENIOR_AY_2026_27,
  OLD_REGIME_SLABS_SUPER_SENIOR_AY_2026_27,
  STANDARD_DEDUCTION_SALARY_NEW_AY_2026_27,
  STANDARD_DEDUCTION_SALARY_OLD_AY_2026_27,
} from '../../src/slabs/ay-2026-27.js';
import {
  OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26,
  OLD_REGIME_SLABS_SENIOR_AY_2025_26,
  OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26,
} from '../../src/slabs/ay-2025-26.js';

describe('NEW_REGIME_SLABS_AY_2026_27', () => {
  it('should expose seven bands (one more than AY 2025-26 due to the new 25 percent tier)', () => {
    expect(NEW_REGIME_SLABS_AY_2026_27).toHaveLength(7);
  });

  it('should pin the widened Rs. 0 to Rs. 4L band at 0 percent', () => {
    expect(NEW_REGIME_SLABS_AY_2026_27[0]).toEqual({
      lowerBound: 0,
      upperBound: 400_000,
      rate: 0,
    });
  });

  it('should pin the Rs. 4L to Rs. 8L band at 5 percent', () => {
    expect(NEW_REGIME_SLABS_AY_2026_27[1]).toEqual({
      lowerBound: 400_000,
      upperBound: 800_000,
      rate: 0.05,
    });
  });

  it('should pin the new Rs. 20L to Rs. 24L band at 25 percent (Budget 2025 introduction)', () => {
    expect(NEW_REGIME_SLABS_AY_2026_27[5]).toEqual({
      lowerBound: 2_000_000,
      upperBound: 2_400_000,
      rate: 0.25,
    });
  });

  it('should pin the top-tier Rs. 24L+ band at 30 percent', () => {
    expect(NEW_REGIME_SLABS_AY_2026_27[6]).toEqual({
      lowerBound: 2_400_000,
      upperBound: Infinity,
      rate: 0.3,
    });
  });

  it('should expose contiguous band boundaries with no overlap or gap', () => {
    for (let bandIndex = 1; bandIndex < NEW_REGIME_SLABS_AY_2026_27.length; bandIndex++) {
      expect(NEW_REGIME_SLABS_AY_2026_27[bandIndex]?.lowerBound).toBe(
        NEW_REGIME_SLABS_AY_2026_27[bandIndex - 1]?.upperBound,
      );
    }
  });
});

describe('old-regime slabs are unchanged from AY 2025-26', () => {
  it('should re-export the individual table identical to AY 2025-26', () => {
    expect(OLD_REGIME_SLABS_INDIVIDUAL_AY_2026_27).toBe(OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26);
  });

  it('should re-export the senior table identical to AY 2025-26', () => {
    expect(OLD_REGIME_SLABS_SENIOR_AY_2026_27).toBe(OLD_REGIME_SLABS_SENIOR_AY_2025_26);
  });

  it('should re-export the super-senior table identical to AY 2025-26', () => {
    expect(OLD_REGIME_SLABS_SUPER_SENIOR_AY_2026_27).toBe(OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26);
  });
});

describe('standard-deduction constants', () => {
  it('should pin the new-regime salaried standard deduction at Rs. 75,000', () => {
    expect(STANDARD_DEDUCTION_SALARY_NEW_AY_2026_27).toBe(75_000);
  });

  it('should pin the old-regime salaried standard deduction at Rs. 50,000', () => {
    expect(STANDARD_DEDUCTION_SALARY_OLD_AY_2026_27).toBe(50_000);
  });
});

describe('AY_2026_27_CITATIONS', () => {
  it('should include Section 115BAC and Finance Act 2025', () => {
    const hasSec115BAC = AY_2026_27_CITATIONS.some(
      (citation) => citation.kind === 'section' && citation.section === '115BAC',
    );
    const hasFa2025 = AY_2026_27_CITATIONS.some(
      (citation) => citation.kind === 'finance-act' && citation.year === 2025,
    );
    expect(hasSec115BAC).toBe(true);
    expect(hasFa2025).toBe(true);
  });

  it('should pin AY_2026_27_CITATIONS verbatim (Sec 115BAC and FA 2025, in that order)', () => {
    expect(AY_2026_27_CITATIONS).toHaveLength(2);
    expect(AY_2026_27_CITATIONS[0]).toMatchObject({
      kind: 'section',
      section: '115BAC',
    });
    expect(AY_2026_27_CITATIONS[1]).toMatchObject({
      kind: 'finance-act',
      year: 2025,
    });
  });
});

describe('full AY 2026-27 new-regime table verbatim', () => {
  it('should pin the new-regime schedule verbatim (seven bands, FA 2025)', () => {
    expect(NEW_REGIME_SLABS_AY_2026_27).toEqual([
      { lowerBound: 0, upperBound: 400_000, rate: 0 },
      { lowerBound: 400_000, upperBound: 800_000, rate: 0.05 },
      { lowerBound: 800_000, upperBound: 1_200_000, rate: 0.1 },
      { lowerBound: 1_200_000, upperBound: 1_600_000, rate: 0.15 },
      { lowerBound: 1_600_000, upperBound: 2_000_000, rate: 0.2 },
      { lowerBound: 2_000_000, upperBound: 2_400_000, rate: 0.25 },
      { lowerBound: 2_400_000, upperBound: Infinity, rate: 0.3 },
    ]);
  });

  it('should pin the Rs. 8L to Rs. 12L band at 10 percent', () => {
    expect(NEW_REGIME_SLABS_AY_2026_27[2]).toEqual({
      lowerBound: 800_000,
      upperBound: 1_200_000,
      rate: 0.1,
    });
  });

  it('should pin the Rs. 12L to Rs. 16L band at 15 percent', () => {
    expect(NEW_REGIME_SLABS_AY_2026_27[3]).toEqual({
      lowerBound: 1_200_000,
      upperBound: 1_600_000,
      rate: 0.15,
    });
  });

  it('should pin the Rs. 16L to Rs. 20L band at 20 percent', () => {
    expect(NEW_REGIME_SLABS_AY_2026_27[4]).toEqual({
      lowerBound: 1_600_000,
      upperBound: 2_000_000,
      rate: 0.2,
    });
  });
});

describe('AY 2026-27 old-regime tables re-exported verbatim from AY 2025-26', () => {
  it('should re-export the individual table by reference', () => {
    expect(OLD_REGIME_SLABS_INDIVIDUAL_AY_2026_27).toBe(OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26);
  });

  it('should re-export the senior table by reference', () => {
    expect(OLD_REGIME_SLABS_SENIOR_AY_2026_27).toBe(OLD_REGIME_SLABS_SENIOR_AY_2025_26);
  });

  it('should re-export the super-senior table by reference', () => {
    expect(OLD_REGIME_SLABS_SUPER_SENIOR_AY_2026_27).toBe(OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26);
  });
});
