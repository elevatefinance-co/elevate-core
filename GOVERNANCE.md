# Governance

`@elevatefinance-co/india-tax-rules` is the deterministic, primary-source-cited, exhaustively-tested rules engine for Indian tax compliance. This document describes who maintains the library, who decides what, how releases happen, and how architectural decisions are recorded. The library is open source under MIT and is intended to be useful to many consumers; the governance model reflects that.

## Project scope

The library encodes Income Tax (ITR), GST (Offering A), and Income-Tax TDS (Offering B) statutory rules as TypeScript functions. Every public function returns a `ComputationResult<T>` carrying not just a number but the full citation set (Section, sub-section, Finance Act year, CBIC notification, CBDT circular, ICAI guidance note) that produced the number. The library deliberately stops at the rule-encoding boundary; it does not file returns, store user data, render PDFs, or speak to any tax-authority API.

The library intentionally stays:

- **Zero runtime dependencies.** The published `packages/core/package.json` carries no `dependencies` field. Future helpers that need a dependency ship as a sibling package.
- **Pure functions only.** No I/O, no network, no `Math.random()`, no `Date.now()`, no bare `new Date()`. Time-dependent rules take the date as an explicit argument.
- **AY-versioned and effective-date-versioned.** Past assessment-year modules are immutable; new amendments ship as new variants.
- **ESM-only.** Consumers on older build tooling are expected to upgrade. The library does not ship CommonJS output.
- **MIT-licensed.** Maximum adoption with no copyleft contamination and no downstream liability to the maintainer.

Items explicitly out of scope:

- Filing-form generation.
- PDF / spreadsheet rendering of computed results.
- Tax-authority portal integration (e-filing, GST portal, TRACES).
- PII handling, KYC, or any data-protection boundary.
- Investment advice or financial advice in the SEBI sense.

A consumer that wants any of these builds them on top of the library and consumes the citation-traceable output.

## Maintainer model

Until a second maintainer joins, the sole maintainer is the founding author. Decisions are recorded in the issue tracker, the pull-request review history, and the architecture decision records under `decisions/`. The maintainer's email of record is the address the security mailbox forwards to; see `SECURITY.md`.

When a second maintainer joins, this document will be updated to describe the merge gate (two-approval requirement on `main`, on-call rotation for the security mailbox, ADR-discipline shared review), the dispute-resolution path (a third arbitrator when two maintainers disagree), and the succession plan (handover protocol if a maintainer steps away).

The library does not at present operate a Steering Committee, a Technical Working Group, or any formal governance body beyond the maintainer or maintainers. The single-maintainer model is appropriate for a library of this size and ambition; a more formal model arrives only when the contributor base outgrows the bilateral review channel.

## Roles

| Role        | Who                                                                      | What they do                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Maintainer  | The founding author until a second is appointed                          | Reviews and merges PRs, triages issues, ships releases, writes ADRs, owns the security mailbox                                                               |
| Contributor | Anyone who has had at least one PR merged                                | Lands rule encodings, lands fixtures, lands documentation; carries no merge rights but is the source of substantively all rule additions                     |
| Reporter    | Anyone who files an issue, opens a discussion, or sends a security email | The most common role; the library's correctness depends on a constant flow of rule-correctness reports from Chartered Accountants and engineers in the field |
| Consumer    | Anyone who imports the library into a downstream product                 | Has no formal role in the library's governance, but the consumer base informs prioritisation through the issue tracker                                       |

There is no formal "core team" beyond the maintainer at this stage. As the contributor base grows, a contributor with sustained substantive engagement (multiple landed rule additions, primary-source review on issue threads, demonstrated discipline on the citation-first rule) will be invited to join as a maintainer.

## Accepting contributions

Pull requests are welcome from anyone. To be mergeable, a PR MUST:

1. **Carry at least one citation per rate / threshold / ceiling it touches.** The citation points to the exact Section + Finance Act + effective AY (for ITR), the CBIC notification number + date (for GST), or the CBDT circular reference (for TDS). The citation carries more weight than the numeric value; a correct number with no citation does not merge. See `CONTRIBUTING.md` for the citation registry shape.
2. **Maintain >= 95% line / statement / function coverage and >= 90% branch coverage** for the module changed. The CI coverage gate is automatic.
3. **Introduce no runtime dependency.** Dev dependencies (test runners, build tools, lint tools) are fine.
4. **Leave past assessment-year modules untouched.** A rule that changes with Finance Act 2026 lands as a new branch inside the AY-2026-27 module, never as an edit to AY-2024-25 code. Historical filings stay reproducible forever.
5. **Pass typecheck, lint, tests, coverage gate, and gitleaks** in CI.
6. **Carry a Developer Certificate of Origin sign-off** on every commit (`git commit -s`). The DCO is the IP boundary that allows the library to be embedded in commercial products without source-disclosure obligation.

The maintainer reviews on these six checks and on the citation accuracy. Stylistic nits are handled post-merge if needed. The fixture-first discipline (a fixture file lands before the implementation file in the same PR) is a strong norm; PRs that add code without a paired fixture are sent back for the fixture before the implementation review begins.

## Who decides what

