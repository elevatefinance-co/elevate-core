# Support

This document tells you where to ask for help, what response time you can expect, and which channel is right for which kind of question. Using the right channel means the right people see your message faster, which means your issue is resolved faster.

The library is a published npm package with no runtime service component. There is no portal to be down, no API key to rotate, no rate limit to negotiate. "Support" therefore means triaging issues against the published package and shipping a corrected release. The maintainers are responsive within the SLA below; please use the channel that matches your need.

## Channel matrix

| What you have                                                                                                 | Where it goes                                                                                                                               | First-touch SLA                                                                           | Resolution SLA                                                                       |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Software vulnerability (CVE-class, supply-chain compromise, conventional security report)                     | Email `security@elevatefinance.co` with subject `[SECURITY]`                                                                                | 48 hours                                                                                  | 7 days for high-severity patch                                                       |
| Rule-encoding error with auditable consequences (a wrong rate that has propagated into filings)               | Email `security@elevatefinance.co` with subject `[SECURITY]`, OR GitHub issue with `rule-correctness` label and the primary source attached | 48 hours (private channel) or 7 days (public channel)                                     | 7 days for the fix to ship in a patch release                                        |
| Rule-correctness dispute ("this rate is wrong", "this citation is stale", "this AY treatment is mis-encoded") | GitHub issue with `rule-correctness` label, primary source attached                                                                         | 7 days for triage                                                                         | Next patch release                                                                   |
| Software bug (typecheck error, runtime exception, build failure, unexpected output for non-statutory reason)  | GitHub issue with `bug` label, minimum-viable reproduction attached                                                                         | Best-effort review (typically within a fortnight)                                         | Next patch release                                                                   |
| Missing rule / new feature ("please encode Section X", "please add AY 2027-28 support")                       | GitHub issue with `missing-rule` or `enhancement` label, primary source attached                                                            | Best-effort triage on the issue thread                                                    | Negotiated; PRs adding the rule (with citation and fixture) ship faster than waiting |
| General question                                                                                              | GitHub Discussions (when enabled) or a regular GitHub issue with `question` label                                                           | Community-answered; the maintainer answers when the question requires a maintainer answer |
| Conduct concern                                                                                               | Email `conduct@elevatefinance.co`                                                                                                           | Acknowledged within 48 hours                                                              | Reviewed and responded to per the Code of Conduct enforcement guidelines             |
| Commercial enquiry (private SLA, custom integration, training, audit-support engagement)                      | Email `support@elevatefinance.co` with subject `[COMMERCIAL]`                                                                               | 5 working days                                                                            | Negotiated                                                                           |
| "Is the library down?"                                                                                        | The library has no runtime service. Check `npmjs.com` for registry availability if `pnpm add` fails                                         | n / a                                                                                     | n / a                                                                                |

## Security reporting in detail

If you have found a security vulnerability in the published package, **do not file a public GitHub issue**. Email `security@elevatefinance.co` with the subject line beginning `[SECURITY]`.

The full security policy is at [`SECURITY.md`](./SECURITY.md). The summary:

- Coordinated disclosure is preferred. The maintainer aims to acknowledge within 48 hours and to ship a patch within 7 days for high-severity issues.
- A CVE is filed when applicable.
- The reporter is credited in the `CHANGELOG.md` `Security` entry under the patched version, with the reporter's permission.
- The library's threat model is unusual: most "security" reports against this library are rule-encoding errors. The security policy distinguishes the two and routes accordingly.

## Rule-correctness disputes in detail

If the library says a rate is `X` and you believe it is `Y`, open a GitHub issue with the `rule-correctness` label. Use the issue template. The most important fields are:

