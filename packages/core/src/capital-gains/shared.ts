/* Shared transaction-shape types for every capital-gains module. The tax rule doesn't care whether a
 * transaction came from a broker feed, a user form, or a CSV. It cares about the six numbers + dates that
 * determine the tax outcome. Keeping the input types here means a caller writes one transaction shape and
 * feeds it to any rule module in this folder.
 *
 * Amounts are integer rupees throughout. `Math.round(cost)` at the boundary is the caller's responsibility.
 * The rules do not re-round, so a caller passing fractional rupees will see the fractional drift surface in
 * the output. */

export type ListedEquityTxn = {
  readonly saleDate: string;
  readonly purchaseDate: string;
  readonly saleConsideration: number;
  readonly acquisitionCost: number;
  readonly transferExpenses?: number;
  readonly fmvJan312018?: number;
  readonly securityDescription?: string;
  readonly isin?: string;
};

export type OtherAssetTxn = {
  readonly assetType:
    | 'IMMOVABLE_PROPERTY_LAND'
    | 'IMMOVABLE_PROPERTY_BUILDING'
    | 'UNLISTED_EQUITY'
    | 'DEBENTURE_OR_BOND'
    | 'GOLD_OR_JEWELLERY'
    | 'OTHER';
  readonly saleDate: string;
  readonly purchaseDate: string;
  readonly saleConsideration: number;
  readonly acquisitionCost: number;
  readonly improvementCost?: number;
  readonly transferExpenses?: number;
  readonly indexationOptIn?: boolean;
  readonly exemptionsClaimed?: readonly {
    readonly section: string;
    readonly amount: number;
  }[];
  readonly assetDescription?: string;
};

export type VdaTxn = {
  readonly tokenName?: string;
  readonly saleDate: string;
  readonly purchaseDate?: string;
  readonly saleConsideration: number;
  readonly acquisitionCost: number;
};

export function rawNetGain(saleConsideration: number, subtract: readonly number[]): number {
  const total = subtract.reduce((sum, value) => sum + (value ?? 0), 0);
  return Math.max(0, saleConsideration - total);
}
