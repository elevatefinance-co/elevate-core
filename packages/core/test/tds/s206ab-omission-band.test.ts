/* Section 206AB omission band -- Finance Act 2025.
 * The consolidated Income-tax Act text reads "206AB. [Omitted by the Finance Act, 2025, w.e.f.
 * 1-4-2025.]" (206CCA likewise). The specified-person (non-filer) uplift therefore applies only to
 * deduction dates before 1 April 2025 -- late filings and corrections of earlier periods -- and never
 * on or after it. Section 206AA (no-PAN / inoperative-PAN, 20 percent floor) is unchanged by the
 * Finance Act 2025 and keeps applying on both sides of the date.
 *
 * Primary sources:
 *   Finance Act 2025 -- omission of Sections 206AB / 206CCA, effective 1 April 2025
 *   Section 206AA -- Income-tax Act 1961 (unchanged)
 */

import {
  isSection206ABOmittedForDeductionDate,
  resolveRate,
} from '../../src/tds/rates/rate-band-resolver.js';
import { isSpecifiedPersonForSection } from '../../src/tds/pan-validation/index.js';
import { ITA_SECTIONS } from '../../src/tds/citations/ita-sections.js';
import { FINANCE_ACTS_TDS } from '../../src/tds/citations/finance-acts.js';

const LAST_INSTANT_BEFORE_OMISSION = new Date('2025-03-31T23:59:59Z');
const OMISSION_EFFECTIVE_INSTANT = new Date('2025-04-01T00:00:00Z');
const POST_OMISSION = new Date('2025-08-15T00:00:00Z');

describe('isSection206ABOmittedForDeductionDate -- boundary', () => {
  it('returns false for the last instant of 31 March 2025', () => {
    expect(isSection206ABOmittedForDeductionDate(LAST_INSTANT_BEFORE_OMISSION)).toBe(false);
  });

  it('returns true from the first instant of 1 April 2025', () => {
    expect(isSection206ABOmittedForDeductionDate(OMISSION_EFFECTIVE_INSTANT)).toBe(true);
    expect(isSection206ABOmittedForDeductionDate(POST_OMISSION)).toBe(true);
  });
});

describe('resolveRate -- 206AB uplift applies up to 31 March 2025', () => {
  it('S194A specified person on 31 March 2025 -> max(2x, 5 percent) uplift with 206AB citations', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: LAST_INSTANT_BEFORE_OMISSION,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.effectiveRateBasisPoints).toBe(2000);
    expect(result.upliftReason).toBe('SPECIFIED_PERSON_S206AB');
    expect(result.upliftFactor).toBe(2);
    expect(result.citations).toEqual([
      ITA_SECTIONS.SEC_194A,
      ITA_SECTIONS.SEC_206AB,
      FINANCE_ACTS_TDS.FA_2023_S206AB_CARVEOUT,
    ]);
    expect(result.notes).toBe('206AB uplift applied -- specified person (non-filer)');
  });

  it('S194C_OTHER specified person on 31 March 2025 -> 5 percent floor applies', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: LAST_INSTANT_BEFORE_OMISSION,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.baseRateBasisPoints).toBe(200);
    expect(result.effectiveRateBasisPoints).toBe(500);
    expect(result.upliftReason).toBe('SPECIFIED_PERSON_S206AB');
  });
});

