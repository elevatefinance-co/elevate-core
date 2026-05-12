/* Tests for Sections 80TTA and 80TTB. Two sister deductions,
 * mutually exclusive based on senior-citizen status.
 * 80TTA applies only to non-seniors and only to savings-account interest, capped at Rs. 10,000.
 * 80TTB applies only to seniors (60+) and to ANY deposit interest (savings + FD + RD + post office),
 * capped at Rs. 50,000. New regime denies both. Pinned: 80TTA non-senior within cap,
 * 80TTA above cap clamped, 80TTA blocked for senior, 80TTB senior within cap, 80TTB above cap clamped,
 * 80TTB blocked for non-senior, both denied under new regime,
 * the Section 80TTA / 80TTB / 115BAC citation chain. Citations: Section 80TTA, Section 80TTB,
 * Section 115BAC (regime denial).
 */

import { SECTIONS } from '../../src/citations/index.js';
import {
  SECTION_80TTA_CAP,
  SECTION_80TTB_CAP,
  computeSection80tta,
  computeSection80ttb,
} from '../../src/deductions/section-80tta-ttb.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

describe('80TTA and 80TTB constants', () => {
  it('should pin the 80TTA cap at Rs. 10,000', () => {
    expect(SECTION_80TTA_CAP).toBe(10_000);
  });

  it('should pin the 80TTB cap at Rs. 50,000', () => {
    expect(SECTION_80TTB_CAP).toBe(50_000);
  });
});

