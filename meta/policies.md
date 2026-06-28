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
- **Always commit AND `git push origin main`.** A change isn't shipped until it's
  pushed — an unpushed commit leaves the remote and every cloud routine (which
  clones from GitHub) stale. End every unit of work pushed. [[feedback-002-always-commit-and-push]]
- **One ticket = one commit** (code + tests + bookkeeping together; bookkeeping
  before committing). `main` has concurrent writers (cloud routines + local
  sessions): if `git push` is rejected, `git pull --rebase origin main`, re-run
  `/eval`, push again. [[feedback-003-one-commit-and-push-races]]
- When a design is `needs-input`, carve out any fully-decided, creative-input-free
  slice (usually the engineering/structural foundation) into its own actionable
  `todo` ticket so the loop keeps producing while human creative input is pending.
  [[feedback-001-carve-actionable-slices]]

## Game design

- Never guess on game feel, balance, or new content (species/mutations/items).
  Surface a `[NEEDS-INPUT]` instead. Humans provide creativity; Claude provides
  engineering. (See `docs/DESIGN_FRAMEWORK.md`.)

## Feedback log

- [[feedback-001-carve-actionable-slices]] — carve the decided engineering slice
  out of a `needs-input` design into an actionable ticket.
- [[feedback-002-always-commit-and-push]] — always commit and push to main; a
  change isn't shipped until it's on the remote.
- [[feedback-003-one-commit-and-push-races]] — one ticket = one commit; rebase-and-
  retry when a concurrent writer moved main.
