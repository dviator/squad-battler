# Policies — distilled steering (always loaded)

Short, durable lessons learned from the user's feedback. This file is loaded into
every autonomous session, so keep it tight — one line per lesson, link to the
full feedback file for context. `/capture-feedback` maintains this.

When a lesson here conflicts with a one-off instruction in a ticket, the ticket
wins for that ticket; update this file only for durable, repeatable guidance.

## How to work

- Do exactly one bounded unit per `/dev-tick`, then stop and persist state. Never
  chain multiple tickets in one fire — it blows the usage budget.
- Merge directly to main behind the `/eval` gate. No PRs. Fix-forward; revert only
  on hard-gate failure.

## Game design

- Never guess on game feel, balance, or new content (species/mutations/items).
  Surface a `[NEEDS-INPUT]` instead. Humans provide creativity; Claude provides
  engineering. (See `docs/DESIGN_FRAMEWORK.md`.)

## Feedback log

_(none yet — `/capture-feedback` links entries here as `[[feedback-id]]`)_
