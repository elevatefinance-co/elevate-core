/* Tests for Section 80CCD. Three NPS deduction buckets, two computed here:
 *
 *   80CCD(1B) -- additional Rs. 50,000 over and above the
 *   80CCE pool. Old regime only.
 *
 *   80CCD(2) -- employer NPS contribution capped at 10 percent
 *   of salary (14 percent for Central / State Government per
 *   Finance Act 2019). The one Chapter VI-A deduction surviving
 *   Section 115BAC's carve-out.
 *
 * Pinned: 80CCD(1B) within-cap, 80CCD(1B) clamp at Rs. 50k, 80CCD(1B) regime-denied to zero,
 * 80CCD(2) private 10 percent cap, 80CCD(2) Central Govt 14 percent cap,
 * 80CCD(2) below-cap pass-through, 80CCD(2) survives new regime. Citations: Section 80CCD(1B),
 * Section 80CCD(2), Section 115BAC (regime denial for 1B; 2 survives).
 */

import {
  SECTION_80CCD_1B_CAP,
  SECTION_80CCD_2_GOVT_CAP_PCT,
  SECTION_80CCD_2_PRIVATE_CAP_PCT,
  computeSection80ccd1b,
  computeSection80ccd2,
} from '../../src/deductions/section-80ccd.js';
import { SECTIONS } from '../../src/citations/index.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

describe('80CCD constants', () => {
  it('should pin the 80CCD(1B) additional cap at Rs. 50,000', () => {
    expect(SECTION_80CCD_1B_CAP).toBe(50_000);
  });

  it('should pin the 80CCD(2) private-sector cap percentage at 10 percent', () => {
    expect(SECTION_80CCD_2_PRIVATE_CAP_PCT).toBe(0.1);
  });

  it('should pin the 80CCD(2) government cap percentage at 14 percent', () => {
    expect(SECTION_80CCD_2_GOVT_CAP_PCT).toBe(0.14);
  });
});

