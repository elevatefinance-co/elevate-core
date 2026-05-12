/* Specified-person determination per Section 206AB / 206CCA. A 'specified person' is one who:
 *
 *   1. Has not filed an ITR for the FY immediately preceding the year in which TDS is to be deducted, AND
 *   2. The aggregate of TDS and TCS in their account for that year was Rs 50,000 or more, AND
 *   3. The due date for filing that year's ITR has expired
 *
 * Sections 206AB and 206CCA were OMITTED by the Finance Act 2025 w.e.f. 1 April 2025 -- the regime only
 * applies to deduction dates before that. The module is retained for late filings and corrections of
 * pre-omission periods: for those, TDS is at the higher of (a) twice the rate prescribed, (b) 5 percent.
 * The 206AB carve-outs cover Sections 192 / 192A / 194B / 194BB / 194LBC / 194N -- those are not subject
 * to 206AB uplift even for specified persons. The rate-band resolver enforces the omission band; this
 * module reports factual list membership and flags the omission in its narrative.
 *
 * The platform consults the CBDT-published quarterly non-filer list (TdsNonFilerListEntry table) -- this
 * module is the decision logic; the data source is the cron-synced list. */

import type { Citation } from '../../types/citation.js';
import { ITA_SECTIONS } from '../citations/ita-sections.js';
import {
  isCarveOutFromS206AB,
  isSection206ABOmittedForDeductionDate,
  type TdsSectionKey,
} from '../rates/rate-band-resolver.js';

export type SpecifiedPersonContext = {
  readonly panFingerprint: string;
  readonly publishedFy: string;
  readonly listFreshAsOf: Date;
};

export type SpecifiedPersonCheckInput = {
  readonly section: TdsSectionKey;
  readonly deductionDate: Date;
  readonly nonFilerListEntries: readonly SpecifiedPersonContext[];
  readonly deducteePanFingerprint: string;
  readonly listFreshnessThresholdDays?: number;
};

export type SpecifiedPersonCheckResult = {
  readonly isSpecifiedPerson: boolean;
  readonly carveOutApplied: boolean;
  readonly listIsStale: boolean;
  readonly matchedListEntry: SpecifiedPersonContext | null;
  readonly citations: readonly Citation[];
  readonly notes?: string;
};

const DEFAULT_LIST_FRESHNESS_THRESHOLD_DAYS = 100;

function daysBetween(from: Date, to: Date): number {
  const millisPerDay = 24 * 60 * 60 * 1000;
  return Math.abs(Math.floor((to.getTime() - from.getTime()) / millisPerDay));
}

export function isSpecifiedPersonForSection(
  input: SpecifiedPersonCheckInput,
): SpecifiedPersonCheckResult {
  if (isCarveOutFromS206AB(input.section)) {
    return {
      isSpecifiedPerson: false,
      carveOutApplied: true,
      listIsStale: false,
      matchedListEntry: null,
      citations: [ITA_SECTIONS.SEC_206AB],
      notes:
        'Section is a 206AB carve-out (192 / 192A / 194B / 194BB / 194LBC / 194N) -- specified-person uplift does not apply',
    };
  }

  const matched = input.nonFilerListEntries.find(
    (entry) => entry.panFingerprint === input.deducteePanFingerprint,
  );

  const threshold = input.listFreshnessThresholdDays ?? DEFAULT_LIST_FRESHNESS_THRESHOLD_DAYS;
  const listFreshAsOf = matched?.listFreshAsOf ?? null;
  const ageInDays =
    listFreshAsOf === null ? Infinity : daysBetween(listFreshAsOf, input.deductionDate);
  const listIsStale = ageInDays > threshold;

  if (matched) {
    const matchedFreshNote = isSection206ABOmittedForDeductionDate(input.deductionDate)
      ? 'Matched in CBDT specified-persons list -- Section 206AB omitted by the Finance Act 2025 w.e.f. 1 April 2025; no uplift for this deduction date'
      : 'Matched in CBDT specified-persons list -- 206AB uplift applies';
    return {
      isSpecifiedPerson: true,
      carveOutApplied: false,
      listIsStale,
      matchedListEntry: matched,
      citations: [ITA_SECTIONS.SEC_206AB],
      notes: listIsStale
        ? `Matched in non-filer list but list is stale (last refresh ${ageInDays} days before deduction; threshold ${threshold} days). Verify against TRACES before proceeding.`
        : matchedFreshNote,
    };
  }

  return {
    isSpecifiedPerson: false,
    carveOutApplied: false,
    listIsStale: false,
    matchedListEntry: null,
    citations: [ITA_SECTIONS.SEC_206AB],
    notes: 'Not in non-filer list -- normal rate applies',
  };
}
