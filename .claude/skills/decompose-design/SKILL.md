---
name: decompose-design
description: Break a Ready type:design issue into atomic, session-sized type:ticket issues with dependencies and verification notes, created via gh. Each ticket must be completable in one bounded session. Use when a design is ready to be turned into work, or invoked by /dev-tick.
---

# /decompose-design — design → tickets

Turn one `Ready` `type:design` issue into a set of atomic `type:ticket` issues.
Pick the design from `$ARGUMENTS` (an issue number) if given, else the
highest-priority `Ready` design from the board.

`meta/TRACKER.md` is canonical for board coordinates, Stage ids, labels, and `gh`
recipes; source the `set_stage`/`stage_id` helpers from it.

## Steps

1. **Read** the design: `gh issue view <design-n>` plus its `docs/designs/<id>.md`
   body. Confirm Stage `Ready` with no open questions. If it still has open
   questions (or carries `needs-input`), stop and route back to `/refine-idea` — do
   not invent answers.

2. **Slice into tickets.** Each ticket = one bounded session (`size:S` or `size:M`;
   never `size:L`). Good slices:
   - A single mechanic/system change with its tests.
   - A data addition (species/mutation/item) with its tests.
   - A balance pass validated by `bun run test:balance`.
   Sequence with dependencies when one ticket must land before another (e.g. types
   before logic before balance).

3. **Create** each ticket issue via `gh`, with the whole ticket in the body:
   ```bash
   gh issue create --title "<ticket title>" \
     --label "type:ticket,priority:N,size:X" --body "$(cat <<'EOF'
   Part of #<design-n>   (Refs #<design-n>)

   ## Acceptance Criteria
   <unambiguous pass/fail, narrowed from the design>

   ## Verification
   <exactly which tests / sim numbers confirm it — feeds /eval>

   ## Playtest
   <what Dan should look for after it ships>

   Blocked by #<m>   (omit if none)
   Feedback: <feedback ids or none>
   EOF
   )"
   ```
   Then place it on the board: `set_stage <ticket-n> Ready` — or `set_stage
   <ticket-n> Blocked` if it has an unmet "Blocked by #m" (note the blocker in the
   body). Express every dependency as a "Blocked by #m" line.

4. **Record the trail.** Comment the created ticket numbers back on the design
   issue (`gh issue comment <design-n> --body "decomposed into #a #b #c"`) so the
   verification trail is intact. The design issue stays open until its tickets are
   verified.

Keep tickets minimal and honest about scope. If the design can't be sliced into
session-sized pieces cleanly, that's a signal it needs splitting — set the design
`Needs-input` (+ `needs-input` label) noting why, rather than forcing oversized
tickets.
