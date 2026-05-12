/* Tests for the specified-person determination per Section 206AB / 206CCA.
 * Verifies non-filer-list match logic,
 * the carve-out enforcement (192 / 192A / 194B / 194BB / 194LBC / 194N), and the list-staleness flag.
 */

import { isSpecifiedPersonForSection } from '../../src/tds/pan-validation/index.js';
import { resolveRate } from '../../src/tds/rates/rate-band-resolver.js';
import { ITA_SECTIONS } from '../../src/tds/citations/ita-sections.js';

describe('isSpecifiedPersonForSection', () => {
  it('returns false when PAN not in non-filer list', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [],
      deducteePanFingerprint: 'fp-not-listed',
    });
    expect(result.isSpecifiedPerson).toBe(false);
    expect(result.matchedListEntry).toBeNull();
  });

  it('returns true when PAN matches a fresh list entry', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
    });
    expect(result.isSpecifiedPerson).toBe(true);
    expect(result.matchedListEntry?.panFingerprint).toBe('fp-listed');
    expect(result.listIsStale).toBe(false);
  });

  it('flags listIsStale when freshness exceeds threshold', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-stale',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2024-12-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-stale',
      listFreshnessThresholdDays: 30,
    });
    expect(result.isSpecifiedPerson).toBe(true);
    expect(result.listIsStale).toBe(true);
    expect(result.notes).toContain('stale');
  });

  it('returns carveOutApplied=true for Section 192 (salary)', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S192',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
    });
    expect(result.carveOutApplied).toBe(true);
    expect(result.isSpecifiedPerson).toBe(false);
    expect(result.notes).toContain('carve-out');
  });

  it('returns carveOutApplied=true for 194B / 194BB / 194N', () => {
    const sections = ['S194B', 'S194BB', 'S194N'] as const;
    for (const section of sections) {
      const result = isSpecifiedPersonForSection({
        section,
        deductionDate: new Date('2025-08-15T00:00:00Z'),
        nonFilerListEntries: [
          {
            panFingerprint: 'fp-listed',
            publishedFy: 'FY2025-26',
            listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
          },
        ],
        deducteePanFingerprint: 'fp-listed',
      });
      expect(result.carveOutApplied).toBe(true);
      expect(result.isSpecifiedPerson).toBe(false);
    }
  });

  it('non-carve-out section with matched list entry triggers specified-person flag', () => {
    const sections = ['S194C_OTHER', 'S194J_PROFESSIONAL', 'S194Q'] as const;
    for (const section of sections) {
      const result = isSpecifiedPersonForSection({
        section,
        deductionDate: new Date('2025-08-15T00:00:00Z'),
        nonFilerListEntries: [
          {
            panFingerprint: 'fp-listed',
            publishedFy: 'FY2025-26',
            listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
          },
        ],
        deducteePanFingerprint: 'fp-listed',
      });
      expect(result.carveOutApplied).toBe(false);
      expect(result.isSpecifiedPerson).toBe(true);
    }
  });
});

describe('isSpecifiedPersonForSection -- exact note strings', () => {
  it('should match not in non-filer list', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [],
      deducteePanFingerprint: 'fp-not-listed',
    });
    expect(result.notes).toBe('Not in non-filer list -- normal rate applies');
  });

  it('should flag the FA 2025 omission on a fresh match with a post-1-April-2025 deduction date', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
    });
    expect(result.notes).toBe(
      'Matched in CBDT specified-persons list -- Section 206AB omitted by the Finance Act 2025 w.e.f. 1 April 2025; no uplift for this deduction date',
    );
  });

  it('should keep the uplift-applies narrative on a fresh match with a pre-1-April-2025 deduction date', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-03-15T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2024-25',
          listFreshAsOf: new Date('2025-01-15T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
    });
    expect(result.isSpecifiedPerson).toBe(true);
    expect(result.notes).toBe('Matched in CBDT specified-persons list -- 206AB uplift applies');
  });

  it('S192A carve-out applies (EPF withdrawal) -- carve-out narrative used', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S192A',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
    });
    expect(result.carveOutApplied).toBe(true);
    expect(result.isSpecifiedPerson).toBe(false);
    expect(result.notes).toBe(
      'Section is a 206AB carve-out (192 / 192A / 194B / 194BB / 194LBC / 194N) -- specified-person uplift does not apply',
    );
  });
});

