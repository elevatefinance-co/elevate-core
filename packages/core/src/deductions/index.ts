/* Wave 3. Chapter VI-A deductions. Every deduction is a pure ComputationResult-returning function;
 * callers compose them as needed.
 *
 * Coverage in v0.3:
 *   - Section 80C (LIC / PPF / ELSS / EPF / NSC / home principal / tuition / SSY / SCSS / FD-5yr)
 *   - Section 80CCD(1B). Additional NPS Rs. 50k
 *   - Section 80CCD(2). Employer NPS; the one deduction available under the new regime
 *   - Section 80D. Medical insurance + preventive health check-up
 *   - Section 80E. Education loan interest (no cap, 8-year window)
 *   - Section 80G. Donations (50%/100% x with/without AGTI cap; cash > Rs. 2k disqualified)
 *   - Section 80TTA. Savings interest (non-senior, Rs. 10k)
 *   - Section 80TTB. Deposit interest (senior, Rs. 50k)
 *
 * Not yet covered (slated for 0.3.x patch bumps as callers need them):
 *   80DD, 80DDB, 80EEA, 80EEB, 80GG, 80U, 80JJAA.
 *
 * The new-regime allow-list lives in `new-regime-eligibility.ts` and is the authoritative map of which
 * Chapter VI-A sections survive Section 115BAC's carve-out. Consumers asking "can I claim X under the new
 * regime" read from that module, never hard-code. */

export * from './new-regime-eligibility.js';
export * from './section-80c.js';
export * from './section-80ccd.js';
export * from './section-80d.js';
export * from './section-80e.js';
export * from './section-80g.js';
export * from './section-80tta-ttb.js';
