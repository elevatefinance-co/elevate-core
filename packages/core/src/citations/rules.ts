/* Canonical Rule citations from the Income-tax Rules, 1962. Referenced by perquisite valuation (Rule 3),
 * unlisted FMV determination (Rule 11UA), DTAA FTC computation (Rule 128), and FX rate fallback for
 * perquisite valuation on foreign-listed shares (Rule 26).
 *
 * Rules have their own citation kind ('rule') so consumers can render them distinctly from Sections of the
 * Act. */

import type { RuleCitation } from '../types/citation.js';

export const ruleCitation = (ruleNumber: string, note?: string): RuleCitation => ({
  kind: 'rule',
  ruleNumber,
  ...(note !== undefined ? { note } : {}),
});

export const RULES = {
  RULE_3: ruleCitation('3', 'Valuation of perquisites'),
  RULE_3_8: ruleCitation(
    '3(8)',
    'Perquisite value of specified security or sweat equity (RSU/ESOP) at exercise',
  ),
  RULE_3_8_iii_c: ruleCitation(
    '3(8)(iii)(c)',
    'FMV for foreign-listed shares. Market close x SBI TT rate',
  ),
  RULE_3_9: ruleCitation('3(9)', 'FMV of unlisted shares. Merchant banker Cat-I certificate'),

  RULE_11UA: ruleCitation('11UA', 'Valuation of unquoted shares'),
  RULE_11UA_1_c_b: ruleCitation('11UA(1)(c)(b)', 'Merchant-banker route for unquoted equity FMV'),

  RULE_128: ruleCitation('128', 'Foreign tax credit. Form 67 computation and filing'),

  RULE_26: ruleCitation('26', 'Rate of exchange. Perquisite + TDS valuation fallback'),
} as const;

export type RuleKey = keyof typeof RULES;
