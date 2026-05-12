/* Tests for Section 50 interest (18 / 24 percent) and Section 47
 * late fee (per-band per-day with caps). */

import {
  SECTION_50_1_RATE_BASIS_POINTS,
  SECTION_50_3_RATE_BASIS_POINTS,
  computeSection47LateFee,
  computeSection50Interest,
  resolveLateFeeBand,
} from '../../src/gst/penalties/index.js';

describe('Section 50 interest -- rate constants', () => {
  it('Section 50(1) rate is 18 percent (1800 bp)', () => {
    expect(SECTION_50_1_RATE_BASIS_POINTS).toBe(1800);
  });

  it('Section 50(3) rate is 24 percent (2400 bp)', () => {
    expect(SECTION_50_3_RATE_BASIS_POINTS).toBe(2400);
  });
});

describe('computeSection50Interest -- delayed cash payment (Section 50(1))', () => {
  it('Rs 1 lakh principal, 30 days delay -- ~Rs 1480 interest', () => {
    const result = computeSection50Interest({
      kind: 'DELAYED_CASH_PAYMENT_S50_1',
      principalPaise: 10_000_000n,
      delayDays: 30,
    });
    expect(result.interestPaise).toBe(147_945n);
    expect(result.rateBasisPoints).toBe(1800);
  });

  it('zero delay -> zero interest', () => {
    const result = computeSection50Interest({
      kind: 'DELAYED_CASH_PAYMENT_S50_1',
      principalPaise: 10_000_000n,
      delayDays: 0,
    });
    expect(result.interestPaise).toBe(0n);
  });

  it('365 days at Rs 1 crore -> exactly 18 percent of principal', () => {
    const result = computeSection50Interest({
      kind: 'DELAYED_CASH_PAYMENT_S50_1',
      principalPaise: 1_000_000_000n,
      delayDays: 365,
    });
    expect(result.interestPaise).toBe(180_000_000n);
  });

  it('cites Section 50, 50(1), Rule 88B, Notification 14/2022-CT', () => {
    const result = computeSection50Interest({
      kind: 'DELAYED_CASH_PAYMENT_S50_1',
      principalPaise: 1_000n,
      delayDays: 1,
    });
    const sec50 = result.citations.find(
      (c) => c.kind === 'section' && c.section === '50' && c.subSection === undefined,
    );
    const sec501 = result.citations.find(
      (c) => c.kind === 'section' && c.section === '50' && c.subSection === '1',
    );
    const rule88b = result.citations.find((c) => c.kind === 'rule' && c.ruleNumber === '88B');
    const notif14 = result.citations.find(
      (c) => c.kind === 'notification' && c.number === '14/2022',
    );
    expect(sec50).toBeDefined();
    expect(sec501).toBeDefined();
    expect(rule88b).toBeDefined();
    expect(notif14).toBeDefined();
  });
});

describe('computeSection50Interest -- ITC wrongly availed (Section 50(3))', () => {
  it('Rs 1 lakh principal, 30 days -- 24 percent rate', () => {
    /* 10,000,000 * 2400 * 30 / (10000 * 365) = 197,260 paise */
    const result = computeSection50Interest({
      kind: 'WRONGLY_AVAILED_AND_UTILISED_ITC_S50_3',
      principalPaise: 10_000_000n,
      delayDays: 30,
    });
    expect(result.rateBasisPoints).toBe(2400);
    expect(result.interestPaise).toBe(197_260n);
    expect(result.notes).toContain('24 percent');
  });

  it('cites Section 50 and 50(3) but not Rule 88B (unique to 50(1))', () => {
    const result = computeSection50Interest({
      kind: 'WRONGLY_AVAILED_AND_UTILISED_ITC_S50_3',
      principalPaise: 1_000n,
      delayDays: 1,
    });
    const sec503 = result.citations.find(
      (c) => c.kind === 'section' && c.section === '50' && c.subSection === '3',
    );
    expect(sec503).toBeDefined();
  });
});

describe('computeSection50Interest -- defensive errors', () => {
  it('throws on negative delay days', () => {
    expect(() =>
      computeSection50Interest({
        kind: 'DELAYED_CASH_PAYMENT_S50_1',
        principalPaise: 1_000n,
        delayDays: -1,
      }),
    ).toThrow('delayDays must be non-negative');
  });

  it('throws on negative principal', () => {
    expect(() =>
      computeSection50Interest({
        kind: 'DELAYED_CASH_PAYMENT_S50_1',
        principalPaise: -1n,
        delayDays: 1,
      }),
    ).toThrow('principalPaise must be non-negative');
  });

  it('zero principal does NOT throw (kills < 0 -> <= 0 mutant)', () => {
    const result = computeSection50Interest({
      kind: 'DELAYED_CASH_PAYMENT_S50_1',
      principalPaise: 0n,
      delayDays: 30,
    });
    expect(result.principalPaise).toBe(0n);
    expect(result.interestPaise).toBe(0n);
  });
});

