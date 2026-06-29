# Squad Battler — Claude Code Instructions

## Project Overview

A genetic roguelike auto-battler. Players escape a corporate science lab by breeding creatures across runs, combining genetics/mutations with roguelike progression. The game is currently a CLI simulation engine; a web frontend is the next major milestone.

**Tech stack:** Bun runtime · TypeScript (strict) · Vitest + fast-check · Biome (lint/format) · Zod schemas

---

## Architecture

Three strictly separated layers:

| Layer | Location | Rule |
|---|---|---|
| **Core** | `src/core/` | Pure functions, zero side effects, fully deterministic |
| **Data** | `src/data/` | Declarative configs — species, mutations, items |
| **Shell** | `src/cli/`, `src/sim/` | I/O, rendering, orchestration |

Never import shell into core. Never import core directly from tests without going through the public API if the API covers it.

---

## Coding Conventions

- **Enums** — use existing enums directly in type definitions (`Position`, `TargetType`, `BattleEventType`, `GeneticGrade`, `LifeStage`, `ItemCategory`, `ConsumableEffect`, `EquipmentEffect`). Add new enum values before reaching for strings.
- **Types** — define with Zod schemas, infer with `z.infer<typeof Schema>`. New data structures follow this pattern.
- **Naming** — `camelCase` functions/variables, `PascalCase` types/enums/classes, `SCREAMING_SNAKE` for exported data constants (`BEAR`, `ALL_MUTATIONS`)
- **Comments** — only where logic is non-obvious. Do not restate what the code says.
- **Path alias** — `@/*` maps to `src/`. Use it for imports across layers.
- **Line width** — 100 chars (enforced by Biome). Double quotes, trailing commas, always semicolons.
- **Responsive** — the web layer is mobile-first. Follow `docs/MOBILE_STANDARDS.md`; `bun run check:responsive` gates commits against mobile-layout regressions.

---

## File Structure

| What | Where |
|---|---|
| New species | `src/data/species.ts` |
| New mutations | `src/data/mutations.ts` |
| New shop items | `src/data/` |
| New mechanics | `src/core/` (new file or extend existing) |
| New tests | `tests/*.test.ts` |
| Ideas / designs / tickets | GitHub Issues on Projects v2 board #1 → see `meta/TRACKER.md` |
| Long-form design bodies | `docs/designs/*.md` (linked from their `type:design` issue) |

---

## Testing

- Tests are **required** alongside every implementation — no exceptions.
- Use Vitest for unit/integration tests. Use fast-check for property-based tests on probabilistic systems (genetics, RNG).
- Tests **must pass** before any commit. This is enforced by the pre-commit hook.
- Simulations (`bun run test:sim`) validate game feel and balance — run after any balance or mechanic change.

**Scripts:**
```
bun run test          # Run all tests
bun run test:watch    # Watch mode
bun run test:sim      # Battle simulations
bun run typecheck     # TypeScript strict check
bun run lint          # Biome lint + format check
bun run lint:fix      # Biome auto-fix
bun run dev           # Run main entry point
```

---

## Quality Hooks (pre-configured in `.claude/settings.json`)

- **PostToolUse (Edit|Write)** — runs `biome check --write` on every edited file automatically
- **PreToolUse (Bash → git commit)** — blocks commit if `typecheck` or `test` fails
- **Stop** — prompts review for architecture violations, unnecessary complexity, trivial comments, missing enum usage

---

## Pipeline Behavior

This repo runs an **autonomous development pipeline** operated through GitHub
Issues, git, skills, and scheduled cloud routines. Work items are issues on
**Projects v2 board #1**; `meta/TRACKER.md` is the canonical reference for board
coordinates, Stage ids, labels, and `gh` recipes. Full loop details in
`meta/PIPELINE.md`.

### The loop

```
idea → design → ticket → code → ship → playtest-verify → archive
```

Each stage is a skill. A scheduled heartbeat (`/dev-tick`) reads the board and
advances the highest-value actionable item, looping implementation-first within a
bounded session — keeping usage bounded and progress legible.

| Stage skill | Does |
|---|---|
| `/dev-tick` | Heartbeat: reads the board, selects work, dispatches the right stage, loops |
| `/refine-idea` | `type:idea` issue → `Ready` design (issue + `docs/designs/*.md`), or `Needs-input` |
| `/decompose-design` | `Ready` design issue → atomic, session-sized `type:ticket` issues |
| `/implement-ticket` | ticket → code+tests → `/eval` → clean commit → merge → Stage `Shipped` |
| `/eval` | verification gate: `typecheck` + `test` + `test:balance` |
| `/verify-queue` | walks `Shipped` tickets + their playtest criteria, applies verdicts |
| `/capture-feedback` | feedback → policies corpus; playtest feedback verifies/forks its issue |

### Where work and memory live

Work items are **GitHub issues** typed by label (`type:idea` / `type:design` /
`type:ticket`) with a `Stage` single-select on **board #1** (Idea → Designing →
Needs-input → Ready → In-progress → Shipped → Verified, plus Blocked/Reverted;
closed = Verified). `meta/TRACKER.md` is canonical. Queues are gh queries / board
views, not files:

