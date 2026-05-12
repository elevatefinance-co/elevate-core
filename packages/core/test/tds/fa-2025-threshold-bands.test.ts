/* Finance Act 2025 threshold rationalization bands (effective 1 April 2025) and the FA (No. 2) 2024
 * Section 194D reduction that shares the same effective date.
 *
 * The resolver encodes rates; statutory thresholds surface through the citations bundle and the band
 * notes. This file pins, per Section, that the 1 April 2025 band attaches the FA 2025 threshold
 * citation and documents the new threshold (and, for 194B / 194BB single-transaction and 194-I
 * per-month, the changed aggregation basis) while leaving the rate untouched -- and that pre-band
 * deductions stay on the prior citations with no band notes.
 *
 * Verified values (incometaxindia.gov.in consolidated text + Finance Act 2025, checked 2026-06-12):
 *   193 Rs 10,000 (was Nil) | 194 Rs 10,000 (was 5,000) | 194A Rs 1,00,000 / 50,000 / 10,000
 *   194B + 194BB Rs 10,000 per single transaction (was aggregate per FY)
 *   194D Rs 20,000 (was 15,000) | 194H Rs 20,000 (was 15,000)
 *   194-I Rs 50,000 per month or part of month (was Rs 2,40,000 per FY)
 *   194J Rs 50,000 per nature of payment (was 30,000) | 194K Rs 10,000 (was 5,000)
 *
 * Also pins the Finance Act 2026 verification (assent 30 March 2026): no TDS rate or threshold
 * changes for FY 2026-27 -- a representative FY 2026-27 deduction resolves identically to the
 * post-FA-2025 band.
 */

import { resolveRate } from '../../src/tds/rates/rate-band-resolver.js';
import type { TdsSectionKey } from '../../src/tds/rates/rate-band-resolver.js';
import { ITA_SECTIONS } from '../../src/tds/citations/ita-sections.js';
import { FINANCE_ACTS_TDS } from '../../src/tds/citations/finance-acts.js';
import type { Citation } from '../../src/types/citation.js';

const LAST_INSTANT_BEFORE_BAND = new Date('2025-03-31T23:59:59Z');
const BAND_EFFECTIVE_INSTANT = new Date('2025-04-01T00:00:00Z');
const FY_2026_27_DEDUCTION = new Date('2026-06-01T00:00:00Z');

const SINGLE_TRANSACTION_NOTE =
  'Threshold Rs 10,000 per single transaction from 1 April 2025 (previously Rs 10,000 aggregate per FY)';
const RENT_PER_MONTH_NOTE =
  'Threshold Rs 50,000 per month or part of a month from 1 April 2025 (previously Rs 2,40,000 per FY)';
const S194J_NOTE =
  'Threshold Rs 50,000 per nature of payment per FY from 1 April 2025 (previously Rs 30,000)';

