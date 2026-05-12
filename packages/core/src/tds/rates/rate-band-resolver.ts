/* The TDS rate-band resolver -- the central dispatcher every TDS computation goes through. Resolves the
 * applicable rate by (Section, deduction-date, deductor-type, deductee-type, PAN status) with
 * effective-date band versioning so a January 2024 deduction computes against the rates in force as of
 * January 2024, regardless of when the engine runs.
 *
 * Two cliffs dominate the band table. The Oct 2024 cliff (Finance (No. 2) Act 2024) -- multiple Sections
 * have a pre-Oct-2024 rate and a post-Oct-2024 rate. The Apr 2025 cliff (Finance Act 2025 threshold
 * rationalization, plus the FA (No. 2) 2024 changes that took effect on 1 April 2025: the 194D rate
 * reduction and the 194T introduction) -- thresholds for 193 / 194 / 194A / 194B / 194BB / 194D / 194H /
 * 194-I / 194J / 194K change and Sections 206AB / 206CCA are omitted, so the specified-person uplift only
 * applies to deduction dates before 1 April 2025. The resolver returns both the base rate and the
 * effective rate after applying any Section-206AA / 206AB / inoperative-PAN uplift, with the uplift reason
 * recorded for the audit trail. */

import type { Citation } from '../../types/citation.js';
import { FINANCE_ACTS_TDS } from '../citations/finance-acts.js';
import { ITA_SECTIONS } from '../citations/ita-sections.js';

export type TdsSectionKey =
  | 'S192'
  | 'S192A'
  | 'S193'
  | 'S194'
  | 'S194A'
  | 'S194B'
  | 'S194BA'
  | 'S194BB'
  | 'S194C_INDIVIDUAL_HUF'
  | 'S194C_OTHER'
  | 'S194D'
  | 'S194DA'
  | 'S194E'
  | 'S194EE'
  | 'S194F'
  | 'S194G'
  | 'S194H'
  | 'S194I_A'
  | 'S194I_B'
  | 'S194_IA'
  | 'S194_IB'
  | 'S194_IC'
  | 'S194J_PROFESSIONAL'
  | 'S194J_TECHNICAL'
  | 'S194J_ROYALTY'
  | 'S194K'
  | 'S194LA'
  | 'S194LB'
  | 'S194LC'
  | 'S194LD'
  | 'S194M'
  | 'S194N'
  | 'S194O'
  | 'S194Q'
  | 'S194R'
  | 'S194S'
  | 'S194T'
  | 'S196A'
  | 'S196B'
  | 'S196C'
  | 'S196D'
  | 'S206C_1F'
  | 'S206C_1H';

export type RateUpliftReason =
  | 'NONE'
  | 'NO_PAN_S206AA'
  | 'SPECIFIED_PERSON_S206AB'
  | 'PAN_INOPERATIVE'
  | 'TCS_NO_PAN_S206CC'
  | 'TCS_SPECIFIED_PERSON_S206CCA';

export type RateInput = {
  readonly section: TdsSectionKey;
  readonly deductionDate: Date;
  readonly panStatus: 'valid' | 'inoperative' | 'not_furnished';
  readonly isSpecifiedPerson: boolean;
};

export type RateResolution = {
  readonly baseRateBasisPoints: number;
  readonly effectiveRateBasisPoints: number;
  readonly upliftReason: RateUpliftReason;
  readonly upliftFactor: number;
  readonly citations: readonly Citation[];
  readonly notes?: string;
};

const OCT_2024_CLIFF_DATE = new Date('2024-10-01T00:00:00Z');
const APR_2025_CLIFF_DATE = new Date('2025-04-01T00:00:00Z');
const JUL_2021_S194Q_DATE = new Date('2021-07-01T00:00:00Z');
const JUL_2022_S194R_S194S_DATE = new Date('2022-07-01T00:00:00Z');
const APR_2023_S194BA_DATE = new Date('2023-04-01T00:00:00Z');
const OCT_2024_S194F_REPEAL_DATE = new Date('2024-10-01T00:00:00Z');

