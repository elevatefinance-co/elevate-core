/* Tests for Section 112A long-term capital gains on STT-paid listed equity. Three composing rules:
 * the 23-Jul-2024 rate split (10 percent / 12.5 percent), the consolidated annual Rs. 1.25L exemption
 * (CBDT Circular 12/2024 confirmed: not cumulative across the split), and the 31-Jan-2018 grandfathering
 * for pre-Feb-2018 acquisitions (Section 112A(4): cost = max(actual cost, min(FMV-Jan-31-2018, sale))).
 * Pinned: pre-split 10 percent, post-split 12.5 percent, exemption applied first to pre-split spillover,
 * grandfathered cost, loss-floors-at-zero per transaction, citation chain. Citations: Section 112A,
 * Finance (No. 2) Act 2024, CBDT Circular 12/2024 (consolidated exemption + post-split rate). */

import {
  LTCG_112A_CONSOLIDATED_EXEMPTION,
  computeLtcg112A,
} from '../../src/capital-gains/listed-equity-ltcg.js';
import { SECTIONS, FINANCE_ACTS, CIRCULARS } from '../../src/citations/index.js';
import type { ListedEquityTxn } from '../../src/capital-gains/shared.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

describe('LTCG_112A_CONSOLIDATED_EXEMPTION constant', () => {
  it('should pin the consolidated annual exemption at Rs. 1,25,000', () => {
    expect(LTCG_112A_CONSOLIDATED_EXEMPTION).toBe(125_000);
  });
});

describe('computeLtcg112A', () => {
  it('should apply 10 percent to a pre-split gain after the consolidated exemption', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-05-01',
        purchaseDate: '2022-05-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const taxableGain = 400_000 - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(result.value).toBe(Math.round(taxableGain * 0.1));
  });

  it('should apply 12.5 percent to a post-split gain after the consolidated exemption', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const taxableGain = 400_000 - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(result.value).toBe(Math.round(taxableGain * 0.125));
  });

  it('should apply a single Rs. 1.25L exemption across both pre- and post-split gains', () => {
    const transactions: ListedEquityTxn[] = [
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
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const totalGain = 200_000;
    const taxablePool = totalGain - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(taxablePool).toBe(75_000);
    expect(result.value).toBeGreaterThan(0);
    expect(result.value).toBeLessThanOrEqual(Math.round(taxablePool * 0.125));
  });

  it('should grandfather a pre-Feb-2018 acquisition using max(cost, min(FMV-Jan-31-2018, sale))', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2017-01-01',
        saleConsideration: 500_000,
        acquisitionCost: 50_000,
        fmvJan312018: 300_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const grandfatheredCost = Math.max(50_000, Math.min(300_000, 500_000));
    const grossGain = 500_000 - grandfatheredCost;
    const taxablePool = grossGain - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(result.value).toBe(Math.round(taxablePool * 0.125));
  });

  it('should yield zero tax with an explicit exemption step when total gain is below Rs. 1.25L', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 200_000,
        acquisitionCost: 150_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    const hasExemptionStep = result.steps.some((step) =>
      step.label.toLowerCase().includes('exemption'),
    );
    expect(hasExemptionStep).toBe(true);
  });

  it('should return zero with a default step for empty input', () => {
    const result = computeLtcg112A({ transactions: [], ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.label).toMatch(/No taxable LTCG/);
  });

  it('should cite Section 112A on every computation', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const hasSection112A = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '112A',
    );
    expect(hasSection112A).toBe(true);
  });

  it('should subtract transferExpenses before computing the per-txn gain', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 600_000,
        transferExpenses: 5_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const grossGain = 1_000_000 - 600_000 - 5_000;
    const taxable = grossGain - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(result.value).toBe(Math.round(taxable * 0.125));
  });

  it('should floor a loss-making transaction at zero before aggregation', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 80_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
  });
});

