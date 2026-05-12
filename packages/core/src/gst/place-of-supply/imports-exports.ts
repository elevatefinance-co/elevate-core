/* Section 11 of the IGST Act -- place of supply of goods imported into or exported from India.
 *
 *   11(a)  Goods imported into India -- location of importer
 *   11(b)  Goods exported from India -- location outside India
 *
 * Importer-side imports get IGST charged with the importer's state code as the place of supply (the
 * importer's GSTIN's state determines the registered-place); the recipient claims IGST credit subject to
 * Section 16 conditions. Exports are zero-rated supplies under Section 16 of the IGST Act -- this resolver
 * returns the OUTSIDE_INDIA sentinel for the Place-of-Supply field; the rate / refund treatment is computed
 * in a separate exports module. */

import { IGST_ACT_SECTIONS } from '../citations/igst-act-sections.js';
import {
  asState,
  OUTSIDE_INDIA,
  type IndianStateCode,
  type PlaceOfSupplyResolution,
} from './types.js';

export type ImportExportShape =
  | { readonly kind: 'import'; readonly importerStateCode: IndianStateCode }
  | { readonly kind: 'export' };

export function resolveImportExportPlaceOfSupply(
  input: ImportExportShape,
): PlaceOfSupplyResolution {
  switch (input.kind) {
    case 'import':
      return {
        outcome: asState(input.importerStateCode),
        resolverApplied: 'IGST_S11_A',
        citations: [IGST_ACT_SECTIONS.SEC_11, IGST_ACT_SECTIONS.SEC_11_A],
        notes: 'Location of the importer (the registered taxable person)',
      };
    case 'export':
      return {
        outcome: OUTSIDE_INDIA,
        resolverApplied: 'IGST_S11_B',
        citations: [IGST_ACT_SECTIONS.SEC_11, IGST_ACT_SECTIONS.SEC_11_B],
        notes: 'Place of supply is outside India; export is zero-rated under IGST Section 16',
      };
  }
}
