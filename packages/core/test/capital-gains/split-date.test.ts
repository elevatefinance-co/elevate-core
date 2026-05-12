/* Tests for the Finance (No. 2) Act 2024 capital-gains split-date primitive.
 * The whole capital-gains rate engine pivots on this single Unix-millisecond constant:
 * a sale strictly before 23-Jul-2024 applies the pre-split rate, on/after applies the post-split rate.
 * Pinned: the canonical ISO date, the boundary day inclusivity (23-Jul-2024 IS post-split),
 * and the symmetric predicate behaviour. Citations: Finance (No.
 * 2) Act 2024 (Presidential assent date 23 July 2024).
 */

import {
  CAPITAL_GAINS_SPLIT_DATE_ISO,
  CAPITAL_GAINS_SPLIT_DATE_MS,
  isPostSplitDate,
  isPreSplitDate,
} from '../../src/capital-gains/split-date.js';

describe('CAPITAL_GAINS_SPLIT_DATE_ISO', () => {
  it('should pin the canonical ISO split date at 2024-07-23', () => {
    expect(CAPITAL_GAINS_SPLIT_DATE_ISO).toBe('2024-07-23');
  });

  it('should pin the millisecond timestamp consistent with the ISO string', () => {
    expect(CAPITAL_GAINS_SPLIT_DATE_MS).toBe(new Date('2024-07-23T00:00:00Z').getTime());
  });
});

describe('isPostSplitDate', () => {
  it('should return true for a sale on 23 July 2024 (boundary inclusive)', () => {
    expect(isPostSplitDate('2024-07-23')).toBe(true);
  });

  it('should return false for a sale on 22 July 2024 (one day before the cliff)', () => {
    expect(isPostSplitDate('2024-07-22')).toBe(false);
  });

  it('should return true for a sale far past the cliff', () => {
    expect(isPostSplitDate('2025-12-31')).toBe(true);
  });

  it('should return false for a sale far before the cliff', () => {
    expect(isPostSplitDate('2020-01-01')).toBe(false);
  });
});

describe('isPreSplitDate', () => {
  it('should return false for a sale on 23 July 2024 (boundary inclusive on the post side)', () => {
    expect(isPreSplitDate('2024-07-23')).toBe(false);
  });

  it('should return true for a sale on 22 July 2024 (one day before the cliff)', () => {
    expect(isPreSplitDate('2024-07-22')).toBe(true);
  });

  it('should be the symmetric inverse of isPostSplitDate for any date', () => {
    const sampleDates = ['2020-01-01', '2024-07-22', '2024-07-23', '2024-07-24', '2025-03-31'];
    for (const dateIso of sampleDates) {
      expect(isPreSplitDate(dateIso)).toBe(!isPostSplitDate(dateIso));
    }
  });
});