describe('computeSection80ccd1b', () => {
  it('should pass through an old-regime claim within the Rs. 50k cap', () => {
    const result = computeSection80ccd1b({
      regime: 'OLD',
      claim: 40_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(40_000);
  });

  it('should clamp an old-regime claim above the Rs. 50k cap', () => {
    const result = computeSection80ccd1b({
      regime: 'OLD',
      claim: 80_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(SECTION_80CCD_1B_CAP);
  });

  it('should return zero for a new-regime claim (denied)', () => {
    const result = computeSection80ccd1b({
      regime: 'NEW',
      claim: 50_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
    const hasSec115BAC = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '115BAC',
    );
    expect(hasSec115BAC).toBe(true);
  });

  it('should floor a negative claim at zero', () => {
    const result = computeSection80ccd1b({
      regime: 'OLD',
      claim: -1_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should cite Section 80CCD(1B) on every old-regime computation', () => {
    const result = computeSection80ccd1b({
      regime: 'OLD',
      claim: 30_000,
      ay: ASSESSMENT_YEAR,
    });
    const hasSec80CCD1B = result.citations.some(
      (citation) =>
        citation.kind === 'section' && citation.section === '80CCD' && citation.subSection === '1B',
    );
    expect(hasSec80CCD1B).toBe(true);
  });

  it('should pass through a claim exactly at the Rs. 50,000 cap boundary', () => {
    const result = computeSection80ccd1b({
      regime: 'OLD',
      claim: SECTION_80CCD_1B_CAP,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(SECTION_80CCD_1B_CAP);
  });

  it('should label the regime-denied step exactly and zero the formula', () => {
    const result = computeSection80ccd1b({
      regime: 'NEW',
      claim: 50_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toMatchObject({
      label: 'Section 80CCD(1B) not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime: 'NEW' },
      output: 0,
    });
  });

  it('should attach Section 80CCD(1B) and Section 115BAC citations on the regime-denied step', () => {
    const result = computeSection80ccd1b({
      regime: 'NEW',
      claim: 50_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_80CCD_1B, SECTIONS.SEC_115BAC]);
  });

  it('should label the within-cap step with the locale-formatted Rs. 50,000 string', () => {
    const result = computeSection80ccd1b({
      regime: 'OLD',
      claim: 30_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.label).toBe('Section 80CCD(1B). Additional Rs. 50,000');
  });

  it('should label the within-cap step formula exactly as min(claim, 50000)', () => {
    const result = computeSection80ccd1b({
      regime: 'OLD',
      claim: 30_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.formula).toBe('min(claim, 50000)');
  });

  it('should attach a single-element Section 80CCD(1B) citations array on the within-cap step', () => {
    const result = computeSection80ccd1b({
      regime: 'OLD',
      claim: 30_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_80CCD_1B]);
  });

  it('should pass claim, cap, allowable into the within-cap step inputs', () => {
    const result = computeSection80ccd1b({
      regime: 'OLD',
      claim: 30_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs).toMatchObject({
      claim: 30_000,
      cap: SECTION_80CCD_1B_CAP,
      allowable: 30_000,
    });
  });
});

describe('computeSection80ccd2', () => {
  it('should apply the 10 percent salary cap for a private-sector employee under the new regime (still allowed)', () => {
    const result = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 200_000,
      salaryForLimitComputation: 1_800_000,
      employeeCategory: 'PRIVATE',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(180_000);
  });

  it('should apply the 14 percent salary cap for a Central Government employee', () => {
    const result = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 300_000,
      salaryForLimitComputation: 1_800_000,
      employeeCategory: 'CENTRAL_GOVT',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(252_000);
  });

  it('should apply the 14 percent salary cap for a State Government employee', () => {
    const result = computeSection80ccd2({
      regime: 'OLD',
      employerContribution: 300_000,
      salaryForLimitComputation: 1_500_000,
      employeeCategory: 'STATE_GOVT',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(210_000);
  });

  it('should pass through actual contribution when below the salary-linked cap', () => {
    const result = computeSection80ccd2({
      regime: 'OLD',
      employerContribution: 50_000,
      salaryForLimitComputation: 1_800_000,
      employeeCategory: 'PRIVATE',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(50_000);
  });

  it('should floor a negative employer contribution at zero', () => {
    const result = computeSection80ccd2({
      regime: 'OLD',
      employerContribution: -1_000,
      salaryForLimitComputation: 1_800_000,
      employeeCategory: 'PRIVATE',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should cite Section 80CCD(2) on every computation', () => {
    const result = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 50_000,
      salaryForLimitComputation: 1_000_000,
      employeeCategory: 'PRIVATE',
      ay: ASSESSMENT_YEAR,
    });
    const hasSec80CCD2 = result.citations.some(
      (citation) =>
        citation.kind === 'section' && citation.section === '80CCD' && citation.subSection === '2',
    );
    expect(hasSec80CCD2).toBe(true);
  });

  it('should label the private-sector step with 10% of salary exactly', () => {
    const result = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 50_000,
      salaryForLimitComputation: 1_000_000,
      employeeCategory: 'PRIVATE',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.label).toBe(
      'Section 80CCD(2). Employer NPS contribution, capped at 10% of salary',
    );
  });

  it('should label the Central Government step with 14% of salary exactly', () => {
    const result = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 50_000,
      salaryForLimitComputation: 1_000_000,
      employeeCategory: 'CENTRAL_GOVT',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.label).toBe(
      'Section 80CCD(2). Employer NPS contribution, capped at 14% of salary',
    );
  });

  it('should label the State Government step with 14% of salary exactly', () => {
    const result = computeSection80ccd2({
      regime: 'OLD',
      employerContribution: 50_000,
      salaryForLimitComputation: 1_000_000,
      employeeCategory: 'STATE_GOVT',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.label).toBe(
      'Section 80CCD(2). Employer NPS contribution, capped at 14% of salary',
    );
  });

  it('should label the step formula exactly as min(employer_contribution, salary x cap_pct)', () => {
    const result = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 50_000,
      salaryForLimitComputation: 1_000_000,
      employeeCategory: 'PRIVATE',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.formula).toBe('min(employer_contribution, salary x cap_pct)');
  });

  it('should expose the salary-linked cap and rate on the step inputs for receipt transparency', () => {
    const result = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 50_000,
      salaryForLimitComputation: 1_000_000,
      employeeCategory: 'PRIVATE',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs).toMatchObject({
      employerContribution: 50_000,
      salaryForLimitComputation: 1_000_000,
      rateCap: SECTION_80CCD_2_PRIVATE_CAP_PCT,
      salaryLinkedCap: 100_000,
      allowable: 50_000,
    });
  });

  it('should attach a single-element Section 80CCD(2) citations array on the step', () => {
    const result = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 50_000,
      salaryForLimitComputation: 1_000_000,
      employeeCategory: 'PRIVATE',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_80CCD_2]);
  });

  it('should pass through a contribution exactly at the salary-linked cap boundary', () => {
    const result = computeSection80ccd2({
      regime: 'OLD',
      employerContribution: 100_000,
      salaryForLimitComputation: 1_000_000,
      employeeCategory: 'PRIVATE',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(100_000);
  });

  it('should fold steps citations into result.citations on the live path (kills () => undefined flatMap mutant)', () => {
    const result = computeSection80ccd2({
      regime: 'NEW',
      employerContribution: 50_000,
      salaryForLimitComputation: 1_000_000,
      employeeCategory: 'PRIVATE',
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations).toEqual([SECTIONS.SEC_80CCD_2]);
  });
});

describe('computeSection80ccd1b -- result.citations exactness', () => {
  it('should return exactly [SEC_80CCD_1B] on the in-window old-regime path (kills () => undefined flatMap mutant)', () => {
    const result = computeSection80ccd1b({
      regime: 'OLD',
      claim: 30_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations).toEqual([SECTIONS.SEC_80CCD_1B]);
  });

  it('should return exactly [SEC_80CCD_1B, SEC_115BAC] on the new-regime denied path', () => {
    const result = computeSection80ccd1b({
      regime: 'NEW',
      claim: 50_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations).toEqual([SECTIONS.SEC_80CCD_1B, SECTIONS.SEC_115BAC]);
  });

  it('should expose the guardRegime reason naming SEC_80CCD_1B verbatim on the regime-denied step inputs', () => {
    const result = computeSection80ccd1b({
      regime: 'NEW',
      claim: 50_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs?.reason).toBe(
      'Deduction denied under Section 115BAC(2). New regime does not permit SEC_80CCD_1B',
    );
  });
});
