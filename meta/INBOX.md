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

### [SHIPPED] 2026-06-27 · ticket-002 UI design-system foundation

The web UI is now the Clinical Bright Lab look — light paper bg, lab-teal/bio-green
accents, semantic design tokens, all 5 views swept off the old dark zinc theme.
Battle is still top/bottom with emoji portraits (that's ticket-003 specimen cards +
ticket-004 left↔right face-off, coming next). Have a look when convenient; feedback
on the palette/feel via `/capture-feedback`.

### [SHIPPED] 2026-06-27 · ticket-001 World 1 difficulty pass

World 1 was a walkover (starter squad beat the boss ~94%). Buffed Goob-family
attack ×1.9; sim now hits all balance targets (mini-boss reach 69%, boss kill 7.5%)
and avg run depth dropped from ~25 to ~6 encounters.

**Please playtest a couple of runs** and confirm it feels tense rather than just
hitting the numbers — the buffed boss's Crushing Weight can now one-shot a unit, so
that's the main feel risk. Then run `/capture-feedback` (positive → ticket
`verified`; negative → I'll spawn a follow-up). Commit: see git log for ticket-001.
