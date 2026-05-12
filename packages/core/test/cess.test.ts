/* Pins the 4% Health and Education Cess as a flat surcharge over tax + surcharge for every supported AY.
 * Cess is rarely amended year over year, but the exact 4% rate is also where many spreadsheets quietly
 * disagree (some still carry 3% or 2% from older Finance Acts). These tests are the single canonical
 * reference. */

import { computeCess, HEALTH_EDUCATION_CESS_RATE } from '../src/index.js';

describe('computeCess()', () => {
  it('should export 4% rate constant', () => {
    expect(HEALTH_EDUCATION_CESS_RATE).toBe(0.04);
  });

  it('should return 0 for zero tax', () => {
    const r = computeCess({ taxPlusSurcharge: 0, ay: 'AY2025-26' });
    expect(r.value).toBe(0);
    expect(r.steps).toHaveLength(1);
  });

  it('should return 0 for negative tax (defensive)', () => {
    const r = computeCess({ taxPlusSurcharge: -100, ay: 'AY2025-26' });
    expect(r.value).toBe(0);
  });

  it('should compute 4% of Rs. 1L = Rs. 4,000', () => {
    const r = computeCess({ taxPlusSurcharge: 100_000, ay: 'AY2025-26' });
    expect(r.value).toBe(4_000);
  });

  it('should round to nearest rupee', () => {
    const r = computeCess({ taxPlusSurcharge: 12_345, ay: 'AY2025-26' });
    expect(r.value).toBe(494);
  });

  it('should carry Sec 2(12A) citation', () => {
    const r = computeCess({ taxPlusSurcharge: 10_000, ay: 'AY2025-26' });
    expect(r.citations.some((c) => c.kind === 'section' && c.section === '2')).toBe(true);
  });

  it('should emit the no-tax step verbatim at exactly zero', () => {
    const r = computeCess({ taxPlusSurcharge: 0, ay: 'AY2026-27' });
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]).toMatchObject({
      label: 'Health & Education Cess. No tax to cess',
      formula: '0',
      inputs: { taxPlusSurcharge: 0 },
      output: 0,
    });
  });

  it('should treat exactly zero as the zero branch (label distinguishes from applied branch)', () => {
    const zeroCase = computeCess({ taxPlusSurcharge: 0, ay: 'AY2025-26' });
    expect(zeroCase.steps[0]?.label).toBe('Health & Education Cess. No tax to cess');
    const positiveCase = computeCess({ taxPlusSurcharge: 1, ay: 'AY2025-26' });
    expect(positiveCase.steps[0]?.label).toBe('Health & Education Cess @ 4%');
  });

  it('should emit the applied-cess step verbatim at Rs. 1L tax', () => {
    const r = computeCess({ taxPlusSurcharge: 100_000, ay: 'AY2026-27' });
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]).toMatchObject({
      label: 'Health & Education Cess @ 4%',
      formula: '100000 x 0.04 = 4000',
      inputs: { taxPlusSurcharge: 100_000, rate: HEALTH_EDUCATION_CESS_RATE },
      output: 4_000,
    });
  });

  it('should render percentage as 4 (rate * 100), not 0.04 (rate / 100)', () => {
    const r = computeCess({ taxPlusSurcharge: 50_000, ay: 'AY2025-26' });
    expect(r.steps[0]?.label).toContain('4%');
    expect(r.steps[0]?.label).not.toContain('0.04%');
  });

  it('should emit exactly one step on the applied branch', () => {
    const r = computeCess({ taxPlusSurcharge: 250_000, ay: 'AY2026-27' });
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]?.output).toBe(10_000);
  });
});
