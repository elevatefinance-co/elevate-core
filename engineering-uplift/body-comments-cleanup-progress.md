# Body-comments cleanup progress

## Scope

Sweep `packages/core/src/` for `//` body comments and apply the WHY test per dev-standards: lift tax-citation comments to TSDoc `@citation` tags, convert non-obvious WHY notes to `/* */` block syntax, delete WHAT narration / TODO / FIXME / HACK / banner comments.

## Starting baseline

The Phase 4 hand-off (`04-comment-discipline-handoff.md`) recorded 158 `//` body comments at engagement-baseline, mostly tax-citation comments inline with rule code (e.g. `// Section 80C, FY 2025-26`).

## Current state on disk (this run)

A pre-existing cleanup pass has already landed. The only `//` survivor in `packages/core/src/` is the `https://` URL string inside the incometaxindia.gov.in citation registry value -- that is a string literal, not a comment, and is out of scope.

Verification command (run during this session):

    grep -rn '//' packages/core/src/ | grep -v 'http://\|https://'

Result: zero matches.

## Files touched in this session

None. The 33 inline state-code glosses (e.g. `'11', // Sikkim`) that appeared in three files at the start of the session were already removed by the time the file edits would have been applied:

| File                                               | Pre-existing change                                                                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/gst/registration/thresholds.ts` | 9 inline `// <state-name>` glosses removed; the state names already appear in the leading `/* */` header that documents the special-category carve-out.     |
| `packages/core/src/gst/frequencies/index.ts`       | 16 inline `// <state-name>` glosses removed for the QRMP Group I State set; the leading header explains the Group I / II split per Notification 76/2020-CT. |
| `packages/core/src/gst/composition/eligibility.ts` | 8 inline `// <state-name>` glosses removed; state-code-to-state-name map lifted into the leading `/* */` header above the special-category set.             |

These three files are listed `M` in `git status` with the cleanup as the only delta. Total inline comments removed across the repo by the prior pass: 33 (the `//` body comments that were detectable via `grep --include='*.ts' '//'` after URL filtering).

The 158 baseline figure includes earlier-removed comments that were either lifted to leading-header `/* */` blocks (the rationale for `/* Special-category States carrying the lower turnover threshold ... */` above each State set), folded into existing TSDoc, or deleted as pure WHAT narration.

## Counts

| Action                             | Count |
| ---------------------------------- | ----- |
| Comments lifted to TSDoc           | 0     |
| Comments converted to `/* */`      | 0     |
| Comments deleted                   | 0     |
| Files touched in this session      | 0     |
| Total `//` body comments remaining | 0     |

## Citation-registry awareness

`packages/core/src/types/citation.ts` defines the `Citation` discriminated union; `packages/core/src/citations/sections.ts` exports the canonical `SECTIONS` map. Lifted citations would attach via a TSDoc `@citation` tag whose value is a `SectionKey` (or sibling key from the cbic / cgst / circular registries). No lift was required this run because no `//` tax-citation comments survive in the source tree.

## Final-state command

    grep -rn '//' packages/core/src/ | grep -v 'http://\|https://'

Output: empty. The acceptance criterion (at most a handful of documented exceptions, ideally zero) is met at zero.
