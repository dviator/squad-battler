# Squad Battler

**Live:** https://squad-battler-five.vercel.app

A genetic roguelike auto-battler. Players escape a corporate science lab by breeding creatures across runs, combining genetics and mutations with roguelike progression.

The game is currently a CLI simulation engine. A web frontend is the next major milestone.

**Tech stack:** Bun · TypeScript (strict) · Vitest + fast-check · Biome · Zod

---

## Game Design

- [`docs/DESIGN_FRAMEWORK.md`](docs/DESIGN_FRAMEWORK.md) — core design decisions and idea evaluation criteria
- [`docs/VISION.md`](docs/VISION.md) — high-level game vision
- [`docs/SYSTEMS.md`](docs/SYSTEMS.md) — overview of all game systems
- [`docs/systems/`](docs/systems/) — deep dives: combat, genetics, economy, meta-progression, world progression
- [`docs/IMPLEMENTATION-ROADMAP.md`](docs/IMPLEMENTATION-ROADMAP.md) — what's built and what's next
- [`backlog/`](backlog/) — live pipeline: ideas → designs → tickets → archive

---

## Dev Workflow

```bash
bun install           # install dependencies
bun run test          # run all tests
bun run test:watch    # watch mode
bun run test:sim      # battle simulations (validate balance)
bun run typecheck     # TypeScript strict check
bun run lint          # Biome lint + format check
bun run lint:fix      # Biome auto-fix
bun run dev           # run main entry point
```

Tests must pass before every commit (enforced by pre-commit hook). Merge directly to main — no PRs.

```bash
bun run test:balance  # balance sim sanity gate (part of /eval)
```

### Parallel feature work

```bash
./scripts/worktree-agent.sh feat/feature-name "Description of feature"
```

Each agent runs in an isolated git worktree. See `./scripts/worktree-agent.sh --help`.

## Autonomous development pipeline

This repo builds the game through an autonomous loop driven by local files, git,
skills, and scheduled cloud routines:

```
idea → design → ticket → code → ship → playtest-verify → archive
```

- Skills (`/dev-tick`, `/refine-idea`, `/decompose-design`, `/implement-ticket`, `/eval`, `/capture-feedback`) run each stage.
- Work and memory live in [`backlog/`](backlog/) and [`meta/`](meta/).
- Review queue: [`meta/INBOX.md`](meta/INBOX.md). Steering: [`meta/policies.md`](meta/policies.md).

See [`meta/PIPELINE.md`](meta/PIPELINE.md) for the full pipeline documentation.

---

## Discord

The development pipeline is driven by Discord:

| Channel | Purpose |
|---|---|
| `#design` | Post game ideas — Claude refines them into design docs |
| `#playtest` | Playtest feedback and bug reports |
| `#architecture` | Architecture notes and refactor tasks |
| `#build` | Pipeline status updates (design committed, impl started, merged) |

---

## License

MIT
