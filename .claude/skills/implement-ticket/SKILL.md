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

2. **Load context.** Read the ticket + its parent design. Read `meta/policies.md`
   for relevant feedback/steering. Pull relevant prior context:
   - **In-session (MCP available):** call `mcp__plugin_qmd_qmd__query` with
     `collections: ["meta","backlog","docs"]` — use lex + vec sub-queries.
   - **CLI/cloud fallback:** `scripts/meta-context.sh "<ticket topic>"`
   Honor the repo conventions in `CLAUDE.md` (layer separation, enums, Zod, tests required).

3. **Implement.** Work directly on `main` for the single heartbeat (the eval gate
   below + the pre-commit hook are the safety net). For parallel/manual work use
   `scripts/worktree-agent.sh`. Write the code **and its tests together** — tests
   are required, no exceptions. Follow the acceptance criteria exactly.

4. **Run the eval gate.** Invoke `/eval`. It runs `typecheck` + `test` +
   `test:balance`. **Do not commit if any hard gate fails.** On failure: fix
   forward within budget; if you can't resolve it this fire, set the ticket
   `status: blocked` with a note on why, update STATE, and stop.

5. **Do the bookkeeping (before committing).** Make all the non-code file changes
   now so they land in the **same single commit** as the code:
   - Set the ticket `status: shipped` (NOT closed — it stays live for playtest).
   - Add a `[SHIPPED]` entry to `meta/INBOX.md` inviting playtest.
   - Bump `features_shipped` in `meta/STATE.md`, clear `in_flight`, prepend a
     tick-log line, regenerate `backlog/BACKLOG.md`.

6. **Commit — exactly ONE clean commit** (code + tests + bookkeeping together).
   One ticket = one commit; do **not** split code and bookkeeping into two commits
   (the post-merge-eval revert path reverts a single commit — a split leaves
   bookkeeping claiming "shipped" after a code revert). Structured message (see
   `meta/PIPELINE.md`):

   ```
   feat(<area>): <ticket title>

   Why: <player/design rationale>
   Design: backlog/designs/<id>.md   Ticket: backlog/tickets/<id>.md
   Eval: typecheck ✓ test ✓ balance ✓ (<key sim numbers>)
   Feedback applied: <feedback ids or none>

   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

   The commit's `Ticket:` line is the durable link back — do not store the merge
   sha in the ticket (`git log --oneline -- backlog/tickets/<id>.md` recovers it).

7. **Push — and handle a moved remote.** `git push origin main`. Work isn't
   shipped until it's pushed. If the push is **rejected** (another writer — a
   concurrent local session or cloud routine — advanced `main` during this run):
   `git pull --rebase origin main`, re-run `/eval` (the rebase may have pulled in
   conflicting work), regenerate `BACKLOG.md` if it drifted, then push again.
   Repeat until the push succeeds and `git log origin/main..HEAD` is empty.

Then **stop**. The ticket is verified later via `/capture-feedback` once the user
playtests it.
