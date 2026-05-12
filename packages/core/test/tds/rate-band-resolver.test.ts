/* Tests for the TDS rate-band resolver -- the central dispatcher. Verifies per-Section base rates,
 * the Oct 2024 cliff transitions,
 * the Section-introduction effective-date guards (194Q from 1 July 2021, 194R/S from 1 July 2022,
 * 194BA from 1 April 2023, 194T from 1 April 2025, 194F repeal from 1 October 2024),
 * and the 206AA / 206AB / inoperative-PAN uplift logic.
 */

import { resolveRate, isCarveOutFromS206AB } from '../../src/tds/rates/rate-band-resolver.js';
import { ITA_SECTIONS } from '../../src/tds/citations/ita-sections.js';
import { FINANCE_ACTS_TDS } from '../../src/tds/citations/finance-acts.js';

const POST_OCT_2024 = new Date('2024-10-15T00:00:00Z');
const PRE_OCT_2024 = new Date('2024-09-15T00:00:00Z');
const POST_APR_2025 = new Date('2025-04-15T00:00:00Z');
const POST_JUL_2021 = new Date('2022-01-15T00:00:00Z');
const PRE_JUL_2021 = new Date('2021-06-15T00:00:00Z');

describe('resolveRate -- foundational sections', () => {
  it('194A interest -- 10 percent (1000 bp)', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.effectiveRateBasisPoints).toBe(1000);
    expect(result.upliftReason).toBe('NONE');
  });

  it('194C individual / HUF -- 1 percent (100 bp)', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(100);
  });

  it('194C other -- 2 percent (200 bp)', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(200);
  });

  it('194B lottery -- 30 percent (3000 bp)', () => {
    const result = resolveRate({
      section: 'S194B',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(3000);
  });
});

