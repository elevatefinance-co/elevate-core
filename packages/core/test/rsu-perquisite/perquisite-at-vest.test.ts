/* Tests for Section 17(2)(vi) perquisite-at-vest computation.
 * The salary-side taxable amount when an RSU / ESOP vests:
 *   perquisite = (FMV per unit on vest date - exercise price
 *                 per unit) x units vested
 *
 * Pinned: zero-strike RSU yields full FMV times units, ESOP with strike subtracts strike,
 * ESOP with strike above FMV floors at zero (underwater),
 * eligible-startup deferral returns zero with an explanatory step (Section 17(2)(vi) second proviso),
 * foreign-listed grant uses SBI TTBR for both FMV and exercise-price conversion. Citations:
 * Section 17(2)(vi), Rule 3, Rule 3(8), Rule 3(8)(iii)(c) (foreign-listed FX).
 */

import { computePerquisiteAtVest } from '../../src/rsu-perquisite/perquisite-at-vest.js';
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

describe('computePerquisiteAtVest', () => {
  it('should compute FMV times units for a zero-strike Indian RSU', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = computePerquisiteAtVest({
      grant: INDIAN_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(150_000);
  });

  it('should subtract the strike price for an ESOP exercise', () => {
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
    const result = computePerquisiteAtVest({
      grant,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe((225 - 75) * 200);
  });

  it('should floor an underwater ESOP perquisite at zero (strike > FMV)', () => {
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
    const result = computePerquisiteAtVest({
      grant,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should defer an eligible-startup grant to zero with an explanatory step', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = computePerquisiteAtVest({
      grant: INDIAN_GRANT,
      vest,
      isEligibleStartup: true,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
    expect(result.steps[0]?.label).toMatch(/deferral/i);
  });

  it('should convert foreign-listed FMV via SBI TTBR for a US RSU', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 83.5,
    };
    const result = computePerquisiteAtVest({
      grant: US_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    /* Per-unit perquisite = round(200 * 83.5) - 0 = 16,700; total = 16,70,000 */
    expect(result.value).toBe(Math.round(200 * 83.5) * 100);
  });

  it('should convert foreign exercise price via SBI TTBR alongside foreign FMV', () => {
    const grantWithStrike: RsuGrant = {
      ...US_GRANT,
      exercisePriceInOriginalCurrency: 50,
    };
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 83.5,
    };
    const result = computePerquisiteAtVest({
      grant: grantWithStrike,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const fmvInr = Math.round(200 * 83.5);
    const strikeInr = Math.round(50 * 83.5);
    expect(result.value).toBe((fmvInr - strikeInr) * 100);
  });

  it('should cite Section 17(2)(vi) and Rule 3(8) on every computation', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = computePerquisiteAtVest({
      grant: INDIAN_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const hasSec17 = result.citations.some(
      (citation) =>
        citation.kind === 'section' && citation.section === '17' && citation.subSection === '2',
    );
    const hasRule3_8 = result.citations.some(
      (citation) => citation.kind === 'rule' && citation.ruleNumber === '3(8)',
    );
    expect(hasSec17).toBe(true);
    expect(hasRule3_8).toBe(true);
  });

  it('should pin the eligible-startup-deferral step exactly (label, formula, output, citations Section 17(2)(vi))', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = computePerquisiteAtVest({
      grant: INDIAN_GRANT,
      vest,
      isEligibleStartup: true,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step?.label).toBe('Eligible-startup deferral. Perquisite tax deferred up to 48 months');
    expect(step?.formula).toBe(
      'perquisite = 0 (deferred to earlier of: (a) 48 months from vest, (b) employment cessation, (c) sale)',
    );
    expect(step?.output).toBe(0);
    expect(step?.citations).toEqual([
      {
        kind: 'section',
        act: 'IT_ACT_1961',
        section: '17',
        subSection: '2',
        clause: 'vi',
        note: 'Perquisite. Securities / sweat equity (RSU/ESOP)',
      },
    ]);
    expect(step).toMatchObject({
      inputs: {
        units: 100,
        fmvForeign: 1_500,
        exercisePriceForeign: 0,
        isEligibleStartup: 'true',
      },
    });
  });

  it('should propagate Section 17(2)(vi), Rule 3 and Rule 3(8) citations on the deferral path', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = computePerquisiteAtVest({
      grant: INDIAN_GRANT,
      vest,
      isEligibleStartup: true,
      ay: ASSESSMENT_YEAR,
    });
    const hasSec17 = result.citations.some(
      (citation) =>
        citation.kind === 'section' && citation.section === '17' && citation.subSection === '2',
    );
    const hasRule3 = result.citations.some(
      (citation) => citation.kind === 'rule' && citation.ruleNumber === '3',
    );
    const hasRule3_8 = result.citations.some(
      (citation) => citation.kind === 'rule' && citation.ruleNumber === '3(8)',
    );
    expect(hasSec17).toBe(true);
    expect(hasRule3).toBe(true);
    expect(hasRule3_8).toBe(true);
  });

  it('should pin the exact exercise-price step for an Indian-listed grant (formula "exercise_price (already INR)" + Rule 3(8)(iii)(c))', () => {
    const grantWithStrike: RsuGrant = {
      ...INDIAN_GRANT,
      exercisePriceInOriginalCurrency: 75,
    };
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 200,
      fmvPerUnitInOriginalCurrency: 225,
      originalCurrency: 'INR',
    };
    const result = computePerquisiteAtVest({
      grant: grantWithStrike,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const exerciseStep = result.steps.find(
      (step) => step.label === 'Exercise price per unit in INR',
    );
    expect(exerciseStep).toBeDefined();
    expect(exerciseStep?.label).toBe('Exercise price per unit in INR');
    expect(exerciseStep?.formula).toBe('exercise_price (already INR)');
    expect(exerciseStep?.output).toBe(75);
    expect(exerciseStep?.citations).toEqual([
      {
        kind: 'rule',
        ruleNumber: '3(8)(iii)(c)',
        note: 'FMV for foreign-listed shares. Market close x SBI TT rate',
      },
    ]);
    expect(exerciseStep?.inputs?.exercisePriceInr).toBe(75);
    expect(exerciseStep?.inputs?.ttbr).toBe(0);
  });

  it('should pin the exact exercise-price step for a foreign-listed grant (formula "exercise_price_foreign x SBI_TTBR")', () => {
    const grantWithStrike: RsuGrant = {
      ...US_GRANT,
      exercisePriceInOriginalCurrency: 50,
    };
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 83.5,
    };
    const result = computePerquisiteAtVest({
      grant: grantWithStrike,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const exerciseStep = result.steps.find(
      (step) => step.label === 'Exercise price per unit in INR',
    );
    expect(exerciseStep).toBeDefined();
    expect(exerciseStep?.formula).toBe('exercise_price_foreign x SBI_TTBR');
    expect(exerciseStep?.output).toBe(Math.round(50 * 83.5));
    expect(exerciseStep?.inputs?.ttbr).toBe(83.5);
    expect(exerciseStep?.inputs?.exercisePriceInr).toBe(Math.round(50 * 83.5));
    expect(exerciseStep?.inputs?.exercisePriceForeign).toBe(50);
    expect(exerciseStep?.inputs?.originalCurrency).toBe('USD');
  });

  it('should pin the exact perquisite step (label, formula, citations Section 17(2)(vi))', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = computePerquisiteAtVest({
      grant: INDIAN_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const perquisiteStep = result.steps.find(
      (step) => step.label === 'Perquisite under Section 17(2)(vi)',
    );
    expect(perquisiteStep).toBeDefined();
    expect(perquisiteStep?.formula).toBe(
      '(FMV_per_unit_INR - exercise_price_per_unit_INR) x units_vested',
    );
    expect(perquisiteStep?.output).toBe(150_000);
    expect(perquisiteStep?.citations).toEqual([
      {
        kind: 'section',
        act: 'IT_ACT_1961',
        section: '17',
        subSection: '2',
        clause: 'vi',
        note: 'Perquisite. Securities / sweat equity (RSU/ESOP)',
      },
    ]);
    expect(perquisiteStep).toMatchObject({
      inputs: {
        fmvPerUnitInr: 1_500,
        exercisePriceInr: 0,
        perquisitePerUnit: 1_500,
        unitsVested: 100,
        totalPerquisite: 150_000,
      },
    });
  });

  it('should treat ttbr === 0 on a foreign-listed grant as no-TTBR (multiplier defaults to 1, exercise price stays foreign)', () => {
    const grantWithStrike: RsuGrant = {
      ...US_GRANT,
      exercisePriceInOriginalCurrency: 50,
    };
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 0,
    };
    const result = computePerquisiteAtVest({
      grant: grantWithStrike,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const exerciseStep = result.steps.find(
      (step) => step.label === 'Exercise price per unit in INR',
    );
    expect(exerciseStep?.output).toBe(50);
    expect(exerciseStep?.inputs?.ttbr).toBe(0);
    expect(exerciseStep?.inputs?.exercisePriceInr).toBe(50);
  });

  it('should compute exact paise-level perquisite for a foreign-listed grant with strike (kills perq formula and exercise-price ternary)', () => {
    const grantWithStrike: RsuGrant = {
      ...US_GRANT,
      exercisePriceInOriginalCurrency: 50,
    };
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 83.5,
    };
    const result = computePerquisiteAtVest({
      grant: grantWithStrike,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const fmvInr = Math.round(200 * 83.5);
    const strikeInr = Math.round(50 * 83.5);
    const perquisitePerUnit = fmvInr - strikeInr;
    const totalPerquisite = perquisitePerUnit * 100;
    expect(result.value).toBe(totalPerquisite);
    const perquisiteStep = result.steps.find(
      (step) => step.label === 'Perquisite under Section 17(2)(vi)',
    );
    expect(perquisiteStep?.inputs?.fmvPerUnitInr).toBe(fmvInr);
    expect(perquisiteStep?.inputs?.exercisePriceInr).toBe(strikeInr);
    expect(perquisiteStep?.inputs?.perquisitePerUnit).toBe(perquisitePerUnit);
    expect(perquisiteStep?.inputs?.totalPerquisite).toBe(totalPerquisite);
  });

  it('should expose deferral-path result.citations as well-typed Citation values (no undefined)', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = computePerquisiteAtVest({
      grant: INDIAN_GRANT,
      vest,
      isEligibleStartup: true,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations.every((citation) => citation !== undefined)).toBe(true);
    for (const citation of result.citations) {
      expect(typeof citation.kind).toBe('string');
    }
    expect(result.citations).toHaveLength(3);
  });

  it('should expose non-deferral result.citations as well-typed Citation values (no undefined) for an Indian zero-strike RSU', () => {
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 100,
      fmvPerUnitInOriginalCurrency: 1_500,
      originalCurrency: 'INR',
    };
    const result = computePerquisiteAtVest({
      grant: INDIAN_GRANT,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations.every((citation) => citation !== undefined)).toBe(true);
    for (const citation of result.citations) {
      expect(typeof citation.kind).toBe('string');
    }
    expect(result.citations.length).toBeGreaterThan(0);
  });

  it('should hold an Indian-listed exercise price at the native INR value even when the vest event carries a positive ttbr (kills ternary -> true mutant on the non-foreign branch)', () => {
    const indianGrantWithStrike: RsuGrant = {
      ...INDIAN_GRANT,
      exercisePriceInOriginalCurrency: 75,
    };
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 200,
      fmvPerUnitInOriginalCurrency: 225,
      originalCurrency: 'INR',
      sbiTtbrOnVestDate: 90,
    };
    const result = computePerquisiteAtVest({
      grant: indianGrantWithStrike,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const exerciseStep = result.steps.find(
      (step) => step.label === 'Exercise price per unit in INR',
    );
    expect(exerciseStep?.output).toBe(75);
    expect(exerciseStep?.output).not.toBe(75 * 90);
    expect(exerciseStep?.inputs?.exercisePriceInr).toBe(75);
    expect(result.value).toBe((225 - 75) * 200);
  });

  it('should multiply foreign exercise price by ttbr (not by 1) under LISTED_FOREIGN_EXCHANGE with positive ttbr (kills ternary -> true mutant)', () => {
    const grantWithStrike: RsuGrant = {
      ...US_GRANT,
      exercisePriceInOriginalCurrency: 40,
    };
    const vest: RsuVestEvent = {
      vestDate: '2024-09-01',
      unitsVested: 50,
      fmvPerUnitInOriginalCurrency: 200,
      originalCurrency: 'USD',
      sbiTtbrOnVestDate: 90,
    };
    const result = computePerquisiteAtVest({
      grant: grantWithStrike,
      vest,
      ay: ASSESSMENT_YEAR,
    });
    const exerciseStep = result.steps.find(
      (step) => step.label === 'Exercise price per unit in INR',
    );
    expect(exerciseStep?.output).toBe(40 * 90);
    expect(exerciseStep?.output).not.toBe(40);
    expect(exerciseStep?.inputs?.exercisePriceInr).toBe(40 * 90);
  });
});
