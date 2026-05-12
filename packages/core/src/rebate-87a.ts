/* Sec 87A rebate. Under the new regime the rebate was progressively expanded (Finance Act 2023: Rs. 7L,
 * Finance Act 2025: Rs. 12L). Under the old regime it has stayed at Rs. 5L / Rs. 12,500 max since FA 2019. */

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

export type AssessmentYearParam = AssessmentYear;
