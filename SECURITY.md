# Security Policy

The library's security model is unusual and worth stating plainly. The library does not read the filesystem, open a network socket, hold a secret, process personal data, invoke randomness, or read the system clock. The attack surface in the conventional sense is therefore very small. Most of what looks like a "security" report against this library is actually a rule-encoding error: an AY-versioned rate is wrong, a CBIC notification was absorbed incorrectly, a CBDT circular's worked example does not reproduce against the encoded function. Those errors have auditable downstream consequences (a wrong tax computation that propagates into a return, a notice, an appeal) and the library treats them with the same seriousness as a memory-safety bug in a systems library.

This document tells you which channel to use for which class of report and what response you can expect.

## Threat model in one paragraph

The library compiles to ESM and ships as a published npm package. Consumers import functions and pass numbers in. The library returns numbers and structured citations out. There is no I/O, no network, no randomness, no time, no secrets, no PII boundary. The only surfaces a third party can attack are: the rule-encoding (does the library compute the legally-correct number for the inputs?), the published package supply chain (is the version on npm what the maintainer published?), and the build-tooling toolchain (does the build process leak intent or secret material into the published artefact?). The first surface is the substantive one; the latter two are hardened with `--provenance` attestation via GitHub Actions OIDC, weekly Dependabot scanning, gitleaks on every push and pull request, and a zero-runtime-dependency posture verified at every release.

## What counts as a security report

The library treats the following as in-scope security reports:

| Class                                               | Example                                                                                                                                                                                      | Channel                                                                                       | First-touch SLA   | Resolution SLA                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------- |
| Rule-encoding error with auditable consequences     | A Section 80C aggregate cap is encoded as Rs. 2 lakh instead of Rs. 1.5 lakh; a Finance Act amendment is absorbed against the wrong AY; a CBIC notification's effective date is off by a day | Private email                                                                                 | 48 hours          | 7 days for a patch release                                                             |
| Citation pointing to the wrong primary source       | The library cites CBDT Circular 12/2024 for a rule that is actually governed by Circular 13/2024                                                                                             | GitHub issue with `rule-correctness` label, OR private email if the consequences are material | 7 days for triage | Next patch release                                                                     |
| Supply-chain compromise                             | A published version on npm differs in any byte from the corresponding GitHub release commit; an unauthorised contributor signs a release                                                     | Private email; do not file a public issue                                                     | 24 hours          | 24 hours to ship a corrected release and unpublish the affected version per npm policy |
| Build-tooling toolchain compromise                  | A devDependency is found to be malicious and is in the build path                                                                                                                            | Private email                                                                                 | 48 hours          | Mitigation in the next release                                                         |
| Conventional vulnerability in the published surface | The library somehow exposes a prototype-pollution gadget; an exported function exhibits an algorithmic-complexity attack against an adversarial input                                        | Private email                                                                                 | 48 hours          | 7 days for a patch release                                                             |
| A "vulnerability" in the absence of I/O             | The library does not validate a date string before passing it to `new Date()`; a consumer can pass `Infinity` to a function and get unhelpful output                                         | GitHub issue with `bug` label; this is a robustness bug, not a security report                |

If you are unsure which channel to use, default to the private channel. The maintainer would rather receive a doubly-private report than miss a real one.

## How to report

Email **`security@elevatefinance.co`** with the subject line beginning `[SECURITY]`. The mailbox routes to the on-call responder. Include:

- A description of the issue.
- The affected version of `@elevatefinance-co/india-tax-rules`.
- The Node version, the operating system, and the package manager (pnpm / npm / yarn).
- A minimal reproduction. For a rule-encoding error, the reproduction is the function call with the inputs that produce the wrong number. For a supply-chain or toolchain report, the reproduction is the byte-level comparison or the build-step trace.
- The primary source if the report is a rule-encoding error: the Section / Sub-section / Clause; the CBIC Notification number + date; the CBDT Circular reference; the Finance Act year + Section; the ICAI Guidance Note number + year; and a working URL on `incometaxindia.gov.in`, `cbic-gst.gov.in`, or `indiacode.nic.in`.
- Your name or handle, if you would like to be acknowledged in the release notes.

