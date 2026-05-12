# `@elevatefinance-co/india-tax-rules`

> The deterministic, citation-first, exhaustively tested rules engine for Indian tax compliance. Income Tax, GST, and TDS. Zero runtime dependencies. Frozen per assessment year. MIT licensed.

Every function in this library returns not just a number but a structured result that carries the full set of citations - the Section, the sub-section, the Finance Act year, the CBIC notification, the CBDT circular, the ICAI guidance note - that produced it. The library is the deterministic core that powers Elevate Finance's commercial product; we publish it openly so every rate, every threshold, every section reference is auditable by the people who need to trust the number: the customer, the chartered accountant, the regulator.

```
npm install @elevatefinance-co/india-tax-rules
```

---

## Table of contents

| #   | Section                       | What it covers                                             |
| --- | ----------------------------- | ---------------------------------------------------------- |
| 1   | About                         | What this is, who uses it, why it exists                   |
| 2   | Install + quick start         | One line to install, five lines to compute                 |
| 3   | The citation-first philosophy | Why every output carries its legal basis                   |
| 4   | Coverage                      | What is in the library today (versions, forms, sections)   |
| 5   | API reference                 | Every exported function with its type signature            |
| 6   | Determinism guarantees        | Pure, no I/O, no time, no randomness, reproducible         |
| 7   | Rule taxonomy                 | How the source is organised; how a contributor adds a rule |
| 8   | Contribution guide            | How to file an issue, how to submit a PR                   |
| 9   | Security                      | Responsible disclosure                                     |
| 10  | Versioning + changelog        | SemVer + changesets + the immutability promise             |
| 11  | License                       | MIT                                                        |
| 12  | Acknowledgements              | The people who reviewed                                    |
| 13  | About Elevate Finance         | The publisher                                              |

---

## 1. About

`@elevatefinance-co/india-tax-rules` is the open-source rules engine for Indian tax computations. It implements the rate tables, the section eligibility logic, the regime-specific carve-outs, the holding-period dispatch, the FMV sourcing, the credit-blocking rules, and the penalty arithmetic that the Income Tax Act, the CGST Act, the IGST Act, the SGST Acts, the Finance Acts, the IT Rules, the CGST Rules, the CBDT circulars, and the CBIC notifications collectively describe.

The library is the same code that powers the consumer-facing and CA-facing surfaces of the Elevate Finance product. Publishing it openly is a trust commitment: a rules engine that decides someone's tax liability has to be auditable, and the strongest form of audit is "anyone can read the source".

| Who uses this library    | What they do with it                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Indian tax-tech builders | Skip the year of rule-extraction work and the year of fixture-collection work; build on top        |
| Chartered accountants    | Verify a computed number against the cited section without re-reading the bare act                 |
| Open-source contributors | Add a new section, refine a rate table, lift a worked example from a CBDT circular into a fixture  |
| Regulators and auditors  | Read the discipline behind every number; confirm that past assessment years are frozen and citable |
| Curious developers       | See how a non-trivial tax statute compiles into pure TypeScript                                    |

The library does not file returns. It does not generate PDFs. It does not store data. It computes and cites. Everything else is the responsibility of the consumer.

---

## 2. Install + quick start

### Install

```
npm install @elevatefinance-co/india-tax-rules
pnpm add @elevatefinance-co/india-tax-rules
yarn add @elevatefinance-co/india-tax-rules
```

### Quick start

```ts
import { computeSlabTax, getSlabs } from '@elevatefinance-co/india-tax-rules';

const result = computeSlabTax({
  regime: 'NEW',
  ay: 'AY2025-26',
  taxableIncomeInr: 1_500_000,
  ageBand: 'GENERAL',
});

console.log(result.value);
// 105000

console.log(result.steps[0]);
// {
//   label: 'Slab 1 (0 to 300000)',
//   formula: '300000 * 0 = 0',
//   inputs: { lowerBound: 0, upperBound: 300000, rate: 0 },
//   output: 0,
//   citations: [{ kind: 'section', act: 'IT Act 1961', section: 115, subsection: 'BAC' }],
// }

console.log(result.citations);
// [
//   { kind: 'section', act: 'IT Act 1961', section: 115, subsection: 'BAC', ... },
//   { kind: 'finance-act', year: 2024, section: 14 },
// ]

console.log(result.ay); // 'AY2025-26'
console.log(result.engineVersion); // '0.1.0'
```

