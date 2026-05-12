/* Tests for the Income-tax Rules 1962 RuleCitation registry.
 * The registry anchors Rule references across perquisite valuation (Rule 3, Rule 3(8) and sub-clauses),
 * unlisted FMV determination (Rule 11UA), DTAA Foreign Tax Credit (Rule 128),
 * and FX rate fallback (Rule 26). Pinned:
 * every entry is a rule citation kind with a non-empty ruleNumber,
 * the load-bearing entries carry the expected sub-rule structure,
 * and the headline notes anchor each rule to its consumer module. Citations:
 * Rule 3 / 3(8) / 3(8)(iii)(c) / 3(9) (perquisite valuation), Rule 11UA / 11UA(1)(c)(b) (unlisted FMV),
 * Rule 128 (Form 67), Rule 26 (FX fallback).
 */

import { RULES, ruleCitation } from '../../src/citations/rules.js';

describe('RULES registry', () => {
  it('should expose every entry as a rule citation kind', () => {
    for (const entry of Object.values(RULES)) {
      expect(entry.kind).toBe('rule');
    }
  });

  it('should expose a non-empty ruleNumber on every entry', () => {
    for (const [registryKey, entry] of Object.entries(RULES)) {
      expect(entry.ruleNumber.length, `${registryKey} missing ruleNumber`).toBeGreaterThan(0);
    }
  });

  it('should pin Rule 3 (parent perquisite valuation)', () => {
    expect(RULES.RULE_3.ruleNumber).toBe('3');
    expect(RULES.RULE_3.note).toMatch(/Valuation|perquisite/i);
  });

  it('should pin Rule 3(8) (RSU / ESOP perquisite at exercise)', () => {
    expect(RULES.RULE_3_8.ruleNumber).toBe('3(8)');
    expect(RULES.RULE_3_8.note).toMatch(/RSU|ESOP|sweat equity/);
  });

  it('should pin Rule 3(8)(iii)(c) (foreign-listed FMV via SBI TT rate)', () => {
    expect(RULES.RULE_3_8_iii_c.ruleNumber).toBe('3(8)(iii)(c)');
    expect(RULES.RULE_3_8_iii_c.note).toMatch(/foreign|SBI|TT rate/i);
  });

  it('should pin Rule 3(9) (unlisted FMV via merchant banker)', () => {
    expect(RULES.RULE_3_9.ruleNumber).toBe('3(9)');
    expect(RULES.RULE_3_9.note).toMatch(/unlisted|merchant banker/i);
  });

  it('should pin Rule 11UA and Rule 11UA(1)(c)(b) (unlisted equity FMV)', () => {
    expect(RULES.RULE_11UA.ruleNumber).toBe('11UA');
    expect(RULES.RULE_11UA_1_c_b.ruleNumber).toBe('11UA(1)(c)(b)');
  });

  it('should pin Rule 128 (Foreign Tax Credit / Form 67)', () => {
    expect(RULES.RULE_128.ruleNumber).toBe('128');
    expect(RULES.RULE_128.note).toMatch(/Foreign tax credit|Form 67/i);
  });

  it('should pin Rule 26 (FX fallback for perquisite + TDS)', () => {
    expect(RULES.RULE_26.ruleNumber).toBe('26');
    expect(RULES.RULE_26.note).toMatch(/exchange|TDS|perquisite/i);
  });

  it('should include the note key on every entry (every Rule registers a note)', () => {
    for (const [registryKey, entry] of Object.entries(RULES)) {
      expect('note' in entry, `${registryKey} missing note`).toBe(true);
      expect(entry.note?.length, `${registryKey} note empty`).toBeGreaterThan(0);
    }
  });

  it('should match the exact registered shape for Rule 3 (note set)', () => {
    expect(RULES.RULE_3).toEqual({
      kind: 'rule',
      ruleNumber: '3',
      note: 'Valuation of perquisites',
    });
    expect(Object.keys(RULES.RULE_3).sort()).toEqual(['kind', 'note', 'ruleNumber']);
  });

  it('should omit the note key when the factory is called with note undefined', () => {
    const result = ruleCitation('999X', undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['kind', 'ruleNumber']);
  });

  it('should omit the note key when the factory is called with note omitted entirely', () => {
    const result = ruleCitation('998X');
    expect('note' in result).toBe(false);
  });

  it('should match the exact registered shape for Rule 11UA(1)(c)(b)', () => {
    expect(RULES.RULE_11UA_1_c_b).toEqual({
      kind: 'rule',
      ruleNumber: '11UA(1)(c)(b)',
      note: 'Merchant-banker route for unquoted equity FMV',
    });
  });
});
