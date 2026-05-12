/* Typed transaction shapes for the RSU / ESOP perquisite engine. Amounts are integer rupees for INR fields;
 * original-currency amounts keep their currency as a separate `currency` field so callers can round-trip to
 * the broker feed's exact value.
 *
 * A grant may vest in multiple tranches over a schedule; each vest is a separate taxable event under
 * Section 17(2)(vi). Callers model each tranche as a `RsuVestEvent`. */

export type SecurityListingStatus =
  | 'LISTED_INDIAN_EXCHANGE'
  | 'LISTED_FOREIGN_EXCHANGE'
  | 'UNLISTED';

export type RsuGrant = {
  readonly grantId: string;
  readonly employer: string;
  readonly grantDate: string;
  readonly totalUnits: number;
  readonly exercisePriceInOriginalCurrency: number;
  readonly originalCurrency: string;
  readonly listingStatus: SecurityListingStatus;
  readonly exchangeCountryIso2?: string;
};

export type RsuVestEvent = {
  readonly vestDate: string;
  readonly unitsVested: number;
  readonly fmvPerUnitInOriginalCurrency: number;
  readonly originalCurrency: string;
  readonly sbiTtbrOnVestDate?: number;
  readonly merchantBankerFmvPerUnitInr?: number;
};

export type RsuSaleEvent = {
  readonly saleDate: string;
  readonly unitsSold: number;
  readonly salePricePerUnitInOriginalCurrency: number;
  readonly originalCurrency: string;
  readonly sbiTtbrOnSaleDate?: number;
  readonly brokerCommissionInr?: number;
};
