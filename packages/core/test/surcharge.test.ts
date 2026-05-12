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
  computeSurchargeWithMarginalRelief,
  computeSurchargeCappedForSpecialIncome,
  getIndividualSurchargeTiers,
  SURCHARGE_TIERS_INDIVIDUAL_NEW,
  SURCHARGE_TIERS_INDIVIDUAL_OLD,
  SURCHARGE_TIERS_FIRM_LLP,
  SURCHARGE_TIERS_DOMESTIC_COMPANY,
  SURCHARGE_RATE_COMPANY_CONCESSIONAL,
  SPECIAL_INCOME_SURCHARGE_RATE_CAP,
  SPECIAL_INCOME_SURCHARGE_CITATIONS,
  FINANCE_ACTS,
  computeSlabTax,
  getSlabs,
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

describe('computeSurchargeWithMarginalRelief()', () => {
  it('should pin the slab-rate fixtures the marginal-relief tests feed in (OLD regime)', () => {
    const oldSlabs = getSlabs({ regime: 'OLD', ay: 'AY2025-26' }).slabs;
    const taxAt50L = computeSlabTax({
      taxableIncome: 5_000_000,
      slabs: oldSlabs,
      ay: 'AY2025-26',
    });
    const taxAt5010k = computeSlabTax({
      taxableIncome: 5_010_000,
      slabs: oldSlabs,
      ay: 'AY2025-26',
    });
    expect(taxAt50L.value).toBe(1_312_500);
    expect(taxAt5010k.value).toBe(1_315_500);
  });

  it('should levy no surcharge at exactly Rs. 50,00,000 (threshold not breached)', () => {
    const r = computeSurchargeWithMarginalRelief({
      taxableIncome: 5_000_000,
      taxBeforeCess: 1_312_500,
      taxAtThreshold: 1_312_500,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(0);
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]).toMatchObject({
      label: 'Surcharge. Below lowest threshold',
      formula: '0',
      inputs: { taxableIncome: 5_000_000, taxBeforeCess: 1_312_500 },
      output: 0,
    });
  });

  it('should bind the cap at Rs. 50,10,000: surcharge Rs. 7,000 instead of Rs. 1,31,550', () => {
    const r = computeSurchargeWithMarginalRelief({
      taxableIncome: 5_010_000,
      taxBeforeCess: 1_315_500,
      taxAtThreshold: 1_312_500,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(7_000);
    expect(1_315_500 + r.value).toBe(1_312_500 + 10_000);
    expect(r.steps).toHaveLength(2);
    expect(r.steps[0]).toMatchObject({
      label: 'Surcharge @ 10%. Income > Rs. 50,00,000',
      formula: '1315500 x 0.1 = 131550',
      inputs: {
        taxableIncome: 5_010_000,
        taxBeforeCess: 1_315_500,
        tierThreshold: 5_000_000,
        tierRate: 0.1,
      },
      output: 131_550,
    });
    expect(r.steps[1]).toMatchObject({
      label: 'Surcharge marginal relief. Cap binds',
      formula:
        'min(rawSurcharge 131550, taxAtThreshold 1312500 + incomeOverThreshold 10000 - taxBeforeCess 1315500) = 7000',
      inputs: {
        rawSurcharge: 131_550,
        taxAtThreshold: 1_312_500,
        incomeOverThreshold: 10_000,
        taxBeforeCess: 1_315_500,
        surchargeCap: 7_000,
      },
      output: 7_000,
    });
  });

  it('should leave the raw surcharge untouched when the cap does not bind (Rs. 60,00,000)', () => {
    const r = computeSurchargeWithMarginalRelief({
      taxableIncome: 6_000_000,
      taxBeforeCess: 1_612_500,
      taxAtThreshold: 1_312_500,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(161_250);
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]).toMatchObject({
      label: 'Surcharge @ 10%. Income > Rs. 50,00,000',
      formula: '1612500 x 0.1 = 161250',
      output: 161_250,
    });
  });

  it('should round the raw surcharge half-up (1315505 x 0.1 = 131550.5 -> 131551)', () => {
    const r = computeSurchargeWithMarginalRelief({
      taxableIncome: 6_000_000,
      taxBeforeCess: 1_315_505,
      taxAtThreshold: 1_312_500,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(131_551);
  });

  it('should clamp the cap at zero when threshold tax plus excess is below tax before cess', () => {
    const r = computeSurchargeWithMarginalRelief({
      taxableIncome: 5_010_000,
      taxBeforeCess: 1_400_000,
      taxAtThreshold: 1_312_500,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(0);
    expect(r.steps).toHaveLength(2);
    expect(r.steps[1]).toMatchObject({
      label: 'Surcharge marginal relief. Cap binds',
      inputs: { surchargeCap: 0 },
      output: 0,
    });
  });

  it('should pass citations through to the result and every step', () => {
    const customCitations = [FINANCE_ACTS.FA_2025];
    const r = computeSurchargeWithMarginalRelief({
      taxableIncome: 5_010_000,
      taxBeforeCess: 1_315_500,
      taxAtThreshold: 1_312_500,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
      citations: customCitations,
    });
    expect(r.citations).toBe(customCitations);
    expect(r.steps[0]?.citations).toBe(customCitations);
    expect(r.steps[1]?.citations).toBe(customCitations);
  });

  it('should default citations to an empty array on the below-threshold branch', () => {
    const r = computeSurchargeWithMarginalRelief({
      taxableIncome: 4_000_000,
      taxBeforeCess: 1_012_500,
      taxAtThreshold: 1_312_500,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.citations).toEqual([]);
    expect(r.steps[0]?.citations).toEqual([]);
  });
});

describe('computeSurchargeCappedForSpecialIncome()', () => {
  it('should pin the 15% cap constant', () => {
    expect(SPECIAL_INCOME_SURCHARGE_RATE_CAP).toBe(0.15);
  });

  /* Surcharge attaches to income EXCEEDING the threshold (Finance Act First Schedule wording), so
   * exactly at Rs. 50,00,000 no tier is breached and both the regular and special portions carry
   * zero surcharge. This pins the strict `>` boundary in the tier scan: a `>=` would wrongly levy
   * the 10% tier (and the 15% special cap) on a taxpayer sitting exactly on the threshold. */
  it('should levy no surcharge at exactly Rs. 50,00,000 (strict-greater threshold not breached)', () => {
    const r = computeSurchargeCappedForSpecialIncome({
      taxableIncome: 5_000_000,
      regularTaxPortion: 1_312_500,
      specialTaxPortion: 200_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(0);
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]).toMatchObject({
      label: 'Surcharge. Below lowest threshold',
      formula: '0',
      output: 0,
    });
  });

  it('should cap the special portion at 15% in the 37% tier (OLD, Rs. 6Cr)', () => {
    const r = computeSurchargeCappedForSpecialIncome({
      taxableIncome: 60_000_000,
      regularTaxPortion: 1_000_000,
      specialTaxPortion: 200_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(400_000);
    expect(r.steps).toHaveLength(3);
    expect(r.steps[0]).toMatchObject({
      label: 'Surcharge @ 37% on regular-income tax. Income > Rs. 5,00,00,000',
      formula: '1000000 x 0.37 = 370000',
      inputs: {
        taxableIncome: 60_000_000,
        regularTaxPortion: 1_000_000,
        tierThreshold: 50_000_000,
        tierRate: 0.37,
      },
      output: 370_000,
    });
    expect(r.steps[1]).toMatchObject({
      label: 'Surcharge on Sec 111A / 112 / 112A / dividend tax. Capped @ 15%',
      formula: '200000 x min(tierRate 0.37, cap 0.15) = 30000',
      inputs: {
        specialTaxPortion: 200_000,
        tierRate: 0.37,
        specialRateCap: 0.15,
        specialRate: 0.15,
      },
      output: 30_000,
    });
    expect(r.steps[2]).toMatchObject({
      label: 'Total surcharge',
      formula: '370000 + 30000 = 400000',
      inputs: { regularSurcharge: 370_000, specialSurcharge: 30_000 },
      output: 400_000,
    });
  });

  it('should cap the special portion at 15% in the 25% tier (NEW, Rs. 3Cr)', () => {
    const r = computeSurchargeCappedForSpecialIncome({
      taxableIncome: 30_000_000,
      regularTaxPortion: 1_000_000,
      specialTaxPortion: 200_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_NEW,
      ay: 'AY2026-27',
    });
    expect(r.value).toBe(280_000);
    expect(r.steps[1]).toMatchObject({
      label: 'Surcharge on Sec 111A / 112 / 112A / dividend tax. Capped @ 15%',
      formula: '200000 x min(tierRate 0.25, cap 0.15) = 30000',
      output: 30_000,
    });
  });

  it('should apply the tier rate unchanged to the special portion in the 10% tier (Rs. 60L)', () => {
    const r = computeSurchargeCappedForSpecialIncome({
      taxableIncome: 6_000_000,
      regularTaxPortion: 1_000_000,
      specialTaxPortion: 200_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(120_000);
    expect(r.steps[1]).toMatchObject({
      label: 'Surcharge @ 10% on Sec 111A / 112 / 112A / dividend tax',
      formula: '200000 x min(tierRate 0.1, cap 0.15) = 20000',
      output: 20_000,
    });
  });

  it('should keep the uncapped label at exactly the 15% tier rate (Rs. 1.2Cr)', () => {
    const r = computeSurchargeCappedForSpecialIncome({
      taxableIncome: 12_000_000,
      regularTaxPortion: 1_000_000,
      specialTaxPortion: 200_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(180_000);
    expect(r.steps[1]?.label).toBe('Surcharge @ 15% on Sec 111A / 112 / 112A / dividend tax');
  });

  it('should round each portion half-up independently', () => {
    const r = computeSurchargeCappedForSpecialIncome({
      taxableIncome: 60_000_000,
      regularTaxPortion: 333_335,
      specialTaxPortion: 333_333,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.steps[0]?.output).toBe(123_334);
    expect(r.steps[1]?.output).toBe(50_000);
    expect(r.value).toBe(173_334);
  });

  it('should return zero below the lowest threshold', () => {
    const r = computeSurchargeCappedForSpecialIncome({
      taxableIncome: 4_000_000,
      regularTaxPortion: 800_000,
      specialTaxPortion: 200_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(0);
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]).toMatchObject({
      label: 'Surcharge. Below lowest threshold',
      formula: '0',
      inputs: { taxableIncome: 4_000_000, regularTaxPortion: 800_000, specialTaxPortion: 200_000 },
      output: 0,
    });
  });

  it('should carry the Sec 111A / 112 / 112A / dividend citations on every result', () => {
    const r = computeSurchargeCappedForSpecialIncome({
      taxableIncome: 60_000_000,
      regularTaxPortion: 1_000_000,
      specialTaxPortion: 200_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
    });
    expect(r.citations).toEqual(SPECIAL_INCOME_SURCHARGE_CITATIONS);
    expect(r.citations.some((c) => c.kind === 'section' && c.section === '111A')).toBe(true);
    expect(r.citations.some((c) => c.kind === 'section' && c.section === '112')).toBe(true);
    expect(r.citations.some((c) => c.kind === 'section' && c.section === '112A')).toBe(true);
    expect(
      r.citations.some((c) => c.kind === 'section' && c.section === '2' && c.subSection === '22'),
    ).toBe(true);
    expect(r.steps[0]?.citations).toEqual(r.citations);
    expect(r.steps[1]?.citations).toEqual(r.citations);
    expect(r.steps[2]?.citations).toEqual(r.citations);
  });

  it('should merge and dedupe caller citations with the baked statutory set', () => {
    const r = computeSurchargeCappedForSpecialIncome({
      taxableIncome: 60_000_000,
      regularTaxPortion: 1_000_000,
      specialTaxPortion: 200_000,
      tiers: SURCHARGE_TIERS_INDIVIDUAL_OLD,
      ay: 'AY2025-26',
      citations: [SPECIAL_INCOME_SURCHARGE_CITATIONS[0]!, FINANCE_ACTS.FA_2025],
    });
    expect(r.citations).toHaveLength(SPECIAL_INCOME_SURCHARGE_CITATIONS.length + 1);
    expect(r.citations.some((c) => c.kind === 'finance-act' && c.year === 2025)).toBe(true);
  });
});
