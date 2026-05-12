# Pull request

## Summary

One paragraph: what does this PR do, what user-visible behaviour
changes.

## Why

The motivation. If this is a citation correction, link the primary source. If this is a new rule, link the Section / Rule / Finance Act. If this is a refactor, explain the engineering benefit.

---

## Mandatory checklist

The maintainer cannot merge until every box below is honestly checked. Every item is enforced by code review or by CI.

- [ ] **Citation.** Every rate, threshold, ceiling, or AY-bound
      number that this PR adds or changes is paired with a `Citation` entry referencing the canonical lookup (`SECTIONS.SEC_*`, `RULES.RULE_*`, `FINANCE_ACTS.FA_*`, `CIRCULARS.CIR_*`). The primary source URL is in the PR description or in the changeset note.

- [ ] **Tests.** New or updated tests pin the behaviour. At least
      one happy-path case and one edge case. Coverage stays at >= 95% lines / statements / functions and >= 90% branches
      for the affected module.

- [ ] **Zero new runtime dependencies.** Dev dependencies are
      acceptable but called out in the PR description.

- [ ] **Past AYs untouched.** If this PR concerns a retrospective
      amendment to an earlier AY, it adds a NEW AY variant or a version bump on the affected function; it does NOT mutate `ay-2024-25.ts`, `ay-2025-26.ts`, etc.

- [ ] **Pure functions.** No `Date.now()`, no I/O, no randomness,
      no module-level mutable state.

- [ ] **Typecheck, lint, tests, gitleaks.** All four green in CI.

- [ ] **Changeset attached.** `pnpm changeset` was run; the
      summary is human-readable and lands in the next release
      notes.

- [ ] **ASCII / GSM-7 only.** No emojis, em-dashes, smart quotes,
      arrow glyphs, rupee glyph, or any non-ASCII codepoint
      anywhere in the diff (including comments, commit message,
      and changeset note).

- [ ] **Disclaimer alignment.** Nothing in this PR describes the
      library as providing tax / financial / investment advice or claims it represents anyone before any tax authority.

---

## Risk

What could break. Known edge cases. Anything the reviewer should
poke at.

## Backward compatibility

If this is a breaking change, explain why it is necessary and how adopters migrate. Default expectation: no breakage.
