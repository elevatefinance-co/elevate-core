/* Canonical SectionCitation registry for the IGST Act, 2017. IGST levies cover inter-State supplies, imports
 * into and exports from India, supplies to and from SEZs, and OIDAR services. The place-of-supply rules in
 * Sections 10 through 13 are the load-bearing rules every GSTR-1 row depends on. */

import type { SectionCitation } from '../../types/citation.js';

export const igst = (
  section: string,
  subSection?: string,
  clause?: string,
  note?: string,
): SectionCitation => ({
  kind: 'section',
  act: 'IGST_ACT_2017',
  section,
  ...(subSection !== undefined ? { subSection } : {}),
  ...(clause !== undefined ? { clause } : {}),
  ...(note !== undefined ? { note } : {}),
});

export const IGST_ACT_SECTIONS = {
  SEC_2: igst('2', undefined, undefined, 'Definitions'),
  SEC_5: igst('5', undefined, undefined, 'Levy and collection of IGST'),
  SEC_5_3: igst('5', '3', undefined, 'Reverse charge for IGST'),
  SEC_7: igst('7', undefined, undefined, 'Inter-State supply'),

  SEC_10: igst('10', undefined, undefined, 'Place of supply of goods other than imports / exports'),
  SEC_10_1_A: igst('10', '1', 'a', 'Goods involving movement -- delivery location'),
  SEC_10_1_B: igst(
    '10',
    '1',
    'b',
    'Bill-to-ship-to -- principal place of business of third person',
  ),
  SEC_10_1_C: igst('10', '1', 'c', 'Goods not involving movement -- location at delivery'),
  SEC_10_1_D: igst('10', '1', 'd', 'Goods assembled / installed at site'),
  SEC_10_1_E: igst('10', '1', 'e', 'Goods on board a conveyance'),

  SEC_11: igst('11', undefined, undefined, 'Place of supply of imported / exported goods'),
  SEC_11_A: igst('11', undefined, 'a', 'Imports -- location of importer'),
  SEC_11_B: igst('11', undefined, 'b', 'Exports -- location outside India'),

  SEC_12: igst(
    '12',
    undefined,
    undefined,
    'Place of supply of services where supplier and recipient are in India',
  ),
  SEC_12_3: igst('12', '3', undefined, 'Immovable-property services -- location of property'),
  SEC_12_4: igst(
    '12',
    '4',
    undefined,
    'Restaurant / catering / fitness / beauty -- where performed',
  ),
  SEC_12_5: igst('12', '5', undefined, 'Training and performance appraisal'),
  SEC_12_6: igst('12', '6', undefined, 'Admission to event or amusement park'),
  SEC_12_7: igst('12', '7', undefined, 'Organisation of an event'),
  SEC_12_8: igst('12', '8', undefined, 'Transportation of goods'),
  SEC_12_9: igst('12', '9', undefined, 'Passenger transportation'),
  SEC_12_10: igst('12', '10', undefined, 'Services on board a conveyance'),
  SEC_12_11: igst('12', '11', undefined, 'Telecommunication services'),
  SEC_12_12: igst('12', '12', undefined, 'Banking and financial services'),
  SEC_12_13: igst('12', '13', undefined, 'Insurance'),
  SEC_12_14: igst('12', '14', undefined, 'Advertisement to government'),

  SEC_13: igst(
    '13',
    undefined,
    undefined,
    'Place of supply of services where supplier or recipient is outside India',
  ),
  SEC_13_3: igst('13', '3', undefined, 'Services performed on physical goods'),
  SEC_13_4: igst('13', '4', undefined, 'Immovable-property services across border'),
  SEC_13_5: igst('13', '5', undefined, 'Event admission across border'),
  SEC_13_6: igst('13', '6', undefined, 'Intermediary services'),
  SEC_13_7: igst('13', '7', undefined, 'Hiring of means of transport'),
  SEC_13_8: igst('13', '8', undefined, 'Banking and financial services across border'),
  SEC_13_9: igst('13', '9', undefined, 'Transportation of goods across border'),
  SEC_13_10: igst('13', '10', undefined, 'Passenger transportation across border'),
  SEC_13_12: igst('13', '12', undefined, 'OIDAR services to non-taxable online recipient'),

  SEC_16: igst('16', undefined, undefined, 'Zero-rated supply'),

  SEC_19: igst('19', undefined, undefined, 'Tax wrongly collected and paid'),
} as const;

export type IgstActSectionKey = keyof typeof IGST_ACT_SECTIONS;
