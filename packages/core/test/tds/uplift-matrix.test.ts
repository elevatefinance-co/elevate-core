/* Cross-cutting matrix coverage for the TDS rate-band uplift logic.
 * The base resolver test covers happy-path per-section rates;
 * this file pins the *interaction matrix* between PAN status (valid / not_furnished / inoperative) and
 * specified-person status (true / false),
 * the 206AB carve-out (Sections 192, 192A, 194B, 194BB, 194N),
 * the precedence rule (no-PAN / inoperative beats specified-person),
 * and the floor rules (20 percent floor for 206AA, 5 percent floor for 206AB).
 *
 * Primary sources:
 *   Section 206AA  -- Income-tax Act 1961
 *   Section 206AB  -- Income-tax Act 1961, inserted by Finance Act 2021
 *   Finance Act 2023, Section 92 -- 206AB carve-out for 192/192A/194B/194BB/194N
 *   CBDT Circular No. 5/2024 (06.03.2024) -- inoperative-PAN clarification
 */

import { resolveRate, isCarveOutFromS206AB } from '../../src/tds/rates/rate-band-resolver.js';
import type { TdsSectionKey } from '../../src/tds/rates/rate-band-resolver.js';

const POST_OCT_2024 = new Date('2024-10-15T00:00:00Z');

describe('206AB carve-out matrix -- specified-person uplift never applied to carve-out sections', () => {
  const carveOutSections: readonly TdsSectionKey[] = ['S192', 'S192A', 'S194B', 'S194BB', 'S194N'];

  for (const section of carveOutSections) {
    it(`should leave ${section} at base rate even when the deductee is a specified person`, () => {
      const result = resolveRate({
        section,
        deductionDate: POST_OCT_2024,
        panStatus: 'valid',
        isSpecifiedPerson: true,
      });
      expect(result.upliftReason).toBe('NONE');
      expect(result.effectiveRateBasisPoints).toBe(result.baseRateBasisPoints);
    });
  }

  it('should expose isCarveOutFromS206AB() returning true for every documented carve-out section', () => {
    for (const section of carveOutSections) {
      expect(isCarveOutFromS206AB(section)).toBe(true);
    }
  });

  it('should expose isCarveOutFromS206AB() returning false for at least one non-carve-out section', () => {
    expect(isCarveOutFromS206AB('S194C_OTHER')).toBe(false);
    expect(isCarveOutFromS206AB('S194J_PROFESSIONAL')).toBe(false);
    expect(isCarveOutFromS206AB('S194Q')).toBe(false);
  });
});

describe('206AA / 206AB precedence -- PAN status beats specified-person flag', () => {
  it('should apply the NO_PAN_S206AA uplift (not 206AB) when both no-PAN and specified-person are true', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: POST_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('NO_PAN_S206AA');
  });

  it('should apply the PAN_INOPERATIVE uplift (not 206AB) when both inoperative and specified-person are true', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: POST_OCT_2024,
      panStatus: 'inoperative',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('PAN_INOPERATIVE');
  });
});

describe('206AA floor -- effectiveRate respects max(2x, 20%) when PAN missing', () => {
  it('should pin to the 2000bp floor when the base rate is 1 percent (S194C_INDIVIDUAL_HUF, 2x = 200bp < 2000bp)', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: POST_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(100);
    expect(result.effectiveRateBasisPoints).toBe(2000);
    expect(result.upliftReason).toBe('NO_PAN_S206AA');
  });

  it('should pin to the doubled rate when 2x exceeds 20 percent (S194B 30 percent x 2 = 60 percent)', () => {
    const result = resolveRate({
      section: 'S194B',
      deductionDate: POST_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(3000);
    expect(result.effectiveRateBasisPoints).toBe(6000);
  });
});

describe('206AB floor -- effectiveRate respects max(2x, 5%) when specified person', () => {
  it('should pin to the 500bp floor when the base rate is 1 percent (S194C_INDIVIDUAL_HUF, 2x = 200bp < 500bp)', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.baseRateBasisPoints).toBe(100);
    expect(result.effectiveRateBasisPoints).toBe(500);
    expect(result.upliftReason).toBe('SPECIFIED_PERSON_S206AB');
  });

  it('should pin to the doubled rate when 2x exceeds 5 percent (S194J professional 10 percent x 2 = 20 percent)', () => {
    const result = resolveRate({
      section: 'S194J_PROFESSIONAL',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.effectiveRateBasisPoints).toBe(2000);
    expect(result.upliftReason).toBe('SPECIFIED_PERSON_S206AB');
  });
});

describe('upliftFactor surfaces a numeric ratio for the audit trail', () => {
  it('should return upliftFactor of 1 for the no-uplift case (audit trail signals "no override")', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.upliftFactor).toBe(1);
  });

  it('should return upliftFactor of 2 when 2x dominates the floor (S194B no-PAN: 6000 / 3000 = 2)', () => {
    const result = resolveRate({
      section: 'S194B',
      deductionDate: POST_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.upliftFactor).toBe(2);
  });

  it('should return upliftFactor of 5 when the 5 percent 206AB floor dominates (S194C_INDIVIDUAL_HUF specified-person: 500 / 100 = 5)', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.upliftFactor).toBe(5);
  });

  it('should return upliftFactor of 20 when the 20 percent 206AA floor dominates (S194C_INDIVIDUAL_HUF no-PAN: 2000 / 100 = 20)', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: POST_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.upliftFactor).toBe(20);
  });
});

describe('citations matrix -- the right ITA section appears in the citations bundle for each uplift kind', () => {
  it('should include Section 206AA in the citations when no-PAN uplift fires', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: POST_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    const sectionTitles = result.citations
      .map((c) => (c.kind === 'section' ? c.section : ''))
      .join(' | ');
    expect(sectionTitles).toContain('206AA');
  });

  it('should include Section 206AB + the FA-2023 carve-out citation when specified-person uplift fires', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    const sectionTitles = result.citations
      .map((c) => (c.kind === 'section' ? c.section : ''))
      .join(' | ');
    expect(sectionTitles).toContain('206AB');
  });

  it('should include Section 206AA in the citations when inoperative-PAN uplift fires (treated as 206AA per CBDT Circular 5/2024)', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: POST_OCT_2024,
      panStatus: 'inoperative',
      isSpecifiedPerson: false,
    });
    const sectionTitles = result.citations
      .map((c) => (c.kind === 'section' ? c.section : ''))
      .join(' | ');
    expect(sectionTitles).toContain('206AA');
  });
});

describe('notes field -- carries human-readable description of which uplift was applied', () => {
  it('should mention the 206AA uplift in the notes when no PAN', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: POST_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.notes ?? '').toMatch(/206AA/i);
  });

  it('should mention the inoperative-PAN clarification in the notes when PAN is inoperative', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: POST_OCT_2024,
      panStatus: 'inoperative',
      isSpecifiedPerson: false,
    });
    expect(result.notes ?? '').toMatch(/inoperative/i);
  });

  it('should mention the 206AB uplift in the notes when specified person', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.notes ?? '').toMatch(/206AB/i);
  });
});
