/* Section 115BAC. The default new-regime. The sub-section (2) of 115BAC expressly DENIES every Chapter VI-A
 * deduction EXCEPT Section 80CCD(2) (employer NPS contribution) and Section 80JJAA (employment-generation
 * incentive). Every other 80-series deduction. 80C, 80D, 80E, 80G, 80TTA/B, and so on. Is unavailable the
 * moment a taxpayer is taxed under the new regime.
 *
 * Rather than scatter this restriction across every deduction module, we centralise it in one allow-list so
 * (a) the list is auditable in a single file, and (b) every caller can ask "is this section legal under the
 * new regime?" without re-reading the statute.
 *
 * The list only covers Chapter VI-A deductions we implement. If a new deduction module is added later it MUST
 * be classified here with a citation pointing to its carve-out (or absence thereof). */

import type { SectionKey } from '../citations/sections.js';

const ALLOWED_UNDER_NEW_REGIME: ReadonlySet<SectionKey> = new Set(['SEC_80CCD_2']);

export function isDeductionAllowedUnderNewRegime(sectionKey: SectionKey): boolean {
  return ALLOWED_UNDER_NEW_REGIME.has(sectionKey);
}

export type RegimeGuardResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string };

export function guardRegime(args: {
  readonly regime: 'NEW' | 'OLD';
  readonly sectionKey: SectionKey;
}): RegimeGuardResult {
  if (args.regime === 'OLD') return { allowed: true };
  if (isDeductionAllowedUnderNewRegime(args.sectionKey)) return { allowed: true };
  return {
    allowed: false,
    reason: `Deduction denied under Section 115BAC(2). New regime does not permit ${args.sectionKey}`,
  };
}
