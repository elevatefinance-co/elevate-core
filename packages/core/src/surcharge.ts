/* Surcharge stacks. Individual/HUF/AOP/BOI/AJP:
 *   Old regime: 10% > Rs. 50L, 15% > Rs. 1Cr, 25% > Rs. 2Cr, 37% > Rs. 5Cr
 *   New regime (115BAC proviso): caps at 25% (no 37% tier)
 *
 * Firm/LLP: flat 12% > Rs. 1Cr. Domestic company (default): 7% > Rs. 1Cr, 12% > Rs. 10Cr.
 * Concessional company regimes (115BAA / 115BAB): flat 10%.
 */

import type { Citation } from './types/citation.js';
import type { ComputationResult } from './types/result.js';
import { ENGINE_VERSION } from './types/result.js';
import { SECTIONS } from './citations/sections.js';
import type { SupportedAssessmentYear } from './slabs/index.js';
import type { Regime } from './slabs/index.js';

export type SurchargeTier = {
  readonly incomeThreshold: number;
  readonly rate: number;
};

export const SURCHARGE_TIERS_INDIVIDUAL_OLD: readonly SurchargeTier[] = [
  { incomeThreshold: 50_000_000, rate: 0.37 },
  { incomeThreshold: 20_000_000, rate: 0.25 },
  { incomeThreshold: 10_000_000, rate: 0.15 },
  { incomeThreshold: 5_000_000, rate: 0.1 },
];

export const SURCHARGE_TIERS_INDIVIDUAL_NEW: readonly SurchargeTier[] = [
  { incomeThreshold: 20_000_000, rate: 0.25 },
  { incomeThreshold: 10_000_000, rate: 0.15 },
  { incomeThreshold: 5_000_000, rate: 0.1 },
];

export const SURCHARGE_TIERS_FIRM_LLP: readonly SurchargeTier[] = [
  { incomeThreshold: 10_000_000, rate: 0.12 },
];

export const SURCHARGE_TIERS_DOMESTIC_COMPANY: readonly SurchargeTier[] = [
  { incomeThreshold: 100_000_000, rate: 0.12 },
  { incomeThreshold: 10_000_000, rate: 0.07 },
];

export const SURCHARGE_RATE_COMPANY_CONCESSIONAL = 0.1;

export type SurchargeArgs = {
  readonly taxableIncome: number;
  readonly taxBeforeCess: number;
  readonly tiers: readonly SurchargeTier[];
  readonly ay: SupportedAssessmentYear;
  readonly citations?: readonly Citation[];
};

export function computeSurcharge({
  taxableIncome,
  taxBeforeCess,
  tiers,
  ay,
  citations = [],
}: SurchargeArgs): ComputationResult<number> {
  for (const tier of tiers) {
    if (taxableIncome > tier.incomeThreshold) {
      const amount = Math.round(taxBeforeCess * tier.rate);
      return {
        value: amount,
        steps: [
          {
            label: `Surcharge @ ${(tier.rate * 100).toFixed(0)}%. Income > Rs. ${tier.incomeThreshold.toLocaleString('en-IN')}`,
            formula: `${taxBeforeCess} x ${tier.rate} = ${amount}`,
            inputs: {
              taxableIncome,
              taxBeforeCess,
              tierThreshold: tier.incomeThreshold,
              tierRate: tier.rate,
            },
            output: amount,
            citations,
          },
        ],
        citations,
        ay,
        engineVersion: ENGINE_VERSION,
      };
    }
  }

  return {
    value: 0,
    steps: [
      {
        label: 'Surcharge. Below lowest threshold',
        formula: '0',
        inputs: { taxableIncome, taxBeforeCess },
        output: 0,
        citations,
      },
    ],
    citations,
    ay,
    engineVersion: ENGINE_VERSION,
  };
}

export function getIndividualSurchargeTiers(regime: Regime): readonly SurchargeTier[] {
  return regime === 'NEW' ? SURCHARGE_TIERS_INDIVIDUAL_NEW : SURCHARGE_TIERS_INDIVIDUAL_OLD;
}

export const SURCHARGE_CITATION = SECTIONS.SEC_2_12A;
