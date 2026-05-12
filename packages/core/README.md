# @elevatefinance-co/india-tax-rules

Indian Income Tax law expressed as composable, deterministic TypeScript functions. Every rate, threshold, ceiling, and rebate returns with the exact Section, Finance Act, Rule, or CBDT Circular that produced it - so a downstream tax tool, an HR platform, an ITR filer, a CA software vendor, or a student can cite the law instead of citing a spreadsheet.

```
+----------+        +-------------------+        +-------------+
|  Inputs  |  ----> |  computeSomething |  ----> | Computation |
| (typed)  |        |   (pure, AY-aware)|        |  Result<T>  |
+----------+        +-------------------+        +-------------+
                                                        |
                          +-----------------+-----------+----+
                          |                 |                |
                          v                 v                v
                       value           steps[]         citations[]
                       (number)    (line-by-line     (Section / Rule
                                    breakdown)        / FA / Circular)
```

> Zero runtime dependencies. ESM only. Pure functions. AY-versioned. MIT licensed. Past assessment years are immutable forever, so a 2025-26 filing computed today and the same filing recomputed in 2031 produce the same number with the same citations.

---

## Why this exists

Indian Income Tax computation today is a pile of hand-rolled spreadsheets, copy-pasted rates, and "trust me, the rate is 12.5%" folklore. When a Finance Act changes a rate, every downstream tool plays catch-up at its own pace. When a CA needs to defend a number in front of an Assessing Officer, they pull out a printout. When a student wants to learn the actual rule, they read a Bare Act and hope the section number is current.

This library is the alternative: every number lives next to its citation, every Assessment Year is its own frozen module, and every function returns the full computation trail so the consumer can show a CA-grade audit trace next to the answer. The library does not file returns. It does not give advice. It computes - and it tells you exactly which provision of the Act it computed under.

---

## Install

```bash
npm install @elevatefinance-co/india-tax-rules
# or
pnpm add @elevatefinance-co/india-tax-rules
# or
yarn add @elevatefinance-co/india-tax-rules
```

Requires Node 18+ (LTS), ESM project (`"type": "module"` in `package.json`), TypeScript 5+ recommended for the type-level guarantees.

---

## Quick start

### Compute slab tax under the new regime

```ts
import {
  getSlabs,
  computeSlabTax,
  computeRebate87A,
  computeSurcharge,
  computeCess,
  SURCHARGE_TIERS_INDIVIDUAL_NEW,
} from '@elevatefinance-co/india-tax-rules';

const ay = 'AY2026-27';
const taxableIncome = 1_500_000;

const slabs = getSlabs({ regime: 'NEW', ay });
const base = computeSlabTax({ taxableIncome, slabs: slabs.value, ay });
const rebated = computeRebate87A({
  taxableIncome,
  taxBeforeRebate: base.value,
  regime: 'NEW',
  ay,
});
const sur = computeSurcharge({
  taxableIncome,
  taxBeforeCess: rebated.value,
  tiers: SURCHARGE_TIERS_INDIVIDUAL_NEW,
  ay,
});
const cess = computeCess({ taxPlusSurcharge: sur.value, ay });

console.log(cess.value); // net tax after cess
console.log(cess.citations); // every Section / FA / Rule cited
console.log(cess.steps); // line-by-line trace
```

### Compute capital gain on listed equity (across the 23-Jul-2024 boundary)

```ts
import { computeLtcg112A } from '@elevatefinance-co/india-tax-rules';

const result = computeLtcg112A({
  transactions: [
    {
      saleDate: '2024-07-15', // pre-boundary -> 10%
      saleProceeds: 800_000,
      acquisitionCost: 300_000,
    },
    {
      saleDate: '2024-08-15', // post-boundary -> 12.5%
      saleProceeds: 600_000,
      acquisitionCost: 200_000,
    },
  ],
  ay: 'AY2025-26',
});

// Applies the consolidated Rs. 1.25 lakh exemption across both txns,
// computes pre-boundary tax at 10%, post-boundary tax at 12.5%,
// returns total + steps + Section 112A + Finance Act 2024 citations.
```

### Compute RSU perquisite at vest

