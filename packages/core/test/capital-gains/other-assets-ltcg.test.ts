/* Tests for Section 112 long-term capital gains on assets other than STT-paid listed equity.
 * Three rate paths: pre-23-Jul-2024 20 percent (with caller-supplied indexed cost),
 * post-split default 12.5 percent without indexation,
 * and the second-proviso indexation-option for a resident individual / HUF on land / building acquired
 * before 23 July 2024 (whichever produces lower tax,
 * the caller signals via indexationOptIn). Pinned: each path's rate,
 * exemptions-claimed subtraction (Section 54 family), non-resident is denied the indexation option,
 * the Section 112 + FA 2024 + CBDT Circular 12/2024 citation chain. Citations: Section 112,
 * Section 48 (when indexation opt-in), Finance (No. 2) Act 2024, CBDT Circular 12/2024.
 */

import { computeLtcg112 } from '../../src/capital-gains/other-assets-ltcg.js';
import { SECTIONS, FINANCE_ACTS, CIRCULARS } from '../../src/citations/index.js';
import type { OtherAssetTxn } from '../../src/capital-gains/shared.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

describe('computeLtcg112', () => {
  it('should apply 20 percent to a pre-split sale', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-06-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(Math.round(5_000_000 * 0.2));
  });

  it('should apply 12.5 percent to a post-split sale by default (no indexation)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'UNLISTED_EQUITY',
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 500_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(Math.round(500_000 * 0.125));
  });

  it('should apply 20 percent with indexation when a resident individual/HUF opts in on pre-23-Jul land', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({
      transactions,
      ay: ASSESSMENT_YEAR,
      isResidentIndividualOrHuf: true,
    });
    expect(result.value).toBe(Math.round(3_000_000 * 0.2));
    const indexationStep = result.steps.find((step) => step.label.includes('indexation option'));
    expect(indexationStep).toBeDefined();
  });

  it('should deny the indexation option to a non-resident even on pre-23-Jul land', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({
      transactions,
      ay: ASSESSMENT_YEAR,
      isResidentIndividualOrHuf: false,
    });
    expect(result.value).toBe(Math.round(3_000_000 * 0.125));
  });

  it('should deny the indexation option for non-land/building (e.g. unlisted equity) even when the resident flag is true', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'UNLISTED_EQUITY',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 500_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({
      transactions,
      ay: ASSESSMENT_YEAR,
      isResidentIndividualOrHuf: true,
    });
    expect(result.value).toBe(Math.round(500_000 * 0.125));
  });

  it('should subtract claimed Section 54 / 54F exemptions from the gain before applying the rate', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
        exemptionsClaimed: [{ section: '54', amount: 3_000_000 }],
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    const taxableGain = 5_000_000 - 3_000_000;
    expect(result.value).toBe(Math.round(taxableGain * 0.125));
  });

  it('should subtract improvementCost and transferExpenses before applying the rate', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 4_000_000,
        improvementCost: 1_000_000,
        transferExpenses: 200_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    const grossGain = 10_000_000 - 4_000_000 - 1_000_000 - 200_000;
    expect(result.value).toBe(Math.round(grossGain * 0.125));
  });

  it('should return zero with a default step for empty input', () => {
    const result = computeLtcg112({ transactions: [], ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.label).toMatch(/No taxable LTCG/);
  });

  it('should floor a loss-making transaction at zero (no set-off across other-asset gains)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'GOLD_OR_JEWELLERY',
        saleDate: '2024-09-01',
        purchaseDate: '2018-09-01',
        saleConsideration: 100_000,
        acquisitionCost: 200_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
  });

  it('should cite Section 112 on every computation', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-06-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    const hasSection112 = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '112',
    );
    expect(hasSection112).toBe(true);
  });

  it('should cite Finance Act 2024 + Circular 12/2024 on a post-split computation', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'UNLISTED_EQUITY',
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 500_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    const hasFa2024 = result.citations.some(
      (citation) => citation.kind === 'finance-act' && citation.year === 2024,
    );
    const hasCirc = result.citations.some(
      (citation) => citation.kind === 'circular' && citation.number === '12/2024',
    );
    expect(hasFa2024).toBe(true);
    expect(hasCirc).toBe(true);
  });

  it('should cite Section 48 when the indexation option is used', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({
      transactions,
      ay: ASSESSMENT_YEAR,
      isResidentIndividualOrHuf: true,
    });
    const hasSection48 = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '48',
    );
    expect(hasSection48).toBe(true);
  });
});

