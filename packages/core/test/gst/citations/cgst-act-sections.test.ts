/* Tests for the CGST Act 2017 SectionCitation registry.
 * Every gst-namespace rule that depends on a Section of the CGST Act cites against an entry here,
 * never an inline string.
 * The registry is append-only -- existing entries never mutate so historical computations stay reproducible.
 * Pinned: every entry is act CGST_ACT_2017,
 * the headline charging / eligibility / blocked-credit / penalty / registration sections are present,
 * the Section 17(5) sub-clauses span (a) through (k),
 * and Section 50 separates 50(1) from 50(3) (both at the notified 18 percent operative rate).
 * Citations: CGST Act 2017 Sections 9, 10, 16 (and sub-clauses 16(2) / 16(2)(aa) / 16(2)(ba) / 16(4)),
 * 17 (and 17(5) sub-clauses), 22, 24, 31, 47, 50, 51, 52.
 */

import { CGST_ACT_SECTIONS, cgst } from '../../../src/gst/citations/cgst-act-sections.js';

describe('CGST_ACT_SECTIONS registry', () => {
  it('should expose every entry as a section citation against CGST_ACT_2017', () => {
    for (const entry of Object.values(CGST_ACT_SECTIONS)) {
      expect(entry.kind).toBe('section');
      expect(entry.act).toBe('CGST_ACT_2017');
    }
  });

  it('should expose a non-empty section string on every entry', () => {
    for (const [registryKey, entry] of Object.entries(CGST_ACT_SECTIONS)) {
      expect(entry.section.length, `${registryKey} missing section`).toBeGreaterThan(0);
    }
  });

  it('should pin charging Section 9 plus the reverse-charge and ECO sub-sections', () => {
    expect(CGST_ACT_SECTIONS.SEC_9.section).toBe('9');
    expect(CGST_ACT_SECTIONS.SEC_9_3.subSection).toBe('3');
    expect(CGST_ACT_SECTIONS.SEC_9_4.subSection).toBe('4');
    expect(CGST_ACT_SECTIONS.SEC_9_5.subSection).toBe('5');
  });

  it('should pin Section 10 (composition levy)', () => {
    expect(CGST_ACT_SECTIONS.SEC_10.section).toBe('10');
  });

  it('should pin every Section 16 ITC eligibility sub-clause', () => {
    expect(CGST_ACT_SECTIONS.SEC_16.section).toBe('16');
    expect(CGST_ACT_SECTIONS.SEC_16_2.subSection).toBe('2');
    expect(CGST_ACT_SECTIONS.SEC_16_2_AA.clause).toBe('aa');
    expect(CGST_ACT_SECTIONS.SEC_16_2_BA.clause).toBe('ba');
    expect(CGST_ACT_SECTIONS.SEC_16_4.subSection).toBe('4');
  });

  it('should pin every Section 17(5) blocked-credit sub-clause from a through k', () => {
    expect(CGST_ACT_SECTIONS.SEC_17_5_A.clause).toBe('a');
    expect(CGST_ACT_SECTIONS.SEC_17_5_B.clause).toBe('b');
    expect(CGST_ACT_SECTIONS.SEC_17_5_C.clause).toBe('c');
    expect(CGST_ACT_SECTIONS.SEC_17_5_D.clause).toBe('d');
    expect(CGST_ACT_SECTIONS.SEC_17_5_E.clause).toBe('e');
    expect(CGST_ACT_SECTIONS.SEC_17_5_F.clause).toBe('f');
    expect(CGST_ACT_SECTIONS.SEC_17_5_G.clause).toBe('g');
    expect(CGST_ACT_SECTIONS.SEC_17_5_H.clause).toBe('h');
    expect(CGST_ACT_SECTIONS.SEC_17_5_I.clause).toBe('i');
    expect(CGST_ACT_SECTIONS.SEC_17_5_J.clause).toBe('j');
    expect(CGST_ACT_SECTIONS.SEC_17_5_K.clause).toBe('k');
  });

  it('should pin registration Sections 22, 24, 25', () => {
    expect(CGST_ACT_SECTIONS.SEC_22.section).toBe('22');
    expect(CGST_ACT_SECTIONS.SEC_24.section).toBe('24');
    expect(CGST_ACT_SECTIONS.SEC_25.section).toBe('25');
  });

  it('should pin Section 50 (interest) and distinguish 50(1) from 50(3)', () => {
    expect(CGST_ACT_SECTIONS.SEC_50.section).toBe('50');
    expect(CGST_ACT_SECTIONS.SEC_50_1.subSection).toBe('1');
    expect(CGST_ACT_SECTIONS.SEC_50_3.subSection).toBe('3');
  });

  it('should record the 50(3) notified 18 percent rate against the 24 percent statutory ceiling', () => {
    expect(CGST_ACT_SECTIONS.SEC_50_3.note).toMatch(/18 percent/);
    expect(CGST_ACT_SECTIONS.SEC_50_3.note).toMatch(/ceiling 24 percent/);
    expect(CGST_ACT_SECTIONS.SEC_50_3.note).toMatch(/9\/2022-CT/);
  });

  it('should pin Section 47 (late fee)', () => {
    expect(CGST_ACT_SECTIONS.SEC_47.section).toBe('47');
  });

  it('should pin GST-side TDS / TCS Sections 51 and 52 (distinct from Income-Tax TDS)', () => {
    expect(CGST_ACT_SECTIONS.SEC_51.section).toBe('51');
    expect(CGST_ACT_SECTIONS.SEC_52.section).toBe('52');
  });

  it('should pin demand-and-recovery Sections 73, 74 and 74A', () => {
    expect(CGST_ACT_SECTIONS.SEC_73.section).toBe('73');
    expect(CGST_ACT_SECTIONS.SEC_74.section).toBe('74');
    expect(CGST_ACT_SECTIONS.SEC_74A.section).toBe('74A');
    expect(CGST_ACT_SECTIONS.SEC_74A.note).toMatch(/FY 2024-25/);
  });

  it('should pin the substituted clause (i) demand entry with the FY 2023-24 qualification', () => {
    expect(CGST_ACT_SECTIONS.SEC_17_5_I_TAX_PAID_DEMANDS.section).toBe('17');
    expect(CGST_ACT_SECTIONS.SEC_17_5_I_TAX_PAID_DEMANDS.subSection).toBe('5');
    expect(CGST_ACT_SECTIONS.SEC_17_5_I_TAX_PAID_DEMANDS.clause).toBe('i');
    expect(CGST_ACT_SECTIONS.SEC_17_5_I_TAX_PAID_DEMANDS.note).toMatch(/FY 2023-24/);
    expect(CGST_ACT_SECTIONS.SEC_17_5_I_TAX_PAID_DEMANDS.note).toMatch(/1 November 2024/);
  });

  it('should pin Section 39 (returns) and the ISD / NRTP sub-sections', () => {
    expect(CGST_ACT_SECTIONS.SEC_39.section).toBe('39');
    expect(CGST_ACT_SECTIONS.SEC_39_4.subSection).toBe('4');
    expect(CGST_ACT_SECTIONS.SEC_39_5.subSection).toBe('5');
  });

  it('should omit the subSection key on plain sections (SEC_2 definitions)', () => {
    expect('subSection' in CGST_ACT_SECTIONS.SEC_2).toBe(false);
    expect('clause' in CGST_ACT_SECTIONS.SEC_2).toBe(false);
    expect('note' in CGST_ACT_SECTIONS.SEC_2).toBe(true);
  });

  it('should include subSection but omit clause on Section 16(2) ITC conditions', () => {
    expect('subSection' in CGST_ACT_SECTIONS.SEC_16_2).toBe(true);
    expect(CGST_ACT_SECTIONS.SEC_16_2.subSection).toBe('2');
    expect('clause' in CGST_ACT_SECTIONS.SEC_16_2).toBe(false);
    expect('note' in CGST_ACT_SECTIONS.SEC_16_2).toBe(true);
  });

  it('should include subSection and clause on Section 17(5)(a) blocked-credit motor vehicles', () => {
    expect('subSection' in CGST_ACT_SECTIONS.SEC_17_5_A).toBe(true);
    expect(CGST_ACT_SECTIONS.SEC_17_5_A.subSection).toBe('5');
    expect('clause' in CGST_ACT_SECTIONS.SEC_17_5_A).toBe(true);
    expect(CGST_ACT_SECTIONS.SEC_17_5_A.clause).toBe('a');
    expect('note' in CGST_ACT_SECTIONS.SEC_17_5_A).toBe(true);
  });

  it('should match the exact registered shape for SEC_2 (only note set)', () => {
    expect(CGST_ACT_SECTIONS.SEC_2).toEqual({
      kind: 'section',
      act: 'CGST_ACT_2017',
      section: '2',
      note: 'Definitions',
    });
    expect(Object.keys(CGST_ACT_SECTIONS.SEC_2).sort()).toEqual(['act', 'kind', 'note', 'section']);
  });

  it('should match the exact registered shape for SEC_16_2 (subSection + note set)', () => {
    expect(CGST_ACT_SECTIONS.SEC_16_2).toEqual({
      kind: 'section',
      act: 'CGST_ACT_2017',
      section: '16',
      subSection: '2',
      note: 'Conditions on which ITC can be availed',
    });
  });

  it('should match the exact registered shape for SEC_17_5_A (all optional fields set)', () => {
    expect(CGST_ACT_SECTIONS.SEC_17_5_A).toEqual({
      kind: 'section',
      act: 'CGST_ACT_2017',
      section: '17',
      subSection: '5',
      clause: 'a',
      note: 'Motor vehicles for transportation of persons',
    });
    expect(Object.keys(CGST_ACT_SECTIONS.SEC_17_5_A).sort()).toEqual([
      'act',
      'clause',
      'kind',
      'note',
      'section',
      'subSection',
    ]);
  });

  it('should omit the note key when the cgst factory is called with note undefined', () => {
    const result = cgst('999X', undefined, undefined, undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['act', 'kind', 'section']);
  });

  it('should omit the note key when the cgst factory is called with note omitted entirely', () => {
    const result = cgst('998X');
    expect('note' in result).toBe(false);
  });

  it('should pin the exact clause text on every Section 17(5) blocked-credit entry', () => {
    expect(CGST_ACT_SECTIONS.SEC_17_5_A.clause).toBe('a');
    expect(CGST_ACT_SECTIONS.SEC_17_5_B.clause).toBe('b');
    expect(CGST_ACT_SECTIONS.SEC_17_5_C.clause).toBe('c');
    expect(CGST_ACT_SECTIONS.SEC_17_5_D.clause).toBe('d');
    expect(CGST_ACT_SECTIONS.SEC_17_5_E.clause).toBe('e');
    expect(CGST_ACT_SECTIONS.SEC_17_5_F.clause).toBe('f');
    expect(CGST_ACT_SECTIONS.SEC_17_5_G.clause).toBe('g');
    expect(CGST_ACT_SECTIONS.SEC_17_5_H.clause).toBe('h');
    expect(CGST_ACT_SECTIONS.SEC_17_5_I.clause).toBe('i');
    expect(CGST_ACT_SECTIONS.SEC_17_5_J.clause).toBe('j');
    expect(CGST_ACT_SECTIONS.SEC_17_5_K.clause).toBe('k');
  });
});
