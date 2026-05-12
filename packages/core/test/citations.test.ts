/* Citations are the moat.
 * dedupeCitations must be structurally correct because a long compute chain accumulates the same Section
 * / Rule / Finance Act references repeatedly,
 * and a downstream UI that renders them as deep links would otherwise show the same row five times.
 * The canonical lookup tables (SECTIONS, FINANCE_ACTS, RULES) are also asserted here so a rename of,
 * say,
 * SECTIONS.SEC_87A to a new constant name fails loudly rather than silently producing different objects.
 */

import { dedupeCitations, SECTIONS, FINANCE_ACTS, RULES } from '../src/index.js';
import type { Citation } from '../src/index.js';

describe('dedupeCitations()', () => {
  it('should return empty array for empty input', () => {
    expect(dedupeCitations([])).toEqual([]);
  });

  it('should remove exact structural duplicates', () => {
    const input: Citation[] = [SECTIONS.SEC_87A, SECTIONS.SEC_87A, FINANCE_ACTS.FA_2024];
    expect(dedupeCitations(input)).toHaveLength(2);
  });

  it('should preserve first-seen order', () => {
    const input: Citation[] = [FINANCE_ACTS.FA_2024, SECTIONS.SEC_87A, FINANCE_ACTS.FA_2024];
    const out = dedupeCitations(input);
    expect(out[0]).toBe(FINANCE_ACTS.FA_2024);
    expect(out[1]).toBe(SECTIONS.SEC_87A);
  });

  it('should treat citations with different sub-sections as distinct', () => {
    const input: Citation[] = [SECTIONS.SEC_17, SECTIONS.SEC_17_2_vi];
    expect(dedupeCitations(input)).toHaveLength(2);
  });
});

describe('SECTIONS constants', () => {
  it('should all keys resolve to section citations', () => {
    for (const key of Object.keys(SECTIONS) as (keyof typeof SECTIONS)[]) {
      expect(SECTIONS[key].kind).toBe('section');
      expect(SECTIONS[key].act).toBe('IT_ACT_1961');
      expect(typeof SECTIONS[key].section).toBe('string');
    }
  });

  it('Sec 115BBH is tagged for VDA flat tax', () => {
    expect(SECTIONS.SEC_115BBH.section).toBe('115BBH');
    expect(SECTIONS.SEC_115BBH.note).toMatch(/VDA/);
  });
});

describe('FINANCE_ACTS constants', () => {
  it('should each entry carries a year', () => {
    for (const key of Object.keys(FINANCE_ACTS) as (keyof typeof FINANCE_ACTS)[]) {
      expect(FINANCE_ACTS[key].kind).toBe('finance-act');
      expect(typeof FINANCE_ACTS[key].year).toBe('number');
    }
  });
});

describe('RULES constants', () => {
  it('should all keys resolve to rule citations', () => {
    for (const key of Object.keys(RULES) as (keyof typeof RULES)[]) {
      expect(RULES[key].kind).toBe('rule');
      expect(typeof RULES[key].ruleNumber).toBe('string');
    }
  });

  it('Rule 3(8) anchors RSU/ESOP perquisite valuation', () => {
    expect(RULES.RULE_3_8.ruleNumber).toBe('3(8)');
    expect(RULES.RULE_3_8.note).toMatch(/RSU|ESOP/);
  });

  it('Rule 11UA anchors unlisted equity FMV', () => {
    expect(RULES.RULE_11UA.ruleNumber).toBe('11UA');
  });

  it('Rule 128 anchors Form 67 FTC', () => {
    expect(RULES.RULE_128.note).toMatch(/Form 67/);
  });
});
