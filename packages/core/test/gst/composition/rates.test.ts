/* Tests for the composition tax rate computer. Three categories,
 * three rates encoded as basis points so floating-point never enters tax arithmetic:
 * manufacturer / trader 1 percent (100 bp), restaurant 5 percent (500 bp),
 * other services under Section 10(2A) 6 percent (600 bp).
 * Each rate splits equally between CGST and SGST.
 * The compute helper takes turnover in paise and returns CGST + SGST + total in paise via integer arithmetic.
 * Pinned: each category's basis-point rate, the half-split,
 * and the turnover-times-rate computation across realistic crore-scale inputs. Citations:
 * CGST Act 2017 Section 10, CBIC Notification 8/2017-CT (Rate).
 */

import {
  computeCompositionTaxPaise,
  getCompositionRate,
} from '../../../src/gst/composition/rates.js';

describe('getCompositionRate', () => {
  it('should pin the manufacturer / trader category at 1 percent (100 bp) split equally', () => {
    const rate = getCompositionRate('MANUFACTURER_OR_TRADER');
    expect(rate.totalRateBasisPoints).toBe(100);
    expect(rate.cgstRateBasisPoints).toBe(50);
    expect(rate.sgstRateBasisPoints).toBe(50);
  });

  it('should pin the restaurant category at 5 percent (500 bp) split equally', () => {
    const rate = getCompositionRate('RESTAURANT_WITHOUT_ALCOHOL');
    expect(rate.totalRateBasisPoints).toBe(500);
    expect(rate.cgstRateBasisPoints).toBe(250);
    expect(rate.sgstRateBasisPoints).toBe(250);
  });

  it('should pin the services 10(2A) category at 6 percent (600 bp) split equally', () => {
    const rate = getCompositionRate('OTHER_SERVICES_S10_2A');
    expect(rate.totalRateBasisPoints).toBe(600);
    expect(rate.cgstRateBasisPoints).toBe(300);
    expect(rate.sgstRateBasisPoints).toBe(300);
  });

  it('should always cite Section 10 on the rate breakup citations', () => {
    const rate = getCompositionRate('MANUFACTURER_OR_TRADER');
    const hasSec10 = rate.citations.some(
      (citation) => citation.kind === 'section' && citation.section === '10',
    );
    expect(hasSec10).toBe(true);
  });
});

describe('computeCompositionTaxPaise', () => {
  it('should compute Rs. 1 lakh tax for Rs. 1 crore turnover under manufacturer / trader (1 percent)', () => {
    const result = computeCompositionTaxPaise({
      aggregateTurnoverPaise: 1_000_000_000n,
      category: 'MANUFACTURER_OR_TRADER',
    });
    expect(result.totalPaise).toBe(10_000_000n);
    expect(result.cgstPaise).toBe(5_000_000n);
    expect(result.sgstPaise).toBe(5_000_000n);
  });

  it('should compute Rs. 5 lakh tax for Rs. 1 crore turnover under restaurant (5 percent)', () => {
    const result = computeCompositionTaxPaise({
      aggregateTurnoverPaise: 1_000_000_000n,
      category: 'RESTAURANT_WITHOUT_ALCOHOL',
    });
    expect(result.totalPaise).toBe(50_000_000n);
  });

  it('should compute Rs. 3 lakh tax for Rs. 50 lakh turnover under services (6 percent)', () => {
    const result = computeCompositionTaxPaise({
      aggregateTurnoverPaise: 500_000_000n,
      category: 'OTHER_SERVICES_S10_2A',
    });
    expect(result.totalPaise).toBe(30_000_000n);
    expect(result.cgstPaise).toBe(15_000_000n);
    expect(result.sgstPaise).toBe(15_000_000n);
  });

  it('should return zero tax for zero turnover under any category', () => {
    const result = computeCompositionTaxPaise({
      aggregateTurnoverPaise: 0n,
      category: 'RESTAURANT_WITHOUT_ALCOHOL',
    });
    expect(result.totalPaise).toBe(0n);
    expect(result.cgstPaise).toBe(0n);
    expect(result.sgstPaise).toBe(0n);
  });

  it('should expose the rate breakup alongside the computed paise', () => {
    const result = computeCompositionTaxPaise({
      aggregateTurnoverPaise: 1_000_000_000n,
      category: 'MANUFACTURER_OR_TRADER',
    });
    expect(result.rate.category).toBe('MANUFACTURER_OR_TRADER');
    expect(result.rate.totalRateBasisPoints).toBe(100);
  });
});
