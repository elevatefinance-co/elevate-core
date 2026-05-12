/* Surcharge stacks. Individual/HUF/AOP/BOI/AJP:
 *   Old regime: 10% > Rs. 50L, 15% > Rs. 1Cr, 25% > Rs. 2Cr, 37% > Rs. 5Cr
 *   New regime (115BAC proviso): caps at 25% (no 37% tier)
 *
 * Firm/LLP: flat 12% > Rs. 1Cr. Domestic company (default): 7% > Rs. 1Cr, 12% > Rs. 10Cr.
 * Concessional company regimes (115BAA / 115BAB): flat 10%.
 */

import type { Citation } from './types/citation.js';
import { dedupeCitations } from './types/citation.js';
import type { ComputationResult, ComputationStep } from './types/result.js';
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

export type SurchargeWithMarginalReliefArgs = {
  readonly taxableIncome: number;
  readonly taxBeforeCess: number;
  readonly taxAtThreshold: number;
  readonly tiers: readonly SurchargeTier[];
  readonly ay: SupportedAssessmentYear;
  readonly citations?: readonly Citation[];
};

/**
 * Surcharge with marginal relief at each tier threshold.
 *
 * Marginal relief (Finance Act surcharge schedule): the total of tax plus surcharge cannot exceed
 * the tax computed at exactly the breached threshold income plus the amount by which income exceeds
 * that threshold:
 *
 *   surcharge <= taxAtThreshold + (taxableIncome - tierThreshold) - taxBeforeCess
 *
 * taxAtThreshold is supplied by the caller to keep this function pure and slab-agnostic. For tiers
 * above the lowest, the statutory comparator at the threshold already includes the surcharge
 * applicable at that threshold income; callers must fold it into taxAtThreshold.
 */
