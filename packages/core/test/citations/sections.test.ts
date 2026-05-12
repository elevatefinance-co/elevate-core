/* Tests for the IT Act 1961 SectionCitation registry.
 * Every section reference in the rule engine flows through this registry so renames (rare but possible
 * on Act amendment) are a single-file edit.
 * Pinned: every entry is a section citation with act IT_ACT_1961,
 * the heads-of-income / charging / Chapter VI-A / capital-gains-rate sections are present,
 * and the sub-sectioned entries (17(2)(vi), 2(12A), 2(42A),
 * 80CCD sub-clauses) carry the expected sub-section / clause shape. Citations:
 * Sections 4 / 5 (charging), 17(2)(vi) (RSU perquisite), 87A (rebate),
 * 111A / 112 / 112A (capital-gains rates), 115BAC / 115BBH (regime + VDA),
 * 80C through 80U (Chapter VI-A).
 */

import { SECTIONS, sectionCitation } from '../../src/citations/sections.js';

describe('SECTIONS registry', () => {
  it('should expose every entry as a section citation against IT_ACT_1961', () => {
    for (const entry of Object.values(SECTIONS)) {
      expect(entry.kind).toBe('section');
      expect(entry.act).toBe('IT_ACT_1961');
    }
  });

  it('should expose a non-empty section string on every entry', () => {
    for (const [registryKey, entry] of Object.entries(SECTIONS)) {
      expect(entry.section.length, `${registryKey} missing section`).toBeGreaterThan(0);
    }
  });

  it('should pin charging sections 4 and 5', () => {
    expect(SECTIONS.SEC_4.section).toBe('4');
    expect(SECTIONS.SEC_5.section).toBe('5');
  });

  it('should pin Section 17 and the 17(2)(vi) RSU perquisite sub-clause', () => {
    expect(SECTIONS.SEC_17.section).toBe('17');
    expect(SECTIONS.SEC_17_2_vi.section).toBe('17');
    expect(SECTIONS.SEC_17_2_vi.subSection).toBe('2');
    expect(SECTIONS.SEC_17_2_vi.clause).toBe('vi');
  });

  it('should pin Section 2(12A) cess definition and Section 2(42A) holding-period definition', () => {
    expect(SECTIONS.SEC_2_12A.section).toBe('2');
    expect(SECTIONS.SEC_2_12A.subSection).toBe('12A');
    expect(SECTIONS.SEC_2_42A.section).toBe('2');
    expect(SECTIONS.SEC_2_42A.subSection).toBe('42A');
  });

  it('should pin capital-gains rate sections 111A / 112 / 112A / 50AA', () => {
    expect(SECTIONS.SEC_111A.section).toBe('111A');
    expect(SECTIONS.SEC_112.section).toBe('112');
    expect(SECTIONS.SEC_112A.section).toBe('112A');
    expect(SECTIONS.SEC_50AA.section).toBe('50AA');
  });

  it('should pin regime + VDA sections 115BAC / 115BAA / 115BAB / 115BBH', () => {
    expect(SECTIONS.SEC_115BAC.section).toBe('115BAC');
    expect(SECTIONS.SEC_115BAA.section).toBe('115BAA');
    expect(SECTIONS.SEC_115BAB.section).toBe('115BAB');
    expect(SECTIONS.SEC_115BBH.section).toBe('115BBH');
  });

  it('should pin Section 87A rebate', () => {
    expect(SECTIONS.SEC_87A.section).toBe('87A');
  });

  it('should pin Section 194S (TDS on VDA)', () => {
    expect(SECTIONS.SEC_194S.section).toBe('194S');
  });

  it('should pin Chapter VI-A 80C / 80CCC / 80CCD sub-clauses with correct shape', () => {
    expect(SECTIONS.SEC_80C.section).toBe('80C');
    expect(SECTIONS.SEC_80CCC.section).toBe('80CCC');
    expect(SECTIONS.SEC_80CCD_1.section).toBe('80CCD');
    expect(SECTIONS.SEC_80CCD_1.subSection).toBe('1');
    expect(SECTIONS.SEC_80CCD_1B.subSection).toBe('1B');
    expect(SECTIONS.SEC_80CCD_2.subSection).toBe('2');
  });

  it('should pin Chapter VI-A 80D / 80E / 80G / 80TTA / 80TTB', () => {
    expect(SECTIONS.SEC_80D.section).toBe('80D');
    expect(SECTIONS.SEC_80E.section).toBe('80E');
    expect(SECTIONS.SEC_80G.section).toBe('80G');
    expect(SECTIONS.SEC_80TTA.section).toBe('80TTA');
    expect(SECTIONS.SEC_80TTB.section).toBe('80TTB');
  });

  it('should pin DTAA relief sections 90 and 91', () => {
    expect(SECTIONS.SEC_90.section).toBe('90');
    expect(SECTIONS.SEC_91.section).toBe('91');
  });

  it('should omit the subSection key on plain entries (SEC_4 charging)', () => {
    expect('subSection' in SECTIONS.SEC_4).toBe(false);
    expect('clause' in SECTIONS.SEC_4).toBe(false);
    expect('note' in SECTIONS.SEC_4).toBe(true);
  });

  it('should include subSection but omit clause on Section 2(12A) cess definition', () => {
    expect('subSection' in SECTIONS.SEC_2_12A).toBe(true);
    expect(SECTIONS.SEC_2_12A.subSection).toBe('12A');
    expect('clause' in SECTIONS.SEC_2_12A).toBe(false);
    expect('note' in SECTIONS.SEC_2_12A).toBe(true);
  });

  it('should include subSection and clause on Section 17(2)(vi) RSU perquisite', () => {
    expect('subSection' in SECTIONS.SEC_17_2_vi).toBe(true);
    expect('clause' in SECTIONS.SEC_17_2_vi).toBe(true);
    expect('note' in SECTIONS.SEC_17_2_vi).toBe(true);
  });

  it('should omit the note key when the factory is called with note undefined', () => {
    const result = sectionCitation('999X', undefined, undefined, undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['act', 'kind', 'section']);
  });

  it('should omit the note key when the factory is called with note omitted entirely', () => {
    const result = sectionCitation('998X');
    expect('note' in result).toBe(false);
  });

  it('should match the exact registered shape for SEC_4 (only note set)', () => {
    expect(SECTIONS.SEC_4).toEqual({
      kind: 'section',
      act: 'IT_ACT_1961',
      section: '4',
      note: 'Charge of income-tax',
    });
    expect(Object.keys(SECTIONS.SEC_4).sort()).toEqual(['act', 'kind', 'note', 'section']);
  });

  it('should match the exact registered shape for SEC_2_12A (subSection + note set)', () => {
    expect(SECTIONS.SEC_2_12A).toEqual({
      kind: 'section',
      act: 'IT_ACT_1961',
      section: '2',
      subSection: '12A',
      note: 'Health and Education Cess. Definition',
    });
    expect(Object.keys(SECTIONS.SEC_2_12A).sort()).toEqual([
      'act',
      'kind',
      'note',
      'section',
      'subSection',
    ]);
  });

  it('should match the exact registered shape for SEC_17_2_vi (all optional fields set)', () => {
    expect(SECTIONS.SEC_17_2_vi).toEqual({
      kind: 'section',
      act: 'IT_ACT_1961',
      section: '17',
      subSection: '2',
      clause: 'vi',
      note: 'Perquisite. Securities / sweat equity (RSU/ESOP)',
    });
    expect(Object.keys(SECTIONS.SEC_17_2_vi).sort()).toEqual([
      'act',
      'clause',
      'kind',
      'note',
      'section',
      'subSection',
    ]);
  });
});
