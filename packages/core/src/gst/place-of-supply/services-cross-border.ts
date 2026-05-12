/* Section 13 of the IGST Act -- place of supply of services where supplier or recipient is outside India.
 * The default is the location of the recipient. Specific overrides cover categories where the structural
 * shape dictates a different place.
 *
 *   13(3)   Services performed on physical goods physically made available -- where performed
 *   13(4)   Immovable-property services -- location of property
 *   13(5)   Event admission -- where event is held
 *   13(6)   Intermediary services -- location of supplier
 *   13(7)   Hiring of means of transport -- location of supplier
 *   13(8)   Banking and financial services -- location of supplier
 *   13(9)   Transportation of goods -- destination of goods
 *   13(10)  Passenger transportation -- place of embarkation
 *   13(12)  OIDAR services to non-taxable online recipient -- location of recipient
 *
 * The recipient-side resolution returns a state code if the recipient is in India and OUTSIDE_INDIA
 * otherwise. Cross-border supplies routinely produce OUTSIDE_INDIA outcomes (exports of services). */

import { IGST_ACT_SECTIONS } from '../citations/igst-act-sections.js';
import {
  asState,
  OUTSIDE_INDIA,
  type IndianStateCode,
  type PlaceOfSupplyOutcome,
  type PlaceOfSupplyResolution,
} from './types.js';

export type ServicesCrossBorderShape =
  | {
      readonly kind: 'default';
      readonly recipientLocation:
        | { readonly inIndia: true; readonly stateCode: IndianStateCode }
        | { readonly inIndia: false };
    }
  | {
      readonly kind: 'performed-on-goods';
      readonly performedLocation:
        | { readonly inIndia: true; readonly stateCode: IndianStateCode }
        | { readonly inIndia: false };
    }
  | {
      readonly kind: 'immovable-property';
      readonly propertyLocation:
        | { readonly inIndia: true; readonly stateCode: IndianStateCode }
        | { readonly inIndia: false };
    }
  | {
      readonly kind: 'event-admission';
      readonly eventLocation:
        | { readonly inIndia: true; readonly stateCode: IndianStateCode }
        | { readonly inIndia: false };
    }
  | {
      readonly kind: 'intermediary';
      readonly supplierLocation:
        | { readonly inIndia: true; readonly stateCode: IndianStateCode }
        | { readonly inIndia: false };
    }
  | {
      readonly kind: 'transport-hiring';
      readonly supplierLocation:
        | { readonly inIndia: true; readonly stateCode: IndianStateCode }
        | { readonly inIndia: false };
    }
  | {
      readonly kind: 'banking';
      readonly supplierLocation:
        | { readonly inIndia: true; readonly stateCode: IndianStateCode }
        | { readonly inIndia: false };
    }
  | {
      readonly kind: 'goods-transport';
      readonly destinationLocation:
        | { readonly inIndia: true; readonly stateCode: IndianStateCode }
        | { readonly inIndia: false };
    }
  | {
      readonly kind: 'passenger-transport';
      readonly embarkationLocation:
        | { readonly inIndia: true; readonly stateCode: IndianStateCode }
        | { readonly inIndia: false };
    }
  | {
      readonly kind: 'oidar';
      readonly recipientLocation:
        | { readonly inIndia: true; readonly stateCode: IndianStateCode }
        | { readonly inIndia: false };
    };

function locToOutcome(
  loc:
    | { readonly inIndia: true; readonly stateCode: IndianStateCode }
    | { readonly inIndia: false },
): PlaceOfSupplyOutcome {
  return loc.inIndia ? asState(loc.stateCode) : OUTSIDE_INDIA;
}

export function resolveServicesCrossBorderPlaceOfSupply(
  input: ServicesCrossBorderShape,
): PlaceOfSupplyResolution {
  switch (input.kind) {
    case 'default':
      return {
        outcome: locToOutcome(input.recipientLocation),
        resolverApplied: 'IGST_S13_DEFAULT',
        citations: [IGST_ACT_SECTIONS.SEC_13],
        notes: 'Default to location of recipient',
      };
    case 'performed-on-goods':
      return {
        outcome: locToOutcome(input.performedLocation),
        resolverApplied: 'IGST_S13_3',
        citations: [IGST_ACT_SECTIONS.SEC_13_3],
      };
    case 'immovable-property':
      return {
        outcome: locToOutcome(input.propertyLocation),
        resolverApplied: 'IGST_S13_4',
        citations: [IGST_ACT_SECTIONS.SEC_13_4],
      };
    case 'event-admission':
      return {
        outcome: locToOutcome(input.eventLocation),
        resolverApplied: 'IGST_S13_5',
        citations: [IGST_ACT_SECTIONS.SEC_13_5],
      };
    case 'intermediary':
      return {
        outcome: locToOutcome(input.supplierLocation),
        resolverApplied: 'IGST_S13_6',
        citations: [IGST_ACT_SECTIONS.SEC_13_6],
        notes: 'Intermediary services -- location of supplier',
      };
    case 'transport-hiring':
      return {
        outcome: locToOutcome(input.supplierLocation),
        resolverApplied: 'IGST_S13_7',
        citations: [IGST_ACT_SECTIONS.SEC_13_7],
      };
    case 'banking':
      return {
        outcome: locToOutcome(input.supplierLocation),
        resolverApplied: 'IGST_S13_8',
        citations: [IGST_ACT_SECTIONS.SEC_13_8],
      };
    case 'goods-transport':
      return {
        outcome: locToOutcome(input.destinationLocation),
        resolverApplied: 'IGST_S13_9',
        citations: [IGST_ACT_SECTIONS.SEC_13_9],
      };
    case 'passenger-transport':
      return {
        outcome: locToOutcome(input.embarkationLocation),
        resolverApplied: 'IGST_S13_10',
        citations: [IGST_ACT_SECTIONS.SEC_13_10],
      };
    case 'oidar':
      return {
        outcome: locToOutcome(input.recipientLocation),
        resolverApplied: 'IGST_S13_12',
        citations: [IGST_ACT_SECTIONS.SEC_13_12],
        notes: 'OIDAR services to non-taxable online recipient',
      };
  }
}
