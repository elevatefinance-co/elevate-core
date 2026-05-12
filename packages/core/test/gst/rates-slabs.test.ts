/* Tests for the gst rate slab structure.
 * The five GST slabs (0 / 5 / 12 / 18 / 28 percent) and the basis-point representation the rule engine
 * uses internally.
 * Effective-date band coverage.
 */

import {
  GST_BASIS_POINTS_TO_RATE,
  GST_RATE_TO_BASIS_POINTS,
  GST_SLAB_BANDS,
  GST_SLAB_BASIS_POINTS,
  GST_SLAB_CITATIONS,
  GST_SLAB_PERCENTS,
  gstRateBasisPointsFromPercent,
  gstRatePercentFromBasisPoints,
  isValidGstRateBasisPoints,
} from '../../src/gst/rates/slabs.js';

describe('GST slab constants', () => {
  it('exposes exactly five slabs', () => {
    expect(GST_SLAB_PERCENTS).toHaveLength(5);
    expect(GST_SLAB_BASIS_POINTS).toHaveLength(5);
  });

  it('the slabs are 0 / 5 / 12 / 18 / 28 percent', () => {
    expect([...GST_SLAB_PERCENTS]).toEqual([0, 5, 12, 18, 28]);
  });

  it('the basis-point slabs are 0 / 500 / 1200 / 1800 / 2800', () => {
    expect([...GST_SLAB_BASIS_POINTS]).toEqual([0, 500, 1200, 1800, 2800]);
  });
});

describe('rate <-> basis-points conversion', () => {
  it('round-trips for every slab', () => {
    for (const percent of GST_SLAB_PERCENTS) {
      const bp = gstRateBasisPointsFromPercent(percent);
      const back = gstRatePercentFromBasisPoints(bp);
      expect(back).toBe(percent);
    }
  });

  it('mapping table is consistent in both directions', () => {
    expect(GST_RATE_TO_BASIS_POINTS[5]).toBe(500);
    expect(GST_BASIS_POINTS_TO_RATE[500]).toBe(5);
    expect(GST_RATE_TO_BASIS_POINTS[28]).toBe(2800);
    expect(GST_BASIS_POINTS_TO_RATE[2800]).toBe(28);
  });
});

describe('isValidGstRateBasisPoints', () => {
  it('accepts every registered slab', () => {
    expect(isValidGstRateBasisPoints(0)).toBe(true);
    expect(isValidGstRateBasisPoints(500)).toBe(true);
    expect(isValidGstRateBasisPoints(1200)).toBe(true);
    expect(isValidGstRateBasisPoints(1800)).toBe(true);
    expect(isValidGstRateBasisPoints(2800)).toBe(true);
  });

  it('rejects non-slab basis-point values', () => {
    expect(isValidGstRateBasisPoints(100)).toBe(false);
    expect(isValidGstRateBasisPoints(750)).toBe(false);
    expect(isValidGstRateBasisPoints(2000)).toBe(false);
    expect(isValidGstRateBasisPoints(-1)).toBe(false);
  });
});

describe('GST_SLAB_BANDS', () => {
  it('exposes at least one effective-date band', () => {
    expect(GST_SLAB_BANDS.length).toBeGreaterThan(0);
  });

  it('every band carries citations for traceability', () => {
    for (const band of GST_SLAB_BANDS) {
      expect(band.citations.length).toBeGreaterThan(0);
    }
  });

  it('the foundational 1 July 2017 band is present and open-ended', () => {
    const foundational = GST_SLAB_BANDS.find((b) => b.effectiveFrom === '2017-07-01');
    expect(foundational).toBeDefined();
    expect(foundational?.effectiveTo).toBeNull();
  });
});

describe('GST_SLAB_CITATIONS', () => {
  it('cites the CGST charging Section 9 and the principal rate notification', () => {
    expect(GST_SLAB_CITATIONS.length).toBeGreaterThanOrEqual(2);
    const cgst9 = GST_SLAB_CITATIONS.find(
      (c) => c.kind === 'section' && c.act === 'CGST_ACT_2017' && c.section === '9',
    );
    expect(cgst9).toBeDefined();
    const principalNotification = GST_SLAB_CITATIONS.find(
      (c) => c.kind === 'notification' && c.number === '1/2017',
    );
    expect(principalNotification).toBeDefined();
  });
});
