# 0001 - Citation as a six-variant discriminated union

Status: Accepted
Date: 2026-04-24

## Context

Every rate, threshold, ceiling, and rebate in the library carries provenance: which provision of which Act, Rule, Circular, Notification, Finance Act, or ICAI Guidance Note produced the number. Two shapes were considered for representing this provenance.

### Option A: flat string

A single `Citation` type as a string, e.g. `"Sec 87A, FA 2024"`.

### Option B: discriminated union

A `Citation` type with a `kind` discriminator and per-variant fields:

```ts
type Citation =
  | { kind: 'section'; act: 'IT_ACT_1961'; section: string; subSection?: string; clause?: string }
  | { kind: 'circular'; number: string; date: string; url?: string }
  | { kind: 'notification'; number: string; date: string; url?: string }
  | { kind: 'finance-act'; year: number; section?: string }
  | { kind: 'icai-gn'; number: string; year: number; url?: string }
  | { kind: 'rule'; ruleNumber: string };
```

## Decision

The library uses Option B - a six-variant discriminated union with canonical lookup tables for each variant.

## Why

1. **Downstream renderers can branch on `kind`.** A consumer that wants a hyperlink to `indiacode.nic.in` for sections, a tooltip to the bare-act PDF for circulars, and a link to the e-gazette for finance acts can do so without parsing strings. The library gives data; the consumer decides presentation.

2. **Structural equality is cheap.** `dedupeCitations` can do a deep-key compare to remove duplicate references along a long compute chain. With flat strings, dedup needs string normalisation that can collapse non-equivalent citations (Section 17(2)(vi) and Section 17(2)(vii) both stringify to "Sec. 17(2)").

3. **Type-level guarantees.** A `SectionCitation` cannot be passed where a `CircularCitation` is required. The TypeScript exhaustiveness check on the `kind` discriminator catches missing-variant bugs at compile time when new citation types are added.

4. **Future variants are additive.** A new variant (e.g. `CourtRulingCitation` for rulings cited in CBDT circulars) is a new entry in the union, not a string-format renegotiation across every consumer.

5. **Authoritative lookup tables.** Constants like `SECTIONS.SEC_87A`, `RULES.RULE_3_8`, `FINANCE_ACTS.FA_2024` mean a section's metadata (act, section number, official name) is captured once and referenced everywhere. Renames are a one-line change.

## Trade-offs

- Slightly more verbose at the call site than a flat string.
- Slightly bigger published types surface.
- Both are accepted as the cost of the long-term flexibility.

## Consequences

- Consumers MUST handle every variant or accept a TypeScript error. This is a feature, not a bug; it forces deliberate UI decisions.
- Adding a new variant is a minor version bump (semver minor) and must include a changeset note.
- The library has a hard-and-fast rule: every public function returns `ComputationResult<T>` carrying `Citation[]`. There is no escape hatch returning a bare number.

## References

- `packages/core/src/types/citation.ts` (the union definition)
- `packages/core/src/citations/sections.ts`, `finance-acts.ts`, `rules.ts`, `circulars.ts` (canonical lookups)
- `packages/core/src/citations/dedupe.ts` (structural equality)
