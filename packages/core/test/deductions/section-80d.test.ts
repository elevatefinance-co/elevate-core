/* Tests for Section 80D. Two independent buckets: self+family and parents. Each bucket caps at Rs.
 * 25,000 (no senior) or Rs. 50,000 (any senior in the bucket).
 * Preventive health check-up sub-limit of Rs.
 * 5,000 sits WITHIN each bucket (does NOT add on top -- the load-bearing rule that DIY tools get wrong).
 * New regime denies entirely. Pinned: regime-denied, non-senior cap, senior cap, both-bucket additive,
 * PHC-within-bucket sub-limit, and the Section 80D + 115BAC citation chain. Citations: Section 80D,
 * Section 115BAC (regime denial).
 */

import { computeSection80d } from '../../src/deductions/section-80d.js';
import { SECTIONS } from '../../src/citations/index.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

describe('computeSection80d', () => {
  it('should return zero under the new regime regardless of premium', () => {
    const result = computeSection80d({
      regime: 'NEW',
      claim: {
        selfFamilyPremium: 20_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should clamp the self+family bucket at Rs. 25,000 when no senior is covered', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 30_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(25_000);
  });

  it('should raise the self+family cap to Rs. 50,000 when a senior is covered in the bucket', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 60_000,
        anySelfFamilySenior: true,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(50_000);
  });

  it('should add both buckets and apply each cap independently', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 22_000,
        selfFamilyPreventiveHealthCheckup: 5_000,
        anySelfFamilySenior: false,
        parentsPremium: 45_000,
        parentsPreventiveHealthCheckup: 7_000,
        anyParentSenior: true,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(25_000 + 50_000);
  });

  it('should cap preventive-health-checkup alone at Rs. 5,000 within a bucket', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 0,
        selfFamilyPreventiveHealthCheckup: 12_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(5_000);
  });

  it('should keep the parents-bucket cap at Rs. 25,000 when no parent is senior', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 0,
        anySelfFamilySenior: false,
        parentsPremium: 30_000,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(25_000);
  });

  it('should keep PHC within the bucket cap (does not add on top of the bucket ceiling)', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 49_000,
        selfFamilyPreventiveHealthCheckup: 5_000,
        anySelfFamilySenior: true,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(50_000);
  });

  it('should cite Section 80D on every old-regime computation', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 20_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    const hasSec80D = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '80D',
    );
    expect(hasSec80D).toBe(true);
  });

  it('should label the regime-denied step exactly and zero the formula', () => {
    const result = computeSection80d({
      regime: 'NEW',
      claim: {
        selfFamilyPremium: 20_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toMatchObject({
      label: 'Section 80D not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime: 'NEW' },
      output: 0,
    });
  });

  it('should attach Section 80D and Section 115BAC citations on the regime-denied step', () => {
    const result = computeSection80d({
      regime: 'NEW',
      claim: {
        selfFamilyPremium: 20_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_80D, SECTIONS.SEC_115BAC]);
  });

  it('should fold Section 115BAC into the top-level citations under the new regime', () => {
    const result = computeSection80d({
      regime: 'NEW',
      claim: {
        selfFamilyPremium: 20_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    const has115BAC = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '115BAC',
    );
    expect(has115BAC).toBe(true);
  });

  it('should label the self+family non-senior step with cap Rs. 25,000 and no senior suffix', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 10_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.label).toBe('Self + family bucket. Cap Rs. 25,000');
  });

  it('should label the self+family senior step with cap Rs. 50,000 and "(senior)" suffix', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 10_000,
        anySelfFamilySenior: true,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.label).toBe('Self + family bucket. Cap Rs. 50,000 (senior)');
  });

  it('should label the parents non-senior step with cap Rs. 25,000 and no senior suffix', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 0,
        anySelfFamilySenior: false,
        parentsPremium: 10_000,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[1]?.label).toBe('Parents bucket. Cap Rs. 25,000');
  });

  it('should label the parents senior step with cap Rs. 50,000 and "(senior)" suffix', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 0,
        anySelfFamilySenior: false,
        parentsPremium: 10_000,
        anyParentSenior: true,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[1]?.label).toBe('Parents bucket. Cap Rs. 50,000 (senior)');
  });

  it('should label the self+family step formula exactly with the bucket-cap min expression', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 10_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.formula).toBe('min(premium + min(phc, 5000), bucket_cap)');
  });

  it('should label the parents step formula exactly with the parents-cap min expression', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 0,
        anySelfFamilySenior: false,
        parentsPremium: 10_000,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[1]?.formula).toBe(
      'min(parents_premium + min(parents_phc, 5000), parent_cap)',
    );
  });

  it('should pass the supplied self+family premium through to the step inputs verbatim (kills ?? -> && mutation)', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 18_000,
        selfFamilyPreventiveHealthCheckup: 4_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs).toMatchObject({
      premium: 18_000,
      phc: 4_000,
    });
  });

  it('should pass the supplied parents premium through to the step inputs verbatim (kills ?? -> && mutation)', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 0,
        anySelfFamilySenior: false,
        parentsPremium: 17_000,
        parentsPreventiveHealthCheckup: 3_000,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[1]?.inputs).toMatchObject({
      premium: 17_000,
      phc: 3_000,
    });
  });

  it('should default missing self+family premium and PHC fields to zero in the step inputs', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs).toMatchObject({ premium: 0, phc: 0 });
  });

  it('should default missing parents premium and PHC fields to zero in the step inputs', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[1]?.inputs).toMatchObject({ premium: 0, phc: 0 });
  });

  it('should label the total step exactly with self_bucket + parents_bucket formula', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 20_000,
        anySelfFamilySenior: false,
        parentsPremium: 30_000,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[2]).toMatchObject({
      label: 'Total Section 80D allowable',
      formula: 'self_bucket + parents_bucket',
      inputs: { selfBucket: 20_000, parentsBucket: 25_000, total: 45_000 },
      output: 45_000,
    });
  });

  it('should attach a single-element Section 80D citations array on each old-regime step', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 10_000,
        anySelfFamilySenior: false,
        parentsPremium: 10_000,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_80D]);
    expect(result.steps[1]?.citations).toEqual([SECTIONS.SEC_80D]);
    expect(result.steps[2]?.citations).toEqual([SECTIONS.SEC_80D]);
  });

  it('should distinguish senior from super-senior caps at the Rs. 50,000 boundary', () => {
    const seniorResult = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 50_000,
        anySelfFamilySenior: true,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    const nonSeniorResult = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 50_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(seniorResult.value).toBe(50_000);
    expect(nonSeniorResult.value).toBe(25_000);
  });

  it('should emit the steps array with three entries under the old regime (kills empty-array mutation)', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 10_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(3);
  });

  it('should return exactly [SEC_80D] on the old-regime live path (kills () => undefined flatMap mutant)', () => {
    const result = computeSection80d({
      regime: 'OLD',
      claim: {
        selfFamilyPremium: 10_000,
        anySelfFamilySenior: false,
        parentsPremium: 10_000,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations).toEqual([SECTIONS.SEC_80D]);
  });

  it('should return exactly [SEC_80D, SEC_115BAC] on the new-regime denied path (kills [] mutant on the seed citations)', () => {
    const result = computeSection80d({
      regime: 'NEW',
      claim: {
        selfFamilyPremium: 20_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.citations).toEqual([SECTIONS.SEC_80D, SECTIONS.SEC_115BAC]);
  });

  it('should expose the guardRegime reason naming SEC_80D verbatim on the regime-denied step inputs', () => {
    const result = computeSection80d({
      regime: 'NEW',
      claim: {
        selfFamilyPremium: 20_000,
        anySelfFamilySenior: false,
        anyParentSenior: false,
      },
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs?.reason).toBe(
      'Deduction denied under Section 115BAC(2). New regime does not permit SEC_80D',
    );
  });
});
