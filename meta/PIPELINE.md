# Squad Battler — Autonomous Development Pipeline

How ideas become shipped, verified features with minimal human involvement. This
is the operational spec; `CLAUDE.md` has the quick reference.

This pipeline is single-user. All coordination is local files + git — no Discord
in the hot path. The user's role is **steering** (feedback) and **deciding** the
things only a human should (game feel, balance, new content). The user is never an
approval gate on merges.

It adapts PostHog's self-driving loop:
*collect → cluster signals → check memory → do work → review/ship → evaluate →
write back to memory.*

---

## The loop

```
backlog/ideas/      (unrefined thoughts — signals)
   │  /refine-idea          ← checks DESIGN_FRAMEWORK, pulls feedback via qmd
   ▼
backlog/designs/    (ready design docs)
   │  /decompose-design
   ▼
backlog/tickets/    (atomic, session-sized work)
   │  /implement-ticket     ← code + tests → /eval → clean commit → merge to main
   ▼
shipped             (in playtest verification window — NOT done)
   │  /capture-feedback     ← playtest feedback ties back to the ticket
   ▼
verified  ──────►  backlog/archive/   (swept during doc-sync)
```

The heartbeat `/dev-tick` runs the selection + dispatch, **one stage per fire**,
so each scheduled run is bounded and fits the usage budget. Memory in
`meta/STATE.md` lets a cold (cloud) session resume with full continuity.

### Signals (what to work on)

- The backlog itself (ideas, ready designs, todo tickets).
- Balance gaps: `bun run test:balance` soft targets out of range
  (`docs/DESIGN_FRAMEWORK.md`).
- Curated feedback in `meta/feedback/` (steering + playtest).

### Evaluation (how we know it worked)

1. `/eval` hard gates: `typecheck`, `test`, `test:balance` sanity — block merge.
2. `test:balance` soft targets — advisory drift signal.
3. **Human playtest** after release — the real signal for game feel/balance. Lands
   on the shipping ticket via `/capture-feedback`.

---

## Corpus reference

| Path | Role |
|---|---|
| `backlog/ideas/*.md` | Lightweight scratchpad, no status. Graduates to a design or is discarded. |
| `backlog/designs/*.md` | `draft` → `needs-input` → `ready` → `decomposed` |
| `backlog/tickets/*.md` | `todo` → `in-progress` → `blocked`/`shipped` → `verified`/`reverted` |
| `backlog/archive/YYYY-QN/` | Verified tickets + done designs |
| `backlog/BACKLOG.md` | Generated prioritized index |
| `meta/STATE.md` | Memory: in-flight, feature count, tick log |
| `meta/INBOX.md` | Human review queue |
| `meta/policies.md` | Always-loaded steering lessons |
| `meta/feedback/*.md` | Curated feedback corpus |
| `meta/qmd-setup.md` | Retrieval setup |

Templates: `backlog/designs/TEMPLATE.md`, `backlog/tickets/TEMPLATE.md`,
`meta/feedback/TEMPLATE.md`.

---

## Ticket lifecycle (why "done" ≠ "stop")

A ticket does not close at merge. It becomes **`shipped`** — merged to main and
open for playtest. Human playtest feedback is captured as
`meta/feedback/*.md { kind: playtest, ticket: <id> }`, written into the ticket's
`feedback_refs`. Positive feedback → **`verified`** (archivable). Negative feedback
→ a follow-up ticket or reopen. History is never silently rewritten; the
verification trail stays in the ticket.

---

## Release / revert

One ticket = one clean commit on `main`:

```
feat(<area>): <ticket title>

Why: <player/design rationale>
Design: backlog/designs/<id>.md   Ticket: backlog/tickets/<id>.md
Eval: typecheck ✓ test ✓ balance ✓ (<key sim numbers>)
Feedback applied: <feedback ids or none>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

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
     `git fetch origin && git worktree add -b <type>/<ticket-id> ../squad-battler-worktrees/<ticket-id> origin/main`, then `cd` into it.
   - *Cloud routine:* the ephemeral clone is already an isolated checkout — just
     branch: `git fetch origin && git checkout -b <type>/<ticket-id> origin/main`.
2. **Do all the work on the branch** — code + tests + bookkeeping — then run `/eval`.
3. **One commit** on the branch (structured message above).
4. **Integrate linearly:** `git fetch origin && git rebase origin/main` (re-run
   `/eval` if the rebase pulled in changes), then
   `git checkout main && git merge --ff-only <branch> && git push origin main`.
   If the push is still rejected, repeat the rebase until
   `git log origin/main..HEAD` is empty.
5. **Clean up:** `git worktree remove <dir>` (local) and delete the merged branch.

Branch naming: `<type>/<ticket-id>` where `<type>` matches the commit
(`feat`/`fix`/`chore`/`docs`), e.g. `feat/ticket-005-floor-structure-foundation`.

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

`meta/INBOX.md` is the single place to review. `[SHIPPED]` (review on your cadence,
no push), `[NEEDS-INPUT]` (decision required — push). Clear an entry by deleting
it; the ticket/design holds the durable record.

---

## Autonomy boundaries

Humans provide creativity; Claude provides engineering. Claude decides
implementation approach, structure, tests, and balance tuning toward
`DESIGN_FRAMEWORK.md` targets. Claude asks (via `[NEEDS-INPUT]`) on new
species/mutations/items, game-feel calls, and anything touching the open design
questions in `DESIGN_FRAMEWORK.md`. See `CLAUDE.md` → Autonomy Boundaries.