```ts
import { sourceFmvPerUnitInr, computePerquisiteAtVest } from '@elevatefinance-co/india-tax-rules';

const grant = {
  grantDate: '2023-06-01',
  totalUnits: 1000,
  exercisePriceOriginalMinor: 0,
  originalCurrency: 'USD',
  listingStatus: 'LISTED_FOREIGN_EXCHANGE' as const,
  exchangeCountryIso2: 'US',
};

const vest = {
  vestDate: '2024-09-01',
  unitsVested: 250,
  fmvPerUnitOriginalMinor: 17_550, // 175.50 USD in cents
  originalCurrency: 'USD',
  sbiTtbrOnVestDate: 83.42,
};

const fmv = sourceFmvPerUnitInr({ grant, vest, ay: 'AY2025-26' });
const perq = computePerquisiteAtVest({
  grant,
  vest,
  fmvPerUnitInr: fmv.value,
  ay: 'AY2025-26',
});

// perq.citations = [Sec. 17(2)(vi), Rule 3(8), Rule 3(8)(iii)(c), FA 2024]
```

---

## What is inside

```
+---------------------+----------------------------------------------+
| Module              | What it models                               |
+---------------------+----------------------------------------------+
| slabs               | Tax slab tables per regime per AY            |
| slab-compute        | Apply a slab table to a taxable income       |
| rebate-87a          | Section 87A rebate, multi-AY thresholds      |
| surcharge           | Tier-based surcharge with marginal-relief    |
| cess                | 4% Health and Education Cess                 |
| capital-gains       | STCG 111A, LTCG 112A, LTCG 112, VDA 115BBH   |
| deductions          | Section 80-series with new-regime guard      |
| rsu-perquisite      | Rule 3(8) FMV sourcing + Section 17(2)(vi)   |
|                     | perquisite at vest + Section 49 cost basis   |
| citations           | The structured citation type system          |
+---------------------+----------------------------------------------+
```

Every function returns `ComputationResult<T>`:

```ts
type ComputationResult<T> = {
  value: T;
  steps: ComputationStep[]; // line-by-line breakdown
  citations: Citation[]; // structured provenance
  ay: AssessmentYear; // which AY governed the compute
  engineVersion: string; // library version, for audit
};
```

Subpath exports (use only what you need, keep your bundle minimal):

```ts
import { getSlabs } from '@elevatefinance-co/india-tax-rules/slabs';
import { computeSection80c } from '@elevatefinance-co/india-tax-rules/deductions';
import { computeLtcg112A } from '@elevatefinance-co/india-tax-rules/capital-gains';
import { sourceFmvPerUnitInr } from '@elevatefinance-co/india-tax-rules/rsu-perquisite';
import { SECTIONS, RULES } from '@elevatefinance-co/india-tax-rules/citations';
```

---

## The citation system

A citation is the moat. Without a citation, a number is folklore. With a citation, a number is auditable.

```
Citation = SectionCitation
         | CircularCitation
         | NotificationCitation
         | FinanceActCitation
         | IcaiGnCitation
         | RuleCitation
```

Each variant carries the fields a downstream UI needs to render a deep link:

```
SectionCitation       act, section, subSection?, clause?
CircularCitation      number, date, url?
NotificationCitation  number, date, url?
FinanceActCitation    year, section?
IcaiGnCitation        number, year, url?
RuleCitation          ruleNumber
```

Canonical lookup tables live in `citations/`:

```
SECTIONS.SEC_87A      "Section 87A, Income Tax Act 1961"
RULES.RULE_3_8        "Rule 3(8), Income Tax Rules 1962"
FINANCE_ACTS.FA_2024  "Finance Act 2024 (no. 02 of 2024)"
```

A consumer renders these any way it likes - a hyperlink to `indiacode.nic.in`, a tooltip with the bare-act language, a printable audit appendix. The library does not pre-decide; it gives you the data and gets out of the way.

A `dedupeCitations` utility deduplicates structurally so a long computation chain does not leave the user staring at the same Section 87A row five times.

---

## AY versioning, why past years are immutable

Every assessment year is its own module:

```
src/slabs/
  ay-2025-26.ts
  ay-2026-27.ts
  index.ts          # router by ay
```

A retrospective amendment to FY 2024-25 in a future Finance Act **creates a new AY variant**. It never mutates `ay-2025-26.ts`. This is how a CA's filing for AY 2025-26, computed today, will produce the same result if recomputed in 2031.

