---
name: implement-ticket
description: Implement one atomic ticket end-to-end — write code and tests, pass the eval gate, commit with a full-context message, merge to main, and open the ticket's playtest verification window. Use when implementing a ticket, or invoked by /dev-tick. Does one ticket then stops.
---

# /implement-ticket — ticket → shipped code

Implement exactly one ticket, ship it cleanly, then stop. Pick the ticket from
`$ARGUMENTS` if given, else the highest-value actionable `todo` ticket (all
`depends_on` `shipped`/`verified`).

## Steps

1. **Claim it.** Set the ticket `status: in-progress`, update `meta/STATE.md`
   `in_flight`. Confirm it's `size: S|M` — if `L`, stop and route to
   `/decompose-design`.

2. **Load context.** Read the ticket + its parent design. Run
   `scripts/meta-context.sh "<ticket topic>"` and read `meta/policies.md` for
   relevant feedback/steering. Honor the repo conventions in `CLAUDE.md` (layer
   separation, enums, Zod, tests required).

3. **Implement.** Work directly on `main` for the single heartbeat (the eval gate
   below + the pre-commit hook are the safety net). For parallel/manual work use
   `scripts/worktree-agent.sh`. Write the code **and its tests together** — tests
   are required, no exceptions. Follow the acceptance criteria exactly.

4. **Run the eval gate.** Invoke `/eval`. It runs `typecheck` + `test` +
   `test:balance`. **Do not commit if any hard gate fails.** On failure: fix
   forward within budget; if you can't resolve it this fire, set the ticket
   `status: blocked` with a note on why, update STATE, and stop.

5. **Commit (one clean commit).** Use the structured message (see
   `meta/PIPELINE.md`):

   ```
   feat(<area>): <ticket title>

   Why: <player/design rationale>
   Design: backlog/designs/<id>.md   Ticket: backlog/tickets/<id>.md
   Eval: typecheck ✓ test ✓ balance ✓ (<key sim numbers>)
   Feedback applied: <feedback ids or none>

   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

   Include the ticket/design file updates in the same commit. Merge to `main`
   directly (no PR). The commit's `Ticket:` line is the durable link back — do not
   try to store the merge sha in the ticket (it can't be known before the commit
   exists; `git log --oneline -- backlog/tickets/<id>.md` recovers it).

6. **Open the verification window.** Set the ticket `status: shipped` (NOT closed —
   it stays live for playtest feedback). Add a `[SHIPPED]` entry to `meta/INBOX.md`
   inviting playtest (no push — routine ship). Bump `features_shipped` in
   `meta/STATE.md`, clear `in_flight`, log the tick, regenerate `BACKLOG.md`.

Then **stop**. The ticket is verified later via `/capture-feedback` once the user
playtests it.
