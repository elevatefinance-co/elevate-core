/* Tests for Section 80G. Donations to approved charitable institutions. Four interacting variables:
 * rate (50 / 100 percent), AGTI cap (with-limit donations capped at 10 percent of AGTI;
 * no-limit donations not capped), mode (cash > Rs. 2,000 disqualified per Finance Act 2017),
 * and 80G(5) approval (caller attests). New regime denies entirely. Pinned: 100-percent-no-limit,
 * 50-percent-with-limit clamped at AGTI cap, cash-above-Rs-2000 disqualified,
 * cash-at-or-below-Rs-2000 allowed, regime-denied to zero, no-limit + with-limit combination,
 * the Section 80G + 115BAC citation chain. Citations: Section 80G, Section 115BAC (regime denial),
 * Finance Act 2017 (cash > Rs. 2,000 disqualification).
 */

import { SECTIONS } from '../../src/citations/index.js';
import { computeSection80g } from '../../src/deductions/section-80g.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

describe('computeSection80g', () => {
  it('should allow a 100 percent no-limit donation in full', () => {
    const result = computeSection80g({
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
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(50_000);
  });

  it('should clamp a 50 percent with-limit donation at 10 percent of AGTI', () => {
    const result = computeSection80g({
      regime: 'OLD',
      donations: [{ category: '50_PCT_WITH_LIMIT', amount: 500_000, mode: 'NON_CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(100_000);
  });

  it('should disqualify a cash donation above Rs. 2,000 entirely (Finance Act 2017)', () => {
    const result = computeSection80g({
      regime: 'OLD',
      donations: [{ category: '100_PCT_NO_LIMIT', amount: 5_000, mode: 'CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should allow a cash donation at or below Rs. 2,000', () => {
    const result = computeSection80g({
      regime: 'OLD',
      donations: [{ category: '100_PCT_NO_LIMIT', amount: 1_500, mode: 'CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(1_500);
  });

  it('should return zero under the new regime regardless of donations', () => {
    const result = computeSection80g({
      regime: 'NEW',
      donations: [{ category: '100_PCT_NO_LIMIT', amount: 50_000, mode: 'NON_CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(0);
  });

  it('should sum no-limit and capped with-limit donations correctly', () => {
    const result = computeSection80g({
      regime: 'OLD',
      donations: [
        { category: '100_PCT_NO_LIMIT', amount: 50_000, mode: 'NON_CASH' },
        { category: '50_PCT_WITH_LIMIT', amount: 500_000, mode: 'NON_CASH' },
      ],
      adjustedGrossTotalIncome: 1_000_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(150_000);
  });

  it('should apply 50 percent rate to a 50_PCT_NO_LIMIT donation', () => {
    const result = computeSection80g({
      regime: 'OLD',
      donations: [{ category: '50_PCT_NO_LIMIT', amount: 100_000, mode: 'NON_CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(50_000);
  });

  it('should apply 100 percent rate to a 100_PCT_WITH_LIMIT donation, then clamp at AGTI 10 percent', () => {
    const result = computeSection80g({
      regime: 'OLD',
      donations: [{ category: '100_PCT_WITH_LIMIT', amount: 500_000, mode: 'NON_CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value).toBe(100_000);
  });

  it('should cite Section 80G on every old-regime computation', () => {
    const result = computeSection80g({
      regime: 'OLD',
      donations: [{ category: '100_PCT_NO_LIMIT', amount: 5_000, mode: 'NON_CASH' }],
      adjustedGrossTotalIncome: 1_000_000,
      ay: ASSESSMENT_YEAR,
    });
    const hasSec80G = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '80G',
    );
    expect(hasSec80G).toBe(true);
  });

  describe('regime denial branch (mutation kill-tests)', () => {
    it('should emit exactly one step with the pinned label, formula, inputs, output, and citations under NEW regime', () => {
      const result = computeSection80g({
        regime: 'NEW',
        donations: [{ category: '100_PCT_NO_LIMIT', amount: 25_000, mode: 'NON_CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toMatchObject({
        label: 'Section 80G not available. New regime',
        formula: 'deduction = 0',
        inputs: { regime: 'NEW' },
        output: 0,
        citations: [SECTIONS.SEC_80G, SECTIONS.SEC_115BAC],
      });
    });

    it('should expose result.citations as exactly [SEC_80G, SEC_115BAC] (deduped) under NEW regime', () => {
      const result = computeSection80g({
        regime: 'NEW',
        donations: [{ category: '100_PCT_NO_LIMIT', amount: 25_000, mode: 'NON_CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.citations).toEqual([SECTIONS.SEC_80G, SECTIONS.SEC_115BAC]);
    });
  });

  describe('cash-ceiling boundary (mutation kill-tests)', () => {
    it('should NOT disqualify a cash donation at exactly Rs. 2,000 (boundary, > not >=)', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [{ category: '100_PCT_NO_LIMIT', amount: 2_000, mode: 'CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.value).toBe(2_000);
    });

    it('should disqualify a cash donation at Rs. 2,001 (one rupee over the ceiling)', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [{ category: '100_PCT_NO_LIMIT', amount: 2_001, mode: 'CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.value).toBe(0);
    });

    it('should emit the disqualification step with pinned label, formula, inputs, output, and citations for cash > Rs. 2,000', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [{ category: '100_PCT_NO_LIMIT', amount: 5_000, mode: 'CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps[0]).toMatchObject({
        label: 'Donation of Rs. 5,000 in cash. Disqualified (> Rs. 2,000)',
        formula: 'disqualified under Finance Act 2017',
        inputs: { amount: 5_000, cashCeiling: 2_000 },
        output: 0,
        citations: [SECTIONS.SEC_80G],
      });
    });
  });

  describe('category branches (mutation kill-tests)', () => {
    it('should emit a no-AGTI-limit step with pinned label, formula, inputs, output, and citations for 100_PCT_NO_LIMIT', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [
          {
            category: '100_PCT_NO_LIMIT',
            amount: 40_000,
            mode: 'NON_CASH',
            doneeName: 'PM CARES',
          },
        ],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps[0]).toMatchObject({
        label: 'Donation PM CARES. 100_PCT_NO_LIMIT @ 100% (no AGTI limit)',
        formula: 'amount x rate',
        inputs: { amount: 40_000, rate: 1, gross: 40_000 },
        output: 40_000,
        citations: [SECTIONS.SEC_80G],
      });
    });

    it('should emit a no-AGTI-limit step at 50% rate for 50_PCT_NO_LIMIT (rate distinct from 100% branch)', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [
          {
            category: '50_PCT_NO_LIMIT',
            amount: 80_000,
            mode: 'NON_CASH',
            doneeName: 'JNMF',
          },
        ],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps[0]).toMatchObject({
        label: 'Donation JNMF. 50_PCT_NO_LIMIT @ 50% (no AGTI limit)',
        formula: 'amount x rate',
        inputs: { amount: 80_000, rate: 0.5, gross: 40_000 },
        output: 40_000,
        citations: [SECTIONS.SEC_80G],
      });
    });

    it('should emit an AGTI-cap-subject step for 100_PCT_WITH_LIMIT with pinned label and citations', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [
          {
            category: '100_PCT_WITH_LIMIT',
            amount: 60_000,
            mode: 'NON_CASH',
            doneeName: 'StateGovt',
          },
        ],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps[0]).toMatchObject({
        label: 'Donation StateGovt. 100_PCT_WITH_LIMIT @ 100% (subject to AGTI cap)',
        formula: 'amount x rate',
        inputs: { amount: 60_000, rate: 1, gross: 60_000 },
        output: 60_000,
        citations: [SECTIONS.SEC_80G],
      });
    });

    it('should emit an AGTI-cap-subject step at 50% for 50_PCT_WITH_LIMIT with pinned label and citations', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [
          {
            category: '50_PCT_WITH_LIMIT',
            amount: 60_000,
            mode: 'NON_CASH',
            doneeName: 'NGO',
          },
        ],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps[0]).toMatchObject({
        label: 'Donation NGO. 50_PCT_WITH_LIMIT @ 50% (subject to AGTI cap)',
        formula: 'amount x rate',
        inputs: { amount: 60_000, rate: 0.5, gross: 30_000 },
        output: 30_000,
        citations: [SECTIONS.SEC_80G],
      });
    });

    it('should fall back to an empty donee-name segment when doneeName is undefined (no-limit branch)', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [{ category: '100_PCT_NO_LIMIT', amount: 10_000, mode: 'NON_CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps[0]?.label).toBe('Donation . 100_PCT_NO_LIMIT @ 100% (no AGTI limit)');
    });

    it('should fall back to an empty donee-name segment when doneeName is undefined (with-limit branch)', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [{ category: '50_PCT_WITH_LIMIT', amount: 10_000, mode: 'NON_CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps[0]?.label).toBe(
        'Donation . 50_PCT_WITH_LIMIT @ 50% (subject to AGTI cap)',
      );
    });
  });

  describe('payment-mode branch (mutation kill-tests)', () => {
    it('should NOT disqualify NON_CASH donations regardless of size', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [{ category: '100_PCT_NO_LIMIT', amount: 5_000_000, mode: 'NON_CASH' }],
        adjustedGrossTotalIncome: 100_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.value).toBe(5_000_000);
    });

    it('should treat CASH at exactly the ceiling as eligible (not disqualified) and produce one category step + total step (no disqualification step)', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [{ category: '50_PCT_NO_LIMIT', amount: 2_000, mode: 'CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      const labels = result.steps.map((step) => step.label);
      expect(labels).not.toContain('Donation of Rs. 2,000 in cash. Disqualified (> Rs. 2,000)');
      expect(result.value).toBe(1_000);
    });
  });

  describe('AGTI cap step (mutation kill-tests)', () => {
    it('should emit the AGTI-cap step only when withLimitGross is strictly greater than zero', () => {
      const resultWithoutWithLimit = computeSection80g({
        regime: 'OLD',
        donations: [{ category: '100_PCT_NO_LIMIT', amount: 50_000, mode: 'NON_CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      const labelsWithout = resultWithoutWithLimit.steps.map((step) => step.label);
      expect(labelsWithout).not.toContain('Apply 10% AGTI cap to "with-limit" donations');
    });

    it('should emit the AGTI-cap step with pinned label, formula, inputs, output, and citations when with-limit donations exist', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [{ category: '50_PCT_WITH_LIMIT', amount: 500_000, mode: 'NON_CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      const capStep = result.steps.find(
        (step) => step.label === 'Apply 10% AGTI cap to "with-limit" donations',
      );
      expect(capStep).toBeDefined();
      expect(capStep).toMatchObject({
        label: 'Apply 10% AGTI cap to "with-limit" donations',
        formula: 'min(with_limit_gross, AGTI x 10%)',
        inputs: {
          withLimitGross: 250_000,
          agtiCap: 100_000,
          withLimitAllowable: 100_000,
        },
        output: 100_000,
        citations: [SECTIONS.SEC_80G],
      });
    });
  });

  describe('total step (mutation kill-tests)', () => {
    it('should emit a final total step with pinned label, formula, inputs, output, and citations', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [
          { category: '100_PCT_NO_LIMIT', amount: 50_000, mode: 'NON_CASH' },
          { category: '50_PCT_WITH_LIMIT', amount: 500_000, mode: 'NON_CASH' },
        ],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      const totalStep = result.steps[result.steps.length - 1];
      expect(totalStep).toMatchObject({
        label: 'Total Section 80G allowable',
        formula: 'no_limit + capped_with_limit',
        inputs: {
          noLimitAllowable: 50_000,
          withLimitAllowable: 100_000,
          total: 150_000,
        },
        output: 150_000,
        citations: [SECTIONS.SEC_80G],
      });
    });
  });

  describe('result.citations aggregation (mutation kill-tests)', () => {
    it('should aggregate steps citations via flatMap and dedupe to exactly [SEC_80G] for an old-regime path', () => {
      const result = computeSection80g({
        regime: 'OLD',
        donations: [{ category: '100_PCT_NO_LIMIT', amount: 5_000, mode: 'NON_CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.citations).toEqual([SECTIONS.SEC_80G]);
    });
  });

  describe('regime denial reason string (mutation kill-tests)', () => {
    it('should expose the guardRegime reason naming SEC_80G verbatim on the regime-denied step inputs', () => {
      const result = computeSection80g({
        regime: 'NEW',
        donations: [{ category: '100_PCT_NO_LIMIT', amount: 25_000, mode: 'NON_CASH' }],
        adjustedGrossTotalIncome: 1_000_000,
        ay: ASSESSMENT_YEAR,
      });
      expect(result.steps[0]?.inputs?.reason).toBe(
        'Deduction denied under Section 115BAC(2). New regime does not permit SEC_80G',
      );
    });
  });
});
