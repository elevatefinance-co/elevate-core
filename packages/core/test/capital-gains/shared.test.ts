/* Tests for the shared capital-gains primitives. Three transaction-shape types (ListedEquityTxn,
 * OtherAssetTxn,
 * VdaTxn) plus the rawNetGain helper that floors the result at zero so a loss never silently flips a
 * downstream computation.
 * Pinned: the floor-at-zero behaviour, the multi-subtract aggregation,
 * and the undefined-tolerant reduce (subtractor fields are optional in transaction shapes). Citations:
 * Section 48 (mode of computation of capital gains) is the parent for the netGain primitive;
 * cited in the computing modules, not in the helper itself.
 */

import { rawNetGain } from '../../src/capital-gains/shared.js';

describe('rawNetGain', () => {
  it('should return positive gain when sale exceeds the sum of subtractors', () => {
    expect(rawNetGain(1_000_000, [400_000, 100_000])).toBe(500_000);
  });

  it('should floor the result at zero when subtractors exceed sale (no negative gain)', () => {
    expect(rawNetGain(100_000, [200_000, 50_000])).toBe(0);
  });

  it('should return the full sale amount for an empty subtract list', () => {
    expect(rawNetGain(500_000, [])).toBe(500_000);
  });

  it('should sum every subtractor without short-circuiting on zero', () => {
    expect(rawNetGain(1_000_000, [0, 100_000, 0, 200_000])).toBe(700_000);
  });

  it('should handle a single-subtractor case', () => {
    expect(rawNetGain(750_000, [250_000])).toBe(500_000);
  });

  it('should return zero when sale equals total subtractors (boundary)', () => {
    expect(rawNetGain(300_000, [100_000, 200_000])).toBe(0);
  });
});
