/* Health and Education Cess. 4% of (tax + surcharge).
 * Applies uniformly across regimes and taxpayer kinds post Finance Act 2018 (renamed from Education Cess).
 */

import type { AssessmentYear, Citation } from './types/citation.js';
import type { ComputationResult } from './types/result.js';
import { ENGINE_VERSION } from './types/result.js';
import { SECTIONS } from './citations/sections.js';

export const HEALTH_EDUCATION_CESS_RATE = 0.04;

export type ComputeCessArgs = {
  readonly taxPlusSurcharge: number;
  readonly ay: AssessmentYear;
};

const CESS_CITATIONS: readonly Citation[] = [SECTIONS.SEC_2_12A];

export function computeCess({ taxPlusSurcharge, ay }: ComputeCessArgs): ComputationResult<number> {
  if (taxPlusSurcharge <= 0) {
    return {
      value: 0,
      steps: [
        {
          label: 'Health & Education Cess. No tax to cess',
          formula: '0',
          inputs: { taxPlusSurcharge },
          output: 0,
          citations: CESS_CITATIONS,
        },
      ],
      citations: CESS_CITATIONS,
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  const amount = Math.round(taxPlusSurcharge * HEALTH_EDUCATION_CESS_RATE);
  return {
    value: amount,
    steps: [
      {
        label: `Health & Education Cess @ ${HEALTH_EDUCATION_CESS_RATE * 100}%`,
        formula: `${taxPlusSurcharge} x ${HEALTH_EDUCATION_CESS_RATE} = ${amount}`,
        inputs: { taxPlusSurcharge, rate: HEALTH_EDUCATION_CESS_RATE },
        output: amount,
        citations: CESS_CITATIONS,
      },
    ],
    citations: CESS_CITATIONS,
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
