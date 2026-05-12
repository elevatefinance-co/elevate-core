/* Tests for the TDS penalty / interest computers.
 * Section 201(1A) interest (1 / 1.5 percent monthly) and Section 234E late fee (Rs 200 / day capped at TDS amount).
 */

import {
  computeSection201Interest,
  computeSection234ELateFee,
} from '../../src/tds/penalties/index.js';

describe('Section 201(1A) interest', () => {
  it('no lag -- zero interest', () => {
    const dueDate = new Date('2025-08-07T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: dueDate,
      actualDateOfDeposit: dueDate,
    });
    expect(result.totalInterestPaise).toBe(0n);
    expect(result.deductionLagMonths).toBe(0);
    expect(result.depositLagMonths).toBe(0);
  });

  it('one-month deposit lag -- 1.5 percent of TDS amount', () => {
    const dueDate = new Date('2025-08-07T00:00:00Z');
    const deposit = new Date('2025-09-07T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: dueDate,
      actualDateOfDeposit: deposit,
    });
    expect(result.depositLagMonths).toBe(2);
    expect(result.depositLagInterestPaise).toBe(300_000n);
  });

  it('deduction-lag interest -- 1 percent monthly', () => {
    const dueDate = new Date('2025-08-01T00:00:00Z');
    const actualDeduction = new Date('2025-09-01T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: actualDeduction,
      actualDateOfDeposit: actualDeduction,
    });
    expect(result.deductionLagMonths).toBe(2);
    expect(result.deductionLagInterestPaise).toBe(200_000n);
  });

  it('both deduction-lag and deposit-lag accrue independently', () => {
    const dueDate = new Date('2025-08-07T00:00:00Z');
    const actualDeduction = new Date('2025-08-15T00:00:00Z');
    const deposit = new Date('2025-10-07T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: actualDeduction,
      actualDateOfDeposit: deposit,
    });
    expect(result.deductionLagMonths).toBe(1);
    expect(result.depositLagMonths).toBe(3);
    expect(result.totalInterestPaise).toBe(
      result.deductionLagInterestPaise + result.depositLagInterestPaise,
    );
  });

  it('citations include Section 201 and Section 201(1A)', () => {
    const dueDate = new Date('2025-08-07T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: dueDate,
      actualDateOfDeposit: dueDate,
    });
    const sec201 = result.citations.find(
      (c) => c.kind === 'section' && c.section === '201' && c.subSection === undefined,
    );
    const sec201_1A = result.citations.find(
      (c) => c.kind === 'section' && c.section === '201' && c.subSection === '1A',
    );
    expect(sec201).toBeDefined();
    expect(sec201_1A).toBeDefined();
  });
});

describe('Section 234E late fee', () => {
  it('on-time filing -- zero late fee', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: dueDate,
      tdsAmountInReturnPaise: 100_000_00n,
    });
    expect(result.daysLate).toBe(0);
    expect(result.cappedLateFeePaise).toBe(0n);
  });

  it('5-day late filing on a Rs 1L TDS -- Rs 1,000 fee, below cap', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const filing = new Date('2025-08-05T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: filing,
      tdsAmountInReturnPaise: 100_000_00n,
    });
    expect(result.daysLate).toBe(5);
    expect(result.uncappedLateFeePaise).toBe(100_000n);
    expect(result.cappedLateFeePaise).toBe(100_000n);
    expect(result.capWasApplied).toBe(false);
  });

  it('cap engages when uncapped fee exceeds TDS amount', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const filing = new Date('2025-08-30T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: filing,
      tdsAmountInReturnPaise: 500_000n,
    });
    expect(result.daysLate).toBe(30);
    expect(result.uncappedLateFeePaise).toBe(600_000n);
    expect(result.cappedLateFeePaise).toBe(500_000n);
    expect(result.capWasApplied).toBe(true);
  });

  it('asOfDate fallback when actualFilingDate is null (running computation)', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const asOf = new Date('2025-08-10T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: null,
      tdsAmountInReturnPaise: 1_000_000n,
      asOfDate: asOf,
    });
    expect(result.daysLate).toBe(10);
    expect(result.uncappedLateFeePaise).toBe(200_000n);
  });

  it('citations include Section 234E', () => {
    const result = computeSection234ELateFee({
      dueDate: new Date('2025-07-31T00:00:00Z'),
      actualFilingDate: new Date('2025-07-31T00:00:00Z'),
      tdsAmountInReturnPaise: 0n,
    });
    const sec234e = result.citations.find((c) => c.kind === 'section' && c.section === '234E');
    expect(sec234e).toBeDefined();
  });
});

