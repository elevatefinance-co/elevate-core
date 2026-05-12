/* Section 17(5) blocked-credits classifier. Eleven sub-clauses each enumerate a category of inward supply
 * for which Input Tax Credit is not available, with carve-outs documented in each clause's note. The
 * platform surfaces the classifier inline in the GSTR-3B Table 4 ITC reversal flow and in the per-line ITC
 * reconciliation surface; a regulator audit can drill from a reversal back to the specific clause that
 * triggered it.
 *
 * The discriminated-union return shape lets consumers pattern-match exhaustively in TypeScript -- if a
 * future Council recommendation adds a new sub-clause, the type-check at every call site flags the missing
 * case. */

import type { Citation } from '../../types/citation.js';
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
    'Tax paid in pursuance of orders under Section 74 (fraud), Section 129 (detention/seizure of goods in transit), or Section 130 (confiscation).',
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
