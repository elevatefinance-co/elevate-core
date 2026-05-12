/* Section 17(5) blocked-credits classifier. Eleven sub-clauses each enumerate a category of inward supply
 * for which Input Tax Credit is not available, with carve-outs documented in each clause's note. The
 * platform surfaces the classifier inline in the GSTR-3B Table 4 ITC reversal flow and in the per-line ITC
 * reconciliation surface; a regulator audit can drill from a reversal back to the specific clause that
 * triggered it.
 *
 * The discriminated-union return shape lets consumers pattern-match exhaustively in TypeScript -- if a
 * future Council recommendation adds a new sub-clause, the type-check at every call site flags the missing
 * case.
 *
 * The demand-provisions block (clause (i) of the Act) was substituted by Finance (No. 2) Act 2024 effective
 * 1 November 2024 (Notification 17/2024-CT): only tax paid in accordance with section 74 in respect of
 * periods up to FY 2023-24 stays blocked; the sections 129 / 130 references were removed. The date-aware
 * classifyDemandPaidTaxCredit dispatcher applies the text in force on the classification date. */

import type { Citation } from '../../types/citation.js';
import { CBIC_NOTIFICATIONS } from '../citations/cbic-notifications.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';

export type BlockedCreditReason =
  | 'NOT_BLOCKED'
  | 'S17_5_A_MOTOR_VEHICLE'
  | 'S17_5_B_FOOD_BEVERAGES'
  | 'S17_5_C_CLUB_HEALTH'
  | 'S17_5_D_TRAVEL_BENEFIT'
  | 'S17_5_E_WORKS_CONTRACT'
  | 'S17_5_F_CONSTRUCTION_OWN_ACCOUNT'
  | 'S17_5_G_COMPOSITION'
  | 'S17_5_H_NRTP'
  | 'S17_5_I_PERSONAL_CONSUMPTION'
  | 'S17_5_J_GIFTS_LOSS_DESTROYED'
  | 'S17_5_K_S74_S129_S130';

const SUB_CLAUSE_TO_CITATION: Readonly<
  Record<Exclude<BlockedCreditReason, 'NOT_BLOCKED'>, Citation>
> = {
  S17_5_A_MOTOR_VEHICLE: CGST_ACT_SECTIONS.SEC_17_5_A,
  S17_5_B_FOOD_BEVERAGES: CGST_ACT_SECTIONS.SEC_17_5_B,
  S17_5_C_CLUB_HEALTH: CGST_ACT_SECTIONS.SEC_17_5_C,
  S17_5_D_TRAVEL_BENEFIT: CGST_ACT_SECTIONS.SEC_17_5_D,
  S17_5_E_WORKS_CONTRACT: CGST_ACT_SECTIONS.SEC_17_5_E,
  S17_5_F_CONSTRUCTION_OWN_ACCOUNT: CGST_ACT_SECTIONS.SEC_17_5_F,
  S17_5_G_COMPOSITION: CGST_ACT_SECTIONS.SEC_17_5_G,
  S17_5_H_NRTP: CGST_ACT_SECTIONS.SEC_17_5_H,
  S17_5_I_PERSONAL_CONSUMPTION: CGST_ACT_SECTIONS.SEC_17_5_I,
  S17_5_J_GIFTS_LOSS_DESTROYED: CGST_ACT_SECTIONS.SEC_17_5_J,
  S17_5_K_S74_S129_S130: CGST_ACT_SECTIONS.SEC_17_5_K,
};

const SUB_CLAUSE_DESCRIPTION: Readonly<
  Record<Exclude<BlockedCreditReason, 'NOT_BLOCKED'>, string>
> = {
  S17_5_A_MOTOR_VEHICLE:
    'Motor vehicles for transportation of persons (capacity not exceeding 13 persons including driver), vessels, aircraft -- with carve-outs for further supply, transportation of passengers, training, transportation of goods.',
  S17_5_B_FOOD_BEVERAGES:
    'Food and beverages, outdoor catering, beauty treatment, health services, cosmetic and plastic surgery, life and health insurance -- with carve-outs for outward supply of the same category and statutory mandate.',
  S17_5_C_CLUB_HEALTH: 'Membership of a club, health and fitness centre.',
  S17_5_D_TRAVEL_BENEFIT: 'Travel benefits extended to employees on vacation (LTC and similar).',
  S17_5_E_WORKS_CONTRACT:
    'Works contract services for construction of immovable property -- carve-out for further supply of works contract service.',
  S17_5_F_CONSTRUCTION_OWN_ACCOUNT:
    'Goods or services received for construction of immovable property on own account, even if used in business -- carve-out for plant and machinery.',
  S17_5_G_COMPOSITION: 'Goods or services on which composition tax is paid by the supplier.',
  S17_5_H_NRTP: 'Goods or services received by a non-resident taxable person except imports.',
  S17_5_I_PERSONAL_CONSUMPTION: 'Goods or services for personal consumption.',
  S17_5_J_GIFTS_LOSS_DESTROYED:
    'Goods lost, stolen, destroyed, written off, or disposed of by way of gift or free samples.',
  S17_5_K_S74_S129_S130:
    'Tax paid in pursuance of orders under Section 74 (fraud), Section 129 (detention/seizure of goods in transit), or Section 130 (confiscation) -- for classifications before 1 November 2024. Thereafter, per Finance (No. 2) Act 2024, only tax paid under Section 74 for periods up to FY 2023-24 stays blocked.',
};

