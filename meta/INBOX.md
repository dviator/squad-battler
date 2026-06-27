# INBOX — your review queue

The one place to check. Entries the autonomous loop produces for you, newest
first. `[NEEDS-INPUT]` and `[REGRESSION]` also fire a push notification; `[SHIPPED]`
does not (review on your own cadence).

Legend:

- `[SHIPPED]` — merged to main, now in its playtest verification window. Play it,
  then give feedback via `/capture-feedback` (positive → ticket `verified`,
  negative → follow-up ticket).
- `[NEEDS-INPUT]` — a design/idea is blocked on a decision only you can make
  (game feel, balance, new content). The loop will not guess.
- `[REGRESSION]` — a hard gate failed on main after merge; the loop reverted.

Clear an entry by deleting it once handled (the underlying ticket/design carries
the durable record).

---

_(empty)_
