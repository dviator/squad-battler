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
| Ideas / designs / tickets | `backlog/` → see `meta/PIPELINE.md` |

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

This repo runs an **autonomous development pipeline** operated through local files,
git, skills, and scheduled cloud routines. Full details in `meta/PIPELINE.md`.

### The loop

```
idea → design → ticket → code → ship → playtest-verify → archive
```

Each stage is a skill. A scheduled heartbeat (`/dev-tick`) selects the single
highest-value actionable item from the backlog and advances it **one stage per
fire**, then stops — this bounds usage per run and keeps progress legible.

| Stage skill | Does |
|---|---|
| `/dev-tick` | Heartbeat: reads memory, selects one unit, dispatches the right stage, writes memory back |
| `/refine-idea` | idea → `ready` design (or `needs-input`) |
| `/decompose-design` | `ready` design → atomic, session-sized `todo` tickets |
| `/implement-ticket` | ticket → code+tests → `/eval` → clean commit → merge → `shipped` |
| `/eval` | verification gate: `typecheck` + `test` + `test:balance` |
| `/capture-feedback` | feedback → curated corpus; playtest feedback verifies/reopens its ticket |

### Corpus (where work and memory live)

| Path | Role |
|---|---|
| `backlog/ideas/` | Lightweight scratchpad of unrefined thoughts (no status) |
| `backlog/designs/` | Design docs (`draft`/`needs-input`/`ready`/`decomposed`) |
| `backlog/tickets/` | Atomic tickets (`todo`/`in-progress`/`blocked`/`shipped`/`verified`/`reverted`) |
| `backlog/archive/` | `verified` tickets + done designs, moved out of the active set |
| `backlog/BACKLOG.md` | Generated prioritized index the heartbeat reads |
| `meta/STATE.md` | Loop memory: in-flight unit, feature count, tick log |
| `meta/INBOX.md` | Your review queue (`[SHIPPED]`/`[NEEDS-INPUT]`) |
| `meta/policies.md` | Distilled steering lessons (always loaded) |
| `meta/feedback/` | Curated feedback corpus, frontmatter-tagged |

Context retrieval: `scripts/meta-context.sh "<query>"` (qmd primary, grep/rg
fallback). See `meta/qmd-setup.md`.

### Merge & release policy
- **Work on a feature branch, never directly on `main`** (local: in a `git
  worktree`; cloud: a branch in the ephemeral clone). `/eval` on the branch, then
  `rebase origin/main` → `merge --ff-only` → push. The merge to main is the single
  integration gate for concurrent writers. No PRs in the hot path. Full recipe:
  "Branch & worktree workflow" in `meta/PIPELINE.md`.
- One ticket = one clean commit with the structured message in `meta/PIPELINE.md`.
- Fix-forward. `/eval` before every push is the integration gate, so a hard
  failure shouldn't reach `main`; if one ever slips through, revert that commit
  manually. Your feedback steers, never approval-gates.
- A ticket is **`shipped`, not done, at merge** — it stays live through a playtest
  verification window, then becomes `verified` and archivable.

### Notifications
- Everything you need to review lands in `meta/INBOX.md`.
- `PushNotification` fires only for `[NEEDS-INPUT]` (a blocked decision) — never
  for routine ships.

### Handling Ambiguity
- **Never guess on game feel, balance, or design decisions.** Write the design as
  `needs-input`, fill its Open Questions, post `[NEEDS-INPUT]` to `meta/INBOX.md`,
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

**Claude asks the user (via `[NEEDS-INPUT]` in `meta/INBOX.md` + push):**
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
- Note summary in `meta/STATE.md`

**Doc-sync session** (after every ~5 shipped features, surfaced by `/dev-tick`):
- Read current codebase
- Update `docs/DESIGN_FRAMEWORK.md` + `docs/SYSTEMS.md` to reflect what shipped
- Run the archive sweep: move `verified` items to `backlog/archive/`
- Note summary in `meta/STATE.md`

---

*See `docs/DESIGN_FRAMEWORK.md` for game design decisions and idea evaluation.*
*See `meta/PIPELINE.md` for full pipeline / loop documentation.*
