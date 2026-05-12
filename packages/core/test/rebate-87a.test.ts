/* Section 87A is one of the most user-visible numbers in Indian income tax:
 * a small refund that flips the perceived tax burden for filers near the threshold.
 * The thresholds and ceilings change with almost every Finance Act (Rs. 5L / Rs. 12.5k under old, Rs.
 * 7L / Rs. 25k for new AY 2025-26, Rs. 12L / Rs. 60k for new AY 2026-27).
 * Each AY x regime combination is pinned here so a Finance Act amendment cannot slip through without a failing test.
 */

import { computeRebate87A } from '../src/index.js';

describe('computeRebate87A()', () => {
  describe('new regime AY2025-26 (Rs. 7L limit, Rs. 25k max)', () => {
    it('should grant full rebate for tax <= max when income at threshold', () => {
      const r = computeRebate87A({
        taxableIncome: 700_000,
        taxBeforeRebate: 25_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(25_000);
    });

    it('should grant actual tax when tax < max rebate', () => {
      const r = computeRebate87A({
        taxableIncome: 600_000,
        taxBeforeRebate: 15_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(15_000);
    });

    it('should cap rebate at Rs. 25,000 even when tax exceeds', () => {
      const r = computeRebate87A({
        taxableIncome: 700_000,
        taxBeforeRebate: 50_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(25_000);
    });

    it('should deny rebate above Rs. 7L income', () => {
      const r = computeRebate87A({
        taxableIncome: 700_001,
        taxBeforeRebate: 25_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(0);
    });
  });

  describe('new regime AY2026-27 (Rs. 12L limit, Rs. 60k max. Finance Act 2025)', () => {
    it('should grant full rebate at Rs. 12L income', () => {
      const r = computeRebate87A({
        taxableIncome: 1_200_000,
        taxBeforeRebate: 60_000,
        regime: 'NEW',
        ay: 'AY2026-27',
      });
      expect(r.value).toBe(60_000);
    });

    it('should deny rebate above Rs. 12L income', () => {
      const r = computeRebate87A({
        taxableIncome: 1_200_001,
        taxBeforeRebate: 60_000,
        regime: 'NEW',
        ay: 'AY2026-27',
      });
      expect(r.value).toBe(0);
    });

    it('should cap at Rs. 60,000 for income within limit', () => {
      const r = computeRebate87A({
        taxableIncome: 1_000_000,
        taxBeforeRebate: 90_000,
        regime: 'NEW',
        ay: 'AY2026-27',
      });
      expect(r.value).toBe(60_000);
    });
  });

  describe('old regime (Rs. 5L / Rs. 12,500)', () => {
    it('should grant rebate at Rs. 5L income', () => {
      const r = computeRebate87A({
        taxableIncome: 500_000,
        taxBeforeRebate: 12_500,
        regime: 'OLD',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(12_500);
    });

    it('should deny rebate above Rs. 5L', () => {
      const r = computeRebate87A({
        taxableIncome: 500_001,
        taxBeforeRebate: 12_500,
        regime: 'OLD',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(0);
    });

    it('should old regime limits unchanged in AY2026-27', () => {
      const r = computeRebate87A({
        taxableIncome: 500_000,
        taxBeforeRebate: 12_500,
        regime: 'OLD',
        ay: 'AY2026-27',
      });
      expect(r.value).toBe(12_500);
    });
  });

  it('should return zero with explanation step when taxBeforeRebate is 0', () => {
    const r = computeRebate87A({
      taxableIncome: 500_000,
      taxBeforeRebate: 0,
      regime: 'NEW',
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(0);
    expect(r.steps).toHaveLength(1);
  });

  it('should every result carries Sec 87A citation', () => {
    const r = computeRebate87A({
      taxableIncome: 600_000,
      taxBeforeRebate: 15_000,
      regime: 'NEW',
      ay: 'AY2025-26',
    });
    expect(r.citations.some((c) => c.kind === 'section' && c.section === '87A')).toBe(true);
  });

  describe('citation arrays per regime / AY', () => {
    it('should carry exactly [Sec 87A] for OLD regime', () => {
      const r = computeRebate87A({
        taxableIncome: 400_000,
        taxBeforeRebate: 5_000,
        regime: 'OLD',
        ay: 'AY2025-26',
      });
      expect(r.citations).toHaveLength(1);
      expect(r.citations[0]).toMatchObject({ kind: 'section', section: '87A' });
    });

    it('should carry exactly [Sec 87A, FA 2025] for NEW regime AY 2026-27', () => {
      const r = computeRebate87A({
        taxableIncome: 1_000_000,
        taxBeforeRebate: 50_000,
        regime: 'NEW',
        ay: 'AY2026-27',
      });
      expect(r.citations).toHaveLength(2);
      const hasSec87A = r.citations.some((c) => c.kind === 'section' && c.section === '87A');
      const hasFa2025 = r.citations.some((c) => c.kind === 'finance-act' && c.year === 2025);
      expect(hasSec87A).toBe(true);
      expect(hasFa2025).toBe(true);
    });

    it('should carry exactly [Sec 87A, FA 2024] for NEW regime AY 2025-26', () => {
      const r = computeRebate87A({
        taxableIncome: 600_000,
        taxBeforeRebate: 15_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      });
      expect(r.citations).toHaveLength(2);
      const hasFa2024 = r.citations.some((c) => c.kind === 'finance-act' && c.year === 2024);
      expect(hasFa2024).toBe(true);
    });
  });

  describe('income-limit boundary precision (each AY x regime)', () => {
    it('should grant at exactly Rs. 7L (NEW AY 2025-26)', () => {
      const r = computeRebate87A({
        taxableIncome: 700_000,
        taxBeforeRebate: 25_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(25_000);
    });

    it('should deny one rupee above Rs. 7L (NEW AY 2025-26)', () => {
      const r = computeRebate87A({
        taxableIncome: 700_001,
        taxBeforeRebate: 25_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(0);
    });

    it('should grant at exactly Rs. 12L (NEW AY 2026-27)', () => {
      const r = computeRebate87A({
        taxableIncome: 1_200_000,
        taxBeforeRebate: 60_000,
        regime: 'NEW',
        ay: 'AY2026-27',
      });
      expect(r.value).toBe(60_000);
    });

    it('should deny one rupee above Rs. 12L (NEW AY 2026-27)', () => {
      const r = computeRebate87A({
        taxableIncome: 1_200_001,
        taxBeforeRebate: 60_000,
        regime: 'NEW',
        ay: 'AY2026-27',
      });
      expect(r.value).toBe(0);
    });

    it('should grant at exactly Rs. 5L (OLD)', () => {
      const r = computeRebate87A({
        taxableIncome: 500_000,
        taxBeforeRebate: 12_500,
        regime: 'OLD',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(12_500);
    });

    it('should deny one rupee above Rs. 5L (OLD)', () => {
      const r = computeRebate87A({
        taxableIncome: 500_001,
        taxBeforeRebate: 12_500,
        regime: 'OLD',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(0);
    });
  });

  it('should deny at exactly taxBeforeRebate = 0 with "tax before rebate is 0" formula', () => {
    const r = computeRebate87A({
      taxableIncome: 500_000,
      taxBeforeRebate: 0,
      regime: 'OLD',
      ay: 'AY2025-26',
    });
    expect(r.value).toBe(0);
    expect(r.steps[0]).toMatchObject({
      label: 'Sec 87A rebate. Not eligible',
      formula: 'tax before rebate is 0',
    });
  });

  it('should emit not-eligible step verbatim when income exceeds the limit', () => {
    const r = computeRebate87A({
      taxableIncome: 800_000,
      taxBeforeRebate: 30_000,
      regime: 'NEW',
      ay: 'AY2025-26',
    });
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]).toMatchObject({
      label: 'Sec 87A rebate. Not eligible',
      formula: 'total income 800000 > limit 700000',
      inputs: {
        taxableIncome: 800_000,
        taxBeforeRebate: 30_000,
        incomeLimit: 700_000,
      },
      output: 0,
    });
  });

  it('should emit the granted-rebate step verbatim with regime and AY in label', () => {
    const r = computeRebate87A({
      taxableIncome: 600_000,
      taxBeforeRebate: 15_000,
      regime: 'NEW',
      ay: 'AY2025-26',
    });
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0]).toMatchObject({
      label: 'Sec 87A rebate. NEW regime, AY2025-26',
      formula: 'min(taxBeforeRebate 15000, maxRebate 25000) = 15000',
      inputs: {
        taxableIncome: 600_000,
        taxBeforeRebate: 15_000,
        incomeLimit: 700_000,
        maxRebate: 25_000,
      },
      output: 15_000,
    });
  });

  it('should label OLD regime with OLD in the granted step', () => {
    const r = computeRebate87A({
      taxableIncome: 400_000,
      taxBeforeRebate: 5_000,
      regime: 'OLD',
      ay: 'AY2025-26',
    });
    expect(r.steps[0]?.label).toBe('Sec 87A rebate. OLD regime, AY2025-26');
  });
});