describe('computeLtcg112A. Mutation-killer assertions', () => {
  it('should subtract (not add) expenses when applying grandfathered cost on a pre-Feb-2018 acquisition', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2017-01-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 100_000,
        fmvJan312018: 400_000,
        transferExpenses: 50_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const grandfatheredCost = Math.max(100_000, Math.min(400_000, 1_000_000));
    const grossGain = 1_000_000 - grandfatheredCost - 50_000;
    const taxablePool = grossGain - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(result.value).toBe(Math.round(taxablePool * 0.125));
  });

  it('should treat fmvJan312018 of zero as not provided (skip grandfathering when fmv equals zero)', () => {
    const transactionsWithZeroFmv: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2017-01-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
        fmvJan312018: 0,
      },
    ];
    const transactionsWithoutFmv: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2017-01-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const withZero = computeLtcg112A({
      transactions: transactionsWithZeroFmv,
      ay: ASSESSMENT_YEAR,
    });
    const withoutFmv = computeLtcg112A({
      transactions: transactionsWithoutFmv,
      ay: ASSESSMENT_YEAR,
    });
    expect(withZero.value).toBe(withoutFmv.value);
  });

  it('should apply grandfathering when fmvJan312018 is strictly positive', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2017-01-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 50_000,
        fmvJan312018: 600_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const grandfatheredCost = Math.max(50_000, Math.min(600_000, 1_000_000));
    const grossGain = 1_000_000 - grandfatheredCost;
    const taxable = grossGain - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(result.value).toBe(Math.round(taxable * 0.125));
    expect(result.value).toBeGreaterThan(0);
  });

  it('should emit the no-taxable default step with exact label, formula, inputs, and Section 112A citation', () => {
    const result = computeLtcg112A({ transactions: [], ay: ASSESSMENT_YEAR });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toMatchObject({
      label: 'No taxable LTCG under Section 112A',
      formula: 'sum(gains) = 0',
      inputs: { transactions: 0 },
      output: 0,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_112A]);
    expect(result.steps[0]?.citations).toHaveLength(1);
  });

  it('should record transactions count in default step inputs (not empty)', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 50_000,
        acquisitionCost: 80_000,
      },
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 60_000,
        acquisitionCost: 90_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]?.inputs).toEqual({ transactions: 2 });
  });

  it('should skip a transaction whose net gain is exactly zero (gain <= 0 boundary at zero)', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 100_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    expect(result.steps[0]?.label).toBe('No taxable LTCG under Section 112A');
  });

  it('should emit the gross-gain step with exact label, formula, inputs, output, and Section 112A citation', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]).toMatchObject({
      label: 'Gross LTCG on listed equity / equity MF',
      formula: 'sum(sale - max(cost, min(fmv-31-Jan-2018, sale)) - expenses)',
      inputs: {
        preSplitGrossGain: 0,
        postSplitGrossGain: 400_000,
        totalGrossGain: 400_000,
      },
      output: 400_000,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_112A]);
  });

  it('should apply min(consolidated exemption, gross gain) and emit a negative-output exemption step (not max)', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const exemptionStep = result.steps[1];
    expect(exemptionStep?.label).toBe(
      `Consolidated annual exemption. Rs. ${LTCG_112A_CONSOLIDATED_EXEMPTION.toLocaleString('en-IN')}`,
    );
    expect(exemptionStep?.formula).toBe('min(Rs. 1,25,000, gross gain)');
    expect(exemptionStep?.inputs).toEqual({
      annualExemption: LTCG_112A_CONSOLIDATED_EXEMPTION,
      grossGain: 400_000,
      applied: LTCG_112A_CONSOLIDATED_EXEMPTION,
    });
    expect(exemptionStep?.output).toBe(-LTCG_112A_CONSOLIDATED_EXEMPTION);
    expect(exemptionStep?.citations).toEqual([SECTIONS.SEC_112A, CIRCULARS.CBDT_CIRC_12_2024]);
  });

  it('should cap exemption applied at gross gain when gross gain is below the consolidated exemption', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 200_000,
        acquisitionCost: 150_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const exemptionStep = result.steps[1];
    expect(exemptionStep?.inputs).toMatchObject({
      applied: 50_000,
      grossGain: 50_000,
    });
    expect(exemptionStep?.output).toBe(-50_000);
  });

  it('should NOT push the pre-split rate step when preAfterExemption equals zero (boundary at zero)', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-05-01',
        purchaseDate: '2022-05-01',
        saleConsideration: 200_000,
        acquisitionCost: 75_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const hasPreSplitRateStep = result.steps.some((step) => step.label.includes('@ 10%'));
    expect(hasPreSplitRateStep).toBe(false);
    expect(result.value).toBe(0);
  });

  it('should emit the pre-split @ 10% step with exact label, formula, inputs, and citations when preAfterExemption is positive', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-05-01',
        purchaseDate: '2022-05-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const preSplitTaxStep = result.steps.find((step) => step.label.includes('pre 23-Jul-2024'));
    expect(preSplitTaxStep).toMatchObject({
      label: 'LTCG. Listed equity (pre 23-Jul-2024) @ 10%',
      formula: '(gain - exemption_applied_pre) x 0.10',
      inputs: {
        taxable: 400_000 - LTCG_112A_CONSOLIDATED_EXEMPTION,
        rate: 0.1,
      },
      output: Math.round((400_000 - LTCG_112A_CONSOLIDATED_EXEMPTION) * 0.1),
    });
    expect(preSplitTaxStep?.citations).toEqual([SECTIONS.SEC_112A]);
  });

  it('should NOT push the post-split rate step when postAfterExemption equals zero (boundary at zero)', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 200_000,
        acquisitionCost: 75_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const hasPostSplitRateStep = result.steps.some((step) => step.label.includes('@ 12.5%'));
    expect(hasPostSplitRateStep).toBe(false);
    expect(result.value).toBe(0);
  });

  it('should emit the post-split @ 12.5% step with exact label, formula, inputs, and FA-2024 + Circ-12-2024 citations', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const postSplitTaxStep = result.steps.find((step) => step.label.includes('from 23-Jul-2024'));
    expect(postSplitTaxStep).toMatchObject({
      label: 'LTCG. Listed equity (from 23-Jul-2024) @ 12.5%',
      formula: '(gain - exemption_spill) x 0.125',
      inputs: {
        taxable: 400_000 - LTCG_112A_CONSOLIDATED_EXEMPTION,
        rate: 0.125,
      },
      output: Math.round((400_000 - LTCG_112A_CONSOLIDATED_EXEMPTION) * 0.125),
    });
    expect(postSplitTaxStep?.citations).toEqual([
      SECTIONS.SEC_112A,
      FINANCE_ACTS.FA_2024,
      CIRCULARS.CBDT_CIRC_12_2024,
    ]);
  });

  it('should aggregate citations from steps via flatMap (not produce an empty / single-citation set)', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.citations).toContainEqual(SECTIONS.SEC_112A);
    expect(result.citations).toContainEqual(FINANCE_ACTS.FA_2024);
    expect(result.citations).toContainEqual(CIRCULARS.CBDT_CIRC_12_2024);
    expect(result.citations.length).toBeGreaterThanOrEqual(3);
  });

  it('should return exactly [SEC_112A] on the no-taxable empty-input path (kills [] mutant on the seed citations array)', () => {
    const result = computeLtcg112A({ transactions: [], ay: ASSESSMENT_YEAR });
    expect(result.citations).toEqual([SECTIONS.SEC_112A]);
  });

  it('should treat fmvJan312018 of -1 as undefined-equivalent (greater than zero check, not just defined)', () => {
    const transactionsNegativeFmv: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2017-01-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
        fmvJan312018: -1,
      },
    ];
    const transactionsNoFmv: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2017-01-01',
        saleConsideration: 500_000,
        acquisitionCost: 100_000,
      },
    ];
    const withNegative = computeLtcg112A({
      transactions: transactionsNegativeFmv,
      ay: ASSESSMENT_YEAR,
    });
    const withoutFmv = computeLtcg112A({
      transactions: transactionsNoFmv,
      ay: ASSESSMENT_YEAR,
    });
    expect(withNegative.value).toBe(withoutFmv.value);
  });

  it('should not apply grandfathering when fmvJan312018 is exactly zero, even if acquisitionCost is negative (kills fmv > 0 -> true and fmv >= 0 mutants)', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2017-01-01',
        saleConsideration: 500_000,
        acquisitionCost: -200_000,
        fmvJan312018: 0,
      },
    ];
    const result = computeLtcg112A({ transactions, ay: ASSESSMENT_YEAR });
    const grossGainWithoutGrandfathering = 500_000 - -200_000;
    const taxable = grossGainWithoutGrandfathering - LTCG_112A_CONSOLIDATED_EXEMPTION;
    expect(result.value).toBe(Math.round(taxable * 0.125));
  });
});
