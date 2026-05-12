/* Wave 3. Chapter VI-A deductions. Pins the new-regime carve-out, every per-section cap,
 * and the citation trail so downstream receipts render the statutory authority for every allowable amount.
 */

import {
  isDeductionAllowedUnderNewRegime,
  computeSection80c,
  SECTION_80C_CAP_COMBINED,
  computeSection80ccd1b,
  computeSection80ccd2,
  SECTION_80CCD_1B_CAP,
  computeSection80d,
  computeSection80e,
  computeSection80g,
  computeSection80tta,
  computeSection80ttb,
  SECTION_80TTA_CAP,
  SECTION_80TTB_CAP,
} from '../src/deductions/index.js';

const AY = 'AY2025-26' as const;

describe('new-regime eligibility', () => {
  it('should allow 80CCD(2) under the new regime', () => {
    expect(isDeductionAllowedUnderNewRegime('SEC_80CCD_2')).toBe(true);
  });

  it('should deny 80C / 80D / 80E / 80G / 80TTA / 80TTB / 80CCD(1B) under the new regime', () => {
    expect(isDeductionAllowedUnderNewRegime('SEC_80C')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80D')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80E')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80G')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80TTA')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80TTB')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80CCD_1B')).toBe(false);
  });
});

describe('computeSection80c', () => {
  it('should new regime to zero', () => {
    const r = computeSection80c({
      regime: 'NEW',
      claim: { ppfContribution: 150_000 },
      ay: AY,
    });
    expect(r.value).toBe(0);
  });

  it('should old regime, within cap to returns full claim', () => {
    const r = computeSection80c({
      regime: 'OLD',
      claim: {
        ppfContribution: 80_000,
        elssInvestment: 30_000,
      },
      ay: AY,
    });
    expect(r.value).toBe(110_000);
  });

  it('should old regime, above Rs. 1.5L cap to clamps', () => {
    const r = computeSection80c({
      regime: 'OLD',
      claim: {
        ppfContribution: 150_000,
        lifeInsurancePremium: 50_000,
        childrenTuition: 40_000,
      },
      ay: AY,
    });
    expect(r.value).toBe(SECTION_80C_CAP_COMBINED);
  });

  it('should include 80CCC and 80CCD(1) within the shared cap', () => {
    const r = computeSection80c({
      regime: 'OLD',
      claim: {
        ppfContribution: 100_000,
        section80ccc: 30_000,
        section80ccd1: 40_000,
      },
      ay: AY,
    });
    expect(r.value).toBe(SECTION_80C_CAP_COMBINED);
  });
});

describe('computeSection80ccd1b', () => {
  it('should old regime. Up to Rs. 50k', () => {
    const r = computeSection80ccd1b({ regime: 'OLD', claim: 40_000, ay: AY });
    expect(r.value).toBe(40_000);
  });

  it('should old regime. Clamps at Rs. 50k', () => {
    const r = computeSection80ccd1b({ regime: 'OLD', claim: 80_000, ay: AY });
    expect(r.value).toBe(SECTION_80CCD_1B_CAP);
  });

  it('should new regime to zero', () => {
    const r = computeSection80ccd1b({ regime: 'NEW', claim: 50_000, ay: AY });
    expect(r.value).toBe(0);
  });
});

describe('computeSection80ccd2', () => {
  it('should private-sector employee. 10% of salary cap, AVAILABLE in new regime', () => {
    const r = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 200_000,
      salaryForLimitComputation: 1_800_000,
      employeeCategory: 'PRIVATE',
      ay: AY,
    });
    expect(r.value).toBe(180_000);
  });

  it('should central-govt employee. 14% of salary cap', () => {
    const r = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 300_000,
      salaryForLimitComputation: 1_800_000,
      employeeCategory: 'CENTRAL_GOVT',
      ay: AY,
    });
    expect(r.value).toBe(252_000);
  });

  it('should employer contribution below the cap. Returns actual', () => {
    const r = computeSection80ccd2({
      regime: 'OLD',
      employerContribution: 50_000,
      salaryForLimitComputation: 1_800_000,
      employeeCategory: 'PRIVATE',
      ay: AY,
    });
    expect(r.value).toBe(50_000);
  });
});

describe('computeSection80d', () => {
  it('should new regime to zero', () => {
    const r = computeSection80d({
      regime: 'NEW',
      claim: {
        selfFamilyPremium: 20_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: AY,
    });
    expect(r.value).toBe(0);
  });

  it('should self non-senior bucket caps at Rs. 25k', () => {
    const r = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 30_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: AY,
    });
    expect(r.value).toBe(25_000);
  });

  it('should self senior bucket caps at Rs. 50k', () => {
    const r = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 60_000,
        anySelfFamilySenior: true,
        anyParentSenior: false,
      },
      ay: AY,
    });
    expect(r.value).toBe(50_000);
  });

  it('should both buckets combine, preventive-health within each cap', () => {
    const r = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 22_000,
        selfFamilyPreventiveHealthCheckup: 5_000,
        anySelfFamilySenior: false,
        parentsPremium: 45_000,
        parentsPreventiveHealthCheckup: 7_000,
        anyParentSenior: true,
      },
      ay: AY,
    });
    expect(r.value).toBe(25_000 + 50_000);
  });

  it('should preventive-health check-up alone is capped at Rs. 5,000 within bucket', () => {
    const r = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 0,
        selfFamilyPreventiveHealthCheckup: 12_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: AY,
    });
    expect(r.value).toBe(5_000);
  });
});

