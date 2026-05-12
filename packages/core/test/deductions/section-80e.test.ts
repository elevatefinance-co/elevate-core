/* Tests for Section 80E. Education-loan interest deduction. Two non-obvious aspects:
 * no monetary cap (full interest is deductible),
 * and an 8-year time limit starting from the year the taxpayer first paid interest.
 * New regime denies entirely. Pinned: full-interest within window,
 * 8-year window upper boundary inclusive, post-window denial, regime-denied to zero,
 * the Section 80E + 115BAC citation chain. Citations: Section 80E, Section 115BAC (regime denial).
 */

import { computeSection80e } from '../../src/deductions/section-80e.js';
import { SECTIONS } from '../../src/citations/index.js';
import type { AssessmentYear } from '../../src/types/citation.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

describe('computeSection80e', () => {
  it('should allow the full interest paid in year 1 of the 8-year window', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 80_000,
      firstInterestPaymentAyStartYear: 2025,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(80_000);
  });

  it('should allow the full interest in year 8 (boundary inclusive)', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2018,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(50_000);
  });

  it('should deny the deduction past the 8-year window', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2015,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should deny when the first-interest-year is in the future (yearsElapsed < 1)', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2026,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should return zero under the new regime regardless of interest paid', () => {
    const result = computeSection80e({
      regime: 'NEW',
      interestPaid: 80_000,
      firstInterestPaymentAyStartYear: 2025,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should floor a negative interest amount at zero', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: -1_000,
      firstInterestPaymentAyStartYear: 2025,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should label the in-window step with the year-of-window number for receipt transparency', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 60_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.label).toMatch(/year 2/);
  });

  it('should cite Section 80E on every old-regime in-window computation', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: ASSESSMENT_YEAR,
    });
    const hasSec80E = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '80E',
    );
    expect(hasSec80E).toBe(true);
  });

  it('should label the regime-denied step exactly and zero the formula', () => {
    const result = computeSection80e({
      regime: 'NEW',
      interestPaid: 80_000,
      firstInterestPaymentAyStartYear: 2025,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toMatchObject({
      label: 'Section 80E not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime: 'NEW' },
      output: 0,
    });
  });

  it('should attach Section 80E and Section 115BAC citations on the regime-denied step', () => {
    const result = computeSection80e({
      regime: 'NEW',
      interestPaid: 80_000,
      firstInterestPaymentAyStartYear: 2025,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_80E, SECTIONS.SEC_115BAC]);
  });

  it('should fold Section 115BAC into the top-level citations under the new regime', () => {
    const result = computeSection80e({
      regime: 'NEW',
      interestPaid: 80_000,
      firstInterestPaymentAyStartYear: 2025,
      ay: ASSESSMENT_YEAR,
    });
    const has115BAC = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '115BAC',
    );
    expect(has115BAC).toBe(true);
  });

  it('should label the out-of-window step exactly and zero the formula past 8 years', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2015,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toMatchObject({
      label: 'Section 80E. 8-year window expired or not yet started',
      formula: 'deduction = 0 outside window',
      output: 0,
    });
  });

  it('should expose first-year, current-year, yearsElapsed and maxYears on the out-of-window inputs', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2015,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs).toMatchObject({
      firstInterestPaymentAyStartYear: 2015,
      currentAyStartYear: 2025,
      yearsElapsed: 11,
      maxYears: 8,
    });
  });

  it('should attach a single-element Section 80E citations array on the out-of-window step', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2015,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_80E]);
  });

  it('should label the in-window step formula exactly with the no-cap interest expression', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 60_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.formula).toBe('interest_paid (no cap, within 8-year window)');
  });

  it('should label the in-window step with the year-of-window count and 8-year max', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 60_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.label).toBe('Section 80E. Full interest paid (year 2 of 8)');
  });

  it('should expose interestPaid, yearsElapsed, maxYears, allowable on the in-window inputs', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 60_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs).toMatchObject({
      interestPaid: 60_000,
      yearsElapsed: 2,
      maxYears: 8,
      allowable: 60_000,
    });
  });

  it('should attach a single-element Section 80E citations array on the in-window step', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 60_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_80E]);
  });

  it('should fold Section 80E only (no extra sections) into the top-level citations on the in-window result', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 60_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations).toEqual([SECTIONS.SEC_80E]);
  });

  it('should deny one year past the 8-year window boundary (yearsElapsed = 9)', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2017,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should return exactly [SEC_80E] on the out-of-window old-regime path (kills [] / () => undefined mutants on result.citations)', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2015,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations).toEqual([SECTIONS.SEC_80E]);
  });

  it('should return exactly [SEC_80E, SEC_115BAC] on the new-regime denied path (kills [] mutant on the seed citations)', () => {
    const result = computeSection80e({
      regime: 'NEW',
      interestPaid: 80_000,
      firstInterestPaymentAyStartYear: 2025,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations).toEqual([SECTIONS.SEC_80E, SECTIONS.SEC_115BAC]);
  });

  it('should expose the guardRegime reason naming SEC_80E verbatim on the regime-denied step inputs', () => {
    const result = computeSection80e({
      regime: 'NEW',
      interestPaid: 80_000,
      firstInterestPaymentAyStartYear: 2025,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs?.reason).toBe(
      'Deduction denied under Section 115BAC(2). New regime does not permit SEC_80E',
    );
  });

  it('should treat a malformed AY (no AY prefix) as out-of-window and return zero (kills if-not-match -> false mutant)', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: 'GARBAGE' as AssessmentYear,
    });
    expect(result.value).toBe(0);
    expect(result.steps[0]?.label).toBe('Section 80E. 8-year window expired or not yet started');
  });

  it('should treat AY with leading characters before AY prefix as out-of-window (kills regex without ^ anchor)', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: 'FOOAY2025-26' as AssessmentYear,
    });
    expect(result.value).toBe(0);
    expect(result.steps[0]?.label).toBe('Section 80E. 8-year window expired or not yet started');
  });

  it('should treat AY with trailing characters after the two-digit suffix as out-of-window (kills regex without $ anchor)', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: 'AY2025-26ZZ' as AssessmentYear,
    });
    expect(result.value).toBe(0);
    expect(result.steps[0]?.label).toBe('Section 80E. 8-year window expired or not yet started');
  });

  it('should treat AY with mismatched end-two-digits as out-of-window (kills end-year-mismatch -> false mutant)', () => {
    const result = computeSection80e({
      regime: 'OLD',
      interestPaid: 50_000,
      firstInterestPaymentAyStartYear: 2024,
      ay: 'AY2025-99' as AssessmentYear,
    });
    expect(result.value).toBe(0);
    expect(result.steps[0]?.label).toBe('Section 80E. 8-year window expired or not yet started');
  });
});