Every exported function returns a `ComputationResult<T>` that contains the answer (`value`), the line-by-line breakdown (`steps`), the deduplicated legal references (`citations`), the assessment year that was applied (`ay`), and the engine version that produced the result (`engineVersion`). The receipt is the API.

---

## 3. The citation-first philosophy

Indian tax statutes change. A rate that was 20 percent in AY 2023-24 may be 12.5 percent in AY 2024-25. A deduction that was eligible under the old regime is silently disallowed under the new regime by Section 115BAC's carve-out list. A holding period that classified an asset as long-term in one Finance Act is short-term in the next. The library's discipline is built around this reality:

| Property                                | What it means in practice                                                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every rate has a citation               | A `TaxSlab` in code includes the slab number, the bounds, the rate, and the `Citation` (the Section, the Finance Act year, the date) that authorises that rate                          |
| Past assessment years are frozen        | The slab table for AY 2025-26 lives at `src/slabs/ay-2025-26.ts`. That file is never edited after commit. New years land in new files.                                                  |
| Every output carries provenance         | A computation done in 2025 returns the citations that produced it. The same input plus the same library version recomputed in 2031 returns the same value and the same citations.       |
| Fixtures are lifted from primary source | Every test fixture pins a worked example from the bare act, a CBDT circular, a CBIC notification, or an ICAI publication. The fixture is the contract; the implementation satisfies it. |
| Citations point at the right form       | A `Citation` is a discriminated union: `section`, `rule`, `circular`, `notification`, `finance-act`. Each form has the fields a reader needs to find the source.                        |

The promise is auditability: a 2025-26 filing computed today, audited by a chartered accountant in 2031 against an Income Tax department notice, reproduces identically and the CA can verify every number against the citation trail.

---

## 4. Coverage

What the library covers today. The version surfaced below corresponds to the current `package.json`.

### Assessment years

| Year          | Status                                                   |
| ------------- | -------------------------------------------------------- |
| AY 2025-26    | Frozen                                                   |
| AY 2026-27    | Frozen                                                   |
| Earlier years | Not encoded (build forward, do not back-fill)            |
| Later years   | Land in new immutable files when published by Parliament |

### Tax regimes

| Regime                                       | Status                                        |
| -------------------------------------------- | --------------------------------------------- |
| Old regime (general / senior / super-senior) | Live                                          |
| New regime (Section 115BAC)                  | Live, with eligible-deductions carve-out list |

### ITR-related computations

| Surface                   | Section                      | Status                                              |
| ------------------------- | ---------------------------- | --------------------------------------------------- |
| Slab tax                  | Section 14 / 115BAC          | Live                                                |
| Rebate                    | Section 87A                  | Live, per regime                                    |
| Surcharge                 | Section 112(2)               | Live, by income band + regime                       |
| Cess                      | Section 4 + 111A interaction | Live                                                |
| STCG (listed equity)      | Section 111A                 | Live                                                |
| LTCG (listed equity)      | Section 112A                 | Live, old-regime indexation vs new-regime flat rate |
| LTCG (other asset)        | Section 48                   | Live, indexation under old regime                   |
| Virtual Digital Asset     | Section 2(47A), 115BBH       | Live                                                |
| Holding-period classifier | Various                      | Live                                                |

### Chapter VI-A deductions

| Section                | What it covers                                                                              | Status |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------ |
| 80C                    | LIC / PPF / ELSS / EPF / NSC / home principal / tuition / SSY / SCSS / FD-5yr (cap Rs 150k) | Live   |
| 80CCD(1B)              | Additional NPS (cap Rs 50k)                                                                 | Live   |
| 80CCD(2)               | Employer NPS (no cap, available under new regime)                                           | Live   |
| 80D                    | Medical insurance + preventive checkup (senior Rs 50k / non-senior Rs 25k)                  | Live   |
| 80E                    | Education loan interest (no cap, 8-year window)                                             | Live   |
| 80G                    | Donations (50 / 100 percent with / without AGTI cap; cash > Rs 2k disqualified)             | Live   |
| 80TTA                  | Savings interest, non-senior (Rs 10k)                                                       | Live   |
| 80TTB                  | Deposit interest, senior (Rs 50k)                                                           | Live   |
| New-regime eligibility | Authoritative allow-list under Section 115BAC                                               | Live   |

### RSU and equity-comp computations

