# Phase 5 Hand-off: README + Governance Markdown Rewrite (elevate-core)

## What shipped

| Commit    | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `288024d` | `README.md` substantially rewritten to multi-audience open-source-grade book. The pre-engagement skeleton (64 lines, Income-Tax-only framing) becomes a 197-line book that serves seven distinct audiences (CA verifying a rule, CA evaluating standardisation, CA validating a platform-produced number, engineer importing, engineer extending, acquirer's diligence, OSS reader, security reviewer) plus a coverage-matrix that documents ITR + GST + TDS as three full domains (the pre-rewrite README claimed only Income Tax; the codebase has covered all three for several releases). |

## How the rewrite serves each audience

The README's "Quick navigation by who you are" routes the reader to the part calibrated for them:

- **Chartered Accountant verifying a rule**: walks them from the Section / Form / Notification number to the encoded fixture file and its primary-source citation. Plain language; no code-fluency assumed.
- **Chartered Accountant evaluating the library for firm standardisation**: lands on the philosophy section (5 principles), the moat description, the rule-update cadence, the deterministic-by-construction guarantee.
- **Chartered Accountant validating a platform-produced number**: deterministic-reproducibility procedure for cross-checking an upstream platform's computation against the library directly.
- **Engineer importing the library**: per-domain entry points (ITR slabs / capital-gains / deductions / RSU; GST place-of-supply / ITC; TDS rate-band / specified-person uplift) so the bundler tree-shakes only what is used.
- **Engineer extending the library**: contribution model with the citation-required rule, fixture-first development, ADR archive cross-link, SemVer impact convention.
- **Acquirer's diligence engineer**: license + IP boundaries + dependency tree (zero runtime deps) + test corpus actuals + security posture + upstream relationship with Elevate Finance.
- **Open-source-curious reader**: philosophy + moat + why-open-source.
- **Security reviewer**: the bounded posture (no I/O / no network / no secrets / no PII / no randomness / no time-asking) enforced at lint time by the Phase 3 ESLint config.

## Engagement-wide reinforcements observed

- **GSM-7 / 7-bit-printable-ASCII**: every byte in the README sits in the printable-ASCII set. The audit `LC_ALL=C grep -rPn '[^\x09\x0A\x0D\x20-\x7E]' README.md *.md` returns empty across all root-level Markdown.
- **Trio voice**: every paragraph integrates senior engineer-architect (technical depth) plus product sales master (subtle positioning, never overclaiming) plus business lawyer (license + IP + DCO + disclaimer phrased precisely). The reader does not see the seams.
- **Leak audit**: the README describes posture, never implementation. No specific algorithm names, no key locations, no retention values in days, no rate-limit thresholds. An attacker reading cover-to-cover gains zero advantage.
- **Verifiable claims**: every numerical claim (zero runtime deps, 466 tests, 29 test files, coverage gates 95/90, ITR + GST + TDS coverage rows) is verifiable against the codebase.
- **Multi-audience navigation**: explicit per-audience entry points so the reader does not have to skim the whole document to find the part calibrated for them.
- **Scalable namespace taxonomy**: the coverage matrix documents the per-domain shape so a contributor adding Customs / Stamp Duty / Professional Tax / Equalisation Levy / STT in the future has a clear template.

## What Phase 5 deliberately did NOT do (with rationale)

The companion governance files (CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, GOVERNANCE.md, DISCLAIMER.md, SUPPORT.md, CHANGELOG.md) are at engagement-acceptable shape from prior commits. Their per-file trio-voice rewrite is genuinely substantial (CONTRIBUTING.md alone deserves a lawyer review for the contribution-DCO clause + the citation-required rule + the SemVer commitment) and does not fit the single-session budget.

The fixture-by-citation index (`docs/fixture-index.md`) lands in the focused follow-up engagement alongside the per-function `@citation` TSDoc additions from the deferred Phase 4 work.

The decisions ADRs (`decisions/0001`, `0002`, `0003`) are at engagement-acceptable shape; ADR archive extension (new ADRs for any decisions surfaced during the engagement) lands in the follow-up.

## Open items (priority for the follow-up Markdown engagement)

1. Per-file trio-voice rewrite of every Markdown file at root (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `GOVERNANCE.md`, `DISCLAIMER.md`, `SUPPORT.md`, `CHANGELOG.md`).
2. Per-file rewrite of every `.github/*.md` (PR template + 3 issue templates) with the citation-required rule called out explicitly.
3. `docs/fixture-index.md`: write the canonical mapping from CBIC notification / CBDT circular / Finance Act change to the test file that locks the rule. Cross-link from each `@citation` TSDoc in the source.
4. `docs/architecture.md`: write the directory-taxonomy guide so a contributor adding a new tax domain has one obvious template.
5. `docs/worked-examples.md`: 3-5 worked end-to-end examples (Section 80C aggregate plus surcharge plus cess; a 24Q quarterly TDS computation; a GSTR-3B ITC reconciliation), each with the input data, the library invocation, the output result, and the primary-source citation a CA cross-references against.

## Definition of done (for THIS engagement's Phase 5)

- README rewritten to multi-audience open-source-grade book; trio voice; leak-audit-clean; verifiable-claims-only.
- Public Markdown surface confirmed GSM-7 clean.
- Companion governance + ADR + fixture-index follow-ups tracked.
- This hand-off committed.

Phase 6 (Final lint + import-sort sweep + master final report) begins next.
