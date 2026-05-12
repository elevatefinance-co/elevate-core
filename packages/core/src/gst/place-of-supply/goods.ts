/* Section 10 of the IGST Act -- place of supply of goods (other than imports and exports). Five sub-clauses
 * each cover a distinct supply pattern; the resolver dispatches by the supply's structural shape. The result
 * feeds directly into GSTR-1 Table classification (intra-State CGST + SGST or inter-State IGST) and into the
 * rate split that lands in Gstr3bSection rows.
 *
 * Sub-clauses encoded:
 *   10(1)(a)  Supply involves movement of goods -- delivery loc
 *   10(1)(b)  Bill-to-ship-to -- principal place of business of third person
 *   10(1)(c)  Supply does not involve movement -- location at delivery
 *   10(1)(d)  Goods assembled / installed at site
 *   10(1)(e)  Goods on board a conveyance
 *
 * The 10(2) catch-all (goods place-of-supply otherwise undeterminable) is intentionally not encoded here;
 * it requires a CBIC notification-specific carve-out and is rare enough that the platform routes such cases
 * to manual disposition with a citation pointer. */

import { IGST_ACT_SECTIONS } from '../citations/igst-act-sections.js';
import { asState, type IndianStateCode, type PlaceOfSupplyResolution } from './types.js';

export type GoodsSupplyShape =
  | {
      readonly kind: 'movement';
      readonly deliveryStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'bill-to-ship-to';
      readonly thirdPersonStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'no-movement';
      readonly locationAtDeliveryStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'assembled-or-installed';
      readonly installationStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'on-board-conveyance';
      readonly takenOnBoardStateCode: IndianStateCode;
    };

export function resolveGoodsPlaceOfSupply(input: GoodsSupplyShape): PlaceOfSupplyResolution {
  switch (input.kind) {
    case 'movement':
      return {
        outcome: asState(input.deliveryStateCode),
        resolverApplied: 'IGST_S10_1_A',
        citations: [IGST_ACT_SECTIONS.SEC_10, IGST_ACT_SECTIONS.SEC_10_1_A],
      };
    case 'bill-to-ship-to':
      return {
        outcome: asState(input.thirdPersonStateCode),
        resolverApplied: 'IGST_S10_1_B',
        citations: [IGST_ACT_SECTIONS.SEC_10, IGST_ACT_SECTIONS.SEC_10_1_B],
        notes: 'Principal place of business of the third person who directs the delivery',
      };
    case 'no-movement':
      return {
        outcome: asState(input.locationAtDeliveryStateCode),
        resolverApplied: 'IGST_S10_1_C',
        citations: [IGST_ACT_SECTIONS.SEC_10, IGST_ACT_SECTIONS.SEC_10_1_C],
      };
    case 'assembled-or-installed':
      return {
        outcome: asState(input.installationStateCode),
        resolverApplied: 'IGST_S10_1_D',
        citations: [IGST_ACT_SECTIONS.SEC_10, IGST_ACT_SECTIONS.SEC_10_1_D],
      };
    case 'on-board-conveyance':
      return {
        outcome: asState(input.takenOnBoardStateCode),
        resolverApplied: 'IGST_S10_1_E',
        citations: [IGST_ACT_SECTIONS.SEC_10, IGST_ACT_SECTIONS.SEC_10_1_E],
        notes: 'Location where goods are taken on board the conveyance',
      };
  }
}