| Surface              | Section / Rule    | Status                                                                                |
| -------------------- | ----------------- | ------------------------------------------------------------------------------------- |
| FMV sourcing         | Rule 3(8)         | Live (Indian exchange / foreign exchange via SBI TTBR / unlisted via merchant-banker) |
| Perquisite at vest   | Section 17(2)(vi) | Live, with eligible-startup deferral                                                  |
| Cost basis at sale   | Section 49        | Live                                                                                  |
| Capital gain at sale | Section 48        | Live                                                                                  |

### GST

| Surface                                      | Section / Rule                      | Status  |
| -------------------------------------------- | ----------------------------------- | ------- |
| Rate dispatch (0 / 5 / 12 / 18 / 28 percent) | CGST + IGST schedules               | Live    |
| Blocked credit                               | Section 17(5)                       | Live    |
| Registration threshold                       | Section 22 + CBIC notifications     | Live    |
| Composition eligibility                      | Section 10                          | Live    |
| Filing frequency                             | GSTR-1 / 2B / 3B / 9 / 9C due dates | Live    |
| Place-of-supply rules                        | IGST Act Chapter V                  | Partial |

### TDS

| Surface                      | Section                                            | Status                            |
| ---------------------------- | -------------------------------------------------- | --------------------------------- |
| Per-section rate dispatch    | 192, 192A, 193, 194 (full series), 195, 196D, 206C | Live                              |
| 206AA uplift                 | Inoperative-PAN higher rate                        | Live                              |
| 206AB uplift                 | Specified-person higher rate                       | Live                              |
| Section 201(1A) interest     | Late deduction / late payment                      | Live                              |
| Section 234E late fee        | Rs 200 per day, capped                             | Live                              |
| PAN validation               | Format + checksum                                  | Live                              |
| CBDT non-filer list dispatch | Quarterly publication                              | Live (consumer plugs in the list) |

### Form scaffolding

| Form                                     | Status                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| 24Q / 26Q / 27Q / 27EQ                   | Rate + penalty logic live; form builders deferred to a later minor version |
| Form 16 / 16A / 16B / 27D PDF generation | Out of scope (live in the commercial product)                              |
| ITR PDF generation                       | Out of scope (live in the commercial product)                              |
| GSTR PDF / JSON payload generation       | Out of scope (live in the commercial product)                              |

---

## 5. API reference

Every exported function has the same return type shape:

```ts
type ComputationResult<T> = {
  value: T;
  steps: ReadonlyArray<ComputationStep>;
  citations: ReadonlyArray<Citation>;
  ay: AssessmentYear;
  engineVersion: string;
};
```

A `Citation` is a discriminated union; a `ComputationStep` is a labelled line in the audit-friendly breakdown.

### Slab dispatch

| Function                 | Signature (sketch)                                                               | Returns                                              |
| ------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `getSlabs(args)`         | `(args: { regime, ay, ageBand }) => { slabs, citations }`                        | The slab table for the chosen regime / AY / age band |
| `computeSlabTax(args)`   | `(args: { regime, ay, taxableIncomeInr, ageBand }) => ComputationResult<number>` | Slab tax with line-by-line breakdown                 |
| `computeRebate87A(args)` | `(args: { regime, ay, taxableIncomeInr, tax }) => ComputationResult<number>`     | Rebate under Section 87A                             |
| `computeSurcharge(args)` | `(args: { regime, ay, taxableIncomeInr, tax }) => ComputationResult<number>`     | Surcharge by income band                             |
| `computeCess(args)`      | `(args: { tax, surcharge }) => ComputationResult<number>`                        | Health and Education Cess                            |

### Capital gains

| Function                        | Returns                                 |
| ------------------------------- | --------------------------------------- |
| `computeListedEquitySTCG(args)` | Section 111A computation                |
| `computeListedEquityLTCG(args)` | Section 112A computation                |
| `computeOtherAssetLTCG(args)`   | Section 48 with indexation              |
| `computeVDA(args)`              | Virtual Digital Asset tax               |
| `classifyHoldingPeriod(args)`   | Routes a holding period to STCG vs LTCG |

### Chapter VI-A

