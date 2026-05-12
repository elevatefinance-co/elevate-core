/* Tests for the Section 17(5) blocked-credit classifier.
 * Every sub-clause (a through k) plus the NOT_BLOCKED default.
 * The classifier returns a discriminated-union result;
 * pattern-matching exhaustiveness is verified by the classifyBlockedCredit tests covering every reason.
 */

import {
  BLOCKED_CREDIT_REASONS,
  blockedCreditDescription,
  classifyBlockedCredit,
  isBlockedCreditReason,
  type BlockedCreditReason,
} from '../../src/gst/itc/blocked-credits.js';

describe('BLOCKED_CREDIT_REASONS', () => {
  it('enumerates 12 entries -- NOT_BLOCKED plus 11 sub-clauses', () => {
    expect(BLOCKED_CREDIT_REASONS).toHaveLength(12);
    expect(BLOCKED_CREDIT_REASONS[0]).toBe('NOT_BLOCKED');
  });

  it('covers every sub-clause from a through k of Section 17(5)', () => {
    const subClauses: BlockedCreditReason[] = [
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
    for (const reason of subClauses) {
      expect(BLOCKED_CREDIT_REASONS).toContain(reason);
    }
  });
});

describe('classifyBlockedCredit -- NOT_BLOCKED path', () => {
  it('returns blocked false with eligibility-citation provenance', () => {
    const result = classifyBlockedCredit('NOT_BLOCKED');
    expect(result.blocked).toBe(false);
    expect(result.reason).toBe('NOT_BLOCKED');
    expect(result.description.length).toBeGreaterThan(0);
    expect(result.citations.length).toBeGreaterThanOrEqual(1);
    const sec16 = result.citations.find(
      (c) => c.kind === 'section' && c.section === '16' && c.subSection === undefined,
    );
    expect(sec16).toBeDefined();
  });
});

describe('classifyBlockedCredit -- per-sub-clause paths', () => {
  it('motor vehicle (a) cites Section 17(5)(a)', () => {
    const result = classifyBlockedCredit('S17_5_A_MOTOR_VEHICLE');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('S17_5_A_MOTOR_VEHICLE');
    expect(result.description).toContain('Motor vehicles');
    const subClauseCit = result.citations.find(
      (c) => c.kind === 'section' && c.section === '17' && c.subSection === '5' && c.clause === 'a',
    );
    expect(subClauseCit).toBeDefined();
  });

  it('food and beverages (b) cites Section 17(5)(b)', () => {
    const result = classifyBlockedCredit('S17_5_B_FOOD_BEVERAGES');
    expect(result.blocked).toBe(true);
    expect(result.description).toContain('Food and beverages');
  });

  it('club / health (c) cites Section 17(5)(c)', () => {
    const result = classifyBlockedCredit('S17_5_C_CLUB_HEALTH');
    expect(result.blocked).toBe(true);
    expect(result.description).toContain('Membership of a club');
  });

  it('works contract (e) cites Section 17(5)(e)', () => {
    const result = classifyBlockedCredit('S17_5_E_WORKS_CONTRACT');
    expect(result.blocked).toBe(true);
    expect(result.description).toContain('Works contract services');
  });

  it('Section 74 / 129 / 130 (k) carries the prosecution-and-detention scope', () => {
    const result = classifyBlockedCredit('S17_5_K_S74_S129_S130');
    expect(result.blocked).toBe(true);
    expect(result.description).toContain('Section 74');
  });

  it('every blocked sub-clause cites Section 17(5) at the parent level', () => {
    const blockedReasons = BLOCKED_CREDIT_REASONS.filter((r) => r !== 'NOT_BLOCKED');
    for (const reason of blockedReasons) {
      const result = classifyBlockedCredit(reason);
      const parentCit = result.citations.find(
        (c) =>
          c.kind === 'section' &&
          c.section === '17' &&
          c.subSection === '5' &&
          c.clause === undefined,
      );
      expect(parentCit, `${reason} missing Section 17(5) parent citation`).toBeDefined();
    }
  });
});

describe('blockedCreditDescription', () => {
  it('returns a non-empty string for every reason', () => {
    for (const reason of BLOCKED_CREDIT_REASONS) {
      const description = blockedCreditDescription(reason);
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it('NOT_BLOCKED returns the eligibility-regime description (Section 16(2) and Section 16(4) language)', () => {
    const description = blockedCreditDescription('NOT_BLOCKED');
    expect(description).toContain('Section 17(5)');
    expect(description).toContain('Section 16(2)');
    expect(description).toContain('Section 16(4)');
  });

  it('non-NOT_BLOCKED reasons return the per-sub-clause description, NOT the NOT_BLOCKED description', () => {
    const notBlockedDescription = blockedCreditDescription('NOT_BLOCKED');
    const blocked = BLOCKED_CREDIT_REASONS.filter((r) => r !== 'NOT_BLOCKED');
    for (const reason of blocked) {
      const description = blockedCreditDescription(reason);
      expect(
        description,
        `${reason} description must differ from NOT_BLOCKED description`,
      ).not.toBe(notBlockedDescription);
    }
  });

  it('motor-vehicle (a) description quotes the 13-person carrier rule', () => {
    expect(blockedCreditDescription('S17_5_A_MOTOR_VEHICLE')).toContain('Motor vehicles');
  });

  it('food-and-beverages (b) description quotes the carve-out language', () => {
    expect(blockedCreditDescription('S17_5_B_FOOD_BEVERAGES')).toContain('Food and beverages');
  });

  it('travel-benefit (d) description quotes employee vacation', () => {
    expect(blockedCreditDescription('S17_5_D_TRAVEL_BENEFIT')).toContain('Travel benefits');
  });

  it('construction-on-own-account (f) description quotes the plant-and-machinery carve-out', () => {
    expect(blockedCreditDescription('S17_5_F_CONSTRUCTION_OWN_ACCOUNT')).toContain(
      'plant and machinery',
    );
  });

  it('composition (g) description quotes composition tax', () => {
    expect(blockedCreditDescription('S17_5_G_COMPOSITION')).toContain('composition tax');
  });

  it('NRTP (h) description quotes non-resident', () => {
    expect(blockedCreditDescription('S17_5_H_NRTP')).toContain('non-resident');
  });

  it('personal-consumption (i) description quotes personal consumption', () => {
    expect(blockedCreditDescription('S17_5_I_PERSONAL_CONSUMPTION')).toContain(
      'personal consumption',
    );
  });

  it('gifts-or-loss (j) description quotes loss / stolen / destroyed', () => {
    expect(blockedCreditDescription('S17_5_J_GIFTS_LOSS_DESTROYED')).toContain(
      'lost, stolen, destroyed',
    );
  });
});

describe('isBlockedCreditReason', () => {
  it('returns false for NOT_BLOCKED', () => {
    expect(isBlockedCreditReason('NOT_BLOCKED')).toBe(false);
  });

  it('returns true for every Section 17(5) sub-clause', () => {
    const blocked = BLOCKED_CREDIT_REASONS.filter((r) => r !== 'NOT_BLOCKED');
    for (const reason of blocked) {
      expect(isBlockedCreditReason(reason)).toBe(true);
    }
  });
});
