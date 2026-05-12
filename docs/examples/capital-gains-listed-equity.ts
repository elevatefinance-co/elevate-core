/* LTCG 112A on listed equity,
 * with transactions spanning the 23-Jul-2024 split-date introduced by Finance Act 2024.
 *
 * The library partitions the input transactions by sale date and applies the right rate to each partition.
 * The consolidated Rs. 1.25 lakh exemption pool is shared across both partitions.
 *
 * Pre-23-Jul-2024 sales: 10% on gains beyond exemption. Post-23-Jul-2024 sales:
 * 12.5% on gains beyond exemption.
 *
 * Run with: pnpm tsx docs/examples/capital-gains-listed-equity.ts
 */

import { computeLtcg112A } from '@elevatefinance-co/india-tax-rules';

const result = computeLtcg112A({
  ay: 'AY2025-26',
  transactions: [
    {
      saleDate: '2024-07-15',
      saleProceeds: 800_000,
      acquisitionCost: 300_000,
      acquisitionDate: '2022-04-15',
      isin: 'INE002A01018',
    },
    {
      saleDate: '2024-08-15',
      saleProceeds: 600_000,
      acquisitionCost: 200_000,
      acquisitionDate: '2022-04-15',
      isin: 'INE002A01018',
    },
  ],
});

console.log(JSON.stringify(result, null, 2));
