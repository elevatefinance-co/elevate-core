/* Operative CBIC notification register. The platform cites notifications by family + number + year + date
 * when a rule encodes their effect (rate change, threshold change, procedural change). The registry is
 * append-only -- every notification stays here forever even after superseded, since historical computations
 * against an effective-date band remain reproducible.
 *
 * Family abbreviations:
 *   CBIC_CT          Central Tax (procedural)
 *   CBIC_CT_RATE     Central Tax Rate (CGST rates and exemptions)
 *   CBIC_IT          Integrated Tax (procedural)
 *   CBIC_IT_RATE     Integrated Tax Rate (IGST rates)
 *   CBIC_COMP_CESS_RATE  Compensation Cess Rate */

import type { NotificationCitation } from '../../types/citation.js';

export const ct = (number: string, date: string, note?: string): NotificationCitation => ({
  kind: 'notification',
  number,
  date,
  family: 'CBIC_CT',
  ...(note !== undefined ? { note } : {}),
});

export const ctRate = (number: string, date: string, note?: string): NotificationCitation => ({
  kind: 'notification',
  number,
  date,
  family: 'CBIC_CT_RATE',
  ...(note !== undefined ? { note } : {}),
});

export const CBIC_NOTIFICATIONS = {
  N_1_2017_CT_RATE: ctRate(
    '1/2017',
    '2017-06-28',
    'Principal CGST rate schedule -- five slabs across Schedules I-VI',
  ),
  N_4_2017_CT_RATE: ctRate('4/2017', '2017-06-28', 'RCM goods list under Section 9(3)'),
  N_13_2017_CT_RATE: ctRate(
    '13/2017',
    '2017-06-28',
    'RCM services list under Section 9(3) -- GTA, advocate, director, OIDAR etc.',
  ),
  N_8_2017_CT_RATE: ctRate(
    '8/2017',
    '2017-06-28',
    'Suspends Section 9(4) RCM for unregistered to registered supplies',
  ),

  N_6_2017_CT: ct('6/2017', '2017-06-19', 'GSTR-3B due 20th of next month for monthly filers'),
  N_49_2019_CT: ct('49/2019', '2019-10-09', 'Permanent GSTR-3B form via amendment to Rule 61(5)'),
  N_75_2020_CT: ct('75/2020', '2020-10-15', 'QRMP scheme due dates for GSTR-1 and GSTR-3B'),
  N_76_2020_CT: ct(
    '76/2020',
    '2020-10-15',
    'QRMP scheme State-group split for GSTR-3B (22nd / 24th)',
  ),
  N_82_2020_CT: ct(
    '82/2020',
    '2020-11-10',
    'IFF -- Rule 59(2) for B2B invoices in QRMP months 1-2',
  ),
  N_85_2020_CT: ct('85/2020', '2020-11-10', 'PMT-06 fixed-sum 35-percent method for QRMP'),

  N_78_2020_CT: ct(
    '78/2020',
    '2020-10-15',
    'HSN digit-granularity per turnover band, effective 1 April 2021',
  ),

  N_13_2020_CT: ct('13/2020', '2020-03-21', 'E-invoicing principal notification via Rule 48(4)'),
  N_10_2023_CT: ct(
    '10/2023',
    '2023-05-10',
    'E-invoice threshold lowered to Rs 5 crore aggregate turnover, effective 1 August 2023',
  ),

  N_30_2021_CT: ct(
    '30/2021',
    '2021-07-30',
    'GSTR-9C self-certification post FY 2020-21; threshold raised to Rs 5 crore',
  ),
  N_31_2021_CT: ct(
    '31/2021',
    '2021-07-30',
    'GSTR-9 / 9C reconciliation statement self-certification operationalisation',
  ),

  N_38_2021_CT: ct(
    '38/2021',
    '2021-12-21',
    'Aadhaar authentication for GST registration applicants',
  ),

  N_14_2022_CT: ct(
    '14/2022',
    '2022-07-05',
    'Rule 88B inserted -- Section 50 interest computed on net cash basis effective 1 July 2022',
  ),

  N_7_2023_CT: ct('7/2023', '2023-03-31', 'Late-fee waiver and cap revision per turnover band'),

  N_11_2023_CT_RATE: ctRate(
    '11/2023',
    '2023-09-29',
    '28 percent on full face value of bets in online gaming, casinos, horse races -- effective 1 October 2023',
  ),

  N_12_2024_CT: ct(
    '12/2024',
    '2024-07-10',
    'IMS (Invoice Management System) introduced; GSTR-1A amendment return introduced; ISD regime amended; effective Aug-Oct 2024',
  ),
} as const;

export type CbicNotificationKey = keyof typeof CBIC_NOTIFICATIONS;
