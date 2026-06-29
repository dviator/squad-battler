---
id: design-XXX-short-slug
status: draft # draft | needs-input | ready | decomposed
priority: 2 # 1 = high, 2 = normal, 3 = low
created: YYYY-MM-DD
updated: YYYY-MM-DD
feedback_refs: [] # meta/feedback/*.md ids that shaped this design
---

# Design: <Name>

## Summary

One paragraph, plain English. What is this and why does it exist?

## Player Experience

What does this feel like to play? What problem does it solve, or what new
experience does it create? (Required — see DESIGN_FRAMEWORK idea-evaluation.)

## Acceptance Criteria

Concrete, testable bullets written so passing/failing is unambiguous. These
become the basis for tickets and tests.

- [ ] ...
- [ ] ...

## Implementation Notes

Technical approach, affected systems (`src/core/*`, `src/data/*`), constraints,
balance targets to hit. Reference `docs/DESIGN_FRAMEWORK.md` targets where relevant.

## Out of Scope

Explicit exclusions to prevent scope creep.

## Open Questions

Things Claude must NOT decide autonomously (game feel, balance, new
species/mutations/items). If any exist, status is `needs-input` and this design
is surfaced to `meta/INBOX.md`. Resolve before moving to `ready`.
