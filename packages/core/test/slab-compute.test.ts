/* Tests for the core slab-to-tax computation. Pure function: given a taxable income and a slab table,
 * computes the tax due with a per-slab breakdown. The breakdown is what every Receipt PDF projects,
 * so the step shape is part of the contract. Pinned:
 * zero / negative income returns 0 with a single explanatory step,
 * exact slab boundary does not over-flow, full multi-slab traversal sums correctly,
 * and Infinity upperBound on the top tier is handled. Citations:
 * Section 115BAC (new-regime base for the slab dispatcher;
 * the slab-compute function itself is regime-agnostic so callers thread the citation chain).
 */

import { computeSlabTax } from '../src/slab-compute.js';
import type { TaxSlab } from '../src/slabs/index.js';

const NEW_REGIME_SAMPLE: readonly TaxSlab[] = [
  { lowerBound: 0, upperBound: 300_000, rate: 0 },
  { lowerBound: 300_000, upperBound: 700_000, rate: 0.05 },
  { lowerBound: 700_000, upperBound: 1_000_000, rate: 0.1 },
  { lowerBound: 1_000_000, upperBound: 1_200_000, rate: 0.15 },
  { lowerBound: 1_200_000, upperBound: 1_500_000, rate: 0.2 },
  { lowerBound: 1_500_000, upperBound: Infinity, rate: 0.3 },
];

describe('computeSlabTax', () => {
  it('should return 0 with a single explanatory step for zero income', () => {
    const result = computeSlabTax({
      taxableIncome: 0,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    expect(result.value).toBe(0);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.output).toBe(0);
  });

  it('should return 0 for negative taxable income (defensive)', () => {
    const result = computeSlabTax({
      taxableIncome: -10_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    expect(result.value).toBe(0);
  });

  it('should produce one step per contributing slab (free slab included for receipt transparency)', () => {
    const result = computeSlabTax({
      taxableIncome: 1_000_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    expect(result.steps).toHaveLength(3);
    expect(result.value).toBe(50_000);
  });

  it('should pin the exact-boundary case where income equals a slab cap (no spill)', () => {
    const result = computeSlabTax({
      taxableIncome: 700_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    expect(result.value).toBe(20_000);
  });

  it('should traverse every band including the Infinity-upperBound top tier', () => {
    const result = computeSlabTax({
      taxableIncome: 3_000_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    expect(result.value).toBe(590_000);
  });

  it('should pass through the citations argument verbatim', () => {
    const customCitations = [{ kind: 'finance-act', year: 2024 } as const];
    const result = computeSlabTax({
      taxableIncome: 500_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
      citations: customCitations,
    });
    expect(result.citations).toBe(customCitations);
  });

  it('should default to empty citations when not supplied', () => {
    const result = computeSlabTax({
      taxableIncome: 500_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    expect(result.citations).toEqual([]);
  });

  it('should carry an engineVersion on every result (sem-ver shape)', () => {
    const result = computeSlabTax({
      taxableIncome: 500_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    expect(result.engineVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should label slab steps with rupee-formatted bounds', () => {
    const result = computeSlabTax({
      taxableIncome: 800_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    const labels = result.steps.map((step) => step.label).join(' | ');
    expect(labels).toContain('Rs.');
  });

  it('should label the Infinity-upperBound bound as "infinity"', () => {
    const result = computeSlabTax({
      taxableIncome: 2_000_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    const topStep = result.steps[result.steps.length - 1];
    expect(topStep?.label).toContain('infinity');
  });

  it('should emit the zero-income explanatory step verbatim', () => {
    const result = computeSlabTax({
      taxableIncome: 0,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toMatchObject({
      label: 'Taxable income is zero or negative',
      formula: 'tax = 0',
      inputs: { taxableIncome: 0 },
      output: 0,
    });
  });

  it('should emit only the free band step when income equals the second slabs lowerBound exactly', () => {
    const result = computeSlabTax({
      taxableIncome: 300_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    expect(result.value).toBe(0);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.inputs).toMatchObject({ rate: 0, lowerBound: 0 });
  });

  it('should enter the 5 percent slab one rupee above Rs. 3L', () => {
    const result = computeSlabTax({
      taxableIncome: 300_001,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    expect(result.steps).toHaveLength(2);
    expect(result.steps[1]?.inputs).toMatchObject({
      rate: 0.05,
      lowerBound: 300_000,
    });
  });

  it('should label slab rates as integer percentages (rate * 100), not fractional (rate / 100)', () => {
    const result = computeSlabTax({
      taxableIncome: 800_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    const labels = result.steps.map((step) => step.label).join(' | ');
    expect(labels).toContain('@ 5%');
    expect(labels).toContain('@ 10%');
    expect(labels).not.toContain('@ 0.05%');
    expect(labels).not.toContain('@ 0.001%');
  });

  it('should pin the per-slab formula template verbatim', () => {
    const result = computeSlabTax({
      taxableIncome: 500_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    const fivePercentStep = result.steps.find((step) => step.label.includes('@ 5%'));
    expect(fivePercentStep?.formula).toBe('200000 x 0.05 = 10000');
  });

  it('should pin the per-slab inputs object verbatim for a finite-bound slab', () => {
    const result = computeSlabTax({
      taxableIncome: 800_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    const tenPercentStep = result.steps.find((step) => step.label.includes('@ 10%'));
    expect(tenPercentStep?.inputs).toMatchObject({
      lowerBound: 700_000,
      upperBound: 1_000_000,
      rate: 0.1,
      taxableAtSlab: 100_000,
    });
  });

  it('should encode Infinity upperBound as the string "infinity" in inputs', () => {
    const result = computeSlabTax({
      taxableIncome: 2_000_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    const topStep = result.steps[result.steps.length - 1];
    expect(topStep?.inputs).toMatchObject({
      lowerBound: 1_500_000,
      upperBound: 'infinity',
    });
  });

  it('should encode finite upperBound as the numeric value in inputs (not the string)', () => {
    const result = computeSlabTax({
      taxableIncome: 800_000,
      slabs: NEW_REGIME_SAMPLE,
      ay: 'AY2025-26',
    });
    const tenPercentStep = result.steps.find((step) => step.label.includes('@ 10%'));
    expect(tenPercentStep?.inputs?.upperBound).toBe(1_000_000);
    expect(tenPercentStep?.inputs?.upperBound).not.toBe('infinity');
  });

  it('should label the lower bound 0 as the literal "0", not "Rs. 0"', () => {
    const slabsStartingAtZero: readonly TaxSlab[] = [
      { lowerBound: 0, upperBound: 100_000, rate: 0.1 },
      { lowerBound: 100_000, upperBound: Infinity, rate: 0.2 },
    ];
    const result = computeSlabTax({
      taxableIncome: 50_000,
      slabs: slabsStartingAtZero,
      ay: 'AY2025-26',
    });
    expect(result.steps[0]?.label).toBe('Slab 0 to Rs. 1,00,000 @ 10%');
  });
});
