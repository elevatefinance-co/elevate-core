/* Late-fee cap-boundary matrix for Section 47 (Notification 7/2023-CT).
 * Each band has a per-day fee and a hard cap;
 * the boundary day is the smallest delay at which the cap pins the amount. The cap matters:
 * a 200-day-delayed nil return owes Rs 500, not Rs 4,000 (which the linear computation would yield).
 * This file pins the cap-day boundary for every band.
 *
 * Bands per Notification 7/2023-CT:
 *   NIL_RETURN          Rs 20 / day, capped at Rs 500   -> day 25
 *   TURNOVER_UP_TO_1_5_CR Rs 50 / day, capped at Rs 2,000 -> day 40
 *   TURNOVER_1_5_TO_5_CR  Rs 50 / day, capped at Rs 5,000 -> day 100
 *   TURNOVER_ABOVE_5_CR   Rs 100 / day, capped at Rs 10,000 -> day 100
 */

import { computeSection47LateFee, resolveLateFeeBand } from '../../src/gst/penalties/index.js';

describe('Section 47 late-fee cap-boundary matrix', () => {
  describe('NIL_RETURN -- Rs 20 / day capped at Rs 500 (paise: 50_000)', () => {
    it('should compute the linear fee on day 24 (uncapped: 24 * 2000 = 48000 paise)', () => {
      const result = computeSection47LateFee({
        band: 'NIL_RETURN',
        delayDays: 24,
      });
      expect(result.uncappedFeePaise).toBe(48_000n);
      expect(result.cappedFeePaise).toBe(48_000n);
    });

    it('should pin to the cap on day 25 (uncapped: 25 * 2000 = 50000 = exact cap)', () => {
      const result = computeSection47LateFee({
        band: 'NIL_RETURN',
        delayDays: 25,
      });
      expect(result.uncappedFeePaise).toBe(50_000n);
      expect(result.cappedFeePaise).toBe(50_000n);
    });

    it('should pin to the cap on day 26 (uncapped: 52000 > 50000 cap)', () => {
      const result = computeSection47LateFee({
        band: 'NIL_RETURN',
        delayDays: 26,
      });
      expect(result.uncappedFeePaise).toBe(52_000n);
      expect(result.cappedFeePaise).toBe(50_000n);
    });

    it('should still pin to Rs 500 on day 365 (extreme delay does not breach the cap)', () => {
      const result = computeSection47LateFee({
        band: 'NIL_RETURN',
        delayDays: 365,
      });
      expect(result.cappedFeePaise).toBe(50_000n);
    });
  });

  describe('TURNOVER_UP_TO_1_5_CR -- Rs 50 / day capped at Rs 2,000 (paise: 200_000)', () => {
    it('should compute linear on day 39 (uncapped: 39 * 5000 = 195000)', () => {
      const result = computeSection47LateFee({
        band: 'TURNOVER_UP_TO_1_5_CR',
        delayDays: 39,
      });
      expect(result.cappedFeePaise).toBe(195_000n);
    });

    it('should pin to the cap on day 40 (uncapped: 200000 = exact cap)', () => {
      const result = computeSection47LateFee({
        band: 'TURNOVER_UP_TO_1_5_CR',
        delayDays: 40,
      });
      expect(result.cappedFeePaise).toBe(200_000n);
    });

    it('should pin to the cap on day 100 (uncapped: 500000 > 200000 cap)', () => {
      const result = computeSection47LateFee({
        band: 'TURNOVER_UP_TO_1_5_CR',
        delayDays: 100,
      });
      expect(result.cappedFeePaise).toBe(200_000n);
    });
  });

  describe('TURNOVER_1_5_TO_5_CR -- Rs 50 / day capped at Rs 5,000 (paise: 500_000)', () => {
    it('should compute linear on day 99 (uncapped: 495000)', () => {
      const result = computeSection47LateFee({
        band: 'TURNOVER_1_5_TO_5_CR',
        delayDays: 99,
      });
      expect(result.cappedFeePaise).toBe(495_000n);
    });

    it('should pin to the cap on day 100', () => {
      const result = computeSection47LateFee({
        band: 'TURNOVER_1_5_TO_5_CR',
        delayDays: 100,
      });
      expect(result.cappedFeePaise).toBe(500_000n);
    });
  });

  describe('TURNOVER_ABOVE_5_CR -- Rs 100 / day capped at Rs 10,000 (paise: 1_000_000)', () => {
    it('should compute linear on day 99 (uncapped: 99 * 10000 = 990000)', () => {
      const result = computeSection47LateFee({
        band: 'TURNOVER_ABOVE_5_CR',
        delayDays: 99,
      });
      expect(result.cappedFeePaise).toBe(990_000n);
    });

    it('should pin to the cap on day 100 (exact 1000000)', () => {
      const result = computeSection47LateFee({
        band: 'TURNOVER_ABOVE_5_CR',
        delayDays: 100,
      });
      expect(result.cappedFeePaise).toBe(1_000_000n);
    });

    it('should pin to the cap on day 1000', () => {
      const result = computeSection47LateFee({
        band: 'TURNOVER_ABOVE_5_CR',
        delayDays: 1000,
      });
      expect(result.cappedFeePaise).toBe(1_000_000n);
    });
  });

  describe('zero-delay edge -- band-invariant zero fee', () => {
    const bands = [
      'NIL_RETURN',
      'TURNOVER_UP_TO_1_5_CR',
      'TURNOVER_1_5_TO_5_CR',
      'TURNOVER_ABOVE_5_CR',
    ] as const;
    for (const band of bands) {
      it(`should compute zero fee for ${band} on day 0`, () => {
        const result = computeSection47LateFee({ band, delayDays: 0 });
        expect(result.cappedFeePaise).toBe(0n);
        expect(result.uncappedFeePaise).toBe(0n);
      });
    }
  });

  describe('negative delay throws (no negative-fee path)', () => {
    it('should throw when delayDays is -1', () => {
      expect(() => computeSection47LateFee({ band: 'NIL_RETURN', delayDays: -1 })).toThrow();
    });
  });

  describe('capWasApplied boundary (kills > -> >= mutant on cap comparison)', () => {
    it('should report capWasApplied false when uncapped equals cap exactly (NIL_RETURN day 25)', () => {
      const result = computeSection47LateFee({
        band: 'NIL_RETURN',
        delayDays: 25,
      });
      expect(result.uncappedFeePaise).toBe(50_000n);
      expect(result.capPaise).toBe(50_000n);
      expect(result.capWasApplied).toBe(false);
    });

    it('should report capWasApplied true when uncapped strictly exceeds cap (NIL_RETURN day 26)', () => {
      const result = computeSection47LateFee({
        band: 'NIL_RETURN',
        delayDays: 26,
      });
      expect(result.uncappedFeePaise).toBe(52_000n);
      expect(result.capPaise).toBe(50_000n);
      expect(result.capWasApplied).toBe(true);
    });

    it('should report capWasApplied false when uncapped is below cap (NIL_RETURN day 24)', () => {
      const result = computeSection47LateFee({
        band: 'NIL_RETURN',
        delayDays: 24,
      });
      expect(result.capWasApplied).toBe(false);
    });
  });
});

