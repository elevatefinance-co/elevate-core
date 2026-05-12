/* Wave 4. RSU / ESOP perquisite engine. Pins the Rule 3(8) FMV sourcing dispatch,
 * the Section 17(2)(vi) perquisite formula, and the Section 49 cost-basis rule for sale events.
 */

import {
  sourceFmvPerUnitInr,
  computePerquisiteAtVest,
  computeSaleCostBasis,
  type RsuGrant,
  type RsuVestEvent,
  type RsuSaleEvent,
} from '../src/rsu-perquisite/index.js';

const AY = 'AY2025-26' as const;

const INDIAN_GRANT: RsuGrant = {
  grantId: 'grant-in-1',
  employer: 'Infosys',
  grantDate: '2023-04-01',
  totalUnits: 1_000,
  exercisePriceInOriginalCurrency: 0,
  originalCurrency: 'INR',
  listingStatus: 'LISTED_INDIAN_EXCHANGE',
};

const US_GRANT: RsuGrant = {
  grantId: 'grant-us-1',
  employer: 'Google',
  grantDate: '2023-04-01',
  totalUnits: 100,
  exercisePriceInOriginalCurrency: 0,
  originalCurrency: 'USD',
  listingStatus: 'LISTED_FOREIGN_EXCHANGE',
  exchangeCountryIso2: 'US',
};

const UNLISTED_GRANT: RsuGrant = {
  grantId: 'grant-pre-ipo-1',
  employer: 'Swiggy Pre-IPO',
  grantDate: '2023-04-01',
  totalUnits: 500,
  exercisePriceInOriginalCurrency: 1,
  originalCurrency: 'INR',
  listingStatus: 'UNLISTED',
};

describe('sourceFmvPerUnitInr', () => {
  it('Indian listed. Passes through INR FMV', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const r = sourceFmvPerUnitInr({ grant: INDIAN_GRANT, vest, ay: AY });
    expect(r.value).toBe(1_500);
    expect(r.citations.some((c) => c.kind === 'rule' && c.ruleNumber === '3(8)')).toBe(true);
  });

  it('US listed. Multiplies foreign FMV by SBI TTBR', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 83.5,
    };
    const r = sourceFmvPerUnitInr({ grant: US_GRANT, vest, ay: AY });
    expect(r.value).toBe(Math.round(200 * 83.5));
    const cite = r.citations.some((c) => c.kind === 'rule' && c.ruleNumber === '3(8)(iii)(c)');
    expect(cite).toBe(true);
  });

  it('US listed without TTBR to zero + explanatory step', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
    };
    const r = sourceFmvPerUnitInr({ grant: US_GRANT, vest, ay: AY });
    expect(r.value).toBe(0);
    expect(r.steps.some((s) => s.label.includes('SBI TTBR'))).toBe(true);
  });

  it('Unlisted. Uses merchant-banker INR FMV', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 500,
      fmvPerUnitInOriginalCurrency: 0,
      originalCurrency: 'INR',
      merchantBankerFmvPerUnitInr: 450,
    };
    const r = sourceFmvPerUnitInr({ grant: UNLISTED_GRANT, vest, ay: AY });
    expect(r.value).toBe(450);
    const cite = r.citations.some((c) => c.kind === 'rule' && c.ruleNumber === '11UA');
    expect(cite).toBe(true);
  });
});

describe('computePerquisiteAtVest', () => {
  it('Indian RSU at FMV Rs. 1,500 with zero exercise price. 100 units to Rs. 1.5L', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const r = computePerquisiteAtVest({ grant: INDIAN_GRANT, vest, ay: AY });
    expect(r.value).toBe(150_000);
  });

  it('US RSU at $200 FMV, Rs. 83.5 TTBR, zero exercise price. 100 units to Rs. 16.7L', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 83.5,
    };
    const r = computePerquisiteAtVest({ grant: US_GRANT, vest, ay: AY });
    const expectedPerUnit = Math.max(0, Math.round(200 * 83.5) - 0);
    expect(r.value).toBe(expectedPerUnit * 100);
  });

  it('ESOP with strike price. Perquisite = (FMV - strike) x units', () => {
    const grant: RsuGrant = {
      grantId: 'esop-1',
      employer: 'Zomato',
      grantDate: '2022-01-01',
      totalUnits: 200,
      exercisePriceInOriginalCurrency: 75,
      originalCurrency: 'INR',
      listingStatus: 'LISTED_INDIAN_EXCHANGE',
    };
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 200,
      fmvPerUnitInOriginalCurrency: 225,
      originalCurrency: 'INR',
    };
    const r = computePerquisiteAtVest({ grant, vest, ay: AY });
    expect(r.value).toBe((225 - 75) * 200);
  });

  it('ESOP with strike above FMV. Perquisite floored at zero', () => {
    const grant: RsuGrant = {
      grantId: 'esop-underwater',
      employer: 'PayTM',
      grantDate: '2022-01-01',
      totalUnits: 100,
      exercisePriceInOriginalCurrency: 2_000,
      originalCurrency: 'INR',
      listingStatus: 'LISTED_INDIAN_EXCHANGE',
    };
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_200,
      originalCurrency: 'INR',
    };
    const r = computePerquisiteAtVest({ grant, vest, ay: AY });
    expect(r.value).toBe(0);
  });

  it('Eligible-startup deferral. Perquisite is zero at vest', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const r = computePerquisiteAtVest({
      grant: INDIAN_GRANT,
      vest,
      isEligibleStartup: true,
      ay: AY,
    });
    expect(r.value).toBe(0);
    expect(r.steps[0]?.label).toContain('deferral');
  });

  it('should cite Section 17(2)(vi) + Rule 3(8)', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const r = computePerquisiteAtVest({ grant: INDIAN_GRANT, vest, ay: AY });
    expect(
      r.citations.some((c) => c.kind === 'section' && c.section === '17' && c.subSection === '2'),
    ).toBe(true);
    expect(r.citations.some((c) => c.kind === 'rule' && c.ruleNumber === '3(8)')).toBe(true);
  });
});

describe('computeSaleCostBasis', () => {
  it('Indian-listed sale at Rs. 1,800 after FMV-at-vest Rs. 1,500. Gain Rs. 300 x units', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
    };
    const r = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: AY,
    });
    expect(r.value.costBasisInr).toBe(150_000);
    expect(r.value.saleProceedsInr).toBe(180_000);
    expect(r.value.netGainInr).toBe(30_000);
  });

  it('US-listed sale. Converts foreign price with SBI TTBR', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 250,
      originalCurrency: 'USD',
      sbiTtbrOnSaleDate: 84,
    };
    const r = computeSaleCostBasis({
      grant: US_GRANT,
      sale,
      fmvPerUnitAtVestInr: Math.round(200 * 83.5),
      ay: AY,
    });
    const expectedProceeds = Math.round(250 * 84) * 100;
    const expectedBasis = Math.round(200 * 83.5) * 100;
    expect(r.value.saleProceedsInr).toBe(expectedProceeds);
    expect(r.value.costBasisInr).toBe(expectedBasis);
    expect(r.value.netGainInr).toBe(expectedProceeds - expectedBasis);
  });

  it('should broker commission reduces sale proceeds', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
      brokerCommissionInr: 500,
    };
    const r = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: AY,
    });
    expect(r.value.saleProceedsInr).toBe(180_000 - 500);
    expect(r.value.netGainInr).toBe(180_000 - 500 - 150_000);
  });

  it('should loss-making sale. NetGain is negative', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_200,
      originalCurrency: 'INR',
    };
    const r = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: AY,
    });
    expect(r.value.netGainInr).toBe(-30_000);
  });
});
