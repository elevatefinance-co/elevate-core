/* GST rate-slab dispatcher, versioned by effective-date band so a January 2024 invoice computes against the
 * rates in force as of January 2024, regardless of when the engine runs.
 *
 * Two eras:
 *   1 July 2017 to 21 September 2025   five slabs 0 / 5 / 12 / 18 / 28 percent, notified vide
 *                                      Notification 1/2017-CT (Rate)
 *   22 September 2025 onwards          GST 2.0 per the 56th Council recommendations -- Merit 5 percent,
 *                                      Standard 18 percent, de-merit 40 percent, plus Nil, notified vide
 *                                      Notification 9/2025-CT (Rate) in supersession of 1/2017-CT (Rate)
 *
 * The pre-restructure exports stay frozen so historical computations remain reproducible. The slab values
 * themselves do not encode HSN-specific exceptions or compensation cess. This file is the rate-slab
 * dispatcher; the consumer matches an HSN to a slab via a lookup that lives outside this engine (in the
 * rule application layer of the platform).
 *
 * Compensation cess after 22 September 2025 is deliberately NOT encoded here: the September 2025 framework
 * retains cess only on specified tobacco items until the cess-loan discharge, and later notifications step
 * it down to nil, so any cess encoding requires CA review of the notification in force on the supply date. */

import type { Citation, NotificationCitation } from '../../types/citation.js';
import { CBIC_NOTIFICATIONS } from '../citations/cbic-notifications.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';
import { GST_COUNCIL_MEETINGS } from '../citations/gst-council-meetings.js';

export type GstRatePercent = 0 | 5 | 12 | 18 | 28 | 40;

export type GstRateBasisPoints = 0 | 500 | 1200 | 1800 | 2800 | 4000;

export const GST_RATE_TO_BASIS_POINTS: Readonly<Record<GstRatePercent, GstRateBasisPoints>> = {
  0: 0,
  5: 500,
  12: 1200,
  18: 1800,
  28: 2800,
  40: 4000,
};

export const GST_BASIS_POINTS_TO_RATE: Readonly<Record<GstRateBasisPoints, GstRatePercent>> = {
  0: 0,
  500: 5,
  1200: 12,
  1800: 18,
  2800: 28,
  4000: 40,
};

export const GST_SLAB_PERCENTS: readonly GstRatePercent[] = [0, 5, 12, 18, 28];
export const GST_SLAB_BASIS_POINTS: readonly GstRateBasisPoints[] = [0, 500, 1200, 1800, 2800];

export const GST_2_0_SLAB_PERCENTS: readonly GstRatePercent[] = [0, 5, 18, 40];
export const GST_2_0_SLAB_BASIS_POINTS: readonly GstRateBasisPoints[] = [0, 500, 1800, 4000];

const EVER_VALID_SLAB_BASIS_POINTS: ReadonlySet<number> = new Set<number>([
  ...GST_SLAB_BASIS_POINTS,
  ...GST_2_0_SLAB_BASIS_POINTS,
]);

/* Date-less validity means "a slab in at least one era"; era-specific validity needs the supply date and
 * lives in isValidGstRateBasisPointsOn. */
export function isValidGstRateBasisPoints(value: number): value is GstRateBasisPoints {
  return EVER_VALID_SLAB_BASIS_POINTS.has(value);
}

export function gstRatePercentFromBasisPoints(bp: GstRateBasisPoints): GstRatePercent {
  return GST_BASIS_POINTS_TO_RATE[bp];
}

export function gstRateBasisPointsFromPercent(percent: GstRatePercent): GstRateBasisPoints {
  return GST_RATE_TO_BASIS_POINTS[percent];
}

export const GST_SLAB_CITATIONS: readonly Citation[] = [
  CGST_ACT_SECTIONS.SEC_9,
  CBIC_NOTIFICATIONS.N_1_2017_CT_RATE,
];

export const GST_2_0_SLAB_CITATIONS: readonly Citation[] = [
  CGST_ACT_SECTIONS.SEC_9,
  GST_COUNCIL_MEETINGS.MEETING_56,
  CBIC_NOTIFICATIONS.N_9_2025_CT_RATE,
];

export type GstRateBand = {
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly slabs: readonly GstRatePercent[];
  readonly citations: readonly Citation[];
};

const GST_2_0_RESTRUCTURE_DATE = new Date('2025-09-22T00:00:00Z');

const FOUNDATIONAL_SLAB_BAND: GstRateBand = {
  effectiveFrom: '2017-07-01',
  effectiveTo: '2025-09-21',
  slabs: GST_SLAB_PERCENTS,
  citations: GST_SLAB_CITATIONS,
};

const GST_2_0_SLAB_BAND: GstRateBand = {
  effectiveFrom: '2025-09-22',
  effectiveTo: null,
  slabs: GST_2_0_SLAB_PERCENTS,
  citations: GST_2_0_SLAB_CITATIONS,
};

export const GST_SLAB_BANDS: readonly GstRateBand[] = [FOUNDATIONAL_SLAB_BAND, GST_2_0_SLAB_BAND];

export function resolveGstSlabBand(supplyDate: Date): GstRateBand {
  return supplyDate.getTime() < GST_2_0_RESTRUCTURE_DATE.getTime()
    ? FOUNDATIONAL_SLAB_BAND
    : GST_2_0_SLAB_BAND;
}

export function isValidGstRateBasisPointsOn(
  value: number,
  supplyDate: Date,
): value is GstRateBasisPoints {
  const band = resolveGstSlabBand(supplyDate);
  return band.slabs.some((slabPercent) => GST_RATE_TO_BASIS_POINTS[slabPercent] === value);
}

export type _DocumentationOnly_OnlineGamingNote = NotificationCitation;
