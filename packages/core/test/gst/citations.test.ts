/* Tests for the gst citation registries. Validates structural shape, the discriminated-union typing,
 * and that every registered entry carries a non-empty `note` (the human-readable description that the
 * CA-side audit trail surfaces).
 */

import {
  CBIC_NOTIFICATIONS,
  CGST_ACT_SECTIONS,
  CGST_RULES,
  IGST_ACT_SECTIONS,
} from '../../src/gst/citations/index.js';

describe('CGST_ACT_SECTIONS registry', () => {
  it('every entry is a section citation with act CGST_ACT_2017', () => {
    for (const entry of Object.values(CGST_ACT_SECTIONS)) {
      expect(entry.kind).toBe('section');
      expect(entry.act).toBe('CGST_ACT_2017');
      expect(entry.section.length).toBeGreaterThan(0);
    }
  });

  it('every entry carries a descriptive note', () => {
    for (const [key, entry] of Object.entries(CGST_ACT_SECTIONS)) {
      expect(entry.note, `${key} missing note`).toBeDefined();
      expect((entry.note ?? '').length).toBeGreaterThan(0);
    }
  });

  it('Section 17(5) sub-clauses are all present (a through k)', () => {
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

  it('Section 16 ITC eligibility sub-rules cover (2)(aa) and (2)(ba)', () => {
    expect(CGST_ACT_SECTIONS.SEC_16_2_AA.subSection).toBe('2');
    expect(CGST_ACT_SECTIONS.SEC_16_2_AA.clause).toBe('aa');
    expect(CGST_ACT_SECTIONS.SEC_16_2_BA.subSection).toBe('2');
    expect(CGST_ACT_SECTIONS.SEC_16_2_BA.clause).toBe('ba');
  });

  it('Section 50 interest variants distinguish 18 vs 24 percent', () => {
    expect(CGST_ACT_SECTIONS.SEC_50_1.subSection).toBe('1');
    expect(CGST_ACT_SECTIONS.SEC_50_3.subSection).toBe('3');
  });
});

describe('IGST_ACT_SECTIONS registry', () => {
  it('every entry is act IGST_ACT_2017', () => {
    for (const entry of Object.values(IGST_ACT_SECTIONS)) {
      expect(entry.act).toBe('IGST_ACT_2017');
    }
  });

  it('place-of-supply Sections 10 through 13 are present', () => {
    expect(IGST_ACT_SECTIONS.SEC_10.section).toBe('10');
    expect(IGST_ACT_SECTIONS.SEC_11.section).toBe('11');
    expect(IGST_ACT_SECTIONS.SEC_12.section).toBe('12');
    expect(IGST_ACT_SECTIONS.SEC_13.section).toBe('13');
  });

  it('Section 12 sub-sections cover the major service categories', () => {
    expect(IGST_ACT_SECTIONS.SEC_12_3.subSection).toBe('3');
    expect(IGST_ACT_SECTIONS.SEC_12_4.subSection).toBe('4');
    expect(IGST_ACT_SECTIONS.SEC_12_8.subSection).toBe('8');
    expect(IGST_ACT_SECTIONS.SEC_12_12.subSection).toBe('12');
  });

  it('Section 13 OIDAR sub-section is present', () => {
    expect(IGST_ACT_SECTIONS.SEC_13_12.subSection).toBe('12');
  });
});

describe('CGST_RULES registry', () => {
  it('every entry is a rule citation against CGST_RULES_2017', () => {
    for (const entry of Object.values(CGST_RULES)) {
      expect(entry.kind).toBe('rule');
      expect(entry.rules).toBe('CGST_RULES_2017');
    }
  });

  it('ITC apportionment rules 42 and 43 are present', () => {
    expect(CGST_RULES.RULE_42.ruleNumber).toBe('42');
    expect(CGST_RULES.RULE_43.ruleNumber).toBe('43');
  });

  it('Rule 88B (net-cash interest) is present', () => {
    expect(CGST_RULES.RULE_88B.ruleNumber).toBe('88B');
  });

  it('Rule 36(4) is registered with the correct sub-rule', () => {
    expect(CGST_RULES.RULE_36_4.subRule).toBe('4');
  });

  it('Rule 59(2) for IFF carries the sub-rule', () => {
    expect(CGST_RULES.RULE_59_2.subRule).toBe('2');
  });
});

describe('CBIC_NOTIFICATIONS registry', () => {
  it('every entry is a notification citation with a CBIC family', () => {
    for (const entry of Object.values(CBIC_NOTIFICATIONS)) {
      expect(entry.kind).toBe('notification');
      expect(entry.family).toBeDefined();
      expect(entry.family?.startsWith('CBIC_')).toBe(true);
    }
  });

  it('IMS introduction notification (12/2024-CT) is present', () => {
    expect(CBIC_NOTIFICATIONS.N_12_2024_CT.number).toBe('12/2024');
    expect(CBIC_NOTIFICATIONS.N_12_2024_CT.date).toBe('2024-07-10');
    expect(CBIC_NOTIFICATIONS.N_12_2024_CT.family).toBe('CBIC_CT');
  });

  it('e-invoice threshold notification (10/2023-CT) is present', () => {
    expect(CBIC_NOTIFICATIONS.N_10_2023_CT.number).toBe('10/2023');
  });

  it('Online gaming notification (11/2023-CT (Rate)) is in the CT_RATE family', () => {
    expect(CBIC_NOTIFICATIONS.N_11_2023_CT_RATE.family).toBe('CBIC_CT_RATE');
  });

  it('Aadhaar registration mandate (38/2021-CT) is present', () => {
    expect(CBIC_NOTIFICATIONS.N_38_2021_CT.number).toBe('38/2021');
  });
});
