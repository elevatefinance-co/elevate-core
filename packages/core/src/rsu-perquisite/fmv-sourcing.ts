/* FMV sourcing rule dispatcher. Rule 3(8) and its sub-clauses. The perquisite value under Section 17(2)(vi)
 * depends on the FMV of the underlying share on the date of allotment / transfer (typically the vest /
 * exercise date for RSUs). How that FMV is determined varies by listing status:
 *
 *   - **Listed on Indian exchange** [Rule 3(8)(iii)(a)/(b)]:
 *     Average of opening and closing price on the recognised stock exchange on the allotment date. If not
 *     traded that day, the nearest earlier trading-day price.
 *
 *   - **Listed on foreign exchange** [Rule 3(8)(iii)(c)]:
 *     Closing price on the foreign exchange on the allotment date in the foreign currency x SBI TTBR
 *     (Telegraphic-Transfer Buy Rate) for that currency on the allotment date = INR FMV. The SBI TTBR is the
 *     statutory FX conversion source; the caller supplies it per vest event.
 *
 *   - **Unlisted** [Rule 3(9) read with Rule 11UA]:
 *     Merchant banker Category-I certified FMV. Caller supplies the INR-denominated valuation report figure.
 *
 * This module does not fetch FMV. It ROUTES the input the caller already has. Fetching live quotes is a
 * service concern (rsu-fmv-fetcher.service) that the app layer owns, not the pure rules package. */

import { RULES, SECTIONS, CIRCULARS } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import type { RsuGrant, RsuVestEvent } from './types.js';

export type SourceFmvArgs = {
  readonly grant: RsuGrant;
  readonly vest: RsuVestEvent;
  readonly ay: AssessmentYear;
};

export function sourceFmvPerUnitInr({ grant, vest, ay }: SourceFmvArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [RULES.RULE_3, RULES.RULE_3_8, SECTIONS.SEC_17_2_vi];

  switch (grant.listingStatus) {
    case 'LISTED_INDIAN_EXCHANGE': {
      const fmvInr = Math.round(vest.fmvPerUnitInOriginalCurrency);
      steps.push({
        label: 'FMV. Listed Indian exchange, Rule 3(8)(iii)(a)',
        formula: 'average(open, close) on vest date',
        inputs: {
          fmvPerUnitInOriginalCurrency: vest.fmvPerUnitInOriginalCurrency,
          originalCurrency: vest.originalCurrency,
          fmvInr,
        },
        output: fmvInr,
        citations: [RULES.RULE_3_8],
      });
      return {
        value: fmvInr,
        steps,
        citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
        ay,
        engineVersion: ENGINE_VERSION,
      };
    }

    case 'LISTED_FOREIGN_EXCHANGE': {
      const ttbr = vest.sbiTtbrOnVestDate;
      if (ttbr === undefined || ttbr <= 0) {
        steps.push({
          label: 'FMV. Foreign exchange listing REQUIRES SBI TTBR',
          formula: 'no SBI TTBR provided',
          inputs: {
            originalCurrency: vest.originalCurrency,
            fmvForeign: vest.fmvPerUnitInOriginalCurrency,
          },
          output: 0,
          citations: [RULES.RULE_3_8_iii_c, CIRCULARS.CBDT_CIRC_13_2022],
        });
        return {
          value: 0,
          steps,
          citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
          ay,
          engineVersion: ENGINE_VERSION,
        };
      }
      const fmvInr = Math.round(vest.fmvPerUnitInOriginalCurrency * ttbr);
      steps.push({
        label: 'FMV. Listed foreign exchange, Rule 3(8)(iii)(c)',
        formula: 'fmv_foreign x SBI_TTBR',
        inputs: {
          fmvForeign: vest.fmvPerUnitInOriginalCurrency,
          originalCurrency: vest.originalCurrency,
          sbiTtbrOnVestDate: ttbr,
          fmvInr,
        },
        output: fmvInr,
        citations: [RULES.RULE_3_8_iii_c, CIRCULARS.CBDT_CIRC_13_2022],
      });
      return {
        value: fmvInr,
        steps,
        citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
        ay,
        engineVersion: ENGINE_VERSION,
      };
    }

    case 'UNLISTED': {
      const fmvInr = Math.round(vest.merchantBankerFmvPerUnitInr ?? 0);
      steps.push({
        label: 'FMV. Unlisted, Rule 3(9) read with Rule 11UA',
        formula: 'merchant-banker Cat-I certified FMV in INR',
        inputs: {
          merchantBankerFmvPerUnitInr: vest.merchantBankerFmvPerUnitInr ?? 0,
          fmvInr,
        },
        output: fmvInr,
        citations: [RULES.RULE_3_9, RULES.RULE_11UA],
      });
      return {
        value: fmvInr,
        steps,
        citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
        ay,
        engineVersion: ENGINE_VERSION,
      };
    }
  }
}
