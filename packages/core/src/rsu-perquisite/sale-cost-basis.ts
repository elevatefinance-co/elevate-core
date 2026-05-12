/* Cost basis for a later sale of RSU-granted shares. Section 49 and the Supreme Court's Bhojison
 * Infrastructure ruling (Civil Appeal 2024) together anchor the rule: the cost of acquisition for a
 * subsequent sale of RSU/ESOP-acquired shares is the FMV ON THE VEST / ALLOTMENT DATE, not the exercise
 * price. The exercise price has already been implicitly accounted for via the perquisite computation at
 * vest; on sale, we use FMV-at-vest as cost basis so the gain/loss is purely the movement AFTER vest.
 *
 * This gives the capital-gains engine the correct inputs:
 *
 *   holding_period  = sale_date - vest_date
 *   cost_basis_INR  = fmv_at_vest_per_unit_INR x units_sold
 *   sale_value_INR  = (sale_price_foreign x SBI_TTBR_on_sale) x units_sold - broker_commission
 *   gain/loss       = sale_value - cost_basis
 *
 * The gain then flows into 112A (listed equity LTCG/STCG) or 112 (unlisted), whichever applies. This module
 * does NOT classify the resulting gain; it only computes the cost basis + sale proceeds that the
 * capital-gains rules consume.
 *
 * For foreign-listed shares, BOTH the sale price AND the broker commission need to end up in INR. We accept
 * broker commission as INR-denominated because brokers report in USD and the caller has already applied
 * their preferred FX; the common case is to use the TTBR on the sale date for both, but we keep them
 * separately typed so a caller using actual bank realisation rates can. */

import { SECTIONS } from '../citations/index.js';
import type { AssessmentYear } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import type { RsuGrant, RsuSaleEvent } from './types.js';

export type ComputeSaleCostBasisArgs = {
  readonly grant: RsuGrant;
  readonly sale: RsuSaleEvent;
  readonly fmvPerUnitAtVestInr: number;
  readonly ay: AssessmentYear;
};

export type RsuSaleCostBasisResult = {
  readonly costBasisInr: number;
  readonly saleProceedsInr: number;
  readonly netGainInr: number;
};

export function computeSaleCostBasis({
  grant,
  sale,
  fmvPerUnitAtVestInr,
  ay,
}: ComputeSaleCostBasisArgs): ComputationResult<RsuSaleCostBasisResult> {
  const steps: ComputationStep[] = [];

  const costBasisInr = Math.round(fmvPerUnitAtVestInr * sale.unitsSold);

  steps.push({
    label: 'Cost of acquisition for sale. FMV at vest',
    formula: 'fmv_per_unit_at_vest_INR x units_sold',
    inputs: { fmvPerUnitAtVestInr, unitsSold: sale.unitsSold, costBasisInr },
    output: costBasisInr,
    citations: [SECTIONS.SEC_48, SECTIONS.SEC_17_2_vi],
  });

  const ttbrOnSale = sale.sbiTtbrOnSaleDate ?? 1;
  const saleValueGrossInr =
    grant.listingStatus === 'LISTED_FOREIGN_EXCHANGE'
      ? Math.round(sale.salePricePerUnitInOriginalCurrency * ttbrOnSale * sale.unitsSold)
      : Math.round(sale.salePricePerUnitInOriginalCurrency * sale.unitsSold);

  const brokerCommissionInr = sale.brokerCommissionInr ?? 0;
  const saleProceedsInr = Math.max(0, saleValueGrossInr - brokerCommissionInr);

  steps.push({
    label: 'Sale proceeds in INR',
    formula:
      grant.listingStatus === 'LISTED_FOREIGN_EXCHANGE'
        ? '(sale_price_foreign x SBI_TTBR_on_sale x units) - broker_commission'
        : '(sale_price x units) - broker_commission',
    inputs: {
      salePricePerUnitInOriginalCurrency: sale.salePricePerUnitInOriginalCurrency,
      ttbrOnSale,
      unitsSold: sale.unitsSold,
      saleValueGrossInr,
      brokerCommissionInr,
      saleProceedsInr,
    },
    output: saleProceedsInr,
    citations: [SECTIONS.SEC_48],
  });

  const netGainInr = saleProceedsInr - costBasisInr;

  steps.push({
    label: 'Net gain / loss from sale',
    formula: 'sale_proceeds_INR - cost_basis_INR',
    inputs: { saleProceedsInr, costBasisInr, netGainInr },
    output: netGainInr,
    citations: [SECTIONS.SEC_48],
  });

  return {
    value: { costBasisInr, saleProceedsInr, netGainInr },
    steps,
    citations: dedupeCitations(steps.flatMap((step) => step.citations)),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