describe('Section 201(1A) interest -- exact note strings (kills StringLiteral mutants)', () => {
  it('should emit no-interest note when neither deduction nor deposit is late', () => {
    const dueDate = new Date('2025-08-07T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: dueDate,
      actualDateOfDeposit: dueDate,
    });
    expect(result.notes).toBe('No interest -- deduction and deposit timely');
  });

  it('should emit deduction-lag note at 1 percent per month when only deduction is late', () => {
    const dueDate = new Date('2025-08-01T00:00:00Z');
    const actualDeduction = new Date('2025-09-01T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: actualDeduction,
      actualDateOfDeposit: actualDeduction,
    });
    expect(result.notes).toBe('Deduction-lag interest applied at 1 percent per month');
    expect(result.deductionLagMonths).toBeGreaterThan(0);
    expect(result.depositLagMonths).toBe(0);
  });

  it('should emit deposit-lag note at 1.5 percent per month when only deposit is late', () => {
    const dueDate = new Date('2025-08-07T00:00:00Z');
    const deposit = new Date('2025-09-07T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: dueDate,
      actualDateOfDeposit: deposit,
    });
    expect(result.notes).toBe('Deposit-lag interest applied at 1.5 percent per month');
    expect(result.deductionLagMonths).toBe(0);
    expect(result.depositLagMonths).toBeGreaterThan(0);
  });

  it('should emit combined-lag note when both deduction and deposit are late', () => {
    const dueDate = new Date('2025-08-07T00:00:00Z');
    const actualDeduction = new Date('2025-08-15T00:00:00Z');
    const deposit = new Date('2025-10-07T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: actualDeduction,
      actualDateOfDeposit: deposit,
    });
    expect(result.notes).toBe(
      'Both deduction-lag (1 percent / month) and deposit-lag (1.5 percent / month) interest applied',
    );
    expect(result.deductionLagMonths).toBeGreaterThan(0);
    expect(result.depositLagMonths).toBeGreaterThan(0);
  });
});

describe('Section 201(1A) interest -- monthsCrossed boundaries', () => {
  it('to == from returns zero months and zero interest (kills <= -> < mutant)', () => {
    const dueDate = new Date('2025-08-07T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: dueDate,
      actualDateOfDeposit: dueDate,
    });
    expect(result.deductionLagMonths).toBe(0);
    expect(result.depositLagMonths).toBe(0);
    expect(result.totalInterestPaise).toBe(0n);
  });

  it('to before from also returns zero months (deposit is before deduction is impossible but defended)', () => {
    const dueDate = new Date('2025-08-07T00:00:00Z');
    const earlier = new Date('2025-08-01T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: earlier,
      actualDateOfDeposit: earlier,
    });
    expect(result.deductionLagMonths).toBe(0);
    expect(result.totalInterestPaise).toBe(0n);
  });

  it('cross-month one-day lag counts as 1 month (Aug 31 -> Sep 1 = 1 month)', () => {
    const dueDate = new Date('2025-08-31T00:00:00Z');
    const deposit = new Date('2025-09-01T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: dueDate,
      actualDateOfDeposit: deposit,
    });
    expect(result.depositLagMonths).toBe(2);
    expect(result.depositLagInterestPaise).toBe(300_000n);
  });

  it('deduction-lag months arithmetic: (2026 - 2025) * 12 + (1 - 1) + 1 = 13 months (kills * vs / mutant)', () => {
    const dueDate = new Date('2025-01-15T00:00:00Z');
    const actualDeduction = new Date('2026-01-15T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: actualDeduction,
      actualDateOfDeposit: actualDeduction,
    });
    expect(result.deductionLagMonths).toBe(13);
    expect(result.deductionLagInterestPaise).toBe(1_300_000n);
  });

  it('leap-year February: 1 Feb 2024 -> 29 Feb 2024 -> 1 month (same calendar month)', () => {
    const dueDate = new Date('2024-02-01T00:00:00Z');
    const deposit = new Date('2024-02-29T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: dueDate,
      actualDateOfDeposit: deposit,
    });
    expect(result.depositLagMonths).toBe(1);
    expect(result.depositLagInterestPaise).toBe(150_000n);
  });

  it('leap-year February crossing: 28 Feb 2024 -> 1 Mar 2024 -> 2 months', () => {
    const dueDate = new Date('2024-02-28T00:00:00Z');
    const deposit = new Date('2024-03-01T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: dueDate,
      actualDateOfDeposit: deposit,
    });
    expect(result.depositLagMonths).toBe(2);
    expect(result.depositLagInterestPaise).toBe(300_000n);
  });

  it('actualDateOfDeduction null -> falls back to deposit date for deduction lag', () => {
    const dueDate = new Date('2025-08-07T00:00:00Z');
    const deposit = new Date('2025-10-07T00:00:00Z');
    const result = computeSection201Interest({
      tdsAmountPaise: 100_000_00n,
      dueDateOfDeduction: dueDate,
      actualDateOfDeduction: null,
      actualDateOfDeposit: deposit,
    });
    expect(result.deductionLagMonths).toBe(3);
    expect(result.depositLagMonths).toBe(0);
    expect(result.deductionLagInterestPaise).toBe(300_000n);
  });
});

