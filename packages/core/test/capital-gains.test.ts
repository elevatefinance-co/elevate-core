/* Wave 2. Capital Gains. Pins the Finance (No. 2) Act 2024 split logic across every rate module, and the
 * citation trail each rule emits so downstream Receipt PDFs never render a bare number. */

import {
  CAPITAL_GAINS_SPLIT_DATE_ISO,
  isPostSplitDate,
  isPreSplitDate,
  computeStcg111A,
  computeLtcg112A,
  LTCG_112A_CONSOLIDATED_EXEMPTION,
  computeLtcg112,
  computeVdaTax,
  type ListedEquityTxn,
  type OtherAssetTxn,
  type VdaTxn,
} from '../src/capital-gains/index.js';

const AY = 'AY2025-26' as const;

describe('split-date', () => {
  it('2024-07-22 is pre-split', () => {
    expect(isPreSplitDate('2024-07-22')).toBe(true);
    expect(isPostSplitDate('2024-07-22')).toBe(false);
  });

  it('2024-07-23 is post-split (inclusive boundary)', () => {
    expect(isPreSplitDate('2024-07-23')).toBe(false);
    expect(isPostSplitDate('2024-07-23')).toBe(true);
  });

  it('should pin the canonical ISO split date', () => {
    expect(CAPITAL_GAINS_SPLIT_DATE_ISO).toBe('2024-07-23');
  });
});

describe('computeStcg111A', () => {
  it('should apply 15% to pre-split transactions', () => {
    const txns: ListedEquityTxn[] = [
      {
        saleDate: '2024-05-01',
        purchaseDate: '2023-11-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
      },
    ];
    const r = computeStcg111A({ transactions: txns, ay: AY });
    expect(r.value).toBe(15_000);
    expect(r.steps[0]?.label).toContain('15%');
  });

  it('should apply 20% to post-split transactions', () => {
    const txns: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-15',
        purchaseDate: '2024-02-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
      },
    ];
    const r = computeStcg111A({ transactions: txns, ay: AY });
    expect(r.value).toBe(20_000);
    expect(r.steps[0]?.label).toContain('20%');
  });

  it('should split a mixed-date portfolio and sums correctly', () => {
    const txns: ListedEquityTxn[] = [
      {
        saleDate: '2024-04-10',
        purchaseDate: '2023-10-10',
        saleConsideration: 200_000,
        acquisitionCost: 100_000,
      },
      {
        saleDate: '2024-10-10',
        purchaseDate: '2024-01-10',
        saleConsideration: 300_000,
        acquisitionCost: 200_000,
      },
    ];
    const r = computeStcg111A({ transactions: txns, ay: AY });
    expect(r.value).toBe(100_000 * 0.15 + 100_000 * 0.2);
  });

  it('should treat a loss transaction as zero (no set-off)', () => {
    const txns: ListedEquityTxn[] = [
      {
        saleDate: '2024-08-01',
        purchaseDate: '2024-03-01',
        saleConsideration: 80_000,
        acquisitionCost: 100_000,
      },
    ];
    const r = computeStcg111A({ transactions: txns, ay: AY });
    expect(r.value).toBe(0);
  });

  it('should return 0 with a default step for empty input', () => {
    const r = computeStcg111A({ transactions: [], ay: AY });
    expect(r.value).toBe(0);
    expect(r.steps).toHaveLength(1);
  });

  it('should cite Section 111A on every computation', () => {
    const txns: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-15',
        purchaseDate: '2024-02-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
      },
    ];
    const r = computeStcg111A({ transactions: txns, ay: AY });
    const hasSection111A = r.citations.some((c) => c.kind === 'section' && c.section === '111A');
    expect(hasSection111A).toBe(true);
  });
});

