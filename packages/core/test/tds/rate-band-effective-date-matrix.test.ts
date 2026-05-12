/* Effective-date band matrix for the TDS rate-band resolver.
 * The resolver carries every band transition that has ever applied to a Chapter XVII-B Section so
 * historical computations stay reproducible.
 * This file pins the cliffs in one table-driven pass: the Oct 2024 cliff (Finance Act 2024 No.
 * 2 / 2 Aug 2024) which dropped five insurance + commission Sections from 5 percent to 2 percent,
 * the Oct 2024 repeal of Section 194F, the 194D reduction whose FA (No. 2) 2024 effective date is
 * 1 April 2025 (not the Oct 2024 cliff), and the four staggered introductions (194Q from
 * 1 July 2021, 194R and 194S from 1 July 2022, 194BA from 1 April 2023, 194T from 1 April 2025).
 *
 * Primary sources:
 *   Finance (No. 2) Act 2024 (Act 16 of 2024) -- Oct 2024 cliff +
 *     Section 194F repeal + Section 194D reduction effective 1 April 2025
 *   Finance Act 2021 -- Section 194Q introduction
 *   Finance Act 2022 -- Sections 194R + 194S introduction
 *   Finance Act 2023 -- Section 194BA introduction
 *   Finance Act 2024 (Act 12 of 2024) -- Section 194T introduction
 */

import { resolveRate } from '../../src/tds/rates/rate-band-resolver.js';
import type { TdsSectionKey } from '../../src/tds/rates/rate-band-resolver.js';

const PRE_OCT_2024 = new Date('2024-09-30T23:59:59Z');
const POST_OCT_2024 = new Date('2024-10-01T00:00:00Z');
const PRE_JUL_2021 = new Date('2021-06-30T00:00:00Z');
const POST_JUL_2021 = new Date('2021-07-01T00:00:00Z');
const PRE_JUL_2022 = new Date('2022-06-30T00:00:00Z');
const POST_JUL_2022 = new Date('2022-07-01T00:00:00Z');
const PRE_APR_2023 = new Date('2023-03-31T00:00:00Z');
const POST_APR_2023 = new Date('2023-04-01T00:00:00Z');
const PRE_APR_2025 = new Date('2025-03-31T00:00:00Z');
const POST_APR_2025 = new Date('2025-04-01T00:00:00Z');

