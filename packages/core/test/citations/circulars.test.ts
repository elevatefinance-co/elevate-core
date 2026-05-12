/* Tests for the CBDT Circulars registry.
 * The registry is the single source of truth for "Clarified by CBDT Circular X/YYYY" provenance attached
 * to numbers in the rule engine.
 * Pinned:
 * every registered entry is a circular citation with a non-empty number and a date in ISO YYYY-MM-DD shape,
 * the headline circulars (12/2024, 1/2023, 13/2022) are present,
 * and the optional url field is preserved when present. Citations:
 * CBDT Circular 12/2024 (capital-gains 23-Jul-2024 split), CBDT Circular 1/2023 (Section 50AA debt MF),
 * CBDT Circular 13/2022 (RSU / ESOP perquisite valuation).
 */

import { CIRCULARS, circularCitation } from '../../src/citations/circulars.js';

describe('CIRCULARS registry', () => {
  it('should expose every entry as a circular citation kind', () => {
    for (const entry of Object.values(CIRCULARS)) {
      expect(entry.kind).toBe('circular');
    }
  });

  it('should expose a non-empty number on every entry', () => {
    for (const [registryKey, entry] of Object.entries(CIRCULARS)) {
      expect(entry.number.length, `${registryKey} missing number`).toBeGreaterThan(0);
    }
  });

  it('should expose an ISO YYYY-MM-DD date on every entry', () => {
    const isoDateShape = /^\d{4}-\d{2}-\d{2}$/;
    for (const [registryKey, entry] of Object.entries(CIRCULARS)) {
      expect(isoDateShape.test(entry.date), `${registryKey} date not ISO`).toBe(true);
    }
  });

  it('should pin Circular 12/2024 (capital-gains 23-Jul-2024 split clarifications)', () => {
    expect(CIRCULARS.CBDT_CIRC_12_2024.number).toBe('12/2024');
    expect(CIRCULARS.CBDT_CIRC_12_2024.date).toBe('2024-08-14');
    expect(CIRCULARS.CBDT_CIRC_12_2024.url).toBeDefined();
    expect(CIRCULARS.CBDT_CIRC_12_2024.note).toMatch(/23-Jul-2024|112A|112/);
  });

  it('should pin Circular 1/2023 (Section 50AA specified MF / debt)', () => {
    expect(CIRCULARS.CBDT_CIRC_1_2023.number).toBe('1/2023');
    expect(CIRCULARS.CBDT_CIRC_1_2023.date).toBe('2023-04-01');
    expect(CIRCULARS.CBDT_CIRC_1_2023.note).toMatch(/50AA|debt MF/);
  });

  it('should pin Circular 13/2022 (RSU / ESOP perquisite valuation)', () => {
    expect(CIRCULARS.CBDT_CIRC_13_2022.number).toBe('13/2022');
    expect(CIRCULARS.CBDT_CIRC_13_2022.date).toBe('2022-06-22');
    expect(CIRCULARS.CBDT_CIRC_13_2022.note).toMatch(/RSU|ESOP|sweat equity/);
  });

  it('should include the url key only when a url is registered', () => {
    expect('url' in CIRCULARS.CBDT_CIRC_12_2024).toBe(true);
    expect(CIRCULARS.CBDT_CIRC_12_2024.url).toBe(
      'https://incometaxindia.gov.in/communications/circular/circular-no-12-2024.pdf',
    );
    expect('url' in CIRCULARS.CBDT_CIRC_1_2023).toBe(false);
    expect('url' in CIRCULARS.CBDT_CIRC_13_2022).toBe(false);
  });

  it('should include the note key only when a note is registered', () => {
    expect('note' in CIRCULARS.CBDT_CIRC_12_2024).toBe(true);
    expect('note' in CIRCULARS.CBDT_CIRC_1_2023).toBe(true);
    expect('note' in CIRCULARS.CBDT_CIRC_13_2022).toBe(true);
  });

  it('should match the exact registered shape for Circular 1/2023 (note set, url omitted)', () => {
    expect(CIRCULARS.CBDT_CIRC_1_2023).toEqual({
      kind: 'circular',
      number: '1/2023',
      date: '2023-04-01',
      note: 'Specified mutual-fund / debt MF. Section 50AA introduction; gains always slab-rate after 01-Apr-2023 regardless of holding period.',
    });
    expect(Object.keys(CIRCULARS.CBDT_CIRC_1_2023).sort()).toEqual([
      'date',
      'kind',
      'note',
      'number',
    ]);
  });

  it('should omit the note key when the factory is called with note undefined', () => {
    const result = circularCitation('999/9999', '2099-01-01', undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['date', 'kind', 'number']);
  });

  it('should omit the note key when the factory is called with note omitted entirely', () => {
    const result = circularCitation('998/9999', '2099-01-02');
    expect('note' in result).toBe(false);
  });

  it('should match the exact registered shape for Circular 12/2024 (note + url both set)', () => {
    expect(CIRCULARS.CBDT_CIRC_12_2024).toEqual({
      kind: 'circular',
      number: '12/2024',
      date: '2024-08-14',
      note: 'Clarifications on capital-gains amendments under Finance (No. 2) Act 2024. Pre-/post 23-Jul-2024 split, 112A Rs. 1.25L consolidated annual exemption, 112 indexation option for resident individuals / HUF on pre-split land/building.',
      url: 'https://incometaxindia.gov.in/communications/circular/circular-no-12-2024.pdf',
    });
    expect(Object.keys(CIRCULARS.CBDT_CIRC_12_2024).sort()).toEqual([
      'date',
      'kind',
      'note',
      'number',
      'url',
    ]);
  });
});
