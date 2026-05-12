/* Tests for the CGST Rules 2017 RuleCitation registry.
 * The Rules operationalise the CGST Act -- registration mechanics, ITC apportionment formulas,
 * return forms and due dates, interest computation, refund procedures.
 * Every gst-namespace rule that depends on a specific Rule cites against an entry here. Pinned:
 * every entry is a rule kind tagged CGST_RULES_2017, the headline rules (36(4) ITC documentary,
 * 42 / 43 apportionment, 88B net-cash interest, 138 e-way bill) are present,
 * the IFF and form rules (59(2), 61, 62, 65, 66, 67, 80) are present. Citations: CGST Rules 2017.
 */

import { CGST_RULES, rule } from '../../../src/gst/citations/cgst-rules.js';

describe('CGST_RULES registry', () => {
  it('should expose every entry as a rule citation against CGST_RULES_2017', () => {
    for (const entry of Object.values(CGST_RULES)) {
      expect(entry.kind).toBe('rule');
      expect(entry.rules).toBe('CGST_RULES_2017');
    }
  });

  it('should expose a non-empty ruleNumber on every entry', () => {
    for (const [registryKey, entry] of Object.entries(CGST_RULES)) {
      expect(entry.ruleNumber.length, `${registryKey} missing ruleNumber`).toBeGreaterThan(0);
    }
  });

  it('should pin Rule 36 and the historical 36(4) sub-rule (replaced by Section 16(2)(aa))', () => {
    expect(CGST_RULES.RULE_36.ruleNumber).toBe('36');
    expect(CGST_RULES.RULE_36_4.subRule).toBe('4');
  });

  it('should pin Rule 42 and Rule 43 (ITC apportionment for inputs / capital goods)', () => {
    expect(CGST_RULES.RULE_42.ruleNumber).toBe('42');
    expect(CGST_RULES.RULE_43.ruleNumber).toBe('43');
  });

  it('should pin Rule 88B (net-cash interest computation)', () => {
    expect(CGST_RULES.RULE_88B.ruleNumber).toBe('88B');
    expect(CGST_RULES.RULE_88B.note).toMatch(/net cash/i);
  });

  it('should pin Rule 88B(1) (Section 50(1) delayed-payment base) and Rule 88B(3) (Section 50(3) wrongly availed and utilised ITC)', () => {
    expect(CGST_RULES.RULE_88B_1.ruleNumber).toBe('88B');
    expect(CGST_RULES.RULE_88B_1.subRule).toBe('1');
    expect(CGST_RULES.RULE_88B_1.note).toMatch(/Section 50\(1\)/);
    expect(CGST_RULES.RULE_88B_3.ruleNumber).toBe('88B');
    expect(CGST_RULES.RULE_88B_3.subRule).toBe('3');
    expect(CGST_RULES.RULE_88B_3.note).toMatch(/wrongly availed and utilised/);
  });

  it('should pin Rule 59 and the IFF sub-rule 59(2) for QRMP filers', () => {
    expect(CGST_RULES.RULE_59.ruleNumber).toBe('59');
    expect(CGST_RULES.RULE_59_2.subRule).toBe('2');
  });

  it('should pin the form-and-manner rules for every return type (61, 62, 63, 64, 65, 66, 67, 80)', () => {
    expect(CGST_RULES.RULE_61.ruleNumber).toBe('61');
    expect(CGST_RULES.RULE_62.ruleNumber).toBe('62');
    expect(CGST_RULES.RULE_63.ruleNumber).toBe('63');
    expect(CGST_RULES.RULE_64.ruleNumber).toBe('64');
    expect(CGST_RULES.RULE_65.ruleNumber).toBe('65');
    expect(CGST_RULES.RULE_66.ruleNumber).toBe('66');
    expect(CGST_RULES.RULE_67.ruleNumber).toBe('67');
    expect(CGST_RULES.RULE_80.ruleNumber).toBe('80');
  });

  it('should pin Rule 138 (e-way bill)', () => {
    expect(CGST_RULES.RULE_138.ruleNumber).toBe('138');
  });

  it('should pin the refund rules (89, 89(5), 91, 92, 96A)', () => {
    expect(CGST_RULES.RULE_89.ruleNumber).toBe('89');
    expect(CGST_RULES.RULE_89_5.subRule).toBe('5');
    expect(CGST_RULES.RULE_91.ruleNumber).toBe('91');
    expect(CGST_RULES.RULE_92.ruleNumber).toBe('92');
    expect(CGST_RULES.RULE_96A.ruleNumber).toBe('96A');
  });

  it('should pin Rule 86 / 86(2) (electronic credit ledger and reverse-charge restriction)', () => {
    expect(CGST_RULES.RULE_86.ruleNumber).toBe('86');
    expect(CGST_RULES.RULE_86_2.subRule).toBe('2');
  });

  it('should pin Rule 48(4) (e-invoicing via IRP)', () => {
    expect(CGST_RULES.RULE_48_4.subRule).toBe('4');
  });

  it('should omit the subRule key on RULE_36 (parent rule, no sub-rule, kills line-11 ConditionalExpression mutant)', () => {
    expect('subRule' in CGST_RULES.RULE_36).toBe(false);
    expect(Object.keys(CGST_RULES.RULE_36)).not.toContain('subRule');
  });

  it('should omit the subRule key on RULE_37 / RULE_42 / RULE_43 / RULE_46 / RULE_61 (parent-rule entries)', () => {
    expect('subRule' in CGST_RULES.RULE_37).toBe(false);
    expect('subRule' in CGST_RULES.RULE_42).toBe(false);
    expect('subRule' in CGST_RULES.RULE_43).toBe(false);
    expect('subRule' in CGST_RULES.RULE_46).toBe(false);
    expect('subRule' in CGST_RULES.RULE_61).toBe(false);
  });

  it('should pin the exact registered shape for RULE_36 (no subRule, note set)', () => {
    expect(CGST_RULES.RULE_36).toEqual({
      kind: 'rule',
      ruleNumber: '36',
      rules: 'CGST_RULES_2017',
      note: 'Documentary requirements and conditions for claiming ITC',
    });
    expect(Object.keys(CGST_RULES.RULE_36).sort()).toEqual(['kind', 'note', 'ruleNumber', 'rules']);
  });

  it('should omit the note key when the rule factory is called with note undefined', () => {
    const result = rule('999X', undefined, undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['kind', 'ruleNumber', 'rules']);
  });

  it('should omit the note key when the rule factory is called with note omitted entirely', () => {
    const result = rule('998X');
    expect('note' in result).toBe(false);
  });

  it('should pin the exact registered shape for RULE_36_4 (subRule + note set)', () => {
    expect(CGST_RULES.RULE_36_4).toEqual({
      kind: 'rule',
      ruleNumber: '36',
      rules: 'CGST_RULES_2017',
      subRule: '4',
      note: 'Removed Jan 2022; replaced by Section 16(2)(aa)',
    });
  });
});
