/* CBDT Circulars, Notifications and Press-Releases referenced by the rule modules. Kept in a single const so
 * that a consumer renders "Clarified by CBDT Circular X/YYYY" next to the affected number and links to the
 * official PDF on incometaxindia.gov.in.
 *
 * New circulars get appended. Never re-shuffle, because existing consumers cache the keys. */

import type { CircularCitation } from '../types/citation.js';

export const circularCitation = (
  number: string,
  date: string,
  note?: string,
  url?: string,
): CircularCitation => ({
  kind: 'circular',
  number,
  date,
  ...(note !== undefined ? { note } : {}),
  ...(url !== undefined ? { url } : {}),
});

export const CIRCULARS = {
  CBDT_CIRC_12_2024: circularCitation(
    '12/2024',
    '2024-08-14',
    'Clarifications on capital-gains amendments under Finance (No. 2) Act 2024. Pre-/post 23-Jul-2024 split, 112A Rs. 1.25L consolidated annual exemption, 112 indexation option for resident individuals / HUF on pre-split land/building.',
    'https://incometaxindia.gov.in/communications/circular/circular-no-12-2024.pdf',
  ),
  CBDT_CIRC_1_2023: circularCitation(
    '1/2023',
    '2023-04-01',
    'Specified mutual-fund / debt MF. Section 50AA introduction; gains always slab-rate after 01-Apr-2023 regardless of holding period.',
  ),
  CBDT_CIRC_13_2022: circularCitation(
    '13/2022',
    '2022-06-22',
    'Valuation of specified security / sweat equity (RSU / ESOP) perquisite. Clarifications on FMV sourcing for foreign-listed shares and exercise-date determination.',
  ),
} as const;

export type CircularKey = keyof typeof CIRCULARS;
