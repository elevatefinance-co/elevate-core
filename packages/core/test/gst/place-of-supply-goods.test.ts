/* Tests for the Section 10 IGST goods place-of-supply resolver.
 * Each sub-clause (a through e) gets a positive case;
 * the intra-vs-inter classifier helpers are exercised against the recipient state code.
 */

import { IGST_ACT_SECTIONS } from '../../src/gst/citations/index.js';
import {
  isInterState,
  isIntraState,
  resolveGoodsPlaceOfSupply,
} from '../../src/gst/place-of-supply/index.js';

describe('Section 10 IGST -- goods place of supply', () => {
  it('10(1)(a) movement -- delivery state code is the place', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'movement',
      deliveryStateCode: '29',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '29' });
    expect(result.resolverApplied).toBe('IGST_S10_1_A');
    expect(
      result.citations.some((c) => c.kind === 'section' && c.section === '10' && c.clause === 'a'),
    ).toBe(true);
  });

  it('10(1)(b) bill-to-ship-to -- third person state is the place', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'bill-to-ship-to',
      thirdPersonStateCode: '07',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '07' });
    expect(result.resolverApplied).toBe('IGST_S10_1_B');
    expect(result.notes).toContain('third person');
  });

  it('10(1)(c) no-movement -- location at delivery is the place', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'no-movement',
      locationAtDeliveryStateCode: '27',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '27' });
    expect(result.resolverApplied).toBe('IGST_S10_1_C');
  });

  it('10(1)(d) installation -- installation state is the place', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'assembled-or-installed',
      installationStateCode: '09',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '09' });
    expect(result.resolverApplied).toBe('IGST_S10_1_D');
  });

  it('10(1)(e) on-board -- taken-on-board state is the place', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'on-board-conveyance',
      takenOnBoardStateCode: '24',
    });
    expect(result.outcome).toEqual({ kind: 'state', stateCode: '24' });
    expect(result.resolverApplied).toBe('IGST_S10_1_E');
    expect(result.notes).toContain('taken on board');
  });

  it('intra-vs-inter classification -- same state is intra-State', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'movement',
      deliveryStateCode: '27',
    });
    expect(isIntraState('27', result)).toBe(true);
    expect(isInterState('27', result)).toBe(false);
  });

  it('intra-vs-inter classification -- different state is inter-State', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'movement',
      deliveryStateCode: '29',
    });
    expect(isIntraState('27', result)).toBe(false);
    expect(isInterState('27', result)).toBe(true);
  });
});

describe('Section 10 IGST -- goods citations and resolver tags', () => {
  it('10(1)(a) movement -- citations are exactly [SEC_10, SEC_10_1_A]', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'movement',
      deliveryStateCode: '29',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_10, IGST_ACT_SECTIONS.SEC_10_1_A]);
    expect(result.citations.length).toBe(2);
  });

  it('10(1)(b) bill-to-ship-to -- citations are exactly [SEC_10, SEC_10_1_B]', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'bill-to-ship-to',
      thirdPersonStateCode: '07',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_10, IGST_ACT_SECTIONS.SEC_10_1_B]);
    expect(result.citations.length).toBe(2);
    expect(result.notes).toBe(
      'Principal place of business of the third person who directs the delivery',
    );
  });

  it('10(1)(c) no-movement -- citations are exactly [SEC_10, SEC_10_1_C]', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'no-movement',
      locationAtDeliveryStateCode: '27',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_10, IGST_ACT_SECTIONS.SEC_10_1_C]);
    expect(result.citations.length).toBe(2);
  });

  it('10(1)(d) installation -- citations are exactly [SEC_10, SEC_10_1_D]', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'assembled-or-installed',
      installationStateCode: '09',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_10, IGST_ACT_SECTIONS.SEC_10_1_D]);
    expect(result.citations.length).toBe(2);
  });

  it('10(1)(e) on-board -- citations are exactly [SEC_10, SEC_10_1_E]', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'on-board-conveyance',
      takenOnBoardStateCode: '24',
    });
    expect(result.citations).toEqual([IGST_ACT_SECTIONS.SEC_10, IGST_ACT_SECTIONS.SEC_10_1_E]);
    expect(result.citations.length).toBe(2);
    expect(result.notes).toBe('Location where goods are taken on board the conveyance');
  });

  it('10(1)(b) bill-to-ship-to -- third-person state differs from buyer state (inter-State boundary)', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'bill-to-ship-to',
      thirdPersonStateCode: '07',
    });
    expect(isIntraState('07', result)).toBe(true);
    expect(isInterState('07', result)).toBe(false);
    expect(isInterState('27', result)).toBe(true);
  });

  it('10(1)(d) installation site overrides delivery -- inter-State when buyer differs', () => {
    const result = resolveGoodsPlaceOfSupply({
      kind: 'assembled-or-installed',
      installationStateCode: '09',
    });
    expect(isInterState('27', result)).toBe(true);
    expect(isIntraState('09', result)).toBe(true);
  });
});
