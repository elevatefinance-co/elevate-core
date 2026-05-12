/* RSU perquisite at vest for a foreign-listed grant.
 *
 * Chain:
 *   sourceFmvPerUnitInr  ->  pick FMV (Indian listed close /
 *                            foreign-listed FMV * SBI TTBR /
 *                            unlisted Rule 11UA merchant-banker)
 *   computePerquisiteAtVest -> apply Section 17(2)(vi) on
 *                              (FMV - exercise price) * units
 *   computeSaleCostBasis    -> later, when the user sells, the
 *                              cost basis is the FMV that was
 *                              taxed as perquisite (Section 49)
 *
 * Run with: pnpm tsx docs/examples/rsu-perquisite.ts */

import {
  sourceFmvPerUnitInr,
  computePerquisiteAtVest,
  computeSaleCostBasis,
} from '@elevatefinance-co/india-tax-rules';

const grant = {
  grantDate: '2023-06-01',
  totalUnits: 1_000,
  exercisePriceOriginalMinor: 0,
  originalCurrency: 'USD' as const,
  listingStatus: 'LISTED_FOREIGN_EXCHANGE' as const,
  exchangeCountryIso2: 'US',
};

const vest = {
  vestDate: '2024-09-01',
  unitsVested: 250,
  fmvPerUnitOriginalMinor: 17_550,
  originalCurrency: 'USD' as const,
  sbiTtbrOnVestDate: 83.42,
};

const fmv = sourceFmvPerUnitInr({ grant, vest, ay: 'AY2025-26' });

const perq = computePerquisiteAtVest({
  grant,
  vest,
  fmvPerUnitInr: fmv.value,
  ay: 'AY2025-26',
});

console.log('Perquisite (INR):', perq.value);
console.log('Citations:', perq.citations);

const sale = {
  saleDate: '2026-03-15',
  unitsSold: 100,
  salePricePerUnitOriginalMinor: 21_000,
  originalCurrency: 'USD' as const,
  sbiTtbrOnSaleDate: 84.1,
};

const costBasis = computeSaleCostBasis({
  grant,
  sale,
  fmvPerUnitAtVestInr: fmv.value,
  ay: 'AY2026-27',
});

console.log('Cost basis (INR):', costBasis.costBasisInr);
console.log('Sale proceeds (INR):', costBasis.saleProceedsInr);
console.log('Net gain (INR):', costBasis.netGainInr);
