/* Section 87A is one of the most user-visible numbers in Indian income tax:
 * a small refund that flips the perceived tax burden for filers near the threshold.
 * The thresholds and ceilings change with almost every Finance Act (Rs. 5L / Rs. 12.5k under old, Rs.
 * 7L / Rs. 25k for new AY 2025-26, Rs. 12L / Rs. 60k for new AY 2026-27).
 * Each AY x regime combination is pinned here so a Finance Act amendment cannot slip through without a failing test.
 */

import {
  computeRebate87A,
  computeRebate87AWithMarginalRelief,
  computeSlabTax,
  getSlabs,
} from '../src/index.js';

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

describe('computeRebate87AWithMarginalRelief()', () => {
  describe('new regime AY2026-27 (limit Rs. 12L, first proviso to Sec 87A clause (b))', () => {
    it('should pin the slab-rate fixtures the marginal-relief tests feed in', () => {
      const slabsAy2026 = getSlabs({ regime: 'NEW', ay: 'AY2026-27' }).slabs;
      const taxAt12L = computeSlabTax({
        taxableIncome: 1_200_000,
        slabs: slabsAy2026,
        ay: 'AY2026-27',
      });
      const taxAt1210k = computeSlabTax({
        taxableIncome: 1_210_000,
        slabs: slabsAy2026,
        ay: 'AY2026-27',
      });
      const taxAt1270k = computeSlabTax({
        taxableIncome: 1_270_000,
        slabs: slabsAy2026,
        ay: 'AY2026-27',
      });
      const taxAt1275k = computeSlabTax({
        taxableIncome: 1_275_000,
        slabs: slabsAy2026,
        ay: 'AY2026-27',
      });
      expect(taxAt12L.value).toBe(60_000);
      expect(taxAt1210k.value).toBe(61_500);
      expect(taxAt1270k.value).toBe(70_500);
      expect(taxAt1275k.value).toBe(71_250);
    });

    it('should behave identically to computeRebate87A at exactly Rs. 12L (full rebate, zero tax)', () => {
      const rebateArgs = {
        taxableIncome: 1_200_000,
        taxBeforeRebate: 60_000,
        regime: 'NEW',
        ay: 'AY2026-27',
      } as const;
      const r = computeRebate87AWithMarginalRelief(rebateArgs);
      expect(r.value).toBe(60_000);
      expect(rebateArgs.taxBeforeRebate - r.value).toBe(0);
      expect(r).toEqual(computeRebate87A(rebateArgs));
      expect(r.steps[0]?.label).toBe('Sec 87A rebate. NEW regime, AY2026-27');
    });

    it('should cap tax payable at Rs. 10,000 at income Rs. 12,10,000 (rebate 51,500 of 61,500)', () => {
      const r = computeRebate87AWithMarginalRelief({
        taxableIncome: 1_210_000,
        taxBeforeRebate: 61_500,
        regime: 'NEW',
        ay: 'AY2026-27',
      });
      expect(r.value).toBe(51_500);
      expect(61_500 - r.value).toBe(10_000);
      expect(r.steps).toHaveLength(1);
      expect(r.steps[0]).toMatchObject({
        label: 'Sec 87A marginal relief. NEW regime, AY2026-27',
        formula:
          'max(0, taxBeforeRebate 61500 - (taxableIncome 1210000 - incomeLimit 1200000)) = 51500',
        inputs: {
          taxableIncome: 1_210_000,
          taxBeforeRebate: 61_500,
          incomeLimit: 1_200_000,
          excessOverLimit: 10_000,
        },
        output: 51_500,
      });
    });

    it('should leave Rs. 500 of rebate just before break-even at Rs. 12,70,000', () => {
      const r = computeRebate87AWithMarginalRelief({
        taxableIncome: 1_270_000,
        taxBeforeRebate: 70_500,
        regime: 'NEW',
        ay: 'AY2026-27',
      });
      expect(r.value).toBe(500);
      expect(70_500 - r.value).toBe(70_000);
      expect(r.steps[0]?.formula).toBe(
        'max(0, taxBeforeRebate 70500 - (taxableIncome 1270000 - incomeLimit 1200000)) = 500',
      );
    });

    it('should give no relief beyond break-even at Rs. 12,75,000 (full slab tax payable)', () => {
      const r = computeRebate87AWithMarginalRelief({
        taxableIncome: 1_275_000,
        taxBeforeRebate: 71_250,
        regime: 'NEW',
        ay: 'AY2026-27',
      });
      expect(r.value).toBe(0);
      expect(r.steps).toHaveLength(1);
      expect(r.steps[0]).toMatchObject({
        label: 'Sec 87A marginal relief. Beyond break-even, no relief',
        formula:
          'max(0, taxBeforeRebate 71250 - (taxableIncome 1275000 - incomeLimit 1200000)) = 0',
        output: 0,
      });
    });

    it('should carry [Sec 87A, FA 2024, FA 2025] on the marginal-relief path', () => {
      const r = computeRebate87AWithMarginalRelief({
        taxableIncome: 1_210_000,
        taxBeforeRebate: 61_500,
        regime: 'NEW',
        ay: 'AY2026-27',
      });
      expect(r.citations).toHaveLength(3);
      expect(r.citations.some((c) => c.kind === 'section' && c.section === '87A')).toBe(true);
      expect(r.citations.some((c) => c.kind === 'finance-act' && c.year === 2024)).toBe(true);
      expect(r.citations.some((c) => c.kind === 'finance-act' && c.year === 2025)).toBe(true);
      expect(r.steps[0]?.citations).toEqual(r.citations);
    });
  });

  describe('new regime AY2025-26 (limit Rs. 7L, FA 2024 numbers, identical relief formula)', () => {
    it('should pin the slab-rate fixtures for Rs. 7,00,000 / 7,10,000 / 7,30,000', () => {
      const slabsAy2025 = getSlabs({ regime: 'NEW', ay: 'AY2025-26' }).slabs;
      const taxAt7L = computeSlabTax({
        taxableIncome: 700_000,
        slabs: slabsAy2025,
        ay: 'AY2025-26',
      });
      const taxAt710k = computeSlabTax({
        taxableIncome: 710_000,
        slabs: slabsAy2025,
        ay: 'AY2025-26',
      });
      const taxAt730k = computeSlabTax({
        taxableIncome: 730_000,
        slabs: slabsAy2025,
        ay: 'AY2025-26',
      });
      expect(taxAt7L.value).toBe(20_000);
      expect(taxAt710k.value).toBe(21_000);
      expect(taxAt730k.value).toBe(23_000);
    });

    it('should behave identically to computeRebate87A at exactly Rs. 7L (full rebate, zero tax)', () => {
      const rebateArgs = {
        taxableIncome: 700_000,
        taxBeforeRebate: 20_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      } as const;
      const r = computeRebate87AWithMarginalRelief(rebateArgs);
      expect(r.value).toBe(20_000);
      expect(r).toEqual(computeRebate87A(rebateArgs));
    });

    it('should cap tax payable at Rs. 10,000 at income Rs. 7,10,000 (rebate 11,000 of 21,000)', () => {
      const r = computeRebate87AWithMarginalRelief({
        taxableIncome: 710_000,
        taxBeforeRebate: 21_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(11_000);
      expect(21_000 - r.value).toBe(10_000);
      expect(r.steps[0]).toMatchObject({
        label: 'Sec 87A marginal relief. NEW regime, AY2025-26',
        formula:
          'max(0, taxBeforeRebate 21000 - (taxableIncome 710000 - incomeLimit 700000)) = 11000',
        inputs: {
          taxableIncome: 710_000,
          taxBeforeRebate: 21_000,
          incomeLimit: 700_000,
          excessOverLimit: 10_000,
        },
        output: 11_000,
      });
    });

    it('should give no relief beyond break-even at Rs. 7,30,000', () => {
      const r = computeRebate87AWithMarginalRelief({
        taxableIncome: 730_000,
        taxBeforeRebate: 23_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      });
      expect(r.value).toBe(0);
      expect(r.steps[0]?.label).toBe('Sec 87A marginal relief. Beyond break-even, no relief');
    });

    it('should carry exactly [Sec 87A, FA 2024] on the marginal-relief path (no FA 2025)', () => {
      const r = computeRebate87AWithMarginalRelief({
        taxableIncome: 710_000,
        taxBeforeRebate: 21_000,
        regime: 'NEW',
        ay: 'AY2025-26',
      });
      expect(r.citations).toHaveLength(2);
      expect(r.citations.some((c) => c.kind === 'section' && c.section === '87A')).toBe(true);
      expect(r.citations.some((c) => c.kind === 'finance-act' && c.year === 2024)).toBe(true);
      expect(r.citations.some((c) => c.kind === 'finance-act' && c.year === 2025)).toBe(false);
    });
  });

  describe('old regime has no marginal relief', () => {
    it('should delegate above-limit OLD calls to the not-eligible branch, never the relief formula', () => {
      const rebateArgs = {
        taxableIncome: 510_000,
        taxBeforeRebate: 14_500,
        regime: 'OLD',
        ay: 'AY2025-26',
      } as const;
      const r = computeRebate87AWithMarginalRelief(rebateArgs);
      expect(r.value).toBe(0);
      expect(r.steps[0]?.label).toBe('Sec 87A rebate. Not eligible');
      expect(r).toEqual(computeRebate87A(rebateArgs));
    });

    it('should delegate at/below-limit OLD calls unchanged', () => {
      const rebateArgs = {
        taxableIncome: 400_000,
        taxBeforeRebate: 5_000,
        regime: 'OLD',
        ay: 'AY2025-26',
      } as const;
      const r = computeRebate87AWithMarginalRelief(rebateArgs);
      expect(r.value).toBe(5_000);
      expect(r).toEqual(computeRebate87A(rebateArgs));
    });
  });
});
