/* Tests for the GST filing-frequency dispatcher and the eight due-date computers (GSTR-1 monthly,
 * GSTR-3B monthly, GSTR-1 quarterly, GSTR-3B quarterly with State Group split, IFF, PMT-06, CMP-08,
 * GSTR-4).
 */

import {
  MONTHLY_FILING_TURNOVER_THRESHOLD_PAISE,
  cmp08DueDate,
  gstr1MonthlyDueDate,
  gstr1QuarterlyDueDate,
  gstr3bMonthlyDueDate,
  gstr3bQuarterlyDueDate,
  gstr4DueDate,
  iffDueDate,
  pmt06DueDate,
  resolveFilingFrequency,
  resolveQrmpGstr3bDueDay,
} from '../../src/gst/frequencies/index.js';

describe('MONTHLY_FILING_TURNOVER_THRESHOLD_PAISE', () => {
  it('is Rs 5 crore in paise', () => {
    expect(MONTHLY_FILING_TURNOVER_THRESHOLD_PAISE).toBe(5n * 10_000_000n * 100n);
  });
});

describe('resolveFilingFrequency', () => {
  it('composition opt-in -> COMPOSITION_QUARTERLY', () => {
    const result = resolveFilingFrequency({
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasOptedIntoQrmp: false,
      hasOptedIntoComposition: true,
    });
    expect(result.frequency).toBe('COMPOSITION_QUARTERLY');
  });

  it('turnover above Rs 5 crore -> MONTHLY (QRMP not available)', () => {
    const result = resolveFilingFrequency({
      aggregateTurnoverPreviousFyPaise: 6_000_000_000n,
      hasOptedIntoQrmp: true,
      hasOptedIntoComposition: false,
    });
    expect(result.frequency).toBe('MONTHLY');
  });

  it('turnover at exactly Rs 5 crore + QRMP opt-in -> QUARTERLY_QRMP', () => {
    const result = resolveFilingFrequency({
      aggregateTurnoverPreviousFyPaise: MONTHLY_FILING_TURNOVER_THRESHOLD_PAISE,
      hasOptedIntoQrmp: true,
      hasOptedIntoComposition: false,
    });
    expect(result.frequency).toBe('QUARTERLY_QRMP');
  });

  it('turnover below Rs 5 crore + no QRMP opt-in -> MONTHLY (default)', () => {
    const result = resolveFilingFrequency({
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasOptedIntoQrmp: false,
      hasOptedIntoComposition: false,
    });
    expect(result.frequency).toBe('MONTHLY');
  });

  it('every result carries citations for traceability', () => {
    const result = resolveFilingFrequency({
      aggregateTurnoverPreviousFyPaise: 100_000_000n,
      hasOptedIntoQrmp: true,
      hasOptedIntoComposition: false,
    });
    expect(result.citations.length).toBeGreaterThan(0);
  });
});

describe('resolveQrmpGstr3bDueDay -- State Group split', () => {
  it('Maharashtra (27) is Group I -- 22nd', () => {
    expect(resolveQrmpGstr3bDueDay('27')).toBe(22);
  });

  it('Karnataka (29) is Group I', () => {
    expect(resolveQrmpGstr3bDueDay('29')).toBe(22);
  });

  it('Tamil Nadu (33) is Group I', () => {
    expect(resolveQrmpGstr3bDueDay('33')).toBe(22);
  });

  it('Delhi (07) is Group II -- 24th', () => {
    expect(resolveQrmpGstr3bDueDay('07')).toBe(24);
  });

  it('Uttar Pradesh (09) is Group II', () => {
    expect(resolveQrmpGstr3bDueDay('09')).toBe(24);
  });

  it('West Bengal (19) is Group II', () => {
    expect(resolveQrmpGstr3bDueDay('19')).toBe(24);
  });
});

