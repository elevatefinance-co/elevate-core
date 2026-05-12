/* Tests for the new-regime eligibility allow-list.
 * Section 115BAC(2) denies every Chapter VI-A deduction except 80CCD(2) (employer NPS) and 80JJAA
 * (employment-generation incentive).
 * The platform centralises this carve-out in one allow-list so every deduction module can ask "is this
 * section legal under the new regime?" without re-reading the statute.
 * Pinned: 80CCD(2) is allowed, every other 80-series section we implement is denied,
 * the guardRegime helper short-circuits old regime to allowed,
 * and a denied result carries a 115BAC reason string. Citations:
 * Section 115BAC(2) (denial of Chapter VI-A deductions for new-regime taxpayers).
 */

import {
  guardRegime,
  isDeductionAllowedUnderNewRegime,
} from '../../src/deductions/new-regime-eligibility.js';

describe('isDeductionAllowedUnderNewRegime', () => {
  it('should allow 80CCD(2) (employer NPS contribution)', () => {
    expect(isDeductionAllowedUnderNewRegime('SEC_80CCD_2')).toBe(true);
  });

  it('should deny 80C / 80D / 80E / 80G / 80TTA / 80TTB / 80CCD(1B)', () => {
    expect(isDeductionAllowedUnderNewRegime('SEC_80C')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80D')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80E')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80G')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80TTA')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80TTB')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80CCD_1B')).toBe(false);
  });

  it('should deny ancillary 80 sections (80CCC / 80EE / 80EEA / 80EEB / 80GG)', () => {
    expect(isDeductionAllowedUnderNewRegime('SEC_80CCC')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80EE')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80EEA')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80EEB')).toBe(false);
    expect(isDeductionAllowedUnderNewRegime('SEC_80GG')).toBe(false);
  });
});

describe('guardRegime', () => {
  it('should short-circuit old regime to allowed without consulting the allow-list', () => {
    expect(guardRegime({ regime: 'OLD', sectionKey: 'SEC_80C' })).toEqual({
      allowed: true,
    });
    expect(guardRegime({ regime: 'OLD', sectionKey: 'SEC_80CCD_2' })).toEqual({
      allowed: true,
    });
  });

  it('should allow new-regime when the section is in the allow-list (80CCD(2))', () => {
    expect(guardRegime({ regime: 'NEW', sectionKey: 'SEC_80CCD_2' })).toEqual({
      allowed: true,
    });
  });

  it('should deny new-regime with a 115BAC(2) reason for a non-allow-listed section', () => {
    const result = guardRegime({ regime: 'NEW', sectionKey: 'SEC_80C' });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toMatch(/115BAC|new regime|SEC_80C/);
    }
  });

  it('should produce a section-specific reason string identifying the denied key', () => {
    const result = guardRegime({ regime: 'NEW', sectionKey: 'SEC_80D' });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain('SEC_80D');
    }
  });
});
