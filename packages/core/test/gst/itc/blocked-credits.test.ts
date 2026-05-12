/* Tests for the Section 17(5) blocked-credit classifier.
 * Eleven blocking sub-clauses (a through k) plus the NOT_BLOCKED default.
 * The classifier returns a discriminated-union shape so pattern-match exhaustiveness in TypeScript flags
 * any missing Council-recommendation sub-clause at every call site.
 * Pinned: NOT_BLOCKED carries Section 16 + 16(2) eligibility citations (general regime applies);
 * every blocked sub-clause cites the Section 17(5) parent plus its specific sub-clause;
 * the BLOCKED_CREDIT_REASONS array enumerates exactly twelve entries;
 * isBlockedCreditReason returns false only for NOT_BLOCKED. Citations: CGST Act 2017 Section 16,
 * Section 16(2), Section 17(5), Section 17(5) sub-clauses (a) through (k).
 */

import {
  BLOCKED_CREDIT_REASONS,
  blockedCreditDescription,
  classifyBlockedCredit,
  isBlockedCreditReason,
  type BlockedCreditReason,
} from '../../../src/gst/itc/blocked-credits.js';

describe('BLOCKED_CREDIT_REASONS', () => {
  it('should enumerate exactly twelve entries (NOT_BLOCKED plus eleven sub-clauses)', () => {
    expect(BLOCKED_CREDIT_REASONS).toHaveLength(12);
    expect(BLOCKED_CREDIT_REASONS[0]).toBe('NOT_BLOCKED');
  });

  it('should include every Section 17(5) sub-clause from a through k', () => {
    const expected: readonly BlockedCreditReason[] = [
      'S17_5_A_MOTOR_VEHICLE',
      'S17_5_B_FOOD_BEVERAGES',
      'S17_5_C_CLUB_HEALTH',
      'S17_5_D_TRAVEL_BENEFIT',
      'S17_5_E_WORKS_CONTRACT',
      'S17_5_F_CONSTRUCTION_OWN_ACCOUNT',
      'S17_5_G_COMPOSITION',
      'S17_5_H_NRTP',
      'S17_5_I_PERSONAL_CONSUMPTION',
      'S17_5_J_GIFTS_LOSS_DESTROYED',
      'S17_5_K_S74_S129_S130',
    ];
    for (const reason of expected) {
      expect(BLOCKED_CREDIT_REASONS).toContain(reason);
    }
  });
});

describe('classifyBlockedCredit -- NOT_BLOCKED path', () => {
  it('should return blocked false for NOT_BLOCKED', () => {
    const result = classifyBlockedCredit('NOT_BLOCKED');
    expect(result.blocked).toBe(false);
    expect(result.reason).toBe('NOT_BLOCKED');
  });

  it('should expose a non-empty description for NOT_BLOCKED', () => {
    const result = classifyBlockedCredit('NOT_BLOCKED');
    expect(result.description.length).toBeGreaterThan(0);
  });

  it('should cite Section 16 and 16(2) for NOT_BLOCKED (general eligibility regime)', () => {
    const result = classifyBlockedCredit('NOT_BLOCKED');
    const hasSec16 = result.citations.some(
      (citation) =>
        citation.kind === 'section' &&
        citation.section === '16' &&
        citation.subSection === undefined,
    );
    const hasSec16_2 = result.citations.some(
      (citation) =>
        citation.kind === 'section' && citation.section === '16' && citation.subSection === '2',
    );
    expect(hasSec16).toBe(true);
    expect(hasSec16_2).toBe(true);
  });
});

describe('classifyBlockedCredit -- per-sub-clause paths', () => {
  it('should classify motor vehicles (a) as blocked with Section 17(5)(a) citation', () => {
    const result = classifyBlockedCredit('S17_5_A_MOTOR_VEHICLE');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('S17_5_A_MOTOR_VEHICLE');
    const hasSubClause = result.citations.some(
      (citation) =>
        citation.kind === 'section' &&
        citation.section === '17' &&
        citation.subSection === '5' &&
        citation.clause === 'a',
    );
    expect(hasSubClause).toBe(true);
  });

  it('should mention "Food and beverages" in the (b) description', () => {
    const result = classifyBlockedCredit('S17_5_B_FOOD_BEVERAGES');
    expect(result.description).toContain('Food and beverages');
  });

  it('should mention "Membership of a club" in the (c) description', () => {
    const result = classifyBlockedCredit('S17_5_C_CLUB_HEALTH');
    expect(result.description).toContain('Membership of a club');
  });

  it('should mention "Works contract services" in the (e) description', () => {
    const result = classifyBlockedCredit('S17_5_E_WORKS_CONTRACT');
    expect(result.description).toContain('Works contract services');
  });

  it('should mention Section 74 in the (k) description (prosecution-and-detention scope)', () => {
    const result = classifyBlockedCredit('S17_5_K_S74_S129_S130');
    expect(result.description).toContain('Section 74');
  });

  it('should include the Section 17(5) parent citation on every blocked sub-clause', () => {
    const blockedReasons = BLOCKED_CREDIT_REASONS.filter((reason) => reason !== 'NOT_BLOCKED');
    for (const reason of blockedReasons) {
      const result = classifyBlockedCredit(reason);
      const hasParent = result.citations.some(
        (citation) =>
          citation.kind === 'section' &&
          citation.section === '17' &&
          citation.subSection === '5' &&
          citation.clause === undefined,
      );
      expect(hasParent, `${reason} missing Section 17(5) parent citation`).toBe(true);
    }
  });
});

describe('blockedCreditDescription', () => {
  it('should return a non-empty description for every reason in the registry', () => {
    for (const reason of BLOCKED_CREDIT_REASONS) {
      expect(blockedCreditDescription(reason).length).toBeGreaterThan(0);
    }
  });
});

describe('isBlockedCreditReason', () => {
  it('should return false only for NOT_BLOCKED', () => {
    expect(isBlockedCreditReason('NOT_BLOCKED')).toBe(false);
  });

  it('should return true for every Section 17(5) sub-clause', () => {
    const blockedReasons = BLOCKED_CREDIT_REASONS.filter((reason) => reason !== 'NOT_BLOCKED');
    for (const reason of blockedReasons) {
      expect(isBlockedCreditReason(reason)).toBe(true);
    }
  });
});
