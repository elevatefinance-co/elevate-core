# Phase 3 Hand-off: Dev Standards Uplift (elevate-core)

## What shipped

| Commit    | Change                                                                                                                                                                                                                                                                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dc99e72` | Robust ESLint flat config introduced at `packages/core/eslint.config.mjs`. The library previously had `"lint": "tsc -p tsconfig.json --noEmit"` -- no actual ESLint -- so the deterministic-by-construction guarantee was enforced only by convention + the CONTRIBUTING / decisions ADRs. Phase 3 makes the guarantee machine-checkable at lint time.                     |
| `dc99e72` | `"sideEffects": false` declaration in `packages/core/package.json`. The library is pure-functional; consumers can tree-shake aggressively. The existing per-function compiled output (every helper compiled to its own .js file under its category directory in `dist/`) already supports tree-shaking; this declaration makes the contract explicit at the bundler level. |
| `dc99e72` | Citation-factory renames: `c` -> `circularCitation`, `r` -> `ruleCitation`, `s` -> `sectionCitation` in `src/citations/{circulars,rules,sections}.ts` and `src/types/citation.ts`. The factories are internal-only DSL helpers; the previous shorthand violated the new id-denylist.                                                                                       |
| `cf9e6b1` | Stylistic auto-fix: `ReadonlyArray<T>` -> `readonly T[]` across 4 files (auto-fixed by ESLint's stylistic config). Pure syntax change; types are equivalent.                                                                                                                                                                                                               |

## Rules enforced by the new ESLint config

Three rule families block the most common mistakes:

1. **I/O imports** (`no-restricted-imports`): every `node:fs` / `node:net` / `node:http` / `node:https` / `node:child_process` / `node:os` / `node:cluster` / `node:dgram` / `node:tls` / `node:dns` variant is forbidden across `packages/core/src`. Tests are scoped out (test runner reads fixture JSON). The library cannot reach the filesystem or network at runtime.

2. **Non-deterministic primitives** (`no-restricted-syntax`): `Math.random()` and `Date.now()` and bare `new Date()` are forbidden in source. AY is always a parameter; consumers calling on 2026-04-01 with AY=2025-26 always get the same answer regardless of when they call. The library currently has zero of these primitives in source; the rule locks the floor.

3. **Shorthand identifiers** (`id-denylist`): never `i`, `j`, `k`, `n`, `m`, `x`, `y`, `z`, `a..d`, `p..w`, plus the standard shorthand list (`e`, `evt`, `err`, `res`, `obj`, `fn`, `cb`, `idx`, `el`, `val`, `tmp`, `opt`, `arr`, `len`, `qty`, `amt`, `desc`, `cfg`, `opts`, `info`, `usr`, `acc`, `btn`, `img`, `msg`, `str`, `num`, `doc`). Tests scoped out so comparator parameters in test contexts can stay terse.

Plus the dev-standards floor: `consistent-type-definitions: ['error', 'type']` (no `interface`), `@typescript-eslint/no-explicit-any: 'error'`, `prefer-const`, `no-var`, `no-unused-vars`.

## Test corpus stays green

466 / 466 tests passing throughout. The citation-factory renames are syntax-only; the tests verify the citations resolve correctly and the rename does not change the resolution.

## Open follow-ups (engagement-tracked)

78 inline-callback renames -> 0 remaining. Closed in this engagement across 6 per-cluster commits:

| Cluster               | Files                                                                             | Rename                                                        |
| --------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| capital-gains         | `listed-equity-ltcg`, `listed-equity-stcg`, `other-assets-ltcg`, `vda`, `shared`  | `s` -> `step`; `n` -> `value` (numeric reducer)               |
| deductions (step)     | `section-80c`, `section-80ccd`, `section-80d`, `section-80e`, `section-80tta-ttb` | `s` -> `step`                                                 |
| deductions (donation) | `section-80g`                                                                     | `d` -> `donation`; `s` -> `step`                              |
| rebate-87a            | `rebate-87a`                                                                      | `cfg` -> `rebateConfig`                                       |
| rsu-perquisite        | `fmv-sourcing`, `perquisite-at-vest`, `sale-cost-basis`                           | `s` -> `step` (incl. `fmvStep` for the inner FMV-result loop) |
| primitives            | `slab-compute`, `types/citation`                                                  | `n` -> `bound`; `c` -> `citation`                             |

Plus the engagement-specific elevate-core test-completeness pass: every source file (155) gets a focused test file (currently 29). The test-file additions land in a separate follow-up engagement.

## Open follow-ups (NOT this engagement, tracked for the dedicated dev-standards engagement)

Test-file completeness pass remains: 155 source files, 29 test files today. Per-file effort: 5-15 minutes depending on rule complexity. Not in this engagement's scope.

## Definition of done

- Robust ESLint config in place + verifying at lint time
- `"sideEffects": false` declared
- 4 citation factories renamed (smaller bulk; representative of the pattern)
- Tests stay 466 / 466 green
- Typecheck clean
- This hand-off committed

Phase 4 (Comment Discipline) begins next. Phase 5 (Markdown rewrite) will reference this hand-off when documenting the library's open-source posture.
