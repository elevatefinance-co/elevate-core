/* Income Tax Act, 1961 -- Section citation registry for TDS (Chapter XVII-B) and TCS (Chapter XVII-BB).
 * Every rule in the tds namespace that depends on an ITA Section cites against an entry here. The registry
 * is append-only -- existing entries never mutate so historical computations remain reproducible. */

import type { SectionCitation } from '../../types/citation.js';

export const ita = (
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

export const ITA_SECTIONS = {
  SEC_190: ita('190', undefined, undefined, 'Manner of charge -- TDS is one mode of recovery'),
  SEC_191: ita('191', undefined, undefined, 'Direct payment by assessee where TDS not deducted'),

  SEC_192: ita('192', undefined, undefined, 'TDS on salaries -- slab-rate computation'),
  SEC_192A: ita(
    '192A',
    undefined,
    undefined,
    'TDS on premature EPF withdrawal -- 10 percent above Rs 50,000',
  ),

  SEC_193: ita('193', undefined, undefined, 'TDS on interest on securities'),
  SEC_194: ita(
    '194',
    undefined,
    undefined,
    'TDS on dividends -- 10 percent above Rs 10,000 per shareholder per FY from 1 April 2025 (Rs 5,000 prior)',
  ),
  SEC_194A: ita(
    '194A',
    undefined,
    undefined,
    'TDS on interest other than on securities -- 10 percent',
  ),
  SEC_194B: ita(
    '194B',
    undefined,
    undefined,
    'TDS on lottery / crossword / card-game winnings -- 30 percent above Rs 10,000 per single transaction from 1 April 2025 (aggregate per FY prior)',
  ),
  SEC_194BA: ita(
    '194BA',
    undefined,
    undefined,
    'TDS on online gaming net winnings -- 30 percent (Finance Act 2023)',
  ),
  SEC_194BB: ita(
    '194BB',
    undefined,
    undefined,
    'TDS on horse race winnings -- 30 percent above Rs 10,000 per single transaction from 1 April 2025 (aggregate per FY prior)',
  ),
  SEC_194C: ita(
    '194C',
    undefined,
    undefined,
    'TDS on contractor payments -- 1 percent (individual / HUF) or 2 percent (others)',
  ),
  SEC_194D: ita(
    '194D',
    undefined,
    undefined,
    'TDS on insurance commission -- 2 percent for non-company deductees from 1 April 2025 (5 percent prior)',
  ),
  SEC_194DA: ita(
    '194DA',
    undefined,
    undefined,
    'TDS on life insurance maturity -- 2 percent post Oct 2024 (5 percent prior)',
  ),
  SEC_194E: ita(
    '194E',
    undefined,
    undefined,
    'TDS on non-resident sportsmen / sports associations -- 20 percent',
  ),
  SEC_194EE: ita(
    '194EE',
    undefined,
    undefined,
    'TDS on NSS withdrawal -- 10 percent above Rs 2,500',
  ),
  SEC_194F: ita('194F', undefined, undefined, 'TDS on MF unit repurchase (REPEALED post Oct 2024)'),
  SEC_194G: ita(
    '194G',
    undefined,
    undefined,
    'TDS on lottery commission -- 2 percent post Oct 2024 (5 percent prior)',
  ),
  SEC_194H: ita(
    '194H',
    undefined,
    undefined,
    'TDS on commission / brokerage -- 2 percent post Oct 2024 (5 percent prior)',
  ),
  SEC_194I_A: ita(
    '194I',
    undefined,
    'a',
    'TDS on rent of plant / machinery / equipment -- 2 percent above Rs 50,000 per month from 1 April 2025 (Rs 2.4 lakh per FY prior)',
  ),
  SEC_194I_B: ita(
    '194I',
    undefined,
    'b',
    'TDS on rent of land / building / furniture -- 10 percent above Rs 50,000 per month from 1 April 2025 (Rs 2.4 lakh per FY prior)',
  ),
  SEC_194_IA: ita(
    '194-IA',
    undefined,
    undefined,
    'TDS on transfer of immovable property -- 1 percent above Rs 50 lakh (26QB)',
  ),
  SEC_194_IB: ita(
    '194-IB',
    undefined,
    undefined,
    'TDS on rent by individuals / HUF -- 2 percent post Oct 2024 (26QC)',
  ),
  SEC_194_IC: ita('194-IC', undefined, undefined, 'TDS on JDA consideration -- 10 percent'),
  SEC_194J: ita(
    '194J',
    undefined,
    undefined,
    'TDS on professional / technical services -- 10 percent (royalty / FTS / professional) or 2 percent (technical services)',
  ),
  SEC_194K: ita(
    '194K',
    undefined,
    undefined,
    'TDS on income from MF units -- 10 percent above Rs 10,000 per FY from 1 April 2025 (Rs 5,000 prior)',
  ),
  SEC_194LA: ita(
    '194LA',
    undefined,
    undefined,
    'TDS on land acquisition compensation -- 10 percent above Rs 2.5 lakh',
  ),
  SEC_194LB: ita(
    '194LB',
    undefined,
    undefined,
    'TDS on infrastructure debt fund interest -- 5 percent',
  ),
  SEC_194LBA: ita(
    '194LBA',
    undefined,
    undefined,
    'TDS on business trust distributions -- 10 percent (resident) / 195 rate (NR)',
  ),
  SEC_194LBB: ita(
    '194LBB',
    undefined,
    undefined,
    'TDS on investment fund income -- 10 percent (resident) / 195 rate (NR)',
  ),
  SEC_194LBC: ita(
    '194LBC',
    undefined,
    undefined,
    'TDS on securitisation trust income -- 25 percent (individual / HUF) or 30 percent (others)',
  ),
  SEC_194LC: ita(
    '194LC',
    undefined,
    undefined,
    'TDS on foreign-currency loan interest -- 5 percent (4 percent IFSC)',
  ),
  SEC_194LD: ita(
    '194LD',
    undefined,
    undefined,
    'TDS on FII / QFI rupee-bond interest -- 5 percent',
  ),
  SEC_194M: ita(
    '194M',
    undefined,
    undefined,
    'TDS on contractor / professional payments by individuals / HUF -- 2 percent post Oct 2024 (26QD)',
  ),
  SEC_194N: ita(
    '194N',
    undefined,
    undefined,
    'TDS on cash withdrawals -- 2 percent above thresholds',
  ),
  SEC_194O: ita(
    '194O',
    undefined,
    undefined,
    'TDS on e-commerce operator payments -- 0.1 percent post Oct 2024 (1 percent prior)',
  ),
  SEC_194P: ita(
    '194P',
    undefined,
    undefined,
    'TDS in full discharge for senior citizens 75+ -- slab-based',
  ),
  SEC_194Q: ita(
    '194Q',
    undefined,
    undefined,
    'TDS on goods purchase by buyer -- 0.1 percent above Rs 50 lakh per seller',
  ),
  SEC_194R: ita(
    '194R',
    undefined,
    undefined,
    'TDS on benefits / perquisites -- 10 percent above Rs 20,000 per FY',
  ),
  SEC_194S: ita('194S', undefined, undefined, 'TDS on VDA / crypto transfers -- 1 percent (26QE)'),
  SEC_194T: ita(
    '194T',
    undefined,
    undefined,
    'TDS on partner remuneration / interest -- 10 percent (Finance Act 2024, effective 1 April 2025)',
  ),

  SEC_195: ita(
    '195',
    undefined,
    undefined,
    'TDS on payments to non-residents -- rate per ITA Section or per DTAA, whichever lower',
  ),
  SEC_196A: ita('196A', undefined, undefined, 'TDS on non-resident MF income -- 20 percent'),
  SEC_196B: ita('196B', undefined, undefined, 'TDS on offshore-fund LTCG -- 10 percent'),
  SEC_196C: ita(
    '196C',
    undefined,
    undefined,
    'TDS on non-resident bond / GDR interest -- 10 percent',
  ),
  SEC_196D: ita(
    '196D',
    undefined,
    undefined,
    'TDS on FII security income -- 20 percent or DTAA whichever lower',
  ),

  SEC_197: ita(
    '197',
    undefined,
    undefined,
    'Lower / nil deduction certificate by Assessing Officer',
  ),
  SEC_197A: ita('197A', undefined, undefined, 'Form 15G / 15H declarations for senior citizens'),
  SEC_198: ita('198', undefined, undefined, 'Tax deducted is income received'),
  SEC_199: ita('199', undefined, undefined, 'Credit for tax deducted -- claimed in deductee ITR'),
  SEC_200: ita(
    '200',
    undefined,
    undefined,
    'Duty of person deducting tax -- deposit + return filing',
  ),
  SEC_200A: ita(
    '200A',
    undefined,
    undefined,
    'Processing of TDS statements -- TRACES default summary',
  ),
  SEC_201: ita(
    '201',
    undefined,
    undefined,
    'Consequences of failure to deduct or pay -- assessee-in-default',
  ),
  SEC_201_1A: ita(
    '201',
    '1A',
    undefined,
    '1 / 1.5 percent monthly interest on delayed deduction / payment',
  ),
  SEC_202: ita('202', undefined, undefined, 'Cumulative recovery from deductee if deductor fails'),
  SEC_203: ita('203', undefined, undefined, 'Certificate of deduction (Form 16 family, 27D)'),
  SEC_203A: ita(
    '203A',
    undefined,
    undefined,
    'TAN -- mandatory for every deductor / TCS collector',
  ),
  SEC_204: ita('204', undefined, undefined, 'Person responsible for paying'),
  SEC_205: ita(
    '205',
    undefined,
    undefined,
    'Bar against direct demand on assessee where tax has been deducted',
  ),
  SEC_206: ita(
    '206',
    undefined,
    undefined,
    'Quarterly TDS return obligation (basis for 24Q / 26Q / 27Q)',
  ),
  SEC_206A: ita(
    '206A',
    undefined,
    undefined,
    'Statement of payment in respect of which TDS not deducted',
  ),

  SEC_206AA: ita(
    '206AA',
    undefined,
    undefined,
    'Higher TDS where deductee PAN not furnished -- max(2x rate, rate-in-force, 20 percent)',
  ),
  SEC_206AB: ita(
    '206AB',
    undefined,
    undefined,
    'Higher TDS for specified persons (non-filers of ITR with TDS / TCS >= Rs 50,000) -- max(2x, 5 percent); omitted by the Finance Act 2025 w.e.f. 1 April 2025',
  ),

  SEC_206C: ita(
    '206C',
    undefined,
    undefined,
    'TCS on specified goods / e-commerce / LRS / sale of goods',
  ),
  SEC_206C_1: ita(
    '206C',
    '1',
    undefined,
    'TCS on alcoholic liquor / scrap / tendu leaves / timber / minerals',
  ),
  SEC_206C_1F: ita('206C', '1F', undefined, 'TCS on motor vehicles above Rs 10 lakh -- 1 percent'),
  SEC_206C_1G: ita('206C', '1G', undefined, 'TCS on LRS remittances + overseas tour packages'),
  SEC_206C_1H: ita(
    '206C',
    '1H',
    undefined,
    'TCS on sale of goods above Rs 50 lakh per buyer per FY -- 0.1 percent (interaction with 194Q sequencing)',
  ),
  SEC_206CC: ita(
    '206CC',
    undefined,
    undefined,
    'Higher TCS where buyer PAN not furnished -- max(2x rate, 5 percent)',
  ),
  SEC_206CCA: ita(
    '206CCA',
    undefined,
    undefined,
    'Higher TCS for specified persons (non-filers of ITR) -- max(2x, 5 percent); omitted by the Finance Act 2025 w.e.f. 1 April 2025',
  ),

  SEC_234E: ita(
    '234E',
    undefined,
    undefined,
    'Late fee for delayed quarterly TDS return -- Rs 200 per day capped at TDS amount',
  ),
  SEC_271H: ita(
    '271H',
    undefined,
    undefined,
    'Penalty for non-filing or incorrect filing -- Rs 10,000 to Rs 1,00,000',
  ),
  SEC_272A_2_K: ita(
    '272A',
    '2',
    'k',
    'Penalty for failure to file Form 16 / 16A on time -- Rs 100 per day, capped at TDS',
  ),
  SEC_272BB: ita(
    '272BB',
    undefined,
    undefined,
    'Penalty for failure to obtain or quote TAN -- Rs 10,000 per default',
  ),
  SEC_273A: ita('273A', undefined, undefined, 'Power to reduce or waive penalty in certain cases'),
  SEC_276B: ita(
    '276B',
    undefined,
    undefined,
    'Prosecution for failure to deposit deducted TDS -- 3 months to 7 years RI + fine',
  ),
  SEC_276BB: ita(
    '276BB',
    undefined,
    undefined,
    'Prosecution for failure to deposit collected TCS -- same as 276B',
  ),

  SEC_119: ita('119', undefined, undefined, 'CBDT power to issue instructions / orders'),
  SEC_206C_1A: ita(
    '206C',
    '1A',
    undefined,
    'TCS exemption declaration -- Form 27C from specified buyer (manufacturer / hospitality of LPG / scrap / minerals)',
  ),
} as const;

export type ItaSectionKey = keyof typeof ITA_SECTIONS;
