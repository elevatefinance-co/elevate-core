/* Tests for the Section 49 / Bhojison-ruling RSU sale cost-basis computation.
 * Cost of acquisition for a later sale of RSU / ESOP-acquired shares is the FMV-AT-VEST per unit,
 * not the exercise price (the exercise price has already been accounted for via the perquisite at vest).
 * The output triple (costBasisInr, saleProceedsInr,
 * netGainInr) feeds directly into 112 / 112A capital-gains modules. Pinned: Indian straight-INR sale,
 * foreign-listed sale converts via SBI TTBR on sale date, broker-commission reduces sale proceeds,
 * loss-making sale yields negative net gain, and the Section 48 + 17(2)(vi) citation chain. Citations:
 * Section 48 (computation of capital gains), Section 17(2)(vi) (anchor for FMV-at-vest as cost basis).
 */

import { computeSaleCostBasis } from '../../src/rsu-perquisite/sale-cost-basis.js';
import type { RsuGrant, RsuSaleEvent } from '../../src/rsu-perquisite/types.js';

const ASSESSMENT_YEAR = 'AY2025-26' as const;

const INDIAN_GRANT: RsuGrant = {
  grantId: 'grant-in-1',
  employer: 'Infosys',
  grantDate: '2023-04-01',
  totalUnits: 1_000,
  exercisePriceInOriginalCurrency: 0,
  originalCurrency: 'INR',
  listingStatus: 'LISTED_INDIAN_EXCHANGE',
};

const US_GRANT: RsuGrant = {
  grantId: 'grant-us-1',
  employer: 'Google',
  grantDate: '2023-04-01',
  totalUnits: 100,
  exercisePriceInOriginalCurrency: 0,
  originalCurrency: 'USD',
  listingStatus: 'LISTED_FOREIGN_EXCHANGE',
  exchangeCountryIso2: 'US',
};

