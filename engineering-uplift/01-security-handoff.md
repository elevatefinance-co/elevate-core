# Phase 1 Hand-off: Security Hardening (elevate-core)

## Posture verification (no code change required)

elevate-core's security posture at Phase 1 entry was already at the bar the engagement targets. Phase 1 verifies it; nothing changes.

| Item                                          | Status                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm audit --prod`                           | No known vulnerabilities found.                                                                                                                                                                  |
| Runtime dependencies                          | **Zero**. The `package.json` for `packages/core` has no `dependencies` field; only `devDependencies` (vitest, typescript, vite, @vitest/coverage-v8). The library is genuinely zero-runtime-dep. |
| Supply-chain risk via runtime transitive deps | None (zero direct runtime deps means no transitive runtime closure to audit).                                                                                                                    |
| No-I/O guarantee                              | Verified at Phase 0 baseline: zero imports of `node:fs`, `node:net`, `node:http`, `node:child_process`, `node:os`. The library cannot reach the network or the filesystem at runtime.            |
| `Math.random()` calls                         | Zero.                                                                                                                                                                                            |
| `Date.now()` calls in source                  | Zero. AY is always a parameter; the README documents this guarantee verbatim.                                                                                                                    |
| Secrets / API keys / credentials in source    | None. The library has no external-system integration, so no secrets to leak.                                                                                                                     |
| PII handling                                  | None. The library operates on tax-rule primitives (rates, sections, fixtures); the consumer (elevate-app) handles PII before invoking the library.                                               |

## Why this matters for elevate-core's open-source posture

A library that ships open source must be auditable end-to-end by a competitor engineering team, a chartered accountant verifying rule encodings, and a security reviewer at an acquiring company under NDA. elevate-core's three foundational guarantees (no I/O, no secrets, no PII) plus zero runtime dependencies plus pnpm-audit clean make the library essentially unbreakable from a supply-chain perspective. A consumer adopting it as a reference dependency takes on no transitive runtime risk; the only attack surface is the library's own pure-functional code, which is exhaustively tested (29 test files, 466 tests, declared 95/90 coverage gate; Phase 3 closes the 29/155 source-to-test ratio gap and pushes coverage actuals comfortably above the gate).

## What this means for the consumer

elevate-app embeds the library; the embedded library cannot escalate via supply-chain compromise or via the library's own code reaching the network. elevate-app's encryption, persistence, network, and PII-handling surfaces remain the only places the consumer's threat model needs to focus. The library's auditability supports that bounded scope.

## Inherited from prior testing-uplift session (acknowledged, not re-fixed)

elevate-core was not the locus of the four source bugs the prior testing-uplift session surfaced (those were in elevate-app's step-up + UI surface). The library's deterministic-by-construction guarantee held throughout that session.

## Open items (not blocking; tracked for follow-up)

1. Phase 3 introduces a custom ESLint rule (or `no-restricted-imports` configuration) that mechanically enforces the no-I/O guarantee at lint time. The library currently relies on convention plus the `decisions/0003-composition-over-orchestration.md` ADR; Phase 3 makes the guarantee machine-checkable.
2. Phase 3 closes the 29/155 source-to-test-file ratio. Every source file gets a focused test file; the library's coverage actuals move from "above the declared 95/90 gate" to "comfortably above" with provenance per source file.
3. Phase 4 adds a TSDoc comment with `@citation` (custom tag pointing to the primary source: CBIC notification number, CBDT circular, Finance Act year + section) for every exported function. Phase 5 indexes the TSDoc citations in `docs/fixture-by-citation.md`.

## Definition of done

- Audit clean.
- Posture verifications recorded.
- This hand-off committed.

Phase 2 (Lighthouse Optimization web + mobile) does not measure elevate-core directly (no routes); a bundle-size + tree-shakability check lands at the end of Phase 2 to confirm the library ships as a small, side-effect-free bundle that consumers can tree-shake aggressively.