const THRESHOLD_BANDS: readonly {
  readonly section: TdsSectionKey;
  readonly rateBasisPoints: number;
  readonly preCitations: readonly Citation[];
  readonly postCitations: readonly Citation[];
  readonly bandNote: string;
}[] = [
  {
    section: 'S193',
    rateBasisPoints: 1000,
    preCitations: [ITA_SECTIONS.SEC_193],
    postCitations: [ITA_SECTIONS.SEC_193, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_193],
    bandNote: 'Threshold Rs 10,000 per FY from 1 April 2025 (previously Nil)',
  },
  {
    section: 'S194',
    rateBasisPoints: 1000,
    preCitations: [ITA_SECTIONS.SEC_194],
    postCitations: [ITA_SECTIONS.SEC_194, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194],
    bandNote:
      'Threshold Rs 10,000 per FY from 1 April 2025 (previously Rs 5,000) -- individual shareholder, non-cash modes',
  },
  {
    section: 'S194A',
    rateBasisPoints: 1000,
    preCitations: [ITA_SECTIONS.SEC_194A],
    postCitations: [ITA_SECTIONS.SEC_194A, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194A],
    bandNote:
      'Thresholds from 1 April 2025 -- Rs 1,00,000 senior citizen / Rs 50,000 others for bank, co-operative bank and post office payers, Rs 10,000 for other payers (previously Rs 50,000 / Rs 40,000 / Rs 5,000)',
  },
  {
    section: 'S194B',
    rateBasisPoints: 3000,
    preCitations: [ITA_SECTIONS.SEC_194B],
    postCitations: [ITA_SECTIONS.SEC_194B, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194B],
    bandNote: SINGLE_TRANSACTION_NOTE,
  },
  {
    section: 'S194BB',
    rateBasisPoints: 3000,
    preCitations: [ITA_SECTIONS.SEC_194BB],
    postCitations: [ITA_SECTIONS.SEC_194BB, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194BB],
    bandNote: SINGLE_TRANSACTION_NOTE,
  },
  {
    section: 'S194H',
    rateBasisPoints: 200,
    preCitations: [ITA_SECTIONS.SEC_194H, FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194H],
    postCitations: [
      ITA_SECTIONS.SEC_194H,
      FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194H,
      FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194H,
    ],
    bandNote: 'Threshold Rs 20,000 per FY from 1 April 2025 (previously Rs 15,000)',
  },
  {
    section: 'S194I_A',
    rateBasisPoints: 200,
    preCitations: [ITA_SECTIONS.SEC_194I_A],
    postCitations: [ITA_SECTIONS.SEC_194I_A, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194I],
    bandNote: RENT_PER_MONTH_NOTE,
  },
  {
    section: 'S194I_B',
    rateBasisPoints: 1000,
    preCitations: [ITA_SECTIONS.SEC_194I_B],
    postCitations: [ITA_SECTIONS.SEC_194I_B, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194I],
    bandNote: RENT_PER_MONTH_NOTE,
  },
  {
    section: 'S194J_PROFESSIONAL',
    rateBasisPoints: 1000,
    preCitations: [ITA_SECTIONS.SEC_194J],
    postCitations: [ITA_SECTIONS.SEC_194J, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194J],
    bandNote: S194J_NOTE,
  },
  {
    section: 'S194J_TECHNICAL',
    rateBasisPoints: 200,
    preCitations: [ITA_SECTIONS.SEC_194J],
    postCitations: [ITA_SECTIONS.SEC_194J, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194J],
    bandNote: S194J_NOTE,
  },
  {
    section: 'S194J_ROYALTY',
    rateBasisPoints: 1000,
    preCitations: [ITA_SECTIONS.SEC_194J],
    postCitations: [ITA_SECTIONS.SEC_194J, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194J],
    bandNote: S194J_NOTE,
  },
  {
    section: 'S194K',
    rateBasisPoints: 1000,
    preCitations: [ITA_SECTIONS.SEC_194K],
    postCitations: [ITA_SECTIONS.SEC_194K, FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194K],
    bandNote: 'Threshold Rs 10,000 per FY from 1 April 2025 (previously Rs 5,000)',
  },
];