describe('Oct 2024 cliff -- five Sections drop from 5 percent to 2 percent', () => {
  const fivePercentDropToTwo: readonly TdsSectionKey[] = [
    'S194DA',
    'S194G',
    'S194H',
    'S194_IB',
    'S194M',
  ];

  for (const section of fivePercentDropToTwo) {
    it(`should resolve ${section} to 500bp (5 percent) for a Sept 2024 deduction`, () => {
      const result = resolveRate({
        section,
        deductionDate: PRE_OCT_2024,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      expect(result.baseRateBasisPoints).toBe(500);
      expect(result.upliftReason).toBe('NONE');
    });

    it(`should resolve ${section} to 200bp (2 percent) for an Oct 2024 deduction`, () => {
      const result = resolveRate({
        section,
        deductionDate: POST_OCT_2024,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      expect(result.baseRateBasisPoints).toBe(200);
      expect(result.upliftReason).toBe('NONE');
    });
  }
});

describe('Section 194D reduction -- FA (No. 2) 2024 effective date is 1 April 2025, not the Oct 2024 cliff', () => {
  it('should resolve 194D to 500bp (5 percent) for a Sept 2024 deduction', () => {
    const result = resolveRate({
      section: 'S194D',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(500);
  });

  it('should keep 194D at 500bp (5 percent) through the Oct 2024 - Mar 2025 window', () => {
    const octWindow = resolveRate({
      section: 'S194D',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    const marchEdge = resolveRate({
      section: 'S194D',
      deductionDate: PRE_APR_2025,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(octWindow.baseRateBasisPoints).toBe(500);
    expect(marchEdge.baseRateBasisPoints).toBe(500);
  });

  it('should resolve 194D to 200bp (2 percent) on or after 1 April 2025', () => {
    const result = resolveRate({
      section: 'S194D',
      deductionDate: POST_APR_2025,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(200);
  });
});

describe('Oct 2024 cliff -- Section 194O drops from 1 percent to 0.1 percent', () => {
  it('should resolve 194O to 100bp (1 percent) for a Sept 2024 deduction', () => {
    const result = resolveRate({
      section: 'S194O',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(100);
  });

  it('should resolve 194O to 10bp (0.1 percent) for an Oct 2024 deduction', () => {
    const result = resolveRate({
      section: 'S194O',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(10);
  });
});

describe('Oct 2024 cliff -- Section 194F repealed', () => {
  it('should resolve 194F to 2000bp (20 percent) for a Sept 2024 deduction', () => {
    const result = resolveRate({
      section: 'S194F',
      deductionDate: PRE_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(2000);
  });

  it('should resolve 194F to 0bp for an Oct 2024 deduction (repealed) with notes flagging the repeal', () => {
    const result = resolveRate({
      section: 'S194F',
      deductionDate: POST_OCT_2024,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes ?? '').toMatch(/repeal/i);
  });
});

describe('Section 194Q introduction -- 1 July 2021', () => {
  it('should resolve 194Q to 0bp before 1 July 2021 with notes flagging "not yet in force"', () => {
    const result = resolveRate({
      section: 'S194Q',
      deductionDate: PRE_JUL_2021,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes ?? '').toMatch(/not yet in force/i);
  });

  it('should resolve 194Q to 10bp (0.1 percent) on or after 1 July 2021', () => {
    const result = resolveRate({
      section: 'S194Q',
      deductionDate: POST_JUL_2021,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(10);
  });
});

describe('Sections 194R + 194S introduction -- 1 July 2022', () => {
  const newSections: readonly TdsSectionKey[] = ['S194R', 'S194S'];

  for (const section of newSections) {
    it(`should resolve ${section} to 0bp for a 30 June 2022 deduction with "not yet in force" notes`, () => {
      const result = resolveRate({
        section,
        deductionDate: PRE_JUL_2022,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      expect(result.baseRateBasisPoints).toBe(0);
      expect(result.notes ?? '').toMatch(/not yet in force/i);
    });
  }

  it('should resolve 194R to 1000bp (10 percent) on or after 1 July 2022', () => {
    const result = resolveRate({
      section: 'S194R',
      deductionDate: POST_JUL_2022,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
  });

  it('should resolve 194S to 100bp (1 percent) on or after 1 July 2022', () => {
    const result = resolveRate({
      section: 'S194S',
      deductionDate: POST_JUL_2022,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(100);
  });
});

describe('Section 194BA introduction -- 1 April 2023', () => {
  it('should resolve 194BA to 0bp for a 31 March 2023 deduction with "not yet in force" notes', () => {
    const result = resolveRate({
      section: 'S194BA',
      deductionDate: PRE_APR_2023,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes ?? '').toMatch(/not yet in force/i);
  });

  it('should resolve 194BA to 3000bp (30 percent) on or after 1 April 2023', () => {
    const result = resolveRate({
      section: 'S194BA',
      deductionDate: POST_APR_2023,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(3000);
  });
});

describe('Section 194T introduction -- 1 April 2025', () => {
  it('should resolve 194T to 0bp for a 31 March 2025 deduction with "not yet in force" notes', () => {
    const result = resolveRate({
      section: 'S194T',
      deductionDate: PRE_APR_2025,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(0);
    expect(result.notes ?? '').toMatch(/not yet in force/i);
  });

  it('should resolve 194T to 1000bp (10 percent) on or after 1 April 2025', () => {
    const result = resolveRate({
      section: 'S194T',
      deductionDate: POST_APR_2025,
      panStatus: 'valid',
      isSpecifiedPerson: false,
    });
    expect(result.baseRateBasisPoints).toBe(1000);
  });
});

describe('non-cliff sections -- rate is band-invariant across Oct 2024', () => {
  const bandInvariant: readonly { section: TdsSectionKey; rate: number }[] = [
    { section: 'S194A', rate: 1000 },
    { section: 'S194B', rate: 3000 },
    { section: 'S194BB', rate: 3000 },
    { section: 'S194C_INDIVIDUAL_HUF', rate: 100 },
    { section: 'S194C_OTHER', rate: 200 },
    { section: 'S194I_A', rate: 200 },
    { section: 'S194I_B', rate: 1000 },
    { section: 'S194_IA', rate: 100 },
    { section: 'S194_IC', rate: 1000 },
    { section: 'S194J_PROFESSIONAL', rate: 1000 },
    { section: 'S194J_TECHNICAL', rate: 200 },
    { section: 'S194J_ROYALTY', rate: 1000 },
    { section: 'S194K', rate: 1000 },
    { section: 'S194LA', rate: 1000 },
    { section: 'S194N', rate: 200 },
  ];

  for (const { section, rate } of bandInvariant) {
    it(`should resolve ${section} to ${rate}bp on both sides of the Oct 2024 cliff`, () => {
      const before = resolveRate({
        section,
        deductionDate: PRE_OCT_2024,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      const after = resolveRate({
        section,
        deductionDate: POST_OCT_2024,
        panStatus: 'valid',
        isSpecifiedPerson: false,
      });
      expect(before.baseRateBasisPoints).toBe(rate);
      expect(after.baseRateBasisPoints).toBe(rate);
    });
  }
});