| Decision class                                                                                             | Decided by                                                                                         | Recorded in                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Whether to land a rule-correctness fix                                                                     | The maintainer, on the strength of the cited primary source                                        | The PR thread; the changeset note; the next CHANGELOG entry                                         |
| Whether to land a new Section / Form / domain                                                              | The maintainer, after issue-level scoping with the contributor                                     | The issue thread; an ADR if the addition introduces a new architectural pattern                     |
| Whether to land an architectural change (a new public type, a new entry-point convention, a new namespace) | The maintainer, after writing or commissioning an ADR                                              | An ADR under `decisions/`                                                                           |
| Whether to ship a major version                                                                            | The maintainer, with at least 30 days of public notice on the README and the changelog             | The release notes; the CHANGELOG `Removed` and `Changed` sections                                   |
| Whether to publish a security release                                                                      | The maintainer, on the security mailbox responder schedule                                         | A GitHub Security Advisory if the issue is conventional; a CHANGELOG `Security` entry in every case |
| Whether to accept a CoC report                                                                             | The maintainer, on the conduct mailbox                                                             | A private record; a public statement if the response affects a community member's standing          |
| Whether to update this document                                                                            | The maintainer, with rationale captured in the commit message and (for substantive changes) an ADR | The git history; an ADR for substantive changes                                                     |

Disagreements are resolved on the public PR thread or the public issue thread, using primary-source citations as the unit of evidence. A disagreement that cannot be resolved by primary-source reference (extremely rare in a tax library; the law is the law) is escalated to the maintainer for a tie-breaking decision, which is then recorded in an ADR.

## Architecture decision records

Architecture decisions are documented as ADRs under `decisions/`. The format is:

```
# NNNN - <slug>

Status: Accepted | Superseded by NNNN | Deprecated
Date: YYYY-MM-DD

## Context

## Options considered

## Decision

## Consequences

## References
```

Existing ADRs:

| ADR                                                        | Decision                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| [0001](./decisions/0001-citation-discriminated-union.md)   | Citation as a six-variant discriminated union, not a flat string     |
| [0002](./decisions/0002-frozen-past-ays.md)                | Past AY rules frozen at their minor version; never mutated           |
| [0003](./decisions/0003-composition-over-orchestration.md) | Composition over orchestration; the library is helpers, not workflow |

ADRs are immutable once landed. A superseding decision opens a new ADR that cross-links the prior one (`Status: Superseded by NNNN` on the prior; `Status: Accepted` on the new with a `## Supersedes` section pointing back). The library does not retroactively edit ADRs; the historical record is part of the library's value to a future contributor or a future acquirer.

A change requires an ADR if it:

- Introduces a new public type or breaks an existing public type's shape.
- Adds a new entry-point convention (a new subpath export, a new namespace).
- Changes the citation registry shape.
- Changes the SemVer policy or the release cadence.
- Changes the deterministic-by-construction posture (e.g. adds a new lint-time guarantee or removes one).
- Changes the maintainer model or the merge gate.

A change does not require an ADR if it:

- Encodes a new rule against an existing pattern.
- Lands a new fixture or a new test.
- Refines documentation.
- Bumps a devDependency.

When in doubt, write the ADR. The cost is a paragraph; the benefit is that a future contributor can reconstruct the why without paging the maintainer.

## Release process

The library uses Changesets. Every merged PR contributes a changeset note; on the next release, the maintainer:

1. Runs `pnpm changeset version`, which collapses the notes into a single SemVer bump (PATCH / MINOR / MAJOR by the highest pending bump) and updates `CHANGELOG.md` with the collapsed entry.
2. Reviews the generated `CHANGELOG.md` entry, adds the human-readable per-section summary, and notes the CBIC notification numbers and CBDT circular references the release absorbed.
3. Runs `pnpm changeset publish`, which publishes to npm under `@elevatefinance-co/india-tax-rules` with `--provenance` attestation via GitHub Actions OIDC.
4. Tags the release on GitHub; the GitHub release notes mirror the `CHANGELOG.md` entry.

| Release class                                                                                          | Cadence                                                    |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| PATCH (bug fix, fixture refinement, citation correction)                                               | On demand; typically within 7 days of the merge            |
| MINOR (new Section / Form / domain)                                                                    | On demand; typically batched fortnightly                   |
| MAJOR (rule-semantics breaking change)                                                                 | Rare; pre-announced with at least 30 days of public notice |
| Operative-effect rule encoding (new CBIC notification or CBDT circular taking effect for an active AY) | Within 72 hours of gazette notification                    |

Versioning is Semantic Versioning 2.0.0 per the JavaScript ecosystem norm. The MAJOR.MINOR.PATCH rules are described in `CHANGELOG.md` and `CONTRIBUTING.md`.

## Disputes

If a published citation is factually wrong, open an issue with the prefix `CITATION DISPUTE:` in the title and attach the primary source (the bare-Act PDF, the CBDT circular, the CBIC notification, the ICAI commentary). The maintainer reviews within 7 days; if the dispute is valid, the fix ships in the next patch release with the reporter credited in the `CHANGELOG.md` entry (with permission).

If a contributor and the maintainer disagree on a substantive PR review point and the disagreement cannot be resolved by primary-source citation, the maintainer's decision stands and is recorded in an ADR. The contributor is welcome to fork; the library accepts that some disagreements are about taste rather than law and the maintainer's taste is the published taste.

## Security reports

See [`SECURITY.md`](./SECURITY.md). Do not file security issues as public GitHub issues.

## Cross-references

- [README.md](./README.md) -- the audience-routed entry point.
- [CONTRIBUTING.md](./CONTRIBUTING.md) -- contribution flow and the citation-required rule.
- [SECURITY.md](./SECURITY.md) -- responsible disclosure of rule-encoding errors with auditable consequences.
- [SUPPORT.md](./SUPPORT.md) -- the channel matrix for non-security reports.
- [CHANGELOG.md](./CHANGELOG.md) -- the rule-update history.
- [DISCLAIMER.md](./DISCLAIMER.md) -- the not-legal-advice statement.
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) -- expected behaviour in community spaces.
- [decisions/](./decisions/) -- the architecture decision records.
- [docs/architecture.md](./docs/architecture.md) -- the library's architecture (work in progress).
