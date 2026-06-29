# Squad Battler — Autonomous Development Pipeline

How ideas become shipped, verified features with minimal human involvement. This
is the operational spec; `CLAUDE.md` has the quick reference.

This pipeline is single-user. Coordination is **GitHub Issues + Projects v2 board
#1** plus git — no Discord in the hot path. `meta/TRACKER.md` is the canonical
reference for board coordinates, Stage option ids, labels, queue→query mapping, and
`gh` recipes; this file is the loop spec. The user's role is **steering** (feedback)
and **deciding** the things only a human should (game feel, balance, new content).
The user is never an approval gate on merges.

It adapts PostHog's self-driving loop:
*collect → cluster signals → check memory → do work → review/ship → evaluate →
write back to memory.*

---

## The loop

```
type:idea issue            (unrefined thoughts — Stage Idea)
   │  /refine-idea          ← checks DESIGN_FRAMEWORK, pulls feedback via qmd
   ▼
type:design issue          (Stage Ready; long-form body in docs/designs/*.md)
   │  /decompose-design
   ▼
type:ticket issues         (atomic, session-sized — Stage Ready)
   │  /implement-ticket     ← code + tests → /eval → clean commit → merge to main
   ▼
Stage Shipped              (in playtest verification window — NOT done)
   │  /capture-feedback · /verify-queue   ← playtest feedback ties back to the issue
   ▼
Stage Verified  ──────►  issue closed (reason: completed)
```

The heartbeat `/dev-tick` reads the board, selects work, and dispatches the right
stage, looping implementation-first within a bounded session. The board (Stages +
assignees), issue timelines, and the commit log are the durable state — a cold
(cloud) session resumes by reading them; there is no `STATE.md`.

### Signals (what to work on)

- The board itself (open issues by `priority:`; actionable = Stage `Ready`).
- Balance gaps: `bun run test:balance` soft targets out of range
  (`docs/DESIGN_FRAMEWORK.md`).
- Curated feedback in `meta/feedback/` (steering) + playtest comments on issues.

### Evaluation (how we know it worked)

1. `/eval` hard gates: `typecheck`, `test`, `test:balance` sanity — block merge.
2. `test:balance` soft targets — advisory drift signal.
3. **Human playtest** after release — the real signal for game feel/balance. Lands
   on the shipping ticket via `/capture-feedback`.

---

## Corpus reference

Work items are GitHub issues on board #1; long-form knowledge stays markdown. See
`meta/TRACKER.md` for board coordinates, Stage ids, labels, and the queue→query map.

| Where | Role |
|---|---|
| `type:idea` issue | Captured thought (Stage `Idea`); whole idea in the body. Refines to a design or closes not-planned. |
| `type:design` issue | Thin tracker (Stage `Designing` → `Needs-input` → `Ready`); long-form body in `docs/designs/*.md`. |
| `type:ticket` issue | Atomic work (Stage `Ready` → `In-progress` → `Blocked`/`Shipped` → `Verified`/`Reverted`). |
| `docs/designs/*.md` | Retrieval-searchable design bodies, linked from their design issue. |
| `meta/policies.md` | Always-loaded steering lessons |
| `meta/feedback/*.md` | Curated steering-feedback corpus |
| `meta/qmd-setup.md` | Retrieval setup |

Queues are gh queries / board views (see `meta/TRACKER.md`), not files. `meta/STATE.md`,
`INBOX.md`, `VERIFY.md`, `BACKLOG.md`, and the `backlog/` tree are retired.
Templates: `meta/feedback/TEMPLATE.md` (issue bodies follow the shapes in the skills).

---

## Ticket lifecycle (why "done" ≠ "stop")

A ticket issue does not close at merge. It moves to Stage **`Shipped`** — merged to
main and open for playtest. Human playtest feedback is recorded as a comment on the
issue (the verification trail) via `/capture-feedback` or `/verify-queue`. Positive
→ Stage **`Verified`** and `gh issue close -r completed`. Negative → a linked
follow-up `type:ticket`/`type:idea` issue (`Refs #N`), original left `Shipped`.
History is never silently rewritten; the trail stays on the issue timeline.

