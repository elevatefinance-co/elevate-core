/* Canonical Section citations. Every rule in the library that cites a Section reaches in here. So if the
 * naming of a Section changes (rare, but happens when the Act is amended), we fix it in one place. */

import type { SectionCitation } from '../types/citation.js';

export const sectionCitation = (
  section: string,
  subSection?: string,
  clause?: string,
  note?: string,
): SectionCitation => ({
  kind: 'section',
  act: 'IT_ACT_1961',
  section,
  ...(subSection !== undefined ? { subSection } : {}),
  ...(clause !== undefined ? { clause } : {}),
  ...(note !== undefined ? { note } : {}),
});

export const SECTIONS = {
  SEC_4: sectionCitation('4', undefined, undefined, 'Charge of income-tax'),
  SEC_5: sectionCitation('5', undefined, undefined, 'Scope of total income'),

  SEC_15: sectionCitation('15', undefined, undefined, 'Salaries. Charging'),
  SEC_17: sectionCitation(
    '17',
    undefined,
    undefined,
    '"Salary", "perquisite" and "profits in lieu of salary"',
  ),
  SEC_17_2_vi: sectionCitation('17', '2', 'vi', 'Perquisite. Securities / sweat equity (RSU/ESOP)'),
  SEC_22: sectionCitation('22', undefined, undefined, 'Income from house property. Charging'),
  SEC_28: sectionCitation(
    '28',
    undefined,
    undefined,
    'Profits and gains of business or profession',
  ),
  SEC_45: sectionCitation('45', undefined, undefined, 'Capital gains. Charging'),
  SEC_48: sectionCitation('48', undefined, undefined, 'Mode of computation of capital gains'),

  SEC_87A: sectionCitation('87A', undefined, undefined, 'Rebate on income up to threshold'),
  SEC_90: sectionCitation('90', undefined, undefined, 'DTAA relief. Bilateral'),
  SEC_91: sectionCitation('91', undefined, undefined, 'DTAA relief. Unilateral'),

  SEC_115BAC: sectionCitation(
    '115BAC',
    undefined,
    undefined,
    'New regime. Individual / HUF / AOP / BOI / AJP',
  ),
  SEC_115BAA: sectionCitation(
    '115BAA',
    undefined,
    undefined,
    'Concessional regime. Domestic companies',
  ),
  SEC_115BAB: sectionCitation(
    '115BAB',
    undefined,
    undefined,
    'Concessional regime. New manufacturing companies',
  ),
  SEC_115BBH: sectionCitation('115BBH', undefined, undefined, 'VDA. Flat 30% tax'),
  SEC_2_12A: sectionCitation('2', '12A', undefined, 'Health and Education Cess. Definition'),

  SEC_2_42A: sectionCitation('2', '42A', undefined, 'Short-term capital asset. Definition'),
  SEC_2_22: sectionCitation('2', '22', undefined, 'Dividend. Definition'),
  SEC_111A: sectionCitation('111A', undefined, undefined, 'STCG on STT-paid equity @ 20%'),
  SEC_112: sectionCitation('112', undefined, undefined, 'LTCG. Default @ 12.5%'),
  SEC_112A: sectionCitation(
    '112A',
    undefined,
    undefined,
    'LTCG on STT-paid equity @ 12.5%, Rs. 1.25L exemption',
  ),
  SEC_50AA: sectionCitation('50AA', undefined, undefined, 'Specified MF / debt. Always slab'),

  SEC_194S: sectionCitation('194S', undefined, undefined, 'TDS on VDA transfer @ 1%'),

  SEC_139_1: sectionCitation(
    '139',
    '1',
    undefined,
    'Return filing. Including 4th proviso on Schedule FA',
  ),

  SEC_80C: sectionCitation(
    '80C',
    undefined,
    undefined,
    'Investments / payments. Overall Rs. 1.5L cap (with 80CCC + 80CCD(1))',
  ),
  SEC_80CCC: sectionCitation(
    '80CCC',
    undefined,
    undefined,
    'Pension fund contribution. Within 80C Rs. 1.5L',
  ),
  SEC_80CCD_1: sectionCitation(
    '80CCD',
    '1',
    undefined,
    'NPS. Employee contribution within 80C Rs. 1.5L',
  ),
  SEC_80CCD_1B: sectionCitation(
    '80CCD',
    '1B',
    undefined,
    'NPS. Additional Rs. 50k over and above 80C',
  ),
  SEC_80CCD_2: sectionCitation(
    '80CCD',
    '2',
    undefined,
    'NPS. Employer contribution; available in new regime',
  ),
  SEC_80D: sectionCitation(
    '80D',
    undefined,
    undefined,
    'Medical insurance premium + preventive health check-up',
  ),
  SEC_80DD: sectionCitation(
    '80DD',
    undefined,
    undefined,
    'Dependent with disability. Flat deduction',
  ),
  SEC_80DDB: sectionCitation(
    '80DDB',
    undefined,
    undefined,
    'Specified medical treatment for self / dependant',
  ),
  SEC_80E: sectionCitation(
    '80E',
    undefined,
    undefined,
    'Interest on education loan. No cap, 8-year max',
  ),
  SEC_80EE: sectionCitation(
    '80EE',
    undefined,
    undefined,
    'First-home-buyer interest. Legacy Rs. 50k',
  ),
  SEC_80EEA: sectionCitation(
    '80EEA',
    undefined,
    undefined,
    'Affordable housing interest. Rs. 1.5L additional',
  ),
  SEC_80EEB: sectionCitation('80EEB', undefined, undefined, 'EV loan interest. Rs. 1.5L'),
  SEC_80G: sectionCitation(
    '80G',
    undefined,
    undefined,
    'Donations. 50% / 100% variants with/without AGI cap',
  ),
  SEC_80GG: sectionCitation('80GG', undefined, undefined, 'Rent paid when no HRA received'),
  SEC_80TTA: sectionCitation(
    '80TTA',
    undefined,
    undefined,
    'Savings-account interest. Rs. 10k (non-senior)',
  ),
  SEC_80TTB: sectionCitation(
    '80TTB',
    undefined,
    undefined,
    'Senior-citizen bank / PO interest. Rs. 50k',
  ),
  SEC_80U: sectionCitation('80U', undefined, undefined, 'Self-disability. Flat deduction'),
} as const;

export type SectionKey = keyof typeof SECTIONS;
