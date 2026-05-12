---
name: Missing rule / new feature
about: The library does not yet implement a rule you need (or a tooling capability you want).
title: '[MISSING] '
labels: missing-rule, enhancement
assignees: ''
---

## What is missing

One sentence: which rule, AY, or capability is not yet in the
library.

## Primary source (if it is a rule)

- Section / Rule / Circular / Finance Act:
- URL to the primary source:
- Effective Assessment Year:

## Use case

Why do you need this. A concrete user story is more persuasive than
"would be nice to have".

## Suggested API shape (optional)

If you have an opinion on what the function signature should be, sketch it here. Maintainer may push back on the exact shape; the suggestion still helps.

```ts
// e.g.
export function computeSomethingNew({ ... }, ay: AssessmentYear): ComputationResult<number>;
```

## Are you offering to implement it

- [ ] Yes, I plan to open a pull request.
- [ ] No, I am opening this as a request only.

If yes, please read `CONTRIBUTING.md` first - the citation-first rule and the coverage gate are non-negotiable.