describe('Section 234E late fee -- exact note strings (kills StringLiteral mutants)', () => {
  it('should emit no-late-fee note when filed by the due date', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: dueDate,
      tdsAmountInReturnPaise: 100_000_00n,
    });
    expect(result.notes).toBe('Filed by due date -- no late fee');
  });

  it('should cap the late fee at the TDS amount in the return when uncapped exceeds it', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const filing = new Date('2025-08-30T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: filing,
      tdsAmountInReturnPaise: 500_000n,
    });
    expect(result.notes).toBe('Late fee capped at TDS amount in return');
  });

  it('should leave the late fee uncapped at Rs 200 per day when below the TDS-amount cap', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const filing = new Date('2025-08-05T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: filing,
      tdsAmountInReturnPaise: 100_000_00n,
    });
    expect(result.notes).toBe('Late fee Rs 200 per day, uncapped (below TDS amount)');
  });
});

describe('Section 234E late fee -- daysBetween and cap boundary mutants', () => {
  it('actualFilingDate before dueDate -> daysLate is 0 (kills <= -> < mutant)', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const filing = new Date('2025-07-15T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: filing,
      tdsAmountInReturnPaise: 100_000_00n,
    });
    expect(result.daysLate).toBe(0);
    expect(result.uncappedLateFeePaise).toBe(0n);
    expect(result.cappedLateFeePaise).toBe(0n);
    expect(result.capWasApplied).toBe(false);
  });

  it('uncapped fee exactly equals cap -> capWasApplied is false (kills > -> >= mutant)', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const filing = new Date('2025-08-05T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: filing,
      tdsAmountInReturnPaise: 100_000n,
    });
    expect(result.daysLate).toBe(5);
    expect(result.uncappedLateFeePaise).toBe(100_000n);
    expect(result.cappedLateFeePaise).toBe(100_000n);
    expect(result.capWasApplied).toBe(false);
    expect(result.notes).toBe('Late fee Rs 200 per day, uncapped (below TDS amount)');
  });

  it('uncapped fee one paisa above cap -> capWasApplied is true (boundary above)', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const filing = new Date('2025-08-05T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: filing,
      tdsAmountInReturnPaise: 99_999n,
    });
    expect(result.uncappedLateFeePaise).toBe(100_000n);
    expect(result.cappedLateFeePaise).toBe(99_999n);
    expect(result.capWasApplied).toBe(true);
  });

  it('zero-day filing on a Rs 0 TDS return still reports daysLate 0 and "Filed by due date -- no late fee"', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: dueDate,
      tdsAmountInReturnPaise: 0n,
    });
    expect(result.daysLate).toBe(0);
    expect(result.notes).toBe('Filed by due date -- no late fee');
  });

  it('one-day filing -> daysLate is 1, fee is Rs 200 = 20000 paise (kills daysLate === 0 -> true mutant)', () => {
    const dueDate = new Date('2025-07-31T00:00:00Z');
    const filing = new Date('2025-08-01T00:00:00Z');
    const result = computeSection234ELateFee({
      dueDate,
      actualFilingDate: filing,
      tdsAmountInReturnPaise: 100_000_00n,
    });
    expect(result.daysLate).toBe(1);
    expect(result.uncappedLateFeePaise).toBe(20_000n);
    expect(result.notes).toBe('Late fee Rs 200 per day, uncapped (below TDS amount)');
  });
});