- The Section / Sub-section / Clause; or the CBIC Notification number + date; or the CBDT Circular reference; or the Finance Act year + Section; or the ICAI Guidance Note number + year. Whichever is the primary source for the rule.
- The URL to that primary source on `incometaxindia.gov.in`, `cbic-gst.gov.in`, `indiacode.nic.in`, or the e-gazette.
- The Assessment Year (for ITR / TDS) or the effective date (for GST) the dispute applies to.
- The current library output and the output you believe is correct.
- The taxpayer-class (individual / firm / domestic company / etc.) the dispute applies to.

The maintainer reviews within 7 days. If the dispute is valid, the fix ships in the next patch release with the reporter credited (with permission) in the `CHANGELOG.md` entry. If the dispute is not valid (for example, the library's encoding is correct against the cited primary source and the dispute reflects a different rule that the reporter has confused with the disputed rule), the maintainer responds on the issue thread with the cross-reference; the issue is closed only after the reporter is satisfied with the explanation.

## Bug reports in detail

Use the GitHub issue template tagged `bug`. The minimum-viable bug report carries:

- The Node.js version (`node --version`).
- The package manager version (`pnpm --version` or equivalent).
- The package version (`pnpm list @elevatefinance-co/india-tax-rules`).
- The TypeScript version, if applicable (`tsc --version`).
- The operating system.
- A code sample that reproduces the failure. Five to ten lines are usually enough; if the bug requires a larger reproduction, link to a public repo.
- The expected behaviour and the observed behaviour.
- The error message or the unexpected output.

Reports without a reproduction are closed with a request for one. The library is small, the surface is precise, and a reproduction is almost always possible.

## Feature / missing-rule requests in detail

Use the GitHub issue template tagged `missing-rule` (for tax-law coverage the library does not yet encode) or `enhancement` (for library-side capabilities such as a new entry-point convention or a new helper). The request body should include:

- The Section / Finance Act / Rule / Notification / Circular the feature is about.
- The use case driving the request (a downstream platform that needs the rule, an internal CA-firm tool, a research project).
- Any primary-source links that motivate the request.
- An indication of whether the requester would like to contribute the PR or is asking the maintainer to take it on.

The maintainer triages on a best-effort basis. Pull requests adding the rule (with the citation and the fixture per `CONTRIBUTING.md`) ship faster than a request that asks the maintainer to write the encoding.

## Commercial support

The library is a community-supported open-source project. There is no paid support tier today. If your organisation depends on the library and would like a private Service Level Agreement (faster response, dedicated review for your PRs, audit-support engagement, custom-integration assistance), write to `support@elevatefinance.co` with subject `[COMMERCIAL]` and the maintainers will discuss what is possible.

A private SLA is not required to use the library; the public SLA above is the maintainers' standing commitment to every consumer.

## What this library is, and what it is not

For the avoidance of doubt:

- The library computes Indian tax math against publicly-available statutory rules. It does not file returns, give tax advice, give financial advice, or represent anyone before any tax authority.
- The maintainers are not Chartered Accountants and are not SEBI-registered investment advisers.
- Adopters cross-check outputs against the underlying primary sources before filing or advising.

See [`DISCLAIMER.md`](./DISCLAIMER.md) for the full not-legal-advice statement.

## Cross-references

- [README.md](./README.md) -- the audience-routed entry point.
- [CONTRIBUTING.md](./CONTRIBUTING.md) -- contribution flow and the citation-required rule.
- [GOVERNANCE.md](./GOVERNANCE.md) -- the maintainer model and decision process.
- [SECURITY.md](./SECURITY.md) -- responsible disclosure of rule-encoding errors with auditable consequences.
- [DISCLAIMER.md](./DISCLAIMER.md) -- the not-legal-advice statement.
- [CHANGELOG.md](./CHANGELOG.md) -- the rule-update history.
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) -- expected behaviour in community spaces.
- [docs/architecture.md](./docs/architecture.md) -- the library's architecture (work in progress).
- [docs/fixture-by-citation.md](./docs/fixture-by-citation.md) -- the citation-to-test navigation document (work in progress).
- [decisions/](./decisions/) -- the architecture decision records.
