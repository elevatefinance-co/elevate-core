# Architecture

> The directory taxonomy a contributor follows when adding a new tax domain (Customs Duty, per-State Stamp Duty, per-State Professional Tax, Equalisation Levy, Securities Transaction Tax, etc.).

This document is the engineer's map of the library. Read it together with the [README](../README.md) (audience-routed quick navigation), the [fixture-by-citation index](./fixture-by-citation.md) (every primary source mapped to its test), and the [worked examples](./worked-examples.md) (CA-validatable end-to-end runs). The three documents cross-reference each other deliberately: a contributor lands a new domain via the architecture template, registers every citation in the fixture index, and demonstrates the end-to-end compute in a worked example.

## Table of contents

1. [Library shape at a glance](#library-shape-at-a-glance)
2. [Per-domain anatomy](#per-domain-anatomy)
3. [Cross-cutting helpers](#cross-cutting-helpers)
4. [Public API surface and `exports` registration](#public-api-surface-and-exports-registration)
5. [Adding a new tax domain. The template](#adding-a-new-tax-domain-the-template)
6. [SemVer impact convention](#semver-impact-convention)
7. [Where to read next](#where-to-read-next)

## Library shape at a glance

The repository is a pnpm workspace; the only published package is `@elevatefinance-co/india-tax-rules` at `packages/core/`. Source lives at `packages/core/src/`; tests mirror that tree at `packages/core/test/`; built artefacts land at `packages/core/dist/` (gitignored).

Inside `packages/core/src/` every taxonomic peer at the top level is either a single-file rule (e.g. `cess.ts`, `surcharge.ts`, `rebate-87a.ts`, `slab-compute.ts`) or a domain folder. The folders carry a `citations/` sub-folder, one or more rule modules, and an `index.ts` barrel. Today's domain layout:

```
packages/core/src/
  index.ts                 root barrel
  cess.ts                  Health and Education Cess. Single rule
  surcharge.ts             Tier-based surcharge stacks
  rebate-87a.ts            Section 87A rebate
  slab-compute.ts          Per-slab walk used by every regime
  citations/               ITR citation registry (Sections, Rules, Circulars, Finance Acts)
  slabs/                   AY-versioned slab tables (one file per AY)
  capital-gains/           Sections 111A, 112, 112A, 115BBH; split-date helper
  deductions/              Chapter VI-A; new-regime allow-list
  rsu-perquisite/          Section 17(2)(vi); FMV sourcing; sale cost basis
  gst/                     Offering A. Sub-namespaced under root
  tds/                     Offering B. Sub-namespaced under root
  types/                   Citation discriminated union; ComputationResult
```

Three structural rules a reader internalises before adding anything:

1. **Every rule module returns `ComputationResult<T>`.** A bare number is a bug. The result carries `value` plus `steps` (audit-rendering rows) plus `citations` (the deduped provenance set). See `packages/core/src/types/result.ts`.
2. **Every constant in the library traces to a citation.** No magic numbers. Slab boundaries cite the AY's Finance Act; rates cite the Section; thresholds cite the operative notification. The citation registries at `citations/` (ITR), `gst/citations/` (GST) and `tds/citations/` (TDS) are append-only.
3. **Every domain is mechanically isolated.** ITR, GST, TDS each own their namespace; cross-domain imports are blocked at lint time except via shared cross-cutting helpers in `types/`.

## Per-domain anatomy

A domain folder follows the same shape regardless of how big the domain becomes. The pattern below is the one a contributor copies.

```
<domain>/
  index.ts                 Public barrel. Names every export by name (no wildcard re-export of types).
  citations/               Domain-local citation registry.
    index.ts               Barrel.
    <act>-sections.ts      Section / sub-section / clause registry for the controlling act.
    <rules>-rules.ts       Rule registry for the operative subordinate legislation.
    <board>-notifications  Notification register (CBIC, CBDT, etc.).
    finance-acts.ts        Finance Act register if the domain is amended annually.
    circulars.ts           Operative clarifying circulars.
  <rule-cluster>/          One folder per logical rule cluster (place-of-supply, ITC, penalties, ...).
    index.ts               Cluster barrel.
    <rule>.ts              One file per rule. The file is the smallest meaningful unit of the law.
    types.ts               Shared input / result types if the cluster needs more than one.
  fixtures/                Optional. Domain-specific fixture data (turnover bands, rate tables) imported by rules.
  types.ts                 Optional. Domain-wide shared types not specific to a single cluster.
```

Today's GST namespace at `packages/core/src/gst/` is the canonical reference for a fully-built domain:

| Cluster            | What it owns                                                                                     | Primary citations                              |
| ------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `citations/`       | CGST Act sections, IGST Act sections, CGST Rules, CBIC notifications                             | The whole regime                               |
| `place-of-supply/` | Sections 10-13 IGST resolvers (goods, imports/exports, services in India, services cross-border) | IGST 10, 11, 12, 13                            |
| `itc/`             | Section 16 eligibility, Section 17(5) blocked credits, Section 16(4) time bar                    | CGST 16, 17, 17(5)(a)-(k)                      |
| `composition/`     | Section 10 eligibility plus rate breakup                                                         | CGST 10, Notification 8/2017-CT (Rate)         |
| `registration/`    | Section 22 thresholds + Section 24 compulsory triggers                                           | CGST 22, 24                                    |
| `frequencies/`     | Monthly / QRMP / composition cadence and due-date computers                                      | Notification 6/2017-CT, 75/2020-CT, 76/2020-CT |
| `penalties/`       | Section 47 late fee, Section 50 interest with Rule 88B net-cash basis                            | CGST 47, 50, Rule 88B                          |
| `rates/`           | Five-slab structure plus basis-points conversion                                                 | CGST 9, Notification 1/2017-CT (Rate)          |

The TDS namespace at `packages/core/src/tds/` mirrors the same shape, with `rate-band-resolver.ts` as the central per-Section per-effective-date dispatcher and `pan-validation/specified-person.ts` as the 206AB / 206CCA decision logic.

### What lives in `index.ts`

The domain barrel is the contract with the rest of the library. Three obligations:

1. **Re-export only the names a consumer touches.** Internal helpers stay un-re-exported. A reader of `tds/index.ts` should be able to enumerate the domain's surface in under a minute.
2. **Document the domain's scope inline.** A leading block comment names what the namespace covers today and what is slated for follow-up. Future contributors do not have to grep.
3. **Never re-export across domains.** GST does not import from TDS; TDS does not import from GST. The only allowed cross-domain reach is into `types/` for the citation primitive and `ComputationResult`.

### What lives in `citations/`

Every primary source the domain cites lives in a typed const map. The maps are append-only: even superseded notifications stay forever because historical computations against an effective-date band must keep resolving. A renamed key is a breaking change to the major version (see SemVer below).

```ts
/* CBIC notification register. Append-only. */
export const CBIC_NOTIFICATIONS = {
  N_1_2017_CT_RATE: ctRate('1/2017', '2017-06-28', 'Principal CGST rate schedule. Five slabs.'),
  N_14_2022_CT: ct(
    '14/2022',
    '2022-07-05',
    'Rule 88B. Net-cash interest computation effective 1 July 2022.',
  ),
  /* ... */
} as const;

export type CbicNotificationKey = keyof typeof CBIC_NOTIFICATIONS;
```

The factory functions (`ct`, `ctRate`, `cgst`, `igst`, `itr`, `circular`, `fa`) are file-private. They build the `Citation` discriminated-union value with the right `kind` and the right `act` / `rules` discriminator, so a consumer pattern-matches on `citation.kind === 'section'` and `citation.act === 'CGST_ACT_2017'` and the type-checker enforces exhaustiveness.

### What lives in a rule file

A single rule file (e.g. `gst/itc/eligibility.ts`, `tds/rates/rate-band-resolver.ts`, `deductions/section-80c.ts`) has four parts in this order:

1. **A leading block comment** stating the controlling section / rule / notification, the rule's scope, the carve-outs, the timeline of amendments, and what the file deliberately does NOT compute.
2. **Imports** ordered: types first, citation registries second, sibling rule modules third, intra-package types fourth. No cross-domain imports beyond `types/`.
3. **Type exports** for the input shape and the result shape. The result is either a `ComputationResult<T>` (when the rule produces a number plus steps plus citations) or a discriminated-union outcome (when the rule produces a binary classification with reason codes, as for ITC eligibility or compulsory-registration triggers).
4. **One exported function per public verb.** The function is pure: no I/O, no `Date.now()`, no `Math.random()`. Every date or time it depends on is a parameter the caller passes.

## Cross-cutting helpers

The shared substrate every domain reaches for sits in two places.

### `packages/core/src/types/`

The citation discriminated union (`Citation`) and the computation result contract (`ComputationResult<T>` plus `ComputationStep`) live here. Every domain imports both. The barrel re-exports a flat surface for downstream consumers; a type-only `import` from `@elevatefinance-co/india-tax-rules` carries no runtime cost and gives an adapter layer the full vocabulary.

The `Citation` union has seven kinds: `section`, `circular`, `notification`, `finance-act`, `icai-gn`, `rule`, `gst-council-meeting`. Adding a new kind is a deliberate extension: it changes the discriminator universe and every consumer's exhaustive switch must update. Today the seven cover every primary source the library cites; a new domain almost always pattern-matches into the existing kinds.

The `ComputationResult<T>` contract:

```ts
export type ComputationResult<T> = {
  readonly value: T;
  readonly steps: readonly ComputationStep[];
  readonly citations: readonly Citation[];
  readonly ay: AssessmentYear;
  readonly engineVersion: string;
};
```

The `dedupeCitations` helper at `types/citation.ts` is the convergence point: a long compute chain accumulates the same Section / Rule reference repeatedly and the helper structurally dedupes, preserving first-seen order. Every public function calls it before returning.

### Cross-cutting validators and formatters

Identifier validators (PAN, TAN, GSTIN), period helpers (FY, quarter, AY), currency formatters (Rs. with Indian-grouping), and the basis-points integer arithmetic helpers are intended to live in a `shared/` folder at `packages/core/src/shared/` once a second domain demands them. Until then, helpers stay co-located with the rule file that needs them (e.g. `rsu-perquisite/perquisite-at-vest.ts` keeps its FX-conversion helper inline). The lift-to-shared trigger is the second-consumer rule: when two domains need the same helper, it migrates to `shared/`. This avoids speculative abstraction.

The integer-arithmetic convention deserves its own note. GST and TDS amounts are stored and computed as `bigint` paise (1 rupee = 100 paise). ITR amounts are stored as `number` rupees (because ITR rates are percentages with limited precision concerns). Mixing the two within a single rule is an error; cross-domain composition routes through the `types/result.ts` boundary and converts at the boundary, never inside a rule.

## Public API surface and `exports` registration

The library publishes a per-domain entry point so a consumer's bundler tree-shakes aggressively. The shape of `packages/core/package.json` `exports`:

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./citations": {
      "types": "./dist/citations/index.d.ts",
      "import": "./dist/citations/index.js"
    },
    "./slabs": { "types": "./dist/slabs/index.d.ts", "import": "./dist/slabs/index.js" },
    "./capital-gains": {
      "types": "./dist/capital-gains/index.d.ts",
      "import": "./dist/capital-gains/index.js"
    },
    "./deductions": {
      "types": "./dist/deductions/index.d.ts",
      "import": "./dist/deductions/index.js"
    },
    "./rsu-perquisite": {
      "types": "./dist/rsu-perquisite/index.d.ts",
      "import": "./dist/rsu-perquisite/index.js"
    },
    "./gst": { "types": "./dist/gst/index.d.ts", "import": "./dist/gst/index.js" },
    "./tds": { "types": "./dist/tds/index.d.ts", "import": "./dist/tds/index.js" }
  }
}
```

Two consumer call-shapes:

```ts
/* Flat re-export. Pulls everything from the root barrel; tree-shakes via sideEffects: false. */
import {
  computeSlabTax,
  computeRebate87A,
  computeSurcharge,
  computeCess,
} from '@elevatefinance-co/india-tax-rules';

/* Per-domain entry. Names sit in their domain namespace; safer for cross-domain isolation. */
import * as gst from '@elevatefinance-co/india-tax-rules/gst';
import * as tds from '@elevatefinance-co/india-tax-rules/tds';
```

The root `src/index.ts` chooses to flat-re-export the ITR substrate (slabs, capital gains, deductions, RSU, citations) and to namespace GST + TDS as `gst.*` and `tds.*`. This keeps existing ITR-only consumer call sites unchanged and makes cross-domain isolation visible in import statements.

### Registering a new domain

When you add `packages/core/src/<new-domain>/`, three places change in lockstep:

1. **`packages/core/package.json` `exports`** gains a `./<new-domain>` block pointing at the dist barrel. Always include both `types` and `import` keys; consumers' moduleResolution under `bundler` / `node16` / `nodenext` fail without the explicit types entry.
2. **`packages/core/src/index.ts`** gains the namespace re-export. For ITR-substrate-style fully-flat domains (Customs Duty intended for direct call sites): `export * from './<new-domain>/index.js';`. For sub-namespaced domains following the GST / TDS pattern: `export * as <new-domain> from './<new-domain>/index.js';`.
3. **`packages/core/eslint.config.mjs`** cross-domain block list (the `no-restricted-imports` array) gains the new domain. The lint rule blocks a rule file under `<new-domain>/` from reaching into a sibling domain except via `types/`.

A change that only adds a new entry point is MINOR. A change that renames or removes one is MAJOR. See [SemVer](#semver-impact-convention).

## Adding a new tax domain. The template

Concrete walk-through for an example domain. The same template applies whether the new domain is Customs Duty (Customs Act 1962), per-State Stamp Duty (Indian Stamp Act 1899 read with State amendments), per-State Professional Tax (State-specific Acts), Equalisation Levy (Finance Act 2016 Chapter VIII), or Securities Transaction Tax (Finance (No. 2) Act 2004 Chapter VII). Pick one and proceed.

### Step 1. Lay down the directory

```
packages/core/src/<new-domain>/
  index.ts
  citations/
    index.ts
    <act>-sections.ts
    <rules>-rules.ts            (if subordinate legislation applies)
    notifications.ts            (if board notifications apply)
    finance-acts.ts             (if annual amendments)
  <rule-cluster-1>/
    index.ts
    <rule-1>.ts
    types.ts                    (if shared types needed)
  <rule-cluster-2>/
    index.ts
    <rule-2>.ts
```

### Step 2. Land the citation registry first

A rule file cannot import a citation that does not exist. Stand up `<act>-sections.ts` with the foundational sections (charging, scope, definitions). If the act has subordinate rules, stand up `<rules>-rules.ts`. If a board notifies operational rates, stand up `notifications.ts`. Each registry is an `as const` object keyed by mnemonic; the factory function builds the citation discriminated-union value.

If the `Citation` union does not yet have a `kind` for your source (rare; the existing seven cover most cases), extend `packages/core/src/types/citation.ts` and add the `kind` to the discriminated union. A `kind` extension is MAJOR.

If your source needs a new `act` or `rules` discriminator (e.g. Customs Duty needs `CUSTOMS_ACT_1962`), extend the `StatuteAct` / `StatuteRules` unions in `types/citation.ts`. This is a MINOR extension.

### Step 3. Land the first rule fixture-first

Pick the simplest rule in the domain that has a primary-source example with concrete numbers. Land the test file at `packages/core/test/<new-domain>/<rule>.test.ts` with the example inputs and expected outputs as fixtures. The test will fail until step 4. That is intentional. The fixture is the spec.

### Step 4. Land the rule implementation

Write the rule file at `packages/core/src/<new-domain>/<cluster>/<rule>.ts` following the four-part structure in [What lives in a rule file](#what-lives-in-a-rule-file). The function is pure; the inputs are typed; the output is `ComputationResult<T>` with `steps` and `citations` from the registry.

### Step 5. Wire the public surface

Update three files:

1. The cluster barrel: `<new-domain>/<cluster>/index.ts` re-exports the rule.
2. The domain barrel: `<new-domain>/index.ts` re-exports the cluster.
3. The root: `packages/core/src/index.ts` re-exports the domain (flat or namespaced; see above).
4. The package.json `exports` field: add the `./<new-domain>` entry.

### Step 6. Land the changeset

`pnpm changeset` describes the change in human terms and pins the SemVer bump. A new domain is MINOR by definition (it grows the surface; it does not break existing consumers). The changeset names the citations the release absorbs (e.g. "Customs Tariff Act 1975 First Schedule entries 8703, 8711, 8517 absorbed via CBIC Notification 50/2017-Cus dated 2017-06-30").

### Step 7. Update the docs

Three updates, one per doc:

- **This document.** Add a row to the per-domain anatomy table for the new domain. If the domain demands new cross-cutting helpers, name them in [Cross-cutting helpers](#cross-cutting-helpers).
- **[Fixture index](./fixture-by-citation.md).** Add rows for every citation the new domain encodes, mapping each to the source file and the test file.
- **[Worked examples](./worked-examples.md).** If the new domain is non-trivial, add one worked example so a CA can validate the encoding against a primary source.

## SemVer impact convention

The library follows the JavaScript-ecosystem SemVer norm with one extra discipline: every release notes the primary-source citations it absorbs.

| Bump      | Rule-semantics example                                                                                      | Surface example                                                                        | Build / test example                                         |
| --------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **PATCH** | Fixture refinement (a rounding boundary corrected to match the official answer to-the-rupee).               | A typo in a TSDoc citation note.                                                       | A test added that did not exist before; build script change. |
| **MINOR** | A new Section / Form / domain support (the surface grows; existing consumers see no behaviour change).      | A new entry in the citation registry. A new `act` discriminator. A new rule file.      | New devDependency. New test fixture file.                    |
| **MAJOR** | A function's signature changes. A rule's output for the same input differs in ways consumers must adapt to. | A renamed citation key. A removed `Citation` kind. A removed entry-point in `exports`. | A peerDependency requirement bump.                           |

**Frozen-past-AY rule.** A consumer computing for AY 2020-21 in 2026 must receive the AY 2020-21 rules. Slab tables and effective-date bands for past AYs are FROZEN at their minor version; the only edit a past-AY file ever receives is a typo correction (PATCH). Any rule-correctness bug discovered for a past AY ships as a new entry in a `corrections.ts` companion file with a leading citation explaining the original encoding's error and the corrected encoding; consumers opt in by importing the corrected entry.

**Append-only citation registry rule.** The `CIRCULARS`, `SECTIONS`, `FINANCE_ACTS`, `RULES`, `CBIC_NOTIFICATIONS`, `CGST_ACT_SECTIONS`, `IGST_ACT_SECTIONS`, `CGST_RULES`, `ITA_SECTIONS`, `IT_RULES`, `FINANCE_ACTS_TDS`, `CBDT_CIRCULARS` const maps are append-only. A rename is MAJOR. A removal is MAJOR. A new key is MINOR. Tests at `packages/core/test/citations.test.ts` lock the canonical keys; an accidental rename fails the test loudly.

## Where to read next

- [README](../README.md). The audience-routed quick-navigation entry point. Start here if you arrived without context.
- [Fixture index](./fixture-by-citation.md). Every CBIC notification, CBDT circular, Finance Act change, CGST Section, IGST Section, CGST Rule, ITA Section, and IT Rule the library encodes, mapped to the source file and the test file that locks it.
- [Worked examples](./worked-examples.md). Five end-to-end runs a Chartered Accountant validates against the official gazette.
- [Decisions](../decisions/). The ADRs explaining why the citation discriminated union exists, why past AYs are frozen, why the library prefers composition over orchestration.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md). The fixture-first contribution flow with the PR template enforcing the citation requirement.
- [`GOVERNANCE.md`](../GOVERNANCE.md). How decisions get made and who has merge authority.
