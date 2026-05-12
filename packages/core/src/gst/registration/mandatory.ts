/* Section 24 of the CGST Act -- compulsory registration regardless of aggregate turnover. Eleven categories
 * the platform encodes for the registration-eligibility surface. Crossing into any category bypasses the
 * Section 22 turnover threshold entirely.
 *
 * Categories per Section 24 sub-clauses:
 *   24(1)  Inter-State outward supply
 *   24(2)  Casual taxable person
 *   24(3)  Reverse-charge payer (Section 9(3) / 9(4))
 *   24(4)  TDS deductor under Section 51
 *   24(5)  Non-resident taxable person
 *   24(7)  Persons supplying on behalf of others as an agent
 *   24(8)  Input Service Distributor
 *   24(9)  E-commerce supplier (with notified exceptions)
 *   24(10) E-commerce operator
 *   24(11) OIDAR provider from outside India to non-taxable online recipient
 *   24(13) TCS collector under Section 52
 *
 * Each predicate returns a CompulsoryRegistrationFinding with the precise sub-clause that triggered, the
 * citation, and a human-readable note for the audit trail. */

import type { Citation } from '../../types/citation.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';

export type CompulsoryRegistrationCategory =
  | 'INTER_STATE_OUTWARD_SUPPLY'
  | 'CASUAL_TAXABLE_PERSON'
  | 'REVERSE_CHARGE_PAYER'
  | 'TDS_DEDUCTOR_S51'
  | 'NON_RESIDENT_TAXABLE_PERSON'
  | 'AGENT'
  | 'INPUT_SERVICE_DISTRIBUTOR'
  | 'E_COMMERCE_SUPPLIER'
  | 'E_COMMERCE_OPERATOR'
  | 'OIDAR_FROM_OUTSIDE_INDIA'
  | 'TCS_COLLECTOR_S52';

export type CompulsoryRegistrationFinding = {
  readonly required: true;
  readonly category: CompulsoryRegistrationCategory;
  readonly citations: readonly Citation[];
  readonly notes: string;
};

export type NotCompulsorilyRequired = {
  readonly required: false;
};

export type CompulsoryRegistrationCheck = CompulsoryRegistrationFinding | NotCompulsorilyRequired;

const CATEGORY_NOTES: Readonly<Record<CompulsoryRegistrationCategory, string>> = {
  INTER_STATE_OUTWARD_SUPPLY:
    'Section 24(1) -- mandatory registration for any inter-State outward supply (with notified service-provider carve-outs).',
  CASUAL_TAXABLE_PERSON:
    'Section 24(2) -- registration prior to commencement; valid for the period specified in registration application up to 90 days; advance tax based on estimated liability.',
  REVERSE_CHARGE_PAYER:
    'Section 24(3) -- registration mandatory for any person required to pay tax under reverse charge.',
  TDS_DEDUCTOR_S51: 'Section 24(4) read with Section 51 -- specified Government and PSU deductors.',
  NON_RESIDENT_TAXABLE_PERSON:
    'Section 24(5) -- non-resident taxable person prior to commencement.',
  AGENT: 'Section 24(7) -- persons supplying on behalf of others as an agent.',
  INPUT_SERVICE_DISTRIBUTOR: 'Section 24(8) -- Input Service Distributor.',
  E_COMMERCE_SUPPLIER:
    'Section 24(9) -- persons making supplies through electronic commerce operator (with notified exceptions per Notification 65/2017-CT).',
  E_COMMERCE_OPERATOR: 'Section 24(10) -- electronic commerce operator.',
  OIDAR_FROM_OUTSIDE_INDIA:
    'Section 24(11) -- OIDAR provider from outside India to non-taxable online recipient.',
  TCS_COLLECTOR_S52:
    'Section 24(13) read with Section 52 -- TCS collector via electronic commerce operator.',
};

export function findCompulsoryRegistrationTrigger(input: {
  readonly hasInterStateOutwardSupply?: boolean;
  readonly isCasualTaxablePerson?: boolean;
  readonly isReverseChargePayer?: boolean;
  readonly isTdsDeductorUnderS51?: boolean;
  readonly isNonResidentTaxablePerson?: boolean;
  readonly suppliesAsAgent?: boolean;
  readonly isInputServiceDistributor?: boolean;
  readonly suppliesViaEcommerceOperator?: boolean;
  readonly isEcommerceOperator?: boolean;
  readonly isOidarProviderFromOutsideIndia?: boolean;
  readonly isTcsCollectorUnderS52?: boolean;
}): CompulsoryRegistrationCheck {
  const baseCitations: Citation[] = [CGST_ACT_SECTIONS.SEC_24];

  const checks: readonly {
    flag: boolean | undefined;
    category: CompulsoryRegistrationCategory;
  }[] = [
    {
      flag: input.hasInterStateOutwardSupply,
      category: 'INTER_STATE_OUTWARD_SUPPLY',
    },
    { flag: input.isCasualTaxablePerson, category: 'CASUAL_TAXABLE_PERSON' },
    { flag: input.isReverseChargePayer, category: 'REVERSE_CHARGE_PAYER' },
    { flag: input.isTdsDeductorUnderS51, category: 'TDS_DEDUCTOR_S51' },
    {
      flag: input.isNonResidentTaxablePerson,
      category: 'NON_RESIDENT_TAXABLE_PERSON',
    },
    { flag: input.suppliesAsAgent, category: 'AGENT' },
    {
      flag: input.isInputServiceDistributor,
      category: 'INPUT_SERVICE_DISTRIBUTOR',
    },
    {
      flag: input.suppliesViaEcommerceOperator,
      category: 'E_COMMERCE_SUPPLIER',
    },
    { flag: input.isEcommerceOperator, category: 'E_COMMERCE_OPERATOR' },
    {
      flag: input.isOidarProviderFromOutsideIndia,
      category: 'OIDAR_FROM_OUTSIDE_INDIA',
    },
    { flag: input.isTcsCollectorUnderS52, category: 'TCS_COLLECTOR_S52' },
  ];

  for (const check of checks) {
    if (check.flag === true) {
      return {
        required: true,
        category: check.category,
        citations: baseCitations,
        notes: CATEGORY_NOTES[check.category],
      };
    }
  }

  return { required: false };
}
