/* Tests for the Section 12 IGST services-within-India resolver.
 * Default + ten specific overrides. */

import { IGST_ACT_SECTIONS } from '../../src/gst/citations/index.js';
import { resolveServicesInIndiaPlaceOfSupply } from '../../src/gst/place-of-supply/index.js';

describe('Section 12 IGST -- services in India', () => {
  it('default -- registered recipient state', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'default',
      recipientStateCode: '27',
      recipientIsRegistered: true,
      supplierStateCode: '07',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
    expect(result.resolverApplied).toBe('IGST_S12_DEFAULT');
  });

  it('default -- supplier state when recipient unregistered', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'default',
      recipientStateCode: '27',
      recipientIsRegistered: false,
      supplierStateCode: '07',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '07' });
  });

  it('12(3) immovable property -- property state', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'immovable-property',
      propertyStateCode: '29',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '29' });
    expect(result.resolverApplied).toBe('IGST_S12_3');
  });

  it('12(4) restaurant / catering -- where performed', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'restaurant-or-personal',
      performedStateCode: '32',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '32' });
    expect(result.resolverApplied).toBe('IGST_S12_4');
    expect(result.notes).toContain('performed');
  });

  it('12(5) training -- registered recipient location', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'training',
      performedStateCode: '07',
      recipientIsRegistered: true,
      recipientStateCode: '27',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
  });

  it('12(5) training -- where performed when unregistered', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'training',
      performedStateCode: '07',
      recipientIsRegistered: false,
      recipientStateCode: '27',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '07' });
  });

  it('12(6) event admission -- event state', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'event-admission',
      eventStateCode: '24',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '24' });
    expect(result.resolverApplied).toBe('IGST_S12_6');
  });

  it('12(7) event organisation -- registered recipient takes priority', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'event-organisation',
      eventStateCode: '24',
      recipientIsRegistered: true,
      recipientStateCode: '27',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
  });

  it('12(8) goods transport -- registered recipient location', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'goods-transport',
      recipientIsRegistered: true,
      recipientStateCode: '27',
      handedOverStateCode: '07',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
  });

  it('12(8) goods transport -- handed-over location when unregistered', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'goods-transport',
      recipientIsRegistered: false,
      recipientStateCode: '27',
      handedOverStateCode: '07',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '07' });
  });

  it('12(9) passenger transport -- embarkation point', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'passenger-transport',
      embarkationStateCode: '36',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '36' });
    expect(result.notes).toContain('embarks');
  });

  it('12(10) on-conveyance -- first scheduled departure state', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'on-conveyance',
      firstScheduledDepartureStateCode: '07',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '07' });
    expect(result.resolverApplied).toBe('IGST_S12_10');
  });

  it('12(12) banking -- recipient state on record', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'banking',
      recipientStateCodeOnRecord: '29',
      supplierStateCode: '27',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '29' });
  });

  it('12(12) banking -- supplier state when recipient not on record', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'banking',
      recipientStateCodeOnRecord: null,
      supplierStateCode: '27',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
  });

  it('12(13) insurance -- registered recipient state', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'insurance',
      registeredRecipientStateCode: '32',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '32' });
  });
});

