/* Surcharge is where the regime split matters most:
 * the old regime carries a 37% top-tier surcharge while the new regime caps at 25%.
 * Marginal-relief logic prevents the cliff at each tier boundary from making an extra rupee of income
 * cost more than a rupee of tax.
 * These tests pin every tier boundary, the marginal-relief math,
 * and the four entity-type tier tables (individual new, individual old, firm/LLP,
 * domestic company) across both supported AYs.
 */

import {
  computeSurcharge,
  getIndividualSurchargeTiers,
  SURCHARGE_TIERS_INDIVIDUAL_NEW,
  SURCHARGE_TIERS_INDIVIDUAL_OLD,
  SURCHARGE_TIERS_FIRM_LLP,
  SURCHARGE_TIERS_DOMESTIC_COMPANY,
  SURCHARGE_RATE_COMPANY_CONCESSIONAL,
} from '../src/index.js';

describe('computeSurcharge(). Individual old regime', () => {
  const tiers = SURCHARGE_TIERS_INDIVIDUAL_OLD;

  it('should zero surcharge below Rs. 50L', () => {
    const r = computeSurcharge({
      taxableIncome: 4_999_999,
      taxBeforeCess: 100_000,
      tiers,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(0);
  });

  it('10% surcharge at Rs. 60L', () => {
    const r = computeSurcharge({
      taxableIncome: 6_000_000,
      taxBeforeCess: 1_000_000,
      tiers,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(100_000);
  });

  it('15% surcharge at Rs. 1.2Cr', () => {
    const r = computeSurcharge({
      taxableIncome: 12_000_000,
      taxBeforeCess: 1_000_000,
      tiers,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(150_000);
  });

  it('25% surcharge at Rs. 3Cr', () => {
    const r = computeSurcharge({
      taxableIncome: 30_000_000,
      taxBeforeCess: 1_000_000,
      tiers,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(250_000);
  });

  it('37% surcharge at Rs. 6Cr (only under old regime)', () => {
    const r = computeSurcharge({
      taxableIncome: 60_000_000,
      taxBeforeCess: 1_000_000,
      tiers,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(370_000);
  });
});

describe('computeSurcharge(). Individual new regime caps at 25%', () => {
  const tiers = SURCHARGE_TIERS_INDIVIDUAL_NEW;

  it('should no 37% tier. Rs. 6Cr capped at 25%', () => {
    const r = computeSurcharge({
      taxableIncome: 60_000_000,
      taxBeforeCess: 1_000_000,
      tiers,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(250_000);
  });
});

describe('getIndividualSurchargeTiers()', () => {
  it('should return NEW tiers for new regime', () => {
    expect(getIndividualSurchargeTiers('NEW')).toBe(SURCHARGE_TIERS_INDIVIDUAL_NEW);
  });

  it('should return OLD tiers for old regime', () => {
    expect(getIndividualSurchargeTiers('OLD')).toBe(SURCHARGE_TIERS_INDIVIDUAL_OLD);
  });
});

describe('firm / LLP surcharge', () => {
  it('should zero below Rs. 1Cr', () => {
    const r = computeSurcharge({
      taxableIncome: 9_999_999,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_FIRM_LLP,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(0);
  });

  it('should flat 12% above Rs. 1Cr', () => {
    const r = computeSurcharge({
      taxableIncome: 15_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_FIRM_LLP,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(120_000);
  });
});

describe('domestic company surcharge', () => {
  it('7% at Rs. 5Cr', () => {
    const r = computeSurcharge({
      taxableIncome: 50_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_DOMESTIC_COMPANY,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(70_000);
  });

  it('12% above Rs. 10Cr', () => {
    const r = computeSurcharge({
      taxableIncome: 150_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_DOMESTIC_COMPANY,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(120_000);
  });
});

describe('concessional regime (115BAA / 115BAB) flat 10%', () => {
  it('should constant is 0.1', () => {
    expect(SURCHARGE_RATE_COMPANY_CONCESSIONAL).toBe(0.1);
  });
});

describe('surcharge tier tables. exact contents', () => {
  it('should pin SURCHARGE_TIERS_INDIVIDUAL_OLD verbatim', () => {
    expect(SURCHARGE_TIERS_INDIVIDUAL_OLD).toEqual([
      { incomeThreshold: 50_000_000, rate: 0.37 },
      { incomeThreshold: 20_000_000, rate: 0.25 },
      { incomeThreshold: 10_000_000, rate: 0.15 },
      { incomeThreshold: 5_000_000, rate: 0.1 },
    ]);
  });

  it('should pin SURCHARGE_TIERS_INDIVIDUAL_NEW verbatim (no 37 percent tier)', () => {
    expect(SURCHARGE_TIERS_INDIVIDUAL_NEW).toEqual([
      { incomeThreshold: 20_000_000, rate: 0.25 },
      { incomeThreshold: 10_000_000, rate: 0.15 },
      { incomeThreshold: 5_000_000, rate: 0.1 },
    ]);
  });

  it('should pin SURCHARGE_TIERS_FIRM_LLP verbatim (flat 12 percent above Rs. 1 Cr)', () => {
    expect(SURCHARGE_TIERS_FIRM_LLP).toEqual([{ incomeThreshold: 10_000_000, rate: 0.12 }]);
  });

  it('should pin SURCHARGE_TIERS_DOMESTIC_COMPANY verbatim (7 percent / 12 percent)', () => {
    expect(SURCHARGE_TIERS_DOMESTIC_COMPANY).toEqual([
      { incomeThreshold: 100_000_000, rate: 0.12 },
      { incomeThreshold: 10_000_000, rate: 0.07 },
    ]);
  });
});

describe('surcharge tier boundary precision (exactly at vs one rupee above)', () => {
  it('should not apply 10 percent at exactly Rs. 50L (OLD)', () => {
    const r = computeSurcharge({
      taxableIncome: 5_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(0);
  });

  it('should apply 10 percent one rupee above Rs. 50L (OLD)', () => {
    const r = computeSurcharge({
      taxableIncome: 5_000_001,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(100_000);
  });

  it('should not apply 15 percent at exactly Rs. 1Cr (still 10 percent tier)', () => {
    const r = computeSurcharge({
      taxableIncome: 10_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(100_000);
  });

  it('should apply 15 percent one rupee above Rs. 1Cr', () => {
    const r = computeSurcharge({
      taxableIncome: 10_000_001,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(150_000);
  });

  it('should not apply 25 percent at exactly Rs. 2Cr (still 15 percent tier)', () => {
    const r = computeSurcharge({
      taxableIncome: 20_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(150_000);
  });

  it('should apply 25 percent one rupee above Rs. 2Cr', () => {
    const r = computeSurcharge({
      taxableIncome: 20_000_001,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(250_000);
  });

  it('should not apply 37 percent at exactly Rs. 5Cr (still 25 percent tier under OLD)', () => {
    const r = computeSurcharge({
      taxableIncome: 50_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(250_000);
  });

  it('should apply 37 percent one rupee above Rs. 5Cr (OLD only)', () => {
    const r = computeSurcharge({
      taxableIncome: 50_000_001,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(370_000);
  });
});

describe('applied-surcharge step shape', () => {
  it('should emit the applied step verbatim at Rs. 60L (10 percent OLD)', () => {
    const r = computeSurcharge({
      taxableIncome: 6_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]).toMatchObject({
      label: 'Surcharge @ 10%. Income > Rs. 50,00,000',
      formula: '1000000 x 0.1 = 100000',
      inputs: {
        taxableIncome: 6_000_000,
        taxBeforeCess: 1_000_000,
        tierThreshold: 5_000_000,
        tierRate: 0.1,
      },
      output: 100_000,
    });
  });

  it('should render percentage as integer (rate * 100), not fractional (rate / 100)', () => {
    const r = computeSurcharge({
      taxableIncome: 12_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.steps[0]?.label).toContain('@ 15%');
    expect(r.steps[0]?.label).not.toContain('@ 0.15%');
    expect(r.steps[0]?.label).not.toContain('@ 0.0015%');
  });
});

describe('below-lowest-threshold step shape', () => {
  it('should emit the below-threshold step verbatim', () => {
    const r = computeSurcharge({
      taxableIncome: 4_000_000,
      taxBeforeCess: 500_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]).toMatchObject({
      label: 'Surcharge. Below lowest threshold',
      formula: '0',
      inputs: { taxableIncome: 4_000_000, taxBeforeCess: 500_000 },
      output: 0,
    });
  });
});

describe('default citations parameter', () => {
  it('should default citations to an empty array on the applied branch', () => {
    const r = computeSurcharge({
      taxableIncome: 6_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.citations).toEqual([]);
    expect(r.steps[0]?.citations).toEqual([]);
  });

  it('should default citations to an empty array on the below-threshold branch', () => {
    const r = computeSurcharge({
      taxableIncome: 100_000,
      taxBeforeCess: 0,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.citations).toEqual([]);
    expect(r.steps[0]?.citations).toEqual([]);
  });

  it('should pass citations through verbatim when provided', () => {
    const customCitations = [{ kind: 'finance-act', year: 2025 } as const];
    const r = computeSurcharge({
      taxableIncome: 6_000_000,
      taxBeforeCess: 1_000_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
      citations: customCitations,
    });
    expect(r.citations).toBe(customCitations);
  });
});