describe('computeLtcg112A', () => {
  it('should consolidated Rs. 1.25L exemption is applied across pre and post', () => {
    const txns: ListedEquityTxn[] = [
      {
        saleDate: '2024-06-01',
        purchaseDate: '2022-06-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 900_000,
      },
      {
        saleDate: '2024-10-01',
        purchaseDate: '2022-10-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 900_000,
      },
    ];
    const r = computeLtcg112A({ transactions: txns, ay: AY });
    const totalGain = 200_000;
    const taxable = totalGain - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(taxable).toBe(75_000);
    expect(r.value).toBeGreaterThan(0);
    expect(r.value).toBeLessThanOrEqual(Math.round(taxable * 0.125));
  });

  it('should pre-split gain @ 10% after consolidated exemption', () => {
    const txns: ListedEquityTxn[] = [
      {
        saleDate: '2024-05-01',
        purchaseDate: '2022-05-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const r = computeLtcg112A({ transactions: txns, ay: AY });
    const taxable = 400_000 - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(r.value).toBe(Math.round(taxable * 0.1));
  });

  it('should post-split gain @ 12.5% after consolidated exemption', () => {
    const txns: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const r = computeLtcg112A({ transactions: txns, ay: AY });
    const taxable = 400_000 - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(r.value).toBe(Math.round(taxable * 0.125));
  });

  it('should grandfathering. 31-Jan-2018 FMV substitutes for cost when higher', () => {
    const txns: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2017-01-01',
        saleConsideration: 500_000,
        acquisitionCost: 50_000,
        fmvJan312018: 300_000,
      },
    ];
    const r = computeLtcg112A({ transactions: txns, ay: AY });
    const grandfatheredCost = Math.max(50_000, Math.min(300_000, 500_000));
    const grossGain = 500_000 - grandfatheredCost;
    const taxable = grossGain - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(r.value).toBe(Math.round(taxable * 0.125));
  });

  it('should below-exemption total gain yields zero tax but emits the exemption step', () => {
    const txns: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 200_000,
        acquisitionCost: 150_000,
      },
    ];
    const r = computeLtcg112A({ transactions: txns, ay: AY });
    expect(r.value).toBe(0);
    const hasExemptionStep = r.steps.some((s) => s.label.includes('exemption'));
    expect(hasExemptionStep).toBe(true);
  });
});

describe('computeLtcg112', () => {
  it('should pre-split @ 20%', () => {
    const txns: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-06-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
      },
    ];
    const r = computeLtcg112({ transactions: txns, ay: AY });
    expect(r.value).toBe(Math.round(5_000_000 * 0.2));
  });

  it('should post-split default @ 12.5% without indexation', () => {
    const txns: OtherAssetTxn[] = [
      {
        assetType: 'UNLISTED_EQUITY',
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 500_000,
      },
    ];
    const r = computeLtcg112({ transactions: txns, ay: AY });
    expect(r.value).toBe(Math.round(500_000 * 0.125));
  });

  it('should resident individual opts for 20%-with-indexation on pre-23-Jul land', () => {
    const txns: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const r = computeLtcg112({
      transactions: txns,
      ay: AY,
      isResidentIndividualOrHuf: true,
    });
    expect(r.value).toBe(Math.round(3_000_000 * 0.2));
    const step = r.steps.find((s) => s.label.includes('indexation option'));
    expect(step).toBeDefined();
  });

  it('should non-resident CANNOT use indexation option even for pre-23-Jul land', () => {
    const txns: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const r = computeLtcg112({
      transactions: txns,
      ay: AY,
      isResidentIndividualOrHuf: false,
    });
    expect(r.value).toBe(Math.round(3_000_000 * 0.125));
  });

  it('should claimed exemptions (Sec 54) subtract from gain before rate', () => {
    const txns: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
        exemptionsClaimed: [{ section: '54', amount: 3_000_000 }],
      },
    ];
    const r = computeLtcg112({ transactions: txns, ay: AY });
    const taxable = 5_000_000 - 3_000_000;
    expect(r.value).toBe(Math.round(taxable * 0.125));
  });
});

describe('computeVdaTax', () => {
  it('30% flat on aggregate gain', () => {
    const txns: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 500_000,
        acquisitionCost: 300_000,
      },
    ];
    const r = computeVdaTax({ transactions: txns, ay: AY });
    expect(r.value).toBe(60_000);
  });

  it('should no set-off. Loss transaction contributes zero, gain still taxed', () => {
    const txns: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 500_000,
        acquisitionCost: 300_000,
      },
      {
        saleDate: '2025-03-10',
        saleConsideration: 100_000,
        acquisitionCost: 400_000,
      },
    ];
    const r = computeVdaTax({ transactions: txns, ay: AY });
    expect(r.value).toBe(60_000);
  });

  it('should all-loss portfolio yields zero tax with a default step', () => {
    const txns: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 100_000,
        acquisitionCost: 300_000,
      },
    ];
    const r = computeVdaTax({ transactions: txns, ay: AY });
    expect(r.value).toBe(0);
    expect(r.steps).toHaveLength(1);
  });

  it('should cite Section 115BBH and Finance Act 2022', () => {
    const txns: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 500_000,
        acquisitionCost: 300_000,
      },
    ];
    const r = computeVdaTax({ transactions: txns, ay: AY });
    expect(r.citations.some((c) => c.kind === 'section' && c.section === '115BBH')).toBe(true);
    expect(r.citations.some((c) => c.kind === 'finance-act' && c.year === 2022)).toBe(true);
  });
});