export type BlockedCreditClassification = {
  readonly blocked: boolean;
  readonly reason: BlockedCreditReason;
  readonly description: string;
  readonly citations: readonly Citation[];
};

const NOT_BLOCKED_DESCRIPTION =
  'No Section 17(5) sub-clause applies; ITC is available subject to the general eligibility conditions in Section 16(2) and the time-bar in Section 16(4).';

export function classifyBlockedCredit(reason: BlockedCreditReason): BlockedCreditClassification {
  if (reason === 'NOT_BLOCKED') {
    return {
      blocked: false,
      reason,
      description: NOT_BLOCKED_DESCRIPTION,
      citations: [CGST_ACT_SECTIONS.SEC_16, CGST_ACT_SECTIONS.SEC_16_2],
    };
  }
  const citation = SUB_CLAUSE_TO_CITATION[reason];
  const description = SUB_CLAUSE_DESCRIPTION[reason];
  return {
    blocked: true,
    reason,
    description,
    citations: [CGST_ACT_SECTIONS.SEC_17_5, citation],
  };
}

export function blockedCreditDescription(reason: BlockedCreditReason): string {
  if (reason === 'NOT_BLOCKED') return NOT_BLOCKED_DESCRIPTION;
  return SUB_CLAUSE_DESCRIPTION[reason];
}

export function isBlockedCreditReason(reason: BlockedCreditReason): boolean {
  return reason !== 'NOT_BLOCKED';
}

export const BLOCKED_CREDIT_REASONS: readonly BlockedCreditReason[] = [
  'NOT_BLOCKED',
  'S17_5_A_MOTOR_VEHICLE',
  'S17_5_B_FOOD_BEVERAGES',
  'S17_5_C_CLUB_HEALTH',
  'S17_5_D_TRAVEL_BENEFIT',
  'S17_5_E_WORKS_CONTRACT',
  'S17_5_F_CONSTRUCTION_OWN_ACCOUNT',
  'S17_5_G_COMPOSITION',
  'S17_5_H_NRTP',
  'S17_5_I_PERSONAL_CONSUMPTION',
  'S17_5_J_GIFTS_LOSS_DESTROYED',
  'S17_5_K_S74_S129_S130',
];

export type DemandRecoveryProvision = 'SECTION_74' | 'SECTION_74A' | 'SECTION_129' | 'SECTION_130';

const SECTION_17_5_I_SUBSTITUTION_DATE = new Date('2024-11-01T00:00:00Z');

/* FY 2023-24 is the last financial year whose section 74 tax stays blocked under the substituted clause
 * (i); FY 2024-25 onwards falls under the Section 74A regime, which clause (i) does not reference. */
const LAST_BLOCKED_FY_START_YEAR = 2023;

export type DemandPaidTaxClassification = {
  readonly blocked: boolean;
  readonly provision: DemandRecoveryProvision;
  readonly description: string;
  readonly citations: readonly Citation[];
};

export function classifyDemandPaidTaxCredit(input: {
  readonly provision: DemandRecoveryProvision;
  readonly classificationDate: Date;
  readonly taxPeriodFyStartYear: number;
}): DemandPaidTaxClassification {
  const substitutedTextInForce =
    input.classificationDate.getTime() >= SECTION_17_5_I_SUBSTITUTION_DATE.getTime();

  if (!substitutedTextInForce) {
    const blocked = input.provision !== 'SECTION_74A';
    const description = blocked
      ? 'Tax paid in accordance with sections 74, 129 and 130 -- ITC blocked under Section 17(5)(i) as it stood before 1 November 2024.'
      : 'Section 74A is not in force before 1 November 2024; no Section 17(5)(i) block applies to it.';
    return {
      blocked,
      provision: input.provision,
      description,
      citations: [CGST_ACT_SECTIONS.SEC_17_5, CGST_ACT_SECTIONS.SEC_17_5_I_TAX_PAID_DEMANDS],
    };
  }

  const blocked =
    input.provision === 'SECTION_74' && input.taxPeriodFyStartYear <= LAST_BLOCKED_FY_START_YEAR;
  const description = blocked
    ? 'Tax paid in accordance with section 74 in respect of a period up to FY 2023-24 -- ITC blocked under Section 17(5)(i) as substituted by Finance (No. 2) Act 2024.'
    : 'Section 17(5)(i) as substituted effective 1 November 2024 blocks only section 74 tax for periods up to FY 2023-24; payments under sections 129, 130 or 74A are outside the block.';
  return {
    blocked,
    provision: input.provision,
    description,
    citations: [
      CGST_ACT_SECTIONS.SEC_17_5,
      CGST_ACT_SECTIONS.SEC_17_5_I_TAX_PAID_DEMANDS,
      CBIC_NOTIFICATIONS.N_17_2024_CT,
    ],
  };
}
