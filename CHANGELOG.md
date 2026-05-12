# Changelog

All notable changes to `@elevatefinance-co/india-tax-rules` are documented here. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) and the project follows [Semantic Versioning 2.0.0](https://semver.org/).

Each release entry is hand-curated by the maintainer. The underlying changeset notes are merged into the corresponding section at release time. Every release notes the CBIC Notification numbers, CBDT Circular references, ICAI Guidance Notes, and Finance Act amendments it absorbed; consumers verifying a rule against the gazette can navigate from this changelog to the encoded function via the per-function `@citation` TSDoc and the [fixture-by-citation index](./docs/fixture-by-citation.md) (work in progress).

The section ordering inside each release follows Keep a Changelog: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

---

## [Unreleased]

### Added

- Per-function `@citation` TSDoc on every exported function in `packages/core/src/`. Each block carries `@param`, `@returns`, `@throws` (where applicable), `@example`, and `@citation` referencing the lookup-table entry under `packages/core/src/citations/`, `packages/core/src/gst/citations/`, or `packages/core/src/tds/citations/`. The TSDoc is the input the [fixture-by-citation index](./docs/fixture-by-citation.md) harvests at build time.
- Trio-voice rewrite of the governance documents: `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1 adapted), `GOVERNANCE.md`, `DISCLAIMER.md`, `SUPPORT.md`. Every document cross-links to the README, the planned `docs/architecture.md`, the planned `docs/fixture-by-citation.md`, and the ADRs at `decisions/`.
- DCO sign-off requirement formalised in `CONTRIBUTING.md`. Every commit on a contribution branch must carry `Signed-off-by:` (added automatically by `git commit -s`).
- Open-source readiness pass: GitHub issue + pull-request templates under `.github/`, decision records under `decisions/`, end-to-end usage examples under `docs/examples/`.
- vitest globals (`globals: true`) so test files no longer need per-file imports of `describe`, `it`, `expect`, `vi`.
- Cross-cutting "should " test-description convention.

### Changed

- `tsconfig.json` adds `"types": ["vitest/globals"]` for type resolution under the new globals mode.
- `vitest` 2.x bumped to 4.x with paired `vite` 8.x; closed two transitive moderate advisories in the test toolchain.
- Citation-factory renames in `packages/core/src/citations/{circulars,rules,sections}.ts` and `packages/core/src/types/citation.ts`: shorthand identifiers replaced with `circularCitation`, `ruleCitation`, `sectionCitation` per the dev-standards naming rule.

### Security

- `pnpm audit` reports zero advisories at any severity in this package and across the workspace.
- Supply-chain hardening: Dependabot weekly schedule on npm and GitHub Actions; gitleaks CI job on every push and pull request; CI coverage gate at >= 95% lines / statements / functions and >= 90% branches.
- Deterministic-by-construction posture made machine-checkable at lint time. `packages/core/eslint.config.mjs` blocks `node:fs`, `node:net`, `node:http`, `node:https`, `node:tls`, `node:dgram`, `undici`, `axios`, and the rest of the I/O surface in source; blocks `Math.random()`, `Date.now()`, and bare `new Date()`; sets `id-denylist`, `consistent-type-definitions: type`, and `@typescript-eslint/no-explicit-any: error`.
- `"sideEffects": false` declared in `packages/core/package.json`. Consumers tree-shake aggressively.

---

## [0.1.0] -- Initial public release

### Added

- **Income Tax (ITR) substrate**.
  - `slabs`: tax slab tables for AY 2025-26 and AY 2026-27 across the new regime (Section 115BAC) and the old regime (default), with age-band selection (individual / senior / super-senior) for the old regime.
  - `slab-compute`: pure slab-arithmetic engine returning the per-slab breakdown for the audit-trail receipt.
  - `rebate-87a`: Section 87A rebate with multi-AY thresholds (old regime Rs. 5L / Rs. 12,500; new regime Rs. 7L / Rs. 25,000 for AY 2025-26 per Finance Act 2023; new regime Rs. 12L / Rs. 60,000 for AY 2026-27 per Finance Act 2025).
  - `surcharge`: tier-based surcharge with marginal-relief application for individual / firm / domestic-company variants. New regime caps at 25% per the Section 115BAC proviso; old regime carries the 37% top tier.
  - `cess`: Health and Education Cess at 4% per the Section 2(12A) definition (renamed from Education Cess by Finance Act 2018).
  - `capital-gains`: Section 111A (listed-equity STCG; rate raised to 20% by Finance Act 2024 for transfers on or after 23-July-2024), Section 112A (listed-equity LTCG; rate raised to 12.5% by Finance Act 2024 with the consolidated annual exemption of Rs. 1.25 lakh per CBDT Circular 12/2024), Section 112 (other-asset LTCG at 12.5% with the indexation option preserved for resident individual / HUF on pre-split land/building per Finance Act 2024 + CBDT Circular 12/2024), Section 115BBH (VDA at 30% flat per Finance Act 2022), Section 50AA (specified MF / debt always taxed at slab rate post 01-April-2023 per CBDT Circular 1/2023). Includes the 23-July-2024 split-date logic introduced by Finance Act 2024.
  - `deductions`: Section 80C (with the Rs. 1.5 lakh combined cap across 80C / 80CCC / 80CCD(1)), 80CCD(1B) additional Rs. 50,000, 80CCD(2) employer contribution (10% private / 14% government per Finance Act 2024), 80D tiered medical insurance (self / parent / senior), 80E education-loan interest (no cap, 8-year max), 80G donations (50% / 100% variants with and without AGI cap), 80TTA savings-account interest (Rs. 10,000 non-senior), 80TTB senior-citizen bank / post-office interest (Rs. 50,000), plus the Section 115BAC new-regime allow-list guard for new-regime consumers.
  - `rsu-perquisite`: Rule 3(8) FMV sourcing for Indian-listed (NSE / BSE close), foreign-listed (Rule 3(8)(iii)(c) market close x SBI TT rate), and unlisted (Rule 11UA(1)(c)(b) merchant-banker Cat-I FMV) holdings; Section 17(2)(vi) perquisite at vest; Section 49 cost-basis for downstream sale events; eligible-startup deferral handling. Foreign-listed FX fallback per Rule 26 where a specific-date rate is unavailable. CBDT Circular 13/2022 absorbed for FMV sourcing on foreign-listed shares and exercise-date determination.
- **GST substrate (Offering A)**.
  - `gst/place-of-supply`: Section 10 (goods including bill-to-ship-to and notified-goods Rule 10(2A)), Section 12 (services within India), Section 13 (cross-border services), Section 11 (import / export of goods), Section 13 (import / export of services). The IGST Act 2017 and CGST Act 2017 sections registry under `gst/citations/`.
  - `gst/itc`: Section 16 eligibility with the four conditions (registered supplier; tax invoice / debit note; goods / services received; supplier has paid the tax to the government); Section 16(4) time-bar; Section 17(5) blocked-credits enumeration; ITC reversal rules per Rule 42 / Rule 43.
  - `gst/composition`: Section 10 thresholds per Notification 14/2019-CT (Rs. 1.5 crore goods, Rs. 50 lakh services, with the special-category-state Rs. 75 lakh / Rs. 50 lakh variant); commodity-vs-service rate split.
  - `gst/penalties`: Section 47 late fee with cap-boundary across turnover bands (Notifications 7/2023-CT and 25/2022-CT family); Section 50 interest at 18% (Section 50(1)) and 24% (Section 50(3)).
  - `gst/rates`: schedule rates (0%, 5%, 12%, 18%, 28%) with composition-vs-regular delta; basis-points representation for fixed-point arithmetic.
  - `gst/registration`: Section 22 thresholds (Rs. 40 lakh / Rs. 20 lakh for goods; Rs. 20 lakh / Rs. 10 lakh for services; with the special-category-state variant); Section 24 mandatory registration triggers.
  - `gst/frequencies`: monthly vs quarterly filing dispatch including the QRMP scheme (Section 39 + Notification 84/2020-CT family); GSTR-1, GSTR-3B, IFF, PMT-06, CMP-08, GSTR-4 due dates with state-code group resolution.
  - CBIC Notifications registry under `gst/citations/cbic-notifications.ts` covering CT, CT-Rate, IT, IT-Rate, and Compensation-Cess-Rate families.
- **Income-Tax TDS substrate (Offering B)**.
  - `tds/rates`: per-Section x per-effective-date rate-band resolver covering the October-2024 cliff (six-Section drop), the July-2021 introduction of Section 194Q, the July-2022 introduction of Section 194R and Section 194S, and the April-2025 introduction of Section 194T.
  - `tds/pan-validation`: specified-person uplift covering Section 206AA (no-PAN), Section 206AB (non-filer), Section 206CCA (TCS non-filer); the interaction matrix when more than one applies; the carve-outs from Section 206AB.
  - `tds/penalties`: Section 201(1A) interest with day-count and per-month rounding; Section 234E late fee with cap.
  - CBDT Circulars and Finance Act citations registry under `tds/citations/` covering the TDS-relevant amendments year by year.
- **Citation system (the moat)**.
  - Discriminated union with seven variants (`section`, `circular`, `notification`, `finance-act`, `icai-gn`, `rule`, `gst-council-meeting`).
  - Canonical lookup tables: `SECTIONS`, `RULES`, `CIRCULARS`, `FINANCE_ACTS`, `CGST_ACT_SECTIONS`, `IGST_ACT_SECTIONS`, `CGST_RULES`, `CBIC_NOTIFICATIONS`, `ITA_SECTIONS`, `IT_RULES`, `CBDT_CIRCULARS`, `FINANCE_ACTS_TDS`.
  - Structural-equality `dedupeCitations` utility for collapsing duplicate references along a long compute chain.
- **Public API surface**. 25+ functions exported through namespaced subpath entry points (`/citations`, `/slabs`, `/capital-gains`, `/deductions`, `/rsu-perquisite`, `/gst`, `/tds`) for tree-shake-friendly imports. The `gst` and `tds` namespaces are flat-isolated from each other by lint rule; cross-domain helpers live in the shared substrate.
- **Test corpus**. 466 tests across 29 files at engagement-record time; ~1,577 lines of test code in the initial cut. CI coverage gate at >= 95% lines / statements / functions and >= 90% branches.
- **Supply chain**. `npm publish --provenance` via GitHub OIDC; Changesets-driven SemVer; MIT licence.

### Notes

- This is a pre-1.0 public release. The public API may evolve before v1.0. No breaking change will land without a major bump and at least 30 days of public notice.
- AY 2025-26 and AY 2026-27 modules are frozen. Future Finance Act changes that retrospectively amend either AY ship as a new AY variant, never as a mutation of an existing module. Past assessment-year reproducibility is the library's hardest contract.

### Citations absorbed in this release

| Source                                             | Reference                                               | What it governed                                                                                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Finance Act 2024                                   | Section-level revisions                                 | New-regime slab revisions for AY 2025-26; LTCG at 12.5% under Section 112 / Section 112A; STCG at 20% under Section 111A                                                                 |
| Finance Act 2025                                   | Section-level revisions                                 | New-regime slab revisions for AY 2026-27; Section 87A rebate raised to Rs. 12 lakh income / Rs. 60,000 max rebate; Section 194T introduction (April-2025 effective)                      |
| Finance Act 2023                                   | Section 50AA introduction                               | Specified MF / debt taxed at slab rate post 01-April-2023                                                                                                                                |
| Finance Act 2022                                   | Section 115BBH introduction; Section 194S introduction  | VDA charging at 30% flat; 1% TDS on VDA transfers (July-2022 effective)                                                                                                                  |
| CBDT Circular 12/2024                              | Capital-gains amendments under Finance (No. 2) Act 2024 | Pre-/post 23-July-2024 split; Section 112A consolidated Rs. 1.25 lakh annual exemption; Section 112 indexation option preserved for resident individual / HUF on pre-split land/building |
| CBDT Circular 1/2023                               | Section 50AA introduction                               | Specified MF / debt always slab-rate after 01-April-2023 regardless of holding period                                                                                                    |
| CBDT Circular 13/2022                              | RSU / ESOP perquisite valuation                         | FMV sourcing for foreign-listed shares; exercise-date determination                                                                                                                      |
| CBIC Notification 14/2019-CT                       | Composition-scheme thresholds                           | Rs. 1.5 crore goods limit; Rs. 50 lakh services limit; special-category-state Rs. 75 lakh variant                                                                                        |
| CBIC Notifications 7/2023-CT and 25/2022-CT family | Section 47 late-fee cap                                 | Turnover-band-specific late-fee caps                                                                                                                                                     |
| CBIC Notification 84/2020-CT family                | QRMP scheme                                             | Quarterly GSTR-1 / GSTR-3B with monthly IFF and PMT-06 for taxpayers with turnover up to Rs. 5 crore                                                                                     |

---

## Versioning policy

| Bump class | When                                                                                                   | Examples                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| MAJOR      | A rule's signature changes; a rule's output for the same input differs in ways consumers must adapt to | Renaming an exported function; restructuring `ComputationResult<T>`; changing the citation discriminated union |
| MINOR      | A new AY module; a new Section / Form / domain; a new citation variant; a new namespace                | AY 2027-28 module; a new Section 80 deduction; a new GST rate slab; a new TDS Section                          |
| PATCH      | A fixture refinement; a bug fix; a citation correction; a documentation change; a build improvement    | Correcting a CBDT circular reference; fixing a `Math.round` boundary; bumping a devDependency                  |

Operative-effect rule encodings (a new CBIC notification or a CBDT circular taking effect for an active AY) ship within 72 hours of gazette notification. Retrospective amendments ship in the next regular release.

---

[Unreleased]: https://github.com/elevatefinance-co/elevate-core/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/elevatefinance-co/elevate-core/releases/tag/v0.1.0
