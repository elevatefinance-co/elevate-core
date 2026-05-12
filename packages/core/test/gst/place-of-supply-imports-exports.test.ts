/* Tests for the Section 11 IGST imports / exports place-of-
 * supply resolver. Two sub-clauses, both authoritative. */

import { IGST_ACT_SECTIONS } from '../../src/gst/citations/index.js';
import { resolveImportExportPlaceOfSupply } from '../../src/gst/place-of-supply/index.js';

describe('Section 11 IGST -- imports / exports place of supply', () => {
  it('import -- importer state is the place of supply', () => {
    const result = resolveImportExportPlaceOfSupply({
      kind: 'import',
      importerStateCode: '24',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '24' });
    expect(result.resolverApplied).toBe('IGST_S11_A');
    expect(result.notes).toContain('importer');
  });

  it('export -- place of supply is outside India', () => {
    const result = resolveImportExportPlaceOfSupply({ kind: 'export' });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
    expect(result.resolverApplied).toBe('IGST_S11_B');
    expect(result.notes).toContain('zero-rated');
  });
});

describe('Section 11 IGST -- imports / exports citations', () => {
  it('import -- citations are exactly [SEC_11, SEC_11_A]', () => {
    const result = resolveImportExportPlaceOfSupply({
      kind: 'import',
      importerStateCode: '24',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_11, IGST_ACT_SECTIONS.SEC_11_A]);
    expect(result.citations.length).toBe(2);
    expect(result.notes).toBe('Location of the importer (the registered taxable person)');
  });

  it('export -- citations are exactly [SEC_11, SEC_11_B]', () => {
    const result = resolveImportExportPlaceOfSupply({ kind: 'export' });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_11, IGST_ACT_SECTIONS.SEC_11_B]);
    expect(result.citations.length).toBe(2);
    expect(result.notes).toBe(
      'Place of supply is outside India; export is zero-rated under IGST Section 16',
    );
  });

  it('import -- different importer states surface different outcomes', () => {
    const maharashtra = resolveImportExportPlaceOfSupply({
      kind: 'import',
      importerStateCode: '27',
    });
    const gujarat = resolveImportExportPlaceOfSupply({
      kind: 'import',
      importerStateCode: '24',
    });
    expect(maharashtra.outcome).toEqual({ kind: 'state', stateCode: '27' });
    expect(gujarat.outcome).toEqual({ kind: 'state', stateCode: '24' });
  });
});