Some rules also have intra-AY split dates. For example, the Finance Act 2024 changed STCG 111A from 15% to 20% and LTCG 112A from 10% to 12.5%, both effective 23 July 2024. The library handles this inside `capital-gains/` by partitioning input transactions by sale date and applying the right rate to each partition. The consumer passes raw transactions; the library does the partitioning.

```
+-----------------+--------------------------------------------+
| Rule            | Behaviour                                  |
+-----------------+--------------------------------------------+
| Past AYs        | Frozen. New AY in a separate file.         |
| Split dates     | Library partitions inputs and applies      |
|                 | the right rate per partition.              |
| Date.now()      | Never called. AY is always a parameter.    |
| Randomness      | Never used.                                |
| Filesystem / IO | None.                                      |
+-----------------+--------------------------------------------+
```

---

## Two consumption modes

### As an npm dependency (recommended)

```jsonc
{
  "dependencies": {
    "@elevatefinance-co/india-tax-rules": "^0.1.0",
  },
}
```

### As a workspace peer (monorepo development)

If you are developing this library together with a consuming app inside the same workspace, point at the local source:

```jsonc
{
  "dependencies": {
    "@elevatefinance-co/india-tax-rules": "file:../elevate-core/packages/core",
  },
}
```

A thin adapter / bridge module on the consuming side keeps the import surface identical between the two modes, so flipping is a one-line change in `package.json`.

---

## Worked examples

Five end-to-end examples are available in `docs/examples/`:

```
docs/examples/
  simple-slab-tax.ts             slab + rebate + surcharge + cess
  capital-gains-listed-equity.ts LTCG 112A across the 23-Jul-2024 split
  rsu-perquisite.ts              Rule 3(8) -> perquisite -> cost basis
  deductions-with-regime-guard.ts 80C disallowed under new regime
  audit-trail-receipt.ts         render ComputationResult as audit JSON
```

Each example is a self-contained `.ts` file. Run with `tsx` or copy into your project.

---

## Integration patterns

**ITR filer.** Call `computeSlabTax` -> `computeRebate87A` -> `computeSurcharge` -> `computeCess`. Project the steps[] into a "show my work" expander. Project the citations[] into a footer with deep links to indiacode.nic.in.

**CA-firm software.** Same composition. Persist the `ComputationResult` as JSON next to each filing's row. The audit trail is built-in; no separate artefact needed.

**HR platform / payroll.** Per employee, per vest event, call `sourceFmvPerUnitInr` then `computePerquisiteAtVest`. Render the output as a payslip line item with the Section 17(2)(vi) citation attached. Now the employee can defend the number to their CA.

**LLM / AI assistant.** Ground the assistant's answers on this library's citations. The user asks "what is my Section 80C entitlement"; the assistant calls `computeSection80c` with the user's claim, returns the value with the citation, and never hallucinates a rate.

**Student / teacher.** Read the source. Every Section is named, every rule is documented, every test case is a worked example.

---

## Testing

```
+----------------------------+------------------------------------+
| Suite                      | What it pins                       |
+----------------------------+------------------------------------+
| slabs.test.ts              | Slab tables per regime per AY,     |
|                            | age-band selection, AY transitions |
| slab-compute.test.ts       | Apply-slab arithmetic, edge cases  |
| rebate-87a.test.ts         | Multi-AY rebate thresholds         |
| surcharge.test.ts          | Tier selection, marginal relief    |
| cess.test.ts               | 4% applied across all AYs          |
| capital-gains.test.ts      | 111A / 112A / 112 / 115BBH,        |
|                            | 23-Jul-2024 split, exemption pool  |
| deductions.test.ts         | 80C cap, 80CCD(1B), 80D senior     |
|                            | tier, 80E, 80G, 80TTA / 80TTB,     |
|                            | new-regime guard                   |
| rsu-perquisite.test.ts     | FMV dispatch, perquisite, sale     |
|                            | cost basis, eligible-startup       |
|                            | deferral                           |
| citations.test.ts          | Structural equality + dedup        |
+----------------------------+------------------------------------+
| Total                      | 130 tests, all passing             |
+----------------------------+------------------------------------+
```

Coverage gate enforced in CI: lines, statements, functions all >= 95%; branches >= 90%. Index barrel modules and `types/` folders are excluded - they are pure type re-exports.

```bash
pnpm test                         # one-shot
pnpm test:watch                   # watch mode
pnpm test -- --coverage           # with coverage report
```

