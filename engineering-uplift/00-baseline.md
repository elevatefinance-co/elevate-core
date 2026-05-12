# Phase 0 Baseline: elevate-core

Captured at the start of the engineering-uplift engagement. Every number below is the floor; the engagement raises each one to its post-Phase-6 final-report value.

## Repository state

- Path: `/Users/priyeshmishra/Documents/elevate-core`
- Branch: `feat/gst-tds-offerings`
- Working tree: clean
- Layout: pnpm monorepo, single workspace `packages/core`
- Package: `@elevatefinance-co/india-tax-rules` v0.1.0, MIT, private currently (`private: true` in package.json -- engagement does not flip this; release posture is a separate decision)
- Toolchain: Node >= 20, pnpm 10.32.1, vitest v4.1.5, TypeScript strict, no ESLint configured at workspace level (Phase 3 introduces one)

## Test corpus

| Metric                               | Value                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Source files (`.ts`, excludes tests) | 155                                                                                                             |
| Test files (`.test.ts`, `.spec.ts`)  | 29                                                                                                              |
| Test cases passing                   | 466                                                                                                             |
| Coverage gate (declared in README)   | lines >= 95%, branches >= 90%                                                                                   |
| Coverage actuals at baseline         | not measured during this preflight (Phase 3 will measure and record)                                            |
| End-to-end-test ratio                | 29 / 155 = 18.7% file coverage; the engagement closes this to 100% (every source file gets a focused test file) |

## Baseline gates

- `pnpm typecheck`: clean
- `pnpm lint`: clean (script is currently aliased to `typecheck`; no actual ESLint runs)
- `pnpm build`: clean
- `pnpm test`: 466 / 466 passing
- `pnpm audit --prod`: not run during preflight; will run as part of Phase 1

## Rule-violation surveys

| Rule                                                                                     | Count | Disposition                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Non-GSM-7 / non-7-bit-printable-ASCII bytes                                              | 0     | clean                                                                                                                                                                    |
| `//` line comments                                                                       | 158   | Phase 3 + Phase 4 work through; most are tax-citation comments (`// Section 80C` style) that get converted to `/* */` block headers in the file or to TSDoc on functions |
| `interface` declarations (require conversion to `type`)                                  | 0     | clean                                                                                                                                                                    |
| `eslint-disable` directives                                                              | 1     | Phase 3 fixes the underlying issue                                                                                                                                       |
| `console.*` calls in source                                                              | 3     | review in Phase 1 (script paths) and Phase 3                                                                                                                             |
| `node:fs` / `node:net` / `node:http` / `child_process` / `os` imports (no-I/O guarantee) | 0     | clean -- the library's deterministic-by-construction promise holds at baseline                                                                                           |
| `Math.random()` calls                                                                    | 0     | clean                                                                                                                                                                    |
| `Date.now()` calls in source                                                             | 0     | clean -- AY is always a parameter; the README documents this guarantee                                                                                                   |

## Markdown inventory

Repo root: `README.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `DISCLAIMER.md`, `GOVERNANCE.md`, `SECURITY.md`, `SUPPORT.md`, `LICENSE`.

ADR / decisions: `decisions/0001-citation-discriminated-union.md`, `decisions/0002-frozen-past-ays.md`, `decisions/0003-composition-over-orchestration.md`.

GitHub: `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/bug.md`, `.github/ISSUE_TEMPLATE/missing-rule.md`, `.github/ISSUE_TEMPLATE/rule-correctness.md`.

Changesets: `.changeset/README.md`.

Total Markdown files in scope for Phase 5: 16.

## Phase plan reference

The engagement's six-phase plan lives at `/Users/priyeshmishra/.claude/plans/purrfect-finding-tarjan.md`. This baseline doc supplies the floors; the master final report at `engineering-uplift/MASTER-REPORT.md` will record the final numbers.

## Decisions from preflight

- The 158 `//` comments are mostly tax-citation comments inside fixtures and rule files. Phase 4 reads each one in context and decides per-comment between (a) lift to TSDoc on the parent function, (b) lift to a `/* */` block header at top of file, (c) delete (already expressed by an identifier name or a test file path), (d) keep as a structural exception per the dev-standards exception set. The default is delete unless a senior reader would be misled without the comment.
- elevate-core ships open source. Every public-facing artefact (README, every Markdown at repo root, every ADR, every issue and PR template) goes through the trio voice in Phase 5 plus the "leak audit" gate -- a public reader who is also an attacker gains zero advantage from any document the repo ships.
- The 29 / 155 test-file ratio is the largest single gap to close. The engagement adds one focused test file per source file in Phase 3, lifting the ratio to 100% and pushing the coverage actuals comfortably above the declared 95 / 90 gate.
- The lint script being aliased to `typecheck` is a real gap. Phase 3 introduces an ESLint configuration aligned with the dev-standards skill (no `interface`, no shorthand, no `//`, no I/O imports for deterministic-library guarantee, import-order canonicalisation).

## Verification numbers single-source-of-truth pointer

`engineering-uplift/verification-numbers.md` is created at the start of Phase 5. Until then, every claim in any in-flight document references this baseline doc by phase + line.