export function computeSurchargeWithMarginalRelief({
  taxableIncome,
  taxBeforeCess,
  taxAtThreshold,
  tiers,
  ay,
  citations = [],
}: SurchargeWithMarginalReliefArgs): ComputationResult<number> {
  for (const tier of tiers) {
    if (taxableIncome > tier.incomeThreshold) {
      const rawSurcharge = Math.round(taxBeforeCess * tier.rate);
      const incomeOverThreshold = taxableIncome - tier.incomeThreshold;
      const surchargeCap = Math.max(0, taxAtThreshold + incomeOverThreshold - taxBeforeCess);
      const surcharge = Math.min(rawSurcharge, surchargeCap);

      const steps: ComputationStep[] = [
        {
          label: `Surcharge @ ${(tier.rate * 100).toFixed(0)}%. Income > Rs. ${tier.incomeThreshold.toLocaleString('en-IN')}`,
          formula: `${taxBeforeCess} x ${tier.rate} = ${rawSurcharge}`,
          inputs: {
            taxableIncome,
            taxBeforeCess,
            tierThreshold: tier.incomeThreshold,
            tierRate: tier.rate,
          },
          output: rawSurcharge,
          citations,
        },
      ];

      if (surcharge < rawSurcharge) {
        steps.push({
          label: 'Surcharge marginal relief. Cap binds',
          formula: `min(rawSurcharge ${rawSurcharge}, taxAtThreshold ${taxAtThreshold} + incomeOverThreshold ${incomeOverThreshold} - taxBeforeCess ${taxBeforeCess}) = ${surcharge}`,
          inputs: {
            rawSurcharge,
            taxAtThreshold,
            incomeOverThreshold,
            taxBeforeCess,
            surchargeCap,
          },
          output: surcharge,
          citations,
        });
      }

      return {
        value: surcharge,
        steps,
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

export const SPECIAL_INCOME_SURCHARGE_RATE_CAP = 0.15;

/* Finance Act surcharge schedule: the enhanced 25% / 37% surcharge is not levied on tax chargeable
 * under Sec 111A, 112, 112A or on dividend income, so the surcharge rate on that portion of the tax
 * caps at 15% regardless of the slab tier the total income lands in. */
export const SPECIAL_INCOME_SURCHARGE_CITATIONS: readonly Citation[] = [
  SECTIONS.SEC_111A,
  SECTIONS.SEC_112,
  SECTIONS.SEC_112A,
  SECTIONS.SEC_2_22,
];

export type SurchargeCappedForSpecialIncomeArgs = {
  readonly taxableIncome: number;
  readonly regularTaxPortion: number;
  readonly specialTaxPortion: number;
  readonly tiers: readonly SurchargeTier[];
  readonly ay: SupportedAssessmentYear;
  readonly citations?: readonly Citation[];
};

/**
 * Surcharge split between regular-rate tax and special-rate tax (Sec 111A / 112 / 112A / dividend).
 *
 * The tier is selected on total taxable income. The regular portion bears the full tier rate; the
 * special portion bears min(tierRate, 15%) because the enhanced 25% / 37% surcharge is never levied
 * on tax on those incomes. Callers split taxBeforeCess into the two portions; this function cannot
 * derive the split itself.
 */
export function computeSurchargeCappedForSpecialIncome({
  taxableIncome,
  regularTaxPortion,
  specialTaxPortion,
  tiers,
  ay,
  citations = [],
}: SurchargeCappedForSpecialIncomeArgs): ComputationResult<number> {
  const combinedCitations = dedupeCitations([...citations, ...SPECIAL_INCOME_SURCHARGE_CITATIONS]);

  for (const tier of tiers) {
    if (taxableIncome > tier.incomeThreshold) {
      const regularSurcharge = Math.round(regularTaxPortion * tier.rate);
      const specialRate = Math.min(tier.rate, SPECIAL_INCOME_SURCHARGE_RATE_CAP);
      const specialSurcharge = Math.round(specialTaxPortion * specialRate);
      const totalSurcharge = regularSurcharge + specialSurcharge;
      const specialStepLabel =
        specialRate < tier.rate
          ? 'Surcharge on Sec 111A / 112 / 112A / dividend tax. Capped @ 15%'
          : `Surcharge @ ${(specialRate * 100).toFixed(0)}% on Sec 111A / 112 / 112A / dividend tax`;

      return {
        value: totalSurcharge,
        steps: [
          {
            label: `Surcharge @ ${(tier.rate * 100).toFixed(0)}% on regular-income tax. Income > Rs. ${tier.incomeThreshold.toLocaleString('en-IN')}`,
            formula: `${regularTaxPortion} x ${tier.rate} = ${regularSurcharge}`,
            inputs: {
              taxableIncome,
              regularTaxPortion,
              tierThreshold: tier.incomeThreshold,
              tierRate: tier.rate,
            },
            output: regularSurcharge,
            citations: combinedCitations,
          },
          {
            label: specialStepLabel,
            formula: `${specialTaxPortion} x min(tierRate ${tier.rate}, cap ${SPECIAL_INCOME_SURCHARGE_RATE_CAP}) = ${specialSurcharge}`,
            inputs: {
              specialTaxPortion,
              tierRate: tier.rate,
              specialRateCap: SPECIAL_INCOME_SURCHARGE_RATE_CAP,
              specialRate,
            },
            output: specialSurcharge,
            citations: combinedCitations,
          },
          {
            label: 'Total surcharge',
            formula: `${regularSurcharge} + ${specialSurcharge} = ${totalSurcharge}`,
            inputs: { regularSurcharge, specialSurcharge },
            output: totalSurcharge,
            citations: combinedCitations,
          },
        ],
        citations: combinedCitations,
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
        inputs: { taxableIncome, regularTaxPortion, specialTaxPortion },
        output: 0,
        citations: combinedCitations,
      },
    ],
    citations: combinedCitations,
    ay,
    engineVersion: ENGINE_VERSION,
  };
}

export function getIndividualSurchargeTiers(regime: Regime): readonly SurchargeTier[] {
  return regime === 'NEW' ? SURCHARGE_TIERS_INDIVIDUAL_NEW : SURCHARGE_TIERS_INDIVIDUAL_OLD;
}

export const SURCHARGE_CITATION = SECTIONS.SEC_2_12A;
