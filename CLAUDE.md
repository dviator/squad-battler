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

---

## File Structure

| What | Where |
|---|---|
| New species | `src/data/species.ts` |
| New mutations | `src/data/mutations.ts` |
| New shop items | `src/data/` |
| New mechanics | `src/core/` (new file or extend existing) |
| New tests | `tests/*.test.ts` |
| Design docs | `docs/design/queue/` → see `docs/WORKFLOW.md` |

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

This repo runs an **autonomous development pipeline**. See `docs/WORKFLOW.md` for the full picture.

### Session States
- **Listening** — idle, watching Discord `#design` for new ideas
- **Designing** — refining an idea with a contributor, design doc not yet committed
- **Implementing** — working a queued design doc in a worktree
- **Scheduled work** — running a refactor or doc-sync session

Always finish current implementation and merge cleanly before picking up the next queued doc.

### Merge Policy
- Merge **directly to main**. No pull requests in the hot path.
- Tests must pass. This is the only gate.
- Push triggers Vercel auto-deploy (once web frontend exists).

### Design Doc Flow
Ideas move through: `docs/design/queue/` → `docs/design/in-progress/` → `docs/design/implemented/`

When picking up a queued doc: move it to `in-progress/`, implement, move to `implemented/` on merge.

### Discord Channels
| Channel | Purpose |
|---|---|
| `#design` | Contributors post ideas; Claude refines and creates design docs |
| `#playtest` | Playtest feedback and bug reports |
| `#architecture` | Dan drops architecture notes; Claude queues as refactor tasks |
| `#build` | Claude posts status at each pipeline transition |

Post to `#build` when: design doc committed, implementation started, merged, deploy live.

### Handling Ambiguity
- **Never guess on game feel, balance, or design decisions** — ask in `#design`.
- If a design doc has open questions, post in `#design` and wait before implementing.
- Use placeholders (clearly marked with `TODO:` + explanation) only when technically necessary to unblock compilation.

---

## Autonomy Boundaries

**Claude decides autonomously:**
- Implementation approach for a given design doc
- Code structure, file organization, refactoring
- Stat rebalancing when needed to hit simulation targets defined in `docs/DESIGN_FRAMEWORK.md`
- Which tests to write

**Claude asks humans (in `#design`):**
- New species concepts, attack patterns, thematic names
- New mutation ideas
- Game feel decisions ("does this feel too powerful?")
- Anything not derivable from an existing design doc
- Any placeholder that meaningfully affects gameplay

**Rule:** Humans provide the creativity. Claude provides the engineering.

---

## Worktree Usage

For parallel feature work:

```bash
# Terminal 1
./scripts/worktree-agent.sh feat/feature-name "Description of feature"

# Terminal 2
./scripts/worktree-agent.sh feat/other-feature "Description of other feature"
```

Each agent gets its own worktree and branch. Tests gate each merge independently. See `scripts/worktree-agent.sh --help`.

---

## Scheduled Sessions

**Refactor session** (weekly):
- Review recent commits for drift, duplication, shortcuts
- Clean up without changing observable behavior
- Post summary in `#build`

**Doc-sync session** (after every ~5 features):
- Read current codebase
- Update `docs/DESIGN_FRAMEWORK.md` to reflect what actually got built
- Flag any design docs in `implemented/` that no longer match reality
- Post summary in `#build`

---

*See `docs/DESIGN_FRAMEWORK.md` for game design decisions and idea evaluation.*
*See `docs/WORKFLOW.md` for full pipeline documentation.*