---

## Local development

### Prerequisites

```
+----------------+-------------------+
| Tool           | Version           |
+----------------+-------------------+
| Node.js        | >= 18 (>= 20 LTS) |
| pnpm           | >= 10             |
+----------------+-------------------+
```

### Build, test, typecheck

```bash
pnpm install                      # from monorepo root
pnpm -C packages/core build       # tsc -p tsconfig.build.json
pnpm -C packages/core test        # vitest run
pnpm -C packages/core typecheck   # tsc --noEmit
pnpm -C packages/core lint        # tsc --noEmit (alias for now)
```

### Releasing

The repo uses Changesets. To propose a release:

```bash
pnpm changeset                    # interactive: which packages, what semver, what summary
git add .changeset/*.md
git commit -m "chore: release notes for X"
```

When the PR merges, the release workflow at `.github/workflows/release.yml` versions the package, generates notes, builds, and publishes to npm with `--provenance` (OIDC attestation, verifiable on the npm page).

---

## Contributing

Pull requests are welcome from anyone. To merge, a PR must:

1. **Cite the law.** Every rate, threshold, or ceiling change carries a `Citation` pointing to the exact Section + Finance Act + effective AY (and ICAI Guidance Note where relevant). The citation is the bar; the maintainer checks it before merging.

2. **Maintain >= 95% coverage and >= 90% branch coverage** on the module touched. CI enforces this; PR cannot merge without it.

3. **Introduce zero runtime dependencies.** Dev dependencies are fine.

4. **Leave past AY modules untouched.** A retrospective amendment in a future Finance Act ships as a new AY variant, never as a mutation of an existing AY file.

5. **Pass typecheck, tests, gitleaks** in CI.

A "CITATION DISPUTE" tag exists on the GitHub issue tracker for disputed citations; maintainer reviews within seven days, fix ships in the next patch release.

---

## Release cadence

When a Finance Act is assented to by the Rashtrapati Bhavan and gazetted, the library ships an updated AY module within seventy-two hours. This cadence is the velocity moat; it is faster than any closed-source tax tool can manage because the open-source community shares the load.

Versioning follows Changesets-driven semver:

```
Patch        bug fixes, citation corrections, retrospective AY
             amendments (which always add a new AY, never mutate)
Minor        new AY module, new deduction / rule
Major        breaking type changes (rare in v0.x)
```

---

## Security and reporting

This library has no PII storage, no network, no filesystem, no I/O. Pure functions only. The attack surface is supply-chain and rule-correctness.

- Software vulnerabilities: email `support@elevatefinance.co` (private channel, 48-hour acknowledgement target, 7-day patch target). Do not file software vulns as public GitHub issues.
- Rule correctness: open a public GitHub issue with a "CITATION DISPUTE" tag, attach the primary source. Maintainer reviews within seven days.

See `SECURITY.md` for the full reporting flow.

---

## Legal boundary

This library is software. It is not tax advice, not financial advice, not investment advice. It does not file returns. It does not represent anyone before any tax authority. Adopters are responsible for cross-checking outputs against the underlying primary sources (`indiacode.nic.in`, `incometaxindia.gov.in`, the e-gazette, ICAI Guidance Notes).

The maintainers are not Chartered Accountants. The maintainers are not SEBI-registered investment advisers. The library is provided "AS IS" under the MIT licence, with no warranty of fitness for any particular purpose.

See `DISCLAIMER.md` for the full legal text.

---

## Roadmap

```
v0.2 horizon       Form 67 (Foreign Tax Credit) generator, Schedule
                   FA helpers, full TDS rate card, more 80-series
                   sections, eligible-startup window edge cases.
v0.3 horizon       DTAA treaty rate tables (US, UK, Singapore, UAE,
                   Canada, Germany), Rule 128
                   proportionate FTC, carry-back logic.
v0.4 horizon       Companion packages: india-fx-rates (SBI TTBR /
                   RBI reference rates), schedule-vda-mapper, ITR
                   schedule emitters (Schedule FA, Schedule CG,
                   Schedule TR).
Beyond             Adjacent rule libraries (Singapore IRAS, UAE
                   corporate tax) under the same citation-first
                   discipline.
```

---

## License

MIT. See `LICENSE` at the repo root.

Copyright ElevateFinance.
