/* The five GST slabs (0 / 5 / 12 / 18 / 28 percent). Rates are notified vide Notification 1/2017-CT (Rate)
 * and amended frequently by Council recommendation. The slab table is versioned by effective-date band so a
 * January 2024 invoice computes against the rates in force as of January 2024, regardless of when the
 * engine runs.
 *
 * The slab values themselves do not encode HSN-specific exceptions or compensation cess (covered in
 * compensation-cess.ts). This file is the rate-slab dispatcher; the consumer matches an HSN to a slab via a
 * lookup that lives outside this engine (in the rule application layer of the platform). */

import type { Citation, NotificationCitation } from '../../types/citation.js';
import { CBIC_NOTIFICATIONS } from '../citations/cbic-notifications.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';

export type GstRatePercent = 0 | 5 | 12 | 18 | 28;

export type GstRateBasisPoints = 0 | 500 | 1200 | 1800 | 2800;

export const GST_RATE_TO_BASIS_POINTS: Readonly<Record<GstRatePercent, GstRateBasisPoints>> = {
  0: 0,
  5: 500,
  12: 1200,
  18: 1800,
  28: 2800,
};

export const GST_BASIS_POINTS_TO_RATE: Readonly<Record<GstRateBasisPoints, GstRatePercent>> = {
  0: 0,
  500: 5,
  1200: 12,
  1800: 18,
  2800: 28,
};

export const GST_SLAB_PERCENTS: readonly GstRatePercent[] = [0, 5, 12, 18, 28];
export const GST_SLAB_BASIS_POINTS: readonly GstRateBasisPoints[] = [0, 500, 1200, 1800, 2800];

export function isValidGstRateBasisPoints(value: number): value is GstRateBasisPoints {
  return GST_SLAB_BASIS_POINTS.includes(value as GstRateBasisPoints);
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

export type GstRateBand = {
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly slabs: readonly GstRatePercent[];
  readonly citations: readonly Citation[];
};

export const GST_SLAB_BANDS: readonly GstRateBand[] = [
  {
    effectiveFrom: '2017-07-01',
    effectiveTo: null,
    slabs: GST_SLAB_PERCENTS,
    citations: GST_SLAB_CITATIONS,
  },
];

export type _DocumentationOnly_OnlineGamingNote = NotificationCitation;