describe('isSpecifiedPersonForSection -- staleness threshold boundary', () => {
  it('refresh exactly 30 days before deduction with threshold 30 -> not stale (kills > -> >= mutant)', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-08-31T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-08-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
      listFreshnessThresholdDays: 30,
    });
    expect(result.listIsStale).toBe(false);
    expect(result.notes).toBe(
      'Matched in CBDT specified-persons list -- Section 206AB omitted by the Finance Act 2025 w.e.f. 1 April 2025; no uplift for this deduction date',
    );
  });

  it('refresh 31 days before deduction with threshold 30 -> stale, narrative includes age and threshold', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-09-01T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-08-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
      listFreshnessThresholdDays: 30,
    });
    expect(result.listIsStale).toBe(true);
    expect(result.notes).toContain('31 days');
    expect(result.notes).toContain('threshold 30 days');
    expect(result.notes).toContain('TRACES');
  });

  it('default freshness threshold of 100 days -- 99 days is fresh, 101 is stale', () => {
    const fresh99Days = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-04-09T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-01-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
    });
    const stale101Days = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-04-12T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-01-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
    });
    expect(fresh99Days.listIsStale).toBe(false);
    expect(stale101Days.listIsStale).toBe(true);
  });
});

describe('resolveRate -- 206AA / 206AB / 206CCA interaction matrix', () => {
  const PRE_OCT_2024_RM = new Date('2024-09-15T00:00:00Z');

  it('matrix: PAN valid + not specified -> NONE, baseRate unchanged', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024_RM,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.upliftReason).toBe('NONE');
    expect(result.upliftFactor).toBe(1);
    expect(result.effectiveRateBasisPoints).toBe(result.baseRateBasisPoints);
  });

  it('matrix: PAN not_furnished + not specified -> NO_PAN_S206AA', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024_RM,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.upliftReason).toBe('NO_PAN_S206AA');
  });

  it('matrix: PAN valid + specified -> SPECIFIED_PERSON_S206AB', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024_RM,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('SPECIFIED_PERSON_S206AB');
  });

  it('matrix: PAN not_furnished + specified -> 206AA wins (resolved first)', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024_RM,
      panStatus: 'not_furnished',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('NO_PAN_S206AA');
  });

  it('matrix: PAN inoperative + specified -> PAN_INOPERATIVE wins', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024_RM,
      panStatus: 'inoperative',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('PAN_INOPERATIVE');
  });

  it('matrix: TCS S206C_1H + not_furnished -> 206AA (resolver path), max(2x = 20, 2000) = 2000', () => {
    const result = resolveRate({
      section: 'S206C_1H',
      deductionDate: PRE_OCT_2024_RM,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.upliftReason).toBe('NO_PAN_S206AA');
    expect(result.effectiveRateBasisPoints).toBe(2000);
  });

  it('matrix: TCS S206C_1H + specified -> 206AB, max(2x = 20, 500) = 500', () => {
    const result = resolveRate({
      section: 'S206C_1H',
      deductionDate: PRE_OCT_2024_RM,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('SPECIFIED_PERSON_S206AB');
    expect(result.effectiveRateBasisPoints).toBe(500);
  });

  it('matrix: 206AB carve-out 194N + specified + not_furnished -> 206AA wins, carve-out only blocks 206AB', () => {
    const result = resolveRate({
      section: 'S194N',
      deductionDate: PRE_OCT_2024_RM,
      panStatus: 'not_furnished',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('NO_PAN_S206AA');
  });

  it('matrix: 206AB carve-out 194N + valid PAN + specified -> NONE (carve-out blocks 206AB)', () => {
    const result = resolveRate({
      section: 'S194N',
      deductionDate: PRE_OCT_2024_RM,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('NONE');
    expect(result.upliftFactor).toBe(1);
  });
});

describe('isSpecifiedPersonForSection -- exhaustive shape on every return path', () => {
  it('carve-out path returns listIsStale: false, citations: [SEC_206AB], and matchedListEntry: null', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S192',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
    });
    expect(result.listIsStale).toBe(false);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_206AB]);
    expect(result.matchedListEntry).toBeNull();
  });

  it('matched path returns citations: [SEC_206AB] (single-element, not empty)', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-listed',
    });
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_206AB]);
  });

  it('not-matched path returns carveOutApplied: false, listIsStale: false, citations: [SEC_206AB]', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-other',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-not-listed',
    });
    expect(result.isSpecifiedPerson).toBe(false);
    expect(result.carveOutApplied).toBe(false);
    expect(result.listIsStale).toBe(false);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_206AB]);
    expect(result.matchedListEntry).toBeNull();
  });

  it('PAN fingerprint comparison is strict equality (kills (entry) => true predicate mutant)', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: new Date('2025-08-15T00:00:00Z'),
      nonFilerListEntries: [
        {
          panFingerprint: 'fp-listed-A',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
        },
        {
          panFingerprint: 'fp-listed-B',
          publishedFy: 'FY2025-26',
          listFreshAsOf: new Date('2025-07-01T00:00:00Z'),
        },
      ],
      deducteePanFingerprint: 'fp-not-in-the-list',
    });
    expect(result.isSpecifiedPerson).toBe(false);
    expect(result.matchedListEntry).toBeNull();
  });
});