| Queue | Now |
|---|---|
| Backlog (prioritized) | `gh issue list --state open` by `priority:` label / board view |
| Verify queue | open `type:ticket` issues at Stage `Shipped` (`/verify-queue`) |
| Needs-your-input | `gh issue list --label needs-input` |
| In-flight / history | Stage `In-progress` + assignee; commit log + issue timelines |

Long-form design bodies live in `docs/designs/*.md` (linked from their `type:design`
issue). Feedback corpus (`meta/feedback/`) and steering lessons (`meta/policies.md`)
stay markdown. `meta/STATE.md`, `INBOX.md`, `VERIFY.md`, `BACKLOG.md` are retired.

Context retrieval: `scripts/meta-context.sh "<query>"` (qmd primary, grep/rg
fallback). See `meta/qmd-setup.md`.

### Merge & release policy
- **Work on a feature branch, never directly on `main`** (local: in a `git
  worktree`; cloud: a branch in the ephemeral clone). `/eval` on the branch, then
  `rebase origin/main` → `merge --ff-only` → push. The merge to main is the single
  integration gate for concurrent writers. No PRs in the hot path. Full recipe:
  "Branch & worktree workflow" in `meta/PIPELINE.md`.
- One ticket = one clean commit with the structured message in `meta/PIPELINE.md`.
  Commits reference their issue with `Refs #N` — **never** `Fixes/Closes #N` (no
  auto-close at merge; shipped ≠ done).
- Fix-forward. `/eval` before every push is the integration gate, so a hard
  failure shouldn't reach `main`; if one ever slips through, revert that commit
  manually. Your feedback steers, never approval-gates.
- A ticket is **Stage `Shipped`, not done, at merge** — it stays live through a
  playtest verification window, then becomes `Verified` and the issue closes.

### Notifications
- Your review queue is `gh issue list --label needs-input`.
- `PushNotification` fires only for a `needs-input` issue (a blocked decision) —
  never for routine ships.

### Handling Ambiguity
- **Never guess on game feel, balance, or design decisions.** Write the design with
  its Open Questions filled, add the `needs-input` label, set Stage `Needs-input`,
  and wait. (See Autonomy Boundaries below and `docs/DESIGN_FRAMEWORK.md`.)
- Use placeholders (`TODO:` + explanation) only when technically necessary to
  unblock compilation.

---

## Autonomy Boundaries

**Claude decides autonomously:**
- Implementation approach for a given design doc
- Code structure, file organization, refactoring
- Stat rebalancing when needed to hit simulation targets defined in `docs/DESIGN_FRAMEWORK.md`
- Which tests to write

**Claude asks the user (via a `needs-input` issue + push):**
- New species concepts, attack patterns, thematic names
- New mutation ideas
- Game feel decisions ("does this feel too powerful?")
- Anything not derivable from an existing design doc
- Any placeholder that meaningfully affects gameplay

**Rule:** Humans provide the creativity. Claude provides the engineering.

---

## Worktree Usage

**Default for every unit of work** (not just parallel): each session works in its
own worktree on a feature branch, then merges to `main`. This isolates concurrent
writers so they integrate through one gate. Full recipe: "Branch & worktree
workflow" in `meta/PIPELINE.md`.

```bash
# Start a unit of work in an isolated worktree + branch off latest main
git fetch origin
git worktree add -b feat/ticket-NNN-slug ../squad-battler-worktrees/ticket-NNN-slug origin/main
cd ../squad-battler-worktrees/ticket-NNN-slug
# ...implement + tests + bookkeeping, run /eval, one commit...
# integrate linearly:
git fetch origin && git rebase origin/main      # re-run /eval if it pulled changes
git checkout main && git merge --ff-only feat/ticket-NNN-slug && git push origin main
git worktree remove ../squad-battler-worktrees/ticket-NNN-slug   # cleanup
```

`scripts/worktree-agent.sh` is a separate tool for **manually launching a parallel
headless agent** in a worktree (it opens a draft PR; not the in-session merge-to-main
flow above). See `scripts/worktree-agent.sh --help`.

---

## Scheduled Routines

Created via the `/schedule` skill (cloud cron). See `meta/PIPELINE.md` for cadence.

**dev-tick** (e.g. daily): fires `/dev-tick` — one bounded unit of work per fire.

**Refactor session** (weekly):
- Review recent commits for drift, duplication, shortcuts
- Clean up without changing observable behavior; gate with `/eval`
- Note summary in the merge commit message

**Doc-sync session** (after every ~5 shipped features, surfaced by `/dev-tick`'s
derived cadence check — see `meta/TRACKER.md`):
- Read current codebase
- Update `docs/DESIGN_FRAMEWORK.md` + `docs/SYSTEMS.md` to reflect what shipped
- Confirm `Verified` tickets are closed (the archive is the closed-issue set)
- Note summary in the merge commit message

---

*See `docs/DESIGN_FRAMEWORK.md` for game design decisions and idea evaluation.*
*See `meta/PIPELINE.md` for full pipeline / loop documentation.*
