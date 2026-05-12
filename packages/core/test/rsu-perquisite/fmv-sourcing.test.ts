/* Tests for the Rule 3(8) FMV sourcing dispatcher. Three listing-status branches:
 * Indian-listed (Rule 3(8)(iii)(a) / (b) -- average of open and close),
 * foreign-listed (Rule 3(8)(iii)(c) -- foreign FMV times SBI TTBR),
 * unlisted (Rule 3(9) read with Rule 11UA -- merchant-banker certified INR FMV). Pinned:
 * Indian path passes INR FMV through, foreign path multiplies by TTBR,
 * foreign path without TTBR returns zero with explanatory step (no silent zero),
 * unlisted path uses merchant-banker FMV. Citations: Rule 3, Rule 3(8), Rule 3(8)(iii)(c), Rule 3(9),
 * Rule 11UA, Section 17(2)(vi), CBDT Circular 13/2022.
 */

import { sourceFmvPerUnitInr } from '../../src/rsu-perquisite/fmv-sourcing.js';
import type { RsuGrant, RsuVestEvent } from '../../src/rsu-perquisite/types.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

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
  it('should pass through the INR FMV for an Indian-listed grant', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = sourceFmvPerUnitInr({
      grant: INDIAN_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(1_500);
    const hasRule3_8 = result.citations.some(
      (citation) => citation.kind === 'rule' && citation.ruleNumber === '3(8)',
    );
    expect(hasRule3_8).toBe(true);
  });

  it('should multiply foreign FMV by SBI TTBR for a foreign-listed grant', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 83.5,
    };
    const result = sourceFmvPerUnitInr({
      grant: US_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(Math.round(200 * 83.5));
    const hasRule3_8_iii_c = result.citations.some(
      (citation) => citation.kind === 'rule' && citation.ruleNumber === '3(8)(iii)(c)',
    );
    expect(hasRule3_8_iii_c).toBe(true);
  });

  it('should return zero with an explanatory step when SBI TTBR is missing for a foreign-listed grant', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
    };
    const result = sourceFmvPerUnitInr({
      grant: US_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
    const ttbrStep = result.steps.some((step) => step.label.includes('SBI TTBR'));
    expect(ttbrStep).toBe(true);
  });

  it('should return zero with an explanatory step when SBI TTBR is non-positive', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 0,
    };
    const result = sourceFmvPerUnitInr({
      grant: US_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should use merchant-banker FMV for an unlisted grant', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 500,
      fmvPerUnitInOriginalCurrency: 0,
      originalCurrency: 'INR',
      merchantBankerFmvPerUnitInr: 450,
    };
    const result = sourceFmvPerUnitInr({
      grant: UNLISTED_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(450);
    const hasRule11UA = result.citations.some(
      (citation) => citation.kind === 'rule' && citation.ruleNumber === '11UA',
    );
    expect(hasRule11UA).toBe(true);
  });

  it('should default unlisted FMV to zero when merchant-banker certificate is absent', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 500,
      fmvPerUnitInOriginalCurrency: 0,
      originalCurrency: 'INR',
    };
    const result = sourceFmvPerUnitInr({
      grant: UNLISTED_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should cite CBDT Circular 13/2022 on a foreign-listed FMV computation', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 83.5,
    };
    const result = sourceFmvPerUnitInr({
      grant: US_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const hasCirc = result.citations.some(
      (citation) => citation.kind === 'circular' && citation.number === '13/2022',
    );
    expect(hasCirc).toBe(true);
  });

  it('should cite Section 17(2)(vi) on every dispatch (foundation citation)', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = sourceFmvPerUnitInr({
      grant: INDIAN_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const hasSec17 = result.citations.some(
      (citation) =>
        citation.kind === 'section' && citation.section === '17' && citation.subSection === '2',
    );
    expect(hasSec17).toBe(true);
  });

  it('should pin the exact step shape and citations array for the Indian-listed branch (Rule 3(8))', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = sourceFmvPerUnitInr({
      grant: INDIAN_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step?.label).toBe('FMV. Listed Indian exchange, Rule 3(8)(iii)(a)');
    expect(step?.formula).toBe('average(open, close) on vest date');
    expect(step?.output).toBe(1_500);
    expect(step?.citations).toEqual([
      {
        kind: 'rule',
        ruleNumber: '3(8)',
        note: 'Perquisite value of specified security or sweat equity (RSU/ESOP) at exercise',
      },
    ]);
    expect(step).toMatchObject({
      label: 'FMV. Listed Indian exchange, Rule 3(8)(iii)(a)',
      formula: 'average(open, close) on vest date',
      inputs: {
        fmvPerUnitInOriginalCurrency: 1_500,
        originalCurrency: 'INR',
        fmvInr: 1_500,
      },
      output: 1_500,
    });
  });

  it('should propagate Rule 3, Rule 3(8), Section 17(2)(vi) into the deduped Indian-branch citations', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = sourceFmvPerUnitInr({
      grant: INDIAN_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const hasRule3 = result.citations.some(
      (citation) => citation.kind === 'rule' && citation.ruleNumber === '3',
    );
    const hasRule3_8 = result.citations.some(
      (citation) => citation.kind === 'rule' && citation.ruleNumber === '3(8)',
    );
    const hasSec17 = result.citations.some(
      (citation) =>
        citation.kind === 'section' && citation.section === '17' && citation.subSection === '2',
    );
    expect(hasRule3).toBe(true);
    expect(hasRule3_8).toBe(true);
    expect(hasSec17).toBe(true);
    expect(result.citations.length).toBeGreaterThanOrEqual(3);
  });

  it('should pin the exact step shape and citations array for the foreign-listed-with-TTBR branch (Rule 3(8)(iii)(c))', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 83.5,
    };
    const result = sourceFmvPerUnitInr({
      grant: US_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    const fmvInr = Math.round(200 * 83.5);
    expect(step?.label).toBe('FMV. Listed foreign exchange, Rule 3(8)(iii)(c)');
    expect(step?.formula).toBe('fmv_foreign x SBI_TTBR');
    expect(step?.output).toBe(fmvInr);
    expect(step?.citations).toEqual([
      {
        kind: 'rule',
        ruleNumber: '3(8)(iii)(c)',
        note: 'FMV for foreign-listed shares. Market close x SBI TT rate',
      },
      {
        kind: 'circular',
        number: '13/2022',
        date: '2022-06-22',
        note: 'Valuation of specified security / sweat equity (RSU / ESOP) perquisite. Clarifications on FMV sourcing for foreign-listed shares and exercise-date determination.',
      },
    ]);
    expect(step).toMatchObject({
      inputs: {
        fmvForeign: 200,
        originalCurrency: 'USD',
        sbiTtbrOnVestDate: 83.5,
        fmvInr,
      },
      output: fmvInr,
    });
  });

  it('should pin the exact step shape and citations array for the foreign-listed-without-TTBR branch (Rule 3(8)(iii)(c) + CBDT 13/2022)', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
    };
    const result = sourceFmvPerUnitInr({
      grant: US_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step?.label).toBe('FMV. Foreign exchange listing REQUIRES SBI TTBR');
    expect(step?.formula).toBe('no SBI TTBR provided');
    expect(step?.output).toBe(0);
    expect(step?.citations).toEqual([
      {
        kind: 'rule',
        ruleNumber: '3(8)(iii)(c)',
        note: 'FMV for foreign-listed shares. Market close x SBI TT rate',
      },
      {
        kind: 'circular',
        number: '13/2022',
        date: '2022-06-22',
        note: 'Valuation of specified security / sweat equity (RSU / ESOP) perquisite. Clarifications on FMV sourcing for foreign-listed shares and exercise-date determination.',
      },
    ]);
    expect(step).toMatchObject({
      inputs: {
        originalCurrency: 'USD',
        fmvForeign: 200,
      },
    });
  });

  it('should treat ttbr === 0 as missing and emit the no-TTBR step (boundary kill for ttbr <= 0)', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 0,
    };
    const result = sourceFmvPerUnitInr({
      grant: US_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
    expect(result.steps[0]?.label).toBe('FMV. Foreign exchange listing REQUIRES SBI TTBR');
    expect(result.steps[0]?.formula).toBe('no SBI TTBR provided');
  });

  it('should treat a strictly positive ttbr (e.g. 0.5) as valid and use the multiplication branch', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 0.5,
    };
    const result = sourceFmvPerUnitInr({
      grant: US_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(Math.round(200 * 0.5));
    expect(result.steps[0]?.label).toBe('FMV. Listed foreign exchange, Rule 3(8)(iii)(c)');
    expect(result.steps[0]?.formula).toBe('fmv_foreign x SBI_TTBR');
  });

  it('should pin the exact step shape and citations array for the unlisted branch (Rule 3(9) + Rule 11UA)', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 500,
      fmvPerUnitInOriginalCurrency: 0,
      originalCurrency: 'INR',
      merchantBankerFmvPerUnitInr: 450,
    };
    const result = sourceFmvPerUnitInr({
      grant: UNLISTED_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step?.label).toBe('FMV. Unlisted, Rule 3(9) read with Rule 11UA');
    expect(step?.formula).toBe('merchant-banker Cat-I certified FMV in INR');
    expect(step?.output).toBe(450);
    expect(step?.citations).toEqual([
      {
        kind: 'rule',
        ruleNumber: '3(9)',
        note: 'FMV of unlisted shares. Merchant banker Cat-I certificate',
      },
      {
        kind: 'rule',
        ruleNumber: '11UA',
        note: 'Valuation of unquoted shares',
      },
    ]);
    expect(step).toMatchObject({
      inputs: {
        merchantBankerFmvPerUnitInr: 450,
        fmvInr: 450,
      },
    });
  });

  it('should record the merchant-banker FMV verbatim in the unlisted step inputs (kills logical-operator drop on ?? 0)', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 500,
      fmvPerUnitInOriginalCurrency: 0,
      originalCurrency: 'INR',
      merchantBankerFmvPerUnitInr: 1_234,
    };
    const result = sourceFmvPerUnitInr({
      grant: UNLISTED_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const step = result.steps[0];
    expect(step?.inputs?.merchantBankerFmvPerUnitInr).toBe(1_234);
    expect(step?.inputs?.fmvInr).toBe(1_234);
    expect(result.value).toBe(1_234);
  });

  it('should expose result.citations as an array of well-typed Citation values for the Indian-listed branch (no undefined)', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = sourceFmvPerUnitInr({
      grant: INDIAN_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations.every((citation) => citation !== undefined)).toBe(true);
    for (const citation of result.citations) {
      expect(typeof citation.kind).toBe('string');
    }
    expect(result.citations).toHaveLength(3);
  });

  it('should expose result.citations as the deduped 4-element set for the foreign-no-TTBR branch (kills line-80 array + arrow mutants)', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
    };
    const result = sourceFmvPerUnitInr({
      grant: US_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations.every((citation) => citation !== undefined)).toBe(true);
    for (const citation of result.citations) {
      expect(typeof citation.kind).toBe('string');
    }
    expect(result.citations).toHaveLength(5);
    const hasRule3iiic = result.citations.some(
      (citation) => citation.kind === 'rule' && citation.ruleNumber === '3(8)(iii)(c)',
    );
    const hasCirc13_2022 = result.citations.some(
      (citation) => citation.kind === 'circular' && citation.number === '13/2022',
    );
    expect(hasRule3iiic).toBe(true);
    expect(hasCirc13_2022).toBe(true);
  });
});
