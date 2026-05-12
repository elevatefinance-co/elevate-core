/* Tests for the gst rate slab structure.
 * Two effective-date bands: the foundational five slabs (0 / 5 / 12 / 18 / 28 percent) for supplies up to
 * 21 September 2025, and the GST 2.0 structure (0 / 5 / 18 / 40 percent) for supplies on or after
 * 22 September 2025 per the 56th Council recommendations and Notification 9/2025-CT (Rate).
 * Pinned: frozen pre-restructure constants, the restructure boundary on both sides,
 * band citations (Section 9 + principal notification; Section 9 + 56th Council meeting + 9/2025-CT (Rate)),
 * and the date-aware basis-point validity dispatch.
 */

import {
  GST_2_0_SLAB_BASIS_POINTS,
  GST_2_0_SLAB_CITATIONS,
  GST_2_0_SLAB_PERCENTS,
  GST_BASIS_POINTS_TO_RATE,
  GST_RATE_TO_BASIS_POINTS,
  GST_SLAB_BANDS,
  GST_SLAB_BASIS_POINTS,
  GST_SLAB_CITATIONS,
  GST_SLAB_PERCENTS,
  gstRateBasisPointsFromPercent,
  gstRatePercentFromBasisPoints,
  isValidGstRateBasisPoints,
  isValidGstRateBasisPointsOn,
  resolveGstSlabBand,
} from '../../src/gst/rates/slabs.js';

const LAST_PRE_RESTRUCTURE_INSTANT = new Date('2025-09-21T23:59:59Z');
const RESTRUCTURE_INSTANT = new Date('2025-09-22T00:00:00Z');