| Function                       | Returns                                 |
| ------------------------------ | --------------------------------------- |
| `claimSection80C(args)`        | Section 80C claim with cap enforcement  |
| `claimSection80CCD(args)`      | Section 80CCD(1B) and 80CCD(2)          |
| `claimSection80D(args)`        | Section 80D claim with senior carve-out |
| `claimSection80E(args)`        | Section 80E (education loan interest)   |
| `claimSection80G(args)`        | Section 80G with AGTI cap               |
| `claimSection80TTA(args)`      | Section 80TTA (savings interest)        |
| `claimSection80TTB(args)`      | Section 80TTB (senior deposit interest) |
| `isNewRegimeEligible(section)` | Allow-list under Section 115BAC         |

### RSU + equity comp

| Function                        | Returns                      |
| ------------------------------- | ---------------------------- |
| `sourceFmvPerUnitInr(args)`     | Rule 3(8) FMV dispatch       |
| `computePerquisiteAtVest(args)` | Section 17(2)(vi) perquisite |
| `computeSaleCostBasis(args)`    | Section 49 cost-basis triple |

### GST namespace

| Member                               | Returns                                        |
| ------------------------------------ | ---------------------------------------------- |
| `gst.RATES`                          | The slab structure with effective-date bands   |
| `gst.isBlockedCredit(args)`          | Section 17(5) classifier                       |
| `gst.getRegistrationThreshold(args)` | Section 22 thresholds                          |
| `gst.isCompositionEligible(args)`    | Section 10 eligibility                         |
| `gst.getFilingFrequency(args)`       | GSTR-1 / 2B / 3B / 9 / 9C due dates            |
| `gst.CITATIONS`                      | The full citation registry for the GST surface |

### TDS namespace

| Member                                | Returns                                        |
| ------------------------------------- | ---------------------------------------------- |
| `tds.getRatePerSection(section, ay)`  | Section 192 onwards with 206AA / 206AB uplift  |
| `tds.computePenaltySection201(args)`  | Section 201(1A) interest                       |
| `tds.computePenaltySection234E(args)` | Section 234E late fee                          |
| `tds.isSpecifiedPerson(pan, list)`    | CBDT non-filer list dispatch                   |
| `tds.CITATIONS`                       | The full citation registry for the TDS surface |

Subpath imports work too: `@elevatefinance-co/india-tax-rules/gst`, `@elevatefinance-co/india-tax-rules/tds`, `@elevatefinance-co/india-tax-rules/deductions`, `@elevatefinance-co/india-tax-rules/capital-gains`, `@elevatefinance-co/india-tax-rules/slabs`, `@elevatefinance-co/india-tax-rules/citations`, `@elevatefinance-co/india-tax-rules/rsu-perquisite`. Each subpath exports only the relevant slice; tree-shakers see the smaller surface.

---

## 6. Determinism guarantees

The library makes five promises and enforces each in the source.

| Promise           | Enforcement                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No I/O            | Zero `fs`, `net`, `http`, `child_process`, or `dns` imports. Every function is a pure transform of its inputs.                                            |
| No implicit time  | No bare `new Date()` or `Date.now()`. Time-dependent rules take the relevant date as an explicit argument.                                                |
| No randomness     | No `Math.random()`. Every output is a function of its inputs.                                                                                             |
| Versioned outputs | Every result includes the engine version and the assessment year that was applied. The same input and same engine version always produce the same output. |
| Frozen past       | Past assessment years live in immutable per-AY modules. They are never edited.                                                                            |

These promises mean a CA can take a 2025-26 computation, re-run it in 2031 against the same library version, and reproduce every value and every citation. A regulator can read the source and confirm there is no hidden mutable state.

---

## 7. Rule taxonomy

The source is organised by tax surface.

```
src/
  citations/        Section, Finance Act, Rule, Circular registries
  slabs/            One file per assessment year (immutable)
  capital-gains/    Section 111A / 112 / 112A / VDA, holding-period classifier
  deductions/       Chapter VI-A (80C, 80D, 80E, 80G, 80TTA, 80TTB, 80CCD)
  rsu-perquisite/   Rule 3(8), Section 17(2)(vi), Section 49
  gst/              CGST + IGST rates, ITC blocked-credit, registration, composition, frequencies
  tds/              Chapter XVII-B / XVII-BB rates, penalties, PAN validation
  types/            ComputationResult, Citation, ComputationStep discriminated unions
```

### How a contributor adds a rule

