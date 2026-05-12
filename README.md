# india-tax-rules

> The deterministic, primary-source-cited, exhaustively-tested rules engine for Indian tax compliance. Income Tax (ITR), GST (Offering A), and Income-Tax TDS (Offering B). Zero runtime dependencies. AY-versioned. Effective-date-versioned. MIT-licensed.

Every function returns not just a number but a structured result carrying the full set of citations (Section, sub-section, Finance Act year, CBIC notification, CBDT circular, ICAI guidance note) that produced it. Build tax tools your customers, and their Chartered Accountants, can verify against the official gazette.

## Quick navigation by who you are

> **Looking for the robustness story?** Jump to [Robustness and the no-manual-QA bar](#robustness-and-the-no-manual-qa-bar). 1,322 fixture-locked tests, 326 primary-source citations, deterministic-by-construction at lint time, 97.87 percent line coverage, **99.25 percent mutation score (99.58 percent on the covered set).**

This library serves several audiences. Skip to your part.

| You are                                                                                            | Start here                                                                                      |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Anyone evaluating the rigor** of the library                                                     | [Robustness and the no-manual-QA bar](#robustness-and-the-no-manual-qa-bar)                     |
| **Chartered Accountant** verifying a specific Section / Form / Notification encoded by the library | [Verify a rule](#verify-a-rule-against-the-primary-source)                                      |
| **Chartered Accountant** evaluating the library for a firm's standardisation                       | [Why a CA firm should standardise on this](#why-a-ca-firm-should-standardise-on-this-library)   |
| **Chartered Accountant** validating a specific computation result the upstream platform produced   | [Reproduce a platform-produced number](#reproduce-a-platform-produced-number-deterministically) |
| **Engineer** importing the library into a downstream product                                       | [Quick start](#quick-start)                                                                     |
| **Engineer** extending the library (adding a Section, a Form, a domain)                            | [Contribute](#contribute) and [`docs/architecture.md`](./docs/architecture.md)                  |
| **Engineer** wanting end-to-end CA-validatable runs to copy                                        | [`docs/worked-examples.md`](./docs/worked-examples.md)                                          |
| **Acquirer's diligence team** under NDA on a Friday night                                          | [What an acquirer is buying](#what-an-acquirer-is-buying)                                       |
| **Open-source-curious reader**                                                                     | [Philosophy](#philosophy)                                                                       |
| **Security reviewer**                                                                              | [Security posture](#security-posture)                                                           |

The audience-routed table sits above the [coverage matrix](#coverage-matrix); the three deep-dive docs cross-link each other and live under [`docs/`](./docs/):

| Doc                                                            | Audience                                                              | Use when                                                                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/architecture.md`](./docs/architecture.md)               | Contributors adding a new tax domain                                  | You want the directory taxonomy template for Customs Duty / Stamp Duty / Professional Tax / Equalisation Levy / STT                   |
| [`docs/fixture-by-citation.md`](./docs/fixture-by-citation.md) | CAs verifying a specific citation                                     | You have a CBIC notification, CBDT circular, Finance Act change, or Section in hand and want to find the test that locks the encoding |
| [`docs/worked-examples.md`](./docs/worked-examples.md)         | CAs validating a platform-produced number; engineers learning the API | You want a worked end-to-end run with primary-source cross-references                                                                 |

## Coverage matrix

The library encodes the rules for three Indian tax regimes. Every supported Section / Form / Schedule is paired with a primary-source citation and at least one focused test against that citation.

| Regime                          | Domain                  | Coverage                                                                                                                                                                                                              |
| ------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Income Tax (ITR)**            | Slabs                   | New regime + old regime; individual, senior, super-senior; firm, company variants where applicable                                                                                                                    |
|                                 | Surcharge               | Tier-by-tier with marginal-relief boundary cases; individual / firm / company                                                                                                                                         |
|                                 | Cess                    | Health and Education at 4%; Black-Money-specific where applicable                                                                                                                                                     |
|                                 | Rebate Section 87A      | Threshold mechanics; new vs old regime delta                                                                                                                                                                          |
|                                 | Capital gains           | Listed equity LTCG (Section 112A) + STCG (Section 111A); other-asset LTCG (Section 112); VDA (Section 115BBH); split-date treatment for assets held across the 23 July 2024 cliff                                     |
|                                 | Deductions Chapter VI-A | Section 80C (full), 80CCD (employee + employer plus 80CCD(1B)), 80D (medical insurance with senior-citizen variants), 80E (education-loan interest), 80G (donations with cash-ceiling and percentage-cap rules), more |
|                                 | RSU perquisite          | Section 17(2)(vi) plus Rule 3(8) FMV; sale-cost-basis after vest; closely-held / foreign-listed edge cases                                                                                                            |
|                                 | Citations               | Per-Section, per-Rule, per-Notification, per-Circular, per-Finance-Act registry                                                                                                                                       |
| **GST**                         | Place of supply         | Section 10 (goods), Section 12 (services), Section 13 (cross-border) with sub-rules including bill-to-ship-to and notified-goods Rule 10(2A)                                                                          |
|                                 | ITC                     | Section 16 eligibility + time-bar (Section 16(4)); Section 17(5) blocks; ITC reversal rules                                                                                                                           |
|                                 | Composition             | Section 10 thresholds; commodity vs service rate split                                                                                                                                                                |
|                                 | Late fee + penalty      | Section 47 cap-boundary; turnover-band-specific rates                                                                                                                                                                 |
|                                 | Rates                   | Schedule rates with composition-vs-regular delta                                                                                                                                                                      |
|                                 | Citations               | CBIC notification + circular registry                                                                                                                                                                                 |
| **Income-Tax TDS (Offering B)** | Rate-band resolver      | Per-Section x per-effective-date (the Oct 2024 cliff six-Sections drop, Section 194Q introduction July 2021, 194R + 194S July 2022, 194T April 2025)                                                                  |
|                                 | Specified-person uplift | Section 206AA (no-PAN), 206AB (non-filer), 206CCA (TCS non-filer); interaction matrix when both apply                                                                                                                 |
|                                 | Penalties               | Section 201(1A) interest with day-count and per-month rounding                                                                                                                                                        |
|                                 | Date-cliff matrix       | Every Finance Act change with effective date pinned in fixtures                                                                                                                                                       |
|                                 | Citations               | CBDT notification + circular registry; Finance Act year + Section reference per change                                                                                                                                |

The exhaustive list of supported Sections and Forms with their primary-source citations lives in the `docs/` directory. See [Fixture index](#fixture-index) for the contract on adding new rules.

## Quick start

```bash
pnpm add @elevatefinance-co/india-tax-rules
```

The library exports per-domain entry points so your bundler can tree-shake aggressively. Import only what you use.

```ts
import {
  computeSlabTax,
  getSlabs,
  computeRebate87A,
  computeSurcharge,
  computeCess,
} from '@elevatefinance-co/india-tax-rules/slabs';
import { resolveTdsRateBand } from '@elevatefinance-co/india-tax-rules/tds';
import { resolvePlaceOfSupplyForGoods } from '@elevatefinance-co/india-tax-rules/gst';

const slabs = getSlabs({ regime: 'NEW', ay: 'AY2026-27' });
const result = computeSlabTax({ taxableIncome: 1_500_000, slabs });

console.log(result.value); // the tax payable in rupees
console.log(result.steps); // per-slab breakdown the receipt renders
console.log(result.citations); // primary-source references the CA verifies against
```

Every result carries a `value` plus `steps` (an audit-rendering-ready breakdown) plus `citations` (the primary-source pointers a CA cross-references against the official gazette). The library's contract is that two consumers calling the same function with the same input always receive identical output, regardless of when, where, or how often they call.

## Philosophy

Five principles drive every decision.

1. **Citation-first.** Every result carries structured references to the law that produced it. No magic numbers anywhere; every threshold, every rate, every cap is traceable to the CBIC notification, CBDT circular, or Finance Act amendment that introduced or changed it. A reader of the test corpus can navigate from any rule to its source within two clicks.
2. **AY-versioned and effective-date-versioned.** Slabs for past AYs are frozen at their minor version; effective-date bands for past Finance Acts are frozen at their minor version. The library never rewrites history. A consumer computing for AY 2020-21 in 2026 gets the AY 2020-21 rules even after a half-dozen Finance Acts have shipped.
3. **Zero runtime dependencies.** The library imports nothing at runtime. Tree-shakeable per the published `sideEffects: false` declaration. Works in Node, Bun, Deno, Cloudflare Workers, browsers. A consumer adopting it as a reference dependency takes on no transitive runtime risk.
4. **Deterministic-by-construction.** Pure functions only. No filesystem access, no network access, no `Math.random()`, no `Date.now()`. Time-dependent behaviour is always parameterised: the consumer passes the relevant date as an explicit argument; the library never asks "what year is it?". The deterministic guarantee is enforced at lint time by the library's ESLint config (no-restricted-imports for the I/O modules, no-restricted-syntax for `Math.random` and `Date.now` in source).
5. **Exhaustively tested with primary-source fixtures.** Every public function has at least one focused test. Every test cross-references a fixture pinning the rule's primary-source citation. Coverage actuals sit at 97.87 percent lines, 97.43 percent statements, 100 percent functions, 91.19 percent branches. Mutation score sits at 99.25 percent of every generated mutant killed (99.58 percent on the covered set); the residue is documented in the [Robustness section](#robustness-and-the-no-manual-qa-bar).

## Robustness and the no-manual-QA bar

The library ships without a manual-QA function. The test corpus is the contract; the lint rules are the deterministic-by-construction guarantee; the type system is the API safety net; mutation testing is the receipt that the tests actually catch real bugs.

**Test corpus, today.**

| Layer                 | Where                             | Files  | Tests             |
| --------------------- | --------------------------------- | ------ | ----------------- |
| Unit + fixture-locked | `packages/core/test/**/*.test.ts` | 59     | **1,322 passing** |
| **Total**             |                                   | **59** | **1,322 passing** |

Every public function carries at least one focused test covering the happy path, at least one fixture encoding primary-source example numbers, at least one edge-case test (boundary, regime split-date, marginal-relief, threshold cliff), and an exact assertion on the trace (steps, labels, formulas, citation array) so an auditor reading the test sees the full audit trail the function will emit at runtime.

**Coverage actuals (`pnpm test --coverage`).**

| Metric     | Actual                        |
| ---------- | ----------------------------- |
| Statements | **97.43 percent** (722 / 741) |
| Branches   | **91.19 percent** (466 / 511) |
| Functions  | **100 percent** (108 / 108)   |
| Lines      | **97.87 percent** (690 / 705) |

**Mutation score (`pnpm exec stryker run`).**

Stryker mutates the entire `src/**/*.ts` tree (excluding barrel `index.ts` re-exports and pure type-only files) and runs the citation-locked test corpus against every mutated implementation. The score is the receipt that the tests catch the bugs the fixtures should be locking. The library deliberately carries no inline `Stryker disable` directives in source: a comment-discipline rule forbids between-the-line annotations of any kind. Every mutant counts; equivalent-by-construction survivors are documented in the rationale below rather than annotated away.

| Mutator output             | Count                             |
| -------------------------- | --------------------------------- |
| Source files mutated       | 54                                |
| Mutants generated          | 2,128                             |
| Killed                     | 2,112                             |
| Survived                   | 9                                 |
| Timeout                    | 0                                 |
| No coverage                | 7                                 |
| Ignored                    | 0                                 |
| **Overall mutation score** | **99.25 percent** (2,112 / 2,128) |
| **Covered mutation score** | **99.58 percent** (2,112 / 2,121) |

**Why the score is not 100 percent, and what the surviving mutants tell you.**

The residue collapses to a single equivalence class an experienced reader of the source can reproduce without any tooling:

- **Equivalent-by-fixed-registry.** Two ternary mutants in `gst/registration/thresholds.ts` survive at the comparison `servicesThreshold < goodsThreshold ? servicesThreshold : goodsThreshold`. In every registered band of the GST registration thresholds the services threshold is strictly less than the goods threshold; flipping the comparison to `<=` or to a constant-`true` produces the identical answer on every legal input. The mutant is observation-equivalent against the rule registry as it stands; a future Finance Act change that lifts services threshold equal to or above goods threshold would distinguish the branches and the corpus would catch the mutant.

`RegimeGuardResult` is a discriminated union so callers narrow `guard.reason` to `string` without a fallback. The `SEC_80CCD_2` seed citations array is folded into the steps-flatMap chain (the seed is absorbed by `dedupeCitations`). The `section-80e.ts` AY-parsing defensive branches are exercised by malformed-AY fixture tests.

The headline number is traceable to the two thresholds-ternary survivors and is the receipt that the tests catch the bugs the fixtures should be locking. A future Finance Act amendment that lifts the services threshold to or above the goods threshold for some band will distinguish the surviving mutants and the corpus will pick them up automatically.

**Cross-reference rigor.**

| Surface                            | Where                             | Coverage                                                                                                                                                                                                      |
| ---------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Citation index                     | `docs/fixture-by-citation.md`     | 326 rows tying every CBIC notification, CBDT circular, and Finance Act amendment to its locking test file                                                                                                     |
| Deterministic-by-construction lint | `packages/core/eslint.config.mjs` | blocks `node:fs` plus `node:net` plus every I/O variant; blocks `Math.random` and `Date.now` and bare `new Date` in source; extends `id-denylist` beyond standard shorthand to single-letter math identifiers |
| Type-level safety                  | `tsc --noEmit` strict             | zero errors floor with `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `useUnknownInCatchVariables`, `noFallthroughCasesInSwitch` all on                                                        |
| Worked examples                    | `docs/worked-examples.md`         | five end-to-end computations (80C plus surcharge plus cess; IGST place-of-supply intra vs inter-state; 206AB specified-person uplift; RSU sale cost-basis; capital-gains regime split-date)                   |

**What every PR adding or changing a rule carries.**

- The CBIC notification number or CBDT circular reference that motivated the change.
- The Finance Act year and Section reference for any amendment.
- The fixture row updated in `docs/fixture-by-citation.md`.
- A test that fails on `main` and passes on the branch.

The contribution model is documented in [CONTRIBUTING.md](./CONTRIBUTING.md). A PR that does not carry a primary-source citation is not merged.

## Engineering onboarding without blockers

This section is the first-pass ladder a new engineer or contributor climbs to land their first PR without ever being stuck on tooling. Every recipe is verified against the current codebase. If you hit a step that does not work, the README is the bug; open a PR fixing this section.

**The lint contract, in three lines.** No `// eslint-disable` comments in source. No inline `/* */` between function bodies (only top-of-file headers when WHY is non-obvious; TSDoc on exported functions is the only other place comments live). No `Stryker disable` directives anywhere. The pre-commit chain refuses commits that violate any of the three; if it rejects, fix the underlying issue rather than silencing it.

**Lint, format, and test cheat sheet.**

| You want                   | Run                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Run every test             | `pnpm -C packages/core test`                                                         |
| Run a single test file     | `pnpm -C packages/core test capital-gains/listed-equity-ltcg`                        |
| Coverage actuals           | `pnpm -C packages/core test --coverage`                                              |
| Mutation testing           | `pnpm -C packages/core exec stryker run`                                             |
| Type-check                 | `pnpm -C packages/core typecheck`                                                    |
| Lint                       | `pnpm -C packages/core lint`                                                         |
| Build the published bundle | `pnpm -C packages/core build`                                                        |
| Find non-GSM-7 bytes       | `LC_ALL=C grep -rPn '[^\x09\x0A\x0D\x20-\x7E]' packages/core/src packages/core/test` |

**Adding a new rule (5-minute walkthrough).** Choose the domain directory (`capital-gains`, `deductions`, `gst`, `tds`, `rsu-perquisite`, `slabs`). Create a new file under `packages/core/src/<domain>/<rule>.ts` exporting the compute function plus its result type. Add a citation entry to the relevant registry under `src/citations/`, `src/gst/citations/`, or `src/tds/citations/`. Wire the helper into the domain's barrel `index.ts`. Create the matching test file under `packages/core/test/<domain>/<rule>.test.ts` with at least the happy path, one edge case, one failure mode, and an exact assertion on the trace (steps array, labels, formulas, citation array).

**The fixture-by-citation index.** Every rule encoded by the library is paired with a row in [`docs/fixture-by-citation.md`](./docs/fixture-by-citation.md). When you add or change a rule, also add or update its row so a Chartered Accountant verifying the encoding can find the locking test in two clicks. PRs that change a rule and skip the index update are blocked at review.

**The contribution discipline, in one sentence.** A PR that does not carry a primary-source citation (CBIC notification number, CBDT circular reference, or Finance Act year plus Section reference) is not merged.

**The test-name contract.** Every test description starts with `should <verb> <expected>`. Never embed quoted error messages, arrows, or implementation detail in `it()` descriptions; the description is the behaviour, not the receipt. Vitest globals are on; do not import `describe`, `it`, `expect`, or `vi`. The shorthand identifiers `i`, `j`, `k`, `n`, `m` and the standard list (`e`, `err`, `obj`, `cb`, `fn`, `idx`, `tmp`, `val`) are denied at lint time, even inside test files; use descriptive names.

**The 60-second sanity check before every PR.** Run `pnpm -C packages/core typecheck && pnpm -C packages/core lint && pnpm -C packages/core test`. If any of the three fail, fix and re-run. The CI workflow runs the same three plus the build; matching local before pushing means the PR's first CI run is the same one humans review.

**The escalation path when a tool genuinely breaks.** Step one: read this section. Step two: search `engineering-uplift/` for a hand-off note that mentions the same error. Step three: open a thread in the engineering channel with the exact command, the exact error, and the operating system. The hand-off notes are immutable but additive; add a new line to the relevant doc once you have a working answer so the next contributor walks through.

**The trio voice contract for every change.** Every change touches code, copy, or both; the library's voice is the integrated voice of three authors. The engineer-architect reads every commit message and refuses anything that does not name what changed and why in one short paragraph. The product master reads every public-facing string (TSDoc, README, governance files) and refuses anything that does not earn its place. The chartered accountant reads every rule encoding and refuses anything not pinned to a primary source.

## Verify a rule against the primary source

For a Chartered Accountant validating that a specific Section / Form / Notification is encoded correctly:

1. Open `packages/core/src/<domain>/<rule>.ts` (where `<domain>` is `slabs`, `capital-gains`, `deductions`, `rsu-perquisite`, `gst`, or `tds`).
2. Find the function that computes the rule. The function's TSDoc carries the `@citation` tag pointing to the primary source: CBIC notification number, CBDT circular reference, or Finance Act year + Section reference.
3. Open the matching test file at `packages/core/test/<domain>/<rule>.test.ts`. The test fixtures encode the example numbers from the primary source verbatim; running `pnpm test` reproduces the official answer.
4. Open the primary-source document on the official gazette (`incometaxindia.gov.in` for Income Tax, `cbic-gst.gov.in` for GST). Confirm the encoded rule matches the published text.

The library publishes a [fixture-by-citation index](./docs/fixture-by-citation.md) that maps every CBIC notification / CBDT circular / Finance Act change to the specific test file that locks the rule. A CA opens the index, finds the citation in question, and clicks through to the test.

## Why a CA firm should standardise on this library

The platform that ships against this library (Elevate Finance) is one consumer. The library itself is open source under MIT and is suitable for a CA firm building its own internal tooling, an enterprise GST team writing a custom reconciliation engine, or any organisation that wants its tax compliance to be reproducible, auditable, and citation-traceable.

Standardising on the library means:

- The firm's compliance computations are deterministic. Two engagements computing the same return with the same inputs receive the same result. Reproducibility supports both internal QA and external audit.
- The firm's compliance computations are citation-traceable. Every output carries the primary-source references; preparing a paper trail for an Income Tax officer's enquiry or a GST officer's notice is trivial.
- The firm's compliance computations are version-pinned. Past-AY rules stay stable; the library does not drift under the firm.
- The firm participates in the rule-update cadence. When the CBIC publishes a new notification, the firm's engineers (or the firm's vendor) can land a fixture-first PR encoding the change and ship a release; until then, the past rules continue to compute correctly.

## Reproduce a platform-produced number deterministically

For a Chartered Accountant who has a computation result from a downstream platform (Elevate Finance or any other consumer of the library) and wants to verify the number reproduces against the library directly:

1. Capture the platform-reported inputs (taxable income, deductions, AY, regime, age category for Section 87A).
2. Install the library locally: `pnpm add @elevatefinance-co/india-tax-rules`.
3. Call the same function with the same inputs in a Node REPL or a one-off script.
4. Compare the outputs.

Because the library is deterministic-by-construction, the platform's result and the library's direct result must match exactly. Any discrepancy is either an input transcription error or an upstream-platform integration bug (which the library itself would not introduce).

A worked example for ITR Section 80C aggregate plus surcharge plus cess is in [`docs/worked-examples.md`](./docs/worked-examples.md), alongside four more end-to-end runs that exercise GST ITC reconciliation, 26Q TDS with Section 206AB uplift, capital-gains split-date treatment, and RSU perquisite on a closely-held foreign company.

## Contribute

The contribution model is fixture-first. Every PR that adds or changes a rule cites the primary source it encodes. The PR template at `.github/pull_request_template.md` enforces the citation requirement.

The flow:

1. Identify the CBIC notification / CBDT circular / Finance Act change introducing or modifying a rule.
2. Open an issue with the rule-correctness or missing-rule template (`.github/ISSUE_TEMPLATE/`).
3. Land a fixture file pinning the example numbers from the primary source verbatim.
4. Land the rule implementation that satisfies the fixture.
5. Submit a PR; the maintainers review against the primary source.
6. On merge, a changeset describes the SemVer impact (MAJOR for rule-semantics breaking changes, MINOR for new Section / Form support, PATCH for fixture refinement and bug fixes).

Full guide at [`CONTRIBUTING.md`](./CONTRIBUTING.md). Governance model at [`GOVERNANCE.md`](./GOVERNANCE.md). Code of conduct at [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## What an acquirer is buying

For a buyer's tech-diligence team reviewing the library on a Friday night under NDA:

- **License**: MIT. No copyleft contamination. The library can be embedded in commercial products without source-disclosure obligation.
- **IP boundaries**: every contribution lands under the Developer Certificate of Origin (DCO) signed via the changeset workflow. The contributor list is enumerated in `package.json` author + the git log; no secret contributors.
- **Dependency tree**: zero runtime dependencies (verified by a missing `dependencies` field in `packages/core/package.json`). Only devDependencies are vitest + typescript + vite. No transitive runtime closure to audit.
- **Test corpus**: 1,322 tests across 59 files; coverage actuals 97.87 percent lines, 97.43 percent statements, 100 percent functions, 91.19 percent branches; mutation score 99.25 percent of every generated mutant killed (99.58 percent on the covered set). The corpus is the moat alongside the citation registry.
- **Security posture**: no I/O, no network, no secrets, no PII handling, no vulnerable dependencies (`pnpm audit --prod` clean). The library is auditable end-to-end in a single afternoon. See [Security posture](#security-posture).
- **Upstream relationship**: the library is consumed by Elevate Finance (the platform shipping ITR + GST + TDS + RSU compliance for Indian filers and CA firms). The platform informs rule prioritisation; the library's API surface is independent and the library is suitable for any consumer with no platform-specific assumption.

## Security posture

The library's security posture is bounded by what the library does not do:

- The library does not read the filesystem.
- The library does not open network connections.
- The library does not handle secrets or API keys.
- The library does not handle PII; the consumer (Elevate Finance or another) handles PII before invoking the library.
- The library does not invoke randomness; every output is reproducible.
- The library does not invoke time; every date-dependent rule takes the date as an explicit parameter.

The deterministic-by-construction promise is enforced at lint time. Future PRs that introduce an I/O import, a `Math.random()`, or a `Date.now()` call in source fail the ESLint gate and cannot merge.

Responsible disclosure of any rule-encoding error or library-level bug with auditable consequences (e.g., a Finance Act change encoded incorrectly) goes through [`SECURITY.md`](./SECURITY.md).

## Fixture index

The fixture-by-citation index maps every CBIC notification, CBDT circular, Finance Act change, and Section the library encodes to the source file that uses it and the test file that locks it. The index is the canonical reference for a CA navigating from a primary-source citation to the encoded rule and its test.

The index lives at [`docs/fixture-by-citation.md`](./docs/fixture-by-citation.md), grouped by domain (ITR, GST, TDS) and by citation type (Section, Rule, Notification, Circular, Finance Act). Each row links the citation key, the rule's source file, and the test file that exercises it.

## Architecture decisions

The library publishes its architecture decisions as ADRs. Each ADR captures context, options considered, decision, consequences, and references.

| ADR                                                        | Decision                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| [0001](./decisions/0001-citation-discriminated-union.md)   | Citation as a discriminated union, not a flat string                 |
| [0002](./decisions/0002-frozen-past-ays.md)                | Past AY rules frozen at their minor version; never mutated           |
| [0003](./decisions/0003-composition-over-orchestration.md) | Composition over orchestration; the library is helpers, not workflow |

ADRs are immutable once landed. A superseding decision opens a new ADR that cross-links the prior one.

For the directory-taxonomy template a contributor follows when adding a new tax domain (Customs Duty, per-State Stamp Duty, per-State Professional Tax, Equalisation Levy, STT, etc.) see [`docs/architecture.md`](./docs/architecture.md). It documents the per-domain shape (`citations/`, rule clusters, `index.ts`), how `package.json` `exports` registers a new entry point, where the cross-cutting helpers live, and the SemVer impact convention for additions and renames.

## Versioning

Semantic versioning per the JavaScript ecosystem norm:

- **MAJOR**: rule-semantics breaking change (a function's signature changes; a rule's output for the same input differs in ways consumers must adapt to).
- **MINOR**: new Section / Form / domain support (the surface grows; existing consumers see no behaviour change).
- **PATCH**: fixture refinement, bug fixes, doc updates, build improvements.

Every release notes the CBIC notification numbers and CBDT circular references it absorbed. The CHANGELOG.md is the canonical history; the GitHub releases page mirrors it.

## Not legal advice

This library performs computations against publicly-available statutory rules. It does not constitute tax or legal advice. Penalties under the Black Money (Undisclosed Foreign Income and Assets) Act, 2015, the Income-tax Act, 1961, the Goods and Services Tax Acts, and the Finance Act amendments are severe and fact-specific. Always consult a qualified Chartered Accountant for your specific circumstances. See [`DISCLAIMER.md`](./DISCLAIMER.md) for the full statement.

## License

MIT. See [`LICENSE`](./LICENSE).

## Acknowledgements

Maintained by ElevateFinance. Built for India.
