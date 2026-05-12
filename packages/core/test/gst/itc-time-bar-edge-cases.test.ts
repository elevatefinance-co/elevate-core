/* Edge-case coverage for the Section 16(4) ITC time-bar checker. Pinned:
 * the boundary date inclusivity (Nov 30 of the following FY is the last valid claim day, not Dec 1),
 * the annual-return-filed-on path beats Nov 30 only when it is earlier (otherwise Nov 30 wins),
 * and the cross-FY claim window is correctly aligned to fyStartYear (so an FY 2024-25 invoice has cutoff
 * Nov 30 2025,
 * not Nov 30 2024).
 *
 * Primary source: Section 16(4) of the CGST Act 2017.
 */

import { checkSection16TimeBar } from '../../src/gst/itc/index.js';

const NOV_30_2025 = new Date(Date.UTC(2025, 10, 30, 0, 0, 0));
const DEC_1_2025 = new Date(Date.UTC(2025, 11, 1, 0, 0, 0));
const NOV_15_2025 = new Date(Date.UTC(2025, 10, 15, 0, 0, 0));
const FY24_25 = 2024;
const FY23_24 = 2023;

describe('checkSection16TimeBar -- Nov 30 boundary inclusivity', () => {
  it('should treat a claim filed exactly on Nov 30 of the following FY as within the window (boundary inclusive)', () => {
    const result = checkSection16TimeBar({
      fyStartYear: FY24_25,
      proposedClaimDate: NOV_30_2025,
    });
    expect(result.withinWindow).toBe(true);
    expect(result.cutOffReason).toBe('NOVEMBER_30_NEXT_FY');
    expect(result.cutOffDate.getTime()).toBe(NOV_30_2025.getTime());
  });

  it('should reject a claim filed on Dec 1 of the following FY (one day past the cutoff)', () => {
    const result = checkSection16TimeBar({
      fyStartYear: FY24_25,
      proposedClaimDate: DEC_1_2025,
    });
    expect(result.withinWindow).toBe(false);
    expect(result.cutOffReason).toBe('NOVEMBER_30_NEXT_FY');
  });
});

describe('checkSection16TimeBar -- earlier-of (annual-return-filed vs Nov 30)', () => {
  it('should switch the cutoff to the annual-return date when the return is filed before Nov 30', () => {
    const result = checkSection16TimeBar({
      fyStartYear: FY24_25,
      proposedClaimDate: NOV_15_2025,
      annualReturnFiledOn: new Date(Date.UTC(2025, 9, 1)),
    });
    expect(result.cutOffReason).toBe('ANNUAL_RETURN_FILED');
    expect(result.cutOffDate.getTime()).toBe(new Date(Date.UTC(2025, 9, 1)).getTime());
    expect(result.withinWindow).toBe(false);
  });

  it('should keep Nov 30 as the cutoff when the annual return is filed after Nov 30 (later date does not extend the window)', () => {
    const result = checkSection16TimeBar({
      fyStartYear: FY24_25,
      proposedClaimDate: NOV_15_2025,
      annualReturnFiledOn: new Date(Date.UTC(2026, 0, 5)),
    });
    expect(result.cutOffReason).toBe('NOVEMBER_30_NEXT_FY');
    expect(result.cutOffDate.getTime()).toBe(NOV_30_2025.getTime());
    expect(result.withinWindow).toBe(true);
  });

  it('should keep Nov 30 as the cutoff when the annual return is filed exactly on Nov 30 (tie does not switch)', () => {
    const result = checkSection16TimeBar({
      fyStartYear: FY24_25,
      proposedClaimDate: NOV_15_2025,
      annualReturnFiledOn: NOV_30_2025,
    });
    expect(result.cutOffReason).toBe('NOVEMBER_30_NEXT_FY');
  });
});

describe('checkSection16TimeBar -- fyStartYear alignment', () => {
  it('should compute a Nov 30 2024 cutoff for an FY 2023-24 invoice (cross-FY+1 alignment)', () => {
    const result = checkSection16TimeBar({
      fyStartYear: FY23_24,
      proposedClaimDate: new Date(Date.UTC(2024, 10, 30)),
    });
    expect(result.cutOffDate.getUTCFullYear()).toBe(2024);
    expect(result.cutOffDate.getUTCMonth()).toBe(10);
    expect(result.cutOffDate.getUTCDate()).toBe(30);
  });

  it('should reject a claim made in the same calendar year as the invoice when fyStartYear is later than the claim year', () => {
    const result = checkSection16TimeBar({
      fyStartYear: 2024,
      proposedClaimDate: new Date(Date.UTC(2024, 11, 31)),
    });
    expect(result.withinWindow).toBe(true);
  });
});

describe('checkSection16TimeBar -- citations carry the right CGST sections', () => {
  it('should include both Section 16 and Section 16(4) in the citations', () => {
    const result = checkSection16TimeBar({
      fyStartYear: FY24_25,
      proposedClaimDate: NOV_15_2025,
    });
    const sectionRefs = result.citations
      .filter((c) => c.kind === 'section')
      .map((c) => `${c.section}${c.subSection ? `(${c.subSection})` : ''}`);
    expect(sectionRefs).toContain('16');
    expect(sectionRefs).toContain('16(4)');
  });
});