describe('computeLtcg112. Mutation-killer assertions', () => {
  it('should sum exemptionsClaimed entries (not produce an empty array placeholder) before subtracting', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
        exemptionsClaimed: [
          { section: '54', amount: 1_500_000 },
          { section: '54EC', amount: 500_000 },
        ],
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    const taxableGain = 5_000_000 - 1_500_000 - 500_000;
    expect(result.value).toBe(Math.round(taxableGain * 0.125));
    expect(result.steps[0]?.inputs).toMatchObject({
      exemption: 2_000_000,
      taxableGain,
    });
  });

  it('should default isResidentIndividualOrHuf to false (deny indexation when caller omits the flag)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(Math.round(3_000_000 * 0.125));
    const indexationStep = result.steps.find((step) => step.label.includes('indexation option'));
    expect(indexationStep).toBeUndefined();
  });

  it('should skip a transaction whose gross gain is exactly zero (grossGain <= 0 boundary at zero)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'GOLD_OR_JEWELLERY',
        saleDate: '2024-09-01',
        purchaseDate: '2018-09-01',
        saleConsideration: 100_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    expect(result.steps[0]?.label).toBe('No taxable LTCG under Section 112');
  });

  it('should skip a transaction whose taxable gain is exactly zero after exemption (taxableGain <= 0 boundary at zero)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
        exemptionsClaimed: [{ section: '54', amount: 5_000_000 }],
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.value).toBe(0);
    expect(result.steps[0]?.label).toBe('No taxable LTCG under Section 112');
  });

  it('should treat IMMOVABLE_PROPERTY_BUILDING as land/building category (eligible for indexation option)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({
      transactions,
      ay: ASSESSMENT_YEAR,
      isResidentIndividualOrHuf: true,
    });
    expect(result.value).toBe(Math.round(3_000_000 * 0.2));
    const indexationStep = result.steps.find((step) => step.label.includes('indexation option'));
    expect(indexationStep).toBeDefined();
  });

  it('should deny the indexation option when purchase date is on or after 23-Jul-2024 (boundary)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2024-07-23',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({
      transactions,
      ay: ASSESSMENT_YEAR,
      isResidentIndividualOrHuf: true,
    });
    expect(result.value).toBe(Math.round(3_000_000 * 0.125));
    const indexationStep = result.steps.find((step) => step.label.includes('indexation option'));
    expect(indexationStep).toBeUndefined();
  });

  it('should permit the indexation option when purchase date is strictly before 23-Jul-2024 (boundary - 1 day)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2024-07-22',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({
      transactions,
      ay: ASSESSMENT_YEAR,
      isResidentIndividualOrHuf: true,
    });
    expect(result.value).toBe(Math.round(3_000_000 * 0.2));
    const indexationStep = result.steps.find((step) => step.label.includes('indexation option'));
    expect(indexationStep).toBeDefined();
  });

  it('should NOT push FA_2024 / Circ-12-2024 onto a pre-split transaction citation set', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-06-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_112]);
    expect(result.steps[0]?.citations).toHaveLength(1);
  });

  it('should push FA_2024 + Circ-12-2024 onto a post-split transaction citation set (no Section 48 without indexation)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'UNLISTED_EQUITY',
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 500_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]?.citations).toEqual([
      SECTIONS.SEC_112,
      FINANCE_ACTS.FA_2024,
      CIRCULARS.CBDT_CIRC_12_2024,
    ]);
  });

  it('should push Section 48 only when the indexation option is actually used', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({
      transactions,
      ay: ASSESSMENT_YEAR,
      isResidentIndividualOrHuf: true,
    });
    expect(result.steps[0]?.citations).toEqual([
      SECTIONS.SEC_112,
      FINANCE_ACTS.FA_2024,
      CIRCULARS.CBDT_CIRC_12_2024,
      SECTIONS.SEC_48,
    ]);
  });

  it('should produce a label with assetType.toLowerCase() when assetDescription is missing (and contain "(from 23-Jul-2024)")', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'GOLD_OR_JEWELLERY',
        saleDate: '2024-09-01',
        purchaseDate: '2020-09-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 600_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]?.label).toBe('LTCG. gold_or_jewellery (from 23-Jul-2024)');
  });

  it('should produce a label using assetDescription verbatim when supplied (??-fallback path is skipped)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'GOLD_OR_JEWELLERY',
        assetDescription: '24K Gold Bars',
        saleDate: '2024-09-01',
        purchaseDate: '2020-09-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 600_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]?.label).toBe('LTCG. 24K Gold Bars (from 23-Jul-2024)');
  });

  it('should produce a label with "(pre 23-Jul-2024)" suffix on a pre-split sale (and lowercase assetType)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'UNLISTED_EQUITY',
        saleDate: '2024-06-01',
        purchaseDate: '2020-06-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 500_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]?.label).toBe('LTCG. unlisted_equity (pre 23-Jul-2024)');
  });

  it('should append " - indexation option" to the label only when the indexation option is used', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({
      transactions,
      ay: ASSESSMENT_YEAR,
      isResidentIndividualOrHuf: true,
    });
    expect(result.steps[0]?.label).toBe(
      'LTCG. immovable_property_land (from 23-Jul-2024) - indexation option',
    );
  });

  it('should write the rate in the formula as percent x 100 (multiplication, not division) - 12.5% post-split path', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'UNLISTED_EQUITY',
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 500_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]?.formula).toBe(
      '(sale - cost - expenses - improvement - exemption) x 12.5%',
    );
  });

  it('should write the rate in the formula as 20.0% on the indexation-option path (not divided)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_LAND',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 7_000_000,
        indexationOptIn: true,
      },
    ];
    const result = computeLtcg112({
      transactions,
      ay: ASSESSMENT_YEAR,
      isResidentIndividualOrHuf: true,
    });
    expect(result.steps[0]?.formula).toBe(
      '(sale - cost - expenses - improvement - exemption) x 20.0%',
    );
  });

  it('should record improvementCost = 0 (not falsy short-circuit) when caller omits it, and pass through actual values otherwise', () => {
    const withoutImprovement: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
      },
    ];
    const withImprovement: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
        improvementCost: 250_000,
      },
    ];
    const resultWithout = computeLtcg112({
      transactions: withoutImprovement,
      ay: ASSESSMENT_YEAR,
    });
    const resultWith = computeLtcg112({
      transactions: withImprovement,
      ay: ASSESSMENT_YEAR,
    });
    expect(resultWithout.steps[0]?.inputs).toMatchObject({
      improvementCost: 0,
    });
    expect(resultWith.steps[0]?.inputs).toMatchObject({
      improvementCost: 250_000,
    });
  });

  it('should record transferExpenses = 0 (not falsy short-circuit) when caller omits it, and pass through actual values otherwise', () => {
    const withoutExpenses: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
      },
    ];
    const withExpenses: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 5_000_000,
        transferExpenses: 75_000,
      },
    ];
    const resultWithout = computeLtcg112({
      transactions: withoutExpenses,
      ay: ASSESSMENT_YEAR,
    });
    const resultWith = computeLtcg112({
      transactions: withExpenses,
      ay: ASSESSMENT_YEAR,
    });
    expect(resultWithout.steps[0]?.inputs).toMatchObject({
      transferExpenses: 0,
    });
    expect(resultWith.steps[0]?.inputs).toMatchObject({
      transferExpenses: 75_000,
    });
  });

  it('should emit the no-taxable default step with exact label, formula, inputs, and Section 112 citation when no txn produces a gain', () => {
    const result = computeLtcg112({ transactions: [], ay: ASSESSMENT_YEAR });
    expect(result.steps[0]).toMatchObject({
      label: 'No taxable LTCG under Section 112',
      formula: 'sum(gains) = 0',
      inputs: { transactions: 0 },
      output: 0,
    });
    expect(result.steps[0]?.citations).toEqual([SECTIONS.SEC_112]);
  });

  it('should record transactions count in default step inputs (not empty) when only loss txns present', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'GOLD_OR_JEWELLERY',
        saleDate: '2024-09-01',
        purchaseDate: '2018-09-01',
        saleConsideration: 100_000,
        acquisitionCost: 200_000,
      },
      {
        assetType: 'UNLISTED_EQUITY',
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 50_000,
        acquisitionCost: 100_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps[0]?.inputs).toEqual({ transactions: 2 });
  });

  it('should NOT push the no-taxable default step when at least one txn produces a per-txn step (kills steps.length === 0 -> true mutant)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'UNLISTED_EQUITY',
        saleDate: '2024-09-01',
        purchaseDate: '2022-09-01',
        saleConsideration: 1_000_000,
        acquisitionCost: 500_000,
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    expect(result.steps).toHaveLength(1);
    const hasNoTaxableStep = result.steps.some(
      (step) => step.label === 'No taxable LTCG under Section 112',
    );
    expect(hasNoTaxableStep).toBe(false);
  });

  it('should emit the per-txn step inputs object with the full canonical key set (not an empty object)', () => {
    const transactions: OtherAssetTxn[] = [
      {
        assetType: 'IMMOVABLE_PROPERTY_BUILDING',
        saleDate: '2024-09-01',
        purchaseDate: '2018-06-01',
        saleConsideration: 10_000_000,
        acquisitionCost: 4_000_000,
        improvementCost: 500_000,
        transferExpenses: 100_000,
        exemptionsClaimed: [{ section: '54', amount: 1_000_000 }],
      },
    ];
    const result = computeLtcg112({ transactions, ay: ASSESSMENT_YEAR });
    const grossGain = 10_000_000 - 4_000_000 - 500_000 - 100_000;
    const taxableGain = grossGain - 1_000_000;
    expect(result.steps[0]?.inputs).toEqual({
      saleConsideration: 10_000_000,
      acquisitionCost: 4_000_000,
      improvementCost: 500_000,
      transferExpenses: 100_000,
      exemption: 1_000_000,
      taxableGain,
      rate: 0.125,
    });
  });
});
