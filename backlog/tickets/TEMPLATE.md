---
id: ticket-XXX-short-slug
status: todo # todo | in-progress | blocked | shipped | verified | reverted
priority: 2 # 1 = high, 2 = normal, 3 = low
size: M # S | M | L  (M ≈ one session; L must be decomposed first)
parent: design-XXX-short-slug
depends_on: [] # ticket ids that must be shipped/verified first
feedback_refs: [] # meta/feedback/*.md ids — incl. playtest feedback on this ticket
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

<!-- The shipping commit links back via its `Ticket:` line; find it with
`git log --oneline -- backlog/tickets/<this-file>`. Don't store a self-referential
sha here — it can't be known before the commit exists. -->

# Ticket: <Name>

## Goal

One sentence: what this ticket delivers. Must be completable in a single bounded
session. If it isn't, it's `size: L` and needs decomposing.

## Scope

- Files likely touched: `src/...`
- Tests to add: `tests/...`

## Acceptance Criteria

Inherited/narrowed from the parent design. Unambiguous pass/fail.

- [ ] ...

## Verification

How `/eval` confirms this: which tests, which sim numbers from
`bun run test:balance` should hold.

## Notes

Anything the implementer needs. Once `shipped`, append playtest findings here and
keep `feedback_refs` in sync — a ticket stays live through its verification window.
