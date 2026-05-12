/* Tests for the Section 17(5) blocked-credit classifier.
 * Eleven blocking sub-clauses (a through k) plus the NOT_BLOCKED default.
 * The classifier returns a discriminated-union shape so pattern-match exhaustiveness in TypeScript flags
 * any missing Council-recommendation sub-clause at every call site.
 * Pinned: NOT_BLOCKED carries Section 16 + 16(2) eligibility citations (general regime applies);
 * every blocked sub-clause cites the Section 17(5) parent plus its specific sub-clause;
 * the BLOCKED_CREDIT_REASONS array enumerates exactly twelve entries;
 * isBlockedCreditReason returns false only for NOT_BLOCKED. Citations: CGST Act 2017 Section 16,
 * Section 16(2), Section 17(5), Section 17(5) sub-clauses (a) through (k).
 *
 * The demand-provisions dispatcher (clause (i) of the Act) is pinned on both sides of the 1 November 2024
 * substitution (Finance (No. 2) Act 2024 + Notification 17/2024-CT) and on both sides of the FY 2023-24
 * qualification: before the substitution sections 74 / 129 / 130 are blocked; from it only section 74 tax
 * for periods up to FY 2023-24 stays blocked.
 */

import {
  BLOCKED_CREDIT_REASONS,
  blockedCreditDescription,
  classifyBlockedCredit,
  classifyDemandPaidTaxCredit,
  isBlockedCreditReason,
  type BlockedCreditReason,
  type DemandRecoveryProvision,
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

const LAST_PRE_SUBSTITUTION_INSTANT = new Date('2024-10-31T23:59:59Z');
const SUBSTITUTION_INSTANT = new Date('2024-11-01T00:00:00Z');

describe('classifyDemandPaidTaxCredit -- before the 1 November 2024 substitution', () => {
  it('should block tax paid under sections 74, 129 and 130', () => {
    const provisions: readonly DemandRecoveryProvision[] = [
      'SECTION_74',
      'SECTION_129',
      'SECTION_130',
    ];
    for (const provision of provisions) {
      const result = classifyDemandPaidTaxCredit({
        provision,
        classificationDate: LAST_PRE_SUBSTITUTION_INSTANT,
        taxPeriodFyStartYear: 2023,
      });
      expect(result.blocked, `${provision} should be blocked pre-substitution`).toBe(true);
      expect(result.provision).toBe(provision);
      expect(result.description).toBe(
        'Tax paid in accordance with sections 74, 129 and 130 -- ITC blocked under Section 17(5)(i) as it stood before 1 November 2024.',
      );
    }
  });

  it('should not block Section 74A (not in force before 1 November 2024)', () => {
    const result = classifyDemandPaidTaxCredit({
      provision: 'SECTION_74A',
      classificationDate: LAST_PRE_SUBSTITUTION_INSTANT,
      taxPeriodFyStartYear: 2023,
    });
    expect(result.blocked).toBe(false);
    expect(result.description).toBe(
      'Section 74A is not in force before 1 November 2024; no Section 17(5)(i) block applies to it.',
    );
  });

  it('should cite the Section 17(5) parent and the clause (i) demand entry, without Notification 17/2024-CT', () => {
    const result = classifyDemandPaidTaxCredit({
      provision: 'SECTION_74',
      classificationDate: LAST_PRE_SUBSTITUTION_INSTANT,
      taxPeriodFyStartYear: 2023,
    });
    const hasParent = result.citations.some(
      (citation) =>
        citation.kind === 'section' &&
        citation.section === '17' &&
        citation.subSection === '5' &&
        citation.clause === undefined,
    );
    const hasClauseI = result.citations.some(
      (citation) =>
        citation.kind === 'section' &&
        citation.section === '17' &&
        citation.subSection === '5' &&
        citation.clause === 'i',
    );
    const hasNotification = result.citations.some(
      (citation) => citation.kind === 'notification' && citation.number === '17/2024',
    );
    expect(hasParent).toBe(true);
    expect(hasClauseI).toBe(true);
    expect(hasNotification).toBe(false);
  });
});

describe('classifyDemandPaidTaxCredit -- on and after the 1 November 2024 substitution', () => {
  it('should block section 74 tax for FY 2023-24 from the substitution instant onwards (boundary)', () => {
    const result = classifyDemandPaidTaxCredit({
      provision: 'SECTION_74',
      classificationDate: SUBSTITUTION_INSTANT,
      taxPeriodFyStartYear: 2023,
    });
    expect(result.blocked).toBe(true);
    expect(result.description).toBe(
      'Tax paid in accordance with section 74 in respect of a period up to FY 2023-24 -- ITC blocked under Section 17(5)(i) as substituted by Finance (No. 2) Act 2024.',
    );
  });

  it('should block section 74 tax for earlier periods (FY 2017-18)', () => {
    const result = classifyDemandPaidTaxCredit({
      provision: 'SECTION_74',
      classificationDate: new Date('2026-06-12T00:00:00Z'),
      taxPeriodFyStartYear: 2017,
    });
    expect(result.blocked).toBe(true);
  });

  it('should not block section 74 tax for FY 2024-25 onwards (FY boundary)', () => {
    const result = classifyDemandPaidTaxCredit({
      provision: 'SECTION_74',
      classificationDate: SUBSTITUTION_INSTANT,
      taxPeriodFyStartYear: 2024,
    });
    expect(result.blocked).toBe(false);
    expect(result.description).toBe(
      'Section 17(5)(i) as substituted effective 1 November 2024 blocks only section 74 tax for periods up to FY 2023-24; payments under sections 129, 130 or 74A are outside the block.',
    );
  });

  it('should not block sections 129, 130 or 74A after the substitution', () => {
    const provisions: readonly DemandRecoveryProvision[] = [
      'SECTION_129',
      'SECTION_130',
      'SECTION_74A',
    ];
    for (const provision of provisions) {
      const result = classifyDemandPaidTaxCredit({
        provision,
        classificationDate: new Date('2025-01-15T00:00:00Z'),
        taxPeriodFyStartYear: 2023,
      });
      expect(result.blocked, `${provision} should not be blocked post-substitution`).toBe(false);
    }
  });

  it('should cite the parent, the clause (i) demand entry and Notification 17/2024-CT', () => {
    const result = classifyDemandPaidTaxCredit({
      provision: 'SECTION_74',
      classificationDate: SUBSTITUTION_INSTANT,
      taxPeriodFyStartYear: 2023,
    });
    const hasParent = result.citations.some(
      (citation) =>
        citation.kind === 'section' &&
        citation.section === '17' &&
        citation.subSection === '5' &&
        citation.clause === undefined,
    );
    const hasClauseI = result.citations.some(
      (citation) =>
        citation.kind === 'section' &&
        citation.section === '17' &&
        citation.subSection === '5' &&
        citation.clause === 'i' &&
        (citation.note ?? '').includes('FY 2023-24'),
    );
    const hasNotification = result.citations.some(
      (citation) =>
        citation.kind === 'notification' &&
        citation.number === '17/2024' &&
        citation.date === '2024-09-27',
    );
    expect(hasParent).toBe(true);
    expect(hasClauseI).toBe(true);
    expect(hasNotification).toBe(true);
  });

  it('should echo the provision back on the result for the audit trail', () => {
    const result = classifyDemandPaidTaxCredit({
      provision: 'SECTION_129',
      classificationDate: SUBSTITUTION_INSTANT,
      taxPeriodFyStartYear: 2023,
    });
    expect(result.provision).toBe('SECTION_129');
  });
});
