/* Tests for the Section 13 IGST cross-border services resolver. The default + nine specific overrides;
 * the OUTSIDE_INDIA sentinel for export-of-services flows.
 */

import { IGST_ACT_SECTIONS } from '../../src/gst/citations/index.js';
import { resolveServicesCrossBorderPlaceOfSupply } from '../../src/gst/place-of-supply/index.js';

describe('Section 13 IGST -- services cross-border', () => {
  it('default -- recipient in India', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'default',
      recipientLocation: { inIndia: true, stateCode: '27' },
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
    expect(result.resolverApplied).toBe('IGST_S13_DEFAULT');
  });

  it('default -- recipient outside India yields OUTSIDE_INDIA', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'default',
      recipientLocation: { inIndia: false },
    });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
  });

  it('13(3) performed-on-goods -- where performed', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'performed-on-goods',
      performedLocation: { inIndia: true, stateCode: '27' },
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
  });

  it('13(4) immovable property abroad -- OUTSIDE_INDIA', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'immovable-property',
      propertyLocation: { inIndia: false },
    });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
  });

  it('13(5) event admission -- event location', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'event-admission',
      eventLocation: { inIndia: true, stateCode: '24' },
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '24' });
  });

  it('13(6) intermediary -- supplier location', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'intermediary',
      supplierLocation: { inIndia: true, stateCode: '27' },
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
    expect(result.notes).toContain('Intermediary');
  });

  it('13(7) hiring transport -- supplier location', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'transport-hiring',
      supplierLocation: { inIndia: true, stateCode: '07' },
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '07' });
  });

  it('13(8) banking abroad -- OUTSIDE_INDIA when supplier outside', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'banking',
      supplierLocation: { inIndia: false },
    });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
  });

  it('13(9) goods transport -- destination', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'goods-transport',
      destinationLocation: { inIndia: true, stateCode: '27' },
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
  });

  it('13(10) passenger transport -- embarkation', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'passenger-transport',
      embarkationLocation: { inIndia: true, stateCode: '07' },
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '07' });
  });

  it('13(12) OIDAR -- recipient location', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'oidar',
      recipientLocation: { inIndia: true, stateCode: '27' },
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
    expect(result.notes).toContain('OIDAR');
  });
});