describe('resolveLateFeeBand -- turnover boundary matrix', () => {
  const ONE_AND_HALF_CRORE_PAISE = 150_000_000n;
  const FIVE_CRORE_PAISE = 500_000_000n;

  it('should return NIL_RETURN regardless of turnover when isNilReturn is true', () => {
    expect(
      resolveLateFeeBand({
        isNilReturn: true,
        aggregateTurnoverPreviousFyPaise: 10_000_000_000n,
      }),
    ).toBe('NIL_RETURN');
  });

  it('should return TURNOVER_UP_TO_1_5_CR for turnover exactly equal to Rs 1.5 cr (boundary inclusive)', () => {
    expect(
      resolveLateFeeBand({
        isNilReturn: false,
        aggregateTurnoverPreviousFyPaise: ONE_AND_HALF_CRORE_PAISE,
      }),
    ).toBe('TURNOVER_UP_TO_1_5_CR');
  });

  it('should return TURNOVER_1_5_TO_5_CR for turnover one paise above Rs 1.5 cr', () => {
    expect(
      resolveLateFeeBand({
        isNilReturn: false,
        aggregateTurnoverPreviousFyPaise: ONE_AND_HALF_CRORE_PAISE + 1n,
      }),
    ).toBe('TURNOVER_1_5_TO_5_CR');
  });

  it('should return TURNOVER_1_5_TO_5_CR for turnover exactly equal to Rs 5 cr (boundary inclusive)', () => {
    expect(
      resolveLateFeeBand({
        isNilReturn: false,
        aggregateTurnoverPreviousFyPaise: FIVE_CRORE_PAISE,
      }),
    ).toBe('TURNOVER_1_5_TO_5_CR');
  });

  it('should return TURNOVER_ABOVE_5_CR for turnover one paise above Rs 5 cr', () => {
    expect(
      resolveLateFeeBand({
        isNilReturn: false,
        aggregateTurnoverPreviousFyPaise: FIVE_CRORE_PAISE + 1n,
      }),
    ).toBe('TURNOVER_ABOVE_5_CR');
  });
});
