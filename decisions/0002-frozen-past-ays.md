# 0002 - Past Assessment Years are immutable forever

Status: Accepted
Date: 2026-04-24

## Context

When a Finance Act amends an earlier Assessment Year retroactively (for example, a 2027 Finance Act adds a clause that reaches back to AY 2025-26), the library has two options for handling the amendment.

### Option A: mutate the existing AY module

Edit `packages/core/src/slabs/ay-2025-26.ts` to reflect the new rule. Future calls with `ay: 'AY2025-26'` get the new behaviour.

### Option B: add a new AY variant

Leave `ay-2025-26.ts` exactly as it was on the day it was first shipped. Add a new file - e.g. `ay-2025-26-amended-2027.ts` - that captures the amended behaviour and is selected by an explicit opt-in parameter.

## Decision

Option B - past AYs are immutable forever.

## Why

1. **Reproducibility for historical filings.** A return for AY 2025-26, computed today and saved as a signed receipt, should produce the same number when recomputed in 2031. If we mutate `ay-2025-26.ts` in 2027 to apply a retroactive amendment, then any 2025-26 filing that was already submitted (and signed) under the original rule will mismatch its own audit trail.

2. **Audit defensibility.** A Chartered Accountant defending a number must be able to point at the exact source code that produced it on the day of filing. Git history exists, but nobody wants to do `git checkout v0.4.0` to compute a one-year-old return.

3. **Citation honesty.** A citation pointing at "Section 87A, Finance Act 2024" is a lie if the implementation has been retrospectively patched by Finance Act 2027 logic. Frozen AYs keep the citation faithful to the implementation.

4. **Diff clarity.** Reviewers see new AY variants land as new files, not as scattered edits across the existing AY module. The PR review surface for "amend AY 2025-26" is pages of red / green diff in one file; the PR review surface for "add AY 2025-26 amended-2027 variant" is one new file plus the router wiring.

## Trade-offs

- Disk and bundle size grow over time as AYs accumulate. Bundle growth is mitigated by subpath exports (consumers import only the AYs they need); disk growth is irrelevant for an npm package.
- Consumers must opt into amended variants explicitly. This is a feature - it forces deliberate adoption, not silent behaviour changes when the package is bumped.
- Code duplication between an original AY module and its amended variant is acceptable. Shared helpers may be extracted, but the AY-bound branches stay co-located with their AY for clarity.

## Consequences

- A retrospective amendment ships as a minor version bump (new file, new opt-in parameter, additive surface).
- The selection helper at `slabs/index.ts` (and equivalents in other modules) routes based on the `ay` parameter and any amended-variant flag.
- The maintainer's review checklist explicitly asks "did this PR edit any past AY module" - if yes, the PR is rejected unless the change is a documentation typo or a citation correction that does not alter computed values.

## References

- `packages/core/src/slabs/ay-2025-26.ts` (the canonical example of a frozen AY module)
- `packages/core/src/slabs/index.ts` (the dispatch helper)
- `CONTRIBUTING.md` (the contributor-facing rule)