---

## Release / revert

One ticket = one clean commit on `main`:

```
feat(<area>): <ticket title>

Why: <player/design rationale>
Refs #<ticket-issue>   (design: #<design-issue> · docs/designs/<id>.md)
Eval: typecheck ✓ test ✓ balance ✓ (<key sim numbers>)
Feedback applied: <feedback ids or none>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

Reference the issue with `Refs #N` (or `Part of #N`) — **never** `Fixes`/`Closes`,
which auto-close the issue at merge; an issue closes only at Stage `Verified`.

Work happens on a short-lived **feature branch** (see Branch & worktree workflow
below), never directly on `main` — `main` only ever receives a finished,
eval-passing unit via merge + `git push origin main`. Work isn't shipped until
it's on the remote (the cloud routines clone from GitHub). One ticket = **one
commit** (code + tests + bookkeeping together). No PRs in the hot path. The
pre-commit hook (`.claude/hooks/pre-commit-check.sh`) plus `/eval` are the gate.
`/eval` runs before every push, so a hard failure shouldn't reach `main`; if one
ever slips through, revert that commit manually. Everything else is fix-forward.

### Branch & worktree workflow

Every unit of work runs on its own feature branch so concurrent writers (cloud
routines + local sessions) integrate through one gate — the merge to `main` —
instead of racing on shared commits. Keeps the one-commit/linear/revert-safe
properties intact.

1. **Isolated checkout + branch off latest main.**
   - *Local session:* use a worktree so parallel sessions never share a checkout —
     `git fetch origin && git worktree add -b <type>/issue-<n>-<slug> ../squad-battler-worktrees/issue-<n>-<slug> origin/main`, then `cd` into it.
   - *Cloud routine:* the ephemeral clone is already an isolated checkout — just
     branch: `git fetch origin && git checkout -b <type>/issue-<n>-<slug> origin/main`.
2. **Do all the work on the branch** — code + tests + bookkeeping — then run `/eval`.
3. **One commit** on the branch (structured message above).
4. **Integrate linearly:** `git fetch origin && git rebase origin/main` (re-run
   `/eval` if the rebase pulled in changes), then
   `git checkout main && git merge --ff-only <branch> && git push origin main`.
   If the push is still rejected, repeat the rebase until
   `git log origin/main..HEAD` is empty.
5. **Clean up:** `git worktree remove <dir>` (local) and delete the merged branch.

Branch naming: `<type>/issue-<n>-<slug>` where `<type>` matches the commit
(`feat`/`fix`/`chore`/`docs`), e.g. `feat/issue-12-floor-structure-foundation`.

`scripts/worktree-agent.sh` is a separate tool for *manually launching a parallel
headless agent* in a worktree — not the in-session flow above.

---

## Scheduled routines (cloud cron via `/schedule`)

| Routine | Cadence (default) | Fires |
|---|---|---|
| dev-tick | daily | `/dev-tick` — one unit of work |
| refactor | weekly | drift/duplication cleanup, gated by `/eval` |
| doc-sync | every ~5 ships (surfaced by `/dev-tick`) | sync design docs + archive sweep |

Cadence is tunable. Keep total scheduled load within the Claude subscription
budget — each fire is one bounded session by design.

---

## Notifications

Review queues are gh queries (see `meta/TRACKER.md`): shipped tickets awaiting
playtest = open `type:ticket` at Stage `Shipped` (review on your cadence, no push,
via `/verify-queue`); decisions required = `gh issue list --label needs-input`
(push). Clear a needs-input flag by removing the label / advancing its Stage; the
issue timeline holds the durable record.

---

## Autonomy boundaries

Humans provide creativity; Claude provides engineering. Claude decides
implementation approach, structure, tests, and balance tuning toward
`DESIGN_FRAMEWORK.md` targets. Claude asks (via a `needs-input` issue + push) on new
species/mutations/items, game-feel calls, and anything touching the open design
questions in `DESIGN_FRAMEWORK.md`. See `CLAUDE.md` → Autonomy Boundaries.