describe('resolveRate -- 206AB uplift never applies from 1 April 2025', () => {
  it('S194C_OTHER specified person on 1 April 2025 -> base rate, NONE, omission citation and notes', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: OMISSION_EFFECTIVE_INSTANT,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.baseRateBasisPoints).toBe(200);
    expect(result.effectiveRateBasisPoints).toBe(200);
    expect(result.upliftReason).toBe('NONE');
    expect(result.upliftFactor).toBe(1);
    expect(result.citations).toEqual([
      ITA_SECTIONS.SEC_194C,
      ITA_SECTIONS.SEC_206AB,
      FINANCE_ACTS_TDS.FA_2025_S206AB_OMISSION,
    ]);
    expect(result.notes).toBe(
      'Section 206AB omitted by the Finance Act 2025 w.e.f. 1 April 2025 -- no specified-person uplift',
    );
  });

  it('S194A specified person on 1 April 2025 -> threshold band notes carry the omission suffix', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: OMISSION_EFFECTIVE_INSTANT,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.effectiveRateBasisPoints).toBe(1000);
    expect(result.upliftReason).toBe('NONE');
    expect(result.citations).toEqual([
      ITA_SECTIONS.SEC_194A,
      FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194A,
      ITA_SECTIONS.SEC_206AB,
      FINANCE_ACTS_TDS.FA_2025_S206AB_OMISSION,
    ]);
    expect(result.notes).toBe(
      'Thresholds from 1 April 2025 -- Rs 1,00,000 senior citizen / Rs 50,000 others for bank, co-operative bank and post office payers, Rs 10,000 for other payers (previously Rs 50,000 / Rs 40,000 / Rs 5,000); Section 206AB omitted by the Finance Act 2025 w.e.f. 1 April 2025 -- no specified-person uplift',
    );
  });

  it('S194J_PROFESSIONAL specified person well after the omission -> still no uplift', () => {
    const result = resolveRate({
      section: 'S194J_PROFESSIONAL',
      deductionDate: POST_OMISSION,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('NONE');
    expect(result.effectiveRateBasisPoints).toBe(result.baseRateBasisPoints);
  });

  it('carve-out section S194B specified person post-omission -> plain NONE (carve-out path, no omission citation)', () => {
    const result = resolveRate({
      section: 'S194B',
      deductionDate: POST_OMISSION,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('NONE');
    expect(result.citations).toEqual([
      ITA_SECTIONS.SEC_194B,
      FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194B,
    ]);
  });
});

describe('resolveRate -- 206AA is unchanged by the Finance Act 2025', () => {
  it('S194A no-PAN uplift applies on 31 March 2025 and on 1 April 2025', () => {
    const before = resolveRate({
      section: 'S194A',
      deductionDate: LAST_INSTANT_BEFORE_OMISSION,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    const after = resolveRate({
      section: 'S194A',
      deductionDate: OMISSION_EFFECTIVE_INSTANT,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(before.upliftReason).toBe('NO_PAN_S206AA');
    expect(before.effectiveRateBasisPoints).toBe(2000);
    expect(after.upliftReason).toBe('NO_PAN_S206AA');
    expect(after.effectiveRateBasisPoints).toBe(2000);
  });

  it('S194A inoperative-PAN uplift applies on 31 March 2025 and on 1 April 2025', () => {
    const before = resolveRate({
      section: 'S194A',
      deductionDate: LAST_INSTANT_BEFORE_OMISSION,
      panStatus: 'inoperative',
      isSpecifiedPerson: false,
    });
    const after = resolveRate({
      section: 'S194A',
      deductionDate: OMISSION_EFFECTIVE_INSTANT,
      panStatus: 'inoperative',
      isSpecifiedPerson: false,
    });
    expect(before.upliftReason).toBe('PAN_INOPERATIVE');
    expect(before.effectiveRateBasisPoints).toBe(2000);
    expect(after.upliftReason).toBe('PAN_INOPERATIVE');
    expect(after.effectiveRateBasisPoints).toBe(2000);
  });

  it('PAN status beats the specified-person flag on both sides of the omission date', () => {
    const before = resolveRate({
      section: 'S194A',
      deductionDate: LAST_INSTANT_BEFORE_OMISSION,
      panStatus: 'not_furnished',
      isSpecifiedPerson: true,
    });
    const after = resolveRate({
      section: 'S194A',
      deductionDate: OMISSION_EFFECTIVE_INSTANT,
      panStatus: 'not_furnished',
      isSpecifiedPerson: true,
    });
    expect(before.upliftReason).toBe('NO_PAN_S206AA');
    expect(after.upliftReason).toBe('NO_PAN_S206AA');
  });
});

describe('isSpecifiedPersonForSection -- narrative reflects the omission band', () => {
  const listEntries = [
    {
      panFingerprint: 'fp-listed',
      publishedFy: 'FY2024-25',
      listFreshAsOf: new Date('2025-03-01T00:00:00Z'),
    },
  ];

  it('fresh match on 31 March 2025 -> uplift-applies narrative', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: LAST_INSTANT_BEFORE_OMISSION,
      nonFilerListEntries: listEntries,
      deducteePanFingerprint: 'fp-listed',
    });
    expect(result.isSpecifiedPerson).toBe(true);
    expect(result.notes).toBe('Matched in CBDT specified-persons list -- 206AB uplift applies');
  });

  it('fresh match on 1 April 2025 -> omission narrative, list membership still reported', () => {
    const result = isSpecifiedPersonForSection({
      section: 'S194A',
      deductionDate: OMISSION_EFFECTIVE_INSTANT,
      nonFilerListEntries: listEntries,
      deducteePanFingerprint: 'fp-listed',
    });
    expect(result.isSpecifiedPerson).toBe(true);
    expect(result.notes).toBe(
      'Matched in CBDT specified-persons list -- Section 206AB omitted by the Finance Act 2025 w.e.f. 1 April 2025; no uplift for this deduction date',
    );
  });
});