describe('computeSection80e', () => {
  it('should full interest in year 1 of 8', () => {
    const r = computeSection80e({
      regime: 'OLD',
      interestPaid: 80_000,
      firstInterestPaymentAyStartYear: 2025,
      ay: AY,
    });
    expect(r.value).toBe(80_000);
  });

  it('should full interest at year 8', () => {
    const r = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2018,
      ay: AY,
    });
    expect(r.value).toBe(50_000);
  });

  it('should zero past the 8-year window', () => {
    const r = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2015,
      ay: AY,
    });
    expect(r.value).toBe(0);
  });

  it('should new regime to zero', () => {
    const r = computeSection80e({
      regime: 'NEW',
      interestPaid: 80_000,
      firstInterestPaymentAyStartYear: 2025,
      ay: AY,
    });
    expect(r.value).toBe(0);
  });
});

describe('computeSection80g', () => {
  it('100% no-limit donation via bank transfer', () => {
    const r = computeSection80g({
      regime: 'OLD',
      donations: [
        {
          category: '100_PCT_NO_LIMIT',
          amount: 50_000,
          mode: 'NON_CASH',
          doneeName: 'PM CARES',
        },
      ],
      adjustedGrossTotalIncome: 1_000_000,
      ay: AY,
    });
    expect(r.value).toBe(50_000);
  });

  it('50% with AGTI limit. Capped at 10% of AGTI', () => {
    const r = computeSection80g({
      regime: 'OLD',
      donations: [{ category: '50_PCT_WITH_LIMIT', amount: 500_000, mode: 'NON_CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: AY,
    });
    expect(r.value).toBe(100_000);
  });

  it('should cash donation > Rs. 2,000 is disqualified entirely', () => {
    const r = computeSection80g({
      regime: 'OLD',
      donations: [{ category: '100_PCT_NO_LIMIT', amount: 5_000, mode: 'CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: AY,
    });
    expect(r.value).toBe(0);
  });

  it('should cash donation <= Rs. 2,000 is allowed', () => {
    const r = computeSection80g({
      regime: 'OLD',
      donations: [{ category: '100_PCT_NO_LIMIT', amount: 1_500, mode: 'CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: AY,
    });
    expect(r.value).toBe(1_500);
  });

  it('should new regime to zero', () => {
    const r = computeSection80g({
      regime: 'NEW',
      donations: [{ category: '100_PCT_NO_LIMIT', amount: 50_000, mode: 'NON_CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: AY,
    });
    expect(r.value).toBe(0);
  });
});

describe('computeSection80tta / 80ttb', () => {
  it('80TTA. Non-senior, within Rs. 10k cap', () => {
    const r = computeSection80tta({
      regime: 'OLD',
      savingsInterest: 8_000,
      isSeniorCitizen: false,
      ay: AY,
    });
    expect(r.value).toBe(8_000);
  });

  it('80TTA. Non-senior, above cap to clamps', () => {
    const r = computeSection80tta({
      regime: 'OLD',
      savingsInterest: 25_000,
      isSeniorCitizen: false,
      ay: AY,
    });
    expect(r.value).toBe(SECTION_80TTA_CAP);
  });

  it('80TTA blocked for senior', () => {
    const r = computeSection80tta({
      regime: 'OLD',
      savingsInterest: 8_000,
      isSeniorCitizen: true,
      ay: AY,
    });
    expect(r.value).toBe(0);
  });

  it('80TTB. Senior, within Rs. 50k cap', () => {
    const r = computeSection80ttb({
      regime: 'OLD',
      depositInterest: 45_000,
      isSeniorCitizen: true,
      ay: AY,
    });
    expect(r.value).toBe(45_000);
  });

  it('80TTB. Senior, above cap to clamps', () => {
    const r = computeSection80ttb({
      regime: 'OLD',
      depositInterest: 80_000,
      isSeniorCitizen: true,
      ay: AY,
    });
    expect(r.value).toBe(SECTION_80TTB_CAP);
  });

  it('80TTB blocked for non-senior', () => {
    const r = computeSection80ttb({
      regime: 'OLD',
      depositInterest: 30_000,
      isSeniorCitizen: false,
      ay: AY,
    });
    expect(r.value).toBe(0);
  });

  it('should both blocked under new regime', () => {
    expect(
      computeSection80tta({
        regime: 'NEW',
        savingsInterest: 8_000,
        isSeniorCitizen: false,
        ay: AY,
      }).value,
    ).toBe(0);
    expect(
      computeSection80ttb({
        regime: 'NEW',
        depositInterest: 45_000,
        isSeniorCitizen: true,
        ay: AY,
      }).value,
    ).toBe(0);
  });
});
