---
name: implement-ticket
description: Implement one atomic ticket issue end-to-end — set it In-progress, write code and tests, pass the eval gate, commit with a full-context message referencing the issue, merge to main, then set Stage Shipped to open the playtest verification window. Use when implementing a ticket, or invoked by /dev-tick. Does one ticket then stops.
---

# /implement-ticket — ticket → shipped code

Implement exactly one `type:ticket` issue, ship it cleanly, then stop. Pick the
ticket from `$ARGUMENTS` (an issue number) if given, else the highest-value
actionable ticket at Stage `Ready` (every "Blocked by #m" is `Shipped`/`Verified`).

`meta/TRACKER.md` is canonical for board coordinates, Stage ids, labels, and `gh`
recipes; source the `set_stage`/`stage_id` helpers from it. Headless runs need
`GH_TOKEN` (repo + project scope).

## Steps

1. **Claim + branch off latest main.** Never work directly on `main`. Confirm the
   ticket is `size:S|M` — if `size:L`, stop and route to `/decompose-design`. Claim
   it, then start a fresh branch off `origin/main` (see "Branch & worktree
   workflow" in `meta/PIPELINE.md`):
   ```bash
   set_stage <n> In-progress
   gh issue edit <n> --add-assignee @me
   ```
   - *Local:* `git fetch origin && git worktree add -b feat/issue-<n>-<slug> ../squad-battler-worktrees/issue-<n>-<slug> origin/main`, then `cd` in.
   - *Cloud (ephemeral clone, already isolated):* `git fetch origin && git checkout -b feat/issue-<n>-<slug> origin/main`.

2. **Load context.** `gh issue view <n>` (the ticket) and its parent design issue +
   `docs/designs/<id>.md`. Read `meta/policies.md` for relevant steering. Pull prior
   context:
   - **In-session (MCP available):** call `mcp__plugin_qmd_qmd__query` with
     `collections: ["meta","docs"]` — use lex + vec sub-queries.
   - **CLI/cloud fallback:** `scripts/meta-context.sh "<ticket topic>"`
   Honor the repo conventions in `CLAUDE.md` (layer separation, enums, Zod, tests required).

3. **Implement (on the branch).** Write the code **and its tests together** —
   tests are required, no exceptions. Follow the acceptance criteria exactly.

4. **Run the eval gate.** Invoke `/eval`. It runs `typecheck` + `test` +
   `test:balance`. **Do not commit if any hard gate fails.** On failure: fix
   forward within budget; if you can't resolve it this fire, `set_stage <n> Blocked`
   with a `gh issue comment` on why, and stop.

5. **Commit on the branch — exactly ONE clean commit** (code + tests together).
   One ticket = one commit. Structured message (see `meta/PIPELINE.md`), with the
   issue ref as the durable link back:

   ```
   feat(<area>): <ticket title>

   Why: <player/design rationale>
   Refs #<n>   (design: #<design-n> · docs/designs/<id>.md)
   Eval: typecheck ✓ test ✓ balance ✓ (<key sim numbers>)
   Feedback applied: <feedback ids or none>

   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

   Use `Refs #<n>` (or `Part of #<n>`) — **never** `Fixes`/`Closes`, which would
   auto-close the issue at merge. Shipped ≠ done.

6. **Integrate to main + push.** Bring the branch up to date and merge linearly:
   `git fetch origin && git rebase origin/main` (a concurrent writer may have moved
   main — if the rebase pulls in changes, re-run `/eval`), then `git checkout main
   && git merge --ff-only feat/issue-<n>-<slug> && git push origin main`. If the
   push is rejected, repeat the rebase until it lands and `git log
   origin/main..HEAD` is empty. Work isn't shipped until it's pushed.

7. **Open the playtest window.** After the push lands:
   ```bash
   set_stage <n> Shipped
   gh issue comment <n> --body "shipped $(git rev-parse --short HEAD)"
   ```
   **Do not close the issue** — Stage `Shipped` *is* the playtest verification
   window. It closes only at `Verified`, via `/capture-feedback` / `/verify-queue`.

8. **Clean up.** Local: `git worktree remove <dir>` and `git branch -d
   feat/issue-<n>-<slug>`. Cloud: the ephemeral clone is discarded.

Then **stop**. The ticket is verified later once Dan playtests it.
