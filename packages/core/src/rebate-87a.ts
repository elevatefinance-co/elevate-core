/* Sec 87A rebate. Under the new regime the rebate was progressively expanded (Finance Act 2023: Rs. 7L,
 * Finance Act 2025: Rs. 12L). Under the old regime it has stayed at Rs. 5L / Rs. 12,500 max since FA 2019.
 *
 * Contract for every function in this module: taxBeforeRebate must be SLAB-RATE tax only. Finance Act
 * 2025 expressly bars the 87A rebate against special-rate income (Sec 111A / 112 / 112A capital gains)
 * from AY 2026-27, and this module cannot see the composition of the tax it receives, so the exclusion
 * is enforced by what callers pass. Compute special-rate tax separately and never include it here. */

import type { AssessmentYear, Citation } from './types/citation.js';
import type { ComputationResult } from './types/result.js';
import { ENGINE_VERSION } from './types/result.js';
import { SECTIONS } from './citations/sections.js';
import { FINANCE_ACTS } from './citations/finance-acts.js';
import type { Regime } from './slabs/index.js';
import type { SupportedAssessmentYear } from './slabs/index.js';

export type Rebate87AArgs = {
  readonly taxableIncome: number;
  readonly taxBeforeRebate: number;
  readonly regime: Regime;
  readonly ay: SupportedAssessmentYear;
};

type RebateConfig = {
  readonly incomeLimit: number;
  readonly maxRebate: number;
  readonly citations: readonly Citation[];
};

function getRebateConfig(ay: SupportedAssessmentYear, regime: Regime): RebateConfig {
  if (regime === 'OLD') {
    return {
      incomeLimit: 500_000,
      maxRebate: 12_500,
      citations: [SECTIONS.SEC_87A],
    };
  }

  if (ay === 'AY2026-27') {
    return {
      incomeLimit: 1_200_000,
      maxRebate: 60_000,
      citations: [SECTIONS.SEC_87A, FINANCE_ACTS.FA_2025],
    };
  }

  return {
    incomeLimit: 700_000,
    maxRebate: 25_000,
    citations: [SECTIONS.SEC_87A, FINANCE_ACTS.FA_2024],
  };
}

export function computeRebate87A({
  taxableIncome,
  taxBeforeRebate,
  regime,
  ay,
}: Rebate87AArgs): ComputationResult<number> {
  const rebateConfig = getRebateConfig(ay, regime);

  if (taxableIncome > rebateConfig.incomeLimit || taxBeforeRebate <= 0) {
    return {
      value: 0,
      steps: [
        {
          label: `Sec 87A rebate. Not eligible`,
          formula:
            taxableIncome > rebateConfig.incomeLimit
              ? `total income ${taxableIncome} > limit ${rebateConfig.incomeLimit}`
              : `tax before rebate is 0`,
          inputs: {
            taxableIncome,
            taxBeforeRebate,
            incomeLimit: rebateConfig.incomeLimit,
          },
          output: 0,
          citations: rebateConfig.citations,
        },
      ],
      citations: rebateConfig.citations,
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  const rebate = Math.min(taxBeforeRebate, rebateConfig.maxRebate);

  return {
    value: rebate,
    steps: [
      {
        label: `Sec 87A rebate. ${regime} regime, ${ay}`,
        formula: `min(taxBeforeRebate ${taxBeforeRebate}, maxRebate ${rebateConfig.maxRebate}) = ${rebate}`,
        inputs: {
          taxableIncome,
          taxBeforeRebate,
          incomeLimit: rebateConfig.incomeLimit,
          maxRebate: rebateConfig.maxRebate,
        },
        output: rebate,
        citations: rebateConfig.citations,
      },
    ],
    citations: rebateConfig.citations,
    ay,
    engineVersion: ENGINE_VERSION,
  };
}

/**
 * Sec 87A rebate with the first-proviso marginal relief (NEW regime only).
 *
 * At or below the income limit this behaves identically to computeRebate87A. Above the limit, the
 * first proviso to Sec 87A clause (b) caps tax payable at the amount by which total income exceeds
 * the limit, so the rebate covers the remainder:
 *
 *   rebate = max(0, taxBeforeRebate - (taxableIncome - incomeLimit))
 *
 * Marginal relief exists only under the new regime (introduced by Finance Act 2024 for the Rs. 7L
 * limit, carried forward by Finance Act 2025 for the Rs. 12L limit); old-regime calls delegate to
 * computeRebate87A unchanged.
 *
 * taxBeforeRebate must be SLAB-RATE tax only. Finance Act 2025 bars the 87A rebate against
 * special-rate income (Sec 111A / 112 / 112A) from AY 2026-27; the exclusion is enforced by what
 * callers pass, since this function cannot see the composition of the tax it receives.
 */
export function computeRebate87AWithMarginalRelief(
  rebateArgs: Rebate87AArgs,
): ComputationResult<number> {
  const { taxableIncome, taxBeforeRebate, ay, regime } = rebateArgs;
  const rebateConfig = getRebateConfig(ay, regime);

  if (regime === 'OLD' || taxableIncome <= rebateConfig.incomeLimit) {
    return computeRebate87A(rebateArgs);
  }

  const marginalReliefCitations: readonly Citation[] =
    ay === 'AY2026-27'
      ? [SECTIONS.SEC_87A, FINANCE_ACTS.FA_2024, FINANCE_ACTS.FA_2025]
      : [SECTIONS.SEC_87A, FINANCE_ACTS.FA_2024];

  const excessOverLimit = taxableIncome - rebateConfig.incomeLimit;
  /* excessOverLimit is strictly positive here, so the rebate is structurally below taxBeforeRebate;
   * the max(0, ...) floor is what stops it going negative past the break-even income. */
  const rebate = Math.max(0, taxBeforeRebate - excessOverLimit);
  const stepLabel =
    rebate > 0
      ? `Sec 87A marginal relief. NEW regime, ${ay}`
      : 'Sec 87A marginal relief. Beyond break-even, no relief';

  return {
    value: rebate,
    steps: [
      {
        label: stepLabel,
        formula: `max(0, taxBeforeRebate ${taxBeforeRebate} - (taxableIncome ${taxableIncome} - incomeLimit ${rebateConfig.incomeLimit})) = ${rebate}`,
        inputs: {
          taxableIncome,
          taxBeforeRebate,
          incomeLimit: rebateConfig.incomeLimit,
          excessOverLimit,
        },
        output: rebate,
        citations: marginalReliefCitations,
      },
    ],
    citations: marginalReliefCitations,
    ay,
    engineVersion: ENGINE_VERSION,
  };
}

export type AssessmentYearParam = AssessmentYear;