describe('GSTR-1 monthly due date -- 11th of next month', () => {
  it('July 2025 -> 11 August 2025', () => {
    const due = gstr1MonthlyDueDate(7, 2025);
    expect(due.getUTCFullYear()).toBe(2025);
    expect(due.getUTCMonth()).toBe(7);
    expect(due.getUTCDate()).toBe(11);
  });

  it('December 2025 -> 11 January 2026', () => {
    const due = gstr1MonthlyDueDate(12, 2025);
    expect(due.getUTCFullYear()).toBe(2026);
    expect(due.getUTCMonth()).toBe(0);
    expect(due.getUTCDate()).toBe(11);
  });
});

describe('GSTR-3B monthly due date -- 20th of next month', () => {
  it('July 2025 -> 20 August 2025', () => {
    const due = gstr3bMonthlyDueDate(7, 2025);
    expect(due.getUTCMonth()).toBe(7);
    expect(due.getUTCDate()).toBe(20);
  });
});

describe('GSTR-1 quarterly due date -- 13th of month after quarter end', () => {
  it('Q1 (Apr-Jun) of FY2025-26 -> 13 July 2025', () => {
    const due = gstr1QuarterlyDueDate(1, 2025);
    expect(due.getUTCFullYear()).toBe(2025);
    expect(due.getUTCMonth()).toBe(6);
    expect(due.getUTCDate()).toBe(13);
  });

  it('Q4 (Jan-Mar 2026) -> 13 April 2026', () => {
    const due = gstr1QuarterlyDueDate(4, 2025);
    expect(due.getUTCFullYear()).toBe(2026);
    expect(due.getUTCMonth()).toBe(3);
    expect(due.getUTCDate()).toBe(13);
  });
});

describe('GSTR-3B quarterly due date -- State Group split', () => {
  it('Q1 FY2025-26 in Maharashtra (27) -> 22 July 2025', () => {
    const due = gstr3bQuarterlyDueDate({
      periodQuarter: 1,
      fyStartYear: 2025,
      stateCode: '27',
    });
    expect(due.getUTCDate()).toBe(22);
    expect(due.getUTCMonth()).toBe(6);
  });

  it('Q1 FY2025-26 in Delhi (07) -> 24 July 2025', () => {
    const due = gstr3bQuarterlyDueDate({
      periodQuarter: 1,
      fyStartYear: 2025,
      stateCode: '07',
    });
    expect(due.getUTCDate()).toBe(24);
    expect(due.getUTCMonth()).toBe(6);
  });
});

describe('IFF due date -- 13th of next month', () => {
  it('July 2025 -> 13 August 2025', () => {
    const due = iffDueDate(7, 2025);
    expect(due.getUTCDate()).toBe(13);
    expect(due.getUTCMonth()).toBe(7);
  });
});

describe('PMT-06 due date -- 25th of next month', () => {
  it('August 2025 -> 25 September 2025', () => {
    const due = pmt06DueDate(8, 2025);
    expect(due.getUTCDate()).toBe(25);
    expect(due.getUTCMonth()).toBe(8);
  });
});

describe('CMP-08 due date -- 18th of month after quarter end', () => {
  it('Q2 FY2025-26 -> 18 October 2025', () => {
    const due = cmp08DueDate(2, 2025);
    expect(due.getUTCFullYear()).toBe(2025);
    expect(due.getUTCMonth()).toBe(9);
    expect(due.getUTCDate()).toBe(18);
  });

  it('Q4 FY2025-26 -> 18 April 2026', () => {
    const due = cmp08DueDate(4, 2025);
    expect(due.getUTCFullYear()).toBe(2026);
    expect(due.getUTCMonth()).toBe(3);
    expect(due.getUTCDate()).toBe(18);
  });
});

describe('GSTR-4 annual due date -- 30 April of next FY', () => {
  it('FY2025-26 -> 30 April 2026', () => {
    const due = gstr4DueDate(2025);
    expect(due.getUTCFullYear()).toBe(2026);
    expect(due.getUTCMonth()).toBe(3);
    expect(due.getUTCDate()).toBe(30);
  });
});