describe('Section 13 IGST -- citations, resolver tags, and notes per branch', () => {
  it('default -- citations [SEC_13], resolver IGST_S13_DEFAULT, notes pinned', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'default',
      recipientLocation: { inIndia: true, stateCode: '27' },
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13]);
    expect(result.resolverApplied).toBe('IGST_S13_DEFAULT');
    expect(result.notes).toBe('Default to location of recipient');
  });

  it('default outside India -- citations [SEC_13], notes pinned, OUTSIDE_INDIA outcome', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'default',
      recipientLocation: { inIndia: false },
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13]);
    expect(result.notes).toBe('Default to location of recipient');
    expect(result.outcome).toEqual({ kind: 'outside-india' });
  });

  it('13(3) performed-on-goods -- resolver IGST_S13_3, citations [SEC_13_3]', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'performed-on-goods',
      performedLocation: { inIndia: true, stateCode: '27' },
    });
    expect(result.resolverApplied).toBe('IGST_S13_3');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_3]);
  });

  it('13(3) performed-on-goods abroad -- OUTSIDE_INDIA branch', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'performed-on-goods',
      performedLocation: { inIndia: false },
    });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
    expect(result.resolverApplied).toBe('IGST_S13_3');
  });

  it('13(4) immovable property -- resolver IGST_S13_4, citations [SEC_13_4]', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'immovable-property',
      propertyLocation: { inIndia: true, stateCode: '29' },
    });
    expect(result.resolverApplied).toBe('IGST_S13_4');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_4]);
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '29' });
  });

  it('13(5) event admission -- resolver IGST_S13_5, citations [SEC_13_5]', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'event-admission',
      eventLocation: { inIndia: true, stateCode: '24' },
    });
    expect(result.resolverApplied).toBe('IGST_S13_5');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_5]);
  });

  it('13(5) event admission abroad -- OUTSIDE_INDIA outcome', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'event-admission',
      eventLocation: { inIndia: false },
    });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_5]);
  });

  it('13(6) intermediary -- resolver IGST_S13_6, citations [SEC_13_6], notes pinned', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'intermediary',
      supplierLocation: { inIndia: true, stateCode: '27' },
    });
    expect(result.resolverApplied).toBe('IGST_S13_6');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_6]);
    expect(result.notes).toBe('Intermediary services -- location of supplier');
  });

  it('13(6) intermediary abroad -- OUTSIDE_INDIA outcome, citations stable', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'intermediary',
      supplierLocation: { inIndia: false },
    });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_6]);
  });

  it('13(7) transport-hiring -- resolver IGST_S13_7, citations [SEC_13_7]', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'transport-hiring',
      supplierLocation: { inIndia: true, stateCode: '07' },
    });
    expect(result.resolverApplied).toBe('IGST_S13_7');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_7]);
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '07' });
  });

  it('13(7) transport-hiring abroad -- OUTSIDE_INDIA outcome', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'transport-hiring',
      supplierLocation: { inIndia: false },
    });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
    expect(result.resolverApplied).toBe('IGST_S13_7');
  });

  it('13(8) banking in India -- resolver IGST_S13_8, citations [SEC_13_8]', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'banking',
      supplierLocation: { inIndia: true, stateCode: '07' },
    });
    expect(result.resolverApplied).toBe('IGST_S13_8');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_8]);
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '07' });
  });

  it('13(8) banking abroad -- citations remain [SEC_13_8] even with OUTSIDE_INDIA outcome', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'banking',
      supplierLocation: { inIndia: false },
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_8]);
    expect(result.outcome).toEqual({ kind: 'outside-india' });
  });

  it('13(9) goods-transport -- resolver IGST_S13_9, citations [SEC_13_9]', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'goods-transport',
      destinationLocation: { inIndia: true, stateCode: '27' },
    });
    expect(result.resolverApplied).toBe('IGST_S13_9');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_9]);
  });

  it('13(9) goods-transport destination abroad -- OUTSIDE_INDIA outcome', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'goods-transport',
      destinationLocation: { inIndia: false },
    });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
    expect(result.resolverApplied).toBe('IGST_S13_9');
  });

  it('13(10) passenger-transport -- resolver IGST_S13_10, citations [SEC_13_10]', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'passenger-transport',
      embarkationLocation: { inIndia: true, stateCode: '07' },
    });
    expect(result.resolverApplied).toBe('IGST_S13_10');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_10]);
  });

  it('13(10) passenger-transport embarkation abroad -- OUTSIDE_INDIA outcome', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'passenger-transport',
      embarkationLocation: { inIndia: false },
    });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
    expect(result.resolverApplied).toBe('IGST_S13_10');
  });

  it('13(12) OIDAR -- resolver IGST_S13_12, citations [SEC_13_12], notes pinned', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'oidar',
      recipientLocation: { inIndia: true, stateCode: '27' },
    });
    expect(result.resolverApplied).toBe('IGST_S13_12');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_12]);
    expect(result.notes).toBe('OIDAR services to non-taxable online recipient');
  });

  it('13(12) OIDAR recipient abroad -- OUTSIDE_INDIA outcome, notes still pinned', () => {
    const result = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'oidar',
      recipientLocation: { inIndia: false },
    });
    expect(result.outcome).toEqual({ kind: 'outside-india' });
    expect(result.notes).toBe('OIDAR services to non-taxable online recipient');
  });

  it('transport-hiring vs intermediary -- distinct resolver tags despite shared supplier-location shape', () => {
    const intermediary = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'intermediary',
      supplierLocation: { inIndia: true, stateCode: '27' },
    });
    const transportHiring = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'transport-hiring',
      supplierLocation: { inIndia: true, stateCode: '27' },
    });
    expect(intermediary.resolverApplied).toBe('IGST_S13_6');
    expect(transportHiring.resolverApplied).toBe('IGST_S13_7');
    expect(intermediary.citations).not.toEqual(transportHiring.citations);
  });

  it('banking vs transport-hiring vs intermediary -- distinct citations even though all read supplierLocation', () => {
    const banking = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'banking',
      supplierLocation: { inIndia: true, stateCode: '07' },
    });
    const transportHiring = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'transport-hiring',
      supplierLocation: { inIndia: true, stateCode: '07' },
    });
    const intermediary = resolveServicesCrossBorderPlaceOfSupply({
      kind: 'intermediary',
      supplierLocation: { inIndia: true, stateCode: '07' },
    });
    expect(banking.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_8]);
    expect(transportHiring.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_7]);
    expect(intermediary.citations).toEqual([IGST_ACT_SECTIONS.SEC_13_6]);
  });
});
