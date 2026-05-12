/* CBDT Circulars register for the TDS regime. CBDT clarifies statutory provisions through Circulars
 * (legally non-binding but persuasive); the rule engine cites operative Circulars where a rule encoding
 * follows CBDT clarification rather than the bare Section text. */

import type { CircularCitation } from '../../types/citation.js';

export const circular = (number: string, date: string, note?: string): CircularCitation => ({
  kind: 'circular',
  number,
  date,
  ...(note !== undefined ? { note } : {}),
});

export const CBDT_CIRCULARS = {
  C_4_2022: circular(
    '4/2022',
    '2022-03-15',
    'Section 194Q clarifications -- buyer threshold computation, GST component, 194Q / 206C(1H) sequencing',
  ),
  C_13_2022: circular(
    '13/2022',
    '2022-06-22',
    'Section 194S clarifications -- VDA TDS, peer-to-peer crypto, exchange treatment',
  ),
  C_18_2022: circular(
    '18/2022',
    '2022-09-13',
    'Section 194R clarifications -- benefits / perquisites scope, valuation, examples',
  ),
  C_19_2022: circular(
    '19/2022',
    '2022-09-30',
    'Section 194R further clarifications -- year of taxability, dealer-incentive treatment',
  ),
} as const;

export type CbdtCircularKey = keyof typeof CBDT_CIRCULARS;