describe('GST slab constants -- pre-restructure era (frozen history)', () => {
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

describe('GST slab constants -- GST 2.0 era (effective 22 September 2025)', () => {
  it('exposes exactly four slabs', () => {
    expect(GST_2_0_SLAB_PERCENTS).toHaveLength(4);
    expect(GST_2_0_SLAB_BASIS_POINTS).toHaveLength(4);
  });

  it('the slabs are 0 / 5 / 18 / 40 percent', () => {
    expect([...GST_2_0_SLAB_PERCENTS]).toEqual([0, 5, 18, 40]);
  });

  it('the basis-point slabs are 0 / 500 / 1800 / 4000', () => {
    expect([...GST_2_0_SLAB_BASIS_POINTS]).toEqual([0, 500, 1800, 4000]);
  });
});

describe('rate <-> basis-points conversion', () => {
  it('round-trips for every pre-restructure slab', () => {
    for (const percent of GST_SLAB_PERCENTS) {
      const bp = gstRateBasisPointsFromPercent(percent);
      const back = gstRatePercentFromBasisPoints(bp);
      expect(back).toBe(percent);
    }
  });

  it('round-trips for every GST 2.0 slab including the 40 percent de-merit rate', () => {
    for (const percent of GST_2_0_SLAB_PERCENTS) {
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
    expect(GST_RATE_TO_BASIS_POINTS[40]).toBe(4000);
    expect(GST_BASIS_POINTS_TO_RATE[4000]).toBe(40);
  });
});

describe('isValidGstRateBasisPoints (any-era membership)', () => {
  it('accepts every registered slab across both eras', () => {
    expect(isValidGstRateBasisPoints(0)).toBe(true);
    expect(isValidGstRateBasisPoints(500)).toBe(true);
    expect(isValidGstRateBasisPoints(1200)).toBe(true);
    expect(isValidGstRateBasisPoints(1800)).toBe(true);
    expect(isValidGstRateBasisPoints(2800)).toBe(true);
    expect(isValidGstRateBasisPoints(4000)).toBe(true);
  });

  it('rejects basis-point values that were never a slab', () => {
    expect(isValidGstRateBasisPoints(100)).toBe(false);
    expect(isValidGstRateBasisPoints(750)).toBe(false);
    expect(isValidGstRateBasisPoints(2000)).toBe(false);
    expect(isValidGstRateBasisPoints(-1)).toBe(false);
  });
});

describe('isValidGstRateBasisPointsOn (era-specific membership)', () => {
  it('12 and 28 percent are valid up to 21 September 2025 and invalid from 22 September 2025', () => {
    expect(isValidGstRateBasisPointsOn(1200, LAST_PRE_RESTRUCTURE_INSTANT)).toBe(true);
    expect(isValidGstRateBasisPointsOn(2800, LAST_PRE_RESTRUCTURE_INSTANT)).toBe(true);
    expect(isValidGstRateBasisPointsOn(1200, RESTRUCTURE_INSTANT)).toBe(false);
    expect(isValidGstRateBasisPointsOn(2800, RESTRUCTURE_INSTANT)).toBe(false);
  });

  it('40 percent is invalid before 22 September 2025 and valid from it', () => {
    expect(isValidGstRateBasisPointsOn(4000, LAST_PRE_RESTRUCTURE_INSTANT)).toBe(false);
    expect(isValidGstRateBasisPointsOn(4000, RESTRUCTURE_INSTANT)).toBe(true);
  });

  it('0, 5 and 18 percent are valid in both eras', () => {
    for (const bp of [0, 500, 1800]) {
      expect(isValidGstRateBasisPointsOn(bp, LAST_PRE_RESTRUCTURE_INSTANT)).toBe(true);
      expect(isValidGstRateBasisPointsOn(bp, RESTRUCTURE_INSTANT)).toBe(true);
    }
  });

  it('never-a-slab values are invalid in both eras', () => {
    expect(isValidGstRateBasisPointsOn(750, LAST_PRE_RESTRUCTURE_INSTANT)).toBe(false);
    expect(isValidGstRateBasisPointsOn(750, RESTRUCTURE_INSTANT)).toBe(false);
  });
});

describe('GST_SLAB_BANDS', () => {
  it('exposes exactly two effective-date bands', () => {
    expect(GST_SLAB_BANDS).toHaveLength(2);
  });

  it('every band carries citations for traceability', () => {
    for (const band of GST_SLAB_BANDS) {
      expect(band.citations.length).toBeGreaterThan(0);
    }
  });

  it('the foundational 1 July 2017 band closes on 21 September 2025', () => {
    const foundational = GST_SLAB_BANDS.find((b) => b.effectiveFrom === '2017-07-01');
    expect(foundational).toBeDefined();
    expect(foundational?.effectiveTo).toBe('2025-09-21');
    expect([...(foundational?.slabs ?? [])]).toEqual([0, 5, 12, 18, 28]);
  });

  it('the foundational band cites the principal 1/2017-CT (Rate) notification, not the GST 2.0 sources', () => {
    const foundational = GST_SLAB_BANDS.find((b) => b.effectiveFrom === '2017-07-01');
    const citesPrincipal = foundational?.citations.some(
      (c) => c.kind === 'notification' && c.number === '1/2017',
    );
    const citesCouncilMeeting = foundational?.citations.some(
      (c) => c.kind === 'gst-council-meeting',
    );
    expect(citesPrincipal).toBe(true);
    expect(citesCouncilMeeting).toBe(false);
  });

  it('the GST 2.0 band starts 22 September 2025 and is open-ended', () => {
    const restructured = GST_SLAB_BANDS.find((b) => b.effectiveFrom === '2025-09-22');
    expect(restructured).toBeDefined();
    expect(restructured?.effectiveTo).toBeNull();
    expect([...(restructured?.slabs ?? [])]).toEqual([0, 5, 18, 40]);
  });

  it('the GST 2.0 band cites the 56th Council meeting and 9/2025-CT (Rate)', () => {
    const restructured = GST_SLAB_BANDS.find((b) => b.effectiveFrom === '2025-09-22');
    const citesCouncilMeeting = restructured?.citations.some(
      (c) => c.kind === 'gst-council-meeting' && c.meetingNumber === 56,
    );
    const citesRateNotification = restructured?.citations.some(
      (c) => c.kind === 'notification' && c.number === '9/2025',
    );
    expect(citesCouncilMeeting).toBe(true);
    expect(citesRateNotification).toBe(true);
  });
});

describe('resolveGstSlabBand', () => {
  it('a 2017 supply resolves to the foundational band', () => {
    const band = resolveGstSlabBand(new Date('2017-07-01T00:00:00Z'));
    expect(band.effectiveFrom).toBe('2017-07-01');
  });

  it('the last instant of 21 September 2025 still resolves to the foundational band', () => {
    const band = resolveGstSlabBand(LAST_PRE_RESTRUCTURE_INSTANT);
    expect(band.effectiveFrom).toBe('2017-07-01');
    expect([...band.slabs]).toEqual([0, 5, 12, 18, 28]);
  });

  it('midnight UTC on 22 September 2025 resolves to the GST 2.0 band', () => {
    const band = resolveGstSlabBand(RESTRUCTURE_INSTANT);
    expect(band.effectiveFrom).toBe('2025-09-22');
    expect([...band.slabs]).toEqual([0, 5, 18, 40]);
  });

  it('a 2026 supply resolves to the GST 2.0 band', () => {
    const band = resolveGstSlabBand(new Date('2026-06-12T00:00:00Z'));
    expect(band.effectiveFrom).toBe('2025-09-22');
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

describe('GST_2_0_SLAB_CITATIONS', () => {
  it('cites Section 9, the 56th GST Council meeting and Notification 9/2025-CT (Rate)', () => {
    const cgst9 = GST_2_0_SLAB_CITATIONS.find(
      (c) => c.kind === 'section' && c.act === 'CGST_ACT_2017' && c.section === '9',
    );
    expect(cgst9).toBeDefined();
    const councilMeeting = GST_2_0_SLAB_CITATIONS.find(
      (c) => c.kind === 'gst-council-meeting' && c.meetingNumber === 56,
    );
    expect(councilMeeting).toBeDefined();
    if (councilMeeting?.kind === 'gst-council-meeting') {
      expect(councilMeeting.date).toBe('2025-09-03');
    }
    const rateNotification = GST_2_0_SLAB_CITATIONS.find(
      (c) => c.kind === 'notification' && c.number === '9/2025',
    );
    expect(rateNotification).toBeDefined();
    if (rateNotification?.kind === 'notification') {
      expect(rateNotification.date).toBe('2025-09-17');
      expect(rateNotification.family).toBe('CBIC_CT_RATE');
    }
  });
});
