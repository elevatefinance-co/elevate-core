/* Tests for the Finance Acts citation registry.
 * Each entry tags a numeric Finance Act year so consumers can render "Changed by Finance Act YYYY" tooltips.
 * Pinned: every entry is a finance-act citation kind, the year is numeric,
 * and the headline FA 2024 / FA 2025 / FA 2022 / FA 2023 entries carry the section and note that anchor
 * downstream rule modules.
 * Citations: Finance (No. 2) Act 2024 (capital-gains rate cliff + revised new-regime slabs),
 * Finance Act 2025 (revised AY 2026-27 slabs + 87A to Rs. 12L),
 * Finance Act 2022 (Section 115BBH VDA + Section 194S), Finance Act 2023 (Section 50AA debt-MF).
 */

import { FINANCE_ACTS, fa } from '../../src/citations/finance-acts.js';

describe('FINANCE_ACTS registry', () => {
  it('should expose every entry as a finance-act citation kind', () => {
    for (const entry of Object.values(FINANCE_ACTS)) {
      expect(entry.kind).toBe('finance-act');
    }
  });

  it('should expose a numeric year on every entry', () => {
    for (const [registryKey, entry] of Object.entries(FINANCE_ACTS)) {
      expect(typeof entry.year, `${registryKey} year not numeric`).toBe('number');
      expect(Number.isFinite(entry.year)).toBe(true);
    }
  });

  it('should pin FA 2024 (capital-gains cliff + revised slabs)', () => {
    expect(FINANCE_ACTS.FA_2024.year).toBe(2024);
    expect(FINANCE_ACTS.FA_2024.note).toMatch(/12.5%|LTCG|new-regime/);
  });

  it('should pin FA 2025 (revised AY 2026-27 slabs + 87A to Rs. 12L)', () => {
    expect(FINANCE_ACTS.FA_2025.year).toBe(2025);
    expect(FINANCE_ACTS.FA_2025.note).toMatch(/4L|12L|87A/);
  });

  it('should pin FA 2022 (Section 115BBH VDA + Section 194S)', () => {
    expect(FINANCE_ACTS.FA_2022.year).toBe(2022);
    expect(FINANCE_ACTS.FA_2022.section).toBe('115BBH');
    expect(FINANCE_ACTS.FA_2022.note).toMatch(/VDA|194S/);
  });

  it('should pin FA 2023 (Section 50AA debt MF)', () => {
    expect(FINANCE_ACTS.FA_2023.year).toBe(2023);
    expect(FINANCE_ACTS.FA_2023.section).toBe('50AA');
  });

  it('should omit the section key on FA_2024 (no-section entry, kills line-9 ConditionalExpression mutant)', () => {
    expect('section' in FINANCE_ACTS.FA_2024).toBe(false);
    expect(Object.keys(FINANCE_ACTS.FA_2024)).not.toContain('section');
  });

  it('should omit the section key on FA_2025 (no-section entry)', () => {
    expect('section' in FINANCE_ACTS.FA_2025).toBe(false);
    expect(Object.keys(FINANCE_ACTS.FA_2025)).not.toContain('section');
  });

  it('should omit the note key when the factory is called with note undefined', () => {
    const result = fa(2099, undefined, undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['kind', 'year']);
  });

  it('should omit the note key when the factory is called with note omitted entirely', () => {
    const result = fa(2098);
    expect('note' in result).toBe(false);
  });

  it('should pin the exact registered shape for FA_2024 (kind, year, note only)', () => {
    expect(FINANCE_ACTS.FA_2024).toEqual({
      kind: 'finance-act',
      year: 2024,
      note: 'Revised new-regime slabs; LTCG @ 12.5%; STCG 111A @ 20%',
    });
    expect(Object.keys(FINANCE_ACTS.FA_2024).sort()).toEqual(['kind', 'note', 'year']);
  });

  it('should pin the exact registered shape for FA_2025 (kind, year, note only)', () => {
    expect(FINANCE_ACTS.FA_2025).toEqual({
      kind: 'finance-act',
      year: 2025,
      note: 'Revised new-regime slabs (Rs. 0 to 4L nil, etc.); 87A rebate to Rs. 12L',
    });
    expect(Object.keys(FINANCE_ACTS.FA_2025).sort()).toEqual(['kind', 'note', 'year']);
  });
});