const S206AB_CARVE_OUTS: ReadonlySet<TdsSectionKey> = new Set([
  'S192',
  'S192A',
  'S194B',
  'S194BB',
  'S194N',
]);

function resolveBaseRate(input: RateInput): {
  rate: number;
  citations: readonly Citation[];
  notes?: string;
} {
  const { section, deductionDate } = input;

  switch (section) {
    case 'S192':
      return {
        rate: 0,
        citations: [ITA_SECTIONS.SEC_192],
        notes: 'Salary -- compute via slab engine; sentinel rate 0 returned',
      };
    case 'S192A':
      return { rate: 1000, citations: [ITA_SECTIONS.SEC_192A] };
    case 'S193':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 1000, citations: [ITA_SECTIONS.SEC_193] };
      }
      return {
        rate: 1000,
        citations: [ITA_SECTIONS.SEC_193, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_193],
        notes: 'Threshold Rs 10,000 per FY from 1 April 2025 (previously Nil)',
      };
    case 'S194':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 1000, citations: [ITA_SECTIONS.SEC_194] };
      }
      return {
        rate: 1000,
        citations: [ITA_SECTIONS.SEC_194, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194],
        notes:
          'Threshold Rs 10,000 per FY from 1 April 2025 (previously Rs 5,000) -- individual shareholder, non-cash modes',
      };
    case 'S194A':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 1000, citations: [ITA_SECTIONS.SEC_194A] };
      }
      return {
        rate: 1000,
        citations: [ITA_SECTIONS.SEC_194A, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194A],
        notes:
          'Thresholds from 1 April 2025 -- Rs 1,00,000 senior citizen / Rs 50,000 others for bank, co-operative bank and post office payers, Rs 10,000 for other payers (previously Rs 50,000 / Rs 40,000 / Rs 5,000)',
      };
    case 'S194B':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 3000, citations: [ITA_SECTIONS.SEC_194B] };
      }
      return {
        rate: 3000,
        citations: [ITA_SECTIONS.SEC_194B, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194B],
        notes:
          'Threshold Rs 10,000 per single transaction from 1 April 2025 (previously Rs 10,000 aggregate per FY)',
      };
    case 'S194BA':
      if (deductionDate < APR_2023_S194BA_DATE) {
        return {
          rate: 0,
          citations: [ITA_SECTIONS.SEC_194BA],
          notes: 'Section 194BA not yet in force; pre-1-April-2023 deductions fall back to 194B',
        };
      }
      return {
        rate: 3000,
        citations: [ITA_SECTIONS.SEC_194BA, FINANCE_ACTS_TDS.FA_2023_S194BA],
      };
    case 'S194BB':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 3000, citations: [ITA_SECTIONS.SEC_194BB] };
      }
      return {
        rate: 3000,
        citations: [ITA_SECTIONS.SEC_194BB, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194BB],
        notes:
          'Threshold Rs 10,000 per single transaction from 1 April 2025 (previously Rs 10,000 aggregate per FY)',
      };
    case 'S194C_INDIVIDUAL_HUF':
      return { rate: 100, citations: [ITA_SECTIONS.SEC_194C] };
    case 'S194C_OTHER':
      return { rate: 200, citations: [ITA_SECTIONS.SEC_194C] };
    case 'S194D':
      /* Unlike 194DA / 194G / 194H / 194-IB / 194M / 194O (Oct 2024 cliff), the FA (No. 2) 2024
       * reduction for 194D took effect on 1 April 2025. */
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 500, citations: [ITA_SECTIONS.SEC_194D] };
      }
      return {
        rate: 200,
        citations: [
          ITA_SECTIONS.SEC_194D,
          FINANCE_ACTS_TDS.FA_2024_S194D_REDUCTION,
          FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194D,
        ],
        notes: 'Threshold Rs 20,000 per FY from 1 April 2025 (previously Rs 15,000)',
      };
    case 'S194DA':
      if (deductionDate < OCT_2024_CLIFF_DATE) {
        return { rate: 500, citations: [ITA_SECTIONS.SEC_194DA] };
      }
      return {
        rate: 200,
        citations: [ITA_SECTIONS.SEC_194DA, FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194DA],
      };
    case 'S194E':
      return { rate: 2000, citations: [ITA_SECTIONS.SEC_194E] };
    case 'S194EE':
      return { rate: 1000, citations: [ITA_SECTIONS.SEC_194EE] };
    case 'S194F':
      if (deductionDate < OCT_2024_S194F_REPEAL_DATE) {
        return { rate: 2000, citations: [ITA_SECTIONS.SEC_194F] };
      }
      return {
        rate: 0,
        citations: [ITA_SECTIONS.SEC_194F, FINANCE_ACTS_TDS.FA_2024_S194F_REPEAL],
        notes: 'Section 194F repealed effective 1 October 2024 -- no TDS applicable',
      };
    case 'S194G':
      if (deductionDate < OCT_2024_CLIFF_DATE) {
        return { rate: 500, citations: [ITA_SECTIONS.SEC_194G] };
      }
      return {
        rate: 200,
        citations: [ITA_SECTIONS.SEC_194G, FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194G],
      };
    case 'S194H':
      if (deductionDate < OCT_2024_CLIFF_DATE) {
        return { rate: 500, citations: [ITA_SECTIONS.SEC_194H] };
      }
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return {
          rate: 200,
          citations: [ITA_SECTIONS.SEC_194H, FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194H],
        };
      }
      return {
        rate: 200,
        citations: [
          ITA_SECTIONS.SEC_194H,
          FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194H,
          FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194H,
        ],
        notes: 'Threshold Rs 20,000 per FY from 1 April 2025 (previously Rs 15,000)',
      };
    case 'S194I_A':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 200, citations: [ITA_SECTIONS.SEC_194I_A] };
      }
      return {
        rate: 200,
        citations: [ITA_SECTIONS.SEC_194I_A, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194I],
        notes:
          'Threshold Rs 50,000 per month or part of a month from 1 April 2025 (previously Rs 2,40,000 per FY)',
      };
    case 'S194I_B':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 1000, citations: [ITA_SECTIONS.SEC_194I_B] };
      }
      return {
        rate: 1000,
        citations: [ITA_SECTIONS.SEC_194I_B, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194I],
        notes:
          'Threshold Rs 50,000 per month or part of a month from 1 April 2025 (previously Rs 2,40,000 per FY)',
      };
    case 'S194_IA':
      return { rate: 100, citations: [ITA_SECTIONS.SEC_194_IA] };
    case 'S194_IB':
      if (deductionDate < OCT_2024_CLIFF_DATE) {
        return { rate: 500, citations: [ITA_SECTIONS.SEC_194_IB] };
      }
      return {
        rate: 200,
        citations: [ITA_SECTIONS.SEC_194_IB, FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194_IB],
      };
    case 'S194_IC':
      return { rate: 1000, citations: [ITA_SECTIONS.SEC_194_IC] };
    case 'S194J_PROFESSIONAL':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 1000, citations: [ITA_SECTIONS.SEC_194J] };
      }
      return {
        rate: 1000,
        citations: [ITA_SECTIONS.SEC_194J, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194J],
        notes:
          'Threshold Rs 50,000 per nature of payment per FY from 1 April 2025 (previously Rs 30,000)',
      };
    case 'S194J_TECHNICAL':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 200, citations: [ITA_SECTIONS.SEC_194J] };
      }
      return {
        rate: 200,
        citations: [ITA_SECTIONS.SEC_194J, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194J],
        notes:
          'Threshold Rs 50,000 per nature of payment per FY from 1 April 2025 (previously Rs 30,000)',
      };
    case 'S194J_ROYALTY':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 1000, citations: [ITA_SECTIONS.SEC_194J] };
      }
      return {
        rate: 1000,
        citations: [ITA_SECTIONS.SEC_194J, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194J],
        notes:
          'Threshold Rs 50,000 per nature of payment per FY from 1 April 2025 (previously Rs 30,000)',
      };
    case 'S194K':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return { rate: 1000, citations: [ITA_SECTIONS.SEC_194K] };
      }
      return {
        rate: 1000,
        citations: [ITA_SECTIONS.SEC_194K, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194K],
        notes: 'Threshold Rs 10,000 per FY from 1 April 2025 (previously Rs 5,000)',
      };
    case 'S194LA':
      return { rate: 1000, citations: [ITA_SECTIONS.SEC_194LA] };
    case 'S194LB':
      return { rate: 500, citations: [ITA_SECTIONS.SEC_194LB] };
    case 'S194LC':
      return { rate: 500, citations: [ITA_SECTIONS.SEC_194LC] };
    case 'S194LD':
      return { rate: 500, citations: [ITA_SECTIONS.SEC_194LD] };
    case 'S194M':
      if (deductionDate < OCT_2024_CLIFF_DATE) {
        return { rate: 500, citations: [ITA_SECTIONS.SEC_194M] };
      }
      return {
        rate: 200,
        citations: [ITA_SECTIONS.SEC_194M, FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194M],
      };
    case 'S194N':
      return { rate: 200, citations: [ITA_SECTIONS.SEC_194N] };
    case 'S194O':
      if (deductionDate < OCT_2024_CLIFF_DATE) {
        return { rate: 100, citations: [ITA_SECTIONS.SEC_194O] };
      }
      return {
        rate: 10,
        citations: [ITA_SECTIONS.SEC_194O, FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194O],
      };
    case 'S194Q':
      if (deductionDate < JUL_2021_S194Q_DATE) {
        return {
          rate: 0,
          citations: [ITA_SECTIONS.SEC_194Q],
          notes: 'Section 194Q not yet in force; pre-1-July-2021 transactions are not subject',
        };
      }
      return {
        rate: 10,
        citations: [ITA_SECTIONS.SEC_194Q, FINANCE_ACTS_TDS.FA_2021_S194Q],
      };
    case 'S194R':
      if (deductionDate < JUL_2022_S194R_S194S_DATE) {
        return {
          rate: 0,
          citations: [ITA_SECTIONS.SEC_194R],
          notes: 'Section 194R not yet in force; pre-1-July-2022 perquisites are not subject',
        };
      }
      return {
        rate: 1000,
        citations: [ITA_SECTIONS.SEC_194R, FINANCE_ACTS_TDS.FA_2022_S194R],
      };
    case 'S194S':
      if (deductionDate < JUL_2022_S194R_S194S_DATE) {
        return {
          rate: 0,
          citations: [ITA_SECTIONS.SEC_194S],
          notes: 'Section 194S not yet in force; pre-1-July-2022 VDA transfers are not subject',
        };
      }
      return {
        rate: 100,
        citations: [ITA_SECTIONS.SEC_194S, FINANCE_ACTS_TDS.FA_2022_S194S],
      };
    case 'S194T':
      if (deductionDate < APR_2025_CLIFF_DATE) {
        return {
          rate: 0,
          citations: [ITA_SECTIONS.SEC_194T],
          notes:
            'Section 194T not yet in force; pre-1-April-2025 partner remuneration is not subject',
        };
      }
      return {
        rate: 1000,
        citations: [ITA_SECTIONS.SEC_194T, FINANCE_ACTS_TDS.FA_2024_S194T],
      };
    case 'S196A':
      return { rate: 2000, citations: [ITA_SECTIONS.SEC_196A] };
    case 'S196B':
      return { rate: 1000, citations: [ITA_SECTIONS.SEC_196B] };
    case 'S196C':
      return { rate: 1000, citations: [ITA_SECTIONS.SEC_196C] };
    case 'S196D':
      return { rate: 2000, citations: [ITA_SECTIONS.SEC_196D] };
    case 'S206C_1F':
      return { rate: 100, citations: [ITA_SECTIONS.SEC_206C_1F] };
    case 'S206C_1H':
      return { rate: 10, citations: [ITA_SECTIONS.SEC_206C_1H] };
  }
}

