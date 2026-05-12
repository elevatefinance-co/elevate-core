/* Tests for Section 111A short-term capital gains on STT-paid listed equity. The pre-23-Jul-2024 rate is
 * 15 percent; the post-split rate is 20 percent (Finance (No. 2) Act 2024). A mixed-portfolio with sales on
 * both sides of the cliff splits by saleDate. Loss transactions floor at zero (no set-off). Pinned:
 * pre-split 15 percent path, post-split 20 percent path, mixed-portfolio split, loss-floors-at-zero,
 * empty-input default step, and the Section 111A + Finance Act 2024 + CBDT Circular 12/2024 citation chain.
 * Citations: Section 111A, Finance (No. 2) Act 2024, CBDT Circular 12/2024 (post-split rate clarifications).
 */

import {
  computeStcg111A,
  type ComputeStcg111AArgs,
} from '../../src/capital-gains/listed-equity-stcg.js';
import { SECTIONS, FINANCE_ACTS, CIRCULARS } from '../../src/citations/index.js';
import type { ListedEquityTxn } from '../../src/capital-gains/shared.js';

const ASSESSMENT_YEAR: ComputeStcg111AArgs['ay'] = 'AY2025-26';

describe('computeStcg111A', () => {
  it('should apply 15 percent to a pre-split sale', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-05-01',
        purchaseDate: '2023-11-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(15_000);
    expect(result.steps[0]?.label).toContain('15%');
  });

  it('should apply 20 percent to a post-split sale', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-15',
        purchaseDate: '2024-02-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(20_000);
    expect(result.steps[0]?.label).toContain('20%');
  });

  it('should split a mixed-date portfolio and sum both sides correctly', () => {
    const transactions: ListedEquityTxn[] = [
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
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(15_000 + 20_000);
  });

  it('should floor a loss-making transaction at zero (no set-off)', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-08-01',
        purchaseDate: '2024-03-01',
        saleConsideration: 80_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
  });

  it('should subtract transferExpenses before computing the gain', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-01',
        purchaseDate: '2024-02-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
        transferExpenses: 10_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(Math.round(90_000 * 0.2));
  });

  it('should return zero with a default step for empty input', () => {
    const result = computeStcg111A({ transactions: [], ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.label).toMatch(/No taxable STCG/);
  });

  it('should cite Section 111A on every computation', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-15',
        purchaseDate: '2024-02-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    const hasSection111A = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '111A',
    );
    expect(hasSection111A).toBe(true);
  });

  it('should cite Finance Act 2024 + Circular 12/2024 on a post-split computation', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-15',
        purchaseDate: '2024-02-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    const hasFa2024 = result.citations.some(
      (citation) => citation.kind === 'finance-act' && citation.year === 2024,
    );
    const hasCirc = result.citations.some(
      (citation) => citation.kind === 'circular' && citation.number === '12/2024',
    );
    expect(hasFa2024).toBe(true);
    expect(hasCirc).toBe(true);
  });
});

describe('computeStcg111A. Mutation-killer assertions', () => {
  it('should skip a transaction whose net gain is exactly zero (gain <= 0 boundary at zero)', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-15',
        purchaseDate: '2024-02-01',
        saleConsideration: 100_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.label).toBe('No taxable STCG under Section 111A');
  });

  it('should emit the pre-split @ 15% step with exact label, formula, inputs, output, and Section 111A citation', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-05-01',
        purchaseDate: '2023-11-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]).toMatchObject({
      label: 'STCG. Listed equity (pre 23-Jul-2024) @ 15%',
      formula: 'gain x 0.15',
      inputs: { gain: 100_000, rate: 0.15 },
      output: 15_000,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_111A]);
    expect(result.steps[0]?.citations).toHaveLength(1);
  });

  it('should emit the post-split @ 20% step with exact label, formula, inputs, output, and FA-2024 + Circ-12-2024 citations', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-15',
        purchaseDate: '2024-02-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]).toMatchObject({
      label: 'STCG. Listed equity (from 23-Jul-2024) @ 20%',
      formula: 'gain x 0.20',
      inputs: { gain: 100_000, rate: 0.2 },
      output: 20_000,
    });
    expect(result.steps[0]?.citations).toEqual([
      SECTIONS.SEC_111A,
      FINANCE_ACTS.FA_2024,
      CIRCULARS.CBDT_CIRC_12_2024,
    ]);
  });

  it('should NOT emit the no-taxable default step when at least one rate step was pushed', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-09-15',
        purchaseDate: '2024-02-01',
        saleConsideration: 500_000,
        acquisitionCost: 400_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    const hasNoTaxableStep = result.steps.some(
      (step) => step.label === 'No taxable STCG under Section 111A',
    );
    expect(hasNoTaxableStep).toBe(false);
  });

  it('should emit the no-taxable default step with exact label, formula, inputs, and Section 111A citation', () => {
    const result = computeStcg111A({ transactions: [], ay: ASSESSMENT_YEAR });
    expect(result.steps[0]).toMatchObject({
      label: 'No taxable STCG under Section 111A',
      formula: 'sum(gains) = 0',
      inputs: { transactions: 0 },
      output: 0,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_111A]);
  });

  it('should record transactions count in default step inputs (not empty) when only loss txns present', () => {
    const transactions: ListedEquityTxn[] = [
      {
        saleDate: '2024-08-01',
        purchaseDate: '2024-03-01',
        saleConsideration: 80_000,
        acquisitionCost: 100_000,
      },
      {
        saleDate: '2024-09-01',
        purchaseDate: '2024-03-01',
        saleConsideration: 70_000,
        acquisitionCost: 90_000,
      },
    ];
    const result = computeStcg111A({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]?.inputs).toEqual({ transactions: 2 });
  });
});