describe('computeSection50Interest -- exact note strings (kills StringLiteral / ConditionalExpression mutants)', () => {
  it('S50(1) -> exact 18-percent narrative referencing Rule 88B and 1 July 2022', () => {
    const result = computeSection50Interest({
      kind: 'DELAYED_CASH_PAYMENT_S50_1',
      principalPaise: 10_000_000n,
      delayDays: 1,
    });
    expect(result.notes).toBe(
      '18 percent per annum on net cash tax liability for delayed payment per Section 50(1) read with Rule 88B (effective 1 July 2022).',
    );
  });

  it('S50(3) -> exact 24-percent narrative for ITC wrongly availed and utilised', () => {
    const result = computeSection50Interest({
      kind: 'WRONGLY_AVAILED_AND_UTILISED_ITC_S50_3',
      principalPaise: 10_000_000n,
      delayDays: 1,
    });
    expect(result.notes).toBe(
      '24 percent per annum on ITC wrongly availed and utilised per Section 50(3).',
    );
  });

  it('S50(1) selects the 1800 bp rate (kills kind === string-literal mutants)', () => {
    const result = computeSection50Interest({
      kind: 'DELAYED_CASH_PAYMENT_S50_1',
      principalPaise: 10_000_000n,
      delayDays: 1,
    });
    expect(result.rateBasisPoints).toBe(1800);
  });

  it('S50(3) selects the 2400 bp rate', () => {
    const result = computeSection50Interest({
      kind: 'WRONGLY_AVAILED_AND_UTILISED_ITC_S50_3',
      principalPaise: 10_000_000n,
      delayDays: 1,
    });
    expect(result.rateBasisPoints).toBe(2400);
  });
});

describe('resolveLateFeeBand', () => {
  it('NIL_RETURN takes priority regardless of turnover', () => {
    expect(
      resolveLateFeeBand({
        isNilReturn: true,
        aggregateTurnoverPreviousFyPaise: 100_000_000_000n,
      }),
    ).toBe('NIL_RETURN');
  });

  it('TURNOVER_UP_TO_1_5_CR for non-nil up to Rs 1.5 crore', () => {
    expect(
      resolveLateFeeBand({
        isNilReturn: false,
        aggregateTurnoverPreviousFyPaise: 100_000_000n,
      }),
    ).toBe('TURNOVER_UP_TO_1_5_CR');
  });

  it('TURNOVER_1_5_TO_5_CR for non-nil between Rs 1.5 cr and Rs 5 cr', () => {
    expect(
      resolveLateFeeBand({
        isNilReturn: false,
        aggregateTurnoverPreviousFyPaise: 3_000_000_00n,
      }),
    ).toBe('TURNOVER_1_5_TO_5_CR');
  });

  it('TURNOVER_ABOVE_5_CR for non-nil above Rs 5 cr', () => {
    expect(
      resolveLateFeeBand({
        isNilReturn: false,
        aggregateTurnoverPreviousFyPaise: 10_000_000_00n,
      }),
    ).toBe('TURNOVER_ABOVE_5_CR');
  });

  it('boundary at Rs 1.5 cr exactly stays in UP_TO band', () => {
    expect(
      resolveLateFeeBand({
        isNilReturn: false,
        aggregateTurnoverPreviousFyPaise: 1_500_000_00n,
      }),
    ).toBe('TURNOVER_UP_TO_1_5_CR');
  });
});

describe('computeSection47LateFee', () => {
  it('NIL band -- Rs 20/day, capped at Rs 500', () => {
    const result = computeSection47LateFee({
      band: 'NIL_RETURN',
      delayDays: 30,
    });
    expect(result.perDayPaise).toBe(2_000n);
    expect(result.capPaise).toBe(50_000n);
    expect(result.uncappedFeePaise).toBe(60_000n);
    expect(result.cappedFeePaise).toBe(50_000n);
  });

  it('TURNOVER_UP_TO_1_5_CR -- Rs 50/day, capped at Rs 2,000', () => {
    const result = computeSection47LateFee({
      band: 'TURNOVER_UP_TO_1_5_CR',
      delayDays: 50,
    });
    expect(result.perDayPaise).toBe(5_000n);
    expect(result.uncappedFeePaise).toBe(250_000n);
    expect(result.cappedFeePaise).toBe(200_000n);
  });

  it('TURNOVER_1_5_TO_5_CR -- Rs 50/day, capped at Rs 5,000', () => {
    const result = computeSection47LateFee({
      band: 'TURNOVER_1_5_TO_5_CR',
      delayDays: 110,
    });
    expect(result.uncappedFeePaise).toBe(550_000n);
    expect(result.cappedFeePaise).toBe(500_000n);
  });

  it('TURNOVER_ABOVE_5_CR -- Rs 100/day, capped at Rs 10,000', () => {
    const result = computeSection47LateFee({
      band: 'TURNOVER_ABOVE_5_CR',
      delayDays: 110,
    });
    expect(result.perDayPaise).toBe(10_000n);
    expect(result.uncappedFeePaise).toBe(1_100_000n);
    expect(result.cappedFeePaise).toBe(1_000_000n);
  });

  it('within-cap delay -- uncapped equals capped', () => {
    const result = computeSection47LateFee({
      band: 'TURNOVER_UP_TO_1_5_CR',
      delayDays: 5,
    });
    expect(result.uncappedFeePaise).toBe(25_000n);
    expect(result.cappedFeePaise).toBe(25_000n);
  });

  it('zero delay -> zero fee', () => {
    const result = computeSection47LateFee({
      band: 'TURNOVER_UP_TO_1_5_CR',
      delayDays: 0,
    });
    expect(result.cappedFeePaise).toBe(0n);
  });

  it('throws on negative delay', () => {
    expect(() => computeSection47LateFee({ band: 'TURNOVER_UP_TO_1_5_CR', delayDays: -1 })).toThrow(
      'delayDays must be non-negative',
    );
  });

  it('cites Section 47 and Notification 7/2023-CT', () => {
    const result = computeSection47LateFee({
      band: 'NIL_RETURN',
      delayDays: 1,
    });
    const sec47 = result.citations.find((c) => c.kind === 'section' && c.section === '47');
    const notif = result.citations.find((c) => c.kind === 'notification' && c.number === '7/2023');
    expect(sec47).toBeDefined();
    expect(notif).toBeDefined();
  });
});
