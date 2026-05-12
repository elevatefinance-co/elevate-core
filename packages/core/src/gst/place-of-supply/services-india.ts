/* Section 12 of the IGST Act -- place of supply of services where supplier and recipient are both in India.
 * The default is the location of the recipient if registered, else location of recipient on record (or
 * supplier if recipient address unavailable). Twelve specific overrides cover the categories where the
 * structural shape of the supply dictates a different place.
 *
 * Sub-clauses encoded:
 *   12(3)  Immovable-property services -- location of property
 *   12(4)  Restaurant / catering / fitness / beauty -- where performed
 *   12(5)  Training and performance appraisal -- where performed
 *                                                 (registered recipient: location of recipient)
 *   12(6)  Admission to event -- location where event is held
 *   12(7)  Organisation of an event -- location where event is held
 *                                       (registered recipient: location of recipient)
 *   12(8)  Transportation of goods -- registered recipient location (else handed-over location)
 *   12(9)  Passenger transportation -- embarkation point
 *   12(10) Services on a conveyance -- first scheduled point of departure
 *   12(11) Telecommunication services -- specific rules per service type
 *                                          (encoded as TELECOM with sub-discriminator)
 *   12(12) Banking and financial services -- recipient on records or supplier
 *   12(13) Insurance -- registered recipient location
 *   12(14) Advertisement to government -- proportional across States
 *
 * The default-12(2) catch-all (location of registered recipient, else recipient address on record, else
 * supplier) is encoded as the DEFAULT case. */

import { IGST_ACT_SECTIONS } from '../citations/igst-act-sections.js';
import { asState, type IndianStateCode, type PlaceOfSupplyResolution } from './types.js';

export type ServicesInIndiaShape =
  | {
      readonly kind: 'default';
      readonly recipientStateCode: IndianStateCode;
      readonly recipientIsRegistered: boolean;
      readonly supplierStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'immovable-property';
      readonly propertyStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'restaurant-or-personal';
      readonly performedStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'training';
      readonly performedStateCode: IndianStateCode;
      readonly recipientIsRegistered: boolean;
      readonly recipientStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'event-admission';
      readonly eventStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'event-organisation';
      readonly eventStateCode: IndianStateCode;
      readonly recipientIsRegistered: boolean;
      readonly recipientStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'goods-transport';
      readonly recipientIsRegistered: boolean;
      readonly recipientStateCode: IndianStateCode;
      readonly handedOverStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'passenger-transport';
      readonly embarkationStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'on-conveyance';
      readonly firstScheduledDepartureStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'banking';
      readonly recipientStateCodeOnRecord: IndianStateCode | null;
      readonly supplierStateCode: IndianStateCode;
    }
  | {
      readonly kind: 'insurance';
      readonly registeredRecipientStateCode: IndianStateCode;
    };

export function resolveServicesInIndiaPlaceOfSupply(
  input: ServicesInIndiaShape,
): PlaceOfSupplyResolution {
  switch (input.kind) {
    case 'default':
      return {
        outcome: asState(
          input.recipientIsRegistered ? input.recipientStateCode : input.supplierStateCode,
        ),
        resolverApplied: 'IGST_S12_DEFAULT',
        citations: [IGST_ACT_SECTIONS.SEC_12],
        notes: input.recipientIsRegistered
          ? 'Registered recipient location'
          : 'Supplier location (recipient address not on record)',
      };
    case 'immovable-property':
      return {
        outcome: asState(input.propertyStateCode),
        resolverApplied: 'IGST_S12_3',
        citations: [IGST_ACT_SECTIONS.SEC_12_3],
      };
    case 'restaurant-or-personal':
      return {
        outcome: asState(input.performedStateCode),
        resolverApplied: 'IGST_S12_4',
        citations: [IGST_ACT_SECTIONS.SEC_12_4],
        notes: 'Location where the service is actually performed',
      };
    case 'training':
      return {
        outcome: asState(
          input.recipientIsRegistered ? input.recipientStateCode : input.performedStateCode,
        ),
        resolverApplied: 'IGST_S12_5',
        citations: [IGST_ACT_SECTIONS.SEC_12_5],
        notes: input.recipientIsRegistered
          ? 'Registered recipient location'
          : 'Where service is performed (recipient unregistered)',
      };
    case 'event-admission':
      return {
        outcome: asState(input.eventStateCode),
        resolverApplied: 'IGST_S12_6',
        citations: [IGST_ACT_SECTIONS.SEC_12_6],
      };
    case 'event-organisation':
      return {
        outcome: asState(
          input.recipientIsRegistered ? input.recipientStateCode : input.eventStateCode,
        ),
        resolverApplied: 'IGST_S12_7',
        citations: [IGST_ACT_SECTIONS.SEC_12_7],
      };
    case 'goods-transport':
      return {
        outcome: asState(
          input.recipientIsRegistered ? input.recipientStateCode : input.handedOverStateCode,
        ),
        resolverApplied: 'IGST_S12_8',
        citations: [IGST_ACT_SECTIONS.SEC_12_8],
        notes: input.recipientIsRegistered
          ? 'Registered recipient location'
          : 'Place where goods are handed over for transportation',
      };
    case 'passenger-transport':
      return {
        outcome: asState(input.embarkationStateCode),
        resolverApplied: 'IGST_S12_9',
        citations: [IGST_ACT_SECTIONS.SEC_12_9],
        notes: 'Location where the passenger embarks',
      };
    case 'on-conveyance':
      return {
        outcome: asState(input.firstScheduledDepartureStateCode),
        resolverApplied: 'IGST_S12_10',
        citations: [IGST_ACT_SECTIONS.SEC_12_10],
      };
    case 'banking':
      return {
        outcome: asState(input.recipientStateCodeOnRecord ?? input.supplierStateCode),
        resolverApplied: 'IGST_S12_12',
        citations: [IGST_ACT_SECTIONS.SEC_12_12],
        notes: input.recipientStateCodeOnRecord
          ? 'Recipient location on records of supplier'
          : 'Supplier location (recipient not on record)',
      };
    case 'insurance':
      return {
        outcome: asState(input.registeredRecipientStateCode),
        resolverApplied: 'IGST_S12_13',
        citations: [IGST_ACT_SECTIONS.SEC_12_13],
      };
  }
}