export function resolveRate(input: RateInput): RateResolution {
  const baseResolution = resolveBaseRate(input);
  const baseRate = baseResolution.rate;
  const baseCitations = baseResolution.citations;
  const baseNotes = baseResolution.notes;

  if (input.panStatus === 'not_furnished') {
    const candidate = Math.max(baseRate * 2, 2000);
    return {
      baseRateBasisPoints: baseRate,
      effectiveRateBasisPoints: candidate,
      upliftReason: 'NO_PAN_S206AA',
      upliftFactor: candidate / Math.max(baseRate, 1),
      citations: [...baseCitations, ITA_SECTIONS.SEC_206AA],
      notes: baseNotes
        ? `${baseNotes}; 206AA uplift applied`
        : '206AA uplift applied -- no PAN furnished',
    };
  }

  if (input.panStatus === 'inoperative') {
    const candidate = Math.max(baseRate * 2, 2000);
    return {
      baseRateBasisPoints: baseRate,
      effectiveRateBasisPoints: candidate,
      upliftReason: 'PAN_INOPERATIVE',
      upliftFactor: candidate / Math.max(baseRate, 1),
      citations: [...baseCitations, ITA_SECTIONS.SEC_206AA],
      notes: baseNotes
        ? `${baseNotes}; inoperative-PAN uplift applied`
        : 'Inoperative-PAN uplift applied (treated as 206AA)',
    };
  }

  if (input.isSpecifiedPerson && !S206AB_CARVE_OUTS.has(input.section)) {
    if (isSection206ABOmittedForDeductionDate(input.deductionDate)) {
      return {
        baseRateBasisPoints: baseRate,
        effectiveRateBasisPoints: baseRate,
        upliftReason: 'NONE',
        upliftFactor: 1,
        citations: [
          ...baseCitations,
          ITA_SECTIONS.SEC_206AB,
          FINANCE_ACTS_TDS.FA_2025_S206AB_OMISSION,
        ],
        notes: baseNotes
          ? `${baseNotes}; Section 206AB omitted by the Finance Act 2025 w.e.f. 1 April 2025 -- no specified-person uplift`
          : 'Section 206AB omitted by the Finance Act 2025 w.e.f. 1 April 2025 -- no specified-person uplift',
      };
    }
    const candidate = Math.max(baseRate * 2, 500);
    return {
      baseRateBasisPoints: baseRate,
      effectiveRateBasisPoints: candidate,
      upliftReason: 'SPECIFIED_PERSON_S206AB',
      upliftFactor: candidate / Math.max(baseRate, 1),
      citations: [
        ...baseCitations,
        ITA_SECTIONS.SEC_206AB,
        FINANCE_ACTS_TDS.FA_2023_S206AB_CARVEOUT,
      ],
      notes: baseNotes
        ? `${baseNotes}; 206AB uplift applied (specified person)`
        : '206AB uplift applied -- specified person (non-filer)',
    };
  }

  return {
    baseRateBasisPoints: baseRate,
    effectiveRateBasisPoints: baseRate,
    upliftReason: 'NONE',
    upliftFactor: 1,
    citations: baseCitations,
    ...(baseNotes !== undefined ? { notes: baseNotes } : {}),
  };
}

export function isCarveOutFromS206AB(section: TdsSectionKey): boolean {
  return S206AB_CARVE_OUTS.has(section);
}

export function isSection206ABOmittedForDeductionDate(deductionDate: Date): boolean {
  return deductionDate >= APR_2025_CLIFF_DATE;
}
