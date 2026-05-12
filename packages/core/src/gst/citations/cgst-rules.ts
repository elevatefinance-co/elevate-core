/* Canonical RuleCitation registry for the CGST Rules, 2017. The Rules operationalise the CGST Act --
 * registration, ITC apportionment formulas, return filing forms and due dates, interest computation, refund
 * procedures. Every rule in the gst namespace that depends on a specific Rule cites against an entry here. */

import type { RuleCitation } from '../../types/citation.js';

export const rule = (ruleNumber: string, subRule?: string, note?: string): RuleCitation => ({
  kind: 'rule',
  ruleNumber,
  rules: 'CGST_RULES_2017',
  ...(subRule !== undefined ? { subRule } : {}),
  ...(note !== undefined ? { note } : {}),
});

export const CGST_RULES = {
  RULE_36: rule('36', undefined, 'Documentary requirements and conditions for claiming ITC'),
  RULE_36_4: rule('36', '4', 'Removed Jan 2022; replaced by Section 16(2)(aa)'),
  RULE_37: rule('37', undefined, 'Reversal of ITC where supplier has not paid tax'),
  RULE_37A: rule('37A', undefined, 'Reversal of ITC where supplier has not filed GSTR-3B'),
  RULE_42: rule(
    '42',
    undefined,
    'Apportionment of common ITC for inputs / input services across taxable + exempt + non-business',
  ),
  RULE_43: rule(
    '43',
    undefined,
    'Apportionment of common ITC for capital goods over 60-month tracking horizon',
  ),

  RULE_46: rule('46', undefined, 'Tax invoice'),
  RULE_48_4: rule(
    '48',
    '4',
    'E-invoicing via IRP -- mandatory above turnover threshold per Notification 13/2020-CT and successors',
  ),

  RULE_59: rule('59', undefined, 'GSTR-1 form and manner'),
  RULE_59_2: rule(
    '59',
    '2',
    'IFF (Invoice Furnishing Facility) for QRMP filers in months 1 and 2 of quarter',
  ),
  RULE_59_3: rule(
    '59',
    '3',
    'Amendment time-bar -- 30 November of year following FY or annual return filing whichever earlier',
  ),
  RULE_60: rule(
    '60',
    undefined,
    'Auto-generated views -- GSTR-2A real-time mirror, GSTR-2B static cut-off snapshot',
  ),
  RULE_61: rule('61', undefined, 'GSTR-3B form and manner'),
  RULE_62: rule(
    '62',
    undefined,
    'CMP-08 quarterly statement and GSTR-4 annual return for composition scheme',
  ),
  RULE_63: rule('63', undefined, 'GSTR-5 -- non-resident taxable person'),
  RULE_64: rule('64', undefined, 'GSTR-5A -- OIDAR'),
  RULE_65: rule('65', undefined, 'GSTR-6 -- Input Service Distributor'),
  RULE_66: rule('66', undefined, 'GSTR-7 -- TDS deductor under Section 51'),
  RULE_67: rule('67', undefined, 'GSTR-8 -- TCS by e-commerce operator under Section 52'),
  RULE_80: rule('80', undefined, 'GSTR-9 annual return and GSTR-9C reconciliation statement'),

  RULE_85: rule('85', undefined, 'Electronic Liability Register'),
  RULE_86: rule('86', undefined, 'Electronic Credit Ledger'),
  RULE_86_2: rule('86', '2', 'ITC cannot be utilised to pay reverse-charge tax'),
  RULE_87: rule(
    '87',
    undefined,
    'Electronic Cash Ledger; PMT-06 monthly tax payment for QRMP and composition',
  ),
  RULE_88B: rule(
    '88B',
    undefined,
    'Interest computation methodology -- net cash basis per Notification 14/2022-CT effective 1 July 2022',
  ),

  RULE_89: rule('89', undefined, 'Refund application -- RFD-01'),
  RULE_89_5: rule(
    '89',
    '5',
    'Inverted-duty-structure refund formula -- ITC of input services excluded per Supreme Court ruling in VKC Footsteps',
  ),
  RULE_91: rule(
    '91',
    undefined,
    'Provisional refund of 90 percent within 7 days for zero-rated supplies',
  ),
  RULE_92: rule('92', undefined, 'Final refund order within 60 days'),
  RULE_96A: rule('96A', undefined, 'Refund of IGST paid on exports under bond / LUT'),

  RULE_138: rule(
    '138',
    undefined,
    'E-way bill generation for movement of goods above Rs 50,000 consignment value',
  ),

  RULE_142: rule('142', undefined, 'Notice and order for demand of amounts payable -- DRC family'),
} as const;

export type CgstRuleKey = keyof typeof CGST_RULES;