describe('computeSaleCostBasis', () => {
  it('should compute INR cost basis from FMV-at-vest x units for an Indian sale', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value.costBasisInr).toBe(150_000);
    expect(result.value.saleProceedsInr).toBe(180_000);
    expect(result.value.netGainInr).toBe(30_000);
  });

  it('should convert foreign-listed sale price via SBI TTBR on the sale date', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 250,
      originalCurrency: 'USD',
      sbiTtbrOnSaleDate: 84,
    };
    const result = computeSaleCostBasis({
      grant: US_GRANT,
      sale,
      fmvPerUnitAtVestInr: Math.round(200 * 83.5),
      ay: ASSESSMENT_YEAR,
    });
    const expectedProceeds = Math.round(250 * 84 * 100);
    const expectedBasis = Math.round(200 * 83.5) * 100;
    expect(result.value.saleProceedsInr).toBe(expectedProceeds);
    expect(result.value.costBasisInr).toBe(expectedBasis);
    expect(result.value.netGainInr).toBe(expectedProceeds - expectedBasis);
  });

  it('should reduce sale proceeds by broker commission', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
      brokerCommissionInr: 500,
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value.saleProceedsInr).toBe(180_000 - 500);
    expect(result.value.netGainInr).toBe(180_000 - 500 - 150_000);
  });

  it('should produce a negative net gain on a loss-making sale (no flooring at zero -- caller composes)', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_200,
      originalCurrency: 'INR',
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value.netGainInr).toBe(-30_000);
  });

  it('should default sbiTtbrOnSaleDate to 1 for a (degenerate) Indian-listed grant denominated in INR', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 50,
      salePricePerUnitInOriginalCurrency: 1_000,
      originalCurrency: 'INR',
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 800,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value.saleProceedsInr).toBe(50_000);
    expect(result.value.costBasisInr).toBe(40_000);
  });

  it('should floor sale proceeds at zero when broker commission exceeds gross proceeds', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 1,
      salePricePerUnitInOriginalCurrency: 100,
      originalCurrency: 'INR',
      brokerCommissionInr: 500,
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 80,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value.saleProceedsInr).toBe(0);
  });

  it('should cite Section 48 and Section 17(2)(vi) on every computation', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    const hasSec48 = result.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '48',
    );
    const hasSec17 = result.citations.some(
      (citation) =>
        citation.kind === 'section' && citation.section === '17' && citation.subSection === '2',
    );
    expect(hasSec48).toBe(true);
    expect(hasSec17).toBe(true);
  });

  it('should pin the cost-basis step exactly (label, formula, output, citations Section 48 + Section 17(2)(vi))', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(3);
    const costBasisStep = result.steps[0];
    expect(costBasisStep?.label).toBe('Cost of acquisition for sale. FMV at vest');
    expect(costBasisStep?.formula).toBe('fmv_per_unit_at_vest_INR x units_sold');
    expect(costBasisStep?.output).toBe(150_000);
    expect(costBasisStep?.citations).toEqual([
      {
        kind: 'section',
        act: 'IT_ACT_1961',
        section: '48',
        note: 'Mode of computation of capital gains',
      },
      {
        kind: 'section',
        act: 'IT_ACT_1961',
        section: '17',
        subSection: '2',
        clause: 'vi',
        note: 'Perquisite. Securities / sweat equity (RSU/ESOP)',
      },
    ]);
    expect(costBasisStep).toMatchObject({
      inputs: {
        fmvPerUnitAtVestInr: 1_500,
        unitsSold: 100,
        costBasisInr: 150_000,
      },
    });
  });

  it('should pin the sale-proceeds step for an Indian-listed grant (formula "(sale_price x units) - broker_commission" + Section 48)', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
      brokerCommissionInr: 500,
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    const proceedsStep = result.steps.find((step) => step.label === 'Sale proceeds in INR');
    expect(proceedsStep).toBeDefined();
    expect(proceedsStep?.formula).toBe('(sale_price x units) - broker_commission');
    expect(proceedsStep?.output).toBe(180_000 - 500);
    expect(proceedsStep?.citations).toEqual([
      {
        kind: 'section',
        act: 'IT_ACT_1961',
        section: '48',
        note: 'Mode of computation of capital gains',
      },
    ]);
    expect(proceedsStep?.inputs?.salePricePerUnitInOriginalCurrency).toBe(1_800);
    expect(proceedsStep?.inputs?.ttbrOnSale).toBe(1);
    expect(proceedsStep?.inputs?.unitsSold).toBe(100);
    expect(proceedsStep?.inputs?.saleValueGrossInr).toBe(180_000);
    expect(proceedsStep?.inputs?.brokerCommissionInr).toBe(500);
    expect(proceedsStep?.inputs?.saleProceedsInr).toBe(180_000 - 500);
  });

  it('should pin the sale-proceeds step for a foreign-listed grant (formula "(sale_price_foreign x SBI_TTBR_on_sale x units) - broker_commission")', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 250,
      originalCurrency: 'USD',
      sbiTtbrOnSaleDate: 84,
      brokerCommissionInr: 1_000,
    };
    const result = computeSaleCostBasis({
      grant: US_GRANT,
      sale,
      fmvPerUnitAtVestInr: Math.round(200 * 83.5),
      ay: ASSESSMENT_YEAR,
    });
    const proceedsStep = result.steps.find((step) => step.label === 'Sale proceeds in INR');
    expect(proceedsStep).toBeDefined();
    expect(proceedsStep?.formula).toBe(
      '(sale_price_foreign x SBI_TTBR_on_sale x units) - broker_commission',
    );
    const grossInr = Math.round(250 * 84 * 100);
    expect(proceedsStep?.output).toBe(grossInr - 1_000);
    expect(proceedsStep?.inputs?.ttbrOnSale).toBe(84);
    expect(proceedsStep?.inputs?.saleValueGrossInr).toBe(grossInr);
  });

  it('should pin the net-gain step exactly (label, formula, output, citations Section 48)', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    const netGainStep = result.steps.find((step) => step.label === 'Net gain / loss from sale');
    expect(netGainStep).toBeDefined();
    expect(netGainStep?.formula).toBe('sale_proceeds_INR - cost_basis_INR');
    expect(netGainStep?.output).toBe(30_000);
    expect(netGainStep?.citations).toEqual([
      {
        kind: 'section',
        act: 'IT_ACT_1961',
        section: '48',
        note: 'Mode of computation of capital gains',
      },
    ]);
    expect(netGainStep).toMatchObject({
      inputs: {
        saleProceedsInr: 180_000,
        costBasisInr: 150_000,
        netGainInr: 30_000,
      },
    });
  });

  it('should emit exactly three steps in order: cost-basis, sale-proceeds, net-gain (kills empty-array mutant on initial steps)', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.steps).toHaveLength(3);
    expect(result.steps[0]?.label).toBe('Cost of acquisition for sale. FMV at vest');
    expect(result.steps[1]?.label).toBe('Sale proceeds in INR');
    expect(result.steps[2]?.label).toBe('Net gain / loss from sale');
  });

  it('should anchor FMV-at-vest as cost basis under Section 17(2)(vi) so post-vest movement is the capital-gains slice (Section 49(2AA) economics, LTCG-shape)', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2026-04-15',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 2_500,
      originalCurrency: 'INR',
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value.costBasisInr).toBe(150_000);
    expect(result.value.saleProceedsInr).toBe(250_000);
    expect(result.value.netGainInr).toBe(100_000);
  });

  it('should anchor FMV-at-vest as cost basis for a short hold from vest (STCG-shape downstream)', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-04-10',
      unitsSold: 50,
      salePricePerUnitInOriginalCurrency: 1_700,
      originalCurrency: 'INR',
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value.costBasisInr).toBe(75_000);
    expect(result.value.saleProceedsInr).toBe(85_000);
    expect(result.value.netGainInr).toBe(10_000);
  });

  it('should ignore sbiTtbrOnSaleDate for an Indian-listed grant even when the caller supplies a non-1 rate (kills "true" listingStatus mutant on saleValueGrossInr)', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
      sbiTtbrOnSaleDate: 84,
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    expect(result.value.saleProceedsInr).toBe(180_000);
    expect(result.value.netGainInr).toBe(30_000);
  });

  it('should propagate Section 48 and Section 17(2)(vi) into the deduped citations across all three steps', () => {
    const sale: RsuSaleEvent = {
      saleDate: '2025-03-01',
      unitsSold: 100,
      salePricePerUnitInOriginalCurrency: 1_800,
      originalCurrency: 'INR',
    };
    const result = computeSaleCostBasis({
      grant: INDIAN_GRANT,
      sale,
      fmvPerUnitAtVestInr: 1_500,
      ay: ASSESSMENT_YEAR,
    });
    const sec48Count = result.citations.filter(
      (citation) => citation.kind === 'section' && citation.section === '48',
    ).length;
    const sec17Count = result.citations.filter(
      (citation) =>
        citation.kind === 'section' && citation.section === '17' && citation.subSection === '2',
    ).length;
    expect(sec48Count).toBe(1);
    expect(sec17Count).toBe(1);
  });
});