describe('Section 12 IGST -- citations, resolver tags, and notes per branch', () => {
  it('default registered -- citations are exactly [SEC_12], notes pinned, resolver tag pinned', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'default',
      recipientStateCode: '27',
      recipientIsRegistered: true,
      supplierStateCode: '07',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12]);
    expect(result.citations.length).toBe(1);
    expect(result.resolverApplied).toBe('IGST_S12_DEFAULT');
    expect(result.notes).toBe('Registered recipient location');
  });

  it('default unregistered -- notes pin to supplier-fallback string', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'default',
      recipientStateCode: '27',
      recipientIsRegistered: false,
      supplierStateCode: '07',
    });
    expect(result.notes).toBe('Supplier location (recipient address not on record)');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12]);
  });

  it('12(3) immovable property -- citations [SEC_12_3]', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'immovable-property',
      propertyStateCode: '29',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12_3]);
    expect(result.resolverApplied).toBe('IGST_S12_3');
  });

  it('12(4) restaurant / personal -- citations [SEC_12_4] and notes pinned', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'restaurant-or-personal',
      performedStateCode: '32',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12_4]);
    expect(result.resolverApplied).toBe('IGST_S12_4');
    expect(result.notes).toBe('Location where the service is actually performed');
  });

  it('12(5) training registered -- resolver tag IGST_S12_5, citations [SEC_12_5], notes pinned', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'training',
      performedStateCode: '07',
      recipientIsRegistered: true,
      recipientStateCode: '27',
    });
    expect(result.resolverApplied).toBe('IGST_S12_5');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12_5]);
    expect(result.notes).toBe('Registered recipient location');
  });

  it('12(5) training unregistered -- notes pin to performance-location string', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'training',
      performedStateCode: '07',
      recipientIsRegistered: false,
      recipientStateCode: '27',
    });
    expect(result.notes).toBe('Where service is performed (recipient unregistered)');
  });

  it('12(6) event admission -- citations [SEC_12_6]', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'event-admission',
      eventStateCode: '24',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12_6]);
    expect(result.resolverApplied).toBe('IGST_S12_6');
  });

  it('12(7) event organisation registered -- recipient state, resolver tag, citations [SEC_12_7]', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'event-organisation',
      eventStateCode: '24',
      recipientIsRegistered: true,
      recipientStateCode: '27',
    });
    expect(result.resolverApplied).toBe('IGST_S12_7');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12_7]);
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
  });

  it('12(7) event organisation unregistered -- event state', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'event-organisation',
      eventStateCode: '24',
      recipientIsRegistered: false,
      recipientStateCode: '27',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '24' });
    expect(result.resolverApplied).toBe('IGST_S12_7');
  });

  it('12(8) goods transport registered -- resolver IGST_S12_8, citations [SEC_12_8], notes pinned', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'goods-transport',
      recipientIsRegistered: true,
      recipientStateCode: '27',
      handedOverStateCode: '07',
    });
    expect(result.resolverApplied).toBe('IGST_S12_8');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12_8]);
    expect(result.notes).toBe('Registered recipient location');
  });

  it('12(8) goods transport unregistered -- notes pin to handed-over string', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'goods-transport',
      recipientIsRegistered: false,
      recipientStateCode: '27',
      handedOverStateCode: '07',
    });
    expect(result.notes).toBe('Place where goods are handed over for transportation');
  });

  it('12(9) passenger transport -- resolver IGST_S12_9, citations [SEC_12_9]', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'passenger-transport',
      embarkationStateCode: '36',
    });
    expect(result.resolverApplied).toBe('IGST_S12_9');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12_9]);
    expect(result.notes).toBe('Location where the passenger embarks');
  });

  it('12(10) on-conveyance -- citations [SEC_12_10]', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'on-conveyance',
      firstScheduledDepartureStateCode: '07',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12_10]);
    expect(result.resolverApplied).toBe('IGST_S12_10');
  });

  it('12(12) banking with recipient on record -- resolver IGST_S12_12, citations [SEC_12_12], notes pinned', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'banking',
      recipientStateCodeOnRecord: '29',
      supplierStateCode: '27',
    });
    expect(result.resolverApplied).toBe('IGST_S12_12');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12_12]);
    expect(result.notes).toBe('Recipient location on records of supplier');
  });

  it('12(12) banking without recipient on record -- notes pin to supplier-fallback string', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'banking',
      recipientStateCodeOnRecord: null,
      supplierStateCode: '27',
    });
    expect(result.notes).toBe('Supplier location (recipient not on record)');
  });

  it('12(13) insurance -- resolver IGST_S12_13, citations [SEC_12_13]', () => {
    const result = resolveServicesInIndiaPlaceOfSupply({
      kind: 'insurance',
      registeredRecipientStateCode: '32',
    });
    expect(result.resolverApplied).toBe('IGST_S12_13');
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_12_13]);
  });

  it('12(7) event organisation -- registered vs unregistered branches diverge', () => {
    const registered = resolveServicesInIndiaPlaceOfSupply({
      kind: 'event-organisation',
      eventStateCode: '24',
      recipientIsRegistered: true,
      recipientStateCode: '27',
    });
    const unregistered = resolveServicesInIndiaPlaceOfSupply({
      kind: 'event-organisation',
      eventStateCode: '24',
      recipientIsRegistered: false,
      recipientStateCode: '27',
    });
    expect(registered.outcome).not.toEqual(unregistered.outcome);
  });

  it('12(5) training -- registered vs unregistered branches diverge', () => {
    const registered = resolveServicesInIndiaPlaceOfSupply({
      kind: 'training',
      performedStateCode: '07',
      recipientIsRegistered: true,
      recipientStateCode: '27',
    });
    const unregistered = resolveServicesInIndiaPlaceOfSupply({
      kind: 'training',
      performedStateCode: '07',
      recipientIsRegistered: false,
      recipientStateCode: '27',
    });
    expect(registered.outcome).not.toEqual(unregistered.outcome);
    expect(registered.notes).not.toBe(unregistered.notes);
  });

  it('12(8) goods transport -- registered vs unregistered branches diverge', () => {
    const registered = resolveServicesInIndiaPlaceOfSupply({
      kind: 'goods-transport',
      recipientIsRegistered: true,
      recipientStateCode: '27',
      handedOverStateCode: '07',
    });
    const unregistered = resolveServicesInIndiaPlaceOfSupply({
      kind: 'goods-transport',
      recipientIsRegistered: false,
      recipientStateCode: '27',
      handedOverStateCode: '07',
    });
    expect(registered.outcome).not.toEqual(unregistered.outcome);
    expect(registered.notes).not.toBe(unregistered.notes);
  });

  it('12(12) banking -- on-record vs off-record branches diverge', () => {
    const onRecord = resolveServicesInIndiaPlaceOfSupply({
      kind: 'banking',
      recipientStateCodeOnRecord: '29',
      supplierStateCode: '27',
    });
    const offRecord = resolveServicesInIndiaPlaceOfSupply({
      kind: 'banking',
      recipientStateCodeOnRecord: null,
      supplierStateCode: '27',
    });
    expect(onRecord.outcome).not.toEqual(offRecord.outcome);
    expect(onRecord.notes).not.toBe(offRecord.notes);
  });
});
