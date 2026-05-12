/* Tests for Section 80C. The single most-used deduction. Cap architecture:
 * Section 80CCE consolidates 80C + 80CCC + 80CCD(1) into a single overall Rs. 1.5L ceiling.
 * New regime denies the entire deduction. Pinned: regime-denial path, within-cap pass-through,
 * above-cap clamp at Rs. 1.5L, combined-cap with 80CCC and 80CCD(1) flowing into the same pool,
 * and the Section 80C / 80CCC / 80CCD(1) / 115BAC citation chain. Citations: Section 80C,
 * Section 80CCC, Section 80CCD(1), Section 115BAC (regime denial).
 */

import { SECTION_80C_CAP_COMBINED, computeSection80c } from '../../src/deductions/section-80c.js';
import { SECTIONS } from '../../src/citations/index.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

describe('SECTION_80C_CAP_COMBINED', () => {
  it('should pin the combined 80CCE cap at Rs. 1,50,000', () => {
    expect(SECTION_80C_CAP_COMBINED).toBe(150_000);
  });
});

describe('computeSection80c', () => {
  it('should return zero under the new regime regardless of claim amount', () => {
    const result = computeSection80c({
      regime: 'NEW',
      claim: { ppfContribution: 150_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
    const hasSec115BAC = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '115BAC',
    );
    expect(hasSec115BAC).toBe(true);
  });

  it('should return the full claim under the old regime when within cap', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: {
        ppfContribution: 80_000,
        elssInvestment: 30_000,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(110_000);
  });

  it('should clamp at Rs. 1.5L when the combined claim exceeds the cap', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: {
        ppfContribution: 150_000,
        lifeInsurancePremium: 50_000,
        childrenTuition: 40_000,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(SECTION_80C_CAP_COMBINED);
  });

  it('should include 80CCC (pension) and 80CCD(1) (NPS employee) within the same Rs. 1.5L pool', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: {
        ppfContribution: 100_000,
        section80ccc: 30_000,
        section80ccd1: 40_000,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(SECTION_80C_CAP_COMBINED);
  });

  it('should aggregate every breakdown field with undefined treated as zero', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: {
        lifeInsurancePremium: 20_000,
        ppfContribution: 30_000,
        elssInvestment: 0,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(50_000);
  });

  it('should emit a sum-of-claims step and an apply-cap step under the old regime', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { ppfContribution: 100_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps.length).toBeGreaterThanOrEqual(2);
    expect(result.steps[0]?.label).toMatch(/Sum of 80C/);
    expect(result.steps[1]?.label).toMatch(/cap|80CCE/);
  });

  it('should cite Section 80C, 80CCC, 80CCD(1) on the old-regime sum step', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { ppfContribution: 100_000 },
      ay: ASSESSMENT_YEAR,
    });
    const sumStep = result.steps[0];
    const has80C = sumStep?.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '80C',
    );
    const has80CCC = sumStep?.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '80CCC',
    );
    const has80CCD1 = sumStep?.citations.some(
      (citation) =>
        citation.kind === 'section' && citation.section === '80CCD' && citation.subSection === '1',
    );
    expect(has80C).toBe(true);
    expect(has80CCC).toBe(true);
    expect(has80CCD1).toBe(true);
  });

  it('should aggregate epfEmployeeContribution into the sum', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { epfEmployeeContribution: 60_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(60_000);
  });

  it('should aggregate nscInvestment into the sum', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { nscInvestment: 40_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(40_000);
  });

  it('should aggregate homeLoanPrincipal into the sum', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { homeLoanPrincipal: 70_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(70_000);
  });

  it('should aggregate childrenTuition into the sum', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { childrenTuition: 35_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(35_000);
  });

  it('should aggregate sukanyaSamriddhi into the sum', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { sukanyaSamriddhi: 25_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(25_000);
  });

  it('should aggregate seniorCitizenSavings into the sum', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { seniorCitizenSavings: 15_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(15_000);
  });

  it('should aggregate fdWithLockIn into the sum', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { fdWithLockIn: 22_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(22_000);
  });

  it('should aggregate the other field into the sum', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { other: 11_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(11_000);
  });

  it('should clamp at exactly the Rs. 1,50,000 cap when claim equals the ceiling', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { ppfContribution: 150_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(150_000);
  });

  it('should label the regime-denied step exactly and zero the formula', () => {
    const result = computeSection80c({
      regime: 'NEW',
      claim: { ppfContribution: 50_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toMatchObject({
      label: 'Section 80C not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime: 'NEW' },
      output: 0,
    });
  });

  it('should attach Section 80C and Section 115BAC citations to the regime-denied step', () => {
    const result = computeSection80c({
      regime: 'NEW',
      claim: { ppfContribution: 50_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_80C, SECTIONS.SEC_115BAC]);
  });

  it('should include Section 80C and Section 115BAC at the top-level citations under the new regime', () => {
    const result = computeSection80c({
      regime: 'NEW',
      claim: { ppfContribution: 50_000 },
      ay: ASSESSMENT_YEAR,
    });
    const sectionKeys = result.citations
      .filter((citation) => citation.kind === 'section')
      .map((citation) =>
        citation.kind === 'section'
          ? `${citation.section}${citation.subSection ? `(${citation.subSection})` : ''}`
          : '',
      );
    expect(sectionKeys).toContain('80C');
    expect(sectionKeys).toContain('115BAC');
  });

  it('should label the sum-of-claims step exactly with the per-instrument formula', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { ppfContribution: 100_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]).toMatchObject({
      label: 'Sum of 80C / 80CCC / 80CCD(1) claims',
      formula: 'sum(each instrument amount)',
      inputs: { totalClaim: 100_000 },
      output: 100_000,
    });
  });

  it('should label the cap step exactly with min(claim, cap) formula and matching inputs', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { ppfContribution: 200_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[1]).toMatchObject({
      label: 'Apply combined Rs. 1,50,000 cap (Section 80CCE)',
      formula: 'min(claim, cap)',
      inputs: {
        claim: 200_000,
        cap: SECTION_80C_CAP_COMBINED,
        allowable: SECTION_80C_CAP_COMBINED,
      },
      output: SECTION_80C_CAP_COMBINED,
    });
  });

  it('should attach Section 80C, 80CCC, 80CCD(1) citations array on the sum step in declared order', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { ppfContribution: 100_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.citations).toEqual([
      SECTIONS.SEC_80C,
      SECTIONS.SEC_80CCC,
      SECTIONS.SEC_80CCD_1,
    ]);
  });

  it('should attach a single-element Section 80C citations array on the cap step', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { ppfContribution: 100_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[1]?.citations).toEqual([SECTIONS.SEC_80C]);
  });

  it('should fold step citations into the top-level citations under the old regime', () => {
    const result = computeSection80c({
      regime: 'OLD',
      claim: { ppfContribution: 100_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations.length).toBeGreaterThan(0);
    const has80CCC = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '80CCC',
    );
    expect(has80CCC).toBe(true);
  });

  it('should expose the guardRegime reason naming SEC_80C verbatim on the regime-denied step inputs', () => {
    const result = computeSection80c({
      regime: 'NEW',
      claim: { ppfContribution: 50_000 },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs?.reason).toBe(
      'Deduction denied under Section 115BAC(2). New regime does not permit SEC_80C',
    );
  });
});