```
Step 1                Step 2                Step 3                Step 4                Step 5
-----                 -----                 -----                 -----                 -----
Open an issue.        Lift a worked         Add the fixture.      Implement the         Add a changeset.
Cite the section,     example from the      The fixture pins      function. Make        Open the PR.
rule, or circular.    primary source.       the expected output   the fixture pass.     The gate runs.
Name the AY.          Read it twice.        verbatim.             Add more fixtures.    Maintainer reviews.
```

The fixture-first cadence is non-negotiable: an implementation without a fixture lifted from primary source is not merged. The primary source can be the bare act, a CBDT / CBIC notification, a circular, a Finance Act, or an ICAI publication. URLs are recorded in the citation.

---

## 8. Contribution guide

| Type of contribution   | What to do                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Rule-correctness issue | Open a `bug` issue. Cite the section. Describe the expected output and the actual output. Include the input. |
| Missing rule           | Open a `feature` issue. Cite the section. Describe the gap.                                                  |
| Pull request           | Read `CONTRIBUTING.md`. Add a fixture. Implement to satisfy the fixture. Add a changeset. Open the PR.       |
| Documentation          | Open a `docs` PR. The README, the per-surface docs, and the citation registry headers are the documentation. |

Five non-negotiable ground rules:

1. Every rate, threshold, eligibility check, and carve-out carries a citation pointing to primary source.
2. Every implementation is preceded by a fixture lifted from primary source verbatim.
3. Past assessment years are immutable. Edits to a past-AY file are rejected at review.
4. Zero runtime dependencies. The library is a pure transform; if a contribution adds a dependency, it is rejected.
5. Pure functions. No I/O, no global state, no Date.now, no Math.random.

CAs and tax professionals are explicitly invited to file rule-correctness issues. A correct citation plus an input plus an expected output is the most valuable contribution this project receives.

---

## 9. Security

If you discover a vulnerability that could affect computations or production users of `@elevatefinance-co/india-tax-rules`, please report it through the responsible-disclosure path documented in `SECURITY.md` rather than the public issue tracker. We respond within one business day, triage within three, and ship a fix on a timeline appropriate to the severity. Public disclosure happens jointly with the reporter after the fix lands.

---

## 10. Versioning and changelog

The library follows SemVer. Versions are managed via changesets.

| Change type                                  | What it triggers                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| New AY landed (new module)                   | Minor version bump                                                     |
| Rate or threshold correction (with citation) | Patch version bump on the correction; the past-AY file is never edited |
| Public API change                            | Major version bump                                                     |
| Bug fix on current AY                        | Patch version bump                                                     |
| New section coverage                         | Minor version bump                                                     |

Every PR includes a changeset describing the user-visible change. On merge to main, the changesets workflow opens a release PR; merging that PR publishes the new version to npm.

Read the full version history in `CHANGELOG.md`.

---

## 11. License

MIT. See `LICENSE`.

The MIT license is deliberate: a tax-rules library has to be usable by anyone, including direct competitors of the publisher. Reusing the source is fine; reusing the discipline behind the source (the fixture-first cadence, the citation rigour, the immutable-past commitment) is the part that is hard to copy.

---

## 12. Acknowledgements

This library is the result of months of collaboration with chartered accountants and tax professionals who patiently reviewed every rate table, every threshold, every carve-out. They are named in private acknowledgements with their consent; the public credit is "the practitioners who reviewed". Their work made the citation-first commitment possible.

The library also stands on the shoulders of:

| Project                   | What we use                        |
| ------------------------- | ---------------------------------- |
| TypeScript                | The language                       |
| Vitest                    | The test runner                    |
| Stryker                   | Mutation testing                   |
| Zero runtime dependencies | The intentional dependency posture |

Issues, PRs, and rule-correctness reports from the community are the second-largest contributor to the library's coverage. Thank you.

---

## 13. About Elevate Finance

`@elevatefinance-co/india-tax-rules` is published by Elevate Finance, a private company building Indian tax-compliance software for consumers, chartered accountants, and enterprises. The library is open-source under MIT and usable by anyone, including competitors of the company.

We publish openly because a rules engine that decides someone's tax liability must be auditable, and the strongest form of audit is "anyone can read the source". The discipline that produces the library - fixture-first per citation, frozen per assessment year, zero dependencies, pure functions - is the same discipline we apply to every line of the commercial product.

Learn more at `https://elevatefinance.co`.

---

This README is the canonical reference for the public library. The code is the source of truth. When the two diverge, the code wins and this document is updated in the next pass.