describe('FA 2025 threshold bands -- rate unchanged, citation + band note attach from 1 April 2025', () => {
  for (const expectation of THRESHOLD_BANDS) {
    it(`${expectation.section}: 31 March 2025 deduction keeps prior citations and carries no band notes`, () => {
      const result = resolveRate({
        section: expectation.section,
        deductionDate: LAST_INSTANT_BEFORE_BAND,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      expect(result.baseRateBasisPoints).toBe(expectation.rateBasisPoints);
      expect(result.effectiveRateBasisPoints).toBe(expectation.rateBasisPoints);
      expect(result.citations).toEqual(expectation.preCitations);
      expect('notes' in result).toBe(false);
    });

    it(`${expectation.section}: 1 April 2025 deduction adds the FA 2025 citation and the threshold band note`, () => {
      const result = resolveRate({
        section: expectation.section,
        deductionDate: BAND_EFFECTIVE_INSTANT,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      expect(result.baseRateBasisPoints).toBe(expectation.rateBasisPoints);
      expect(result.effectiveRateBasisPoints).toBe(expectation.rateBasisPoints);
      expect(result.citations).toEqual(expectation.postCitations);
      expect(result.notes).toBe(expectation.bandNote);
    });
  }
});

describe('FA (No. 2) 2024 Section 194D reduction -- effective 1 April 2025, alongside the FA 2025 threshold', () => {
  it('31 March 2025 deduction stays at 5 percent citing SEC_194D only', () => {
    const result = resolveRate({
      section: 'S194D',
      deductionDate: LAST_INSTANT_BEFORE_BAND,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(500);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194D]);
    expect('notes' in result).toBe(false);
  });

  it('1 April 2025 deduction drops to 2 percent with the reduction + threshold citations and band note', () => {
    const result = resolveRate({
      section: 'S194D',
      deductionDate: BAND_EFFECTIVE_INSTANT,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(200);
    expect(result.effectiveRateBasisPoints).toBe(200);
    expect(result.citations).toEqual([
      ITA_SECTIONS.SEC_194D,
      FINANCE_ACTS_TDS.FA_2024_S194D_REDUCTION,
      FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194D,
    ]);
    expect(result.notes).toBe(
      'Threshold Rs 20,000 per FY from 1 April 2025 (previously Rs 15,000)',
    );
  });
});

describe('FA 2026 regression guard -- no TDS rate or threshold changes for FY 2026-27', () => {
  const everySection: readonly TdsSectionKey[] = [
    'S192',
    'S192A',
    'S193',
    'S194',
    'S194A',
    'S194B',
    'S194BA',
    'S194BB',
    'S194C_INDIVIDUAL_HUF',
    'S194C_OTHER',
    'S194D',
    'S194DA',
    'S194E',
    'S194EE',
    'S194F',
    'S194G',
    'S194H',
    'S194I_A',
    'S194I_B',
    'S194_IA',
    'S194_IB',
    'S194_IC',
    'S194J_PROFESSIONAL',
    'S194J_TECHNICAL',
    'S194J_ROYALTY',
    'S194K',
    'S194LA',
    'S194LB',
    'S194LC',
    'S194LD',
    'S194M',
    'S194N',
    'S194O',
    'S194Q',
    'S194R',
    'S194S',
    'S194T',
    'S196A',
    'S196B',
    'S196C',
    'S196D',
    'S206C_1F',
    'S206C_1H',
  ];

  for (const section of everySection) {
    it(`${section}: an FY 2026-27 deduction resolves identically to the post-FA-2025 band`, () => {
      const postFa2025 = resolveRate({
        section,
        deductionDate: BAND_EFFECTIVE_INSTANT,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      const fy2026Deduction = resolveRate({
        section,
        deductionDate: FY_2026_27_DEDUCTION,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      expect(fy2026Deduction).toEqual(postFa2025);
    });
  }

  it('representative FY 2026-27 base rates pin the post-FA-2025 absolute values', () => {
    const expectedRates: readonly { section: TdsSectionKey; rateBasisPoints: number }[] = [
      { section: 'S193', rateBasisPoints: 1000 },
      { section: 'S194', rateBasisPoints: 1000 },
      { section: 'S194A', rateBasisPoints: 1000 },
      { section: 'S194B', rateBasisPoints: 3000 },
      { section: 'S194D', rateBasisPoints: 200 },
      { section: 'S194H', rateBasisPoints: 200 },
      { section: 'S194I_B', rateBasisPoints: 1000 },
      { section: 'S194J_PROFESSIONAL', rateBasisPoints: 1000 },
      { section: 'S194K', rateBasisPoints: 1000 },
      { section: 'S194O', rateBasisPoints: 10 },
      { section: 'S194Q', rateBasisPoints: 10 },
      { section: 'S194T', rateBasisPoints: 1000 },
    ];
    for (const { section, rateBasisPoints } of expectedRates) {
      const result = resolveRate({
        section,
        deductionDate: FY_2026_27_DEDUCTION,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      expect(result.baseRateBasisPoints, section).toBe(rateBasisPoints);
    }
  });

  it('FY 2026-27 uplift behaviour matches post-FA-2025 law -- 206AA applies, 206AB does not', () => {
    const noPan = resolveRate({
      section: 'S194A',
      deductionDate: FY_2026_27_DEDUCTION,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    const specifiedPerson = resolveRate({
      section: 'S194A',
      deductionDate: FY_2026_27_DEDUCTION,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(noPan.upliftReason).toBe('NO_PAN_S206AA');
    expect(noPan.effectiveRateBasisPoints).toBe(2000);
    expect(specifiedPerson.upliftReason).toBe('NONE');
    expect(specifiedPerson.effectiveRateBasisPoints).toBe(1000);
  });
});
