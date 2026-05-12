# Contributing to india-tax-rules

This library is the citation backbone of every downstream tool that consumes it. The bar is high not because the maintainers are difficult, but because a wrong rate that ships unchecked propagates into thousands of returns and hundreds of CA opinions before anyone notices. Every contribution is a deposit into a long-running audit trail.

This guide tells you exactly how to make a contribution that lands.

## Who should read this

| You are                                                                 | What this guide gives you                      |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| A Chartered Accountant who spotted a wrong rate or a stale citation     | The "rule-correctness PR" path                 |
| An engineer adding a new Section, Form, or domain                       | The "fixture-first development" path           |
| A consumer maintaining a downstream platform on the library             | The release-cadence and breakage-risk contract |
| A first-time contributor curious about an open-source India-tax library | The end-to-end flow with no skipped steps      |

## The five non-negotiable ground rules

These are not stylistic preferences. They are the contract that allows the library to ship at the cadence it does without breaking downstream consumers.

1. **Every rule carries a citation.** A pull request that adds, changes, or moves a rate, threshold, ceiling, or rebate without an accompanying `Citation` entry pointing to the primary source (Section / Sub-section / Clause; CBIC Notification number + date; CBDT Circular reference; Finance Act year + Section; ICAI Guidance Note number + year; Rule number) will not pass review. The citation is the artefact a Chartered Accountant cross-references against the official gazette. A correct number with no citation is a worse contribution than the absence of the rule, because the next maintainer cannot tell what authority produced it.
2. **Every rule carries a fixture-first test.** Before the function body is written, the fixture pinning the worked example from the primary source is committed. The implementation then satisfies the fixture. This sequence (fixture, then code) is enforced because the alternative (code, then a test that mirrors the code's output) reproduces every bug verbatim. The fixture-first method is the discipline that catches the bug in the rule, not in the test.
3. **Past assessment-year modules are immutable.** A Finance Act amendment that retrospectively touches a closed AY is encoded as a new AY variant, never as an edit to the existing module. A consumer computing for AY 2020-21 in 2030 must receive the AY 2020-21 rules as they stood when first encoded, plus an explicit retrospective adjustment if the consumer asks for it. The library does not silently rewrite history.
4. **Zero runtime dependencies.** The published `packages/core/package.json` carries no `dependencies` field. Helpers that genuinely need a dependency (e.g. a CSV writer for an audit-report export) ship as a sibling package, not as a runtime closure on the core. The library's portability across Node, Bun, Deno, Cloudflare Workers, and the browser depends on this rule. CI fails the PR if `dependencies` becomes non-empty.
5. **Pure functions only.** No `fs`, no `net`, no `http`, no `Math.random()`, no `Date.now()`, no bare `new Date()`. Every time-dependent rule takes the relevant date as an explicit argument; every randomness-dependent computation is rewritten to be deterministic. The library's deterministic-by-construction promise is enforced at lint time by the library's ESLint flat config; a future PR that introduces an I/O import or an implicit time read fails the gate and cannot merge.

## The fixture-first development flow

The library's contribution model is fixture-first. A typical PR opens a fixture file before it opens an implementation file. This is the most important sentence in this guide.

The flow:

1. **Identify the primary source.** A new contribution starts from a CBIC Notification, a CBDT Circular, a Finance Act amendment, an ICAI Guidance Note, or an Income-tax Rule. Capture the document number, date, and a working URL on `incometaxindia.gov.in`, `cbic-gst.gov.in`, or `indiacode.nic.in`.
2. **Open an issue first.** Use the `rule-correctness` template (for an existing rule that is wrong) or the `missing-rule` template (for a rule the library does not yet encode). The issue captures the primary source, the AY in question, and the expected behaviour. The maintainer triages and confirms scope before code is written.
3. **Land the fixture.** A fixture file under `packages/core/test/<domain>/<rule>.fixture.ts` (or inline at the top of the matching `.test.ts`) encodes the example numbers from the primary source verbatim. If CBDT Circular 12/2024 worked an example with Rs. 8,00,000 of LTCG against the new Rs. 1.25L exemption, the fixture pins those numbers exactly. Do not round, do not paraphrase, do not modernise.
4. **Land the implementation that satisfies the fixture.** The implementation is whatever is necessary to make the fixture pass. The PR diff therefore contains both the fixture and the function, plus the citation registry entry that the function references.
5. **Add a changeset.** Run `pnpm changeset`, pick the affected packages, choose the SemVer bump (PATCH for a fixture refinement or a bug fix; MINOR for a new Section / Form / domain; MAJOR for a rule-semantics breaking change that consumers must adapt to), and describe the change in one paragraph. The changeset note ends up in the next release's `CHANGELOG.md` entry verbatim.
6. **Open the PR.** The PR template at `.github/pull_request_template.md` enforces the citation requirement and the changeset requirement.

The rule-update path for a CBIC notification or a CBDT circular is the same flow. The maintainer aims to land the encoding within 72 hours of the gazette notification for any change with operative effect for a current or upcoming AY; older retrospective changes ship in the next regular release.

## The citation-required rule, in detail

Every PR that adds or changes a rule MUST attach a `Citation` to the rule's exported function. The citation lives in one of the canonical lookup tables under `packages/core/src/citations/` for ITR, `packages/core/src/gst/citations/` for GST, or `packages/core/src/tds/citations/` for income-tax TDS. The function consumes the citation by reference, not by repeating the metadata inline.

A typical citation block looks like this. The shape is the discriminated union defined in `packages/core/src/types/citation.ts`.

```ts
import { SECTIONS, FINANCE_ACTS, CIRCULARS } from '../citations/index.js';

const citations: readonly Citation[] = [
  SECTIONS.SEC_112A,
  FINANCE_ACTS.FA_2024,
  CIRCULARS.CBDT_CIRC_12_2024,
];
```

When the lookup table does not yet have an entry for the primary source you are citing, the same PR adds the entry. Naming follows the existing convention: `SECTIONS.SEC_<number>_<sub>_<clause>`, `FINANCE_ACTS.FA_<year>`, `CIRCULARS.CBDT_CIRC_<number>_<year>`, `CBIC_NOTIFICATIONS.CT_<number>_<year>`. The naming convention is mechanical so the PR diff is easy to review against the gazette text.

The per-function TSDoc carries an `@citation` tag pointing to the lookup-table entry. The tag is what the fixture-by-citation index harvests at build time to produce the citation-traceable navigation document. See [`docs/fixture-by-citation.md`](./docs/fixture-by-citation.md) (work in progress) for the rendered output and [`docs/architecture.md`](./docs/architecture.md) (work in progress) for the harvest pipeline.

## Local setup

```bash
pnpm install
pnpm -C packages/core test
pnpm -C packages/core typecheck
pnpm -C packages/core lint
pnpm -C packages/core build
```

Node 18+ is required (the library publishes ESM-only). The test runner is vitest. The build emits per-function `.js` files plus a `dist/` declaration tree; the `sideEffects: false` declaration in `packages/core/package.json` ensures consumers tree-shake aggressively.

The CI gate runs the same four commands plus `pnpm audit --prod` (must be advisory-clean) plus `gitleaks` (must be clean). A PR that fails any of these does not merge.

## Coverage gate

The library targets very high coverage because the rules under test are statutory. The CI gate is:

| Metric     | Threshold |
| ---------- | --------- |
| Lines      | >= 95%    |
| Statements | >= 95%    |
| Functions  | >= 95%    |
| Branches   | >= 90%    |

The gate is not aspirational. A PR that drops coverage below the threshold fails CI. If you must add a code path that genuinely cannot be exercised in a unit test (extremely rare in a pure-function library), open the discussion on the PR before merging; the maintainers will help you find the missing fixture.

## Submitting a pull request

| Field               | Value                                                                         |
| ------------------- | ----------------------------------------------------------------------------- |
| Target branch       | `main`                                                                        |
| Required artefacts  | Citation entry; fixture file; implementation; changeset note                  |
| Required CI signals | typecheck, lint, tests, coverage gate, gitleaks                               |
| Required review     | One maintainer approval; until a second maintainer joins, the founding author |
| Merge style         | Squash-merge with the changeset note as the squash body                       |

The PR description follows the template at `.github/pull_request_template.md`. The most important fields are the primary-source URL and the worked-example numbers; the rest is mechanical.

## Review SLA

The maintainers' commitment to contributors is a standing review service-level objective. The clock starts when the PR is in a reviewable state (CI green, conflicts resolved, the PR description filled out per template).

| PR class                                                                   | First-touch SLA                                                           | Resolution SLA                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------ |
| Rule-correctness fix with primary-source citation and fixture              | 48 hours                                                                  | 7 days                         |
| New Section / Form / domain (substantive PR with fixture-first discipline) | 5 working days                                                            | Negotiated on the issue thread |
| Doc / typo / cosmetic                                                      | Best-effort, within the next regular release                              |
| Security report (private channel)                                          | 48-hour acknowledgement; 7-day patch for high severity. See `SECURITY.md` |

If the SLA slips for a rule-correctness PR (which the library treats as the highest priority outside security), the maintainer comments on the PR with the revised expectation.

## Release cadence

The library uses Changesets. Every merged PR contributes a changeset note; on the next release, the maintainer runs `pnpm changeset version`, which collapses the notes into a single SemVer bump and a single `CHANGELOG.md` entry, then `pnpm changeset publish`, which publishes to npm under `@elevatefinance-co/india-tax-rules` with `--provenance` attestation via GitHub Actions OIDC.

| Bump class | When                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| MAJOR      | A rule's signature changes; a rule's output for the same input differs in ways consumers must adapt to. Rare in 0.x; will be planned and announced |
| MINOR      | A new AY module; a new Section / Form support; a new citation variant; a new namespace                                                             |
| PATCH      | A fixture refinement; a bug fix; a citation correction; a documentation change                                                                     |

Operative-effect rule encodings (a new CBIC notification or a CBDT circular that takes effect for an active AY) ship within 72 hours of gazette notification. Retrospective amendments ship in the next regular release; if the library is silent on a retrospective amendment that affects a closed AY, file an issue with the `rule-correctness` label and the maintainer triages.

The `CHANGELOG.md` is the canonical history. Each release entry notes the CBIC notification numbers and CBDT circular references it absorbed.

## Developer Certificate of Origin sign-off

The library accepts contributions under the Developer Certificate of Origin (DCO). Every commit on a contribution branch must carry a `Signed-off-by: <real name> <email>` trailer. The trailer is added automatically by `git commit -s`.

The DCO sign-off attests that:

- The contribution is your original work, or
- The contribution is based upon previous work that, to the best of your knowledge, is covered under an appropriate open-source licence and you have the right under that licence to submit it, or
- The contribution was provided directly to you by some other person who certified the above and you have not modified it.

A PR with one or more unsigned commits will be flagged by CI; the contributor rebases with `--signoff` and force-pushes the corrected branch. The maintainers do not waive the DCO; this is the IP boundary that allows the library to be embedded in commercial products without source-disclosure obligation.

The full DCO text is at [developercertificate.org](https://developercertificate.org/).

## What the library is not

A few patterns will be turned away on first review:

- A PR that adds a runtime dependency.
- A PR that introduces I/O, randomness, or implicit time reads.
- A PR that mutates a closed AY module instead of adding a new variant.
- A PR that adds a number with no primary-source citation.
- A PR that adds a citation but no fixture.
- A PR that adds a fixture and a citation but no test that exercises the function against the fixture.
- A PR that uses `interface` instead of `type` (the library is `type`-only by lint rule).
- A PR that uses `any` (the library is `no-explicit-any: error` by lint rule).
- A PR that introduces a `//` line comment (the library uses `/* */` block comments per the comment-discipline rule).

These rules are mechanical. The maintainers want your contribution to land; the rules above keep the library auditable end-to-end in a single afternoon, which is the property that makes the library suitable for an acquirer's diligence team and a Chartered Accountant alike.

## Cross-references

- [README.md](./README.md) -- the audience-routed entry point.
- [GOVERNANCE.md](./GOVERNANCE.md) -- the maintainer model and decision process.
- [SECURITY.md](./SECURITY.md) -- responsible disclosure for rule-encoding errors with auditable consequences.
- [SUPPORT.md](./SUPPORT.md) -- where to ask for help and the SLA per channel.
- [DISCLAIMER.md](./DISCLAIMER.md) -- the not-legal-advice statement.
- [CHANGELOG.md](./CHANGELOG.md) -- the rule-update history.
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) -- expected behaviour in issues, PRs, and discussions.
- [decisions/](./decisions/) -- the architecture decision records.
- [docs/architecture.md](./docs/architecture.md) -- the library's architecture (work in progress).
- [docs/fixture-by-citation.md](./docs/fixture-by-citation.md) -- the citation-to-test navigation document (work in progress).

## Code of Conduct

Contributors agree to abide by [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). Report unacceptable conduct to `conduct@elevatefinance.co`.
