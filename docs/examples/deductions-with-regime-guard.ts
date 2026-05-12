/* Section 80C deduction with the new-regime guard.
 *
 * Section 115BAC (the new regime,
 * default for individuals from AY 2024-25) disallows most Chapter VI-A deductions.
 * The library exposes both the per-deduction compute function AND a guard helper,
 * so a consumer can branch cleanly at the call site.
 *
 * Under the OLD regime, 80C is allowed up to Rs. 1.5 lakh combined with 80CCC and 80CCD(1).
 * Under the NEW regime, 80C returns zero (with a step explaining why),
 * so a UI can render a "not allowed under new regime" disclosure next to the section.
 *
 * Run with: pnpm tsx docs/examples/deductions-with-regime-guard.ts
 */

import {
  computeSection80c,
  isDeductionAllowedUnderNewRegime,
} from '@elevatefinance-co/india-tax-rules';

const claim = {
  ppf: 100_000,
  elss: 50_000,
  homeLoanPrincipal: 80_000,
  lifeInsurancePremium: 20_000,
};

const oldRegime = computeSection80c({
  regime: 'OLD',
  claim,
  ay: 'AY2025-26',
});

const newRegime = computeSection80c({
  regime: 'NEW',
  claim,
  ay: 'AY2025-26',
});

console.log('--- OLD REGIME ---');
console.log('Deduction:', oldRegime.value);
console.log('Steps:');
oldRegime.steps.forEach((s) => console.log('  -', s.label));
console.log('Citations:', oldRegime.citations.map((c) => c.kind).join(', '));

console.log('\n--- NEW REGIME ---');
console.log('Deduction:', newRegime.value);
console.log('Steps:');
newRegime.steps.forEach((s) => console.log('  -', s.label));

const allowed = isDeductionAllowedUnderNewRegime('SEC_80C');
console.log('\nIs Sec. 80C allowed under the new regime?', allowed);

const ccd2Allowed = isDeductionAllowedUnderNewRegime('SEC_80CCD_2');
console.log('Is Sec. 80CCD(2) allowed under the new regime?', ccd2Allowed);
