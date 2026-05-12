/* Tests for Section 115BBH virtual digital assets. Finance Act 2022 introduced the punitive design:
 * 30 percent flat on every gain, zero set-off of any loss against any head,
 * zero deduction other than acquisition cost.
 * The per-transaction floor at zero is the load-bearing rule -- two VDA transactions cannot net out even
 * within the same wallet.
 * Pinned: 30 percent flat, no-set-off semantic, all-loss returns zero with default step,
 * and the Section 115BBH + Finance Act 2022 + Section 194S citation chain. Citations: Section 115BBH,
 * Finance Act 2022, Section 194S (TDS at 1 percent on every transfer above threshold).
 */

import { computeVdaTax } from '../../src/capital-gains/vda.js';
import { SECTIONS, FINANCE_ACTS } from '../../src/citations/index.js';
import type { VdaTxn } from '../../src/capital-gains/shared.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

describe('computeVdaTax', () => {
  it('should apply 30 percent to a single gain transaction', () => {
    const transactions: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 500_000,
        acquisitionCost: 300_000,
      },
    ];
    const result = computeVdaTax({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(60_000);
  });

  it('should refuse set-off so a loss does not reduce a gain in the same portfolio', () => {
    const transactions: VdaTxn[] = [
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
    const result = computeVdaTax({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(60_000);
  });

  it('should return zero with a default step for an all-loss portfolio', () => {
    const transactions: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 100_000,
        acquisitionCost: 300_000,
      },
    ];
    const result = computeVdaTax({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.label).toMatch(/No taxable VDA gain/);
  });

  it('should return zero with a default step for empty input', () => {
    const result = computeVdaTax({ transactions: [], ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    expect(result.steps).toHaveLength(1);
  });

  it('should aggregate multiple gain transactions before applying the 30 percent rate', () => {
    const transactions: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 200_000,
        acquisitionCost: 100_000,
      },
      {
        saleDate: '2025-03-10',
        saleConsideration: 500_000,
        acquisitionCost: 300_000,
      },
    ];
    const result = computeVdaTax({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(90_000);
  });

  it('should cite Section 115BBH and Finance Act 2022 on every computation', () => {
    const transactions: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 500_000,
        acquisitionCost: 300_000,
      },
    ];
    const result = computeVdaTax({ transactions, ay: ASSESSMENT_YEAR });
    const hasSec115BBH = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '115BBH',
    );
    const hasFa2022 = result.citations.some(
      (citation) => citation.kind === 'finance-act' && citation.year === 2022,
    );
    expect(hasSec115BBH).toBe(true);
    expect(hasFa2022).toBe(true);
  });

  it('should cite Section 194S (TDS on VDA transfer) on a non-zero result', () => {
    const transactions: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 500_000,
        acquisitionCost: 300_000,
      },
    ];
    const result = computeVdaTax({ transactions, ay: ASSESSMENT_YEAR });
    const hasSec194S = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '194S',
    );
    expect(hasSec194S).toBe(true);
  });
});

describe('computeVdaTax. Mutation-killer assertions', () => {
  it('should skip a transaction whose net gain is exactly zero (gain <= 0 boundary at zero)', () => {
    const transactions: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 100_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeVdaTax({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    expect(result.steps[0]?.label).toBe('No taxable VDA gain');
  });

  it('should emit the gain step with exact label, formula, inputs, output, and citations', () => {
    const transactions: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 500_000,
        acquisitionCost: 300_000,
      },
    ];
    const result = computeVdaTax({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toMatchObject({
      label: 'Virtual digital assets @ 30%. Section 115BBH',
      formula: 'sum(max(0, sale - cost)) x 0.30',
      inputs: { totalGain: 200_000, rate: 0.3, transactions: 1 },
      output: 60_000,
    });
    expect(result.steps[0]?.citations).toEqual([
      SECTIONS.SEC_115BBH,
      FINANCE_ACTS.FA_2022,
      SECTIONS.SEC_194S,
    ]);
  });

  it('should emit the no-taxable default step with exact label, formula, inputs, and citation set', () => {
    const transactions: VdaTxn[] = [
      {
        saleDate: '2025-02-10',
        saleConsideration: 50_000,
        acquisitionCost: 100_000,
      },
      {
        saleDate: '2025-03-10',
        saleConsideration: 20_000,
        acquisitionCost: 30_000,
      },
    ];
    const result = computeVdaTax({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]).toMatchObject({
      label: 'No taxable VDA gain',
      formula: 'sum(gains) = 0',
      inputs: { transactions: 2 },
      output: 0,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_115BBH]);
    expect(result.steps[0]?.citations).toHaveLength(1);
  });

  it('should aggregate citations from steps via flatMap (FA-2022 + SEC_115BBH baseline preserved when no gain)', () => {
    const result = computeVdaTax({ transactions: [], ay: ASSESSMENT_YEAR });
    expect(result.citations).toContainEqual(SECTIONS.SEC_115BBH);
    expect(result.citations).toContainEqual(FINANCE_ACTS.FA_2022);
  });
});