describe('computeSection80tta', () => {
  it('should pass through a non-senior claim within the Rs. 10k cap', () => {
    const result = computeSection80tta({
      regime: 'OLD',
      savingsInterest: 8_000,
      isSeniorCitizen: false,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(8_000);
  });

  it('should clamp a non-senior claim above Rs. 10k', () => {
    const result = computeSection80tta({
      regime: 'OLD',
      savingsInterest: 25_000,
      isSeniorCitizen: false,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(SECTION_80TTA_CAP);
  });

  it('should block a senior from claiming 80TTA (must use 80TTB instead)', () => {
    const result = computeSection80tta({
      regime: 'OLD',
      savingsInterest: 8_000,
      isSeniorCitizen: true,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
    const hasSec80TTB = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '80TTB',
    );
    expect(hasSec80TTB).toBe(true);
  });

  it('should return zero under the new regime', () => {
    const result = computeSection80tta({
      regime: 'NEW',
      savingsInterest: 8_000,
      isSeniorCitizen: false,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should floor a negative savings-interest amount at zero', () => {
    const result = computeSection80tta({
      regime: 'OLD',
      savingsInterest: -100,
      isSeniorCitizen: false,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should cite Section 80TTA on every computation', () => {
    const result = computeSection80tta({
      regime: 'OLD',
      savingsInterest: 5_000,
      isSeniorCitizen: false,
      ay: ASSESSMENT_YEAR,
    });
    const hasSec80TTA = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '80TTA',
    );
    expect(hasSec80TTA).toBe(true);
  });

  describe('regime-denial branch (mutation kill-tests)', () => {
    it('should emit exactly one step with pinned label, formula, inputs, output, and citations under NEW regime', () => {
      const result = computeSection80tta({
        regime: 'NEW',
        savingsInterest: 8_000,
        isSeniorCitizen: false,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toMatchObject({
        label: 'Section 80TTA not available. New regime',
        formula: 'deduction = 0',
        inputs: { regime: 'NEW' },
        output: 0,
        citations: [SECTIONS.SEC_80TTA, SECTIONS.SEC_115BAC],
      });
    });

    it('should expose result.citations as exactly [SEC_80TTA, SEC_115BAC] (deduped) under NEW regime', () => {
      const result = computeSection80tta({
        regime: 'NEW',
        savingsInterest: 8_000,
        isSeniorCitizen: false,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.citations).toEqual([SECTIONS.SEC_80TTA, SECTIONS.SEC_115BAC]);
    });
  });

  describe('senior-blocked branch (mutation kill-tests)', () => {
    it('should emit exactly one step with pinned label, formula, inputs, output, and citations when blocked for senior', () => {
      const result = computeSection80tta({
        regime: 'OLD',
        savingsInterest: 8_000,
        isSeniorCitizen: true,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toMatchObject({
        label: 'Section 80TTA blocked. Senior citizen claims 80TTB instead',
        formula: 'deduction = 0',
        inputs: { isSeniorCitizen: 'true' },
        output: 0,
        citations: [SECTIONS.SEC_80TTA, SECTIONS.SEC_80TTB],
      });
    });

    it('should expose result.citations as exactly [SEC_80TTA, SEC_80TTB] (deduped) when blocked for senior', () => {
      const result = computeSection80tta({
        regime: 'OLD',
        savingsInterest: 8_000,
        isSeniorCitizen: true,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.citations).toEqual([SECTIONS.SEC_80TTA, SECTIONS.SEC_80TTB]);
    });
  });

  describe('non-senior eligible branch (mutation kill-tests)', () => {
    it('should emit a single allowable step with pinned label, formula, inputs, output, and citations for a non-senior within the cap', () => {
      const result = computeSection80tta({
        regime: 'OLD',
        savingsInterest: 7_500,
        isSeniorCitizen: false,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toMatchObject({
        label: 'Section 80TTA. Savings interest, cap Rs. 10,000',
        formula: 'min(savings_interest, 10000)',
        inputs: { savingsInterest: 7_500, cap: 10_000, allowable: 7_500 },
        output: 7_500,
        citations: [SECTIONS.SEC_80TTA],
      });
    });

    it('should yield distinct allowable values for senior=true (zero) vs senior=false (passthrough) at identical interest', () => {
      const seniorResult = computeSection80tta({
        regime: 'OLD',
        savingsInterest: 8_000,
        isSeniorCitizen: true,
        ay: ASSESSMENT_YEAR,
      });
      const nonSeniorResult = computeSection80tta({
        regime: 'OLD',
        savingsInterest: 8_000,
        isSeniorCitizen: false,
        ay: ASSESSMENT_YEAR,
      });
      expect(seniorResult.value).toBe(0);
      expect(nonSeniorResult.value).toBe(8_000);
      expect(seniorResult.steps[0]?.label).toBe(
        'Section 80TTA blocked. Senior citizen claims 80TTB instead',
      );
      expect(nonSeniorResult.steps[0]?.label).toBe(
        'Section 80TTA. Savings interest, cap Rs. 10,000',
      );
    });

    it('should aggregate result.citations to exactly [SEC_80TTA] (deduped) for a non-senior eligible path', () => {
      const result = computeSection80tta({
        regime: 'OLD',
        savingsInterest: 5_000,
        isSeniorCitizen: false,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.citations).toEqual([SECTIONS.SEC_80TTA]);
    });
  });
});

describe('computeSection80ttb', () => {
  it('should pass through a senior claim within the Rs. 50k cap', () => {
    const result = computeSection80ttb({
      regime: 'OLD',
      depositInterest: 45_000,
      isSeniorCitizen: true,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(45_000);
  });

  it('should clamp a senior claim above Rs. 50k', () => {
    const result = computeSection80ttb({
      regime: 'OLD',
      depositInterest: 80_000,
      isSeniorCitizen: true,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(SECTION_80TTB_CAP);
  });

  it('should block a non-senior from claiming 80TTB (must use 80TTA instead)', () => {
    const result = computeSection80ttb({
      regime: 'OLD',
      depositInterest: 30_000,
      isSeniorCitizen: false,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
    const hasSec80TTA = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '80TTA',
    );
    expect(hasSec80TTA).toBe(true);
  });

  it('should return zero under the new regime', () => {
    const result = computeSection80ttb({
      regime: 'NEW',
      depositInterest: 45_000,
      isSeniorCitizen: true,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should cite Section 80TTB on every senior-eligible computation', () => {
    const result = computeSection80ttb({
      regime: 'OLD',
      depositInterest: 30_000,
      isSeniorCitizen: true,
      ay: ASSESSMENT_YEAR,
    });
    const hasSec80TTB = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '80TTB',
    );
    expect(hasSec80TTB).toBe(true);
  });

  describe('regime-denial branch (mutation kill-tests)', () => {
    it('should emit exactly one step with pinned label, formula, inputs, output, and citations under NEW regime', () => {
      const result = computeSection80ttb({
        regime: 'NEW',
        depositInterest: 45_000,
        isSeniorCitizen: true,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toMatchObject({
        label: 'Section 80TTB not available. New regime',
        formula: 'deduction = 0',
        inputs: { regime: 'NEW' },
        output: 0,
        citations: [SECTIONS.SEC_80TTB, SECTIONS.SEC_115BAC],
      });
    });

    it('should expose result.citations as exactly [SEC_80TTB, SEC_115BAC] (deduped) under NEW regime', () => {
      const result = computeSection80ttb({
        regime: 'NEW',
        depositInterest: 45_000,
        isSeniorCitizen: true,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.citations).toEqual([SECTIONS.SEC_80TTB, SECTIONS.SEC_115BAC]);
    });
  });

  describe('non-senior-blocked branch (mutation kill-tests)', () => {
    it('should emit exactly one step with pinned label, formula, inputs, output, and citations when blocked for non-senior', () => {
      const result = computeSection80ttb({
        regime: 'OLD',
        depositInterest: 30_000,
        isSeniorCitizen: false,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toMatchObject({
        label: 'Section 80TTB blocked. Non-senior must claim 80TTA instead',
        formula: 'deduction = 0',
        inputs: { isSeniorCitizen: 'false' },
        output: 0,
        citations: [SECTIONS.SEC_80TTB, SECTIONS.SEC_80TTA],
      });
    });

    it('should expose result.citations as exactly [SEC_80TTB, SEC_80TTA] (deduped) when blocked for non-senior', () => {
      const result = computeSection80ttb({
        regime: 'OLD',
        depositInterest: 30_000,
        isSeniorCitizen: false,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.citations).toEqual([SECTIONS.SEC_80TTB, SECTIONS.SEC_80TTA]);
    });
  });

  describe('senior eligible branch (mutation kill-tests)', () => {
    it('should emit a single allowable step with pinned label, formula, inputs, output, and citations for a senior within the cap', () => {
      const result = computeSection80ttb({
        regime: 'OLD',
        depositInterest: 35_000,
        isSeniorCitizen: true,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toMatchObject({
        label: 'Section 80TTB. Senior deposit interest, cap Rs. 50,000',
        formula: 'min(deposit_interest, 50000)',
        inputs: { depositInterest: 35_000, cap: 50_000, allowable: 35_000 },
        output: 35_000,
        citations: [SECTIONS.SEC_80TTB],
      });
    });

    it('should yield distinct allowable values for senior=true (passthrough) vs senior=false (zero) at identical interest', () => {
      const seniorResult = computeSection80ttb({
        regime: 'OLD',
        depositInterest: 30_000,
        isSeniorCitizen: true,
        ay: ASSESSMENT_YEAR,
      });
      const nonSeniorResult = computeSection80ttb({
        regime: 'OLD',
        depositInterest: 30_000,
        isSeniorCitizen: false,
        ay: ASSESSMENT_YEAR,
      });
      expect(seniorResult.value).toBe(30_000);
      expect(nonSeniorResult.value).toBe(0);
      expect(seniorResult.steps[0]?.label).toBe(
        'Section 80TTB. Senior deposit interest, cap Rs. 50,000',
      );
      expect(nonSeniorResult.steps[0]?.label).toBe(
        'Section 80TTB blocked. Non-senior must claim 80TTA instead',
      );
    });

    it('should floor a negative deposit-interest amount at zero (Math.max guard)', () => {
      const result = computeSection80ttb({
        regime: 'OLD',
        depositInterest: -500,
        isSeniorCitizen: true,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.value).toBe(0);
    });

    it('should aggregate result.citations to exactly [SEC_80TTB] (deduped) for a senior eligible path', () => {
      const result = computeSection80ttb({
        regime: 'OLD',
        depositInterest: 25_000,
        isSeniorCitizen: true,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.citations).toEqual([SECTIONS.SEC_80TTB]);
    });
  });
});

describe('computeSection80tta and computeSection80ttb -- regime denial reason strings (mutation kill-tests)', () => {
  it('should expose the guardRegime reason naming SEC_80TTA verbatim on the regime-denied step inputs', () => {
    const result = computeSection80tta({
      regime: 'NEW',
      savingsInterest: 8_000,
      isSeniorCitizen: false,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs?.reason).toBe(
      'Deduction denied under Section 115BAC(2). New regime does not permit SEC_80TTA',
    );
  });

  it('should expose the guardRegime reason naming SEC_80TTB verbatim on the regime-denied step inputs', () => {
    const result = computeSection80ttb({
      regime: 'NEW',
      depositInterest: 25_000,
      isSeniorCitizen: true,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps[0]?.inputs?.reason).toBe(
      'Deduction denied under Section 115BAC(2). New regime does not permit SEC_80TTB',
    );
  });
});
