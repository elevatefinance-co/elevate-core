# 0003 - The library composes; it does not orchestrate

Status: Accepted
Date: 2026-04-24

## Context

The library exposes primitives like `computeSlabTax`, `computeRebate87A`, `computeSurcharge`, `computeCess`, `computeLtcg112A`, `computeSection80c`. A consumer wanting "net tax under the new regime for an individual with X taxable income" must chain these. We considered offering a higher-level `computeIndividualNetTax(...)` that does the chain internally.

## Decision

The library publishes primitives only. There is no `computeIndividualNetTax`, no `computeFullITR2`, no batteries-included end-to-end function.

## Why

1. **Composition is the consumer's problem.** Different consumers compose differently. An ITR-1 filer wants slabs + rebate + surcharge + cess. An ITR-2 filer wants the same plus capital gains plus deductions plus FTC. An HR platform wants only perquisite at vest. Bundling a single "do everything" function forces opinions on all of them.

2. **The consumer renders the audit trail differently.** An ITR filer puts the trail behind a "show my work" expander. A CA tool puts it on a printable PDF appendix. An LLM assistant summarises it in prose. If the library orchestrates, the orchestration result must guess which presentation the consumer wants. If the library composes, the consumer composes for its own UI.

3. **`ComputationResult<T>` is the contract.** The library returns `value`, `steps[]`, `citations[]`, `ay`, `engineVersion` from every primitive. Consumers concatenate `steps[]` from each step in the chain to get a full audit trail; they merge `citations[]` (with `dedupeCitations`) to get a flat citation set; they keep `value` for arithmetic. The contract is small and consistent.

4. **It keeps the library auditable.** A panel CA inspecting the library reads each primitive in isolation and signs off on it. There is no "main" function whose behaviour depends on thirty parameters and conditional branches.

5. **It decouples release cadence.** Primitives evolve at their own pace. A change to `computeSurcharge` does not require re-validating an end-to-end orchestrator. Consumers integrate at the speed they choose.

## Trade-offs

- Consumers write more code at the call site to chain the primitives. We accept this in exchange for the flexibility.
- A first-time adopter sees a longer quick-start example than they would with `computeIndividualNetTax`. The README mitigates this with a copy-pasteable chain that any consumer can adopt verbatim.

## Consequences

- The library NEVER ships an "everything for ITR-1" or "everything for ITR-2" wrapper. Period.
- Consumers requesting such a wrapper are pointed at the quick-start example and at `docs/examples/simple-slab-tax.ts`.
- Companion wrapper packages MAY exist (e.g. an `@elevatefinance-co/india-tax-itr1` that bundles a chain) but they live in their own npm packages, not in this one.

## References

- `packages/core/src/types/computation-result.ts` (the contract consumers compose against)
- `docs/examples/simple-slab-tax.ts` (canonical chain example)
- `docs/examples/audit-trail-receipt.ts` (rendering composed output)
