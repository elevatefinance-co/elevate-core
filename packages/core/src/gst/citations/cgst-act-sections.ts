/* Canonical SectionCitation registry for the CGST Act, 2017. Every rule in the gst namespace that depends on
 * a Section of the Central Goods and Services Tax Act cites against an entry here, never against an inline
 * string. The registry stays append-only -- existing entries never mutate, so historical computations remain
 * reproducible.
 *
 * The CGST Act and the State GST Acts (one per State) are intentionally near-identical -- the same Section
 * number across the two carries the same meaning. Rules in this namespace cite CGST_ACT_2017; consumers that
 * need the SGST equivalent project by swapping the act discriminator. */

import type { SectionCitation } from '../../types/citation.js';

export const cgst = (
  section: string,
  subSection?: string,
  clause?: string,
  note?: string,
): SectionCitation => ({
  kind: 'section',
  act: 'CGST_ACT_2017',
  section,
  ...(subSection !== undefined ? { subSection } : {}),
  ...(clause !== undefined ? { clause } : {}),
  ...(note !== undefined ? { note } : {}),
});

export const CGST_ACT_SECTIONS = {
  SEC_2: cgst('2', undefined, undefined, 'Definitions'),
  SEC_7: cgst('7', undefined, undefined, 'Scope of supply'),
  SEC_9: cgst('9', undefined, undefined, 'Levy and collection of CGST'),
  SEC_9_3: cgst(
    '9',
    '3',
    undefined,
    'Notified categories of supply on which tax payable on reverse charge basis',
  ),
  SEC_9_4: cgst(
    '9',
    '4',
    undefined,
    'Inward supply from unregistered to registered (suspended for most categories)',
  ),
  SEC_9_5: cgst('9', '5', undefined, 'Specified services through electronic commerce operator'),
  SEC_10: cgst('10', undefined, undefined, 'Composition levy'),
  SEC_11: cgst('11', undefined, undefined, 'Power to grant exemption from tax'),

  SEC_16: cgst(
    '16',
    undefined,
    undefined,
    'Eligibility and conditions for taking input tax credit',
  ),
  SEC_16_2: cgst('16', '2', undefined, 'Conditions on which ITC can be availed'),
  SEC_16_2_AA: cgst(
    '16',
    '2',
    'aa',
    'ITC only on invoices appearing in GSTR-2B (Finance Act 2021, effective 1 January 2022)',
  ),
  SEC_16_2_BA: cgst(
    '16',
    '2',
    'ba',
    'ITC restriction where supplier has not paid tax (Finance Act 2022, effective 1 October 2022)',
  ),
  SEC_16_4: cgst('16', '4', undefined, 'Time bar for claiming ITC'),
  SEC_17: cgst('17', undefined, undefined, 'Apportionment of credit and blocked credits'),
  SEC_17_1: cgst('17', '1', undefined, 'Apportionment for partly business / partly non-business'),
  SEC_17_2: cgst('17', '2', undefined, 'Apportionment for partly taxable / partly exempt'),
  SEC_17_3: cgst('17', '3', undefined, 'Definition of exempt supply'),
  SEC_17_4: cgst('17', '4', undefined, 'Banking / financial / NBFC fifty-percent option'),
  SEC_17_5: cgst('17', '5', undefined, 'Blocked credits'),
  SEC_17_5_A: cgst('17', '5', 'a', 'Motor vehicles for transportation of persons'),
  SEC_17_5_B: cgst(
    '17',
    '5',
    'b',
    'Food, beverages, outdoor catering, beauty, health, life and health insurance',
  ),
  SEC_17_5_C: cgst('17', '5', 'c', 'Membership of a club, health and fitness centre'),
  SEC_17_5_D: cgst('17', '5', 'd', 'Travel benefits to employees on vacation'),
  SEC_17_5_E: cgst(
    '17',
    '5',
    'e',
    'Works contract services for construction of immovable property',
  ),
  SEC_17_5_F: cgst(
    '17',
    '5',
    'f',
    'Goods or services for construction of immovable property on own account',
  ),
  SEC_17_5_G: cgst('17', '5', 'g', 'Goods or services on which composition tax is paid'),
  SEC_17_5_H: cgst('17', '5', 'h', 'Goods or services received by a non-resident taxable person'),
  SEC_17_5_I: cgst('17', '5', 'i', 'Goods or services for personal consumption'),
  SEC_17_5_J: cgst(
    '17',
    '5',
    'j',
    'Goods lost, stolen, destroyed, written off, or disposed of as gifts or free samples',
  ),
  SEC_17_5_K: cgst(
    '17',
    '5',
    'k',
    'Tax paid in pursuance of orders under Sections 74, 129, or 130',
  ),
  SEC_18: cgst('18', undefined, undefined, 'Availability of credit in special circumstances'),

  SEC_22: cgst('22', undefined, undefined, 'Persons liable for registration'),
  SEC_24: cgst('24', undefined, undefined, 'Compulsory registration regardless of turnover'),
  SEC_25: cgst('25', undefined, undefined, 'Procedure for registration'),

  SEC_31: cgst('31', undefined, undefined, 'Tax invoice'),
  SEC_31_3_F: cgst('31', '3', 'f', 'Self-invoice for inward supply liable to reverse charge'),
  SEC_37: cgst('37', undefined, undefined, 'Furnishing details of outward supplies'),
  SEC_39: cgst('39', undefined, undefined, 'Furnishing of returns'),

  SEC_47: cgst('47', undefined, undefined, 'Late fee for delayed return filing'),
  SEC_50: cgst('50', undefined, undefined, 'Interest on delayed payment of tax'),
  SEC_50_1: cgst(
    '50',
    '1',
    undefined,
    'Interest 18 percent per annum on delayed cash payment of tax',
  ),
  SEC_50_3: cgst(
    '50',
    '3',
    undefined,
    'Interest on ITC wrongly availed and utilised -- statutory ceiling 24 percent; notified operative rate 18 percent per Notification 9/2022-CT, retrospective from 1 July 2017',
  ),

  SEC_73: cgst('73', undefined, undefined, 'Demand for short-paid tax non-fraud'),
  SEC_74: cgst(
    '74',
    undefined,
    undefined,
    'Demand for short-paid tax with fraud / suppression / wilful misstatement',
  ),
  SEC_74A: cgst(
    '74A',
    undefined,
    undefined,
    'Unified demand provision for FY 2024-25 onwards -- inserted by Finance (No. 2) Act 2024, effective 1 November 2024',
  ),

  SEC_51: cgst(
    '51',
    undefined,
    undefined,
    'TDS under GST -- specified government and PSU deductors',
  ),
  SEC_52: cgst('52', undefined, undefined, 'TCS by e-commerce operator'),

  SEC_39_4: cgst('39', '4', undefined, 'Input Service Distributor return (GSTR-6)'),
  SEC_39_5: cgst('39', '5', undefined, 'Non-resident foreign taxpayer return (GSTR-5)'),
  SEC_44: cgst('44', undefined, undefined, 'Annual return -- GSTR-9 / 9C threshold'),
  SEC_44_2: cgst(
    '44',
    '2',
    undefined,
    'Audit reconciliation statement (GSTR-9C) above prescribed turnover',
  ),
  SEC_45: cgst(
    '45',
    undefined,
    undefined,
    'Final return on cancellation of registration (GSTR-10)',
  ),

  SEC_122: cgst('122', undefined, undefined, 'General penalties for specified offences'),
  SEC_132: cgst('132', undefined, undefined, 'Prosecution for tax evasion above thresholds'),

  SEC_164: cgst('164', undefined, undefined, 'Power to make rules'),

  SEC_17_5_I_TAX_PAID_DEMANDS: cgst(
    '17',
    '5',
    'i',
    'Tax paid in accordance with section 74 in respect of any period up to FY 2023-24 -- substituted by Finance (No. 2) Act 2024 effective 1 November 2024; the pre-substitution text covered sections 74, 129 and 130',
  ),
} as const;

export type CgstActSectionKey = keyof typeof CGST_ACT_SECTIONS;
