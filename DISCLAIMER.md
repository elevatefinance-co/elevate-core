# Disclaimer

`@elevatefinance-co/india-tax-rules` is a TypeScript library that **computes** Indian tax math against publicly-available statutory rules. It is not tax advice, financial advice, legal advice, or investment advice. It does not replace a qualified Chartered Accountant, an advocate, a cost accountant, or any other professional registered to practise before an Indian tax authority. The library is a tool; what you do with the tool is your own responsibility.

This document explains what the library does, what it does not do, and what your obligations are when you embed it in your own product or workflow.

## What the library does

- Exposes typed, AY-versioned and effective-date-versioned rate tables, slab tables, threshold tables, rebate / surcharge / cess primitives, deduction primitives, capital-gain primitives, RSU-perquisite primitives, GST place-of-supply / ITC / composition / late-fee / penalty primitives, and TDS rate-band / specified-person / penalty primitives. Every primitive is a pure function.
- Returns every computed number as a `ComputationResult<T>` carrying the full provenance trail. Each computational step cites its Section / Sub-section / Clause, its CBIC Notification number + date, its CBDT Circular reference, its Finance Act year + Section, its ICAI Guidance Note number + year, or its Income-tax Rule number, as applicable.
- Is published as a TypeScript library for engineers to embed in their own tax tooling, audit-trail generators, filing workflows, internal CA-firm engines, HR-payroll systems, or research instruments. The library is suitable for any consumer that wants its tax computations to be reproducible, citation-traceable, and auditable.
- Compiles to ESM and ships under `@elevatefinance-co/india-tax-rules` on npm with `--provenance` attestation via GitHub Actions OIDC, MIT-licensed, zero runtime dependencies.

## What the library is not

- **Not tax advice.** The numbers produced by the library are mechanical applications of statutory text. They do not account for the specific facts of any taxpayer's situation, any appellate authority's interpretation in the taxpayer's jurisdiction, any pending judicial proceeding, or any tax planning that requires professional judgement. A computed number is a starting point for a conversation with a Chartered Accountant; it is not the conversation itself.
- **Not a filing agent.** The library does not file returns on anyone's behalf. Section 288 of the Income-tax Act, 1961 restricts representation before income-tax authorities to specifically authorised persons; nothing in this library qualifies or purports to qualify any user as such an authorised person. The library does not speak to the e-filing portal, the GST portal, TRACES, or any other tax-authority system.
- **Not a substitute for a Chartered Accountant.** The Chartered Accountants Act, 1949 regulates the profession of Chartered Accountancy in India; nothing in this library "holds out" its authors, its maintainers, or its users as Chartered Accountants. A consumer that wishes to publish a computed number to a third party in a context that implies professional advice (an audited financial statement, a tax-return preparation service offered to the public, a representation before a tax authority) must engage a qualified Chartered Accountant; the library is the engineering substrate, not the professional opinion.
- **Not SEBI-registered.** The library does not provide investment advice within the meaning of the SEBI (Investment Advisers) Regulations, 2013. It computes the tax consequences of holdings; it does not recommend securities transactions, asset allocations, or financial-planning strategies.
- **Not a legal opinion.** The library encodes its understanding of the published statute, the published rules, the published notifications, and the published circulars. Where the law is contested, the library encodes the position the maintainers believe is most defensible against the primary source; a different position may be tenable in litigation and the library is not the appropriate substrate for that argument.
- **Not a guarantee of completeness.** The library encodes the rules the maintainers have prioritised; the published `Coverage matrix` in the README is the authoritative statement of what is and is not encoded at any given release. A consumer that needs a rule the library does not yet encode files an issue with the `missing-rule` label or contributes a fixture-first PR per `CONTRIBUTING.md`.

## What this library performs computations against

The library encodes publicly-available statutory rules drawn from:

- The Income-tax Act, 1961 and the Finance Acts amending it.
- The Income-tax Rules, 1962 (Rule 3, Rule 11UA, Rule 26, Rule 128 and others as relevant).
- The Central Goods and Services Tax Act, 2017; the Integrated Goods and Services Tax Act, 2017; the Union Territory Goods and Services Tax Act, 2017; the State Goods and Services Tax Acts; and the Goods and Services Tax (Compensation to States) Act, 2017.
- The Central Goods and Services Tax Rules, 2017 and the corresponding rule sets.
- The Black Money (Undisclosed Foreign Income and Assets) Act, 2015 (limited to the cited surfaces; the library does not encode the criminal-law substrate).
- CBDT circulars and notifications as published on `incometaxindia.gov.in`.
- CBIC notifications, circulars, and orders as published on `cbic-gst.gov.in`.
- Selected ICAI Guidance Notes where they form the operative interpretation of a Rule.

