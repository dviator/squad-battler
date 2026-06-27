---
name: decompose-design
description: Break a ready design doc into atomic, session-sized tickets with dependencies and verification notes. Each ticket must be completable in one bounded session. Use when a design is ready to be turned into work, or invoked by /dev-tick.
---

# /decompose-design — design → tickets

Turn one `ready` design into a set of atomic `todo` tickets. Pick the design from
`$ARGUMENTS` if given, else the highest-priority `ready` design.

## Steps

1. **Read** the design (`backlog/designs/<id>.md`). Confirm `status: ready` with no
   open questions. If it still has open questions, stop and route back to
   `/refine-idea` / `[NEEDS-INPUT]` — do not invent answers.

2. **Slice into tickets.** Each ticket = one bounded session (`size: S` or `M`;
   never `L`). Good slices:
   - A single mechanic/system change with its tests.
   - A data addition (species/mutation/item) with its tests.
   - A balance pass validated by `bun run test:balance`.
   Sequence with `depends_on` when one ticket must land before another (e.g. types
   before logic before balance).

3. **Write** each `backlog/tickets/<id>.md` from `backlog/tickets/TEMPLATE.md`:
   - `id: ticket-NNN-short-slug`, `parent: <design id>`, `status: todo`.
   - `size`, `priority`, `depends_on`.
   - **Acceptance Criteria** narrowed from the design (unambiguous pass/fail).
   - **Verification** — exactly which tests/sim numbers confirm it (feeds `/eval`).
   - Carry over `feedback_refs` from the design where relevant.

4. **Mark the design** `status: decomposed` and list its ticket ids in the design
   body so the verification trail is intact.

5. **Update** `BACKLOG.md` and `meta/STATE.md`.

Keep tickets minimal and honest about scope. If the design is too big to slice
into session-sized pieces cleanly, that's a signal the design needs splitting —
note it in INBOX rather than forcing oversized tickets.
