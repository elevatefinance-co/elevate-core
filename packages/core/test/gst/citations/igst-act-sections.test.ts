/* Tests for the IGST Act 2017 SectionCitation registry. IGST levies cover inter-State supplies,
 * imports / exports, SEZ supplies, and OIDAR.
 * The place-of-supply rules in Sections 10 through 13 are the load-bearing rules every GSTR-1 row depends on.
 * Pinned: every entry is act IGST_ACT_2017, the 10 / 11 / 12 / 13 family is fully populated,
 * the Section 12 sub-sections covering the major service categories (3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 / 11
 * / 12 / 13 / 14) are present,
 * Section 13 OIDAR sub-section 12 is present,
 * and Section 16 (zero-rated) anchors the exports + SEZ refund flow. Citations:
 * IGST Act 2017 Sections 5, 7, 10, 11, 12, 13, 16, 19.
 */

import { IGST_ACT_SECTIONS, igst } from '../../../src/gst/citations/igst-act-sections.js';

describe('IGST_ACT_SECTIONS registry', () => {
  it('should expose every entry as a section citation against IGST_ACT_2017', () => {
    for (const entry of Object.values(IGST_ACT_SECTIONS)) {
      expect(entry.kind).toBe('section');
      expect(entry.act).toBe('IGST_ACT_2017');
    }
  });

  it('should pin foundational charging Section 5 and inter-State supply Section 7', () => {
    expect(IGST_ACT_SECTIONS.SEC_5.section).toBe('5');
    expect(IGST_ACT_SECTIONS.SEC_5_3.subSection).toBe('3');
    expect(IGST_ACT_SECTIONS.SEC_7.section).toBe('7');
  });

  it('should pin Section 10 goods place-of-supply with sub-clauses (a) through (e)', () => {
    expect(IGST_ACT_SECTIONS.SEC_10.section).toBe('10');
    expect(IGST_ACT_SECTIONS.SEC_10_1_A.clause).toBe('a');
    expect(IGST_ACT_SECTIONS.SEC_10_1_B.clause).toBe('b');
    expect(IGST_ACT_SECTIONS.SEC_10_1_C.clause).toBe('c');
    expect(IGST_ACT_SECTIONS.SEC_10_1_D.clause).toBe('d');
    expect(IGST_ACT_SECTIONS.SEC_10_1_E.clause).toBe('e');
  });

  it('should pin Section 11 imports / exports with sub-clauses (a) and (b)', () => {
    expect(IGST_ACT_SECTIONS.SEC_11.section).toBe('11');
    expect(IGST_ACT_SECTIONS.SEC_11_A.clause).toBe('a');
    expect(IGST_ACT_SECTIONS.SEC_11_B.clause).toBe('b');
  });

  it('should pin Section 12 (services in India) sub-sections covering the major categories', () => {
    expect(IGST_ACT_SECTIONS.SEC_12.section).toBe('12');
    expect(IGST_ACT_SECTIONS.SEC_12_3.subSection).toBe('3');
    expect(IGST_ACT_SECTIONS.SEC_12_4.subSection).toBe('4');
    expect(IGST_ACT_SECTIONS.SEC_12_5.subSection).toBe('5');
    expect(IGST_ACT_SECTIONS.SEC_12_6.subSection).toBe('6');
    expect(IGST_ACT_SECTIONS.SEC_12_7.subSection).toBe('7');
    expect(IGST_ACT_SECTIONS.SEC_12_8.subSection).toBe('8');
    expect(IGST_ACT_SECTIONS.SEC_12_9.subSection).toBe('9');
    expect(IGST_ACT_SECTIONS.SEC_12_10.subSection).toBe('10');
    expect(IGST_ACT_SECTIONS.SEC_12_11.subSection).toBe('11');
    expect(IGST_ACT_SECTIONS.SEC_12_12.subSection).toBe('12');
    expect(IGST_ACT_SECTIONS.SEC_12_13.subSection).toBe('13');
    expect(IGST_ACT_SECTIONS.SEC_12_14.subSection).toBe('14');
  });

  it('should pin Section 13 (services cross-border) sub-sections including the OIDAR carve-out', () => {
    expect(IGST_ACT_SECTIONS.SEC_13.section).toBe('13');
    expect(IGST_ACT_SECTIONS.SEC_13_3.subSection).toBe('3');
    expect(IGST_ACT_SECTIONS.SEC_13_4.subSection).toBe('4');
    expect(IGST_ACT_SECTIONS.SEC_13_5.subSection).toBe('5');
    expect(IGST_ACT_SECTIONS.SEC_13_6.subSection).toBe('6');
    expect(IGST_ACT_SECTIONS.SEC_13_7.subSection).toBe('7');
    expect(IGST_ACT_SECTIONS.SEC_13_8.subSection).toBe('8');
    expect(IGST_ACT_SECTIONS.SEC_13_9.subSection).toBe('9');
    expect(IGST_ACT_SECTIONS.SEC_13_10.subSection).toBe('10');
    expect(IGST_ACT_SECTIONS.SEC_13_12.subSection).toBe('12');
  });

  it('should pin Section 16 (zero-rated supply) for the exports + SEZ refund flow', () => {
    expect(IGST_ACT_SECTIONS.SEC_16.section).toBe('16');
  });

  it('should pin Section 19 (wrong-head tax adjustments)', () => {
    expect(IGST_ACT_SECTIONS.SEC_19.section).toBe('19');
  });

  it('should omit the subSection key on plain sections (SEC_2 definitions)', () => {
    expect('subSection' in IGST_ACT_SECTIONS.SEC_2).toBe(false);
    expect('clause' in IGST_ACT_SECTIONS.SEC_2).toBe(false);
    expect('note' in IGST_ACT_SECTIONS.SEC_2).toBe(true);
  });

  it('should include subSection but omit clause on Section 5(3) reverse charge', () => {
    expect('subSection' in IGST_ACT_SECTIONS.SEC_5_3).toBe(true);
    expect(IGST_ACT_SECTIONS.SEC_5_3.subSection).toBe('3');
    expect('clause' in IGST_ACT_SECTIONS.SEC_5_3).toBe(false);
    expect('note' in IGST_ACT_SECTIONS.SEC_5_3).toBe(true);
  });

  it('should include clause but omit subSection on Section 11(a) imports', () => {
    expect('subSection' in IGST_ACT_SECTIONS.SEC_11_A).toBe(false);
    expect('clause' in IGST_ACT_SECTIONS.SEC_11_A).toBe(true);
    expect(IGST_ACT_SECTIONS.SEC_11_A.clause).toBe('a');
    expect('note' in IGST_ACT_SECTIONS.SEC_11_A).toBe(true);
  });

  it('should include subSection and clause on Section 10(1)(a) goods place-of-supply', () => {
    expect('subSection' in IGST_ACT_SECTIONS.SEC_10_1_A).toBe(true);
    expect(IGST_ACT_SECTIONS.SEC_10_1_A.subSection).toBe('1');
    expect('clause' in IGST_ACT_SECTIONS.SEC_10_1_A).toBe(true);
    expect(IGST_ACT_SECTIONS.SEC_10_1_A.clause).toBe('a');
    expect('note' in IGST_ACT_SECTIONS.SEC_10_1_A).toBe(true);
  });

  it('should include the note key on every IGST entry', () => {
    for (const [registryKey, entry] of Object.entries(IGST_ACT_SECTIONS)) {
      expect('note' in entry, `${registryKey} missing note`).toBe(true);
      expect(entry.note?.length, `${registryKey} note empty`).toBeGreaterThan(0);
    }
  });

  it('should match the exact registered shape for SEC_2 (only note set)', () => {
    expect(IGST_ACT_SECTIONS.SEC_2).toEqual({
      kind: 'section',
      act: 'IGST_ACT_2017',
      section: '2',
      note: 'Definitions',
    });
    expect(Object.keys(IGST_ACT_SECTIONS.SEC_2).sort()).toEqual(['act', 'kind', 'note', 'section']);
  });

  it('should match the exact registered shape for SEC_5_3 (subSection + note set)', () => {
    expect(IGST_ACT_SECTIONS.SEC_5_3).toEqual({
      kind: 'section',
      act: 'IGST_ACT_2017',
      section: '5',
      subSection: '3',
      note: 'Reverse charge for IGST',
    });
  });

  it('should match the exact registered shape for SEC_11_A (clause + note set, subSection omitted)', () => {
    expect(IGST_ACT_SECTIONS.SEC_11_A).toEqual({
      kind: 'section',
      act: 'IGST_ACT_2017',
      section: '11',
      clause: 'a',
      note: 'Imports -- location of importer',
    });
    expect(Object.keys(IGST_ACT_SECTIONS.SEC_11_A).sort()).toEqual([
      'act',
      'clause',
      'kind',
      'note',
      'section',
    ]);
  });

  it('should omit the note key when the igst factory is called with note undefined', () => {
    const result = igst('999X', undefined, undefined, undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['act', 'kind', 'section']);
  });

  it('should omit the note key when the igst factory is called with note omitted entirely', () => {
    const result = igst('998X');
    expect('note' in result).toBe(false);
  });

  it('should match the exact registered shape for SEC_10_1_A (all optional fields set)', () => {
    expect(IGST_ACT_SECTIONS.SEC_10_1_A).toEqual({
      kind: 'section',
      act: 'IGST_ACT_2017',
      section: '10',
      subSection: '1',
      clause: 'a',
      note: 'Goods involving movement -- delivery location',
    });
    expect(Object.keys(IGST_ACT_SECTIONS.SEC_10_1_A).sort()).toEqual([
      'act',
      'clause',
      'kind',
      'note',
      'section',
      'subSection',
    ]);
  });
});