The maintainer aims to acknowledge within 48 hours and to ship a patch within 7 days for high-severity issues. Coordinated disclosure is preferred. A CVE is filed when applicable. The reporter is credited in the `CHANGELOG.md` entry unless the reporter requests otherwise.

If `security@elevatefinance.co` is unreachable for any reason, the fallback channel is `support@elevatefinance.co` with the same `[SECURITY]` subject prefix; the on-call responder picks up either mailbox.

## Out-of-scope

The following are not security issues against this library and are routed to other channels:

- A consumer's product (an HR portal, a filing wizard, a CA firm's tooling) leaks PII, accepts unsanitised input, or exposes the library's output unsafely. This is a consumer-side issue. The library has no PII boundary and cannot be the cause.
- A consumer's deployment exhibits a network-side vulnerability (CSRF, SSRF, open redirect, etc.). The library makes no network call.
- A discrepancy between the library's output and a competing library or commercial product's output. The library's contract is reproduction against the primary source, not parity with any third party. Open a `rule-correctness` issue with the primary source attached.
- A discrepancy between the library's output and a Chartered Accountant's manual computation when the manual computation is in error. The library returns the structured citation set; reconcile against the primary source and reopen if the library is wrong.

## The deterministic-by-construction posture

The library's security claims are enforced at lint time, not by convention.

| Posture claim              | Enforcement                                                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No filesystem I/O          | ESLint `no-restricted-imports` blocks every `node:fs` variant in `packages/core/src`                                                                       |
| No network I/O             | ESLint `no-restricted-imports` blocks `node:net`, `node:http`, `node:https`, `node:tls`, `node:dgram`, `undici`, `axios`, etc. in `packages/core/src`      |
| No randomness              | ESLint `no-restricted-syntax` blocks `Math.random()` in source                                                                                             |
| No implicit time read      | ESLint `no-restricted-syntax` blocks `Date.now()` and bare `new Date()` (without arguments) in source                                                      |
| No secrets                 | gitleaks runs on every push and pull request; the workspace has a documented zero-secret state                                                             |
| No PII handling            | The library's API surface accepts numbers, ISO dates, and discriminated-union enums; there is no string-payload entry point that could plausibly carry PII |
| No vulnerable dependencies | `pnpm audit --prod` returns advisory-clean at every release; runtime dependencies are zero by `package.json` declaration                                   |

A future PR that violates any of the above either fails the lint gate or fails the audit gate. The posture is therefore stable across maintainer turnover, contributor turnover, and the pace of the npm ecosystem; a contributor cannot accidentally break the security posture without the CI gate stopping the merge.

## Disclosure timeline

Once a fix is shipped:

1. The fix is published to npm with a patch version bump and a `--provenance` attestation.
2. The `CHANGELOG.md` `Security` section under the new version notes the issue, the reporter (with permission), the affected versions, and the fixed version.
3. A GitHub Security Advisory is published if the issue is a conventional vulnerability or a supply-chain compromise. Rule-encoding errors with auditable consequences receive a CHANGELOG entry under `Security` but typically not a GHSA, on the principle that a rule-encoding error is a correctness bug rather than a vulnerability in the conventional sense; exceptions are made when the consequences cross a materiality threshold (e.g. a wrong rebate that produces a refund-claim error in the consumer's filing).

## Cross-references

- [README.md](./README.md) -- the security-posture summary section.
- [CONTRIBUTING.md](./CONTRIBUTING.md) -- the citation-required and fixture-first rules that prevent rule-encoding errors at landing time.
- [GOVERNANCE.md](./GOVERNANCE.md) -- the maintainer model and merge gate.
- [SUPPORT.md](./SUPPORT.md) -- the channel matrix for non-security reports.
- [docs/architecture.md](./docs/architecture.md) -- the library's architecture and posture diagrams (work in progress).
- [decisions/](./decisions/) -- the architecture decision records.
