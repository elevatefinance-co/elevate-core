/* The slab table is the foundation every other module composes against; if the slab dispatch is wrong,
 * every downstream computation is wrong. These tests pin (regime, ageBand, ay) dispatch end-to-end,
 * including the senior / super-senior age bands that exist only under the old regime,
 * and assert that AY 2026-27 introduces the new top tier under Section 115BAC exactly where Finance Act
 * 2025 placed it.
 */

import {
  getSlabs,
  isSupportedAssessmentYear,
  SUPPORTED_ASSESSMENT_YEARS,
  NEW_REGIME_SLABS_AY_2025_26,
  NEW_REGIME_SLABS_AY_2026_27,
  OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26,
  OLD_REGIME_SLABS_SENIOR_AY_2025_26,
  OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26,
  computeSlabTax,
} from '../src/index.js';

describe('slabs - getSlabs()', () => {
  it('should return AY2025-26 new-regime slabs by default', () => {
    const { slabs, citations } = getSlabs({ regime: 'NEW', ay: 'AY2025-26' });
    expect(slabs).toBe(NEW_REGIME_SLABS_AY_2025_26);
    expect(citations.length).toBeGreaterThan(0);
  });

  it('should return AY2026-27 new-regime slabs (Budget 2025 revised bands)', () => {
    const { slabs } = getSlabs({ regime: 'NEW', ay: 'AY2026-27' });
    expect(slabs).toBe(NEW_REGIME_SLABS_AY_2026_27);
    expect(slabs[0]).toEqual({ lowerBound: 0, upperBound: 400_000, rate: 0 });
    expect(slabs[5]).toEqual({
      lowerBound: 2_000_000,
      upperBound: 2_400_000,
      rate: 0.25,
    });
  });

  it('should return old regime individual slabs when age band not specified', () => {
    const { slabs } = getSlabs({ regime: 'OLD', ay: 'AY2025-26' });
    expect(slabs).toBe(OLD_REGIME_SLABS_INDIVIDUAL_AY_2025_26);
  });

  it('should return old regime senior slabs with 3L basic exemption', () => {
    const { slabs } = getSlabs({
      regime: 'OLD',
      ay: 'AY2025-26',
      ageBand: 'SENIOR',
    });
    expect(slabs).toBe(OLD_REGIME_SLABS_SENIOR_AY_2025_26);
    expect(slabs[0]).toEqual({ lowerBound: 0, upperBound: 300_000, rate: 0 });
  });

  it('should return old regime super-senior slabs with 5L basic exemption', () => {
    const { slabs } = getSlabs({
      regime: 'OLD',
      ay: 'AY2025-26',
      ageBand: 'SUPER_SENIOR',
    });
    expect(slabs).toBe(OLD_REGIME_SLABS_SUPER_SENIOR_AY_2025_26);
    expect(slabs[0]).toEqual({ lowerBound: 0, upperBound: 500_000, rate: 0 });
  });

  it('should return old regime slabs for AY2026-27 unchanged from AY2025-26', () => {
    const ay25 = getSlabs({ regime: 'OLD', ay: 'AY2025-26' });
    const ay26 = getSlabs({ regime: 'OLD', ay: 'AY2026-27' });
    expect(ay25.slabs).toEqual(ay26.slabs);
  });

  it('should handle all three age bands for AY2026-27 old regime', () => {
    const indiv = getSlabs({
      regime: 'OLD',
      ay: 'AY2026-27',
      ageBand: 'INDIVIDUAL',
    });
    const sr = getSlabs({ regime: 'OLD', ay: 'AY2026-27', ageBand: 'SENIOR' });
    const ssr = getSlabs({
      regime: 'OLD',
      ay: 'AY2026-27',
      ageBand: 'SUPER_SENIOR',
    });
    expect(indiv.slabs[0]?.upperBound).toBe(250_000);
    expect(sr.slabs[0]?.upperBound).toBe(300_000);
    expect(ssr.slabs[0]?.upperBound).toBe(500_000);
  });
});

describe('slabs - supported AYs', () => {
  it('should list AY2025-26 and AY2026-27 as supported', () => {
    expect(SUPPORTED_ASSESSMENT_YEARS).toEqual(['AY2025-26', 'AY2026-27']);
  });

  it('isSupportedAssessmentYear narrows correctly', () => {
    expect(isSupportedAssessmentYear('AY2025-26')).toBe(true);
    expect(isSupportedAssessmentYear('AY2026-27')).toBe(true);
    expect(isSupportedAssessmentYear('AY2024-25')).toBe(false);
    expect(isSupportedAssessmentYear('not-an-ay')).toBe(false);
  });
});

describe('computeSlabTax()', () => {
  it('should return 0 for zero income with a step explaining it', () => {
    const { slabs } = getSlabs({ regime: 'NEW', ay: 'AY2025-26' });
    const r = computeSlabTax({ taxableIncome: 0, slabs, ay: 'AY2025-26' });
    expect(r.value).toBe(0);
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]?.output).toBe(0);
  });

  it('should return 0 for negative income', () => {
    const { slabs } = getSlabs({ regime: 'NEW', ay: 'AY2025-26' });
    const r = computeSlabTax({ taxableIncome: -1000, slabs, ay: 'AY2025-26' });
    expect(r.value).toBe(0);
  });

  it('should compute tax on AY2025-26 new regime at Rs. 10L taxable', () => {
    const { slabs } = getSlabs({ regime: 'NEW', ay: 'AY2025-26' });
    const r = computeSlabTax({
      taxableIncome: 1_000_000,
      slabs,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(50_000);
    expect(r.steps.length).toBe(3);
    expect(r.steps[0]?.output).toBe(0);
  });

  it('should compute tax on AY2026-27 new regime at Rs. 12L (full rebate will zero this later)', () => {
    const { slabs } = getSlabs({ regime: 'NEW', ay: 'AY2026-27' });
    const r = computeSlabTax({
      taxableIncome: 1_200_000,
      slabs,
      ay: 'AY2026-27',
    });
    expect(r.value).toBe(60_000);
  });

  it('should compute tax across all AY2025-26 new-regime slabs at Rs. 30L', () => {
    const { slabs } = getSlabs({ regime: 'NEW', ay: 'AY2025-26' });
    const r = computeSlabTax({
      taxableIncome: 3_000_000,
      slabs,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(590_000);
  });

  it('should compute tax at exact slab boundary (no partial slab crosses)', () => {
    const { slabs } = getSlabs({ regime: 'NEW', ay: 'AY2025-26' });
    const r = computeSlabTax({
      taxableIncome: 700_000,
      slabs,
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(20_000);
  });

  it('should produce one step per contributing slab', () => {
    const { slabs } = getSlabs({ regime: 'OLD', ay: 'AY2025-26' });
    const r = computeSlabTax({
      taxableIncome: 1_500_000,
      slabs,
      ay: 'AY2025-26',
    });
    expect(r.steps).toHaveLength(4);
    expect(r.steps[0]?.output).toBe(0);
  });

  it('should pass through citations', () => {
    const { slabs, citations } = getSlabs({ regime: 'NEW', ay: 'AY2025-26' });
    const r = computeSlabTax({
      taxableIncome: 500_000,
      slabs,
      ay: 'AY2025-26',
      citations,
    });
    expect(r.citations).toBe(citations);
  });

  it('should carry engine version on result', () => {
    const { slabs } = getSlabs({ regime: 'NEW', ay: 'AY2025-26' });
    const r = computeSlabTax({
      taxableIncome: 500_000,
      slabs,
      ay: 'AY2025-26',
    });
    expect(r.engineVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