The library does not encode any private interpretation, any unpublished position, any draft circular, or any internal departmental guidance. Every encoded rule is verifiable against the official gazette.

## Warranty

Provided "AS IS", without warranty of any kind, express or implied. See [`LICENSE`](./LICENSE) (MIT). The maintainers make no guarantee that the rules encoded here remain correct after any Finance Act, CBDT Circular, CBDT Notification, CBIC Notification, CBIC Circular, ICAI Guidance Note, or judicial ruling that modifies the underlying statute or its interpretation. Every adopter is responsible for cross-checking computed outputs against the primary sources cited.

The MIT licence's limitation of liability is the operative legal text. The plain-English summary is: if you embed the library in your product and the library produces a wrong number that costs you or your customers money, the maintainers are not liable. The library is a public-good piece of engineering shipped under permissive terms; the consumer assumes the obligation to verify before publishing.

## Consult a qualified Chartered Accountant

Penalties under the Black Money (Undisclosed Foreign Income and Assets) Act, 2015, the Income-tax Act, 1961, the Goods and Services Tax Acts, and the Finance Act amendments are severe and fact-specific. A wrong rebate, a wrong place-of-supply determination, a wrong specified-person uplift, or a wrong cliff-date treatment can convert into interest, late fees, demand notices, and in extreme cases prosecution. The library helps you avoid the mechanical errors; it does not help you avoid the judgement errors. Always consult a qualified Chartered Accountant for your specific circumstances, especially when:

- The taxpayer's facts touch a closed-AY position that the library has frozen.
- The taxpayer's facts straddle a cliff-date (the 23-July-2024 capital-gains cliff is the canonical example) and the encoded treatment depends on a date attribution that the taxpayer can substantiate.
- The taxpayer's holdings include a class the library does not yet encode (specific niche perquisites, specific niche capital-gains classes, specific niche ITC reversals).
- The taxpayer is subject to an active enquiry, an active assessment, an appellate proceeding, or a judicial proceeding.
- The taxpayer's residency status is contested or the taxpayer is claiming DTAA relief.

## Reporting corrections

If a rule or a rate is wrong, open a GitHub issue with the `rule-correctness` label and attach the primary source. Every Pull Request that modifies a rule MUST include a Section / Sub-section / Clause / CBIC notification / CBDT circular / Finance Act / ICAI Guidance Note citation and the effective AY. Corrections are the most valuable contribution this library can receive; the contributor is credited in the next release's `CHANGELOG.md` entry.

For rule-correctness reports with auditable downstream consequences (a wrong number that has propagated into filings or notices), the private channel at `security@elevatefinance.co` is also available; see `SECURITY.md` for the SLA.

## Contact

| Topic                                                                                      | Channel                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| A rule is wrong                                                                            | GitHub issue with `rule-correctness` label, primary source attached            |
| The library has a bug                                                                      | GitHub issue with `bug` label, minimum-viable reproduction attached            |
| A rule is missing                                                                          | GitHub issue with `missing-rule` label, primary source attached                |
| Security report (rule-encoding error with auditable consequences; supply-chain compromise) | `security@elevatefinance.co` with `[SECURITY]` subject prefix                  |
| Conduct concern                                                                            | `conduct@elevatefinance.co`                                                    |
| Commercial support; private SLA; custom-integration enquiry                                | `support@elevatefinance.co` with `[COMMERCIAL]` subject prefix                 |
| Licensing or grievance enquiry                                                             | `support@elevatefinance.co` with `[LICENSING]` or `[GRIEVANCE]` subject prefix |

The library itself processes no personal data. The `support@elevatefinance.co` mailbox is the single user-facing alias; internal routing forwards to the appropriate responder.

## Cross-references

- [README.md](./README.md) -- the audience-routed entry point with the coverage matrix and security posture.
- [CONTRIBUTING.md](./CONTRIBUTING.md) -- contribution flow and the citation-required rule.
- [GOVERNANCE.md](./GOVERNANCE.md) -- the maintainer model and decision process.
- [SECURITY.md](./SECURITY.md) -- responsible disclosure of rule-encoding errors with auditable consequences.
- [SUPPORT.md](./SUPPORT.md) -- the channel matrix.
- [CHANGELOG.md](./CHANGELOG.md) -- the rule-update history.
- [docs/architecture.md](./docs/architecture.md) -- the library's architecture (work in progress).
- [docs/fixture-by-citation.md](./docs/fixture-by-citation.md) -- the citation-to-test navigation document (work in progress).
- [decisions/](./decisions/) -- the architecture decision records.
- [LICENSE](./LICENSE) -- the MIT licence text.