describe('resolveRate -- Oct 2024 cliff', () => {
  it('194D pre-Oct-2024 is 5 percent', () => {
    const result = resolveRate({
      section: 'S194D',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(500);
  });

  it('194D stays 5 percent after the Oct 2024 cliff (FA (No. 2) 2024 reduction takes effect 1 April 2025)', () => {
    const result = resolveRate({
      section: 'S194D',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(500);
  });

  it('194D from 1 April 2025 is 2 percent', () => {
    const result = resolveRate({
      section: 'S194D',
      deductionDate: POST_APR_2025,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(200);
  });

  it('194H pre-Oct-2024 is 5 percent', () => {
    const result = resolveRate({
      section: 'S194H',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(500);
  });

  it('194H post-Oct-2024 is 2 percent', () => {
    const result = resolveRate({
      section: 'S194H',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(200);
  });

  it('194O pre-Oct-2024 is 1 percent', () => {
    const result = resolveRate({
      section: 'S194O',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(100);
  });

  it('194O post-Oct-2024 is 0.1 percent (10 bp)', () => {
    const result = resolveRate({
      section: 'S194O',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(10);
  });

  it('194-IB / 194M / 194G / 194DA all transition from 5 to 2 percent on 1 Oct 2024', () => {
    const sections = ['S194_IB', 'S194M', 'S194G', 'S194DA'] as const;
    for (const s of sections) {
      const pre = resolveRate({
        section: s,
        deductionDate: PRE_OCT_2024,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      const post = resolveRate({
        section: s,
        deductionDate: POST_OCT_2024,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      expect(pre.baseRateBasisPoints).toBe(500);
      expect(post.baseRateBasisPoints).toBe(200);
    }
  });

  it('194F repeal -- pre Oct 2024 is 20 percent, post is 0', () => {
    const pre = resolveRate({
      section: 'S194F',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    const post = resolveRate({
      section: 'S194F',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(pre.baseRateBasisPoints).toBe(2000);
    expect(post.baseRateBasisPoints).toBe(0);
    expect(post.notes).toContain('repealed');
  });
});

describe('resolveRate -- effective-date guards for new sections', () => {
  it('194Q -- pre-1-July-2021 deduction returns rate 0 with notes', () => {
    const result = resolveRate({
      section: 'S194Q',
      deductionDate: PRE_JUL_2021,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes).toContain('not yet in force');
  });

  it('194Q -- post-1-July-2021 deduction returns 0.1 percent (10 bp)', () => {
    const result = resolveRate({
      section: 'S194Q',
      deductionDate: POST_JUL_2021,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(10);
  });

  it('194T -- pre-1-April-2025 returns rate 0', () => {
    const result = resolveRate({
      section: 'S194T',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes).toContain('not yet in force');
  });

  it('194T -- post-1-April-2025 returns 10 percent (1000 bp)', () => {
    const result = resolveRate({
      section: 'S194T',
      deductionDate: POST_APR_2025,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
  });
});

describe('resolveRate -- 206AA uplift (no PAN)', () => {
  it('194A no-PAN -- max(2x, 20 percent) applied', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.effectiveRateBasisPoints).toBe(2000);
    expect(result.upliftReason).toBe('NO_PAN_S206AA');
  });

  it('194C-individual-HUF no-PAN -- floor 20 percent applies (since 2x = 200 bp < 2000 bp floor)', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: PRE_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(100);
    expect(result.effectiveRateBasisPoints).toBe(2000);
  });

  it('194B lottery (30 percent) no-PAN -- 2x = 60 percent applies', () => {
    const result = resolveRate({
      section: 'S194B',
      deductionDate: PRE_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(3000);
    expect(result.effectiveRateBasisPoints).toBe(6000);
  });
});

describe('resolveRate -- inoperative PAN uplift', () => {
  it('inoperative PAN treated equivalently to 206AA', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'inoperative',
      isSpecifiedPerson: false,
    });
    expect(result.upliftReason).toBe('PAN_INOPERATIVE');
    expect(result.effectiveRateBasisPoints).toBeGreaterThanOrEqual(2000);
  });
});

describe('resolveRate -- 206AB specified-person uplift with carve-outs', () => {
  it('194A specified-person -- max(2x, 5 percent) applied', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.effectiveRateBasisPoints).toBe(2000);
    expect(result.upliftReason).toBe('SPECIFIED_PERSON_S206AB');
  });

  it('194C-individual-HUF specified-person -- floor 5 percent applies', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.baseRateBasisPoints).toBe(100);
    expect(result.effectiveRateBasisPoints).toBe(500);
  });

  it('192 salary specified-person -- carve-out applies, no uplift', () => {
    const result = resolveRate({
      section: 'S192',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('NONE');
  });

  it('194B lottery specified-person -- carve-out applies, no uplift', () => {
    const result = resolveRate({
      section: 'S194B',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('NONE');
    expect(result.effectiveRateBasisPoints).toBe(3000);
  });

  it('194N cash withdrawal specified-person -- carve-out applies', () => {
    const result = resolveRate({
      section: 'S194N',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.upliftReason).toBe('NONE');
  });
});

describe('isCarveOutFromS206AB', () => {
  it('192 / 192A / 194B / 194BB / 194N are carve-outs', () => {
    expect(isCarveOutFromS206AB('S192')).toBe(true);
    expect(isCarveOutFromS206AB('S192A')).toBe(true);
    expect(isCarveOutFromS206AB('S194B')).toBe(true);
    expect(isCarveOutFromS206AB('S194BB')).toBe(true);
    expect(isCarveOutFromS206AB('S194N')).toBe(true);
  });

  it('194A / 194C / 194J / 194Q are NOT carve-outs', () => {
    expect(isCarveOutFromS206AB('S194A')).toBe(false);
    expect(isCarveOutFromS206AB('S194C_OTHER')).toBe(false);
    expect(isCarveOutFromS206AB('S194J_PROFESSIONAL')).toBe(false);
    expect(isCarveOutFromS206AB('S194Q')).toBe(false);
  });
});

const PRE_APR_2023 = new Date('2023-03-15T00:00:00Z');
const POST_APR_2023 = new Date('2023-05-15T00:00:00Z');
const PRE_JUL_2022 = new Date('2022-06-15T00:00:00Z');
const POST_JUL_2022 = new Date('2022-08-15T00:00:00Z');
const PRE_APR_2025 = new Date('2025-03-15T00:00:00Z');

describe('resolveRate -- per-Section base-rate matrix (kills citation array mutants)', () => {
  it('S192 returns rate 0 with salary slab sentinel notes and SEC_192 citation', () => {
    const result = resolveRate({
      section: 'S192',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes).toBe('Salary -- compute via slab engine; sentinel rate 0 returned');
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_192]);
  });

  it('S192A -> 1000 bp citing SEC_192A only', () => {
    const result = resolveRate({
      section: 'S192A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_192A]);
  });

  it('S193 -> 1000 bp citing SEC_193 only', () => {
    const result = resolveRate({
      section: 'S193',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_193]);
  });

  it('S194 (dividends) -> 1000 bp citing SEC_194 only', () => {
    const result = resolveRate({
      section: 'S194',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194]);
  });

  it('S194A -> 1000 bp citing SEC_194A only', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194A]);
  });

  it('S194B -> 3000 bp citing SEC_194B only', () => {
    const result = resolveRate({
      section: 'S194B',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(3000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194B]);
  });

  it('S194BA pre-1-April-2023 returns 0 with sentinel notes and SEC_194BA only', () => {
    const result = resolveRate({
      section: 'S194BA',
      deductionDate: PRE_APR_2023,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes).toBe(
      'Section 194BA not yet in force; pre-1-April-2023 deductions fall back to 194B',
    );
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194BA]);
  });

  it('S194BA post-1-April-2023 -> 3000 bp citing SEC_194BA + FA_2023_S194BA', () => {
    const result = resolveRate({
      section: 'S194BA',
      deductionDate: POST_APR_2023,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(3000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194BA, FINANCE_ACTS_TDS.FA_2023_S194BA]);
  });

  it('S194BB -> 3000 bp citing SEC_194BB only', () => {
    const result = resolveRate({
      section: 'S194BB',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194BB]);
  });

  it('S194C_INDIVIDUAL_HUF -> 100 bp citing SEC_194C only', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194C]);
  });

  it('S194C_OTHER -> 200 bp citing SEC_194C only', () => {
    const result = resolveRate({
      section: 'S194C_OTHER',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194C]);
  });

  it('S194D pre-1-April-2025 -> SEC_194D only (including the Oct 2024 - Mar 2025 window)', () => {
    const preCliff = resolveRate({
      section: 'S194D',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    const octToMarchWindow = resolveRate({
      section: 'S194D',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(preCliff.citations).toEqual([ITA_SECTIONS.SEC_194D]);
    expect(octToMarchWindow.citations).toEqual([ITA_SECTIONS.SEC_194D]);
  });

  it('S194D post-1-April-2025 -> SEC_194D + FA_2024_S194D_REDUCTION + FA_2025_THRESHOLD_194D', () => {
    const result = resolveRate({
      section: 'S194D',
      deductionDate: POST_APR_2025,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.citations).toEqual([
      ITA_SECTIONS.SEC_194D,
      FINANCE_ACTS_TDS.FA_2024_S194D_REDUCTION,
      FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194D,
    ]);
  });

  it('S194DA pre-Oct-2024 -> SEC_194DA only; post -> SEC_194DA + FA_2024_OCT_CLIFF_194DA', () => {
    const pre = resolveRate({
      section: 'S194DA',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    const post = resolveRate({
      section: 'S194DA',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(pre.citations).toEqual([ITA_SECTIONS.SEC_194DA]);
    expect(post.citations).toEqual([
      ITA_SECTIONS.SEC_194DA,
      FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194DA,
    ]);
  });

  it('S194E -> 2000 bp citing SEC_194E only', () => {
    const result = resolveRate({
      section: 'S194E',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(2000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194E]);
  });

  it('S194EE -> 1000 bp citing SEC_194EE only', () => {
    const result = resolveRate({
      section: 'S194EE',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194EE]);
  });

  it('S194F pre-Oct-2024 -> 2000 bp SEC_194F only', () => {
    const result = resolveRate({
      section: 'S194F',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194F]);
  });

  it('S194F post-Oct-2024 -> 0 bp with repeal notes and SEC_194F + FA_2024_S194F_REPEAL', () => {
    const result = resolveRate({
      section: 'S194F',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.notes).toBe(
      'Section 194F repealed effective 1 October 2024 -- no TDS applicable',
    );
    expect(result.citations).toEqual([
      ITA_SECTIONS.SEC_194F,
      FINANCE_ACTS_TDS.FA_2024_S194F_REPEAL,
    ]);
  });

  it('S194G pre-Oct-2024 -> SEC_194G only; post -> SEC_194G + FA_2024_OCT_CLIFF_194G', () => {
    const pre = resolveRate({
      section: 'S194G',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    const post = resolveRate({
      section: 'S194G',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(pre.citations).toEqual([ITA_SECTIONS.SEC_194G]);
    expect(post.citations).toEqual([
      ITA_SECTIONS.SEC_194G,
      FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194G,
    ]);
  });

  it('S194H pre-Oct-2024 -> SEC_194H only; post -> SEC_194H + FA_2024_OCT_CLIFF_194H', () => {
    const pre = resolveRate({
      section: 'S194H',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    const post = resolveRate({
      section: 'S194H',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(pre.citations).toEqual([ITA_SECTIONS.SEC_194H]);
    expect(post.citations).toEqual([
      ITA_SECTIONS.SEC_194H,
      FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194H,
    ]);
  });

  it('S194I_A -> 200 bp citing SEC_194I_A only', () => {
    const result = resolveRate({
      section: 'S194I_A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(200);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194I_A]);
  });

  it('S194I_B -> 1000 bp citing SEC_194I_B only', () => {
    const result = resolveRate({
      section: 'S194I_B',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194I_B]);
  });

  it('S194_IA -> 100 bp citing SEC_194_IA only', () => {
    const result = resolveRate({
      section: 'S194_IA',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(100);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194_IA]);
  });

  it('S194_IB pre-Oct-2024 -> SEC_194_IB only; post -> SEC_194_IB + FA_2024_OCT_CLIFF_194_IB', () => {
    const pre = resolveRate({
      section: 'S194_IB',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    const post = resolveRate({
      section: 'S194_IB',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(pre.citations).toEqual([ITA_SECTIONS.SEC_194_IB]);
    expect(post.citations).toEqual([
      ITA_SECTIONS.SEC_194_IB,
      FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194_IB,
    ]);
  });

  it('S194_IC -> 1000 bp citing SEC_194_IC only', () => {
    const result = resolveRate({
      section: 'S194_IC',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194_IC]);
  });

  it('S194J_PROFESSIONAL -> 1000 bp citing SEC_194J only', () => {
    const result = resolveRate({
      section: 'S194J_PROFESSIONAL',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194J]);
  });

  it('S194J_TECHNICAL -> 200 bp citing SEC_194J only', () => {
    const result = resolveRate({
      section: 'S194J_TECHNICAL',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(200);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194J]);
  });

  it('S194J_ROYALTY -> 1000 bp citing SEC_194J only', () => {
    const result = resolveRate({
      section: 'S194J_ROYALTY',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194J]);
  });

  it('S194K -> 1000 bp citing SEC_194K only', () => {
    const result = resolveRate({
      section: 'S194K',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194K]);
  });

  it('S194LA -> 1000 bp citing SEC_194LA only', () => {
    const result = resolveRate({
      section: 'S194LA',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194LA]);
  });

  it('S194LB -> 500 bp citing SEC_194LB only', () => {
    const result = resolveRate({
      section: 'S194LB',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(500);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194LB]);
  });

  it('S194LC -> 500 bp citing SEC_194LC only', () => {
    const result = resolveRate({
      section: 'S194LC',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(500);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194LC]);
  });

  it('S194LD -> 500 bp citing SEC_194LD only', () => {
    const result = resolveRate({
      section: 'S194LD',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(500);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194LD]);
  });

  it('S194M pre-Oct-2024 -> SEC_194M only; post -> SEC_194M + FA_2024_OCT_CLIFF_194M', () => {
    const pre = resolveRate({
      section: 'S194M',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    const post = resolveRate({
      section: 'S194M',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(pre.citations).toEqual([ITA_SECTIONS.SEC_194M]);
    expect(post.citations).toEqual([
      ITA_SECTIONS.SEC_194M,
      FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194M,
    ]);
  });

  it('S194N -> 200 bp citing SEC_194N only', () => {
    const result = resolveRate({
      section: 'S194N',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(200);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194N]);
  });

  it('S194O pre-Oct-2024 -> SEC_194O only; post -> SEC_194O + FA_2024_OCT_CLIFF_194O', () => {
    const pre = resolveRate({
      section: 'S194O',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    const post = resolveRate({
      section: 'S194O',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(pre.citations).toEqual([ITA_SECTIONS.SEC_194O]);
    expect(post.citations).toEqual([
      ITA_SECTIONS.SEC_194O,
      FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194O,
    ]);
  });
});

describe('resolveRate -- Section 194Q effective-date band (1 July 2021)', () => {
  it('pre-1-July-2021 returns rate 0 with not-yet-in-force notes and SEC_194Q only', () => {
    const result = resolveRate({
      section: 'S194Q',
      deductionDate: PRE_JUL_2021,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes).toBe(
      'Section 194Q not yet in force; pre-1-July-2021 transactions are not subject',
    );
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194Q]);
  });

  it('post-1-July-2021 returns 10 bp citing SEC_194Q + FA_2021_S194Q', () => {
    const result = resolveRate({
      section: 'S194Q',
      deductionDate: POST_JUL_2021,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(10);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194Q, FINANCE_ACTS_TDS.FA_2021_S194Q]);
  });
});

describe('resolveRate -- Section 194R effective-date band (1 July 2022)', () => {
  it('pre-1-July-2022 returns rate 0 with not-yet-in-force notes and SEC_194R only', () => {
    const result = resolveRate({
      section: 'S194R',
      deductionDate: PRE_JUL_2022,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes).toBe(
      'Section 194R not yet in force; pre-1-July-2022 perquisites are not subject',
    );
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194R]);
  });

  it('post-1-July-2022 returns 1000 bp citing SEC_194R + FA_2022_S194R', () => {
    const result = resolveRate({
      section: 'S194R',
      deductionDate: POST_JUL_2022,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194R, FINANCE_ACTS_TDS.FA_2022_S194R]);
  });
});

describe('resolveRate -- Section 194S effective-date band (1 July 2022)', () => {
  it('pre-1-July-2022 returns rate 0 with not-yet-in-force notes and SEC_194S only', () => {
    const result = resolveRate({
      section: 'S194S',
      deductionDate: PRE_JUL_2022,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes).toBe(
      'Section 194S not yet in force; pre-1-July-2022 VDA transfers are not subject',
    );
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194S]);
  });

  it('post-1-July-2022 returns 100 bp citing SEC_194S + FA_2022_S194S', () => {
    const result = resolveRate({
      section: 'S194S',
      deductionDate: POST_JUL_2022,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(100);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194S, FINANCE_ACTS_TDS.FA_2022_S194S]);
  });
});

describe('resolveRate -- Section 194T effective-date band (1 April 2025)', () => {
  it('pre-1-April-2025 returns rate 0 with not-yet-in-force notes and SEC_194T only', () => {
    const result = resolveRate({
      section: 'S194T',
      deductionDate: PRE_APR_2025,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes).toBe(
      'Section 194T not yet in force; pre-1-April-2025 partner remuneration is not subject',
    );
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194T]);
  });

  it('post-1-April-2025 returns 1000 bp citing SEC_194T + FA_2024_S194T', () => {
    const result = resolveRate({
      section: 'S194T',
      deductionDate: POST_APR_2025,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_194T, FINANCE_ACTS_TDS.FA_2024_S194T]);
  });
});

describe('resolveRate -- non-resident and TCS sections (kills remaining citation array mutants)', () => {
  it('S196A -> 2000 bp citing SEC_196A only', () => {
    const result = resolveRate({
      section: 'S196A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(2000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_196A]);
  });

  it('S196B -> 1000 bp citing SEC_196B only', () => {
    const result = resolveRate({
      section: 'S196B',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_196B]);
  });

  it('S196C -> 1000 bp citing SEC_196C only', () => {
    const result = resolveRate({
      section: 'S196C',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_196C]);
  });

  it('S196D -> 2000 bp citing SEC_196D only', () => {
    const result = resolveRate({
      section: 'S196D',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(2000);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_196D]);
  });

  it('S206C_1F -> 100 bp citing SEC_206C_1F only', () => {
    const result = resolveRate({
      section: 'S206C_1F',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(100);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_206C_1F]);
  });

  it('S206C_1H -> 10 bp citing SEC_206C_1H only', () => {
    const result = resolveRate({
      section: 'S206C_1H',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(10);
    expect(result.citations).toEqual([ITA_SECTIONS.SEC_206C_1H]);
  });
});

describe('resolveRate -- candidate uplift arithmetic (kills * vs / and Math.max vs Math.min mutants)', () => {
  it('206AA on 194A: candidate = max(2x, 2000) = max(2000, 2000) = 2000; upliftFactor = 2', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.effectiveRateBasisPoints).toBe(2000);
    expect(result.upliftFactor).toBe(2);
  });

  it('206AA on 194B (3000 bp): candidate = max(6000, 2000) = 6000; upliftFactor = 2', () => {
    const result = resolveRate({
      section: 'S194B',
      deductionDate: PRE_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.effectiveRateBasisPoints).toBe(6000);
    expect(result.upliftFactor).toBe(2);
  });

  it('206AA on 194C-individual (100 bp): candidate = max(200, 2000) = 2000; upliftFactor = 20', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: PRE_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.effectiveRateBasisPoints).toBe(2000);
    expect(result.upliftFactor).toBe(20);
  });

  it('206AA on 194B (3000 bp): upliftFactor = candidate / max(baseRate, 1) = 6000 / 3000 = 2 (kills * mutant)', () => {
    const result = resolveRate({
      section: 'S194B',
      deductionDate: PRE_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.upliftFactor).toBe(2);
  });

  it('206AA on S192 (rate 0): upliftFactor = 2000 / max(0, 1) = 2000 (kills Math.min(baseRate, 1) mutant)', () => {
    const result = resolveRate({
      section: 'S192',
      deductionDate: PRE_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.upliftFactor).toBe(2000);
    expect(Number.isFinite(result.upliftFactor)).toBe(true);
  });

  it('206AB on 194A: candidate = max(2000, 500) = 2000; effective = 2000', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.effectiveRateBasisPoints).toBe(2000);
    expect(result.upliftFactor).toBe(2);
  });

  it('206AB on 194C-individual (100 bp): candidate = max(200, 500) = 500; effective = 500', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.effectiveRateBasisPoints).toBe(500);
    expect(result.upliftFactor).toBe(5);
  });

  it('inoperative-PAN on 194A: candidate = max(2000, 2000) = 2000; effective = 2000; upliftFactor = 2', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'inoperative',
      isSpecifiedPerson: false,
    });
    expect(result.effectiveRateBasisPoints).toBe(2000);
    expect(result.upliftFactor).toBe(2);
  });

  it('inoperative-PAN on 194B (3000 bp): candidate = max(6000, 2000) = 6000; effective = 6000; upliftFactor = 2', () => {
    const result = resolveRate({
      section: 'S194B',
      deductionDate: PRE_OCT_2024,
      panStatus: 'inoperative',
      isSpecifiedPerson: false,
    });
    expect(result.effectiveRateBasisPoints).toBe(6000);
    expect(result.upliftFactor).toBe(2);
  });

  it('inoperative-PAN on 194E (2000 bp): candidate = max(4000, 2000) = 4000; effective = 4000; kills both Math.min and / mutants on line 295', () => {
    const result = resolveRate({
      section: 'S194E',
      deductionDate: PRE_OCT_2024,
      panStatus: 'inoperative',
      isSpecifiedPerson: false,
    });
    expect(result.effectiveRateBasisPoints).toBe(4000);
    expect(result.upliftFactor).toBe(2);
  });
});

describe('resolveRate -- baseNotes propagation through `notes` field (kills ConditionalExpression -> true mutant)', () => {
  it('S192 + valid PAN + non-specified -> notes equals salary sentinel (no uplift suffix)', () => {
    const result = resolveRate({
      section: 'S192',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.notes).toBe('Salary -- compute via slab engine; sentinel rate 0 returned');
  });

  it('S194A + valid PAN + non-specified -> notes is undefined (no baseNotes, no uplift)', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.notes).toBeUndefined();
  });

  it('S194A + valid PAN + non-specified -> notes key is absent on the result object (kills line-325 ConditionalExpression -> true mutant)', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect('notes' in result).toBe(false);
    expect(Object.keys(result)).not.toContain('notes');
  });

  it('S194C-individual-HUF + valid PAN + non-specified -> notes key is absent (no-base-notes path, second sample)', () => {
    const result = resolveRate({
      section: 'S194C_INDIVIDUAL_HUF',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect('notes' in result).toBe(false);
  });

  it('S192 + not_furnished -> notes is "${baseNotes}; 206AA uplift applied" (carries baseNotes)', () => {
    const result = resolveRate({
      section: 'S192',
      deductionDate: PRE_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.notes).toBe(
      'Salary -- compute via slab engine; sentinel rate 0 returned; 206AA uplift applied',
    );
  });

  it('S194A + not_furnished -> default 206AA notes (no baseNotes prefix)', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'not_furnished',
      isSpecifiedPerson: false,
    });
    expect(result.notes).toBe('206AA uplift applied -- no PAN furnished');
  });

  it('should match S192 + inoperative', () => {
    const result = resolveRate({
      section: 'S192',
      deductionDate: PRE_OCT_2024,
      panStatus: 'inoperative',
      isSpecifiedPerson: false,
    });
    expect(result.notes).toBe(
      'Salary -- compute via slab engine; sentinel rate 0 returned; inoperative-PAN uplift applied',
    );
  });

  it('S194A + inoperative -> default inoperative notes', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'inoperative',
      isSpecifiedPerson: false,
    });
    expect(result.notes).toBe('Inoperative-PAN uplift applied (treated as 206AA)');
  });

  it('S194A + specified-person -> default 206AB notes', () => {
    const result = resolveRate({
      section: 'S194A',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.notes).toBe('206AB uplift applied -- specified person (non-filer)');
  });

  it('S194Q pre-1-July-2021 + specified-person -> baseNotes prefix carries through 206AB suffix', () => {
    const result = resolveRate({
      section: 'S194Q',
      deductionDate: PRE_JUL_2021,
      panStatus: 'valid',
      isSpecifiedPerson: true,
    });
    expect(result.notes).toBe(
      'Section 194Q not yet in force; pre-1-July-2021 transactions are not subject; 206AB uplift applied (specified person)',
    );
  });
});
